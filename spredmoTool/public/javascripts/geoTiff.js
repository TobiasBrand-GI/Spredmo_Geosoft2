
const plottyRenderer = L.LeafletGeotiff.plotty({
    displayMin: 0,
    displayMax: 10,
    clampLow: false,
    clampHigh: false,
  });

function loadTIFF(){
    const url ="https://stuartmatthews.github.io/leaflet-geotiff/tif/wind_speed.tif";
    
    const options={renderer:plottyRenderer,};
    var tifflayer = L.LeafletGeotiff(url, options).addTo(mymap);
    console.log(tifflayer);
}