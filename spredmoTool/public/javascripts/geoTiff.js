
const plottyRenderer = new L.LeafletGeotiff.plotty({
    displayMin: 0,
    displayMax: 10,
    clampLow: false,
    clampHigh: false,
  });

function loadTIFF(){
    const url ="../images/wind_speed.tif";
    const options={renderer:plottyRenderer,};
    var tifflayer = new L.LeafletGeotiff(url, options).addTo(mymap);
    console.log(tifflayer);
}

loadTIFF();
