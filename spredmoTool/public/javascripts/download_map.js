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
  let coords = new Array( [51.968, 7.5547],
    [51.9679, 7.5569],
    [51.9109, 7.604],
    [51.9135, 7.7005],
    [51.9639, 7.6682],
    [51.9777, 7.6764],
    [51.9265, 7.6619],
    [51.9434, 7.7057],
    [51.9713, 7.6635],
    [51.9651, 7.624],
    [51.9682, 7.694],
    [51.9336, 7.7038],
    [51.9702, 7.6496],
    [51.9154, 7.6825],
    [51.9631, 7.6962],
    [51.9635, 7.7051],
    [51.9769, 7.6622])
  let markers = L.featureGroup().addTo(dmap);
  for(i=0; i<coords.length;i++){
    var marker = L.marker([coords[i][0], coords[i][1]]).addTo(markers);
  }
    let geoJSONObj=markers.toGeoJSON();
    let geoJSONStr=JSON.stringify(geoJSONObj);
    console.log(geoJSONStr)
}
createMeassurePoints();