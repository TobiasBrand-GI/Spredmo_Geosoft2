// initalize leaflet map
var dmap = L.map('mapid').setView([0, 0], 5);

// add OpenStreetMap basemap
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
        var layer = new GeoRasterLayer({
            georaster: georaster,
            opacity: 0.7
        });
        layer.addTo(dmap);
  
        dmap.fitBounds(layer.getBounds());
  
    });
  });
}
