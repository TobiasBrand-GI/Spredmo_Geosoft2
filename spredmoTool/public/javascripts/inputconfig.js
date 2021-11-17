changeInputHTML("model");

function changeInputHTML(choice){
    let div=document.getElementById("modelInDiv");
    div.innerHTML="";
    if(choice=="model"){
        let t= document.createElement("input");
        div.appendChild(t);
    }
    else{
        let t= document.createElement("button");
        div.appendChild(t);
    }
}