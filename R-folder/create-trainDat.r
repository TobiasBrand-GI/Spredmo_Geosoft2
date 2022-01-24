rm(list=ls())
library(raster)
library(sf)
library(rstac)
library(gdalcubes)


# sentinel <- stack("predictors/predictors_muenster.grd")
#Falls nicht im gleichen crs, dann projizieren!!
# trainingSites <- st_transform(trainingSites,crs(sentinel))


#####
### get right crs
find_right_crs <- function(input_area) {
  longitude <- st_bbox(input_area)[1]
  utm_zone <- (floor((longitude + 180)/6) %% 60) + 1
  targetString <- paste('EPSG:326',utm_zone, sep = "")
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
get_sentinelDat_form_stac <- function(input_bbox) {
    s = stac("https://earth-search.aws.element84.com/v0")
    items = s %>%
        stac_search(collections = "sentinel-s2-l2a-cogs",
                    bbox = c(input_bbox["xmin"],input_bbox["ymin"],
                            input_bbox["xmax"],input_bbox["ymax"]),
                    datetime = "2018-06-01/2018-06-30",
                    limit = 500) %>%
        post_request()
    message("DONE: stac_search()")
    return(items)
}


#####
### Creating an image collection with a filter
# reference for meaning of bands: https://gdal.org/drivers/raster/sentinel2.html
create_filtered_image_collection <- function(input_items) {
    assets <- c("B02","B03","B04","B08","B06","B07","B8A","B11","B12","SCL")
    #c("B01","B02","B03","B04","B05","B06","B07","B08","B8A","B09","B11","B12","SCL")
    s2_collection <- stac_image_collection(input_items$features,
                                    asset_names = assets, 
                                    property_filter = function(x) {
                                        x[["eo:cloud_cover"]] < 20})
    message("DONE: create_image_collection()")
    return(s2_collection)
}


#####
### generate data cube
generate_cube_view <- function(input_epsg_string, in_dx, in_dy, in_t0, in_t1, in_bbox) {
    cube_view_for_data_cube <- cube_view(srs = input_epsg_string,
                                        dx = in_dx, # 200, #20,
                                        dy = in_dy, # 200, #20,
                                        dt = "P30D",
                                        aggregation = "median",
                                        resampling = "average",
                                        extent = list(t0 = in_t0, # "2018-06-01",
                                                    t1 = in_t1, # "2018-06-30",
                                                    left = in_bbox[1]-1000, # xmin
                                                    right = in_bbox[2]+1000, # ymin
                                                    top = in_bbox[3] + 1000, # xmax
                                                    bottom = in_bbox[4]-1000)) # ymax
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
  
  
    library(dplyr) # needed for '%>%'
    message("DO NOT WORRY :)")
    if (!is.null(input_area$geometry)){
        temp <- input_area$geometry
    } else  temp <- input_area$geom
    satelite_cube <- raster_cube(input_collection, input_cube_view, input_image_mask)
    print(satelite_cube)
    filter_geom(satelite_cube, temp) #, srs = input_epsg)
    message("DONE: raster_cube()")
    return(satelite_cube)
}


#####
### save data from data cube as GeoTiff
save_data_as_geoTiff <- function(input_cube, input_storage_path, input_prefix) {
    warning("!!! check path !!!")
    message("this saving function takes some time:")
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
### Daten kombinieren
extr <- extract(sentinel,trainingSites,df=TRUE)
head(extr)
trainingSites$PolyID <- 1:nrow(trainingSites) 
extr <- merge(extr,trainingSites,by.x="ID",by.y="PolyID")
head(extr)
saveRDS(extr,file="trainingsites/trainData.RDS")


#####
### parameters from plumber APIs:
trainingSites <- read_sf('C:/Users/49157/Documents/FS_5_WiSe_21-22/M_Geosoft_2/geodata_tests/input_test_mit_thomas_1.gpkg')
resolution_x <- 200
resolution_y <- 200
start_day <- "2018-06-01"
end_day <- "2018-06-30"
path_for_satelite_for_trainingSites = "C:/Users/49157/Documents/GitHub/Spredmo_Geosoft2/R-folder"


#####
### this function calls are always needed
image_mask_for_data_cube <- set_image_mask_for_data_cube()
set_threads()


#####
### function calls in case of untrained model
fitting_epsg_as_string <- find_right_crs(trainingSites)
bbox_wgs84 <- calculate_bbox(trainingSites, fitting_epsg_as_string)
sentinelDat <- get_sentinelDat_form_stac(bbox_wgs84)
trainingSites <- st_transform(trainingSites, crs=fitting_epsg_as_string)
image_collection_for_trainingSites <- create_filtered_image_collection(sentinelDat)
cube_view_for_trainingSites <- generate_cube_view(fitting_epsg_as_string, resolution_x, resolution_x, start_day, end_day, bbox_wgs84)
cube_for_trainingSites <- generate_raster_cube(trainingSites, image_collection_for_trainingSites, cube_view_for_trainingSites, image_mask_for_data_cube, fitting_epsg_as_string)
prefix_for_geoTiff_for_trainingSites = "satelite_for_trainingSites__"
save_data_as_geoTiff(cube_for_trainingSites, path_for_satelite_for_trainingSites, prefix_for_geoTiff_for_trainingSites)

