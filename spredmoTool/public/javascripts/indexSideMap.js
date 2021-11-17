'use strict'
/**
 * Basemap for Leaflet Application
 * @type Leaflet Map
 */
    let mymap = L.map('mapid').setView([51.965, 7.63],13);
    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mymap);
    

/**
 * Layer for later addition of markers
 * @type Leaflet Layer
 */
    let markerLayer = new L.layerGroup().addTo(mymap);

/**
 * Layer for later addition of markers
 * @type Leaflet Layer
 */
 let stoppsLayer = new L.layerGroup().addTo(mymap);

 /**
 * Layer for later addition of markers
 * @type Leaflet Layer
 */
  let toursLayer = new L.layerGroup().addTo(mymap);
//getIndexDatafromDB();


/**
 * get pois from database for index site
 */
function getIndexDatafromDB() { 
 /*{$.ajax({ //handle request via ajax
     url: "/search", //request url is the prebuild request
     method: "GET", //method is GET since we want to get data not post or update it
     })
     .done(function(res) { 
         console.dir(res)
         for(let i = 0; i < res.length; i++) {
             let json=res[i].json
             let resGeoJSON = JSON.parse(json);
             var  layer = L.geoJSON(resGeoJSON);
             fillIndexPopupHTML(res[i].poiname, res[i].link, json,layer)
         }
     })
     .fail(function(xhr, status, errorThrown) { //if the request fails (for some reason)
         console.log("Request has failed!", '/n', "Status: " + status, '/n', "Error: " + errorThrown); //we log a message on the console
     })
     .always(function(xhr, status) { //if the request is "closed", either successful or not 
         console.log("Request completed"); //a short message is logged
     })
 }*/
} 

/**
 * Takes a unix timestemp to convert it to normal time format
 * @param {*} unixTime unix timestemp
 * @returns human readable time format
 */
 function convertTimes(unixTime){
    let unix = unixTime;
    let unixMilli = unix * 1000;
    let dateObject = new Date(unixMilli);
    return dateObject.toLocaleTimeString([],{hour: '2-digit', minute:'2-digit'});
}