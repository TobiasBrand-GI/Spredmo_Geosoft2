changeInputHTML("model");// initializing call to visualize standard input on site load
displayAmountSlider(0);

/**
 * Calls createFileUpload function to create a html file upload form and add other IO depending on the parameter "choice"
 * @param {String} choice "model"(for users with trained models) or "data"(for users with only training data), depending on the input that needs to visualized
 * @param {Integer} status (0 or 1), 0 if the Container doesnt exist, 1 for the rest
 */

function changeInputHTML(choice){

    if(choice=="model"){
        changeFileUpload("ihr bereits trainiertes Klassifizierungsmodell als .rds-File", ".rds");
    }
    else if(choice=="data"){

        changeFileUpload("ihre Trainingsdaten als GeoJSON oder Geopackage", ".geojson", ".gpkg");

    }
}

/**

 * Changes a html file upload input with the placeholder inherrited via parameter and sets its accepted file formats (MIME types).
 * @param {String} placeholder text that will be shown in the upload field
 * @param {*} maindiv html div-container to append the file upload on
 */
function changeFileUpload(placeholder, type1, type2){
    let f = document.getElementById("modelFile");
    f.setAttribute("accept", type1+","+type2)

    let h=document.getElementById("fileHeader");
    h.innerHTML="Fügen Sie hier "+placeholder+" ein";


}

/**
 * Displays the input of the slider for cloud coverage as percentage.
 * @param {int} status ONLY 0 or 1: {0} = Site start up/ onload set default value, {1} = Display input value according to slider position 
 */
function displayAmountSlider(status){
  if(status==0){
    document.getElementById("amount").innerHTML="60 %"
  }else{
    document.getElementById("amount").innerHTML=(document.getElementById("myRange").value*10)+" %";
  }
}

/**
 * Validate, if the time span input is correct
 */
function validateTimeInput(){
  $('.toast').toast({animation:true, autohide:true, delay:5000})
  let toastBody = document.getElementById("errorText");
  let startDay = new Date(document.getElementById("startDay").value);
  let endDay = new Date(document.getElementById("endDay").value);
  let today = Date.now();
  let minDay = new Date("2016-01-01");
  console.log(startDay, endDay, today, minDay)
  console.log((endDay-startDay))
  // Check if end day was not before start day
  if(startDay!="" && endDay!=""){
    if(startDay>endDay){     
      toastBody.innerHTML="The end day must be more recent than the start day!";
      $('#errorToast').toast('show');
      document.getElementById("action").disabled=true;
    }
    // Check if no date is in the future
    else if(startDay>today || endDay>today){
      toastBody.innerHTML="Chosen dates cannot be in the future!";
      $('#errorToast').toast('show');
      document.getElementById("action").disabled=true;
    }
    // Check if no date is selected before Sentinel 2 existed
    else if(startDay<minDay||endDay<minDay){
      toastBody.innerHTML="Chosen date outside of Sentinel Program time span (earliest: 01.01.2016)!";
      $('#errorToast').toast('show');
      document.getElementById("action").disabled=true;
    }
    // Check for at least 10 Days intervals, so we can assure finding at least 1 picture
    else if(((endDay-startDay)/86400000)<10){
      toastBody.innerHTML="Time span must contain at least 10 days to ensure data collection!";
      $('#errorToast').toast('show');
      document.getElementById("action").disabled=true;
    }
    // Default case if input is correct
    else{
      document.getElementById("action").disabled=false;
    }
  }
}