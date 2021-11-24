
changeInputHTML("model", 0);// initializing call to visualize standard input on site load

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
        createFileUpload("Wählen Sie ihr Modell aus", div);
    }
    else{
        createFileUpload("Wählen Sie ihre Trainingsdaten aus", div);
        let p = document.createElement("INPUT");
        p.setAttribute("type","number");
        let br= document.createElement("br");
        div.appendChild(br);
        div.appendChild(p);
    }
}

/**
 * Creates a html file upload input with the placeholder inherrited via parameter
 * @param {String} placeholder text that will be shown in the upload field
 * @param {*} maindiv html div-container to append the file upload on
 */
function createFileUpload(placeholder, maindiv){
    let d= document.createElement("DIV");
    d.setAttribute("class", "custom-file");

    let f= document.createElement("INPUT");
    f.setAttribute("type", "file");
    f.setAttribute("name","modelFile")
    f.setAttribute("class", "custom-file-input");

    var l = document.createElement("LABEL");
    l.htmlFor="modelFile";
    l.innerHTML=placeholder;
    l.setAttribute("class", "custom-file-label")

    d.appendChild(f);
    d.appendChild(l);
    maindiv.appendChild(d);
}