function getRResults() {
    return $.ajax({
        url: "/plumber/results",
        method: "GET",
        })
}

async function visualize_Results(){
    try{
        const res = await getRResults();
        console.log(res)
        setTimeout(()=> {
            document.getElementById("loading").style.display="none";
            document.getElementById("mapid").style.display="block";
            document.getElementById("dwButton").disabled=false;
            dmap.invalidateSize();
            loadTIFF("../images/di_of_aoa (2).tif");
        }, 2000)
    }catch(err){
        console.log(err)
    }
}
visualize_Results();

function getDownload(url, fileType, fileName) {
    fetch(url)
    .then(resp => resp.blob())
    .then(blob => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    let currTime= convertTimes(Date.now())
    a.style.display = 'none';
    a.href = url;
    a.download = fileName+'_'+currTime+'.'+fileType;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  })
  .catch(() => alert('Download failed!'));
}

async function download(){
    let aoaCheck=document.getElementById("checkAOA");
    let classCheck=document.getElementById("checkClass");
    let pointsCheck=document.getElementById("checkPoints");
    let modelCheck=document.getElementById("checkModel");

    let downloadArray=new Array();
    let responseString="";
    try{
        if(aoaCheck.checked){
           downloadArray.push(['../images/aoa (2).tif','Area of Applicability','tif','aoa']) 
        }
        if(classCheck.checked){
            downloadArray.push(['../images/lulc-prediction (2).tif','Random Forest Classification','tif','lulc-classifier'])
        }
        if(pointsCheck.checked){
            downloadArray.push(['../images/map.geojson','further random recommended messaruement points','geojson','recommended-points'])
        }
        if(modelCheck.checked){
            downloadArray.push(['../images/new.tif','R Classification Model','tif','class-model'])
        }
        if(downloadArray.length!=0){
            for(i=0; i<downloadArray.length;i++){
                getDownload(downloadArray[i][0],downloadArray[i][2],downloadArray[i][3])
                responseString=responseString+'Your '+downloadArray[i][1]+' was downloaded as a .'+downloadArray[i][2]+'!\n';
            }
            alert(responseString);
        }else{
            alert("No Data selected!");
        }
    }catch(err){
        console.log(err)
    }
}

/**
 * Takes a unix timestemp to convert it to String of numbers to ensure unique file names
 * @param {*} unixTime unix timestemp
 * @returns String of Numbers encoding the day and time with Year, Month, Day, Hour, Minutes and Seconds
 */
 function convertTimes(unixTime){
    let dateObject = new Date(unixTime);
    let converted=dateObject.toLocaleTimeString([],{year:'2-digit', month:'2-digit', day:'2-digit', hour: '2-digit', minute:'2-digit',second:"2-digit"});
    for (i=0; i<2; i++){
        converted=converted.replace('.','');
    }
    converted=converted.replace(' ','');
    converted=converted.replace(',','_');
    for (i=0; i<2; i++){
        converted=converted.replace(':','');
    }
    console.log(converted)
    return converted;
}
