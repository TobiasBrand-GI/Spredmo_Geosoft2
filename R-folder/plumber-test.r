rm(list=ls())
library(sp)
library(raster)
library(sf)
library(rstac)
library(gdalcubes)
# library(rjson)



#####
### if trained modell
test_with_trained_model <- function(in_model, in_resolution_x, in_resolution_y, in_start_day, in_end_day, in_cloud_coverage) {
    message("trained model")
    print(names(in_model)) 
    print(in_resolution_x)
    print(in_resolution_y)
    print(in_start_day)
    print(in_end_day)
    print(in_cloud_coverage)
}

#####
### if trainingSites
test_with_trainingSites <- function(in_trainingSites, in_resolution_x, in_resolution_y, in_start_day, in_end_day, in_cloud_coverage, in_path_for_satelite_for_trainingSites) {
    message("trainingSites")
    print(names(in_trainingSites)) 
    print(in_resolution_x)
    print(in_resolution_y)
    print(in_start_day)
    print(in_end_day)
    print(in_cloud_coverage)
    print(in_path_for_satelite_for_trainingSites)
}


#####
### parameters from plumber APIs:
trainingSites <- read_sf("C:/Users/49157/Documents/GitHub/Spredmo_Geosoft2/R-folder/tests/test_training_polygons.geojson")
model <- c("RDS", "Datei", "sollte", "hier", "sein") # <- readRDS("../trainDat.RDS")
resolution_x <- 200
resolution_y <- 200
start_day <- "2021-04-01"
end_day <- "2021-04-30"
cloud_coverage <- 80
path_for_satelite_for_trainingSites = "C:/Users/49157/Documents/GitHub/Spredmo_Geosoft2/R-folder"


#####
### function calls
# if(case == trained_model)
test_with_trained_model(model, resolution_x, resolution_y, start_day, end_day, cloud_coverage)
# if(case == trainingSites)
test_with_trainingSites(trainingSites, resolution_x, resolution_y, start_day, end_day, cloud_coverage, path_for_satelite_for_trainingSites)


#####
### outputs for plumber
aoa_path <- "C:/Users/49157/Documents/GitHub/Spredmo_Geosoft2/R-folder/tests/result_aoa.tif" # load with stack()
di_of_aoa_path <- "C:/Users/49157/Documents/GitHub/Spredmo_Geosoft2/R-folder/tests/result_di_of_aoa.tif" # load with stack()
lulc_prediction_path <- "C:/Users/49157/Documents/GitHub/Spredmo_Geosoft2/R-folder/tests/result_lulc_prediction.tif" # load with stack()
sample_points_path <- "C:/Users/49157/Documents/GitHub/Spredmo_Geosoft2/R-folder/tests/result_sample_points.json" # load with fromJSON()
trained_model_path <- "<path_string>"



