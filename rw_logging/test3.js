(function(){
    var window = new Proxy(_window, window_handler);
    window.x = 4;
})();
