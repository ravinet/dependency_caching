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

// counter for proxies returned by makeProxy
window.proxy_counter = 0;

// object handler for proxies
var window_handler = {
                  "get": function(base, name){
                             var caller = get_caller( document.currentScript);
                             var value = base[name];
                             var parent_id;
                             if ( base == _window ){
                                 parent_id = "window";
                             } else {
                                 parent_id = base._id;
                                 if ( parent_id == undefined ){
                                     parent_id = "null";
                                 }
                             }
                             var old_id;
                             if ( value == undefined ){
                                 old_id = "null";
                             } else {
                                 var old_id = value._id;
                             }
                             if ( old_id == undefined ){
                                 old_id = "null";
                             }
                             var new_id = "null";
                             if ( name != "_id" ){
                                 var log = {'OpType': 'READ', 'ParentId': parent_id, 'PropName': name, 'NewValId': new_id, 'OldValId': old_id, 'script': caller};
                                 console.log( JSON.stringify( log ) );
                             }
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
                                     return value;
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
                             var parent_id;
                             if ( base == _window ){
                                 parent_id = "window";
                             } else {
                                 var parent_id = base._id;
                                 if ( parent_id == undefined ){
                                     parent_id = "null";
                                 }
                             }
                             var new_id = value._id;
                             if ( new_id == undefined ){
                                 new_id = "null";
                             }
                             var prev = base[name];
                             var old_id;
                             if ( prev == undefined ){
                                 old_id = "null";
                             } else {
                                 var old_id = prev._id;
                             }
                             if ( old_id == undefined ){
                                 old_id = "null";
                             }
                             if ( name != "_id" ){
                                 var log = {'OpType': 'WRITE', 'ParentId': parent_id, 'PropName': name, 'NewValId': new_id, 'OldValId': old_id, 'script': caller}
                                 console.log( JSON.stringify( log ) );
                             }
                             base[name] = value;
                             if(name in windowBindCache){
                                 delete windowBindCache[name];
                             }
                         }
                 };


function makeProxy(base){
    if ( typeof(base) == "object" ){
        // not a user defined object, so return value
        if ( base instanceof Date || base instanceof RegExp ||
             base instanceof Array || base instanceof Number ||
             base instanceof Node || base instanceof Element ){
            return base;
        }

        // user defined object, so return new proxy with new id
        var p = new Proxy( base, window_handler );
        p._id = window.proxy_counter;
        window.proxy_counter++;
        return p;
    } else {
        // not an object, so return value
        return base;
    }
}
