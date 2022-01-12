start_time <- Sys.time()
message("start processing")

#####
### load shape as gpkg and transform crs
library(sf)
warning("!!! check path !!!")
input_shape <- read_sf('C:/Users/.../GitHub/Spredmo_Geosoft2/R-folder/tests/umriss_muenster.gpkg')
# st_crs(input_shape)
input_shape_32632 <- st_transform(input_shape, crs="EPSG:32632")
# st_crs(input_shape_32632)
message("DONE: st_transform() for '<input_shape>.gpkg' ")

#####
### visualisation in RStudio
# plot(input_shape_32632)
# library(mapview)
# mapview(input_shape_32632)

#####
### prepair bbox
bbox <- st_bbox(input_shape_32632)
st_as_sfc(bbox) %>%
  st_transform("EPSG:4326") %>%
  st_bbox() -> bbox_wgs84
bbox_wgs84
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
# items$features[[10]]$assets$B01
# items$features[[10]]$properties$`eo:cloud_cover`

#####
### Creating an image collection with a filter
library(gdalcubes)
# reference for meaning of bands: https://gdal.org/drivers/raster/sentinel2.html
assets = c("B01","B02","B03","B04","B05","B06", "B07","B08","B8A","B09","B11","SCL")
s2_collection = stac_image_collection(items$features, 
                                      asset_names = assets, 
                                      property_filter = function(x) {
                                        x[["eo:cloud_cover"]] < 20})
# s2_collection
message("DONE: stac_image_collection()")

#####
### generate data cube
v.input_shape.overview = cube_view(srs="EPSG:32632",  
                                   dx = 20, 
                                   dy = 20, 
                                   dt = "P30D", 
                                   aggregation = "median", 
                                   resampling = "average",
                                   extent = list(t0 = "2018-06-01", 
                                                 t1 = "2018-06-30",
                                                 left = bbox["xmin"]-1000, 
                                                 right = bbox["xmax"]+1000,
                                                 top = bbox["ymax"] + 1000, 
                                                 bottom = bbox["ymin"]-1000))
# v.input_shape.overview
message("DONE: cube_view()")

#####
### mask for clouds and their shadows
S2.mask = image_mask("SCL", values = c(3,8,9))
message("DONE: image_mask()")

#####
### set threads (logische Prozessoren) 
#library(magrittr)
gdalcubes_options(threads = 6)
message("DONE: set threads")

#####
### make raster cube
library(dplyr) # needed for '%>%'
# TODO: try catch wegen geom/geometry
# im fs package ist evtl eine Methode, um herauszufinden,
# ob das `geom` oder `geometry` heisst
message("DO NOT WORRY :)")
message("this raster cube function takes some time:")
if (names(input_shape_32632) == geometry){
  temp <- input_shape_32632$geometry
} else {
  temp <- input_shape_32632$geom
}

satelite_cube <- raster_cube(s2_collection, v.input_shape.overview, S2.mask) %>%
  select_bands(c("B02", "B03", "B04")) %>%
  filter_geom(temp) %>%
  # plot(rgb = 3:1, zlim=c(0,1500)) #%>% # write_tif() does not work when using plot() here 
  warning("!!! check path !!!")
  write_tif(dir = "C:/Users/.../GitHub/Spredmo_Geosoft2/R-folder",
            prefix = "output_",
            overviews = FALSE,
            COG = TRUE,
            rsmpl_overview = "nearest",
            creation_options = NULL,
            write_json_descr = FALSE,
            pack = NULL)
message("DONE: raster_cube()")
message("DONE: save as geoTiff")

#####
### printing processing time
end_time <- Sys.time()
time_differnece <- paste("total processing time: ", 
                         round(100000*(end_time - start_time))/100000, 
                         " Minutes")
print(time_differnece)
