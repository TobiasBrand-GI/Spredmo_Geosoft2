install.packages("sf")
library(sf)
nl_shape = st_read("NL.gpkg")
library(tmap)
tmap_mode("view")

library(rstac)
install.packages("rstac")

s = stac("https://earth-search.aws.element84.com/v0")

items = s %>%
  stac_search(collections = "sentinel-s2-l2a-cogs",
              bbox = c(bbox_wgs84["xmin"],bbox_wgs84["ymin"],
                       bbox_wgs84["xmax"],bbox_wgs84["ymax"]), 
              datetime = "2018-06-01/2018-06-30",
              limit = 500) %>%
  post_request() 
item
