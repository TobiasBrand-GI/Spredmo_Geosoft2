rm(list=ls())
library(raster)
library(sf)
library(rstac)
library(gdalcubes)
library(sp)

# sentinel <- stack("predictors/predictors_muenster.grd")
#Falls nicht im gleichen crs, dann projizieren!!
# trainingSites <- st_transform(trainingSites,crs(sentinel))


#####
### get right crs
find_right_crs <- function(input_area) {
  #longitude <- st_bbox(input_area)[1]
  #utm_zone <- (floor((longitude + 180)/6) %% 60) + 1
  #targetString <- paste('EPSG:326',utm_zone, sep = "")
  # it only works with following EPSG-code 
  targetString <- paste('EPSG:4326')
  message("DONE: get right crs")
  return(targetString)
}


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
generate_cube_view <- function(input_epsg_string, in_nx, in_ny, in_t0, in_t1, in_bbox) {
    cube_view_for_data_cube <- cube_view(srs = input_epsg_string,
                                         dt="P1M", 
                                         nx = in_nx, #250, 
                                         #ny = in_ny, #250, 
                                         aggregation = "mean", 
                                         resampling="near",
                                         keep.asp = TRUE, # derives ny from nx and bbox
                                         # extent = extent(in_image_collection))
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
  #print(input_area$geometry)
  #print(input_collection)
  #print(input_cube_view$space$srs)
  #print(input_image_mask)
  #print(input_epsg)
    # library(dplyr) # needed for '%>%'
    if (!is.null(input_area$geometry)){
        temp <- input_area$geometry
    } else  temp <- input_area$geom
    satelite_cube <- raster_cube(input_collection, input_cube_view, input_image_mask) #%>%
    # print(satelite_cube)
    # filter_geom(satelite_cube, temp, srs = input_epsg)
    message("DONE: raster_cube()")
    return(satelite_cube)
}


#####
### save data from data cube as GeoTiff
save_data_as_geoTiff <- function(input_cube, input_storage_path, input_prefix) {
    warning("!!! check path !!!")
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
    warning("!!! check path !!!")
    # sen_ms <- stack(paste(input_storage_path, input_prefix))
    sentinel <- stack("C:/Users/49157/Documents/GitHub/Spredmo_Geosoft2/R-folder/satelite_for_trainingSites__2021-04.tif")
    # rename bands
    names(sentinel) <- c("B02","B03","B04","B08","B06","B07","B8A","B11","B12","SCL")
    # plot(sen_ms)
    plotRGB(sentinel,stretch="lin",r=3,g=2,b=1)
    message("DONE: load as RasterStack")
    return(sentinel)
}


#####
### Daten kombinieren
combine_sentinel_with_trainingSites <- function(input_predictors_stack, input_trainingSites) {
    extr <- extract(input_predictors_stack, input_trainingSites, df=TRUE) # extract is from raster-package
    head(extr)
    input_trainingSites$ClassID <- 1:nrow(input_trainingSites) 
    extr <- merge(extr,input_trainingSites,by.x="ID",by.y="ClassID")
    head(extr)
    saveRDS(extr,file="trainingsites/trainData.RDS")
}


#####
### parameters from plumber APIs:
# trainingSites <- read_sf('C:/Users/49157/Documents/FS_5_WiSe_21-22/M_Geosoft_2/geodata_tests/aoi_jena.gpkg') ##input_test_mit_thomas_1.gpkg')
#trainingSites <- read_sf("C:/Users/49157/Documents/GitHub/Spredmo_Geosoft2/R-folder/tests/
trainingSites <- read_sf("C:/Users/49157/Documents/GitHub/Spredmo_Geosoft2/R-folder/tests/input_test_mit_thomas_1.geojson")   #test_training_polygons.geojson")
resolution_x <- 300
# resolution_y <- "auto"
start_day <- "2021-04-01"
end_day <- "2021-04-30"
cloud_coverage <- 80
path_for_satelite_for_trainingSites = "C:/Users/49157/Documents/GitHub/Spredmo_Geosoft2/R-folder"
prefix_for_geoTiff_for_trainingSites = "satelite_for_trainingSites__"


# paste(path_for_satelite_for_trainingSites, prefix_for_geoTiff_for_trainingSites, )


#####
### this function calls are always needed
image_mask_for_data_cube <- set_image_mask_for_data_cube()
set_threads()


#####
### function calls in case of no model
fitting_epsg_as_string <- find_right_crs(trainingSites)
fitting_epsg_as_string
bbox_wgs84 <- calculate_bbox(trainingSites, fitting_epsg_as_string)
# bbox_wgs84
sentinelDat <- get_sentinelDat_form_stac(bbox_wgs84, start_day, end_day)
# sentinelDat
trainingSites <- st_transform(trainingSites, crs=fitting_epsg_as_string)
trainingSites
image_collection_for_trainingSites <- create_filtered_image_collection(sentinelDat, cloud_coverage)
# image_collection_for_trainingSites
cube_view_for_trainingSites <- generate_cube_view(fitting_epsg_as_string, resolution_x, resolution_y, start_day, end_day, bbox_wgs84)
cube_view_for_trainingSites
cube_for_trainingSites <- generate_raster_cube(trainingSites, image_collection_for_trainingSites, cube_view_for_trainingSites, image_mask_for_data_cube, fitting_epsg_as_string)
# cube_for_trainingSites
plot(cube_for_trainingSites, zlim=c(0, 1800))
# save as geotif
save_data_as_geoTiff(cube_for_trainingSites, path_for_satelite_for_trainingSites, prefix_for_geoTiff_for_trainingSites)
# combine satelite with classified polygones
predictors_stack <- load_predictors_and_rename_bands()
trainingDat <- combine_sentinel_with_trainingSites(predictors_stack, trainingSites) # can't test this

