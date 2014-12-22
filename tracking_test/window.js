(function(){
            var window = new Proxy(_window,
                                   window_handler); // this line must be defined here (Can't be defined at top of page)
            // site 1
            //script first.js
            var obj = makeProxy({key: ""});
            window.x = obj;
            window.y = obj;

            //script second.js
            window.x.key = "second";

            //script third.js
            window.y.key = "third";


            // site 2
            ////script first.js
            //var obj = makeProxy({key: ""});
            //window.x = obj;

            ////script second.js
            //alert(window.x);

            ////script third.js
            //var newObj = makeProxy({key: ""});
            //window.x = newObj;


            // site 3
            //window.x = makeProxy({y:makeProxy({z:23})});
            //console.log(window.x.y.z);


            // site 4
            //window.x = makeProxy({y:makeProxy({z:10})});

            //window.p = makeProxy({d:makeProxy({r:7})});
            //console.log(window.x.y.z);
            //console.log(window.p.d.r);

            //var obj1 = window.x;
            //var obj2 = obj1.y;
            //console.log(obj2.z);
            //window.x = 42;
            //obj1.y = 5;
    })();
