changeInputHTML("model", 0);// initializing call to visualize standard input on site load
displayAmountSlider(0);

/**
 * This method calls createFileUpload function to create a html file upload form and add other IO depending on the parameter "choice"
 * @param {String} choice "model"(for users with trained models) or "data"(for users with only training data), depending on the input that needs to visualized
 * @param {Integer} status (0 or 1), 0 if the Container doesnt exist, 1 for the rest
 */
function changeInputHTML(choice, status){
    let div=document.getElementById("modelInDiv");
    if(status==1){
        div.innerHTML="";
    }
    if(choice=="model"){
        createFileUpload("ihr bereits trainiertes Klassifizierungsmodell als .rds- oder .rdata-File", ".rds", ".rdata");
    }
    else if(choice=="data"){
        createFileUpload("ihre Trainingsdaten als GeoJSON oder Geopackage", ".geojson", ".gpkg");
    }
}

/**
 * Creates a html file upload input with the placeholder inherrited via parameter
 * @param {String} placeholder text that will be shown in the upload field
 * @param {*} maindiv html div-container to append the file upload on
 */
function createFileUpload(placeholder, type1, type2){
    let f= document.getElementById("modelFile")
    f.setAttribute("accept", type1+","+type2)

    let h=document.getElementById("fileHeader")
    h.innerHTML="Fügen Sie hier "+placeholder+" ein";

}
function displayAmountSlider(status){
  if(status==0){
    document.getElementById("amount").innerHTML="60 %"
  }else{
    document.getElementById("amount").innerHTML=(document.getElementById("myRange").value*10)+" %";
  }
}

async function loadFile(files){
  window.URL = window.URL || window.webkitURL;
  if (!files.length) {
    alert("No file selected");
  } else {
    try{
      //let blob = await fetch(window.URL.createObjectURL(files[0])).then(r => r.blob());
      console.log(window.URL.createObjectURL(files[0]))
      document.getElementById("blobSaver").value=window.URL.createObjectURL(files[0]);
    }catch(e){
      console.log(e)
    }
    
  }
}