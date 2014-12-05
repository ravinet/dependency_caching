(function(){
            var window = new Proxy(_window,
                                   window_handler); // this line must be defined here (Can't be defined at top of page)
            window.t = 42;
            console.log(window.t);
            //window.alert(window.t);
            window.x = {y: 41};
            console.log(window.x.y);
    })();
