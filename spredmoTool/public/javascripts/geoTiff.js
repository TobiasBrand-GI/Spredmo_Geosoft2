const plottyRenderer = new L.LeafletGeotiff.plotty({
    band:[0],
    displayMin: 2,
    displayMax: 10,
    clampLow: false,
    clampHigh: false,
    colorScale: "viridis"
  });

function loadTIFF(){
    const windurl ="./../images/test_changedEPSG.tif";
    const options={renderer:plottyRenderer,};
    var tifflayer = new L.LeafletGeotiff(windurl, options);
    tifflayer.addTo(rasterItems);
    console.log(tifflayer);
}
loadTIFF();
