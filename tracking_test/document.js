(function(){
    var document = new Proxy(_document,
                             document_handler);
    window.onload = function(){
        var contentDiv = document.getElementById("contentDiv");
        contentDiv.innerHTML = "onload handler fired!";
        var name = document.getElementsByName("testname");
    };
})();
