changeInputHTML("model");// initializing call to visualize standard input on site load
displayAmountSlider(0);

/**
 * Calls createFileUpload function to create a html file upload form and add other IO depending on the parameter "choice"
 * @param {String} choice "model"(for users with trained models) or "data"(for users with only training data), depending on the input that needs to visualized
 * @param {Integer} status (0 or 1), 0 if the Container doesnt exist, 1 for the rest
 */

function changeInputHTML(choice){

    if(choice=="model"){
        changeFileUpload("ihr bereits trainiertes Klassifizierungsmodell als .rds- oder .rdata-File", ".rds", ".rdata");
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