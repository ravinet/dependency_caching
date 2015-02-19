if ( _window != undefined ) {
} else {
    var js_rewriting_logs = [];
    window.onload = function(){
        xmlhttp=new XMLHttpRequest();
        xmlhttp.open("POST","http://dallas.csail.mit.edu",true);
        var complete_log = "BEGIN LOG:\n";
        for (i=0; i < window.js_rewriting_logs.length; i++ ){
            complete_log = complete_log + window.js_rewriting_logs[i] + "\n"
        }
        complete_log = complete_log + "END LOG (TOTAL: " + window.js_rewriting_logs.length + ")";
        xmlhttp.send(complete_log);
    }

    function get_caller(caller){
        var script_attributes = "";
        if ( caller == null ) {
            script_attributes = "event_handler_or_callback";
        } else {
            var attr = caller.attributes;
            if( attr.length == 0 ) {
                script_attributes = "inline_script";
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

    function get_child_path(curr){
        child_path = [];
        child_path_tags = [];
        while ( curr.parentNode != null ) {
           var children = curr.parentNode.children;
           for (j = 0; j < children.length; j++){
               if( children[j] == curr ){
                   child_path.push(j);
                   child_path_tags.push(children[j].tagName);
               }
           }
           curr = curr.parentNode;
        }
        return [child_path, child_path_tags];
    }

    var _alert = window.alert;
    window.alert = function(arg){
                       var caller = get_caller( document.currentScript);
                       var log_read = {'OpType': 'READ', 'ParentId': 'window', 'PropName': 'screen', 'NewValId': 'null', 'OldValId': 'null', 'script': caller};
                       var log_write = {'OpType': 'WRITE', 'ParentId': 'window', 'PropName': 'screen', 'NewValId': 'null', 'OldValId': 'null', 'script': caller};
                       //console.log( JSON.stringify( log_read ) );
                       window.js_rewriting_logs.push(JSON.stringify(log_read));
                       //console.log( JSON.stringify( log_write ) );
                       window.js_rewriting_logs.push(JSON.stringify(log_write));
                       var retVal = _alert.call(this._base, arg);
                       return retVal;
                   };

    function isNativeCodeFunc(f){
        var srcCode = f.toString();
        if ( srcCode.indexOf("[native code]") != -1 ) {
            return true;
        } else {
            return false;
        }
        //!!!This test should actually be fancier,
        //and use a regular expression to ensure
        //that the string "[native code]" appears
        //in the declaration of the function signature,
        //not as, e.g., a string literal that's assigned
        //to a local function variable.
    };

    var _window = window;

    // counter for proxies returned by makeProxy
    window.proxy_counter = 0;

    // object handler for proxies
    var window_handler = {
                      "get": function(base, name){
                                 var value = base[name];
                                 var native_func = false;
                                 if ( typeof(value) == "function" ) {
                                     native_func = isNativeCodeFunc(value);
                                 }
                                 var bound_value;
                                 if (native_func && (base == window || base instanceof XMLHttpRequest || base instanceof MutationObserver)) {
                                     if( base == window ) {
                                         bound_value = value.bind(_window);
                                     }
                                     if( base instanceof XMLHttpRequest || base instanceof MutationObserver) {
                                         bound_value = value.bind(base._base);
                                     }
                                     /*var props = Object.getOwnPropertyNames(value);
                                     // bind seems to not preserve prototype chain, so we restore it
                                     bound_value.prototype = value.prototype;
                                     for ( prop in props ) {
                                         bound_value[props[prop]] = value[props[prop]]
                                     }
                                     if ( name == "jQuery" ){
                                        console.log("jquery");
                                     }*/
                                     var curr_value = value;
                                     new_value = new Proxy(bound_value, {
                                         get: function(base1, name1){
                                             return curr_value[name1];
                                         },
                                         set: function(base1, name1, value1){
                                             curr_value[name1] = value1;
                                         }
                                     });
                                     value = new_value;
                                 }

                                 var parent_id = "null";
                                 var old_id = "null";
                                 var new_id = "null";
                                 var caller = get_caller(document.currentScript);

                                 switch( typeof( value ) ){
                                     case "number":
                                     case "boolean":
                                     case "function":
                                     case "string":
                                         old_id = "null";
                                         break;
                                     case "object":
                                         if ( value == null ){
                                             old_id = "null";
                                         } else {
                                             old_id = value._id;
                                             if( typeof(old_id) == "object" ) { // quick hack---not sure how old_id can be an object!
                                                 old_id = old_id._id;
                                             }
                                             if ( old_id == undefined ){
                                                 old_id = "null";
                                             }
                                         }
                                 }

                                 if ( base == _window ){
                                     parent_id = "window";
                                 } else {
                                     parent_id = base._id;
                                     if ( parent_id == undefined ){
                                         parent_id = "null";
                                     }
                                 }
                                 var new_id = "null";
                                 if ( name != "_id" ){
                                     var log = {'OpType': 'READ', 'ParentId': parent_id, 'PropName': name, 'NewValId': new_id, 'OldValId': old_id, 'script': caller};
                                     //console.log( JSON.stringify( log ) );
                                     window.js_rewriting_logs.push(JSON.stringify(log));
                                 }
                                 return value;
                             },
                      "set": function(base, name, value){
                                 var caller = get_caller(document.currentScript);
                                 var prev = base[name];
                                 var parent_id = "null";
                                 var new_id = "null";
                                 var old_id = "null";
                                 switch( typeof( value ) ){
                                     case "number":
                                     case "boolean":
                                     case "string":
                                     case "function":
                                         new_id = "null";
                                         break;
                                     case "object":
                                         if ( value == null ){
                                             new_id = "null";
                                         } else {
                                             new_id = value._id;
                                             if( typeof(new_id) == "object" ) { // quick hack---not sure how new_id can be an object!
                                                 new_id = new_id._id;
                                             }
                                             if ( new_id == undefined ){
                                                 new_id = "null";
                                             }
                                         }
                                 }

                                 switch( typeof( prev ) ){
                                     case "number":
                                     case "boolean":
                                     case "function":
                                     case "string":
                                         old_id = "null";
                                         break;
                                     case "object":
                                         if ( prev == null ){
                                             old_id = "null";
                                         } else {
                                             old_id = prev._id;
                                             if( typeof(old_id) == "object" ) { // quick hack---not sure how old_id can be an object!
                                                 old_id = old_id._id;
                                             }
                                             if ( old_id == undefined ){
                                                 old_id = "null";
                                             }
                                         }
                                 }

                                 if ( base == _window ){
                                     parent_id = "window";
                                 } else {
                                     var parent_id = base._id;
                                     if( typeof(parent_id) == "object" ) { // quick hack---not sure how parent_id can be an object!
                                         parent_id = parent_id._id;
                                      }

                                     if ( parent_id == undefined ){
                                         parent_id = "null";
                                     }
                                 }
                                 if ( name != "_id" ){
                                     var log = {'OpType': 'WRITE', 'ParentId': parent_id, 'PropName': name, 'NewValId': new_id, 'OldValId': old_id, 'script': caller}
                                     //console.log( JSON.stringify( log ) );
                                     window.js_rewriting_logs.push(JSON.stringify(log));
                                 }
                                 base[name] = value;
                             }
                     };


    function makeProxy(base){
        if ( typeof(base) == "object" ){
            // already has id, so just return object
            if ( base.hasOwnProperty("_id") ) {
                return base;
            }
            // not a user defined object, so return value
            if ( base instanceof Date || base instanceof RegExp ||
                 base instanceof Array || base instanceof Number ||
                 base instanceof Node || base instanceof Element ||
                 base instanceof Error ){
                return base;
            }

            // user defined object, so return new proxy with new id
            var p = new Proxy( base, window_handler );
            Object.defineProperty(p, '_base', {
                enumerable: false,
                configurable: false,
                writable: false,
                value: base
            });
            Object.defineProperty(p, '_id', {
                enumerable: false,
                configurable: false,
                writable: false,
                value: window.proxy_counter
            });
            window.proxy_counter++;
            return p;
        } else {
            // not an object, so return value
            return base;
        }
    }
}
