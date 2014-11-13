(function(){
    var document = new Proxy(_document,
                             document_handler);
    window.onload = function(){
        var contentDiv = document.getElementById("contentDiv");
        contentDiv.innerHTML = "onload handler fired!";
        var name = document.getElementsByName("testname");
        var class_list = document.getElementsByClassName("testclass");
        var tag_list = document.getElementsByTagName("div");
        var ns_list = document.getElementsByTagNameNS("testns", "div");
        var query = document.querySelector("outerdiv");
    };
})();
