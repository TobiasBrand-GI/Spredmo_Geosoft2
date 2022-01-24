rm(list=ls())
library(raster)
library(sf)
library(rstac)


trainingSites <- read_sf('C:/Users/49157/Documents/FS_5_WiSe_21-22/M_Geosoft_2/geodata_tests/input_test_mit_thomas_1.gpkg')
# sentinel <- stack("predictors/predictors_muenster.grd")
#Falls nicht im gleichen crs, dann projizieren!!
# trainingSites <- st_transform(trainingSites,crs(sentinel))

#####
### prepair bbox
calculate_bbox <- function(input_sites) {
    bbox <- st_bbox(input_sites)
    st_as_sfc(bbox) %>%
    st_transform("EPSG:4326") %>%
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
### get right crs

targetSystem <- toString(items$features[[1]]$properties$`proj:epsg`)
targetString <- paste('EPSG:',targetSystem)
input_sites <- st_transform(input_shape, crs=targetString)
message("DONE: get right crs")



















#####
### Daten kombinieren
extr <- extract(sentinel,trainingSites,df=TRUE)
head(extr)
trainingSites$PolyID <- 1:nrow(trainingSites) 
extr <- merge(extr,trainingSites,by.x="ID",by.y="PolyID")
head(extr)
saveRDS(extr,file="trainingsites/trainData.RDS") 



bbox_wgs84 <- calculate_bbox(trainingSites)
sentinelDat <- get_sentinelDat_form_stac(bbox_wgs84)

