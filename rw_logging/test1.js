(function(){
    var window = new Proxy(_window, window_handler);
    console.log(window.x);
})();
