library(plumber)


#* @apiTitle Plumber Example API

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
