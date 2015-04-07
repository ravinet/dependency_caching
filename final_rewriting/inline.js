if ( _window != undefined ) {
} else {
    var js_rewriting_logs = [];
    window.addEventListener("load", function(){
        var complete_log = "";
        for (i=0; i < window.js_rewriting_logs.length; i++ ){
            complete_log = complete_log + window.js_rewriting_logs[i] + "\n"
        }
        complete_log = complete_log + "END OF LOG";
        window.top.postMessage(complete_log, "*");
    });

    function get_caller(caller){
        var script_attributes = "";
        if ( caller == null ) {
            longname = window.location.pathname;
            if ( longname == "/" ) {
                script_attributes = "/";
            } else {
                script_attributes = longname.split('/').pop();
            }
            if ( script_attributes == "" ) {
                script_attributes = "event_handler_or_callback";
            }
        } else {
            var attr = caller.attributes;
            if( attr.length == 0 ) {
                longname = window.location.pathname;
                if ( longname == "/" ) {
                    script_attributes = "/";
                } else {
                    script_attributes = longname.split('/').pop();
                }
                if ( script_attributes == "" ) {
                    script_attributes = "inline_script";
                }
            } else {
                for(j=0; j < attr.length; j++) {
                    if( attr[j].name == "src" ) {
                        script_attributes = script_attributes.concat( attr[j].value );
                    }
                    if ( script_attributes == "" ) {
                        script_attributes = window.location.pathname;
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

    function check_if_proxy(val){
        var isProxy = false;
        var usemap = false;
        try {
            if ( typeof(val.hasOwnProperty) != "function" ) {
                // some objects passed as thisArg seem to have set hasOwnProperty to 'false' --> use 'in'
                if ( ("_base" in val) && ("_id" in val) ) {
                    isProxy = true;
                }
            } else {
                if ( (val.hasOwnProperty("_base")) && (val.hasOwnProperty("_id")) ) {
                    isProxy = true;
                }
            }
        } catch(err) {
            // likely an object from a different scope--> can't check _base!
            // this means that the object would not have been modified with makeProxy
            // since it would use makeProxy below which is also out of scope!
            // so it can be a proxy but has no _base/_id property (must check weakmap)
            if ( baseMap.has(val) ) { // this is a proxy and we must get base from weakmap!
                isProxy = true;
                usemap = true;
            }
        }
        return [isProxy, usemap];
    }

    var _xhropen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
        var async_use = async;
        if ( async == undefined ) {
            async_use = true;
        }
        var user_use = user;
        if ( user == undefined ) {
            user_use = "";
        }
        var password_use = password;
        if ( password == undefined ) {
            password_use = "";
        }

        // check whether this is proxy...if so, use _base or get base from weakmap
        var isProxy = check_if_proxy(this);
        var retVal;
        if ( isProxy[0] ) { // this is a proxy
            if ( isProxy[1] ) { // frozen object
                retVal = _xhropen.call(baseMap.get(this), method, url, async_use, user_use, password_use);
            } else {
                retVal = _xhropen.call(this._base, method, url, async_use, user_use, password_use);
            }
        } else {
            retVal = _xhropen.call(this, method, url, async_use, user_use, password_use);
        }

        return retVal;
    };

    var _xhrsetheader = XMLHttpRequest.prototype.setRequestHeader;
    XMLHttpRequest.prototype.setRequestHeader = function(header, value) {
        // check whether this is proxy...if so, use _base or get base from weakmap
        var isProxy = check_if_proxy(this);
        var retVal;
        if ( isProxy[0] ) { // this is a proxy
            if ( isProxy[1] ) { // frozen object
                retVal = _xhrsetheader.call(baseMap.get(this), header, value);
            } else {
                retVal = _xhrsetheader.call(this._base, header, value);
            }
        } else {
            retVal = _xhrsetheader.call(this, header, value);
        }
        return retVal;
    };

    var _xhrgetresponseheader = XMLHttpRequest.prototype.getResponseHeader;
    XMLHttpRequest.prototype.getResponseHeader = function(header) {
        // check whether this is proxy...if so, use _base or get base from weakmap
        var isProxy = check_if_proxy(this);
        var retVal;
        if ( isProxy[0] ) { // this is a proxy
            if ( isProxy[1] ) { // frozen object
                retVal = _xhrgetresponseheader.call(baseMap.get(this), header);
            } else {
                retVal = _xhrgetresponseheader.call(this._base, header);
            }
        } else {
            retVal = _xhrgetresponseheader.call(this, base, header);
        }
        return retVal;
    };

    var _xhrsend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function(data) {
        // check whether this is proxy...if so, use _base or get base from weakmap
        var isProxy = check_if_proxy(this);
        var retVal;
        if ( isProxy[0] ) { // this is a proxy
            if ( isProxy[1] ) { // frozen object
                if ( data == undefined ) {
                    retVal = _xhrsend.call(baseMap.get(this));
                } else {
                    retVal = _xhrsend.call(baseMap.get(this), data);
                }
            } else {
                if ( data == undefined ) {
                    retVal = _xhrsend.call(this._base);
                } else {
                    retVal = _xhrsend.call(this._base, data);
                }
            }
        } else {
            if ( data == undefined ) {
                retVal = _xhrsend.call(this);
            } else {
                retVal = _xhrsend.call(this, data);
            }
        }
        return retVal;
    };

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

    var _mutationobserve = MutationObserver.prototype.observe;
    MutationObserver.prototype.observe = function(target, options) {
        // check whether this is proxy...if so, use _base or get base from weakmap
        var isProxy = check_if_proxy(this);
        var retVal;
        if ( isProxy[0] ) { // this is a proxy
            if ( isProxy[1] ) { // frozen object
                retVal = _mutationobserve.call(baseMap.get(this), target, options);
            } else {
                retVal = _mutationobserve.call(this._base, target, options);
            }
        }
        return retVal;
    };

    var _eventtargetadd = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type, listener, capture, untrusted) {
        var untrusted_use = untrusted;
        if ( untrusted == undefined ) {
            // mdn page unclear about what defualt value is!
            untrusted_use = true;
        }
        var capture_use = capture;
        if ( capture == undefined ) {
            capture_use = false;
        }
        // check whether this is proxy...if so, use _base or get base from weakmap
        var isProxy = check_if_proxy(this);
        var retVal;
        if ( isProxy[0] ) { // this is a proxy
            if ( isProxy[1] ) { // frozen object
                retVal = _eventtargetadd.call(baseMap.get(this), type, listener, capture_use, untrusted_use);
            } else {
                retVal = _eventtargetadd.call(this._base, type, listener, capture_use, untrusted_use);
            }
        }
        return retVal;
    };

    var _getRandomValues = window.crypto.getRandomValues;
    window.crypto.getRandomValues = function(c) {
        var c_use = c;
        if ( c.hasOwnProperty("_id") ) {
            c_use = c._base;
        }
        return _getRandomValues.call(this, c_use);
    };

    var _eventtargetremove = EventTarget.prototype.removeEventListener;
    EventTarget.prototype.removeEventListener = function(type, listener, capture) {
        var capture_use = capture;
        if ( capture == undefined ) {
            capture_use = false;
        }
        // check whether this is proxy...if so, use _base or get base from weakmap
        var isProxy = check_if_proxy(this);
        var retVal;
        if ( isProxy[0] ) { // this is a proxy
            if ( isProxy[1] ) { // frozen object
                retVal = _eventtargetremove.call(baseMap.get(this), type, listener, capture_use);
            } else {
                retVal = _eventtargetremove.call(this._base, type, listener, capture_use);
            }
        }
        return retVal;
    };

    var _apply = Function.prototype.apply;
    Function.prototype.apply = function(thisArg, argArray){
        if(typeof(thisArg) != "object"){
            // convert passed primititve to corresponding wrapper type
            switch(typeof(thisArg)){
                case "number":
                    thisArg = new Number(thisArg);
                    break;
                case "string":
                    thisArg = new String(thisArg);
                    break;
                case "boolean":
                    thisArg = new Boolean(thisArg);
                    break;
                default:
                    //console.log( "apply() wrapper: unrecognized type for thisArg: " + typeof(thisArg) );
                    //throw ("Function.prototype.apply() wrapper: typeof(thisArg)=" + typeof(thisArg));
            }
        }

        // check if thisArg is proxy (need better test for this!)
        var isProxy = false;
        var usemap = false;
        var isProxy;
        if ( thisArg != null ) {
            isProxy = check_if_proxy(thisArg);
        }

        var retVal;

        argArray = argArray || []; //in case the caller did not specify an argArray

        //Remember that "this" is a function object!
        this._apply = _apply;

        if(isProxy[0]){
            if ( isProxy[1] ) { // can't call _base to get underlying base object
                retVal = this._apply(baseMap.get(thisArg), argArray);
            } else {
                retVal = this._apply(thisArg._base, argArray);
            }
        } else{
            retVal = this._apply(thisArg, argArray);
        }

        delete this._apply; // ensure app won't see extra properties on function
        return retVal;
    }

    // wrapper for Function.prototype.call() defined using apply() wrapper
    Function.prototype.call = function(thisArg){
        var argArray = [];
        for(var i = 1; i < arguments.length; i++){
            argArray.push(arguments[i]);
        }

        //Remember that "this" is a function object!
        return this.apply(thisArg, argArray);
    }

    function isNativeCodeFunc(f){
        try { // wrap in try because some functions produce errors with toString?
            var srcCode = f.toString();
        } catch(err) {
            console.log( "Error using toString() to check if function is native function" );
            return false;
        }
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

    // WeakMap for objects which are frozen
    var idMap = new WeakMap();
    // WeakMap to associate proxies with their frozen object bases (for wrappers)
    var baseMap = new WeakMap();

    // object handler for proxies
    var window_handler = {
                      "get": function(base, name){
                                 var value = base[name];
                                 var native_func = false;
                                 if ( typeof(value) == "function" ) {
                                     native_func = isNativeCodeFunc(value);
                                 }
                                 var bound_value;
                                 if (native_func && (base == window)) {
                                     bound_value = value.bind(_window);
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

                             try {
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
                                                 // check if object was frozen (check WeakMap for id)
                                                 if ( idMap.has( value ) ) { // object is in WeakMap!
                                                     old_id = idMap.get( value )[0];
                                                 }
                                             }
                                         }
                                 }

                                 if ( base == _window ){
                                     parent_id = "window";
                                 } else {
                                     parent_id = base._id;
                                     if ( parent_id == undefined ){
                                         parent_id = "null";
                                         // check if object was frozen (check WeakMap for id)
                                         if ( idMap.has( base ) ) { // object is in WeakMap!
                                             parent_id = idMap.get( base )[0];
                                         }
                                     }
                                 }
                                 var new_id = "null";
                                 if ( name != "_id" ){
                                     var log = {'OpType': 'READ', 'ParentId': parent_id, 'PropName': name, 'NewValId': new_id, 'OldValId': old_id, 'script': caller};
                                     //console.log( JSON.stringify( log ) );
                                     window.js_rewriting_logs.push(JSON.stringify(log));
                                 }
                                 return value;
                             } catch( err ) {
                                 console.log("Cross-origin access from proxy handler caused exception");
                                 return value;
                             }
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
                                                 // check if object was frozen (check WeakMap for id)
                                                 if ( idMap.has( value ) ) { // object is in WeakMap!
                                                     new_id = idMap.get( value )[0];
                                                 }
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
                                                 // check if object was frozen (check WeakMap for id)
                                                 // should this check (and the ones above) just check if obj is frozen
                                                 // rather than checking if it is in the WeakMap?
                                                 if ( idMap.has( prev ) ) { // object is in WeakMap!
                                                     old_id = idMap.get( prev )[0];
                                                 }
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
                                         // check if object was frozen (check WeakMap for id)
                                         if ( idMap.has( base ) ) { // object is in WeakMap!
                                             parent_id = idMap.get( base )[0];
                                         }
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

            // user defined object, so add logging and return either proxy or base
            if ( !Object.isFrozen(base) ) { // object not frozen, add logging props
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
            } else { // object frozen, add to weak map for logging
                var p = new Proxy( base, window_handler );
                var map_val = [window.proxy_counter, base];
                idMap.set( base, map_val );
                baseMap.set( p, base );
                window.proxy_counter++;
                return p;
            }
        } else {
            // not an object, so return value
            return base;
        }
    }
}
