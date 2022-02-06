#####
### clear r environment
try(rm(list = ls()), message("Done: clear r environment"))


library(sf)
library(raster)
library(terra)
library(rstac)
library(gdalcubes)
library(rgeos)
library(rgdal)

library(sp)
library(caret)
library(CAST)
library(latticeExtra)
library(foreach)
library(iterators)
library(doParallel)
library(parallel)
library(magrittr)
library(geosphere)
library(jsonlite)
library(yaml)
library(randomForest)


library(plumber)

#################################################
# function implementation
#################################################




#####
### get right crs - function not needed any more
# find_right_crs <- function(input_area) {
# longitude <- st_bbox(input_area)[1]
# utm_zone <- (floor((longitude + 180)/6) %% 60) + 1
# targetString <- paste('EPSG:326',utm_zone, sep = "")
# it only works with following EPSG-code
# targetString <- paste('EPSG:4326')
# message("DONE: get right crs")
# return(targetString)
# }


#####
### prepair bbox
calculate_bbox <- function(input_sites, in_epsg) {
  bbox <- st_bbox(input_sites)
  st_as_sfc(bbox) %>%
    st_transform(in_epsg) %>%
    st_bbox() -> bbox_wgs84
  message("DONE: calculate_bbox()")
  return(bbox_wgs84)
}


#####
### stac-request
get_sentinelDat_form_stac <- function(input_bbox, in_t0, in_t1) {
  s = stac("https://earth-search.aws.element84.com/v0")
  items = s %>%
    stac_search(collections = "sentinel-s2-l2a-cogs",
                bbox = c(input_bbox["xmin"],input_bbox["ymin"],
                         input_bbox["xmax"],input_bbox["ymax"]),
                datetime = paste(in_t0, "/", in_t1, sep = ""),
                limit = 500) %>%
    post_request()
  message("DONE: stac_search()")
  return(items)
}


#####
### Creating an image collection with a filter
# reference for meaning of bands: https://gdal.org/drivers/raster/sentinel2.html
create_filtered_image_collection <- function(input_items, intpu_cloud_coverage) {
  assets <- c("B02","B03","B04","B08","B06","B07","B8A","B11","B12","SCL")
  # assets <- c("B01","B02","B03","B04","B05","B06","B07","B08","B8A","B09","B11","B12","SCL")
  s2_collection <- stac_image_collection(input_items$features,
                                         asset_names = assets, 
                                         property_filter = function(x) {
                                           x[["eo:cloud_cover"]] < intpu_cloud_coverage})
  message("DONE: create_image_collection()")
  return(s2_collection)
}


#####
### generate data cube
generate_cube_view <- function(input_epsg_string, in_nx, in_t0, in_t1, in_bbox) {
  cube_view_for_data_cube <- cube_view(srs = input_epsg_string,
                                       dt="P1M", 
                                       nx = in_nx, #250, 
                                       #ny = in_ny, #250, 
                                       aggregation = "mean", 
                                       resampling="near",
                                       keep.asp = TRUE, # derives ny from nx and bbox
                                       extent = list(t0 = in_t0,
                                                     t1 = in_t1,
                                                     left = in_bbox[1]-0.1, # xmin
                                                     right = in_bbox[3]+0.1, # xmax 
                                                     top = in_bbox[4]+0.1, # ymax
                                                     bottom = in_bbox[2]-0.1)) # ymin
  message("DONE: cube_view()")
  return(cube_view_for_data_cube)
}


#####
### mask for clouds and their shadows
set_image_mask_for_data_cube <- function() {
  s2_mask <- image_mask("SCL", values = c(3,8,9))
  message("DONE: set_image_mask_for_data_cube()")
  return(s2_mask)
}


#####
### set threads / logische Prozessoren
set_threads <- function() {
  library(magrittr)
  gdalcubes_options(threads = 16)
  message("DONE: set threads")
}


#####
### make raster cube
generate_raster_cube <- function(input_area, input_collection, input_cube_view, input_image_mask, input_epsg) {
  if (!is.null(input_area$geometry)){
    temp <- input_area$geometry
  } else  temp <- input_area$geom
  satelite_cube <- raster_cube(input_collection, input_cube_view, input_image_mask) 
  message("DONE: raster_cube()")
  return(satelite_cube)
}


#####
### save data from data cube as GeoTiff
save_data_as_geoTiff <- function(input_cube, input_storage_path, input_prefix) {
  warning(">>> check path !!!")
  message("DO NOT WORRY :)")
  message("this function takes some time:")
  write_tif(input_cube,
            dir = input_storage_path,
            prefix = input_prefix, # basename(tempfile(pattern = input_prefix)),
            overviews = FALSE,
            COG = TRUE,
            rsmpl_overview = "nearest",
            creation_options = NULL,
            write_json_descr = FALSE,
            pack = NULL)
  message("DONE: save as geoTiff")
}




#####
### Daten kombinieren
combine_sentinel_with_trainingSites <- function(input_predictors_stack, input_trainingSites, path_for_combined_data) {
  spatVector <- terra::vect(input_trainingSites)
  spatRaster <- terra::rast(input_predictors_stack, subds=0, opts=NULL)
  message("DONE: transform to SpatRaster and SpatVector")
  
  extr <- terra::extract(spatRaster, spatVector)     # function signatur like in terra-package
  # extr <- raster::extract(spatRaster, spatVector, df=TRUE) # extract from raster works only with spatRaster and spatVector
  # rename bands
  names(extr) <- c("ID","B02","B03","B04","B08","B06","B07","B8A","B11","B12","SCL")
  # print(head(extr))
  input_trainingSites$Poly_ID <- 1:nrow(input_trainingSites) 
  # extr_terra <- terra::merge(input_trainingSites, extr) #, by.x="ID", by.y="ID")
  # print(head(extr_terra))
  extr_sp <- sp::merge(input_trainingSites, extr, all.x=TRUE, by.x="Poly_ID", by.y="ID")
  #by = intersect(names(input_trainingSites), names(extr)), by.input_trainingSites = by, by.extr = by)
  # print(head(extr_sp))
  #print(head(extr_raster))
  message("DONE: merge vector and raster")
  saveRDS(extr, file= path_for_combined_data)   #"C:/Users/49157/Documents/GitHub/Spredmo_Geosoft2/R-folder/result_files/merged_trainData.RDS")
  message("DONE: save combined Data as RDS")
  warning(">>> check return :) ...")
  return(extr_sp)
}

calculate_random_points <- function(Areaofinterest, AOA) {
  #json to bbox
  bbox <- st_bbox(Areaofinterest)
  AOI_Polygon<-bbox2SP(n =bbox$ymax, s =bbox$ymin, w = bbox$xmin, e =bbox$xmax ,
                       proj4string = CRS("+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs"))
  
  ##AOA_raster in Polygon umwandeln
  AOA_Polygon <-rasterToPolygons(AOA, fun=function(x){x==1}, n=4, na.rm=TRUE, digits=12, dissolve=FALSE)
  ##AOA von AOI abziehen
  clipped <- AOI_Polygon - AOA_Polygon
  
  check <- AOI_Polygon@polygons[[1]]@area - AOA_Polygon@polygons[[1]]@area
  
  if(check > 0) { 
    
    ##Anzahl an Punkten skalierend zur Groessee der AOI
    get_area_clipped<-areaPolygon(clipped) 
    quantity_points<-get_area_clipped*0.00001
    
    if(quantity_points > 30) {
      quantity_points <- 30
    } 
    ##random suggested points to improve AOA
    pts <- spsample(clipped, quantity_points, type = 'random')
    
    pts1 <- data.frame(x=pts$x,y=pts$y) 
    coordinates(pts1) <- ~x+y
    
    #als Liste ausgeben
    Samplepoint_coordinates_list <-coordinates(pts1)
    ##swap latitude and longitude
    Samplepoint_coordinates_list <- Samplepoint_coordinates_list[,c("y", "x")]
    #Samplepointstojson
    Samplepoint_coordinates_as_Json=toJSON(Samplepoint_coordinates_list,pretty=TRUE,auto_unbox=TRUE)
    message("DONE: calculate_random_points")
    return(Samplepoint_coordinates_as_Json)
    
    
  } else { # AOA deckt komplette AOI ab. Also brauchen wir keine sample_points
    return("keine punkte")
  }
}






# function which is called in case of model provided
start_calc_with_model <- function(body) {
  
  start_time <- Sys.time()
  message("start processing")
  
  
  request_body <- fromJSON(body)
  
  cloud_cover <- as.numeric(request_body$cloud_cover)
  start_day <- request_body$start_day
  end_day <- request_body$end_day
  resolution <- as.numeric(request_body$resolution)
  path_model <- request_body$path_model
  path_aoi <- request_body$path_aoi
  
  
  #set status for samplepoints
  statuspoints <- 1
  
  # read files at paths
  model <- readRDS(path_model)
  aoi <- st_read(path_aoi)
  
  # paths for temporary saving
  
  path_for_satelite_for_aoi = "tmp"
  prefix_for_geoTiff_for_aoi = "satellite_for_aoi_"
  
  
  ##### start calc
  ### this function calls are always needed
  fitting_epsg_as_string <- paste('EPSG:4326') # find_right_crs(use_trainingSites) # function not needed any more
  # fitting_epsg_as_string
  image_mask_for_data_cube <- set_image_mask_for_data_cube()
  set_threads()
  
  
  aoi_bbox_wgs84 <- calculate_bbox(aoi, fitting_epsg_as_string)
  aoi_sentinelDat <- get_sentinelDat_form_stac(aoi_bbox_wgs84, start_day, end_day)
  aoi <- st_transform(aoi, crs = fitting_epsg_as_string)
  image_collection_for_aoi <- create_filtered_image_collection(aoi_sentinelDat, cloud_cover)
  cube_view_for_aoi <- generate_cube_view(fitting_epsg_as_string, resolution, start_day, end_day, aoi_bbox_wgs84)
  cube_for_aoi <- generate_raster_cube(aoi, image_collection_for_aoi, cube_view_for_aoi, image_mask_for_data_cube, fitting_epsg_as_string)
  save_data_as_geoTiff(cube_for_aoi, path_for_satelite_for_aoi, prefix_for_geoTiff_for_aoi)
  
  message("DONE: get_sentinelDat_for_aoi")
  
  file_end <- substr(start_day,1, nchar(start_day)-3)
  file_path_raster_stack <- paste(path_for_satelite_for_aoi,"/",prefix_for_geoTiff_for_aoi,file_end,".tif",sep = "")
  out_sentinell_aoi <- stack(file_path_raster_stack)
  
  names(out_sentinell_aoi) <- c("B02","B03","B04","B08","B06","B07","B8A","B11","B12","SCL") # rename bands
  message("DONE: rename bands of raster stack")
  
  seq_for_loop <- 1:length(names(out_sentinell_aoi)) # with the last band, it's SCL
  for (i in seq_for_loop) {
    print(paste("band iteration ", i))
    out_sentinell_aoi[[i]] <- mask(out_sentinell_aoi[[i]], aoi)
  }
  message("DONE: filter geometry of aoi")
  message("DONE: get_raster_stack")
  
  ## Model prediction
  prediction <- predict(out_sentinell_aoi, model)
  message("DONE: prediction")
  
  cl <- makeCluster(4)
  registerDoParallel(cl)
  AOA <- aoa(out_sentinell_aoi, model, cl=cl)
  message("DONE: aoa")
  
  # get model classes
  classes <- model$levels
  
  saveRDS(model, "tmp/final_model.rds")
  writeRaster(prediction, filename = "tmp/lulc-prediction.tif", overwrite=TRUE)
  writeRaster(AOA$DI, filename = "tmp/di_of_aoa.tif", overwrite=TRUE)
  writeRaster(AOA$AOA, filename = "tmp/aoa.tif", overwrite=TRUE)
  
  message("DONE: save_outputs: model, prediction, aoa")
  
  # sample points
  sample_points <- calculate_random_points(aoi, AOA$AOA)
  if(sample_points == "keine punkte") {
    statuspoints <- 0
    message("INFO: no sample_points were created")
  } else{
    statuspoints <- 1
    write(sample_points, "tmp/sample_points.json") #check if correct
    message("DONE: sample_points were created")
  }
  
  
  
  #write external paths
  modelpath <- "tmpextern/final_model.rds"
  lulcpath <- "tmpextern/lulc-prediction.tif"
  dipath <- "tmpextern/di_of_aoa.tif"
  aoapath <- "tmpextern/aoa.tif"
  samplepointspath <- "tmpextern/sample_points.json"
  
  #####
  ### printing processing time
  end_time <- Sys.time()
  time_difference <- end_time - start_time
  print(time_difference)
  
  
  return(list(
    modelpath,
    lulcpath,
    dipath,
    aoapath,
    samplepointspath,
    status_points,
    paste(classes)
  ))
}



# function which is called in case of training data provided
start_calc_with_tdata <- function(body) {
  
  start_time <- Sys.time()
  message("start processing")
  
  request_body <- fromJSON(body)
  
  cloud_cover <- as.numeric(request_body$cloud_cover)
  start_day <- request_body$start_day
  end_day <- request_body$end_day
  resolution <- as.numeric(request_body$resolution)
  path_tdata <- request_body$path_tdata
  path_aoi <- request_body$path_aoi
  
  #set status for samplepoints
  statuspoints <- 1
  
  # read files at paths
  tdata <- st_read(path_tdata)
  aoi <- st_read(path_aoi)
  
  # paths for temporary saving
  path_for_satelite_for_trainingSites <- "tmp"
  prefix_for_geoTiff_for_trainingSites = "satellite_for_tdata_"
  
  path_for_satelite_for_aoi = path_for_satelite_for_trainingSites 
  prefix_for_geoTiff_for_aoi = "satellite_for_aoi_"
  
  path_for_combined_data <- "tmp/merged_tdata.rds"
  
  ##### start calc
  ### this function calls are always needed
  fitting_epsg_as_string <- paste('EPSG:4326') 
  
  image_mask_for_data_cube <- set_image_mask_for_data_cube()
  set_threads()
  
  aoi_bbox_wgs84 <- calculate_bbox(aoi, fitting_epsg_as_string)
  aoi_sentinelDat <- get_sentinelDat_form_stac(aoi_bbox_wgs84, start_day, end_day)
  aoi <- st_transform(aoi, crs = fitting_epsg_as_string)
  image_collection_for_aoi <- create_filtered_image_collection(aoi_sentinelDat, cloud_cover)
  cube_view_for_aoi <- generate_cube_view(fitting_epsg_as_string, resolution, start_day, end_day, aoi_bbox_wgs84)
  cube_for_aoi <- generate_raster_cube(aoi, image_collection_for_aoi, cube_view_for_aoi, image_mask_for_data_cube, fitting_epsg_as_string)
  save_data_as_geoTiff(cube_for_aoi, path_for_satelite_for_aoi, prefix_for_geoTiff_for_aoi)
  
  file_end <- substr(start_day,1, nchar(start_day)-3)
  file_path_raster_stack <- paste(path_for_satelite_for_aoi,"/",prefix_for_geoTiff_for_aoi,file_end,".tif",sep = "")
  out_sentinell_aoi <- stack(file_path_raster_stack)
  
  names(out_sentinell_aoi) <- c("B02","B03","B04","B08","B06","B07","B8A","B11","B12","SCL") # rename bands
  message("DONE: rename bands of raster stack")
  seq_for_loop <- 1:length(names(out_sentinell_aoi)) # with the last band, it's SCL
  for (i in seq_for_loop) {
    print(paste("band iteration ", i))
    out_sentinell_aoi[[i]] <- mask(out_sentinell_aoi[[i]], aoi)
  }
  message("DONE: filter geometry of aoi")
  message("DONE: get_raster_stack")
  
  sentinell_aoi <- out_sentinell_aoi #input_sentinell_aoi = sentinell_aoi
  
  message("DONE: get_sentinelDat_for_aoi")
  
  
  message("start tdata")
  
  bbox_wgs84 <- calculate_bbox(tdata, fitting_epsg_as_string)
  sentinelDat <- get_sentinelDat_form_stac(bbox_wgs84, start_day, end_day)
  tdata <- st_transform(tdata, crs = fitting_epsg_as_string)
  image_collection_for_trainingSites <- create_filtered_image_collection(sentinelDat, cloud_cover)
  cube_view_for_trainingSites <- generate_cube_view(fitting_epsg_as_string, resolution, start_day, end_day, bbox_wgs84)
  cube_for_trainingSites <- generate_raster_cube(tdata, image_collection_for_trainingSites, cube_view_for_trainingSites, image_mask_for_data_cube, fitting_epsg_as_string)
  
  # save as geotif
  save_data_as_geoTiff(cube_for_trainingSites, path_for_satelite_for_trainingSites, prefix_for_geoTiff_for_trainingSites)
  
  
  # get RasterStack for trainingsites
  file_end_tdata <- substr(start_day,1, nchar(start_day)-3)
  file_path_raster_stack_tdata <- paste(path_for_satelite_for_trainingSites,"/",prefix_for_geoTiff_for_trainingSites,file_end_tdata,".tif",sep = "")
  sentinel <- stack(file_path_raster_stack_tdata)
  # rename bands
  names(sentinel) <- c("B02","B03","B04","B08","B06","B07","B8A","B11","B12","SCL")
  message("DONE: load as RasterStack")
  
  trainingDat_sp <- combine_sentinel_with_trainingSites(sentinel, tdata, path_for_combined_data)
  message("DONE: get_combined_trainingData")
  
  combined_trainingData <- trainingDat_sp
  
  #start generate own model
  trainDat <- combined_trainingData
  trainDat <- st_set_geometry(trainDat, NULL)
  trainids <- createDataPartition(combined_trainingData$id,list=FALSE,p=0.15)
  trainDat <- trainDat[trainids,]
  trainDat <- trainDat[complete.cases(trainDat),]
  predictors <- head(names(sentinell_aoi), -1)
  
  ctrl_default <- trainControl(method="cv", number = 3, savePredictions = TRUE)
  own_model <- train(trainDat[,predictors],
                     trainDat$Landnutzungsklasse, # trainDat[trainDat[3]], # trainDat$Class, # instead of response
                     method="rf",
                     metric="Kappa",
                     trControl=ctrl_default,
                     importance=TRUE,
                     ntree=50)
  
  message("DONE: generate_own_model")
  
  prediction <- predict(sentinell_aoi, own_model)
  message("DONE: prediction")
  
  cl <- makeCluster(4)
  registerDoParallel(cl)
  AOA <- aoa(sentinell_aoi, own_model, cl=cl)
  message("DONE: aoa")
  
  saveRDS(own_model, "tmp/final_model.rds")
  writeRaster(prediction, filename = "tmp/lulc-prediction.tif", overwrite=TRUE)
  writeRaster(AOA$DI, filename = "tmp/di_of_aoa.tif", overwrite=TRUE)
  writeRaster(AOA$AOA, filename = "tmp/aoa.tif", overwrite=TRUE)
  
  message("DONE: save_outputs: model, prediction, aoa")
  
  # sample points
  sample_points <- calculate_random_points(aoi, AOA$AOA)
  if(sample_points == "keine punkte") {
    statuspoints <- 0
    message("INFO: no sample_points were created")
  } else{
    statuspoints <- 1
    write(sample_points, "tmp/sample_points.json") #check if correct
    message("DONE: sample_points were created")
  }
  
  
  
  #write external paths
  modelpath <- "tmpextern/final_model.rds"
  lulcpath <- "tmpextern/lulc-prediction.tif"
  dipath <- "tmpextern/di_of_aoa.tif"
  aoapath <- "tmpextern/aoa.tif"
  samplepointspath <- "tmpextern/sample_points.json"
  
  #####
  ### printing processing time
  end_time <- Sys.time()
  time_difference <- end_time - start_time
  print(time_difference)
  
  
  return(list(
    modelpath,
    lulcpath,
    dipath,
    aoapath,
    samplepointspath,
    status_points,
    paste(classes)
  ))
}

