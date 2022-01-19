'use strict'
/**
 * Basemap for Leaflet Application
 * @type Leaflet Map
 */
 //let dmap = L.map('mapid').setView([51.965, 7.63],13);
 L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
     attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
 }).addTo(dmap);

var url_to_geotiff_file = "wind_direction.tif";

fetch(url_to_geotiff_file)
  .then(response => response.arrayBuffer())
  .then(arrayBuffer => {
    parse_georaster(arrayBuffer).then(georaster => {
      console.log("georaster:", georaster);
      var layer = new GeoRasterLayer({
          georaster: georaster,
          opacity: 0.7,
          pixelValuesToColorFn: values => values[0] > 100 ? '#ff0000' : '#0000ff',
          resolution: 64 // optional parameter for adjusting display resolution
      });
      layer.addTo(map);
      map.fitBounds(layer.getBounds());
  });
});