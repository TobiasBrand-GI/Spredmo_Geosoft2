#####
### clear r environment
#try(rm(list = ls()), message("Done: clear r environment"))



#library(sf)
#library(rstac)
#library(gdalcubes)
library(sp)
library(rgdal)
library(Rcpp)
library(raster)
library(terra)
#library(caret)
#library(CAST)

### additional required packages:
#library(latticeExtra)
#library(foreach)
#library(iterators)
#library(doParallel)
#library(parallel)
#library(magrittr)
#library(geosphere)
#library(jsonlite)
#library(rgeos)

library(plumber)



#* @apiTitle Plumber Spredmo API

#* Log some information about the incoming request
#* @filter logger
function(req) {
  cat(as.character(Sys.time()), "-",
      req$REQUEST_METHOD, req$PATH_INFO, "-",
      req$HTTP_USER_AGENT, "@", req$REMOTE_ADDR, "\n")
  
  # Forward the request
  forward()
}


#* @filter cors
cors <- function(req, res) {

  res$setHeader("Access-Control-Allow-Origin", "*")

  if (req$REQUEST_METHOD == "OPTIONS") {
    res$setHeader("Access-Control-Allow-Methods","*")
    res$setHeader("Access-Control-Allow-Headers", req$HTTP_ACCESS_CONTROL_REQUEST_HEADERS)
    res$status <- 200
    return(list())
  } else {
    plumber::forward()
  }
}

#* @filter createtxt
function(req) {
  a <- 3
  saveRDS(a, file = paste0("testtmp/data",Sys.Date()))
  plumber::forward()
}

#* Echo back the input
#* @get /results
#* @preempt cors
function() {
  
  list(
    
    aoa_tif = "path/aoa_tif",
    prediction_tif = "path/prediction_tif",
    sample_points = "path/samplepoints",
    model = "path/model"
    
  )
}


#* Endpunkt der aoa script startet MIT model
#* @post /aoamodel
#* @preempt cors
function(req, res) {
  list(paste0(req$body))
}



#* Endpunkt der aoa script startet OHNE model
#* @post /aoatdata
#* @preempt cors
function(req, res) {
  list(paste0(req$body))
}


