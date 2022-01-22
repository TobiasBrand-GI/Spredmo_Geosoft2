library(plumber)


#plumb("plumberapi.R") %>%
#  pr_run(port=8000)

#* @apiTitle Plumber Example API



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


#* post Endpunkt der AOA berrechnung MIT Model 
#* @post /aoamm
#* @preempt cors
function(model, AOI, cloudcover) {
  
}

#* post Endpunkt der AOA berrechnung OHNE Model
#* @post /aoaom
#* @preempt cors
function(trainData, AOI, cloudcover) {
  
}

#* get Endpunkt für die results
#* @param prediction
#* @param AOA
#* @param samplePoints
#* @get /results
#* @preempt cors
function(prediction, AOA, samplePoints) {
  
}

#* Echo back the input
#* @param msg The message to echo
#* @get /echo
#* @preempt cors
function(msg = "") {
  list(
    msg = paste0(
      "The message is: '", msg , "'")
  )
}

