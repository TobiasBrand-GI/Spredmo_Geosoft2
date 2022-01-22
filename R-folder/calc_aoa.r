
# load always
library(raster)
library(caret)
library(sf)
library(CAST)
library(sp)
#additional required packages:
library(latticeExtra)
library(foreach)
library(iterators)
library(doParallel)
library(parallel)
# library(Orcs)
library(ggplot2)
library(lattice)
library(viridisLite)
library(viridis)
library(randomForest)
library(gdalcubes)


start_time <- Sys.time()
message("start processing")

#####
### load shape as gpkg and transform crs
library(sf)
warning("!!! check path !!!")
input_shape <- read_sf('C:/Users/49157/Documents/GitHub/Spredmo_Geosoft2/R-folder/tests/umriss_muenster.gpkg')
# input_shape <- read_sf('C:/Users/49157/Documents/FS_5_WiSe_21-22/M_Geosoft_2/geodata_tests/input_test_mit_thomas_1.gpkg')
st_crs(input_shape)
input_shape_32631 <- st_transform(input_shape, crs="EPSG:32631")     #  "EPSG:4236")
# st_crs(input_shape_32632)
message("DONE: st_transform() for '<input_shape>.gpkg' ")

#####
### visualisation in RStudio
# plot(input_shape_32632)
# library(mapview)
# mapview(input_shape_32632)

#####
### prepair bbox
bbox <- st_bbox(input_shape_32631)
st_as_sfc(bbox) %>%
  st_transform("EPSG:4326") %>%
  st_bbox() -> bbox_wgs84
#bbox_wgs84
message("DONE: st_as_sfc() for bbox")

#####
### stac-request
library(rstac)
s = stac("https://earth-search.aws.element84.com/v0")
items = s %>%
  stac_search(collections = "sentinel-s2-l2a-cogs",
              bbox = c(bbox_wgs84["xmin"],bbox_wgs84["ymin"],
                       bbox_wgs84["xmax"],bbox_wgs84["ymax"]),
              datetime = "2018-06-01/2018-06-30",
              limit = 500) %>%
  post_request() 
# items
message("DONE: stac_search()")

#####
### explor results
# names(items$features[[10]])
# items$features[[10]]$assets$SCL
# items$features[[10]]$properties$`eo:cloud_cover`
targetSystem <- toString(items$features[[1]]$properties$`proj:epsg`)
targetString <- paste('EPSG:',targetSystem)




#####
### Creating an image collection with a filter
library(gdalcubes)
# reference for meaning of bands: https://gdal.org/drivers/raster/sentinel2.html
assets <- c("B02","B03","B04","B08","B06","B07","B8A","B11","B12","SCL")
  #c("B01","B02","B03","B04","B05","B06","B07","B08","B8A","B09","B11","B12","SCL")
s2_collection = stac_image_collection(items$features, 
                                      asset_names = assets, 
                                      property_filter = function(x) {
                                        x[["eo:cloud_cover"]] < 20})
# s2_collection
message("DONE: stac_image_collection()")

#####
### generate data cube
cube_view_input_shape <- cube_view(srs = targetString,   # "EPSG:4326",
                                   dx = 400, #20,
                                   dy = 400, #20,
                                   dt = "P30D",
                                   aggregation = "median",
                                   resampling = "average",
                                   extent = list(t0 = "2018-06-01",
                                                 t1 = "2018-06-30",
                                                 left = bbox["xmin"]-1000, 
                                                 right = bbox["xmax"]+1000,
                                                 top = bbox["ymax"] + 1000, 
                                                 bottom = bbox["ymin"]-1000))
# cube_view_input_shape
message("DONE: cube_view()")

#####
### mask for clouds and their shadows
s2_mask <- image_mask("SCL", values = c(3,8,9))
message("DONE: image_mask()")

#####
### set threads / logische Prozessoren 
library(magrittr)
gdalcubes_options(threads = 6)
message("DONE: set threads")


#####
### make raster cube
library(dplyr) # needed for '%>%'
message("DO NOT WORRY :)")
if (!is.null(input_shape_32631$geometry)){
  temp <- input_shape_32631$geometry
} else  temp <- input_shape_32631$geom
satelite_cube <- raster_cube(s2_collection, cube_view_input_shape, s2_mask) %>%
  # select bands B, G, R, NIR, SWIR
  #  select_bands(c("B01","B02","B03","B04","B05","B06","B07","B08","B8A","B09","B11","B12","SCL")) %>% 
  # NDVI - Normalized Difference Vegetation Index
  #  apply_pixel("(B08-B04)/(B08+B04)", "NDVI", keep_bands = TRUE) %>% 
  # Bare Soil Index
  #  apply_pixel("(B11+B04)-(B08+B02)/(B11+B04)+(B08+B02)", "BSI", keep_bands = TRUE) %>% 
  # Built-up Area Extraction Index
  #  apply_pixel("(B04 + 0.3)/(B03+B11)", "BAEI", keep_bands = TRUE) %>% 
  filter_geom(temp)
  # plot(rgb = 3:1, zlim=c(0,1500)) %>%        # write_tif() does not work when using plot() here 
  # satelite_cube_4326 <- cube_view(satelite_cube, srs = "EPSG:4326")
message("DONE: raster_cube()")

warning("!!! check path !!!")
message("this saving function takes some time:")

write_tif(satelite_cube,
          dir = "C:/Users/49157/Documents/GitHub/Spredmo_Geosoft2/R-folder",
          prefix = "output_",
          overviews = FALSE,
          COG = TRUE,
          rsmpl_overview = "nearest",
          creation_options = NULL,
          write_json_descr = FALSE,
          pack = NULL)
message("DONE: save as geoTiff")


#####
### Raster data (predictor variables)
warning("!!! check path !!!")
sen_ms <- stack("C:/Users/49157/Documents/GitHub/Spredmo_Geosoft2/R-folder/output_2018-06-01.tif")
# rename bands
names(sen_ms) <- c("B02","B03","B04","B08","B06","B07","B8A","B11","B12","SCL")
# plot(sen_ms)
# plotRGB(sen_ms,stretch="lin",r=3,g=2,b=1)
message("DONE: load as RasterStack")


#####
# TODO:
# should not be possible only for Muenster
# ... for the whole world 
### Reference data
warning("!!! check path !!!")
trainSites <- readRDS("C:/Users/49157/Documents/GitHub/OpenGeoHub_2021/data/data_combined_ll.RDS")
# names(trainSites)
trainDat <- trainSites[trainSites$Region!="Muenster",]
# names(trainDat)
validationDat <- trainSites[trainSites$Region=="Muenster",]
# names(validationDat)
# head(trainSites)
message("DONE: load Referencedata as RDS")

#see unique regions in train set:
unique(trainDat$Region)
message("DONE: delete redudant data")



#####
### prepair training parameters
trainids <- createDataPartition(trainDat$ID,list=FALSE,p=0.15)
# head.matrix(trainids) # trainids is not a list, but matrix
trainDat <- trainDat[trainids,]
trainDat <- trainDat[complete.cases(trainDat),]
### Predictors and response
predictors <- head(names(sen_ms), -1) # without the "SCL"-band 
response <- "Label"
# head.matrix(response)
message("DONE: prepair training parameters")


#####
## Model training and validation
# train the model
ctrl_default <- trainControl(method="cv", number = 3, savePredictions = TRUE)
model <- train(trainDat[,predictors],
               trainDat[,response],
               method="rf",
               metric="Kappa",
               trControl=ctrl_default,
               importance=TRUE,
               ntree=50)
model
message("DONE: train model")


#####
## Model prediction
prediction <- predict(sen_ms,model)
message("DONE: prediction")
writeRaster(prediction, filename = "lulc-prediction.tif")
message("DONE: save prediction.tif")


#####
## Area of Applicability
# needed packages for following code are:
#    foreach, iterators, parallel, doParallel, cast, caret
# The calculation of the AOA is quite time consuming.
# To make a bit faster we use a parallelization.
cl <- makeCluster(4)
registerDoParallel(cl)
AOA <- aoa(sen_ms,model,cl=cl)
# plot(AOA)
message(paste0("Percentage of Muenster that is within the AOA: ",
               round(sum(values(AOA$AOA)==1)/ncell(AOA),2)*100," %"))
message("DONE: AOA culculation")
writeRaster(AOA$AOA, filename = "aoa.tif")
writeRaster(AOA$DI, filename = "di_of_aoa.tif")
message("DONE: save AOA and DI as tif")



###
# TODO: save prediction - for download
# TODO: save AOA - same
# TODO: Vorschlag f�r Samplepoints abspeichern
# TODO: for demontration: processing times less than 20 seconds 
###


#####
### printing processing time
end_time <- Sys.time()
time_differnece <- paste("total processing time: ",
                         round(100000 * (end_time - start_time)) / 100000, 
                         " Minutes")
print(time_differnece)
