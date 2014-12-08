(function(){
    var window = new Proxy(_window, window_handler);
    window.t = 2;
    window.x = 3;
})();
