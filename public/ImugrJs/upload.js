 var feedback = function(res) {
     if (res.success === true) {
        var wahaha = res.data.link.replace("http", "https");
        document.querySelector('.status').classList.add('bg-success');
        document.querySelector('.status').innerHTML = 
        'Image : ' + '<br><input type="text" class="image-url" name="thumbNailImg" value=' + wahaha + ' style="display:none;"/>' + '<img class="img" src=' + wahaha + '/>';
     }
 };

new Imgur({ 
    clientid: '4467f20db733dcb',
    callback: feedback 
});
