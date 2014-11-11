(function(){
            var window = new Proxy(_window,
                                   window_handler); // this line must be defined here (Can't be defined at top of page)
            window.alert("Hiya!");
            window.x = 42;
            window.alert(window.x);
    })();
