
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
        createFileUpload("Dieses Modell", div, "model");
    }
    else if(choice=="data"){
        createFileUpload("Diese Trainingsdaten", div, "tdata");
        /*let p = document.createElement("INPUT");
        p.setAttribute("type","number");
        let br= document.createElement("br");
        div.appendChild(br);
        div.appendChild(p);*/
    }
}

/**
 * Creates a html file upload input with the placeholder inherrited via parameter
 * @param {String} placeholder text that will be shown in the upload field
 * @param {*} maindiv html div-container to append the file upload on
 */
function createFileUpload(placeholder, maindiv, name){
    let d= document.createElement("DIV");
    d.setAttribute("class", "input-group");

    let f= document.createElement("INPUT");
    f.setAttribute("type", "file");
    f.setAttribute("name","modelFile");
    f.setAttribute("class", "form-control form-control-lg");

    /*let l = document.createElement("LABEL");
    l.htmlFor="modelFile";
    l.innerHTML=placeholder;
    l.setAttribute("class", "custom-file-label")*/

    let bd=document.createElement("DIV");
    bd.setAttribute("class", "input-group-append");

    let b=document.createElement("BUTTON");
    b.innerHTML=placeholder+" verwenden";
    b.id="readButton";
    b.setAttribute("class", "btn btn-green");

    let hData = document.createElement("INPUT");
    hData.setAttribute("name", "modus")
    hData.value=name;
    hData.style.display="none";
    bd.appendChild(b);

    d.appendChild(f);
    d.appendChild(hData);
    d.appendChild(bd);
    maindiv.appendChild(d);
}
/**
 * Functionality to add Pois per JSON-File
 */
 document.querySelector("#readButton").addEventListener('click', function() {
    //catching empty files
    if(document.querySelector("#modelfile").files.length == 0) {
      alert('Error : No file selected');
      return;
    }
    // file selected by user
    let file = document.querySelector("#modelfile").files[0];
  
    // file MIME type
    let filename = (file.name).split(".");
    let file_type = filename[1];
    console.log(file_type)
    if(file_type=="json" || file_type=="geojson"){
      // new FileReader object
      let reader = new FileReader();
  
      // event fired when file reading finished
      reader.addEventListener('load', function(e) {
        // contents of the file
          let text = e.target.result;
          document.querySelector("#jsonText").textContent = text;
          document.getElementById("jsonText").value=text;
      });
  
      // event fired when file reading failed
      reader.addEventListener('error', function() {
          alert('Error : Failed to read file');
      });
  
      // read file as text file
      reader.readAsText(file);
    }else{
      alert('Error : Wrong File format selected');
    }
  })

function displayAmountSlider(status){
  if(status==0){
    document.getElementById("amount").value="50 %"
  }else{
    document.getElementById("amount").value=(document.getElementById("myRange").value*10)+" %";
  }
}