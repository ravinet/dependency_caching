(function(){
    var window = new Proxy(_window, window_handler);
    console.log("final x: " + window.x);
    console.log("final y: " + window.y);
    console.log("final t: " + window.t);
})();
