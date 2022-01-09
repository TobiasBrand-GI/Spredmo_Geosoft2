function plumberSend(){
    /*$.ajax({
        url:"http://127.0.0.1:8561/echo?msg=hello,callback=?",
        type:"GET",
        success: function(result){
            alert(result.msg)},
        error: function(error){
            alert(JSON.stringify(error))
        }
    })
    const xhr = new XMLHttpRequest();
    const url = 'http://127.0.0.1:8561/echo?msg=hello';

    xhr.open('GET', url);
    xhr.onreadystatechange = someHandler;
    xhr.send();*/
    $.getJSON("http://127.0.0.1:8050/echo?msg=hello", function(data){
        console.log(data)
    });
}

