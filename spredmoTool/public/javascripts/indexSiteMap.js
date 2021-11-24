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
 * Layer on which the User can draw a shape
 * @type Leaflet Layer
 */
 let drawnItems = L.featureGroup().addTo(mymap);



// Adding a Leaflet.Draw Toolbar
mymap.addControl(new L.Control.Draw( {
    edit: {
        featureGroup: drawnItems,
        poly: {
            allowIntersection: false
        }
    },
    draw: {
        // Only rectangle and polygon draw function is needed
        polyline: false,
        polygon: true,
        marker: false,
        circle:false,
        rectangle: true,
    }
}))

// Listener to catch when a shape is drawn onto the map
mymap.on(L.Draw.Event.CREATED, function (event) {
    var layer = event.layer;
    let geoJSONObj=layer.toGeoJSON();
    let geoJSONStr=JSON.stringify(geoJSONObj)
    layer.addTo(drawnItems);
    $(".leaflet-draw-toolbar-top").css("visibility","hidden"); // Disable draw button to prevent multiple shapes
    //fillPopupHTML("","",geoJSONStr, 0,layer);
})

// Listener to catch when the existing shape is edited
mymap.on('draw:edited', function(e){
    var layer = e.layers;
    let geoJSONObj=layer.toGeoJSON();
    let geoJSONStr=JSON.stringify(geoJSONObj)
    console.log("edited");
})

// Listener to catch when a shape is deleted from the map
mymap.on('draw:deleted', function(e){
    var layers = e.layers;
    layers.eachLayer(function (layer) {
        drawnItems.clearLayers(); // Clearing old markers
    });
    if(Object.keys(drawnItems._layers).length==0){
        $(".leaflet-draw-toolbar-top").css("visibility","visible");
    }
})

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