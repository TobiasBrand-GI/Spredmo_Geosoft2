let tiffLayer = new Array(); // Array for later save of layers
const colorScaleNom = ['#000000','#E69F00', '#56B4E9', '#009E73', '#F0E442', '#0072B2', '#D55E00', '#CC79A7', '#294D23', '#FFFFFF']; // Predefined color scale for Nominal or qualitativ data
const colorScaleOrd = ['#eff3ff','#c6dbef','#9ecae1','#6baed6','#4292c6','#2171b5','#084594']; // predefined color scale for Ordinal and continious sata
let classifier= new Array(); // Array to store prediction classes

/**
 * Basemap for Leaflet Application
 * @type Leaflet Map
 */
var dmap = L.map('mapid').setView([0, 0], 5000);
L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(dmap);

/**
 * Obejct for the Layer control
 * @type Control layer
 */
let layerCtrl = L.control.layers().addTo(dmap);

/**
 * Legend object for download map, set to the bottom left corner
 * @type Control layer
 */
var legend = L.control({ position: "bottomleft" });

/**
 * First initialization of a legend in leaflet map
 * @param {*} map 
 * @returns 
 */
legend.onAdd = function (map) {
  var div = L.DomUtil.create('div', 'info legend'),
      labels = ["Not Applicable", "Applicable"];
      div.innerHTML +='<i style="background:' + "#AEAEAE" + '"></i> ' + labels[0] + '<br>';
      div.innerHTML +='<i style="background:' + colorScaleNom[7] + '"></i> ' + labels[1] + '<br>';
  return div;
};
legend.addTo(dmap);

/**
 * Creates a specific and dynamic legend for the aoa, if the layer is selected
 */
function addAOALegend(){
  legend.onAdd = function (map) {
  var div = L.DomUtil.create('div', 'info legend'),
      labels = ["Not Applicable", "Applicable"];
      // Create the entries
      div.innerHTML +='<i style="background:' + "#AEAEAE" + '"></i> ' + labels[0] + '<br>';
      div.innerHTML +='<i style="background:' + colorScaleNom[7] + '"></i> ' + labels[1] + '<br>';
  return div;
  };
  legend.addTo(dmap);
}

/**
 * Creates a specific and dynamic legend for the dissimilarity index, if the layer is selected
 */
function addDILegend(){
  legend.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'info legend'),
        grades = [0.25,0.5,0.75,1,2,5,10]
    // loop through grades to create an entry for each step
    for (var i = 0; i < grades.length-1; i++) {
        div.innerHTML +=
            '<i style="background:' + colorScaleOrd[i] + '"></i> ' +
            grades[i] + " - "+grades[i+1]+'<br>';
    }
    // create last entry
    div.innerHTML +=
            '<i style="background:' + colorScaleOrd[i] + '"></i> ' +
            grades[6] + "+"
    return div;
    };
  legend.addTo(dmap);
}

/**
 * Creates a specific and dynamic legend for the lulc-prediction, if the layer is selected
 */
function addLULCLegend(){
  legend.onAdd = function (map) {
    // create steps from amount of classes
    let gradeStack = new Array();
    for(i=0;i<classifier.length;i++){
      gradeStack.push(i);
    }
    var div = L.DomUtil.create('div', 'info legend'),
        grades = gradeStack,
        labels = classifier;
    // loop through classes and create entry with the according label
    for (var i = 0; i < grades.length; i++) {
        div.innerHTML +=
            '<i style="background:' + colorScaleNom[i] + '"></i> ' +
            labels[i] + '<br>';
    }
    return div;
  }
  legend.addTo(dmap);
}

/**
 * Event listener to change the legend, when another GeoTIFF is selected
 */
dmap.on('baselayerchange', function (e){
  if (e.name==="Area of Applicability"){
    this.removeControl(legend)
    addAOALegend();
  }
  if (e.name==="Prediction"){
    this.removeControl(legend)
    addLULCLegend();
  }
  if (e.name==="Dissimilarity Index"){
    this.removeControl(legend)
    addDILegend();
  }
});



/**
 * Main function to call all necessary processes to visualize the GeoTIFFs, GeoJSONs and JSON data in the Leaflet Map
 * @param {Array} tiffurls  Array of strings containing all relative local paths of all downloaded files 
 * @param {GeoJSON} aoi The GeoJSON object of the Area of interest
 * @param {*} classes Request response with all the classes used in the prediction
 * @param {*} status 0 or 1, used to dertermine if sample points where created or not
 */
 async function mainLeafletFunctionailty(tiffurls, aoi, classes, status){
  getClassifier(classes);
  // load all TFFs into the map
  for(i=0; i<tiffurls.length;i++){
    await loadTIFF(tiffurls[i], classes);
  }
  // Add aoi to map
  let aoiLayer = L.featureGroup().addTo(dmap);
  L.geoJSON(aoi).addTo(aoiLayer);
  // Add aoi to layer control
  layerCtrl.addOverlay(aoiLayer, "Area of Interest")
  // Add sample points to map
  if(status===1){
    setTimeout(function () {
      createMeassurePoints();
    }, 1000);
  }
}

/**
 * Loads a GeoTIFF into a leaflet raster layer using "georaster-for-leaflet" package.
 * Rendering a raster with given color scale with chroma.js.
 * Adds entries in layer control.
 * @param {String} url Path of GeoTIFF
 */
async function loadTIFF(url){
  // Fetch image
  fetch(url)
    .then(response => response.arrayBuffer())
    .then(arrayBuffer => {
      // parse into Georaster
      parseGeoraster(arrayBuffer).then(georaster => {
        // use different color scales for different images
        if(url==="images/aoa.tif"){
          var scale = chroma.scale(['#AEAEAE',colorScaleNom[7]]).domain([0,1]);
        }else if(url==="images/lulc-prediction.tif"){
          let tmpscale = new Array();
          let tmpdomain = new Array();
          for(i=0; i<classifier.length;i++){
            tmpscale.push(colorScaleNom[i]);
            tmpdomain.push(i);
          }
          console.log(tmpscale)
          var scale = chroma.scale(tmpscale).domain(tmpdomain);
        }else if(url==="images/di_of_aoa.tif"){
          var scale = chroma.scale(colorScaleOrd).domain([0.25,0.5,0.75,1,2,5,10]);
        }
        // create new leaflet layer
        var layer = new GeoRasterLayer({
            georaster: georaster,
            opacity: 1,
            pixelValuesToColorFn: function (values) {
              var population = values[0];
              if (population === -200) return;
              if (population < 0) return;
              return scale(population).hex();
            },
          resolution: 64 // optional parameter for adjusting display resolution values[0] > 8 ? '#ff0000' : '#0000ff',
        });
        layer.addTo(dmap);
        dmap.fitBounds(layer.getBounds());
        addLayerControl(layer,url)
      });
  });
}

/**
 * Creates markers on the map according to the generated coordiantes from the json.
 * Visualized as black crosses.
 */
async function createMeassurePoints(){
  var crossIcon = L.icon({
    iconUrl: '../images/marker_cross.png',

    iconAnchor:   [12, 12], // point of the icon which will correspond to marker's location
    popupAnchor:  [0, 0] // point from which the popup should open relative to the iconAnchor
  });
  // Call API to load json data
  $.ajax({
    url: "/plumber/loadSamples",
    method: "GET",
  }).then(response=>{
    let samples = response.samples;
    if(samples.length!=0){
      let coords = new Array();
      try{
        // Extract coords from response string
        let onlyElements = samples.slice(1,-1);
        let splitElements = onlyElements.split("[");
        for(j=0; j<splitElements.length;j++){
          var coordString = splitElements[j].slice(0,-2);
          var singleCoord = coordString.split(",");
          coords.push([parseFloat(singleCoord[0]),parseFloat(singleCoord[1])]);
        }
        // create marker for each coordinate pair and bind a popup to it
        let markers = L.featureGroup().addTo(dmap);
        for(i=1; i<coords.length;i++){
            var marker = L.marker([coords[i][0], coords[i][1]],{icon:crossIcon}).addTo(markers);
            var popup = L.popup().setContent("<b>Random recommended sample Point</b></br>Coordinates: "+coords[i][0]+"° Lattitude, "+coords[i][1]+"° Longitude");
            marker.bindPopup(popup);
        }
        // Add markers to Layer control
        layerCtrl.addOverlay(markers, "Random Sample Points")
      }catch(e){console.log(e)}
    }
  }).catch(e=>{
    console.log(e)
  })
}

/**
 * Adds a GeoTIFF layer to the form control with a given label
 * @param {Leaflet Layer} layer 
 * @param {String} url Path of the GeoTIFF
 */
function addLayerControl(layer,url){
  if(url==="images/aoa.tif"){
    layerCtrl.addBaseLayer(layer, "Area of Applicability")
  }else if(url==="images/lulc-prediction.tif"){
    layerCtrl.addBaseLayer(layer, "Prediction")
  }else if(url==="images/di_of_aoa.tif"){
    layerCtrl.addBaseLayer(layer, "Dissimilarity Index")
  }
}

/**
 * Extraxts classification labels from response body
 * @param {Array} classStack 
 */
function getClassifier(classStack){
  var classifierWithoutBrackets = classStack.slice(1,-1);
  var singleClassifier = classifierWithoutBrackets.split(",")
  for(i=0; i<singleClassifier.length;i++){
    classifier.push(singleClassifier[i])
  }
}