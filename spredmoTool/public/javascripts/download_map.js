/**
 * Basemap for Leaflet Application
 * @type Leaflet Map
 */
var dmap = L.map('mapid').setView([0, 0], 5);
L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(dmap);

function loadTIFF(url){
  var url_to_geotiff_file =url;
  fetch(url_to_geotiff_file)
    .then(response => response.arrayBuffer())
    .then(arrayBuffer => {
    parseGeoraster(arrayBuffer).then(georaster => {
      console.log("georaster:", georaster);
      var scale = chroma.scale(['black','white', 'orange', 'red', 'blue', 'green', 'pink', 'black', 'purple', 'yellow']).domain([0,1,2,3,4,5,6,7,8,9]);
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
      console.log(georaster)
      layer.addTo(dmap);
      dmap.fitBounds(layer.getBounds());
    });
  });
}

function createMeassurePoints(){
  try{
    fetch("images/sample_points.json")
      .then(data => {
        console.log(data)
        let markers = L.featureGroup().addTo(dmap);
        for(i=0; i<coords.length;i++){
          var marker = L.marker([coords[i][0], coords[i][1]]).addTo(markers);
        }
        let geoJSONObj=markers.toGeoJSON();
        let geoJSONStr=JSON.stringify(geoJSONObj);
        console.log(geoJSONStr)
      })
  }catch(e){console.log(e)}
  
  
}
createMeassurePoints();