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
window.proxy_id_counter = 1;
var window_handler = {
                  "get": function(base, name){
                             var caller = get_caller( document.currentScript);
                             var log = {"window": "READ", "var": name, "new_value": null, "script": caller, "parent": "window", "id": window.proxy_id_counter};
                             console.log( JSON.stringify( log ) );
                             var value = base[name];

                             switch( typeof( value ) ){
                                 case "number":
                                 case "boolean":
                                 case "string":
                                     return value;
                                 case "object":
                                     if ( value == null ){
                                         return value;
                                     }
                                     if ( value instanceof Date || value instanceof RegExp ||
                                          value instanceof Array || value instanceof Number ||
                                          value instanceof Node || value instanceof Element ){
                                         return value;
                                     }

                                     var object_handler = {
                                         "get": function(new_base, new_name){
                                             var caller = get_caller( document.currentScript);
                                             var log = {"window": "INNER READ", "var": new_name, "new_value": null, "script": caller, "parent": JSON.stringify(new_base), "id": this._id}
                                             console.log( JSON.stringify( log ) );
                                             var inner_value = new_base[new_name];
                                             switch( typeof( inner_value ) ){
                                                 case "number":
                                                 case "boolean":
                                                 case "string":
                                                     return inner_value;
                                                 case "object":
                                                     if ( inner_value == null ){
                                                         return inner_value;
                                                     }
                                                     if ( inner_value instanceof Date || inner_value instanceof RegExp ||
                                                          inner_value instanceof Array || inner_value instanceof Number ||
                                                          inner_value instanceof Node || inner_value instanceof Element ){
                                                         return inner_value;
                                                     }
                                                     return (new Proxy(inner_value, object_handler));
                                                 case "function":
                                                     return inner_value;
                                             }
                                         },
                                         "set": function(new_base, new_name, new_value){
                                             var caller = get_caller( document.currentScript);
                                             var log = {'window': 'INNER WRITE', 'var': new_name, 'new_value': new_value, 'script': caller, "parent": JSON.stringify(new_base), "id": this._id};
                                             console.log( JSON.stringify( log ) );
                                             value[name] = new_value;
                                         }
                                     };
                                     object_handler._id = window.proxy_id_counter;
                                     window.proxy_id_counter++;
                                     return (new Proxy(value, object_handler));
                                 case "function":
                                     if(name in windowBindCache){
                                         return windowBindCache[name];
                                     }
                                     value = value.bind(base);
                                     windowBindCache[name] = value;
                                     return value;
                             }
                         },
                  "set": function(base, name, value){
                             var caller = get_caller( document.currentScript);
                             var log = {'window': 'WRITE', 'var': name, 'new_value': value, 'script': caller, "parent": "window"}
                             console.log( JSON.stringify( log ) );
                             base[name] = value;
                             if(name in windowBindCache){
                                 delete windowBindCache[name];
                             }
                         }
                 };
