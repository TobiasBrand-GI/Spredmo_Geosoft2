function getRResults() {
    return $.ajax({
        url: "/plumber/results",
        method: "GET",
        })
}
async function visualize_Results(){
    try{
        const res = await getRResults();
        console.log(res)
        setTimeout(()=> {
            document.getElementById("loading").style.display="none"
            document.getElementById("mapid").style.display="block"
            dmap.invalidateSize();
            loadTIFF("../images/new.tif");
        }, 2000)
    }catch(err){
        console.log(err)
    }
}
visualize_Results();