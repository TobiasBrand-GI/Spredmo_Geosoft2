let tiffUrls = ["images/lulc-prediction.tif","images/di_of_aoa.tif","images/aoa.tif"] // Local paths to files, they are always the same

/**
 * Starting the calculation and differentiate between demo and API version via url parameter
 */
function startAlgorithm(){
    let qs = new URLSearchParams(window.location.search);
    let mode = qs.get("mode")
    console.log(mode)
    if(mode==="plumber"){
        visualize_Results_API();
    }else if(mode==="demo"){
        visualize_Results_Demo();
    }
}
startAlgorithm();

/**
 * Helper function to call and await result request
 * @returns request body from Plumber API
 */
function getRResults() {
    return $.ajax({
    url: "/plumber/results",
    method: "GET",
    })
}

/**
 * Helper function to call and await clearServer request
 * @returns  json response with a message and status
 */
function clearServer(){
    return $.ajax({
        url: "/plumber/clearServer",
        method: "GET",
        })
}

/**
 * Helper function to call and await loadDemo request
 * @returns json with message and status
 */
 function loadDemo(){
    return $.ajax({
        url: "/plumber/loadDemo",
        method: "GET",
    })
}

/**
 * Calls clearServer and result API requests and starts visualization of results. Also changes loading screen to map or error image
 */
async function visualize_Results_API(){
    try{
        
        //Await server clean up
        const refresh = await clearServer();
        if(refresh.success===true){
            // Await calculation results
            const res = await getRResults();
            if(res.success===true){
                console.log(res.message)
                //Disable loading gif, enable map
                document.getElementById("loading").style.display="none";
                document.getElementById("mapid").style.display="block";
                document.getElementById("dwButton").disabled=false;
                // Reinitialize Map, necessary due to display:none attribute
                dmap.invalidateSize();
                // Start loading of layers in leaflet map
                mainLeafletFunctionailty(tiffUrls, res.aoi, res.classes, res.status );
            }else{
                // catch error and redirect
                alert(res.message);
                window.location.href = "index.html";
            }
        }else{
            // catch error and redirect
            alert(refresh.message);
            window.location.href = "index.html";
        }
    }catch(err){
        // catch error and show error design on page
        console.log(err)
        document.getElementById("loading").style.display="none";
        document.getElementById("div-failed").style.display="block";
    }
}

/**
 * Calls a demo version with pre calculated data to ensure a maximm calculation time of 20 seconds
 */
 async function visualize_Results_Demo(){
    try{
        const copy = await loadDemo();
        if(copy.success==true){
            //Disable loading gif, enable map
            document.getElementById("loading").style.display="none";
            document.getElementById("mapid").style.display="block";
            document.getElementById("dwButton").disabled=false;
            // Reinitialize Map, necessary due to display:none attribute
            dmap.invalidateSize();
            // Start loading of layers in leaflet map
            mainLeafletFunctionailty(tiffUrls, JSON.parse('{"type":"Feature","properties":{},"geometry":{"type":"Polygon","coordinates":[[[7.657471,51.90446],[7.657471,51.97473],[7.770081,51.97473],[7.770081,51.90446],[7.657471,51.90446]]]}}'), '["ConiferousForest","DeciduousForest","Grassland","Industrial","MixedForest","OpenSoil","PlantedFields","Settlement","Urban","Water"]', 1 );
        }
    }catch(err){
        // catch error and show error design on page
        console.log(err)
        document.getElementById("loading").style.display="none";
        document.getElementById("div-failed").style.display="block";
    }
}

/**
 * Download a file from Node structure to local download folder with a unique file name
 * @param {String} url Path of the File
 * @param {String} fileType MIMI type of the file
 * @param {String} fileName prefix for new file name
 */
function getDownload(url, fileType, fileName) {
    fetch(url)
    .then(resp => resp.blob())
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            let currTime= createFileNames(Date.now())
            a.style.display = 'none';
            a.href = url;
            a.download = fileName+'_'+currTime+'.'+fileType;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        })
    .catch(() => alert('Download failed!'));
}

/**
 * Checks the checkboxes on download page and adds selected files to an array, which is than send to the getDownload()
 */
async function download(){
    // Get all checkboxes
    let aoaCheck=document.getElementById("checkAOA");
    let classCheck=document.getElementById("checkClass");
    let pointsCheck=document.getElementById("checkPoints");
    let modelCheck=document.getElementById("checkModel");

    let downloadArray=new Array();
    let responseString="";
    // add all selected files to the array
    try{
        if(aoaCheck.checked){
           downloadArray.push(['../images/aoa.tif','Area of Applicability','tif','aoa']) 
        }
        if(classCheck.checked){
            downloadArray.push(['../images/lulc-prediction.tif','Random Forest Classification','tif','lulc-classifier'])
        }
        if(pointsCheck.checked){
            downloadArray.push(['../images/sample_points.json','further random recommended messaruement points','json','recommended-points'])
        }
        if(modelCheck.checked){
            downloadArray.push(['../images/final_model.rds','R Classification Model','rds','class-model'])
        }
        if(downloadArray.length!=0){
            // call getDownload() for every file selected
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
 * @param {Date} unixTime unix timestemp
 * @returns String of Numbers encoding the day and time with Year, Month, Day, Hour, Minutes and Seconds
 */
 function createFileNames(unixTime){
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