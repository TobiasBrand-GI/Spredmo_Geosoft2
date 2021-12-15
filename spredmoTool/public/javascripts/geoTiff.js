
const plottyRenderer = new L.LeafletGeotiff.plotty({
    displayMin: -100,
    displayMax: 100,
    clampLow: false,
    clampHigh: false,
  });

function loadTIFF(){
    const windurl ="../images/wind_direction.tif";
    //const ownurl ="../images/differenz_waldflaeche.tif"
    const options={renderer:plottyRenderer,};
    var tifflayer = new L.LeafletGeotiff(windurl, options).addTo(mymap);
    //var owntifflayer = new L.LeafletGeotiff(ownurl, options).addTo(mymap);
    console.log(tifflayer);
    //console.log(owntifflayer);
}

loadTIFF();
