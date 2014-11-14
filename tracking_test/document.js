(function(){
    var document = new Proxy(_document,
                             document_handler);
    window.onload = function(){
        var contentDiv = document.getElementById("contentDiv");
        contentDiv.innerHTML = "onload handler fired!";
        var name = document.getElementsByName("testname");
        var class_list = document.getElementsByClassName("testclass");
        var tag_list = document.getElementsByTagName("div");
        // getElementsByTagNameNS not tested with non-zero return
        var ns_list = document.getElementsByTagNameNS("testns", "div");
        // querySelector will only use the last selector and return the first matching node
        // querySelectorAll will return a list of matching nodes for all selectors
        var query = document.querySelector("#outerdiv");
        var query_list = document.querySelectorAll("#outerdiv,#outerdiv1");
        var point = document.elementFromPoint(10, 10);
    };
})();
