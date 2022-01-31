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
        var scale = chroma.scale(['white','brown', 'orange', 'red', 'blue', 'green', 'pink', 'black', 'purple', 'yellow']).domain([0,1,2,3,4,5,6,7,8,9]);
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
  let coords = new Array([51.9434, 7.7049],
    [51.2453, 5.6661],
  [51.2531, 5.655],
  [51.2474, 5.6767],
  [51.2463, 5.6629],
  [51.2404, 5.691],
  [51.247, 5.6859],
  [51.2525, 5.6697],
  [51.2483, 5.6632],
  [51.2452, 5.6843],
  [51.2312, 5.6803],
  [51.2533, 5.6825],
  [51.2413, 5.6618],
  [51.2316, 5.6904],
  [51.2313, 5.6541],
  [51.2369, 5.6612],
  [51.244, 5.6787],
  [51.2323, 5.655],
  [51.2414, 5.6921],
  [51.2473, 5.6548],
  [51.2415, 5.675],
  [51.2499, 5.6586],
  [51.2508, 5.6699],
  [51.2489, 5.654],
  [51.24, 5.6701],
  [51.2417, 5.6776],
  [51.2419, 5.6844],
  [51.2378, 5.6671],
  [51.2438, 5.6895],
  [51.2395, 5.6909],
  [51.2333, 5.676],
  [51.2338, 5.6666],
  [51.2471, 5.6859],
  [51.2299, 5.6587],
  [51.2368, 5.6887],
  [51.2462, 5.6565],
  [51.2528, 5.6724],
  [51.2413, 5.6603],
  [51.2493, 5.6772],
  [51.248, 5.6729],
  [51.2528, 5.6777],
  [51.23, 5.6879],
  [51.2304, 5.6617],
  [51.249, 5.6759],
  [51.2327, 5.6742],
  [51.2377, 5.6798],
  [51.2352, 5.6912],
  [51.247, 5.6743],
  [51.2303, 5.6864],
  [51.2436, 5.6868],
  [51.2409, 5.6922],
  [51.2351, 5.6535],
  [51.244, 5.6632],
  [51.249, 5.6792],
  [51.242, 5.6642],
  [51.2468, 5.6828],
  [51.2436, 5.6748],
  [51.2369, 5.6888],
  [51.2386, 5.6713],
  [51.2352, 5.677],
  [51.2436, 5.6624],
  [51.2306, 5.6554],
  [51.2484, 5.6879],
  [51.2305, 5.6847],
  [51.2508, 5.6875],
  [51.2485, 5.6611],
  [51.2532, 5.6851],
  [51.2522, 5.6643],
  [51.2541, 5.6869],
  [51.2401, 5.6911],
  [51.2404, 5.6822],
  [51.2537, 5.6616],
  [51.2321, 5.6636],
  [51.2418, 5.6592])
  let markers = L.featureGroup().addTo(dmap);
  for(i=0; i<coords.length;i++){
    var marker = L.marker([coords[i][0], coords[i][1]]).addTo(markers);
  }
    let geoJSONObj=markers.toGeoJSON();
    let geoJSONStr=JSON.stringify(geoJSONObj);
    console.log(geoJSONStr)
}
createMeassurePoints();