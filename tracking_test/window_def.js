function get_caller(caller){
    var script_attributes = "";
    if ( caller == null ) {
        script_attributes = "event handler or callback";
    } else {
        var attr = caller.attributes;
        if( attr.length == 0 ) {
            script_attributes = "inline script";
        } else {
            for(j=0; j < attr.length; j++) {
                if( attr[j].name == "src" ) {
                    script_attributes = script_attributes.concat( attr[j].value );
                }
            }
        }
    }
    return script_attributes;
}

var _window = window;
var windowBindCache = {};
var window_handler = {
                  "get": function(base, name){
                             var caller = get_caller( document.currentScript);
                             console.log("READ: window- " + name + "; from=" + caller);
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
                             var caller = get_caller( document.currentScript);
                             console.log("WRITE: window- " + name + ":" + value + "; from=" + caller );
                             base[name] = value;
                             if(name in windowBindCache){
                                 delete windowBindCache[name];
                             }
                         }
                 };

