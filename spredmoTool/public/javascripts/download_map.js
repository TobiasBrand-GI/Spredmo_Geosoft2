let tiffLayer = new Array();
const colorScaleNom = ['#000000','#E69F00', '#56B4E9', '#009E73', '#F0E442', '#0072B2', '#D55E00', '#CC79A7', '#FFFFFF'];
const colorScaleOrd = ['#eff3ff','#c6dbef','#9ecae1','#6baed6','#4292c6','#2171b5','#084594']
let classifier= new Array();

/**
 * Basemap for Leaflet Application
 * @type Leaflet Map
 */
var dmap = L.map('mapid').setView([0, 0], 5000);
L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(dmap);

var legend = L.control({ position: "bottomleft" });

function addAOALegend(){
  legend.onAdd = function (map) {
  var div = L.DomUtil.create('div', 'info legend'),
      labels = ["Not Applicable", "Applicable"];
      div.innerHTML +='<i style="background:' + "#AEAEAE" + '"></i> ' + labels[0] + '<br>';
      div.innerHTML +='<i style="background:' + colorScaleNom[7] + '"></i> ' + labels[1] + '<br>';

  return div;
  };
  legend.addTo(dmap);
}

function addDILegend(){
  legend.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'info legend'),
        grades = [0.25,0.5,0.75,1,2,5,10]
    // loop through our density intervals and generate a label with a colored square for each interval
    for (var i = 0; i < grades.length-1; i++) {
        div.innerHTML +=
            '<i style="background:' + colorScaleOrd[i] + '"></i> ' +
            grades[i] + " - "+grades[i+1]+'<br>';
    }
    div.innerHTML +=
            '<i style="background:' + colorScaleOrd[i] + '"></i> ' +
            grades[6] + "+"
    return div;
    };
  legend.addTo(dmap);
}

function addLULCLegend(){
  legend.onAdd = function (map) {
    let gradeStack = new Array();
    for(i=0;i<classifier.length;i++){
      gradeStack.push(i);
    }
    var div = L.DomUtil.create('div', 'info legend'),
        grades = gradeStack,
        labels = classifier;
    // loop through our density intervals and generate a label with a colored square for each interval
    for (var i = 0; i < grades.length; i++) {
        div.innerHTML +=
            '<i style="background:' + colorScaleNom[i] + '"></i> ' +
            labels[i] + '<br>';
    }
    return div;
  }
  legend.addTo(dmap);
}

legend.onAdd = function (map) {
  var div = L.DomUtil.create('div', 'info legend'),
      labels = ["Not Applicable", "Applicable"];
      div.innerHTML +='<i style="background:' + "#AEAEAE" + '"></i> ' + labels[0] + '<br>';
      div.innerHTML +='<i style="background:' + colorScaleNom[7] + '"></i> ' + labels[1] + '<br>';
  return div;
};
legend.addTo(dmap);

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


let layerCtrl = L.control.layers().addTo(dmap);

async function mainLeafletFunctionailty(tiffurls, aoi, classes, status){
  getClassifier(classes);
  for(i=0; i<tiffurls.length;i++){
    await loadTIFF(tiffurls[i], classes);
  }
  let aoiLayer = L.featureGroup().addTo(dmap);
  L.geoJSON(aoi).addTo(aoiLayer);
  layerCtrl.addOverlay(aoiLayer, "Area of Interest")
  if(status===1){
    setTimeout(function () {
      createMeassurePoints();
    }, 1000);
  }
}

async function loadTIFF(url){
  fetch(url)
    .then(response => response.arrayBuffer())
    .then(arrayBuffer => {
    parseGeoraster(arrayBuffer).then(georaster => {
      if(url==="images/aoa.tif"){
        var scale = chroma.scale(['#AEAEAE',colorScaleNom[7]]).domain([0,1]);
      }else if(url==="images/lulc-prediction.tif"){
        let tmpscale = new Array();
        let tmpdomain = new Array();
        for(i=0; i<classifier.length;i++){
          tmpscale.push(colorScaleNom[i]);
          tmpdomain.push(i);
        }
        var scale = chroma.scale(tmpscale).domain(tmpdomain);
      }else if(url==="images/di_of_aoa.tif"){
        var scale = chroma.scale(colorScaleOrd).domain([0.25,0.5,0.75,1,2,5,10]);
      }
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


async function createMeassurePoints(){
  var crossIcon = L.icon({
    iconUrl: '../images/marker_cross.png',

    iconAnchor:   [12, 12], // point of the icon which will correspond to marker's location
    popupAnchor:  [0, 0] // point from which the popup should open relative to the iconAnchor
  });
  $.ajax({
    url: "/plumber/loadSamples",
    method: "GET",
  }).then(response=>{
    console.log(response);
    let samples = response.samples;
    if(samples.length!=0){
      let coords = new Array();
      try{
        let onlyElements = samples.slice(1,-1);
        let splitElements = onlyElements.split("[");
        for(j=0; j<splitElements.length;j++){
          var coordString = splitElements[j].slice(0,-2);
          var singleCoord = coordString.split(",");
          coords.push([parseFloat(singleCoord[0]),parseFloat(singleCoord[1])]);
        }
        let markers = L.featureGroup().addTo(dmap);
        for(i=1; i<coords.length;i++){
            var marker = L.marker([coords[i][0], coords[i][1]],{icon:crossIcon}).addTo(markers);
            var popup = L.popup().setContent("<b>Random recommended sample Point</b></br>Coordinates: "+coords[i][0]+"° Lattitude, "+coords[i][1]+"° Longitude");
            marker.bindPopup(popup);
        }
        layerCtrl.addOverlay(markers, "Random Sample Points")
      }catch(e){console.log(e)}
    }
  }).catch(e=>{
    console.log(e)
  })
}


function addLayerControl(layer,url){
  if(url==="images/aoa.tif"){
    layerCtrl.addBaseLayer(layer, "Area of Applicability")
  }else if(url==="images/lulc-prediction.tif"){
    layerCtrl.addBaseLayer(layer, "Prediction")
  }else if(url==="images/di_of_aoa.tif"){
    layerCtrl.addBaseLayer(layer, "Dissimilarity Index")
  }
}


function getClassifier(classStack){
  var classifierWithoutBrackets = classStack.slice(1,-1);
  var singleClassifier = classifierWithoutBrackets.split(",")
  for(i=0; i<singleClassifier.length;i++){
    classifier.push(singleClassifier[i])
  }
}