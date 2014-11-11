var _window = window;
var windowBindCache = {};
var window_handler = {
                  "get": function(base, name){
                             console.log("[READ][window]: " + name);
                             if(name in windowBindCache){
                                 return windowBindCache[name];
                             }
                             
                             var value = base[name];
                             if(typeof(value) == "function"){
                                 value = value.bind(base);
                                 windowBindCache[name] = value;
                             }
                             return value;
                         },
                  "set": function(base, name, value){
                             console.log("[WRITE][window]: " + name);
                             base[name] = value;
                             if(name in windowBindCache){
                                 delete windowBindCache[name];
                             }
                         }
                 };

