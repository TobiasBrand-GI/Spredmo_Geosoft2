#####
### clear r environment
try(rm(list = ls()), message("Done: clear r environment"))

library(raster)
library(sf)
library(rstac)
library(gdalcubes)
library(sp)
library(terra)
library(caret)
library(CAST)
library(geosphere)
library(jsonlite)
library(rgeos)
library(rgdal)
### additional required packages:
library(latticeExtra)
library(foreach)
library(iterators)
library(doParallel)
library(parallel)
library(magrittr)


#####
### see how long it takes...
start_time <- Sys.time()
message("start processing")


#################################################
# function implementation
#################################################


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

    # if (!is.null(input_area$geometry)) {
    #     temp <- input_area$geometry
    # } else  temp <- input_area$geom
    satelite_cube <- raster_cube(input_collection, input_cube_view, input_image_mask)
    # filter_geom(satelite_cube, temp, srs = input_epsg)      # not working until 2022-01-27 - zoom-meeting with Marius Appel
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
            prefix = input_prefix,
            overviews = FALSE,
            COG = TRUE,
            rsmpl_overview = "nearest",
            creation_options = NULL,
            write_json_descr = FALSE,
            pack = NULL)
    message("DONE: save as geoTiff")
}


#####
### Raster data (predictor variables)
load_predictors_and_rename_bands <- function() {
    warning(">>> check path !!!")
    sentinel <- stack("C:/Users/49157/Documents/GitHub/Spredmo_Geosoft2/R-folder/satelite_for_trainingSites__2021-04.tif")
    # rename bands
    names(sentinel) <- c("B02","B03","B04","B08","B06","B07","B8A","B11","B12","SCL")
    message("DONE: load as RasterStack")
    return(sentinel)
}


#####
### Daten kombinieren
combine_sentinel_with_trainingSites <- function(input_predictors_stack, input_trainingSites) {
    spatVector <- terra::vect(input_trainingSites)
    spatRaster <- terra::rast(input_predictors_stack, subds=0, opts=NULL)
    message("DONE: transform to SpatRaster and SpatVector")
    extr <- terra::extract(spatRaster, spatVector)     # function signatur like in terra-package
    # rename bands
    names(extr) <- c("ID","B02","B03","B04","B08","B06","B07","B8A","B11","B12","SCL")
    input_trainingSites$Poly_ID <- 1:nrow(input_trainingSites) 
    extr_sp <- sp::merge(input_trainingSites, extr, all.x=TRUE, by.x="Poly_ID", by.y="ID")
    message("DONE: merge vector and raster")
    saveRDS(extr, file= path_for_combined_data)
    message("DONE: save combined Data as RDS")
    warning(">>> check return :) ...")
    return(extr_sp)
}




#################################################
# function calls
#################################################



#####
### prepair aoi
get_sentinelDat_for_aoi <-function(input_aoi) {
    aoi_bbox_wgs84 <- calculate_bbox(input_aoi, fitting_epsg_as_string)
    # bbox_wgs84
    aoi_sentinelDat <- get_sentinelDat_form_stac(aoi_bbox_wgs84, start_day, end_day)
    # sentinelDat
    input_aoi <- st_transform(input_aoi, crs = fitting_epsg_as_string)
    # use_trainingSites
    image_collection_for_aoi <- create_filtered_image_collection(aoi_sentinelDat, cloud_coverage)
    # image_collection_for_trainingSites
    cube_view_for_aoi <- generate_cube_view(fitting_epsg_as_string, resolution_x, start_day, end_day, aoi_bbox_wgs84)
    # cube_view_for_trainingSites
    cube_for_aoi <- generate_raster_cube(input_aoi, image_collection_for_aoi, cube_view_for_aoi, image_mask_for_data_cube, fitting_epsg_as_string)
    # cube_for_trainingSites
    # plot(cube_for_trainingSites, zlim=c(0, 1800))
    # save as geotif
    save_data_as_geoTiff(cube_for_aoi, path_for_satelite_for_aoi, prefix_for_geoTiff_for_aoi)
    message("DONE: get_sentinelDat_for_aoi")
}


#####
### function calls in case of no model
get_combined_trainingData <- function(use_trainingSites) {
    bbox_wgs84 <- calculate_bbox(use_trainingSites, fitting_epsg_as_string)
    # bbox_wgs84
    sentinelDat <- get_sentinelDat_form_stac(bbox_wgs84, start_day, end_day)
    # sentinelDat
    use_trainingSites <- st_transform(use_trainingSites, crs = fitting_epsg_as_string)
    # use_trainingSites
    image_collection_for_trainingSites <- create_filtered_image_collection(sentinelDat, cloud_coverage)
    # image_collection_for_trainingSites
    cube_view_for_trainingSites <- generate_cube_view(fitting_epsg_as_string, resolution_x, start_day, end_day, bbox_wgs84)
    # cube_view_for_trainingSites
    cube_for_trainingSites <- generate_raster_cube(use_trainingSites, image_collection_for_trainingSites, cube_view_for_trainingSites, image_mask_for_data_cube, fitting_epsg_as_string)
    
    # save as geotif
    save_data_as_geoTiff(cube_for_trainingSites, path_for_satelite_for_trainingSites, prefix_for_geoTiff_for_trainingSites)
    # combine satelite with classified polygones
    predictors_stack <- load_predictors_and_rename_bands()
    trainingDat_sp <- combine_sentinel_with_trainingSites(predictors_stack, use_trainingSites)

    message("DONE: get_combined_trainingData")
    return(trainingDat_sp)
}




#################################################
#################################################
# training, prediction, aoa, sample_points
#################################################
#################################################




#####
### get stack with sentinel for aoi
get_raster_stack <- function(){
  ### prepair raster stack
  file_end <- substr(start_day,1, nchar(start_day)-3)
  file_path <- paste(path_for_satelite_for_aoi, "/", prefix_for_geoTiff_for_aoi, file_end, ".tif", sep="")
  out_sentinell_aoi <- stack(file_path)
  names(out_sentinell_aoi) <- c("B02","B03","B04","B08","B06","B07","B8A","B11","B12","SCL") # rename bands
  message("DONE: rename bands of raster stack")
  # filter geometry of aoi in raster stack
  seq_for_loop <- 1:length(names(out_sentinell_aoi)) # with the last band, it's SCL
  for (i in seq_for_loop) {
    # print(paste("band iteration ", i))
    out_sentinell_aoi[[i]] <- mask(out_sentinell_aoi[[i]], aoi)
  }
  message("DONE: filter geometry of aoi")
  message("DONE: get_raster_stack")
  return(out_sentinell_aoi)
}


#####
### generate own model
generate_own_model <- function(input_sentinell_aoi, input_com_trainingData){
  ### Reference data
  trainDat <- input_com_trainingData
  trainDat <- st_set_geometry(trainDat, NULL)
  trainids <- createDataPartition(input_com_trainingData$id,list=FALSE,p=0.15)
  # head.matrix(trainids) # trainids is not a list, but matrix
  trainDat <- trainDat[trainids,]
  trainDat <- trainDat[complete.cases(trainDat),]
  #####
  ### Predictors and response
  predictors <- head(names(input_sentinell_aoi), -1) # without the "SCL"-band 
  # response <- response_for_lulc # "Label" # or "Landnutzungsklasse"  ?

  print(names(trainDat[3]))
  
  
  #####
  ## Model training and validation
  # train the model
  ctrl_default <- trainControl(method="cv", number = 3, savePredictions = TRUE)
  model <- train(trainDat[,predictors],
                 trainDat$Landnutzungsklasse, # trainDat[trainDat[3]], # trainDat$Class, # instead of response
                 method="rf",
                 metric="Kappa",
                 trControl=ctrl_default,
                 importance=TRUE,
                 ntree=50)
  model
  return(model)
  message("DONE: generate_own_model")
}


#####
### prediction_and_aoa
prediction_and_aoa <- function(input_model, input_sentinell_aoi) {
  #####
  ## Model prediction
  prediction <- predict(input_sentinell_aoi, input_model)
  message("DONE: prediction")
  

  #####
  ## Area of Applicability
  # needed packages for following code are:
  #    foreach, iterators, parallel, doParallel, cast, caret
  # The calculation of the AOA is quite time consuming.
  # To make a bit faster we use a parallelization.
  cl <- makeCluster(4)
  registerDoParallel(cl)
  AOA <- aoa(input_sentinell_aoi, input_model, cl=cl)
  # message(paste0("Percentage of Muenster that is within the AOA: ",
  #                round(sum(values(AOA$AOA)==1)/ncell(AOA),2)*100," %"))
  message("DONE: aoa")

  #####
  ### savings for output
  saveRDS(input_model, "C:/Users/49157/Documents/GitHub/Spredmo_Geosoft2/R-folder/result_files/final_model.RDS")
  writeRaster(prediction, filename = "C:/Users/49157/Documents/GitHub/Spredmo_Geosoft2/R-folder/result_files/lulc-prediction.tif", overwrite=TRUE)
  writeRaster(AOA$DI, filename = "C:/Users/49157/Documents/GitHub/Spredmo_Geosoft2/R-folder/result_files/di_of_aoa.tif", overwrite=TRUE)
  writeRaster(AOA$AOA, filename = "C:/Users/49157/Documents/GitHub/Spredmo_Geosoft2/R-folder/result_files/aoa.tif", overwrite=TRUE)
  message("DONE: save_outputs: model, prediction and AOA")
  
  
  #####
  # calculate_random_points(aoi, AOA_UTM)
  sample_points <- calculate_random_points(aoi, AOA$AOA)
  message("DONE: return sample points")
  return(sample_points)
}




#################################################
#################################################
# calculate_random_points
#################################################
#################################################




calculate_random_points <- function(Areaofinterest, AOA) {
  #json to bbox
  bbox <- st_bbox(Areaofinterest)
  AOI_Polygon<-bbox2SP(n =bbox$ymax, s =bbox$ymin, w = bbox$xmin, e =bbox$xmax ,
                       proj4string = CRS("+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs"))

  ##AOA_raster in Polygon umwandeln
  AOA_Polygon <-rasterToPolygons(AOA, fun=function(x){x==1}, n=4, na.rm=TRUE, digits=12, dissolve=FALSE) ## passt
  ##AOA von AOI abziehen
  clipped <- AOI_Polygon - AOA_Polygon  
  
  ##Anzahl an Punkten skalierend zur Groessee der AOI
  get_area_clipped<-areaPolygon(clipped) 
  quantity_points<-get_area_clipped*0.00001
  
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
}




#################################################
# final calls
#################################################




without_model_but_trainingSites <- function () {
  # createing and savnig trainData 
  get_sentinelDat_for_aoi(aoi) # no return - just save result as GeoTiff
  # if no model input own training data gets generated
  combined_trainingData <- get_combined_trainingData(trainingSites)
  # get sentinell for aoi
  sentinell_aoi <- get_raster_stack()
  # create own model
  own_model <- generate_own_model(sentinell_aoi, combined_trainingData)
  # prediction and aoa
  suggested_sample_points <- prediction_and_aoa(own_model, sentinell_aoi) # no return
  message("DONE: without_model_but_trainingSites")
  return(suggested_sample_points)
}


with_extern_model <- function (extern_input_model) {
  # createing and savnig trainData 
  get_sentinelDat_for_aoi(aoi) # no return - just save result as GeoTiff
  # get sentinell for aoi
  sentinell_aoi <- get_raster_stack() 
  # prediction and aoa
  suggested_sample_points <- prediction_and_aoa(extern_input_model, sentinell_aoi) # no return
  message("DONE: with_extern_model")
  return(suggested_sample_points)
}





#################################################
#################################################
# PLUMBER
#################################################
#################################################



#####
### make space for new results
try(unlink("C:/Users/49157/Documents/GitHub/Spredmo_Geosoft2/R-folder/result_files", recursive = TRUE))



#################################################
# parameter declaration
#################################################


#####
### parameters from plumber APIs:
aoi <- read_sf("C:/Users/49157/Documents/GitHub/Spredmo_Geosoft2/R-folder/tests/test_aoi_weissenfels.geojson")
resolution_x <- 100 #300    # resolution_y <- "auto" derived by _x
start_day <- "2021-04-01"
end_day <- "2021-04-30"
cloud_coverage <- 60
# response_for_lulc <- "Landnutzungsklasse" # oder: "Label"

# fix and final
fitting_epsg_as_string <- paste('EPSG:4326')

# thinks for trainingSites
path_for_satelite_for_trainingSites = "C:/Users/49157/Documents/GitHub/Spredmo_Geosoft2/R-folder/result_files"
prefix_for_geoTiff_for_trainingSites = "satelite_for_trainingSites__"

# thinks for aoi
path_for_satelite_for_aoi = path_for_satelite_for_trainingSites
prefix_for_geoTiff_for_aoi = "satelite_for_aoi__"

# storage place for combined data
path_for_combined_data <- "C:/Users/49157/Documents/GitHub/Spredmo_Geosoft2/R-folder/result_files/merged_trainData.RDS"
repaired_trainingDat <- readRDS("C:/Users/49157/Documents/GitHub/Spredmo_Geosoft2/R-folder/result_files/merged_trainData.RDS")

# this functions are always needed:
image_mask_for_data_cube <- set_image_mask_for_data_cube()
set_threads()




#################################################
# final functions called by plumber
#################################################



# if extern model
extern_model <- readRDS("C:/Users/49157/Documents/GitHub/Spredmo_Geosoft2/R-folder/tests/test_final_model.RDS")
suggested_sample_points_for_plumber <- with_extern_model(extern_model)

# if no model but training sites
trainingSites <- read_sf("C:/Users/49157/Documents/GitHub/Spredmo_Geosoft2/R-folder/tests/test_Gustav_trainingSites.geojson")
suggested_sample_points_for_plumber <- without_model_but_trainingSites() # no input

# last saving for Samplepoint_coordinates_as_Json
write(suggested_sample_points_for_plumber, "C:/Users/49157/Documents/GitHub/Spredmo_Geosoft2/R-folder/result_files/suggested_sample_points.json")
message("DONE: save sample points as json :)")



#################################################
#################################################
# end of process
#################################################
#################################################



#####
### printing processing time
end_time <- Sys.time()
time_differnece <- paste("total processing time: ",
                         round(100000 * (end_time - start_time)) / 100000, 
                         " Minutes")
print(time_differnece)


