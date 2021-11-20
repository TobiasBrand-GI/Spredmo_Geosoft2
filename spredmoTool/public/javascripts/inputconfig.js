
changeInputHTML("model");

function changeInputHTML(choice){
    let div=document.getElementById("modelInDiv");
    div.innerHTML="";
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
function createFileUpload(placeholder, div){
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
    div.appendChild(d);

}