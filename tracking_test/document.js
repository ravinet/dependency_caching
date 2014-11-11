(function(){
    var document = new Proxy(_document,
                             document_handler);
    window.onload = function(){
        var contentDiv = document.getElementById("contentDiv");
        //console.log(contentDiv);
        //console.log(contentDiv.parentNode);
        contentDiv.innerHTML = "onload handler fired!";
    };
})();
