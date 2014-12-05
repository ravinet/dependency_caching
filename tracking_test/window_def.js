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
                             var log = {"window": "READ", "var": name, "new_value": null, "script": caller}
                             console.log( JSON.stringify( log ) );
                             var value = base[name];

                             switch( typeof( value ) ){
                                 case "number":
                                 case "boolean":
                                 case "string":
                                 case "object":
                                     if ( value == null ){
                                         return value;
                                     }
                                     var object_handler = {
                                         "get": function(base1, name){
                                             var caller = get_caller( document.currentScript);
                                             var log = {"window": "INNER READ", "var": name, "new_value": null, "script": caller}
                                             console.log( JSON.stringify( log ) );
                                             return value[name];
                                         },
                                         "set": function(base, name, new_value){
                                             var caller = get_caller( document.currentScript);
                                             var log = {'window': 'WRITE', 'var': name, 'new_value': value, 'script': caller};
                                             console.log( JSON.stringify( log ) );
                                             value[name] = new_value;
                                         }
                                     };
                                     return (new Proxy( {}, object_handler));
                                 case "function":
                                     if(name in windowBindCache){
                                         return windowBindCache[name];
                                     }

                                     if(typeof(value) == "function"){
                                         value = value.bind(base);
                                         windowBindCache[name] = value;
                                     }
                             }
                             return value;
                         },
                  "set": function(base, name, value){
                             var caller = get_caller( document.currentScript);
                             var log = {'window': 'WRITE', 'var': name, 'new_value': value, 'script': caller}
                             console.log( JSON.stringify( log ) );
                             base[name] = value;
                             if(name in windowBindCache){
                                 delete windowBindCache[name];
                             }
                         }
                 };
