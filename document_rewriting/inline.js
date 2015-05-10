if ( _document != undefined ) {
    // add the html logs (which are listed under the 'htmllogs' attribute of this script) to the complete logs list
    var logs_html = document.currentScript.getAttribute("htmllogs").split("\n");
    for ( j = 0; j < logs_html.length; j++ ) {
        window.js_rewriting_logs.push(logs_html[j]);
    }
} else {
    var js_rewriting_logs = [];
    // add the html logs (which are listed under the 'htmllogs' attribute of this script) to the complete logs list
    var logs_html = document.currentScript.getAttribute("htmllogs").split("\n");
    for ( j = 0; j < logs_html.length; j++ ) {
        window.js_rewriting_logs.push(logs_html[j]);
    }
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

    function list_properties(properties){
        var props = "";
        for (var key in properties){
            props = props.concat(key + ":" + properties[key] + ", ");
        }
        props = props.slice(0, props.length-2);
        return props;
    }

    function list_properties_array(properties){
        var props = "";
        for (j = 0; j < properties.length; j++){
            var arr = properties[j];
            for (i = 0; i < arr.length; i++){
                props = props.concat(arr[i] + ", ");
            }
            props = props.slice(0, props.length-2);
            props = props + ";";
        }
        props = props.slice(0, props.length-1);
        return props;
    }

    function print_single_attr(child_attributes){
        if ( child_attributes == null ) {
            return "";
        }
        var final_attributes = "";
        for (y=0; y<child_attributes.length; y++){
            final_attributes = final_attributes.concat(child_attributes[y] + "; ");
        }
        final_attributes = final_attributes.slice(0, final_attributes.length-2);
        return final_attributes;
    }

    function print_multiple_attr(child_attributes){
        if ( child_attributes == null ) {
            return "";
        }
        var final_attributes = "";
        for (var key in child_attributes){
            final_attributes = final_attributes.concat(key + "-");
            var current_attributes = child_attributes[key];
            for (y=0; y<current_attributes.length; y++){
                final_attributes = final_attributes.concat(current_attributes[y] + "; ");
            }
        }
        final_attributes = final_attributes.slice(0, final_attributes.length-2);
        return final_attributes;
    }

    function print_nodes(parents){
        var nodes = "";
        for (var key in parents) {
            nodes = nodes.concat(parents[key] +",");
        }
        nodes = nodes.slice(0, nodes.length-1);
        return nodes;
    }

    function get_child_path(curr){
        if ( curr == null ) {
            return [null, null];
        }
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

    function get_multi_child_path(retVal){
        if ( retVal == null ) {
            return [null, null];
        }
        curr = retVal;
        parents = {};
        child_paths = {};
        child_paths_no_id = [];
        child_path_tags_no_id = [];
        child_path_tags = {};
        for (i = 0; i < retVal.length; i++) {
            curr_child_path = [];
            curr_child_path_tags = [];
            curr_parents = [];
            curr = retVal[i];
            while ( curr.parentNode != null ) {
                curr_parents.push(curr.parentNode.id);
                var children = curr.parentNode.children;
                for (j = 0; j < children.length; j++){
                    if( children[j] == curr ){
                        curr_child_path.push(j);
                        curr_child_path_tags.push(children[j].tagName);
                    }
                }
                curr = curr.parentNode;
            }
            parents[retVal[i].id] = curr_parents;
            child_paths[retVal[i].id] = curr_child_path;
            child_paths_no_id.push(curr_child_path);
            child_path_tags[retVal[i].id] = curr_child_path_tags;
            child_path_tags_no_id.push(curr_child_path_tags);
        }
        ret = [child_paths_no_id, child_path_tags_no_id];
        return ret;
    }

    // id counter for DOM nodes
    window.proxy_counter = 0;

    // list of Node.prototype functions which we wrap (don't need proxies to log)
    var wrapped_functions = ["appendChild", "replaceChild", "removeChild", "insertBefore", "hasOwnProperty",
                             "compareDocumentPosition", "cloneNode", "contains", "hasChildNodes",
                             "isDefaultNamespace", "isEqualNode", "lookupNamespaceURI", "normalize",
                             "getElementsByClassName", "getAttribute", "getAttributeNS", "getAttributeNode",
                             "getAttributeNodeNS", "getBoundingClientRect", "getClientRects", "getElementsByClassName",
                             "getElementsByTagName", "getElementsByTagNameNS", "hasAttribute", "hasAttributeNS", "hasAttributes",
                             "insertAdjacentHTML", "querySelector", "querySelectorAll", "matches", "removeAttribute",
                             "removeAttributeNS", "removeAttributeNode", "setAttribute", "setAttributeNS",
                             "setAttributeNode", "setAttributeNodeNS", "lookupPrefix"];

    // proxy to track recursive reads/writes for DOM nodes
    node_handler = {
        "get": function(base, name){
                    var value = base[name];
                    if ( (name != "_base") && (name != "_id")  && (wrapped_functions.indexOf(name) == -1) ) {
                        var caller = get_caller(document.currentScript);
                        var stack = new Error().stack.split("\n")[1].split(":");
                        var line = stack[stack.length - 2];
                        var base_child_vals = get_child_path(base);
                        var base_child_path = print_nodes(base_child_vals[0]);
                        var log3 = {'OpType': 'READ', 'method': "null", 'PropName': dom_var_name(base_child_path), 'NodeProp': name, 'id': base._id, 'child_path': base_child_path, 'script': caller, 'OrigLine': line}
                        window.js_rewriting_logs.push(JSON.stringify(log3));
                    }
                    return value;
        },
        "set": function(base, name, value){
                    base[name] = value;
                    if ( (name != "_base") && (name != "_id") ) {
                        var caller = get_caller(document.currentScript);
                        var stack = new Error().stack.split("\n")[1].split(":");
                        var line = stack[stack.length - 2];
                        var base_child_vals = get_child_path(base);
                        var base_child_path = print_nodes(base_child_vals[0]);
                        var log3 = {'OpType': 'WRITE', 'method': "null", 'PropName': dom_var_name(base_child_path), 'NodeProp': name, 'id': base._id, 'child_path': base_child_path, 'script': caller, 'OrigLine': line}
                        window.js_rewriting_logs.push(JSON.stringify(log3));
                    }
        }
    };

    // proxy to track offsetNode calls to caretPositions
    caret_handler = {
        "get": function(base, name){
                    var value = base[name];
                    if ( name == "offsetNode" ) {
                        var p = wrap_node_in_proxy(value);
                        if ( value != null ) {
                            var caller = get_caller(document.currentScript);
                            var stack = new Error().stack.split("\n")[1].split(":");
                            var line = stack[stack.length - 2];
                            var ret_child_vals = get_child_path(value);
                            var ret_child_path = print_nodes(ret_child_vals[0]);
                            var log3 = {'OpType': 'READ', 'method': "null", 'PropName': dom_var_name(ret_child_path), 'NodeProp': "null", 'id': p[1], 'child_path': ret_child_path, 'script': caller, 'OrigLine': line}
                            window.js_rewriting_logs.push(JSON.stringify(log3));
                        }
                    }
                    return value;
        }
    };

    // handler for NodeLists
    nodelist_handler = {
        "get": function(base, index){
                    var value = base[index];
                    var caller = get_caller(document.currentScript);
                    var stack = new Error().stack.split("\n")[1].split(":");
                    var line = stack[stack.length - 2];
                    if ( index == "hasOwnProperty" ) {
                        return value;
                    }
                    if ( typeof(value) == "function" ) {
                        var functionproxy = function(i) {
                            var caller = get_caller(document.currentScript);
                            var stack = new Error().stack.split("\n")[1].split(":");
                            var line = stack[stack.length - 2];
                            var this_val = this;
                            if ( this.hasOwnProperty("_base") ) {
                                this_val = this._base;
                            }
                            var retVal = value.call(this_val, i);
                            if ( retVal == null ) {
                                return retVal;
                            } else {
                                var p = wrap_node_in_proxy(retVal);
                                var ret_child_vals = get_child_path(retVal);
                                var ret_child_path = print_nodes(ret_child_vals[0]);
                                var log3 = {'OpType': 'READ', 'method': "null", 'PropName': dom_var_name(ret_child_path), 'NodeProp': "null", 'id': p[1], 'child_path': ret_child_path, 'script': caller, 'OrigLine': line}
                                window.js_rewriting_logs.push(JSON.stringify(log3));
                                return p[0];
                            }
                       };
                       return functionproxy;
                    } else {
                        if ( (index != "_base") && (index != "_id")  && (wrapped_functions.indexOf(index) == -1) && (typeof(value) == "object")) {
                            var p = wrap_node_in_proxy(value);
                            if ( value != null ) {
                                var ret_child_vals = get_child_path(p[0]._base);
                                var ret_child_path = print_nodes(ret_child_vals[0]);
                                var stack = new Error().stack.split("\n")[1].split(":");
                                var line = stack[stack.length - 2];
                                var log3 = {'OpType': 'READ', 'method': "null", 'PropName': dom_var_name(ret_child_path), 'NodeProp': "null", 'id': p[1], 'child_path': ret_child_path, 'script': caller, 'OrigLine': line}
                                window.js_rewriting_logs.push(JSON.stringify(log3));
                            }
                            return p[0];
                        }
                        return value;
                    }
        }
    };

    // handler for NodeIterators
    iterator_nodeprops = ["referenceNode", "root"];
    nodeiterator_handler = {
        "get": function(base, name){
                    var value = base[name];
                    var caller = get_caller(document.currentScript);
                    var stack = new Error().stack.split("\n")[1].split(":");
                    var line = stack[stack.length - 2];
                    if ( name == "hasOwnProperty" ) {
                        return value;
                    }
                    if ( typeof(value) == "function" ) {
                        var functionproxy = function() {
                            var caller = get_caller(document.currentScript);
                            var stack = new Error().stack.split("\n")[1].split(":");
                            var line = stack[stack.length - 2];
                            var this_val = this;
                            if ( this.hasOwnProperty("_base") ) {
                                this_val = this._base;
                            }
                            var retVal = value.call(this_val);
                            if ( retVal == null ) {
                                return retVal;
                            } else {
                                var p = wrap_node_in_proxy(retVal);
                                var ret_child_vals = get_child_path(retVal);
                                var ret_child_path = print_nodes(ret_child_vals[0]);
                                var log3 = {'OpType': 'READ', 'method': "null", 'PropName': dom_var_name(ret_child_path), 'NodeProp': "null", 'id': p[1], 'child_path': ret_child_path, 'script': caller, 'OrigLine': line}
                                window.js_rewriting_logs.push(JSON.stringify(log3));
                                return p[0];
                            }
                       };
                       return functionproxy;
                    } else {
                        if ( (iterator_nodeprops.indexOf(name) != -1 ) && (typeof(value) == "object")) {
                            var p = wrap_node_in_proxy(value);
                            if ( value != null ) {
                                var stack = new Error().stack.split("\n")[1].split(":");
                                var line = stack[stack.length - 2];
                                var ret_child_vals = get_child_path(p[0]._base);
                                var ret_child_path = print_nodes(ret_child_vals[0]);
                                var log3 = {'OpType': 'READ', 'method': "null", 'PropName': dom_var_name(ret_child_path), 'NodeProp': "null", 'id': p[1], 'child_path': ret_child_path, 'script': caller, 'OrigLine': line}
                                window.js_rewriting_logs.push(JSON.stringify(log3));
                            }
                            return p[0];
                        }
                        return value;
                    }
        }
    };

    function dom_var_name(string_path) {
        var ret = "$$dom.";
        var parts = string_path.split(",");
        for (var i = 0; i < parts.length; i++ ) {
            ret = ret + parts[i] + ".";
        }
        ret = ret.slice(0, ret.length - 1 );
        return ret;
    }

    function wrap_node_in_proxy(domnode) {
        // maybe check if it is an element?
        // if it has id, return
        if ( domnode == null ) {
            return [domnode, "null"];
        }
        if ( domnode.hasOwnProperty("_id") ) {
            var retnode = new Proxy( domnode, node_handler );
            return [retnode, domnode._id];
        }

        // it is not already a proxy!
        var p = new Proxy(domnode, node_handler);
        Object.defineProperty(p, '_base', {
            enumerable: false,
            configurable: false,
            writable: false,
            value: domnode
        });
        Object.defineProperty(p, '_id', {
            enumerable: false,
            configurable: false,
            writable: false,
            value: window.proxy_counter
        });
        var ret = [p, window.proxy_counter];
        window.proxy_counter++;
        return ret;
    }

    // function which returns ids for children of argument
    function get_children_ids(node) {
        var children = node.childNodes;
        children_ids = []
        for ( var i = 0; i < children.length; i++ ) {
            // for each child, get the id (if no id, make proxy and return id)
            if ( children[i].hasOwnProperty("_id") ) {
                children_ids.push(children[i]._id);
            }
        }
        return children_ids;
    }

    // function which returns _id of the last child
    function get_last_child_id(node) {
        var lastchild = node.lastChild;
        if ( lastchild == null ) {
            return "null";
        }
        if ( lastchild.hasOwnProperty("_id") ) {
            return lastchild._id;
        } else {
            return "null";
        }
    }

    // function which returns _id of the last child
    function get_parent_id(node) {
        var parentnode = node.parentNode;
        if ( parentnode == null ) {
            return "null";
        }
        if ( parentnode.hasOwnProperty("_id") ) {
            return parentnode._id;
        } else {
            var p = wrap_node_in_proxy(parentnode);
            return p[1];
        }
    }

    // function which returns _id of previousSibling
    function get_prev_child_id(node) {
        var prevchild = node.previousSibling;
        if ( prevchild == null ) {
            return "null";
        }
        if ( prevchild.hasOwnProperty("_id") ) {
            return prevchild._id;
        } else {
            var p = wrap_node_in_proxy(prevchild);
            return p[1];
        }
    }

    // function which returns _id of nextSibling
    function get_next_child_id(node) {
        var nextchild = node.nextSibling;
        if ( nextchild == null ) {
            return "null";
        }
        if ( nextchild.hasOwnProperty("_id") ) {
            return nextchild._id;
        } else {
            var p = wrap_node_in_proxy(nextchild);
            return p[1];
        }
    }

    function get_subtree_nodes(argnode) {
        // returns a list of nodes and list of ids which are in subtree of argument node
        // wraps nodes in proxies (and assigns ids) if not previously wrapped (ids are preserved outside of this function)
        if ( argnode == null ) {
            return [[],[],[]];
        }
        arg_val = argnode;
        if ( argnode.hasOwnProperty("_id") ) {
            arg_val = argnode._base;
        }

        var walker = document.createTreeWalker(arg_val);

        var node;
        var subtree_ids = [];
        var subtree_nodes = [];
        var subtree_childpaths = [];

        while(node = walker.nextNode()) {
            if ( node == null ) {
                console.log("null value in TreeWalker");
                continue;
            }

            if ( node.hasOwnProperty("_id") ) {
                subtree_ids.push(node._id);
                subtree_nodes.push(node._base);
                subtree_childpaths.push(print_nodes(get_child_path(node._base)[0]));
            } else {
                var p = wrap_node_in_proxy(node);
                subtree_ids.push(p[1]);
                subtree_nodes.push(p[0]);
                subtree_childpaths.push(print_nodes(get_child_path(p[0])[0]));
            }
        }
        return [subtree_ids, subtree_nodes, subtree_childpaths];
    }

    function get_subtree_textnodes(argnode) {
        // returns a list of nodes and ids for textnodes in subtree of argument node
        // wraps nodes in proxies (and assigns ids) if not previously wrapped (ids are preserved outside of this function)
        arg_val = argnode;
        if ( argnode.hasOwnProperty("_id") ) {
            arg_val = argnode._base;
        }

        var walker = document.createTreeWalker(arg_val);

        var node;
        var subtree_ids = [];
        var subtree_nodes = [];
        var subtree_childpaths = [];

        while(node = walker.nextNode()) {
            if ( node == null ) {
                console.log("null value in TreeWalker");
                continue;
            }

            if ( node.hasOwnProperty("_id") ) {
                if ( node instanceof Text ) {
                    subtree_ids.push(node._id);
                    subtree_nodes.push(node._base);
                    subtree_childpaths.push(print_nodes(get_child_path(node._base)[0]));
                }
            } else {
                if ( node instanceof Text ) {
                    var p = wrap_node_in_proxy(node);
                    subtree_ids.push(p[1]);
                    subtree_nodes.push(p[0]);
                    subtree_childpaths.push(print_nodes(get_child_path(p[0])[0]));
                }
            }
        }
        return [subtree_ids, subtree_nodes, subtree_childpaths];
    }

    // function to get ids and childpaths of nextSiblings until null (common if we remove node since their paths will change)
    function get_next_siblings(argnode) {
        var ids = [];
        var childpaths = [];
        var nodes = [];
        if ( argnode == null ) {
            return [[],[],[]];
        }
        var next = argnode.nextSibling;
        while ( next != null ) {
            var x = argnode.nextSibling;
            if ( x.hasOwnProperty("_id") ) {
                ids.push(x._id);
                childpaths.push(print_nodes(get_child_path(x._base)[0]));
                nodes.push(x._base);
            } else {
                var p = wrap_node_in_proxy(x);
                ids.push(p[1]);
                childpaths.push(print_nodes(get_child_path(p[0])[0]));
                nodes.push(p[0]);
            }
            next = next.nextSibling;
        }
        return [ids, childpaths, nodes];
    }

// Node shims

    var _appendChild = Node.prototype.appendChild;
    Node.prototype.appendChild = function(child){
        // add child as child to this in DOM tree (return added child)
        var arg1_val = child;
        var arg1_id = "null";
        var this_id = "null";
        var this_val = this;
        if ( child.hasOwnProperty("_id") ) {
            arg1_id = child._id;
            arg1_val = child._base;
        }
        var arg1_childpath = print_nodes(get_child_path(arg1_val)[0]);
        if ( this.hasOwnProperty("_id") ) {
            this_id = this._id;
            this_val = this._base;
        } else {
            console.log( "Calling appendChild on DOM node which is not proxy" );
        }
        var caller = get_caller(document.currentScript);
        var stack = new Error().stack.split("\n")[1].split(":");
        var line = stack[stack.length - 2];
        var this_child_vals = get_child_path(this_val);
        var this_child_path = print_nodes(this_child_vals[0]);
        // check if we need to log nextSibling of 'this' nodes prev lastChild
        var log_nextsibl_this_last_child = false;
        var nextsibl_this_last_child_id = "null";
        var nextsibl_this_last_child_val = this_val.lastChild;
        var nextsibl_this_last_child_path = "null";
        if ( this_val.lastChild != null ) {
            // should we wrap it???
            log_nextsibl_this_last_child = true;
            if ( nextsibl_this_last_child_val.hasOwnProperty("_id") ) {
                nextsibl_this_last_child_id = this_val.lastChild.id;
                nextsibl_this_last_child_val = this_val.lastChild._base;
                nextsibl_this_last_child_path = print_nodes(get_child_path(nextsibl_this_last_child_val)[0]);
            } else {
                nextsibl_this_last_child_val = this_val.lastChild;
                nextsibl_this_last_child_path = print_nodes(get_child_path(nextsibl_this_last_child_val)[0]);
            }
        }
        // check if we will need to log firstChild of 'this' node
        var log_this_first_child = false;
        if ( this_val.firstChild == null ) {
            log_this_first_child = true;
        }
        // check if argument node already exists in DOM tree
        //var exists = document.getElementById(arg1_val);
        var exists = _contains.call(document, arg1_val);
        var prior_subtree = [];
        var arg_prevsibl_id = "null";
        var arg_prevsibl_childpath = "";
        var arg_nextsibl_id = "null";
        var arg_nextsibl_childpath = "";
        var nextsiblings = "";
        var arg_prevparent_id = "null";
        var arg_prevparent_childpath = "";
        var log_prevparent_firstchild = false;
        var log_prevparent_lastchild = false;
        if ( exists ) { // node existed previously
            prior_subtree = get_subtree_nodes(arg1_val);
            var y = arg1_val.previousSibling;
            if ( y == null ) {
            } else if ( y.hasOwnProperty("_id") ) {
                arg_prevsibl_id = y._id;
                arg_prevsibl_childpath = print_nodes(get_child_path(y._base)[0]);
            } else {
                arg_prevsibl_childpath = print_nodes(get_child_path(y)[0]);
            }
            var z = arg1_val.nextSibling;
            if ( z == null ) {
            } else if ( z.hasOwnProperty("_id") ) {
                arg_nextsibl_id = z._id;
                arg_nextsibl_childpath = print_nodes(get_child_path(z._base)[0]);
            } else {
                arg_nextsibl_childpath = print_nodes(get_child_path(z)[0]);
            }
            nextsiblings = get_next_siblings(arg1_val);
            var t = arg1_val.parentNode;
            if ( t != null ) {
                if ( t.hasOwnProperty("_id") ) {
                    arg_prevparent_id = t._id;
                    arg_prevparent_childpath = print_nodes(get_child_path(t._base)[0]);
                } else {
                    arg_prevparent_id = "null";
                    arg_prevparent_childpath = print_nodes(get_child_path(t)[0]);
                }
            }
            var f = t.firstChild; var l = t.lastChild;
            var f_val = f; var l_val = l;
            if ( f.hasOwnProperty("_id") ) {
                f_val = f._base;
                l_val = l._base;
            }
            if ( f_val == arg1_val ) {
                log_prevparent_firstchild = true;
            }
            if ( l_val == arg1_val ) {
                log_prevparent_lastchild = true;
            }
        }
        var children = get_children_ids(this_val);
        var lastchild_id = get_last_child_id(this_val);
        var retVal = _appendChild.call(this_val, arg1_val);
        var p = wrap_node_in_proxy(retVal);
        var post_subtree = get_subtree_nodes(p[0]._base);

        // read on 'this' node
        var log1 = {'OpType': 'READ', 'method': "appendChild", 'PropName': dom_var_name(this_child_path), 'NodeProp': "null", 'id': p[1], 'child_path': this_child_path, 'script': caller, 'OrigLine': line}
        window.js_rewriting_logs.push(JSON.stringify(log1));
        // write on childNodes property of 'this' node
        var log2 = {'OpType': 'WRITE', 'method': "appendChild", 'PropName': dom_var_name(this_child_path), 'NodeProp': "childNodes", 'id': p[1], 'child_path': this_child_path, 'script': caller, 'OrigLine': line}
        window.js_rewriting_logs.push(JSON.stringify(log2));
        // write on lastChild property of 'this' node
        var log3 = {'OpType': 'WRITE', 'method': "appendChild", 'PropName': dom_var_name(this_child_path), 'NodeProp': "lastChild", 'id': p[1], 'child_path': this_child_path, 'script': caller, 'OrigLine': line}
        window.js_rewriting_logs.push(JSON.stringify(log3));
        // maybe a write on the nextSibling property of 'this' node's previous lastChild
        if ( log_nextsibl_this_last_child ) {
            var log4 = {'OpType': 'WRITE', 'method': "appendChild", 'PropName': dom_var_name(nextsibl_this_last_child_path), 'NodeProp': "nextSibling", 'id': nextsibl_this_last_child_id, 'child_path': nextsibl_this_last_child_path, 'script': caller, 'OrigLine': line}
            window.js_rewriting_logs.push(JSON.stringify(log4));
        }
        // maybe a write on firstChild property of 'this' node
        if ( log_this_first_child ) {
            var log5 = {'OpType': 'WRITE', 'method': "appendChild", 'PropName': dom_var_name(this_child_path), 'NodeProp': "firstChild", 'id': p[1], 'child_path': this_child_path, 'script': caller, 'OrigLine': line}
            window.js_rewriting_logs.push(JSON.stringify(log5));
        }
        // only if node existed prior to this method call
        if ( exists ) {
            // if argnode previously exists in DOM, log writes to argnode and subtree
            var log6 = {'OpType': 'WRITE', 'method': "appendChild", 'PropName': dom_var_name(arg1_childpath), 'NodeProp': "null", 'id': arg1_id, 'child_path': arg1_childpath, 'script': caller, 'OrigLine': line}
            window.js_rewriting_logs.push(JSON.stringify(log6));
            for ( i = 0; i < prior_subtree[1].length; i++ ) {
                var log6 = {'OpType': 'WRITE', 'method': "appendChild", 'PropName': dom_var_name(prior_subtree[2][i]), 'NodeProp': "null", 'id': prior_subtree[0][i], 'child_path': prior_subtree[2][i], 'script': caller, 'OrigLine': line}
                window.js_rewriting_logs.push(JSON.stringify(log6));
            }
            // if argnode previously exists in DOM, log writes to prev and next sibl of argnode
            if ( arg_prevsibl_childpath != "" ) {
                var log7 = {'OpType': 'WRITE', 'method': "appendChild", 'PropName': dom_var_name(arg_prevsibl_childpath), 'NodeProp': "nextSibling", 'id': arg_prevsibl_id, 'child_path': arg_prevsibl_childpath, 'script': caller, 'OrigLine': line}
                window.js_rewriting_logs.push(JSON.stringify(log7));
            }
            if ( arg_nextsibl_childpath != "" ) {
                var log7 = {'OpType': 'WRITE', 'method': "appendChild", 'PropName': dom_var_name(arg_nextsibl_childpath), 'NodeProp': "previousSibling", 'id': arg_nextsibl_id, 'child_path': arg_nextsibl_childpath, 'script': caller, 'OrigLine': line}
                window.js_rewriting_logs.push(JSON.stringify(log7));
            }
            // if argnode previously exists in DOM, log writes to nextsiblings of 'this' until null (with subtrees)
            for ( i = 0; i < nextsiblings[0].length; i++ ) {
                var log8 = {'OpType': 'WRITE', 'method': "appendChild", 'PropName': dom_var_name(nextsiblings[1][i]), 'NodeProp': "null", 'id': nextsiblings[0][i], 'child_path': nextsiblings[1][i], 'script': caller, 'OrigLine': line}
                window.js_rewriting_logs.push(JSON.stringify(log8));
                var curr_subtree = get_subtree_nodes(nextsiblings[2][i]);
                for ( j = 0; j < curr_subtree[1].length; j++ ) {
                    var log6 = {'OpType': 'WRITE', 'method': "appendChild", 'PropName': dom_var_name(curr_subtree[2][j]), 'NodeProp': "null", 'id': curr_subtree[0][j], 'child_path': curr_subtree[2][j], 'script': caller, 'OrigLine': line};
                    window.js_rewriting_logs.push(JSON.stringify(log6));
                }
            }
            // if argnode previously exists in DOM, maybe log writes to first and lastChild of argnode's parent, definitely childNodes
            var log9 = {'OpType': 'WRITE', 'method': "appendChild", 'PropName': dom_var_name(arg_prevparent_childpath), 'NodeProp': "childNodes", 'id': arg_prevparent_id, 'child_path': arg_prevparent_childpath, 'script': caller, 'OrigLine': line}
            window.js_rewriting_logs.push(JSON.stringify(log9));
            if ( log_prevparent_firstchild ) {
                var log10 = {'OpType': 'WRITE', 'method': "appendChild", 'PropName': dom_var_name(arg_prevparent_childpath), 'NodeProp': "firstChild", 'id': arg_prevparent_id, 'child_path': arg_prevparent_childpath, 'script': caller, 'OrigLine': line}
                window.js_rewriting_logs.push(JSON.stringify(log10));
            }
            if ( log_prevparent_lastchild ) {
                var log10 = {'OpType': 'WRITE', 'method': "appendChild", 'PropName': dom_var_name(arg_prevparent_childpath), 'NodeProp': "lastChild", 'id': arg_prevparent_id, 'child_path': arg_prevparent_childpath, 'script': caller, 'OrigLine': line}
                window.js_rewriting_logs.push(JSON.stringify(log10));
            }
        }
        // log writes for argnode and subtree after call
        for ( i = 0; i < post_subtree[1].length; i++ ) {
            var log10 = {'OpType': 'WRITE', 'method': "appendChild", 'PropName': dom_var_name(post_subtree[2][i]), 'NodeProp': "null", 'id': post_subtree[0][i], 'child_path': post_subtree[2][i], 'script': caller, 'OrigLine': line}
            window.js_rewriting_logs.push(JSON.stringify(log10));
        }
        return p[0];
    };

    var _removeChild = Node.prototype.removeChild;
    Node.prototype.removeChild = function(child){
        // remove child from this in DOM tree (return removed child)
        var arg1_val = child;
        var arg1_id = "null";
        var this_id = "null";
        var this_val = this;
        if ( child.hasOwnProperty("_id") ) {
            arg1_id = child._id;
            arg1_val = child._base;
        }
        var arg1_childpath = print_nodes(get_child_path(arg1_val)[0]);
        if ( this.hasOwnProperty("_id") ) {
            this_id = this._id;
            this_val = this._base;
        } else {
            console.log( "Calling removeChild on DOM node which is not proxy" );
        }
        var caller = get_caller(document.currentScript);
        var stack = new Error().stack.split("\n")[1].split(":");
        var line = stack[stack.length - 2];
        var this_child_vals = get_child_path(this_val);
        var this_child_path = print_nodes(this_child_vals[0]);

        // check if we will need to log firstChild or lastChild of 'this' node
        var x = this_val.firstChild; var y = this_val.lastChild;
        var log_this_last_child = false;
        var log_this_first_child = false;
        if ( x.hasOwnProperty("_id") ) {
            if ( x._base == arg1_val ) {
                log_this_first_child = true;
            }
        } else {
            if ( x == arg1_val ) {
                log_this_first_child = true;
            }
        }
        if ( y.hasOwnProperty("_id") ) {
            if ( y._base == arg1_val ) {
                log_this_last_child = true;
            }
        } else {
            if ( y == arg1_val ) {
                log_this_last_child = true;
            }
        }

        var arg_prevsibl_id = "null";
        var arg_prevsibl_childpath = "";
        var arg_nextsibl_id = "null";
        var arg_nextsibl_childpath = "";
        var nextsiblings = "";
        var arg_prevparent_id = "null";
        var arg_prevparent_childpath = "";
        var log_prevparent_firstchild = false;
        var log_prevparent_lastchild = false;
        prior_subtree = get_subtree_nodes(arg1_val);
        var y = arg1_val.previousSibling;
        if ( y == null ) {
        } else if ( y.hasOwnProperty("_id") ) {
            arg_prevsibl_id = y._id;
            arg_prevsibl_childpath = print_nodes(get_child_path(y._base)[0]);
        } else {
            arg_prevsibl_childpath = print_nodes(get_child_path(y)[0]);
        }
        var z = arg1_val.nextSibling;
        if ( z == null ) {
        } else if ( z.hasOwnProperty("_id") ) {
            arg_nextsibl_id = z._id;
            arg_nextsibl_childpath = print_nodes(get_child_path(z._base)[0]);
        } else {
            arg_nextsibl_childpath = print_nodes(get_child_path(z)[0]);
        }
        nextsiblings = get_next_siblings(arg1_val);
        var t = arg1_val.parentNode;
        if ( t != null ) {
            if ( t.hasOwnProperty("_id") ) {
                arg_prevparent_id = t._id;
                arg_prevparent_childpath = print_nodes(get_child_path(t._base)[0]);
            } else {
                arg_prevparent_id = "null";
                arg_prevparent_childpath = print_nodes(get_child_path(t)[0]);
            }
        }

        var prevchild_id = get_prev_child_id(arg1_val);
        var nextchild_id = get_next_child_id(arg1_val);
        var retVal = _removeChild.call(this_val, arg1_val);
        var p = wrap_node_in_proxy(retVal);

        // read on 'this' node
        var log1 = {'OpType': 'READ', 'method': "removeChild", 'PropName': dom_var_name(this_child_path), 'NodeProp': "null", 'id': this_id, 'child_path': this_child_path, 'script': caller, 'OrigLine': line};
        window.js_rewriting_logs.push(JSON.stringify(log1));
        // write on childNodes property of 'this' node
        var log2 = {'OpType': 'WRITE', 'method': "removeChild", 'PropName': dom_var_name(this_child_path), 'NodeProp': "childNodes", 'id': this_id, 'child_path': this_child_path, 'script': caller, 'OrigLine': line};
        window.js_rewriting_logs.push(JSON.stringify(log2));
        // maybe write on lastChild property of 'this' node
        if ( log_this_last_child ) {
            var log3 = {'OpType': 'WRITE', 'method': "removeChild", 'PropName': dom_var_name(this_child_path), 'NodeProp': "lastChild", 'id': this_id, 'child_path': this_child_path, 'script': caller, 'OrigLine': line};
            window.js_rewriting_logs.push(JSON.stringify(log3));
        }
        // maybe a write on firstChild property of 'this' node
        if ( log_this_first_child ) {
            var log5 = {'OpType': 'WRITE', 'method': "removeChild", 'PropName': dom_var_name(this_child_path), 'NodeProp': "firstChild", 'id': this_id, 'child_path': this_child_path, 'script': caller, 'OrigLine': line};
            window.js_rewriting_logs.push(JSON.stringify(log5));
        }
        // log writes to prev and next sibl of argnode
        if ( arg_prevsibl_childpath != "" ) {
            var log7 = {'OpType': 'WRITE', 'method': "removeChild", 'PropName': dom_var_name(arg_prevsibl_childpath), 'NodeProp': "nextSibling", 'id': arg_prevsibl_id, 'child_path': arg_prevsibl_childpath, 'script': caller, 'OrigLine': line};
            window.js_rewriting_logs.push(JSON.stringify(log7));
        }
        if ( arg_nextsibl_childpath != "" ) {
            var log7 = {'OpType': 'WRITE', 'method': "removeChild", 'PropName': dom_var_name(arg_nextsibl_childpath), 'NodeProp': "previousSibling", 'id': arg_nextsibl_id, 'child_path': arg_nextsibl_childpath, 'script': caller, 'OrigLine': line};
            window.js_rewriting_logs.push(JSON.stringify(log7));
        }
        // log writes to nextsiblings of 'this' until null (and subtrees)
        for ( i = 0; i < nextsiblings[0].length; i++ ) {
            var log8 = {'OpType': 'WRITE', 'method': "removeChild", 'PropName': dom_var_name(nextsiblings[1][i]), 'NodeProp': "null", 'id': nextsiblings[0][i], 'child_path': nextsiblings[1][i], 'script': caller, 'OrigLine': line}
            window.js_rewriting_logs.push(JSON.stringify(log8));
            var curr_subtree = get_subtree_nodes(nextsiblings[2][i]);
            for ( j = 0; j < curr_subtree[1].length; j++ ) {
                var log6 = {'OpType': 'WRITE', 'method': "removeChild", 'PropName': dom_var_name(curr_subtree[2][j]), 'NodeProp': "null", 'id': curr_subtree[0][j], 'child_path': curr_subtree[2][j], 'script': caller, 'OrigLine': line};
                window.js_rewriting_logs.push(JSON.stringify(log6));
            }
        }
        // log writes to argnode and subtree
        var log6 = {'OpType': 'WRITE', 'method': "removeChild", 'PropName': dom_var_name(arg1_childpath), 'NodeProp': "null", 'id': arg1_id, 'child_path': arg1_childpath, 'script': caller, 'OrigLine': line}
        window.js_rewriting_logs.push(JSON.stringify(log6));
        for ( i = 0; i < prior_subtree[1].length; i++ ) {
            var log6 = {'OpType': 'WRITE', 'method': "removeChild", 'PropName': dom_var_name(prior_subtree[2][i]), 'NodeProp': "null", 'id': prior_subtree[0][i], 'child_path': prior_subtree[2][i], 'script': caller, 'OrigLine': line}
            window.js_rewriting_logs.push(JSON.stringify(log6));
        }
        return p[0];
    };

    var _replaceChild = Node.prototype.replaceChild;
    Node.prototype.replaceChild = function(newchild, oldchild){
        // replace oldchild with newchild as child to this in DOM tree (return removed node)
        var arg1_val = newchild;
        var arg1_id = "null";
        var arg2_val = oldchild;
        var arg2_id = "null";
        var this_id = "null";
        var this_val = this;
        if ( newchild.hasOwnProperty("_id") ) {
            arg1_id = newchild._id;
            arg1_val = newchild._base;
        }
        if ( oldchild.hasOwnProperty("_id") ) {
            arg2_id = oldchild._id;
            arg2_val = oldchild._base;
        }
        if ( this.hasOwnProperty("_id") ) {
            this_id = this._id;
            this_val = this._base;
        } else {
            console.log( "Calling replaceChild on DOM node which is not proxy" );
        }
        var caller = get_caller(document.currentScript);
        var stack = new Error().stack.split("\n")[1].split(":");
        var line = stack[stack.length - 2];
        var this_child_vals = get_child_path(this_val);
        var this_child_path = print_nodes(this_child_vals[0]);
        var arg1_child_vals = get_child_path(arg1_val);
        var arg1_childpath = print_nodes(arg1_child_vals[0]);
        var arg2_child_vals = get_child_path(arg2_val);
        var arg2_childpath = print_nodes(arg2_child_vals[0]);

        var arg1_parentid = get_parent_id(arg1_val);
        var arg1_prevsibl = get_prev_child_id(arg1_val);
        var arg1_nextsibl = get_next_child_id(arg1_val);
        var arg2_prevsibl = get_prev_child_id(arg2_val);
        var arg2_nextsibl = get_next_child_id(arg2_val);
        var arg2_subtree = get_subtree_nodes(arg2_val);

        prior_oldarg_subtree = get_subtree_nodes(arg2_val);
        var arg_oldprevsibl_id = "null";
        var arg_oldprevsibl_childpath = "";
        var arg_oldnextsibl_id = "null";
        var arg_oldnextsibl_childpath = "";
        var y = arg2_val.previousSibling;
        if ( y == null ) {
        } else if ( y.hasOwnProperty("_id") ) {
            arg_oldprevsibl_id = y._id;
            arg_oldprevsibl_childpath = print_nodes(get_child_path(y._base)[0]);
        } else {
            arg_oldprevsibl_childpath = print_nodes(get_child_path(y)[0]);
        }
        var z = arg2_val.nextSibling;
        if ( z == null ) {
        } else if ( z.hasOwnProperty("_id") ) {
            arg_oldnextsibl_id = z._id;
            arg_oldnextsibl_childpath = print_nodes(get_child_path(z._base)[0]);
        } else {
            arg_oldnextsibl_childpath = print_nodes(get_child_path(z)[0]);
        }

        //var exists = document.getElementById(arg1_val);
        var exists = _contains.call(document, arg1_val);
        var arg_prevsibl_id = "null";
        var arg_prevsibl_childpath = "";
        var arg_nextsibl_id = "null";
        var arg_nextsibl_childpath = "";
        var nextsiblings = "";
        var arg_prevparent_id = "null";
        var arg_prevparent_childpath = "";
        var log_prevparent_firstchild = false;
        var log_prevparent_lastchild = false;
        prior_subtree = "";
        if ( exists ) {
            prior_subtree = get_subtree_nodes(arg1_val);
            var y = arg1_val.previousSibling;
            if ( y == null ) {
            } else if ( y.hasOwnProperty("_id") ) {
                arg_prevsibl_id = y._id;
                arg_prevsibl_childpath = print_nodes(get_child_path(y._base)[0]);
            } else {
                arg_prevsibl_childpath = print_nodes(get_child_path(y)[0]);
            }
            var z = arg1_val.nextSibling;
            if ( z == null ) {
            } else if ( z.hasOwnProperty("_id") ) {
                arg_nextsibl_id = z._id;
                arg_nextsibl_childpath = print_nodes(get_child_path(z._base)[0]);
            } else {
                arg_nextsibl_childpath = print_nodes(get_child_path(z)[0]);
            }
            nextsiblings = get_next_siblings(arg1_val);
            var t = arg1_val.parentNode;
            if ( t.hasOwnProperty("_id") ) {
                arg_prevparent_id = t._id;
                arg_prevparent_childpath = print_nodes(get_child_path(t._base)[0]);
            } else {
                arg_prevparent_id = "null";
                arg_prevparent_childpath = print_nodes(get_child_path(t)[0]);
            }
        }

        // check if we will need to log firstChild or lastChild of 'this' node
        var x = this_val.firstChild; var y = this_val.lastChild;
        var log_this_last_child = false;
        var log_this_first_child = false;
        if ( x.hasOwnProperty("_id") ) {
            if ( x._base == arg2_val ) {
                log_this_first_child = true;
            }
        } else {
            if ( x == arg2_val ) {
                log_this_first_child = true;
            }
        }
        if ( y.hasOwnProperty("_id") ) {
            if ( y._base == arg2_val ) {
                log_this_last_child = true;
            }
        } else {
            if ( y == arg2_val ) {
                log_this_last_child = true;
            }
        }

        var retVal = _replaceChild.call(this_val, arg1_val, arg2_val);
        var p = wrap_node_in_proxy(retVal);
        var post_subtree = get_subtree_nodes(p[0]._base);

        // read on 'this' node
        var log1 = {'OpType': 'READ', 'method': "replaceChild", 'PropName': dom_var_name(this_child_path), 'NodeProp': "null", 'id': this_id, 'child_path': this_child_path, 'script': caller, 'OrigLine': line}
        window.js_rewriting_logs.push(JSON.stringify(log1));
        // write on childNodes property of 'this' node
        var log2 = {'OpType': 'WRITE', 'method': "replaceChild", 'PropName': dom_var_name(this_child_path), 'NodeProp': "childNodes", 'id': this_id, 'child_path': this_child_path, 'script': caller, 'OrigLine': line}
        window.js_rewriting_logs.push(JSON.stringify(log2));
        // maybe write on lastChild property of 'this' node
        if ( log_this_last_child ) {
            var log3 = {'OpType': 'WRITE', 'method': "replaceChild", 'PropName': dom_var_name(this_child_path), 'NodeProp': "lastChild", 'id': this_id, 'child_path': this_child_path, 'script': caller, 'OrigLine': line}
            window.js_rewriting_logs.push(JSON.stringify(log3));
        }
        // maybe a write on firstChild property of 'this' node
        if ( log_this_first_child ) {
            var log5 = {'OpType': 'WRITE', 'method': "replaceChild", 'PropName': dom_var_name(this_child_path), 'NodeProp': "firstChild", 'id': this_id, 'child_path': this_child_path, 'script': caller, 'OrigLine': line}
            window.js_rewriting_logs.push(JSON.stringify(log5));
        }
        // log writes to oldnode and subtree
        var log6 = {'OpType': 'WRITE', 'method': "replaceChild", 'PropName': dom_var_name(arg2_childpath), 'NodeProp': "null", 'id': arg2_id, 'child_path': arg2_childpath, 'script': caller, 'OrigLine': line}
        window.js_rewriting_logs.push(JSON.stringify(log6));
        for ( i = 0; i < prior_oldarg_subtree[1].length; i++ ) {
            var log6 = {'OpType': 'WRITE', 'method': "replaceChild", 'PropName': dom_var_name(prior_oldarg_subtree[2][i]), 'NodeProp': "null", 'id': prior_oldarg_subtree[0][i], 'child_path': prior_oldarg_subtree[2][i], 'script': caller, 'OrigLine': line}
            window.js_rewriting_logs.push(JSON.stringify(log6));
        }
        // log writes to prev and next sibl of oldnode
        if ( arg_prevsibl_childpath != "" ) {
            var log7 = {'OpType': 'WRITE', 'method': "replaceChild", 'PropName': dom_var_name(arg_oldprevsibl_childpath), 'NodeProp': "nextSibling", 'id': arg_oldprevsibl_id, 'child_path': arg_oldprevsibl_childpath, 'script': caller, 'OrigLine': line}
            window.js_rewriting_logs.push(JSON.stringify(log7));
        }
        if ( arg_nextsibl_childpath != "" ) {
            var log7 = {'OpType': 'WRITE', 'method': "replaceChild", 'PropName': dom_var_name(arg_oldnextsibl_childpath), 'NodeProp': "previousSibling", 'id': arg_oldnextsibl_id, 'child_path': arg_oldnextsibl_childpath, 'script': caller, 'OrigLine': line}
            window.js_rewriting_logs.push(JSON.stringify(log7));
        }
        if ( exists ) {
            // if argnode previously exists in DOM, log writes to argnode and subtree
            var log6 = {'OpType': 'WRITE', 'method': "replaceChild", 'PropName': dom_var_name(arg1_childpath), 'NodeProp': "null", 'id': arg1_id, 'child_path': arg1_childpath, 'script': caller, 'OrigLine': line}
            window.js_rewriting_logs.push(JSON.stringify(log6));
            for ( i = 0; i < prior_subtree[1].length; i++ ) {
                var log6 = {'OpType': 'WRITE', 'method': "replaceChild", 'PropName': dom_var_name(prior_subtree[2][i]), 'NodeProp': "null", 'id': prior_subtree[0][i], 'child_path': prior_subtree[2][i], 'script': caller, 'OrigLine': line}
                window.js_rewriting_logs.push(JSON.stringify(log6));
            }
            // if argnode previously exists in DOM, log writes to prev and next sibl of argnode
            if ( arg_prevsibl_childpath != "" ) {
                var log7 = {'OpType': 'WRITE', 'method': "replaceChild", 'PropName': dom_var_name(arg_prevsibl_childpath), 'NodeProp': "nextSibling", 'id': arg_prevsibl_id, 'child_path': arg_prevsibl_childpath, 'script': caller, 'OrigLine': line}
                window.js_rewriting_logs.push(JSON.stringify(log7));
            }
            if ( arg_nextsibl_childpath != "" ) {
                var log7 = {'OpType': 'WRITE', 'method': "replaceChild", 'PropName': dom_var_name(arg_nextsibl_childpath), 'NodeProp': "previousSibling", 'id': arg_nextsibl_id, 'child_path': arg_nextsibl_childpath, 'script': caller, 'OrigLine': line}
                window.js_rewriting_logs.push(JSON.stringify(log7));
            }
            // if argnode previously exists in DOM, log writes to nextsiblings of 'this' until null (and subtrees)
            for ( i = 0; i < nextsiblings[0].length; i++ ) {
                var log8 = {'OpType': 'WRITE', 'method': "replaceChild", 'PropName': dom_var_name(nextsiblings[1][i]), 'NodeProp': "null", 'id': nextsiblings[0][i], 'child_path': nextsiblings[1][i], 'script': caller, 'OrigLine': line}
                window.js_rewriting_logs.push(JSON.stringify(log8));
                var curr_subtree = get_subtree_nodes(nextsiblings[2][i]);
                for ( j = 0; j < curr_subtree[1].length; j++ ) {
                    var log6 = {'OpType': 'WRITE', 'method': "replaceChild", 'PropName': dom_var_name(curr_subtree[2][j]), 'NodeProp': "null", 'id': curr_subtree[0][j], 'child_path': curr_subtree[2][j], 'script': caller, 'OrigLine': line};
                    window.js_rewriting_logs.push(JSON.stringify(log6));
                }

            }
            // if argnode previously exists in DOM, maybe log writes to first and lastChild of argnode's parent, definitely childNodes
            var log9 = {'OpType': 'WRITE', 'method': "replaceChild", 'PropName': dom_var_name(arg_prevparent_childpath), 'NodeProp': "childNodes", 'id': arg_prevparent_id, 'child_path': arg_prevparent_childpath, 'script': caller, 'OrigLine': line}
            window.js_rewriting_logs.push(JSON.stringify(log9));
            if ( log_prevparent_firstchild ) {
                var log10 = {'OpType': 'WRITE', 'method': "replaceChild", 'PropName': dom_var_name(arg_prevparent_childpath), 'NodeProp': "firstChild", 'id': arg_prevparent_id, 'child_path': arg_prevparent_childpath, 'script': caller, 'OrigLine': line}
                window.js_rewriting_logs.push(JSON.stringify(log10));
            }
            if ( log_prevparent_lastchild ) {
                var log10 = {'OpType': 'WRITE', 'method': "replaceChild", 'PropName': dom_var_name(arg_prevparent_childpath), 'NodeProp': "lastChild", 'id': arg_prevparent_id, 'child_path': arg_prevparent_childpath, 'script': caller, 'OrigLine': line}
                window.js_rewriting_logs.push(JSON.stringify(log10));
            }
        }
        // log writes for argnode and subtree after call
        for ( i = 0; i < post_subtree[1].length; i++ ) {
            var log10 = {'OpType': 'WRITE', 'method': "replaceChild", 'PropName': dom_var_name(post_subtree[2][i]), 'NodeProp': "null", 'id': post_subtree[0][i], 'child_path': post_subtree[2][i], 'script': caller, 'OrigLine': line}
            window.js_rewriting_logs.push(JSON.stringify(log10));
        }
        return p[0];
    };

    var _insertBefore = Node.prototype.insertBefore;
    Node.prototype.insertBefore = function(newchild, referencechild){
        // insert newchild before oldchild as child to this in DOM tree (return added node)
        var arg1_val = newchild;
        var arg1_id = "null";
        var arg2_val = referencechild;
        var arg2_id = "null";
        var this_id = "null";
        var this_val = this;
        if ( newchild.hasOwnProperty("_id") ) {
            arg1_id = newchild._id;
            arg1_val = newchild._base;
        }
        if ( referencechild == undefined ) {
            arg2_val = null;
        } else {
            if ( referencechild.hasOwnProperty("_id") ) {
                arg2_id = referencechild._id;
                arg2_val = referencechild._base;
            }
        }
        if ( this.hasOwnProperty("_id") ) {
            this_id = this._id;
            this_val = this._base;
        } else {
            console.log( "Calling insertBefore on DOM node which is not proxy" );
        }
        var this_child_vals = get_child_path(this_val);
        var this_child_path = print_nodes(this_child_vals[0]);
        var arg2_child_vals = get_child_path(arg2_val);
        var arg2_childpath = print_nodes(arg2_child_vals[0]);
        var arg1_child_vals = get_child_path(arg1_val);
        var arg1_childpath = print_nodes(arg1_child_vals[0]);
        var caller = get_caller(document.currentScript);
        var stack = new Error().stack.split("\n")[1].split(":");
        var line = stack[stack.length - 2];
        // check if we will need to log firstChild of 'this' node
        var x = this_val.firstChild;
        var log_this_first_child = false;
        if ( x.hasOwnProperty("_id") ) {
            if ( x._base == arg2_val ) {
                log_this_first_child = true;
            }
        } else {
            if ( x == arg2_val ) {
                log_this_first_child = true;
            }
        }

        //var exists = document.getElementById(arg1_val);
        var exists = _contains.call(document, arg1_val);
        var arg_prevsibl_id = "null";
        var arg_prevsibl_childpath = "";
        var arg_nextsibl_id = "null";
        var arg_nextsibl_childpath = "";
        var nextsiblings = "";
        var arg_prevparent_id = "null";
        var arg_prevparent_childpath = "";
        var log_prevparent_firstchild = false;
        var log_prevparent_lastchild = false;
        prior_subtree = "";
        if ( exists ) {
            prior_subtree = get_subtree_nodes(arg1_val);
            var y = arg1_val.previousSibling;
            if ( y == null ) {
            } else if ( y.hasOwnProperty("_id") ) {
                arg_prevsibl_id = y._id;
                arg_prevsibl_childpath = print_nodes(get_child_path(y._base)[0]);
            } else {
                arg_prevsibl_childpath = print_nodes(get_child_path(y)[0]);
            }
            var z = arg1_val.nextSibling;
            if ( z == null ) {
            } else if ( z.hasOwnProperty("_id") ) {
                arg_nextsibl_id = z._id;
                arg_nextsibl_childpath = print_nodes(get_child_path(z._base)[0]);
            } else {
                arg_nextsibl_childpath = print_nodes(get_child_path(z)[0]);
            }
            nextsiblings = get_next_siblings(arg1_val);
            var t = arg1_val.parentNode;
            if ( t.hasOwnProperty("_id") ) {
                arg_prevparent_id = t._id;
                arg_prevparent_childpath = print_nodes(get_child_path(t._base)[0]);
            } else {
                arg_prevparent_id = "null";
                arg_prevparent_childpath = print_nodes(get_child_path(t)[0]);
            }
        }

        var arg_refprevsibl_id = "null";
        var arg_refprevsibl_childpath = "";
        var arg_refnextsibl_id = "null";
        var arg_refnextsibl_childpath = "";
        prior_refsubtree = get_subtree_nodes(arg2_val);
        var y = null;
        if ( arg2_val != null ) {
            y = arg2_val.previousSibling;
        }
        if ( y == null ) {
        } else if ( y.hasOwnProperty("_id") ) {
            arg_refprevsibl_id = y._id;
            arg_refprevsibl_childpath = print_nodes(get_child_path(y._base)[0]);
        } else {
            arg_refprevsibl_childpath = print_nodes(get_child_path(y)[0]);
        }
        var z = null;
        if ( arg2_val != null ) {
            z = arg2_val.nextSibling;
        }
        if ( z == null ) {
        } else if ( z.hasOwnProperty("_id") ) {
            arg_refnextsibl_id = z._id;
            arg_refnextsibl_childpath = print_nodes(get_child_path(z._base)[0]);
        } else {
            arg_refnextsibl_childpath = print_nodes(get_child_path(z)[0]);
        }
        refnextsiblings = get_next_siblings(arg2_val);

        var retVal = _insertBefore.call(this_val, arg1_val, arg2_val);
        var p = wrap_node_in_proxy(retVal);
        var post_subtree = get_subtree_nodes(p[0]._base);
        var post_refsubtree = get_subtree_nodes(arg2_val);

        // read on 'this' node
        var log1 = {'OpType': 'READ', 'method': "insertBefore", 'PropName': dom_var_name(this_child_path), 'NodeProp': "null", 'id': this_id, 'child_path': this_child_path, 'script': caller, 'OrigLine': line}
        window.js_rewriting_logs.push(JSON.stringify(log1));
        // write on childNodes property of 'this' node
        var log2 = {'OpType': 'WRITE', 'method': "insertBefore", 'PropName': dom_var_name(this_child_path), 'NodeProp': "childNodes", 'id': this_id, 'child_path': this_child_path, 'script': caller, 'OrigLine': line}
        window.js_rewriting_logs.push(JSON.stringify(log2));
        // maybe a write on firstChild property of 'this' node
        if ( log_this_first_child ) {
            var log5 = {'OpType': 'WRITE', 'method': "insertBefore", 'PropName': dom_var_name(this_child_path), 'NodeProp': "firstChild", 'id': this_id, 'child_path': this_child_path, 'script': caller, 'OrigLine': line}
            window.js_rewriting_logs.push(JSON.stringify(log5));
        }
        if ( exists ) {
            // if newnode previously exists in DOM, log writes to newnode and subtree
            var log6 = {'OpType': 'WRITE', 'method': "insertBefore", 'PropName': dom_var_name(arg1_childpath), 'NodeProp': "null", 'id': arg1_id, 'child_path': arg1_childpath, 'script': caller, 'OrigLine': line}
            window.js_rewriting_logs.push(JSON.stringify(log6));
            for ( i = 0; i < prior_subtree[1].length; i++ ) {
                var log6 = {'OpType': 'WRITE', 'method': "insertBefore", 'PropName': dom_var_name(prior_subtree[2][i]), 'NodeProp': "null", 'id': prior_subtree[0][i], 'child_path': prior_subtree[2][i], 'script': caller, 'OrigLine': line}
                window.js_rewriting_logs.push(JSON.stringify(log6));
            }
            // if newnode previously exists in DOM, log writes to prev and next sibl of newnode
            if ( arg_prevsibl_childpath != "" ) {
                var log7 = {'OpType': 'WRITE', 'method': "insertBefore", 'PropName': dom_var_name(arg_prevsibl_childpath), 'NodeProp': "nextSibling", 'id': arg_prevsibl_id, 'child_path': arg_prevsibl_childpath, 'script': caller, 'OrigLine': line}
                window.js_rewriting_logs.push(JSON.stringify(log7));
            }
            if ( arg_nextsibl_childpath != "" ) {
                var log7 = {'OpType': 'WRITE', 'method': "insertBefore", 'PropName': dom_var_name(arg_nextsibl_childpath), 'NodeProp': "previousSibling", 'id': arg_nextsibl_id, 'child_path': arg_nextsibl_childpath, 'script': caller, 'OrigLine': line}
                window.js_rewriting_logs.push(JSON.stringify(log7));
            }
            // if argnode previously exists in DOM, log writes to nextsiblings of 'this' until null (and subtrees)
            for ( i = 0; i < nextsiblings[0].length; i++ ) {
                var log8 = {'OpType': 'WRITE', 'method': "insertBefore", 'PropName': dom_var_name(nextsiblings[1][i]), 'NodeProp': "null", 'id': nextsiblings[0][i], 'child_path': nextsiblings[1][i], 'script': caller, 'OrigLine': line}
                window.js_rewriting_logs.push(JSON.stringify(log8));
                var curr_subtree = get_subtree_nodes(nextsiblings[2][i]);
                for ( j = 0; j < curr_subtree[1].length; j++ ) {
                    var log6 = {'OpType': 'WRITE', 'method': "insertBefore", 'PropName': dom_var_name(curr_subtree[2][j]), 'NodeProp': "null", 'id': curr_subtree[0][j], 'child_path': curr_subtree[2][j], 'script': caller, 'OrigLine': line};
                    window.js_rewriting_logs.push(JSON.stringify(log6));
                }
            }
            // if newnode previously exists in DOM, maybe log writes to first and lastChild of newnode's parent, definitely childNodes
            var log9 = {'OpType': 'WRITE', 'method': "insertBefore", 'PropName': dom_var_name(arg_prevparent_childpath), 'NodeProp': "childNodes", 'id': arg_prevparent_id, 'child_path': arg_prevparent_childpath, 'script': caller, 'OrigLine': line}
            window.js_rewriting_logs.push(JSON.stringify(log9));
            if ( log_prevparent_firstchild ) {
                var log10 = {'OpType': 'WRITE', 'method': "insertBefore", 'PropName': dom_var_name(arg_prevparent_childpath), 'NodeProp': "firstChild", 'id': arg_prevparent_id, 'child_path': arg_prevparent_childpath, 'script': caller, 'OrigLine': line}
                window.js_rewriting_logs.push(JSON.stringify(log10));
            }
            if ( log_prevparent_lastchild ) {
                var log10 = {'OpType': 'WRITE', 'method': "insertBefore", 'PropName': dom_var_name(arg_prevparent_childpath), 'NodeProp': "lastChild", 'id': arg_prevparent_id, 'child_path': arg_prevparent_childpath, 'script': caller, 'OrigLine': line}
                window.js_rewriting_logs.push(JSON.stringify(log10));
            }
        }
        // log writes for newnode and subtree after call
        for ( i = 0; i < post_subtree[1].length; i++ ) {
            var log10 = {'OpType': 'WRITE', 'method': "replaceChild", 'PropName': dom_var_name(post_subtree[2][i]), 'NodeProp': "null", 'id': post_subtree[0][i], 'child_path': post_subtree[2][i], 'script': caller, 'OrigLine': line}
            window.js_rewriting_logs.push(JSON.stringify(log10));
        }
        // log writes to refnode and subtree
        var log6 = {'OpType': 'WRITE', 'method': "insertBefore", 'PropName': dom_var_name(arg2_childpath), 'NodeProp': "null", 'id': arg2_id, 'child_path': arg2_childpath, 'script': caller, 'OrigLine': line}
        window.js_rewriting_logs.push(JSON.stringify(log6));
        for ( i = 0; i < prior_refsubtree[1].length; i++ ) {
            var log6 = {'OpType': 'WRITE', 'method': "insertBefore", 'PropName': dom_var_name(prior_refsubtree[2][i]), 'NodeProp': "null", 'id': prior_refsubtree[0][i], 'child_path': prior_refsubtree[2][i], 'script': caller, 'OrigLine': line}
            window.js_rewriting_logs.push(JSON.stringify(log6));
        }
        // log writes to prev and next sibl of refnode
        if ( arg_refprevsibl_childpath != "" ) {
            var log7 = {'OpType': 'WRITE', 'method': "insertBefore", 'PropName': dom_var_name(arg_refprevsibl_childpath), 'NodeProp': "nextSibling", 'id': arg_refprevsibl_id, 'child_path': arg_refprevsibl_childpath, 'script': caller, 'OrigLine': line}
            window.js_rewriting_logs.push(JSON.stringify(log7));
        }
        if ( arg_refnextsibl_childpath != "" ) {
            var log7 = {'OpType': 'WRITE', 'method': "insertBefore", 'PropName': dom_var_name(arg_refnextsibl_childpath), 'NodeProp': "previousSibling", 'id': arg_refnextsibl_id, 'child_path': arg_refnextsibl_childpath, 'script': caller, 'OrigLine': line}
            window.js_rewriting_logs.push(JSON.stringify(log7));
        }
        // log writes to nextsiblings of refnode until null (and subtrees)
        for ( i = 0; i < refnextsiblings[0].length; i++ ) {
            var log8 = {'OpType': 'WRITE', 'method': "insertBefore", 'PropName': dom_var_name(refnextsiblings[1][i]), 'NodeProp': "null", 'id': refnextsiblings[0][i], 'child_path': refnextsiblings[1][i], 'script': caller, 'OrigLine': line}
            window.js_rewriting_logs.push(JSON.stringify(log8));
            var curr_subtree = get_subtree_nodes(refnextsiblings[2][i]);
            for ( j = 0; j < curr_subtree[1].length; j++ ) {
                var log6 = {'OpType': 'WRITE', 'method': "insertBefore", 'PropName': dom_var_name(curr_subtree[2][j]), 'NodeProp': "null", 'id': curr_subtree[0][j], 'child_path': curr_subtree[2][j], 'script': caller, 'OrigLine': line};
                window.js_rewriting_logs.push(JSON.stringify(log6));
            }
        }
        // log writes for refnode and subtree after call
        for ( i = 0; i < post_refsubtree[1].length; i++ ) {
            var log10 = {'OpType': 'WRITE', 'method': "insertBefore", 'PropName': dom_var_name(post_refsubtree[2][i]), 'NodeProp': "null", 'id': post_refsubtree[0][i], 'child_path': post_refsubtree[2][i], 'script': caller, 'OrigLine': line}
            window.js_rewriting_logs.push(JSON.stringify(log10));
        }
        return p[0];
    };

    var _compareDocumentPosition = Node.prototype.compareDocumentPosition;
    Node.prototype.compareDocumentPosition = function(comparenode){
        // compare document position of 'this' node and comparenode (return bitmask)
        var arg1_val = comparenode;
        var arg1_id = "null";
        var this_id = "null";
        var this_val = this;
        if ( comparenode.hasOwnProperty("_id") ) {
            arg1_id = comparenode._id;
            arg1_val = comparenode._base;
        }
        if ( this.hasOwnProperty("_id") ) {
            this_id = this._id;
            this_val = this._base;
        } else {
            console.log( "Calling compareDocumentPosition on DOM node which is not proxy" );
        }
        var arg1_childpath = print_nodes(get_child_path(arg1_val)[0]);
        var this_child_vals = get_child_path(this_val);
        var this_child_path = print_nodes(this_child_vals[0]);
        var caller = get_caller(document.currentScript);
        var stack = new Error().stack.split("\n")[1].split(":");
        var line = stack[stack.length - 2];
        var child_vals = get_child_path(this_val);
        var retVal = _compareDocumentPosition.call(this_val, arg1_val);

        // read on 'this' node
        var log1 = {'OpType': 'READ', 'method': "compareDocumentPosition", 'PropName': dom_var_name(this_child_path), 'NodeProp': "null", 'id': this_id, 'child_path': this_child_path, 'script': caller, 'OrigLine': line}
        window.js_rewriting_logs.push(JSON.stringify(log1));

        // read on argument (comparenode)
        var log2 = {'OpType': 'READ', 'method': "compareDocumentPosition", 'PropName': dom_var_name(arg1_childpath), 'NodeProp': "null", 'id': arg1_id, 'child_path': arg1_childpath, 'script': caller, 'OrigLine': line}
        window.js_rewriting_logs.push(JSON.stringify(log2));
        return retVal;
    };

    var _cloneNode = Node.prototype.cloneNode;
    Node.prototype.cloneNode = function(deep){
        // clone node and return new copy (copy not added to tree)
        var arg1_val = deep;
        if ( deep == undefined ) {
            arg1_val = false;
        }
        var this_id = "null";
        var this_val = this;
        if ( this.hasOwnProperty("_id") ) {
            this_id = this._id;
            this_val = this._base;
        } else {
            console.log( "Calling cloneNode on DOM node which is not proxy" );
        }
        var this_child_vals = get_child_path(this_val);
        var this_child_path = print_nodes(this_child_vals[0]);
        var caller = get_caller(document.currentScript);
        var stack = new Error().stack.split("\n")[1].split(":");
        var line = stack[stack.length - 2];
        var child_vals = get_child_path(this_val);
        prior_subtree = get_subtree_nodes(this_val);
        var retVal = _cloneNode.call(this_val, arg1_val);
        var p = wrap_node_in_proxy(retVal);
        var ret_child_vals = get_child_path(p[0]._base);
        var ret_child_path = print_nodes(ret_child_vals[0]);
        post_subtree = get_subtree_nodes(p[0]._base);

        // read on 'this' node
        var log1 = {'OpType': 'READ', 'method': "cloneNode", 'PropName': dom_var_name(this_child_path), 'NodeProp': "null", 'id': this_id, 'child_path': this_child_path, 'script': caller, 'OrigLine': line}
        window.js_rewriting_logs.push(JSON.stringify(log1));
        // if 'deep' is true, read on 'this' node's subtree
        if ( arg1_val ) {
            for ( i = 0; i < prior_subtree[1].length; i++ ) {
                var log2 = {'OpType': 'READ', 'method': "cloneNode", 'PropName': dom_var_name(prior_subtree[2][i]), 'NodeProp': "null", 'id': prior_subtree[0][i], 'child_path': prior_subtree[2][i], 'script': caller, 'OrigLine': line}
                window.js_rewriting_logs.push(JSON.stringify(log2));
            }
        }
        // write on returned node
        var log3 = {'OpType': 'WRITE', 'method': "cloneNode", 'PropName': dom_var_name(ret_child_path), 'NodeProp': "null", 'id': p[1], 'child_path': ret_child_path, 'script': caller, 'OrigLine': line}
        window.js_rewriting_logs.push(JSON.stringify(log3));
        // if 'deep' is true, write on each node in returned node's subtree
        if ( arg1_val ) {
            for ( i = 0; i < post_subtree[1].length; i++ ) {
                var log6 = {'OpType': 'WRITE', 'method': "cloneNode", 'PropName': dom_var_name(post_subtree[2][i]), 'NodeProp': "null", 'id': post_subtree[0][i], 'child_path': post_subtree[2][i], 'script': caller, 'OrigLine': line}
                window.js_rewriting_logs.push(JSON.stringify(log6));
            }
        }
        return p[0];
    };

    var _contains = Node.prototype.contains;
    Node.prototype.contains = function(othernode){
        // checks whether othernode is descendant of this in DOM tree (returns bool)
        var arg1_val = othernode;
        var arg1_id = "null";
        var this_id = "null";
        var this_val = this;
        if ( othernode.hasOwnProperty("_id") ) {
            arg1_id = othernode._id;
            arg1_val = othernode._base;
        }
        if ( this.hasOwnProperty("_id") ) {
            this_id = this._id;
            this_val = this._base;
        } else {
            console.log( "Calling contains on DOM node which is not proxy" );
        }
        var this_child_vals = get_child_path(this_val);
        var this_child_path = print_nodes(this_child_vals[0]);
        var arg1_child_vals = get_child_path(arg1_val);
        var arg1_child_path = print_nodes(arg1_child_vals[0]);
        prior_subtree = get_subtree_nodes(this_val);
        var caller = get_caller(document.currentScript);
        var stack = new Error().stack.split("\n")[1].split(":");
        var line = stack[stack.length - 2];
        var child_vals = get_child_path(this_val);
        var retVal = _contains.call(this_val, arg1_val);

        // read on 'this' node
        var log1 = {'OpType': 'READ', 'method': "contains", 'PropName': dom_var_name(this_child_path), 'NodeProp': "null", 'id': this_id, 'child_path': this_child_path, 'script': caller, 'OrigLine': line}
        window.js_rewriting_logs.push(JSON.stringify(log1));

        // read on 'this' node's subtree
        for ( i = 0; i < prior_subtree[1].length; i++ ) {
            var log2 = {'OpType': 'READ', 'method': "contains", 'PropName': dom_var_name(prior_subtree[2][i]), 'NodeProp': "null", 'id': prior_subtree[0][i], 'child_path': prior_subtree[2][i], 'script': caller, 'OrigLine': line}
            window.js_rewriting_logs.push(JSON.stringify(log2));
        }

        // read on othernode (argument)
        var log3 = {'OpType': 'READ', 'method': "contains", 'PropName': dom_var_name(arg1_child_path), 'NodeProp': "null", 'id': arg1_id, 'child_path': arg1_child_path, 'script': caller, 'OrigLine': line}
        window.js_rewriting_logs.push(JSON.stringify(log3));

        return retVal;
    };

    var _hasChildNodes = Node.prototype.hasChildNodes;
    Node.prototype.hasChildNodes = function(){
        // checks whether this has children in DOM tree (returns bool)
        var this_id = "null";
        var this_val = this;
        if ( this.hasOwnProperty("_id") ) {
            this_id = this._id;
            this_val = this._base;
        } else {
            console.log( "Calling hasChildNodes on DOM node which is not proxy" );
        }
        var this_child_vals = get_child_path(this_val);
        var this_child_path = print_nodes(this_child_vals[0]);
        var caller = get_caller(document.currentScript);
        var stack = new Error().stack.split("\n")[1].split(":");
        var line = stack[stack.length - 2];
        var child_vals = get_child_path(this_val);
        var retVal = _hasChildNodes.call(this_val);

        // read on 'this' node's childNodes property
        var log1 = {'OpType': 'READ', 'method': "hasChildNodes", 'PropName': dom_var_name(this_child_path), 'NodeProp': "childNodes", 'id': this_id, 'child_path': this_child_path, 'script': caller, 'OrigLine': line}
        window.js_rewriting_logs.push(JSON.stringify(log1));

        return retVal;
    };

    var _isDefaultNamespace = Node.prototype.isDefaultNamespace;
    Node.prototype.isDefaultNamespace = function(namespaceURI){
        // checks whether namespace is default namespace for this node (returns bool)
        var this_id = "null";
        var this_val = this;
        if ( this.hasOwnProperty("_id") ) {
            this_id = this._id;
            this_val = this._base;
        } else {
            console.log( "Calling isDefaultNamespace on DOM node which is not proxy" );
        }
        var this_child_vals = get_child_path(this_val);
        var this_child_path = print_nodes(this_child_vals[0]);
        var caller = get_caller(document.currentScript);
        var stack = new Error().stack.split("\n")[1].split(":");
        var line = stack[stack.length - 2];
        var child_vals = get_child_path(this_val);
        var retVal = _isDefaultNamespace.call(this_val, namespaceURI);

        // read on 'this' node's namespaceURI property
        var log1 = {'OpType': 'READ', 'method': "isDefaultNamespace", 'PropName': dom_var_name(this_child_path), 'NodeProp': "namespaceURI", 'id': this_id, 'child_path': this_child_path, 'script': caller, 'OrigLine': line}
        window.js_rewriting_logs.push(JSON.stringify(log1));

        return retVal;
    };

    var _isEqualNode = Node.prototype.isEqualNode;
    Node.prototype.isEqualNode = function(comparenode){
        // tests whether comparenode and this node are equal (return bool)
        var arg1_val = comparenode;
        var arg1_id = "null";
        var this_id = "null";
        var this_val = this;
        if ( comparenode.hasOwnProperty("_id") ) {
            arg1_id = comparenode._id;
            arg1_val = comparenode._base;
        }
        if ( this.hasOwnProperty("_id") ) {
            this_id = this._id;
            this_val = this._base;
        } else {
            console.log( "Calling isEqualNode on DOM node which is not proxy" );
        }
        var this_child_vals = get_child_path(this_val);
        var this_child_path = print_nodes(this_child_vals[0]);
        var arg1_child_vals = get_child_path(arg1_val);
        var arg1_child_path = print_nodes(arg1_child_vals[0]);
        var caller = get_caller(document.currentScript);
        var stack = new Error().stack.split("\n")[1].split(":");
        var line = stack[stack.length - 2];
        var child_vals = get_child_path(this_val);
        var retVal = _isEqualNode.call(this_val, arg1_val);

        // read on 'this' node
        var log1 = {'OpType': 'READ', 'method': "isEqualNode", 'PropName': dom_var_name(this_child_path), 'NodeProp': "null", 'id': this_id, 'child_path': this_child_path, 'script': caller, 'OrigLine': line}
        window.js_rewriting_logs.push(JSON.stringify(log1));

        // read on comparenode (argument)
        var log2 = {'OpType': 'READ', 'method': "isEqualNode", 'PropName': dom_var_name(arg1_child_path), 'NodeProp': "null", 'id': arg1_id, 'child_path': arg1_child_path, 'script': caller, 'OrigLine': line}
        window.js_rewriting_logs.push(JSON.stringify(log2));

        return retVal;
    };

    var _lookupNamespaceURI = Node.prototype.lookupNamespaceURI;
    Node.prototype.lookupNamespaceURI = function(prefix){
        // finds namespaceURI associated with prefix on this node (returns namespaceURI)
        var this_id = "null";
        var this_val = this;
        if ( this.hasOwnProperty("_id") ) {
            this_id = this._id;
            this_val = this._base;
        } else {
            console.log( "Calling lookupNamespaceURI on DOM node which is not proxy" );
        }
        var this_child_vals = get_child_path(this_val);
        var this_child_path = print_nodes(this_child_vals[0]);
        var caller = get_caller(document.currentScript);
        var stack = new Error().stack.split("\n")[1].split(":");
        var line = stack[stack.length - 2];
        var child_vals = get_child_path(this_val);
        var retVal = _lookupNamespaceURI.call(this_val, prefix);

        // read on 'this' node's namespaceURI property
        var log1 = {'OpType': 'READ', 'method': "lookupNamespaceURI", 'PropName': dom_var_name(this_child_path), 'NodeProp': "namespaceURI", 'id': this_id, 'child_path': this_child_path, 'script': caller, 'OrigLine': line}
        window.js_rewriting_logs.push(JSON.stringify(log1));

        return retVal;
    };

    var _lookupPrefix = Node.prototype.lookupPrefix;
    Node.prototype.lookupPrefix = function(namespaceURI){
        // finds DOMString associated with prefix on this node (returns prefix)
        var this_id = "null";
        var this_val = this;
        if ( this.hasOwnProperty("_id") ) {
            this_id = this._id;
            this_val = this._base;
        } else {
            console.log( "Calling lookupPrefix on DOM node which is not proxy" );
        }
        var this_child_vals = get_child_path(this_val);
        var this_child_path = print_nodes(this_child_vals[0]);
        var caller = get_caller(document.currentScript);
        var stack = new Error().stack.split("\n")[1].split(":");
        var line = stack[stack.length - 2];
        var child_vals = get_child_path(this_val);
        var retVal = _lookupPrefix.call(this_val, namespaceURI);

        // read on 'this' node's prefix property
        var log1 = {'OpType': 'READ', 'method': "lookupPrefix", 'PropName': dom_var_name(this_child_path), 'NodeProp': "prefix", 'id': this_id, 'child_path': this_child_path, 'script': caller, 'OrigLine': line}
        window.js_rewriting_logs.push(JSON.stringify(log1));

        return retVal;
    };

    var _normalize = Node.prototype.normalize;
    Node.prototype.normalize = function(){
        // puts this and its subtree into normal form (no return value)
        var this_id = "null";
        var this_val = this;
        if ( this.hasOwnProperty("_id") ) {
            this_id = this._id;
            this_val = this._base;
        } else {
            window.js_rewriting_logs.push( "Calling normalize on DOM node which is not proxy" );
        }
        this_prevchildnodes = this_val.childNodes;
        var x = this_val.firstChild;
        var y = this_val.lastChild;
        this_prevfirstchild = x;
        this_prevlastchild = y;
        if ( x.hasOwnProperty("_id") ) {
            this_prevfirstchild = x._base;
        }
        if ( y.hasOwnProperty("_id") ) {
            this_prevlastchild = y._base;
        }
        pre_subtree = get_subtree_textnodes(this_val);
        var this_child_vals = get_child_path(this_val);
        var this_child_path = print_nodes(this_child_vals[0]);
        prior_subtree = get_subtree_textnodes(this_val);
        var caller = get_caller(document.currentScript);
        var stack = new Error().stack.split("\n")[1].split(":");
        var line = stack[stack.length - 2];
        var child_vals = get_child_path(this_val);
        var retVal = _normalize.call(this_val);

        this_postchildnodes = this_val.childNodes;
        var a = this_val.firstChild;
        var b = this_val.lastChild;
        this_postfirstchild = a;
        this_postlastchild = b;
        if ( a.hasOwnProperty("_id") ) {
            this_postfirstchild = a._base;
        }
        if ( b.hasOwnProperty("_id") ) {
            this_postlastchild = b._base;
        }
        post_subtree = get_subtree_textnodes(this_val);


        // compare pre and post subtree of 'this' node to get newly created textnodes
        var new_nodes = [[],[],[]]; // ids, nodes, subtrees
        for ( i = 0; i < post_subtree[0].length; i++ ) {
            // check whether each node in post tree was in pre tree (if no, add to list)
            if ( pre_subtree[0].indexOf(post_subtree[0][i]) == -1 ) { // not in pre tree
                new_nodes[0].push(post_subtree[0][i]);
                new_nodes[1].push(post_subtree[1][i]);
                new_nodes[2].push(post_subtree[2][i]);
            }
        }

        // read on 'this' node
        var log1 = {'OpType': 'READ', 'method': "normalize", 'PropName': dom_var_name(this_child_path), 'NodeProp': "null", 'id': this_id, 'child_path': this_child_path, 'script': caller, 'OrigLine': line}
        window.js_rewriting_logs.push(JSON.stringify(log1));

        // maybe write to 'this' childNodes, firstChild, lastChild
        if ( this_postchildnodes != this_prevchildnodes ) {
            var log2 = {'OpType': 'READ', 'method': "normalize", 'PropName': dom_var_name(this_child_path), 'NodeProp': "childNodes", 'id': this_id, 'child_path': this_child_path, 'script': caller, 'OrigLine': line}
            window.js_rewriting_logs.push(JSON.stringify(log2));
        }
        if ( this_postfirstchild != this_prevfirstchild ) {
            var log3 = {'OpType': 'READ', 'method': "normalize", 'PropName': dom_var_name(this_child_path), 'NodeProp': "firstChild", 'id': this_id, 'child_path': this_child_path, 'script': caller, 'OrigLine': line}
            window.js_rewriting_logs.push(JSON.stringify(log3));
        }
        if ( this_postlastchild != this_prevlastchild ) {
            var log4 = {'OpType': 'READ', 'method': "normalize", 'PropName': dom_var_name(this_child_path), 'NodeProp': "lastChild", 'id': this_id, 'child_path': this_child_path, 'script': caller, 'OrigLine': line}
            window.js_rewriting_logs.push(JSON.stringify(log4));
        }

        // read/write on every text node in 'this' node's subtree before call
        for ( i = 0; i < prior_subtree[1].length; i++ ) {
            var log6 = {'OpType': 'READ', 'method': "normalize", 'PropName': dom_var_name(prior_subtree[2][i]), 'NodeProp': "null", 'id': prior_subtree[0][i], 'child_path': prior_subtree[2][i], 'script': caller, 'OrigLine': line}
            window.js_rewriting_logs.push(JSON.stringify(log6));
            var log7 = {'OpType': 'WRITE', 'method': "normalize", 'PropName': dom_var_name(prior_subtree[2][i]), 'NodeProp': "null", 'id': prior_subtree[0][i], 'child_path': prior_subtree[2][i], 'script': caller, 'OrigLine': line}
            window.js_rewriting_logs.push(JSON.stringify(log7));
        }

        // write on every new text node created by method call
        for ( i = 0; i < new_nodes[1].length; i++ ) {
            var log5 = {'OpType': 'WRITE', 'method': "normalize", 'PropName': dom_var_name(new_nodes[2][i]), 'NodeProp': "null", 'id': new_nodes[0][i], 'child_path': new_nodes[2][i], 'script': caller, 'OrigLine': line}
            window.js_rewriting_logs.push(JSON.stringify(log5));
        }
    };


    // START DOCUMENT SHIMS


    var _getElementById = document.getElementById;
    document.getElementById = function(requested_id){
        // log the method name, argument (id name), returned node child path
        var caller = get_caller(document.currentScript);
        var stack = new Error().stack.split("\n")[1].split(":");
        var line = stack[stack.length - 2];
        var retVal = _getElementById.call(document, requested_id);
        child_vals = get_child_path(retVal);
        var p = wrap_node_in_proxy(retVal);
        var ret_child_path = "";
        if ( p[0] != null ) {
            var ret_child_vals = get_child_path(p[0]._base);
            var ret_child_path = print_nodes(ret_child_vals[0]);
        }

        // read on ret node (unless null)
        if ( p[0] != null ) {
            var log4 = {'OpType': 'READ', 'method': "getElementById", 'PropName': dom_var_name(ret_child_path), 'NodeProp': "null", 'id': p[1], 'child_path': ret_child_path, 'script': caller, 'OrigLine': line}
            window.js_rewriting_logs.push(JSON.stringify(log4));
        }

        return p[0];
    };


    var _querySelector = document.querySelector;
    document.querySelector = function(requested_selectors){
        // log the method name, argument (selector name), returned list of children (path for each)
        var caller = get_caller(document.currentScript);
        var stack = new Error().stack.split("\n")[1].split(":");
        var line = stack[stack.length - 2];
        var retVal = _querySelector.call(document, requested_selectors);
        child_vals = get_child_path(retVal);
        var p = wrap_node_in_proxy(retVal);

        var ret_child_path = "";
        if ( p[0] != null ) {
            var ret_child_vals = get_child_path(p[0]._base);
            var ret_child_path = print_nodes(ret_child_vals[0]);
        }

        // read on ret node (unless null)
        if ( p[0] != null ) {
            var log4 = {'OpType': 'READ', 'method': "querySelector", 'PropName': dom_var_name(ret_child_path), 'NodeProp': "null", 'id': p[1], 'child_path': ret_child_path, 'script': caller, 'OrigLine': line}
            window.js_rewriting_logs.push(JSON.stringify(log4));
        }


        return p[0];
    };

    var _getElementsByName = document.getElementsByName;
    document.getElementsByName = function(requested_name){
        // log the method name, argument (name), returned list of children (path for each)
        var caller = get_caller(document.currentScript);
        var stack = new Error().stack.split("\n")[1].split(":");
        var line = stack[stack.length - 2];
        var retVal = _getElementsByName.call(document, requested_name);
        var ret = get_multi_child_path(retVal);
        // wrap nodelist in proxy to log queries and wrap returned nodes
        var p = null;
        if ( retVal != null ) {
            var p = new Proxy( retVal, nodelist_handler );
            Object.defineProperty(p, '_base', {
                enumerable: false,
                configurable: false,
                writable: false,
                value: retVal
            });

            // read on every returned node
            for ( i = 0; i < retVal.length; i++ ) {
                var curr_id = "null";
                var curr_val = retVal[i];
                if ( retVal[i].hasOwnProperty("_id") ) {
                    curr_id = retVal[i]._id;
                    curr_val = retVal[i]._base;
                }
                var child_vals = get_child_path(curr_val);
                var child_path = print_nodes(child_vals[0]);
                var log4 = {'OpType': 'READ', 'method': "getElementsByName", 'PropName': dom_var_name(child_path), 'NodeProp': "null", 'id': curr_id, 'child_path': child_path, 'script': caller, 'OrigLine': line}
                window.js_rewriting_logs.push(JSON.stringify(log4));
            }
        }
        return p;
    };

    var _getElementsByClassName = document.getElementsByClassName;
    document.getElementsByClassName = function(requested_class){
        // log the method name, argument (name), returned list of children (path for each)
        var caller = get_caller(document.currentScript);
        var stack = new Error().stack.split("\n")[1].split(":");
        var line = stack[stack.length - 2];
        var retVal = _getElementsByClassName.call(document, requested_class);
        var ret = get_multi_child_path(retVal);
        // wrap nodelist in proxy to log queries and wrap returned nodes
        var p = null;
        if ( retVal != null ) {
            var p = new Proxy( retVal, nodelist_handler );
            Object.defineProperty(p, '_base', {
                enumerable: false,
                configurable: false,
                writable: false,
                value: retVal
            });

            // read on every returned node
            for ( i = 0; i < retVal.length; i++ ) {
                var curr_id = "null";
                var curr_val = retVal[i];
                if ( retVal[i].hasOwnProperty("_id") ) {
                    curr_id = retVal[i]._id;
                    curr_val = retVal[i]._base;
                }
                var child_vals = get_child_path(curr_val);
                var child_path = print_nodes(child_vals[0]);
                var log4 = {'OpType': 'READ', 'method': "getElementsByClassName", 'PropName': dom_var_name(child_path), 'NodeProp': "null", 'id': curr_id, 'child_path': child_path, 'script': caller, 'OrigLine': line}
                window.js_rewriting_logs.push(JSON.stringify(log4));
            }
        }
        return p;
    };


    var _getElementsByTagName = document.getElementsByTagName;
    document.getElementsByTagName = function(requested_tag){
        // log the method name, argument (name), returned list of children (path for each)
        var caller = get_caller(document.currentScript);
        var stack = new Error().stack.split("\n")[1].split(":");
        var line = stack[stack.length - 2];
        var retVal = _getElementsByTagName.call(document, requested_tag);
        var ret = get_multi_child_path(retVal);
        // wrap nodelist in proxy to log queries and wrap returned nodes
        var p = null;
        if ( retVal != null ) {
            var p = new Proxy( retVal, nodelist_handler );
            Object.defineProperty(p, '_base', {
                enumerable: false,
                configurable: false,
                writable: false,
                value: retVal
            });

            // read on every returned node
            for ( i = 0; i < retVal.length; i++ ) {
                var curr_id = "null";
                var curr_val = retVal[i];
                if ( retVal[i].hasOwnProperty("_id") ) {
                    curr_id = retVal[i]._id;
                    curr_val = retVal[i]._base;
                }
                var child_vals = get_child_path(curr_val);
                var child_path = print_nodes(child_vals[0]);
                var log4 = {'OpType': 'READ', 'method': "getElementsByTagName", 'PropName': dom_var_name(child_path), 'NodeProp': "null", 'id': curr_id, 'child_path': child_path, 'script': caller, 'OrigLine': line}
                window.js_rewriting_logs.push(JSON.stringify(log4));
            }
        }

        return p;
    };

    var _querySelectorAll = document.querySelectorAll;
    document.querySelectorAll = function(requested_selector){
        // log the method name, argument (selector name), returned list of children (path for each)
        // returns the nodes in top-to-bottom order (any match)---not in order of selectors
        var caller = get_caller(document.currentScript);
        var stack = new Error().stack.split("\n")[1].split(":");
        var line = stack[stack.length - 2];
        var retVal = _querySelectorAll.call(document, requested_selector);
        var ret = get_multi_child_path(retVal);
        // wrap nodelist in proxy to log queries and wrap returned nodes
        var p = null;
        if ( retVal != null ) {
            var p = new Proxy( retVal, nodelist_handler );
            Object.defineProperty(p, '_base', {
                enumerable: false,
                configurable: false,
                writable: false,
                value: retVal
            });

            // read on every returned node
            for ( i = 0; i < retVal.length; i++ ) {
                var curr_id = "null";
                var curr_val = retVal[i];
                if ( retVal[i].hasOwnProperty("_id") ) {
                    curr_id = retVal[i]._id;
                    curr_val = retVal[i]._base;
                }
                var child_vals = get_child_path(curr_val);
                var child_path = print_nodes(child_vals[0]);
                var log4 = {'OpType': 'READ', 'method': "querySelectorAll", 'PropName': dom_var_name(child_path), 'NodeProp': "null", 'id': curr_id, 'child_path': child_path, 'script': caller, 'OrigLine': line}
                window.js_rewriting_logs.push(JSON.stringify(log4));
            }
        }
        return p;
    };

    var _getElementsByTagNameNS = document.getElementsByTagNameNS;
    document.getElementsByTagNameNS = function(namespace, requested_tag){
        var caller = get_caller(document.currentScript);
        var stack = new Error().stack.split("\n")[1].split(":");
        var line = stack[stack.length - 2];
        var retVal = _getElementsByTagNameNS.call(document, namespace, requested_tag);
        var ret = get_multi_child_path(retVal);
        // wrap nodelist in proxy to log queries and wrap returned nodes
        var p = null;
        if ( retVal != null ) {
            var p = new Proxy( retVal, nodelist_handler );
            Object.defineProperty(p, '_base', {
                enumerable: false,
                configurable: false,
                writable: false,
                value: retVal
            });

            // read on every returned node
            for ( i = 0; i < retVal.length; i++ ) {
                var curr_id = "null";
                var curr_val = retVal[i];
                if ( retVal[i].hasOwnProperty("_id") ) {
                    curr_id = retVal[i]._id;
                    curr_val = retVal[i]._base;
                }
                var child_vals = get_child_path(curr_val);
                var child_path = print_nodes(child_vals[0]);
                var log4 = {'OpType': 'READ', 'method': "getElementsByTagNameNS", 'PropName': dom_var_name(child_path), 'NodeProp': "null", 'id': curr_id, 'child_path': child_path, 'script': caller, 'OrigLine': line}
                window.js_rewriting_logs.push(JSON.stringify(log4));
            }
        }
        return p;
    };

    var _adoptNode = document.adoptNode;
    document.adoptNode = function(newnode){
        // tests whether comparenode and this node are equal (return bool)
        var arg1_val = newnode;
        var arg1_id = "null";
        if ( newnode.hasOwnProperty("_id") ) {
            arg1_id = newnode._id;
            arg1_val = newnode._base;
        }
        var arg1_child_vals = get_child_path(arg1_val);
        var arg1_childpath = print_nodes(arg1_child_vals[0]);

        // check if argument node already exists in DOM tree
        var exists = _contains.call(document, arg1_val);
        var prior_subtree = [];
        var arg_prevsibl_id = "null";
        var arg_prevsibl_childpath = "";
        var arg_nextsibl_id = "null";
        var arg_nextsibl_childpath = "";
        var nextsiblings = "";
        var arg_prevparent_id = "null";
        var arg_prevparent_childpath = "";
        var log_prevparent_firstchild = false;
        var log_prevparent_lastchild = false;
        if ( exists ) { // node existed previously
            prior_subtree = get_subtree_nodes(arg1_val);
            var y = arg1_val.previousSibling;
            if ( y == null ) {
            } else if ( y.hasOwnProperty("_id") ) {
                arg_prevsibl_id = y._id;
                arg_prevsibl_childpath = print_nodes(get_child_path(y._base)[0]);
            } else {
                arg_prevsibl_childpath = print_nodes(get_child_path(y)[0]);
            }
            var z = arg1_val.nextSibling;
            if ( z == null ) {
            } else if ( z.hasOwnProperty("_id") ) {
                arg_nextsibl_id = z._id;
                arg_nextsibl_childpath = print_nodes(get_child_path(z._base)[0]);
            } else {
                arg_nextsibl_childpath = print_nodes(get_child_path(z)[0]);
            }
            nextsiblings = get_next_siblings(arg1_val);
            var t = arg1_val.parentNode;
            if ( t.hasOwnProperty("_id") ) {
                arg_prevparent_id = t._id;
                arg_prevparent_childpath = print_nodes(get_child_path(t._base)[0]);
            } else {
                arg_prevparent_id = "null";
                arg_prevparent_childpath = print_nodes(get_child_path(t)[0]);
            }
            var f = t.firstChild; var l = t.lastChild;
            var f_val = f; var l_val = l;
            if ( f.hasOwnProperty("_id") ) {
                f_val = f._base;
                l_val = l._base;
            }
            if ( f_val == arg1_val ) {
                log_prevparent_firstchild = true;
            }
            if ( l_val == arg1_val ) {
                log_prevparent_lastchild = true;
            }
        }

        var caller = get_caller(document.currentScript);
        var stack = new Error().stack.split("\n")[1].split(":");
        var line = stack[stack.length - 2];
        var child_vals = get_child_path(arg1_val);
        var retVal = _adoptNode.call(document, arg1_val);
        var p = wrap_node_in_proxy(retVal);


        // only if argnode existed prior to this method call
        if ( exists ) {
            // if argnode previously exists in DOM, log writes to argnode and subtree
            var log6 = {'OpType': 'WRITE', 'method': "adoptNode", 'PropName': dom_var_name(arg1_childpath), 'NodeProp': "null", 'id': arg1_id, 'child_path': arg1_childpath, 'script': caller, 'OrigLine': line}
            window.js_rewriting_logs.push(JSON.stringify(log6));
            for ( i = 0; i < prior_subtree[1].length; i++ ) {
                var log6 = {'OpType': 'WRITE', 'method': "adoptNode", 'PropName': dom_var_name(prior_subtree[2][i]), 'NodeProp': "null", 'id': prior_subtree[0][i], 'child_path': prior_subtree[2][i], 'script': caller, 'OrigLine': line}
                window.js_rewriting_logs.push(JSON.stringify(log6));
            }
            // if argnode previously exists in DOM, log writes to prev and next sibl of argnode
            if ( arg_prevsibl_childpath != "" ) {
                var log7 = {'OpType': 'WRITE', 'method': "adoptNode", 'PropName': dom_var_name(arg_prevsibl_childpath), 'NodeProp': "nextSibling", 'id': arg_prevsibl_id, 'child_path': arg_prevsibl_childpath, 'script': caller, 'OrigLine': line}
                window.js_rewriting_logs.push(JSON.stringify(log7));
            }
            if ( arg_nextsibl_childpath != "" ) {
                var log7 = {'OpType': 'WRITE', 'method': "adoptNode", 'PropName': dom_var_name(arg_nextsibl_childpath), 'NodeProp': "previousSibling", 'id': arg_nextsibl_id, 'child_path': arg_nextsibl_childpath, 'script': caller, 'OrigLine': line}
                window.js_rewriting_logs.push(JSON.stringify(log7));
            }
            // if argnode previously exists in DOM, log writes to nextsiblings of 'this' until null
            for ( i = 0; i < nextsiblings[0].length; i++ ) {
                var log8 = {'OpType': 'WRITE', 'method': "adoptNode", 'PropName': dom_var_name(nextsiblings[1][i]), 'NodeProp': "null", 'id': nextsiblings[0][i], 'child_path': nextsiblings[1][i], 'script': caller, 'OrigLine': line}
                window.js_rewriting_logs.push(JSON.stringify(log8));
                var curr_subtree = get_subtree_nodes(nextsiblings[2][i]);
                for ( j = 0; j < curr_subtree[1].length; j++ ) {
                    var log6 = {'OpType': 'WRITE', 'method': "adoptNode", 'PropName': dom_var_name(curr_subtree[2][j]), 'NodeProp': "null", 'id': curr_subtree[0][j], 'child_path': curr_subtree[2][j], 'script': caller, 'OrigLine': line};
                    window.js_rewriting_logs.push(JSON.stringify(log6));
                }
            }
            // if argnode previously exists in DOM, maybe log writes to first and lastChild of argnode's parent, definitely childNodes
            var log9 = {'OpType': 'WRITE', 'method': "adoptNode", 'PropName': dom_var_name(arg_prevparent_childpath), 'NodeProp': "childNodes", 'id': arg_prevparent_id, 'child_path': arg_prevparent_childpath, 'script': caller, 'OrigLine': line}
            window.js_rewriting_logs.push(JSON.stringify(log9));
            if ( log_prevparent_firstchild ) {
                var log10 = {'OpType': 'WRITE', 'method': "adoptNode", 'PropName': dom_var_name(arg_prevparent_childpath), 'NodeProp': "firstChild", 'id': arg_prevparent_id, 'child_path': arg_prevparent_childpath, 'script': caller, 'OrigLine': line}
                window.js_rewriting_logs.push(JSON.stringify(log10));
            }
            if ( log_prevparent_lastchild ) {
                var log10 = {'OpType': 'WRITE', 'method': "adoptNode", 'PropName': dom_var_name(arg_prevparent_childpath), 'NodeProp': "lastChild", 'id': arg_prevparent_id, 'child_path': arg_prevparent_childpath, 'script': caller, 'OrigLine': line}
                window.js_rewriting_logs.push(JSON.stringify(log10));
            }
        }

        // write to the returned node
        var log7 = {'OpType': 'WRITE', 'method': "adoptNode", 'PropName': dom_var_name(""), 'NodeProp': "null", 'id': p[1], 'child_path': "", 'script': caller, 'OrigLine': line}
        window.js_rewriting_logs.push(JSON.stringify(log7));

        return p[0];
    };


    var _caretPositionFromPoint = document.caretPositionFromPoint;
    document.caretPositionFromPoint = function(x, y){
        // log the method name, argument (name), returned list of children (path for each)
        var caller = get_caller(document.currentScript);
        var stack = new Error().stack.split("\n")[1].split(":");
        var line = stack[stack.length - 2];
        var retVal = _caretPositionFromPoint.call(document, x, y);
        // wrap caretPosition in proxy to log offsetNode call and wrap returned nodes
        var p = null
        if ( retVal != null ) {
            var p = new Proxy( retVal, caret_handler );
            console.log( "Call to document.caretPositionFromPoint()---don't handle logging yet");
        }
        return p;
    };

    var _createAttribute = document.createAttribute;
    document.createAttribute = function(name){
        // log the method name, argument (id name), returned node child path
        var caller = get_caller(document.currentScript);
        var stack = new Error().stack.split("\n")[1].split(":");
        var line = stack[stack.length - 2];
        var retVal = _createAttribute.call(document, name);
        var p = wrap_node_in_proxy(retVal);

        // write to the returned node
        var log7 = {'OpType': 'WRITE', 'method': "createAttribute", 'PropName': dom_var_name(""), 'NodeProp': "null", 'id': p[1], 'child_path': "", 'script': caller, 'OrigLine': line}
        window.js_rewriting_logs.push(JSON.stringify(log7));

        return p[0];
   };

    var _createCDATASection = document.createCDATASection;
    document.createCDATASection = function(data){
        // only works with XML (HTML does not support CDATA sections)
        // log the method name, argument (id name), returned node child path
        var caller = get_caller(document.currentScript);
        var stack = new Error().stack.split("\n")[1].split(":");
        var line = stack[stack.length - 2];
        var retVal = _createCDATASection.call(document, data);
        var p = wrap_node_in_proxy(retVal);

        // write to the returned node
        var log7 = {'OpType': 'WRITE', 'method': "createCDATASection", 'PropName': dom_var_name(""), 'NodeProp': "null", 'id': p[1], 'child_path': "", 'script': caller, 'OrigLine': line}
        window.js_rewriting_logs.push(JSON.stringify(log7));

        return p[0];
    };

    var _createComment = document.createComment;
    document.createComment = function(data){
        var caller = get_caller(document.currentScript);
        var stack = new Error().stack.split("\n")[1].split(":");
        var line = stack[stack.length - 2];
        var retVal = _createComment.call(document, data);
        var p = wrap_node_in_proxy(retVal);

        // write to the returned node
        var log7 = {'OpType': 'WRITE', 'method': "createComment", 'PropName': dom_var_name(""), 'NodeProp': "null", 'id': p[1], 'child_path': "", 'script': caller, 'OrigLine': line}
        window.js_rewriting_logs.push(JSON.stringify(log7));

        return p[0];
    };

    var _createDocumentFragment = document.createDocumentFragment;
    document.createDocumentFragment = function(){
        // log the method name, argument (id name), returned node child path
        var caller = get_caller(document.currentScript);
        var stack = new Error().stack.split("\n")[1].split(":");
        var line = stack[stack.length - 2];
        var retVal = _createDocumentFragment.call(document);
        var p = wrap_node_in_proxy(retVal);
        console.log( "Call to document.createDocumentFragment()---don't log anything because never added to DOM");
        return p[0];
    };

    var _createElement = document.createElement;
    document.createElement = function(tagname){
        // log the method name, argument (id name), returned node child path
        var caller = get_caller(document.currentScript);
        var stack = new Error().stack.split("\n")[1].split(":");
        var line = stack[stack.length - 2];
        var retVal = _createElement.call(document, tagname);
        var p = wrap_node_in_proxy(retVal);

        // write to the returned node
        var log7 = {'OpType': 'WRITE', 'method': "createElement", 'PropName': dom_var_name(""), 'NodeProp': "null", 'id': p[1], 'child_path': "", 'script': caller, 'OrigLine': line}
        window.js_rewriting_logs.push(JSON.stringify(log7));

        return p[0];
    };

    var _createElementNS = document.createElementNS;
    document.createElementNS = function(namespaceURI, qualName){
        // log the method name, argument (id name), returned node child path
        var caller = get_caller(document.currentScript);
        var stack = new Error().stack.split("\n")[1].split(":");
        var line = stack[stack.length - 2];
        var retVal = _createElementNS.call(document, namespaceURI, qualName);
        var p = wrap_node_in_proxy(retVal);

        // write to the returned node
        var log7 = {'OpType': 'WRITE', 'method': "createElementNS", 'PropName': dom_var_name(""), 'NodeProp': "null", 'id': p[1], 'child_path': "", 'script': caller, 'OrigLine': line}
        window.js_rewriting_logs.push(JSON.stringify(log7));

        return p[0];
    };

    var _createTextNode = document.createTextNode;
    document.createTextNode = function(data){
        // log the method name, argument (id name), returned node child path
        var caller = get_caller(document.currentScript);
        var stack = new Error().stack.split("\n")[1].split(":");
        var line = stack[stack.length - 2];
        var retVal = _createTextNode.call(document, data);
        var p = wrap_node_in_proxy(retVal);

        // write to the returned node
        var log7 = {'OpType': 'WRITE', 'method': "createTextNode", 'PropName': dom_var_name(""), 'NodeProp': "null", 'id': p[1], 'child_path': "", 'script': caller, 'OrigLine': line}
        window.js_rewriting_logs.push(JSON.stringify(log7));

        return p[0];
    };

    var _createProcessingInstruction = document.createProcessingInstruction;
    document.createProcessingInstruction = function(target, data){
        // log the method name, argument (id name), returned node child path
        var caller = get_caller(document.currentScript);
        var stack = new Error().stack.split("\n")[1].split(":");
        var line = stack[stack.length - 2];
        var retVal = _createProcessingInstruction.call(document, target, data);
        var p = wrap_node_in_proxy(retVal);

        // write to the returned node
        var log7 = {'OpType': 'WRITE', 'method': "createProcessingInstruction", 'PropName': dom_var_name(""), 'NodeProp': "null", 'id': p[1], 'child_path': "", 'script': caller, 'OrigLine': line}
        window.js_rewriting_logs.push(JSON.stringify(log7));

        return p[0];
    };

    var _elementFromPoint = document.elementFromPoint;
    document.elementFromPoint = function(x, y){
        // log the method name, argument (id name), returned node child path
        var caller = get_caller(document.currentScript);
        var stack = new Error().stack.split("\n")[1].split(":");
        var line = stack[stack.length - 2];
        var retVal = _elementFromPoint.call(document, x, y);
        var p = wrap_node_in_proxy(retVal);
        console.log( "Call to document.elementFromPoint()---currently we don't handle logging for this method");
        return p[0];
    };

    var _createNodeIterator = document.createNodeIterator;
    document.createNodeIterator = function(root, whatToShow, filter){
        // log the method name, argument (id name), returned node child path
        var arg1_id = "null";
        var arg1_val = root;
        if ( root.hasOwnProperty("_id") ) {
            arg1_id = root._id;
            arg1_val = root._base;
        }
        var arg1_child_vals = get_child_path(arg1_val);
        var arg1_childpath = print_nodes(arg1_child_vals[0]);
        var caller = get_caller(document.currentScript);
        var stack = new Error().stack.split("\n")[1].split(":");
        var line = stack[stack.length - 2];
        var retVal;
        if ( (whatToShow == undefined) && (filter == undefined) ) {
            retVal = _createNodeIterator.call(document, arg1_val);
        } else if ( whatToShow == undefined ) {
            var retVal = _createNodeIterator.call(document, arg1_val, filter);
        } else if ( filter == undefined ) {
            var retVal = _createNodeIterator.call(document, arg1_val, whatToShow);
        } else {
            var retVal = _createNodeIterator.call(document, arg1_val, whatToShow, filter);
        }
        var p = null;
        if ( retVal != null ) {
            var p = new Proxy( retVal, nodeiterator_handler );
            Object.defineProperty(p, '_base', {
                enumerable: false,
                configurable: false,
                writable: false,
                value: retVal
            });
        }

        // read on root node (argument)
        var log7 = {'OpType': 'READ', 'method': "createNodeIterator", 'PropName': dom_var_name(arg1_childpath), 'NodeProp': "null", 'id': arg1_id, 'child_path': arg1_childpath, 'script': caller, 'OrigLine': line}
        window.js_rewriting_logs.push(JSON.stringify(log7));

        return p;
    };

    var _createNSResolver = document.createNSResolver;
    document.createNSResolver = function(node){
        var arg1_val = node;
        var arg1_id = "null";
        if ( node.hasOwnProperty("_id") ) {
            arg1_id = node._id;
            arg1_val = node._base;
        }
        var arg1_child_vals = get_child_path(arg1_val);
        var arg1_childpath = print_nodes(arg1_child_vals[0]);

        var caller = get_caller(document.currentScript);
        var stack = new Error().stack.split("\n")[1].split(":");
        var line = stack[stack.length - 2];
        var child_vals = get_child_path(arg1_val);
        var retVal = _createNSResolver.call(document, arg1_val);

        // read on argnode
        var log7 = {'OpType': 'READ', 'method': "createNSResolver", 'PropName': dom_var_name(arg1_childpath), 'NodeProp': "null", 'id': arg1_id, 'child_path': arg1_childpath, 'script': caller, 'OrigLine': line}
        window.js_rewriting_logs.push(JSON.stringify(log7));

        return retVal;
    };

    var _importNode = document.importNode;
    document.importNode = function(node, deep){
        // tests whether comparenode and this node are equal (return bool)
        var arg1_val = node;
        var arg1_id = "null";
        if ( node.hasOwnProperty("_id") ) {
            arg1_id = node._id;
            arg1_val = node._base;
        }
        var arg1_child_vals = get_child_path(arg1_val);
        var arg1_childpath = print_nodes(arg1_child_vals[0]);
        prior_subtree = get_subtree_nodes(arg1_val);
        var caller = get_caller(document.currentScript);
        var stack = new Error().stack.split("\n")[1].split(":");
        var line = stack[stack.length - 2];
        var child_vals = get_child_path(arg1_val);
        var retVal = _importNode.call(document, arg1_val, deep);
        var p = wrap_node_in_proxy(retVal);
        post_subtree = get_subtree_nodes(p[0]._base);
        // read on argnode
        var log7 = {'OpType': 'READ', 'method': "importNode", 'PropName': dom_var_name(arg1_childpath), 'NodeProp': "null", 'id': arg1_id, 'child_path': arg1_childpath, 'script': caller, 'OrigLine': line}
        window.js_rewriting_logs.push(JSON.stringify(log7));

        // if deep is true, then log reads on argnode's subtree
        if ( deep ) {
            for ( i = 0; i < prior_subtree[1].length; i++ ) {
                var log6 = {'OpType': 'READ', 'method': "importNode", 'PropName': dom_var_name(prior_subtree[2][i]), 'NodeProp': "null", 'id': prior_subtree[0][i], 'child_path': prior_subtree[2][i], 'script': caller, 'OrigLine': line}
                window.js_rewriting_logs.push(JSON.stringify(log6));
            }
        }

        // write on returned node
        var log7 = {'OpType': 'WRITE', 'method': "importNode", 'PropName': dom_var_name(""), 'NodeProp': "null", 'id': p[1], 'child_path': "", 'script': caller, 'OrigLine': line}
        window.js_rewriting_logs.push(JSON.stringify(log7));

        // write on returned node and subtree (if deep is true)
        if ( deep ) {
            // write on returned node's subtree
            for ( i = 0; i < post_subtree[1].length; i++ ) {
                var log6 = {'OpType': 'WRITE', 'method': "importNode", 'PropName': dom_var_name(post_subtree[2][i]), 'NodeProp': "null", 'id': post_subtree[0][i], 'child_path': post_subtree[2][i], 'script': caller, 'OrigLine': line}
                window.js_rewriting_logs.push(JSON.stringify(log6));
            }
        }

        return p[0];
    };

    var _getAttribute = Element.prototype.getAttribute;
    Element.prototype.getAttribute = function(attrname){
        var this_id = "null";
        var this_val = this;
        if ( this.hasOwnProperty("_id") ) {
            this_id = this._id;
            this_val = this._base;
        } else {
            console.log( "Calling getAttribute() on DOM node which is not proxy" );
        }
        var this_child_vals = get_child_path(this_val);
        var this_child_path = print_nodes(this_child_vals[0]);
        var caller = get_caller(document.currentScript);
        var stack = new Error().stack.split("\n")[1].split(":");
        var line = stack[stack.length - 2];
        var child_vals = get_child_path(this_val);
        var retVal = _getAttribute.call(this_val, attrname);

        // read on 'this' node's 'attributes' property
        var log1 = {'OpType': 'READ', 'method': "getAttribute", 'PropName': dom_var_name(this_child_path), 'NodeProp': "attributes", 'id': this_id, 'child_path': this_child_path, 'script': caller, 'OrigLine': line}
        window.js_rewriting_logs.push(JSON.stringify(log1));

        return retVal;
    };

    var _getAttributeNS = Element.prototype.getAttributeNS;
    Element.prototype.getAttributeNS = function(namespace, attrname){
        var this_id = "null";
        var this_val = this;
        if ( this.hasOwnProperty("_id") ) {
            this_id = this._id;
            this_val = this._base;
        } else {
            console.log( "Calling getAttributeNS() on DOM node which is not proxy" );
        }
        var this_child_vals = get_child_path(this_val);
        var this_child_path = print_nodes(this_child_vals[0]);
        var caller = get_caller(document.currentScript);
        var stack = new Error().stack.split("\n")[1].split(":");
        var line = stack[stack.length - 2];
        var child_vals = get_child_path(this_val);
        var retVal = _getAttributeNS.call(this_val, namespace, attrname);

        // read on 'this' node's 'attributes' property
        var log1 = {'OpType': 'READ', 'method': "getAttributeNS", 'PropName': dom_var_name(this_child_path), 'NodeProp': "attributes", 'id': this_id, 'child_path': this_child_path, 'script': caller, 'OrigLine': line}
        window.js_rewriting_logs.push(JSON.stringify(log1));

        return retVal;
    };

    var _getAttributeNode = Element.prototype.getAttributeNode;
    Element.prototype.getAttributeNode = function(attrname){
        var this_id = "null";
        var this_val = this;
        if ( this.hasOwnProperty("_id") ) {
            this_id = this._id;
            this_val = this._base;
        } else {
            console.log( "Calling getAttributeNode() on DOM node which is not proxy" );
        }
        var this_child_vals = get_child_path(this_val);
        var this_child_path = print_nodes(this_child_vals[0]);
        var caller = get_caller(document.currentScript);
        var stack = new Error().stack.split("\n")[1].split(":");
        var line = stack[stack.length - 2];
        var child_vals = get_child_path(this_val);
        var retVal = _getAttributeNode.call(this_val, attrname);

        console.log("We don't handle logging for getAttributeNode()");

        return retVal;
    };

    var _getAttributeNodeNS = Element.prototype.getAttributeNodeNS;
    Element.prototype.getAttributeNodeNS = function(namespace, attrname){
        var this_id = "null";
        var this_val = this;
        if ( this.hasOwnProperty("_id") ) {
            this_id = this._id;
            this_val = this._base;
        } else {
            console.log( "Calling getAttributeNodeNS() on DOM node which is not proxy" );
        }
        var this_child_vals = get_child_path(this_val);
        var this_child_path = print_nodes(this_child_vals[0]);
        var caller = get_caller(document.currentScript);
        var stack = new Error().stack.split("\n")[1].split(":");
        var line = stack[stack.length - 2];
        var child_vals = get_child_path(this_val);
        var retVal = _getAttributeNodeNS.call(this_val, namespace, attrname);

        console.log("We don't handle logging for getAttributeNodeNS()");

        return retVal;
    };

    var _getBoundingClientRect = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = function(){
        var this_id = "null";
        var this_val = this;
        if ( this.hasOwnProperty("_id") ) {
            this_id = this._id;
            this_val = this._base;
        } else {
            console.log( "Calling getBoundingClientRect() on DOM node which is not proxy" );
        }
        var this_child_vals = get_child_path(this_val);
        var this_child_path = print_nodes(this_child_vals[0]);
        var caller = get_caller(document.currentScript);
        var stack = new Error().stack.split("\n")[1].split(":");
        var line = stack[stack.length - 2];
        var child_vals = get_child_path(this_val);
        var retVal = _getBoundingClientRect.call(this_val);

        // read on 'this' node
        var log1 = {'OpType': 'READ', 'method': "getBoundingClientRect", 'PropName': dom_var_name(this_child_path), 'NodeProp': "", 'id': this_id, 'child_path': this_child_path, 'script': caller, 'OrigLine': line}
        window.js_rewriting_logs.push(JSON.stringify(log1));

        return retVal;
    };

    var _getClientRects = Element.prototype.getClientRects;
    Element.prototype.getClientRects = function(){
        var this_id = "null";
        var this_val = this;
        if ( this.hasOwnProperty("_id") ) {
            this_id = this._id;
            this_val = this._base;
        } else {
            console.log( "Calling getClientRects() on DOM node which is not proxy" );
        }
        var this_child_vals = get_child_path(this_val);
        var this_child_path = print_nodes(this_child_vals[0]);
        var caller = get_caller(document.currentScript);
        var stack = new Error().stack.split("\n")[1].split(":");
        var line = stack[stack.length - 2];
        var child_vals = get_child_path(this_val);
        var retVal = _getClientRects.call(this_val);

        // read on 'this' node
        var log1 = {'OpType': 'READ', 'method': "getClientRects", 'PropName': dom_var_name(this_child_path), 'NodeProp': "", 'id': this_id, 'child_path': this_child_path, 'script': caller, 'OrigLine': line}
        window.js_rewriting_logs.push(JSON.stringify(log1));

        return retVal;
    };

    var __getElementsByClassName = Element.prototype.getElementsByClassName;
    Element.prototype.getElementsByClassName = function(requested_class){
        var this_id = "null";
        var this_val = this;
        if ( this.hasOwnProperty("_id") ) {
            this_id = this._id;
            this_val = this._base;
        } else {
            console.log( "Calling getElementsByClassName() on DOM node which is not proxy" );
        }
        var this_child_vals = get_child_path(this_val);
        var this_child_path = print_nodes(this_child_vals[0]);
        var prior_subtree = get_subtree_nodes(this_val);
        var caller = get_caller(document.currentScript);
        var stack = new Error().stack.split("\n")[1].split(":");
        var line = stack[stack.length - 2];
        var retVal = __getElementsByClassName.call(this_val, requested_class);
        var ret = get_multi_child_path(retVal);
        // wrap nodelist in proxy to log queries and wrap returned nodes
        var p = null;
        // log reads on 'this' node and its subtree
        var log6 = {'OpType': 'READ', 'method': "getElementsByClassName", 'PropName': dom_var_name(this_child_path), 'NodeProp': "null", 'id': this_id, 'child_path': this_child_path, 'script': caller, 'OrigLine': line}
        window.js_rewriting_logs.push(JSON.stringify(log6));
        for ( i = 0; i < prior_subtree[1].length; i++ ) {
            var log6 = {'OpType': 'READ', 'method': "getElementsByClassName", 'PropName': dom_var_name(prior_subtree[2][i]), 'NodeProp': "null", 'id': prior_subtree[0][i], 'child_path': prior_subtree[2][i], 'script': caller, 'OrigLine': line}
            window.js_rewriting_logs.push(JSON.stringify(log6));
        }
        if ( retVal != null ) {
            var p = new Proxy( retVal, nodelist_handler );
            Object.defineProperty(p, '_base', {
                enumerable: false,
                configurable: false,
                writable: false,
                value: retVal
            });

            // read on every returned node
            for ( i = 0; i < retVal.length; i++ ) {
                var curr_id = "null";
                var curr_val = retVal[i];
                if ( retVal[i].hasOwnProperty("_id") ) {
                    curr_id = retVal[i]._id;
                    curr_val = retVal[i]._base;
                }
                var child_vals = get_child_path(curr_val);
                var child_path = print_nodes(child_vals[0]);
                var log4 = {'OpType': 'READ', 'method': "getElementsByClassName", 'PropName': dom_var_name(child_path), 'NodeProp': "null", 'id': curr_id, 'child_path': child_path, 'script': caller, 'OrigLine': line}
                window.js_rewriting_logs.push(JSON.stringify(log4));
            }
        }
        return p;
    };

    var __getElementsByTagName = Element.prototype.getElementsByTagName;
    Element.prototype.getElementsByTagName = function(requested_tag){
        var this_id = "null";
        var this_val = this;
        if ( this.hasOwnProperty("_id") ) {
            this_id = this._id;
            this_val = this._base;
        } else {
            console.log( "Calling getElementsByTagName() on DOM node which is not proxy" );
        }
        var this_child_vals = get_child_path(this_val);
        var this_child_path = print_nodes(this_child_vals[0]);
        var prior_subtree = get_subtree_nodes(this_val);
        var caller = get_caller(document.currentScript);
        var stack = new Error().stack.split("\n")[1].split(":");
        var line = stack[stack.length - 2];
        var retVal = __getElementsByTagName.call(this_val, requested_tag);
        var ret = get_multi_child_path(retVal);
        // wrap nodelist in proxy to log queries and wrap returned nodes
        var p = null;
        // log reads on 'this' node and its subtree
        var log6 = {'OpType': 'READ', 'method': "getElementsByTagName", 'PropName': dom_var_name(this_child_path), 'NodeProp': "null", 'id': this_id, 'child_path': this_child_path, 'script': caller, 'OrigLine': line}
        window.js_rewriting_logs.push(JSON.stringify(log6));
        for ( i = 0; i < prior_subtree[1].length; i++ ) {
            var log6 = {'OpType': 'READ', 'method': "getElementsByTagName", 'PropName': dom_var_name(prior_subtree[2][i]), 'NodeProp': "null", 'id': prior_subtree[0][i], 'child_path': prior_subtree[2][i], 'script': caller, 'OrigLine': line}
            window.js_rewriting_logs.push(JSON.stringify(log6));
        }
        if ( retVal != null ) {
            var p = new Proxy( retVal, nodelist_handler );
            Object.defineProperty(p, '_base', {
                enumerable: false,
                configurable: false,
                writable: false,
                value: retVal
            });

            // read on every returned node
            for ( i = 0; i < retVal.length; i++ ) {
                var curr_id = "null";
                var curr_val = retVal[i];
                if ( retVal[i].hasOwnProperty("_id") ) {
                    curr_id = retVal[i]._id;
                    curr_val = retVal[i]._base;
                }
                var child_vals = get_child_path(curr_val);
                var child_path = print_nodes(child_vals[0]);
                var log4 = {'OpType': 'READ', 'method': "getElementsByTagName", 'PropName': dom_var_name(child_path), 'NodeProp': "null", 'id': curr_id, 'child_path': child_path, 'script': caller, 'OrigLine': line}
                window.js_rewriting_logs.push(JSON.stringify(log4));
            }
        }
        return p;
    };

    var __getElementsByTagNameNS = Element.prototype.getElementsByTagNameNS;
    Element.prototype.getElementsByTagNameNS = function(namespace, requested_tag){
        var this_id = "null";
        var this_val = this;
        if ( this.hasOwnProperty("_id") ) {
            this_id = this._id;
            this_val = this._base;
        } else {
            console.log( "Calling getElementsByTagNameNS() on DOM node which is not proxy" );
        }
        var this_child_vals = get_child_path(this_val);
        var this_child_path = print_nodes(this_child_vals[0]);
        var prior_subtree = get_subtree_nodes(this_val);
        var caller = get_caller(document.currentScript);
        var stack = new Error().stack.split("\n")[1].split(":");
        var line = stack[stack.length - 2];
        var retVal = __getElementsByTagNameNS.call(this_val, namespace, requested_tag);
        var ret = get_multi_child_path(retVal);
        // wrap nodelist in proxy to log queries and wrap returned nodes
        var p = null;
        // log reads on 'this' node and its subtree
        var log6 = {'OpType': 'READ', 'method': "getElementsByTagNameNS", 'PropName': dom_var_name(this_child_path), 'NodeProp': "null", 'id': this_id, 'child_path': this_child_path, 'script': caller, 'OrigLine': line}
        window.js_rewriting_logs.push(JSON.stringify(log6));
        for ( i = 0; i < prior_subtree[1].length; i++ ) {
            var log6 = {'OpType': 'READ', 'method': "getElementsByTagNameNS", 'PropName': dom_var_name(prior_subtree[2][i]), 'NodeProp': "null", 'id': prior_subtree[0][i], 'child_path': prior_subtree[2][i], 'script': caller, 'OrigLine': line}
            window.js_rewriting_logs.push(JSON.stringify(log6));
        }
        if ( retVal != null ) {
            var p = new Proxy( retVal, nodelist_handler );
            Object.defineProperty(p, '_base', {
                enumerable: false,
                configurable: false,
                writable: false,
                value: retVal
            });

            // read on every returned node
            for ( i = 0; i < retVal.length; i++ ) {
                var curr_id = "null";
                var curr_val = retVal[i];
                if ( retVal[i].hasOwnProperty("_id") ) {
                    curr_id = retVal[i]._id;
                    curr_val = retVal[i]._base;
                }
                var child_vals = get_child_path(curr_val);
                var child_path = print_nodes(child_vals[0]);
                var log4 = {'OpType': 'READ', 'method': "getElementsByTagNameNS", 'PropName': dom_var_name(child_path), 'NodeProp': "null", 'id': curr_id, 'child_path': child_path, 'script': caller, 'OrigLine': line}
                window.js_rewriting_logs.push(JSON.stringify(log4));
            }
        }
        return p;
    };

    var _hasAttribute = Element.prototype.hasAttribute;
    Element.prototype.hasAttribute = function(attrname){
        var this_id = "null";
        var this_val = this;
        if ( this.hasOwnProperty("_id") ) {
            this_id = this._id;
            this_val = this._base;
        } else {
            console.log( "Calling hasAttribute() on DOM node which is not proxy" );
        }
        var this_child_vals = get_child_path(this_val);
        var this_child_path = print_nodes(this_child_vals[0]);
        var caller = get_caller(document.currentScript);
        var stack = new Error().stack.split("\n")[1].split(":");
        var line = stack[stack.length - 2];
        var child_vals = get_child_path(this_val);
        var retVal = _hasAttribute.call(this_val, attrname);

        // read on 'this' node's 'attributes' property
        var log1 = {'OpType': 'READ', 'method': "hasAttribute", 'PropName': dom_var_name(this_child_path), 'NodeProp': "attributes", 'id': this_id, 'child_path': this_child_path, 'script': caller, 'OrigLine': line}
        window.js_rewriting_logs.push(JSON.stringify(log1));

        return retVal;
    };

    var _hasAttributeNS = Element.prototype.hasAttributeNS;
    Element.prototype.hasAttributeNS = function(namespace, attrname){
        var this_id = "null";
        var this_val = this;
        if ( this.hasOwnProperty("_id") ) {
            this_id = this._id;
            this_val = this._base;
        } else {
            console.log( "Calling hasAttributeNS() on DOM node which is not proxy" );
        }
        var this_child_vals = get_child_path(this_val);
        var this_child_path = print_nodes(this_child_vals[0]);
        var caller = get_caller(document.currentScript);
        var stack = new Error().stack.split("\n")[1].split(":");
        var line = stack[stack.length - 2];
        var child_vals = get_child_path(this_val);
        var retVal = _hasAttributeNS.call(this_val, namespace, attrname);

        // read on 'this' node's 'attributes' property
        var log1 = {'OpType': 'READ', 'method': "hasAttributeNS", 'PropName': dom_var_name(this_child_path), 'NodeProp': "attributes", 'id': this_id, 'child_path': this_child_path, 'script': caller, 'OrigLine': line}
        window.js_rewriting_logs.push(JSON.stringify(log1));

        return retVal;
    };

    var _hasAttributes = Element.prototype.hasAttributes;
    Element.prototype.hasAttributes = function(){
        var this_id = "null";
        var this_val = this;
        if ( this.hasOwnProperty("_id") ) {
            this_id = this._id;
            this_val = this._base;
        } else {
            console.log( "Calling hasAttributes() on DOM node which is not proxy" );
        }
        var this_child_vals = get_child_path(this_val);
        var this_child_path = print_nodes(this_child_vals[0]);
        var caller = get_caller(document.currentScript);
        var stack = new Error().stack.split("\n")[1].split(":");
        var line = stack[stack.length - 2];
        var child_vals = get_child_path(this_val);
        var retVal = _hasAttributes.call(this_val);

        // read on 'this' node's 'attributes' property
        var log1 = {'OpType': 'READ', 'method': "hasAttributes", 'PropName': dom_var_name(this_child_path), 'NodeProp': "attributes", 'id': this_id, 'child_path': this_child_path, 'script': caller, 'OrigLine': line}
        window.js_rewriting_logs.push(JSON.stringify(log1));

        return retVal;
    };

    var _insertAdjacentHTML = Element.prototype.insertAdjacentHTML;
    Element.prototype.insertAdjacentHTML = function(position, text){
        var this_id = "null";
        var this_val = this;
        if ( this.hasOwnProperty("_id") ) {
            this_id = this._id;
            this_val = this._base;
        } else {
            console.log( "Calling insertAdjacentHTML() on DOM node which is not proxy" );
        }
        var this_child_vals = get_child_path(this_val);
        var this_child_path = print_nodes(this_child_vals[0]);
        var thisparent = this_val.parentNode;
        var thisparent_val = thisparent;
        var thisparent_id = "null";
        var thisparent_child_path = "";
        if ( thisparent.hasOwnProperty("_id") ) {
            thisparent_val = thisparent._base;
            thisparent_id = thisparent._id;
            var thisparent_child_vals = get_child_path(thisparent_val);
            var thisparent_child_path = print_nodes(thisparent_child_vals[0]);
        } else {
            var thisparent_child_vals = get_child_path(thisparent);
            thisparent_child_path = print_nodes(thisparent_child_vals[0]);
        }
        var this_prior_subtree = get_subtree_nodes(this_val);
        var log_this_parent_firstchild = false;
        var log_this_parent_firstchild1 = false;
        var thisparent_firstchild = thisparent_val.firstChild;
        var thisparent_firstchild_val = thisparent_firstchild;
        if ( thisparent_firstchild.hasOwnProperty("_id") ) {
            thisparent_firstchild_val = thisparent_firstchild._base;
        }
        if ( thisparent_firstchild_val == thisparent_val ) {
            log_this_parent_firstchild = true;
        }
        if ( thisparent_firstchild_val == "null" ) {
            log_this_parent_firstchild1 = true;
        }


        var log_prev_last = false;
        prev_last = this_val.lastChild;
        prev_last_val = prev_last;
        prev_last_id = "null";
        if ( prev_last != "null" ) {
            log_prev_last == true;
            if ( prev_last.hasOwnProperty("_id") ) {
                prev_last_val = prev_last._base;
                prev_last_id = prev_last._id;
            }
        }

        var log_this_last_child = false;
        if ( this_val.lastChild == "null" ) {
            log_this_last_child = true;
        }

        nextsiblings = get_next_siblings(this_val);

        // log writes to 'this' nodes and nextSiblings and their subtrees before the call
        // write on 'this' node
        var log1 = {'OpType': 'WRITE', 'method': "insertAdjacentHTML", 'PropName': dom_var_name(this_child_path), 'NodeProp': "null", 'id': this_id, 'child_path': this_child_path, 'script': caller, 'OrigLine': line}
        window.js_rewriting_logs.push(JSON.stringify(log1));

        if ( position == 'beforebegin' || position == 'afterbegin' ) {
            // write on 'this' node's subtree
            for ( i = 0; i < this_prior_subtree[1].length; i++ ) {
                var log6 = {'OpType': 'WRITE', 'method': "insertAdjacent", 'PropName': dom_var_name(this_prior_subtree[2][i]), 'NodeProp': "null", 'id': this_prior_subtree[0][i], 'child_path': this_prior_subtree[2][i], 'script': caller, 'OrigLine': line};
                window.js_rewriting_logs.push(JSON.stringify(log6));
            }
            // write to 'this' node's nextSiblings and their subtrees until null
            for ( i = 0; i < nextsiblings[0].length; i++ ) {
                var log8 = {'OpType': 'WRITE', 'method': "appendChild", 'PropName': dom_var_name(nextsiblings[1][i]), 'NodeProp': "null", 'id': nextsiblings[0][i], 'child_path': nextsiblings[1][i], 'script': caller, 'OrigLine': line}
                var curr_subtree = get_subtree_nodes(nextsiblings[2][i]);
                window.js_rewriting_logs.push(JSON.stringify(log8));
                for ( j = 0; j < curr_subtree[1].length; j++ ) {
                    var log6 = {'OpType': 'WRITE', 'method': "insertAdjacent", 'PropName': dom_var_name(curr_subtree[2][j]), 'NodeProp': "null", 'id': curr_subtree[0][j], 'child_path': curr_subtree[2][j], 'script': caller, 'OrigLine': line};
                    window.js_rewriting_logs.push(JSON.stringify(log6));
                }

            }
        }
        var caller = get_caller(document.currentScript);
        var stack = new Error().stack.split("\n")[1].split(":");
        var line = stack[stack.length - 2];
        var child_vals = get_child_path(this_val);
        var retVal = _insertAdjacentHTML.call(this_val, position, text);

        // read on 'this' node
        var log1 = {'OpType': 'READ', 'method': "insertAdjacentHTML", 'PropName': dom_var_name(this_child_path), 'NodeProp': "null", 'id': this_id, 'child_path': this_child_path, 'script': caller, 'OrigLine': line}
        window.js_rewriting_logs.push(JSON.stringify(log1));

        if ( position == 'beforebegin' ) {
            // write on childNodes property of 'this.parentNode' node
            var log2 = {'OpType': 'WRITE', 'method': "insertAdjacentHTML", 'PropName': dom_var_name(thisparent_child_path), 'NodeProp': "childNodes", 'id': thisparent_id, 'child_path': thisparent_child_path, 'script': caller, 'OrigLine': line}
            window.js_rewriting_logs.push(JSON.stringify(log2));
            // maybe a write on the  property of 'this.parentNode' node's previous firstChild
            if ( log_this_parent_firstchild ) {
                var log4 = {'OpType': 'WRITE', 'method': "insertAdjacentHTML", 'PropName': dom_var_name(thisparent_child_path), 'NodeProp': "firstChild", 'id': thisparent_id, 'child_path': thisparent_child_path, 'script': caller, 'OrigLine': line}
                window.js_rewriting_logs.push(JSON.stringify(log4));
            }
            // write on 'this' node
            var log1 = {'OpType': 'WRITE', 'method': "insertAdjacentHTML", 'PropName': dom_var_name(this_child_path), 'NodeProp': "null", 'id': this_id, 'child_path': this_child_path, 'script': caller, 'OrigLine': line}
            window.js_rewriting_logs.push(JSON.stringify(log1));

            // write on 'this' node's subtree
            for ( i = 0; i < this_prior_subtree[1].length; i++ ) {
                var log6 = {'OpType': 'WRITE', 'method': "insertAdjacent", 'PropName': dom_var_name(this_prior_subtree[2][i]), 'NodeProp': "null", 'id': this_prior_subtree[0][i], 'child_path': this_prior_subtree[2][i], 'script': caller, 'OrigLine': line};
                window.js_rewriting_logs.push(JSON.stringify(log6));
            }
            // write to 'this' node's nextSiblings and their subtrees until null
            for ( i = 0; i < nextsiblings[0].length; i++ ) {
                var log8 = {'OpType': 'WRITE', 'method': "appendChild", 'PropName': dom_var_name(nextsiblings[1][i]), 'NodeProp': "null", 'id': nextsiblings[0][i], 'child_path': nextsiblings[1][i], 'script': caller, 'OrigLine': line}
                window.js_rewriting_logs.push(JSON.stringify(log8));
                var curr_subtree = get_subtree_nodes(nextsiblings[2][i]);
                for ( j = 0; j < curr_subtree[1].length; j++ ) {
                    var log6 = {'OpType': 'WRITE', 'method': "insertAdjacent", 'PropName': dom_var_name(curr_subtree[2][j]), 'NodeProp': "null", 'id': curr_subtree[0][j], 'child_path': curr_subtree[2][j], 'script': caller, 'OrigLine': line};
                    window.js_rewriting_logs.push(JSON.stringify(log6));
                }
            }
        }

        if ( position == 'afterbegin' ) {
            // write on childNodes property of 'this' node
            var log2 = {'OpType': 'WRITE', 'method': "insertAdjacentHTML", 'PropName': dom_var_name(this_child_path), 'NodeProp': "childNodes", 'id': this_id, 'child_path': this_child_path, 'script': caller, 'OrigLine': line}
            window.js_rewriting_logs.push(JSON.stringify(log2));

            // write on firstChild property of 'this' node
            var log2 = {'OpType': 'WRITE', 'method': "insertAdjacentHTML", 'PropName': dom_var_name(this_child_path), 'NodeProp': "firstChild", 'id': this_id, 'child_path': this_child_path, 'script': caller, 'OrigLine': line}
            window.js_rewriting_logs.push(JSON.stringify(log2));

            // maybe a write on the  property of 'this' node's previous lastChild
            if ( log_this_last_child ) {
                var log4 = {'OpType': 'WRITE', 'method': "insertAdjacentHTML", 'PropName': dom_var_name(this_child_path), 'NodeProp': "lastChild", 'id': this_id, 'child_path': this_child_path, 'script': caller, 'OrigLine': line}
                window.js_rewriting_logs.push(JSON.stringify(log4));
            }
            // write on 'this' node
            var log1 = {'OpType': 'WRITE', 'method': "insertAdjacentHTML", 'PropName': dom_var_name(this_child_path), 'NodeProp': "null", 'id': this_id, 'child_path': this_child_path, 'script': caller, 'OrigLine': line}
            window.js_rewriting_logs.push(JSON.stringify(log1));

            // write on 'this' node's subtree
            for ( i = 0; i < this_prior_subtree[1].length; i++ ) {
                var log6 = {'OpType': 'WRITE', 'method': "insertAdjacent", 'PropName': dom_var_name(this_prior_subtree[2][i]), 'NodeProp': "null", 'id': this_prior_subtree[0][i], 'child_path': this_prior_subtree[2][i], 'script': caller, 'OrigLine': line};
                window.js_rewriting_logs.push(JSON.stringify(log6));
            }
            // write to 'this' node's nextSiblings and their subtrees until null
            for ( i = 0; i < nextsiblings[0].length; i++ ) {
                var log8 = {'OpType': 'WRITE', 'method': "appendChild", 'PropName': dom_var_name(nextsiblings[1][i]), 'NodeProp': "null", 'id': nextsiblings[0][i], 'child_path': nextsiblings[1][i], 'script': caller, 'OrigLine': line}
                window.js_rewriting_logs.push(JSON.stringify(log8));
                var curr_subtree = get_subtree_nodes(nextsiblings[2][i]);
                for ( j = 0; j < curr_subtree[1].length; j++ ) {
                    var log6 = {'OpType': 'WRITE', 'method': "insertAdjacent", 'PropName': dom_var_name(curr_subtree[2][j]), 'NodeProp': "null", 'id': curr_subtree[0][j], 'child_path': curr_subtree[2][j], 'script': caller, 'OrigLine': line};
                    window.js_rewriting_logs.push(JSON.stringify(log6));
                }
            }
        }

        if ( position == 'beforeend' ) {
            // write on childNodes property of 'this' node
            var log2 = {'OpType': 'WRITE', 'method': "insertAdjacentHTML", 'PropName': dom_var_name(this_child_path), 'NodeProp': "childNodes", 'id': this_id, 'child_path': this_child_path, 'script': caller, 'OrigLine': line}
            window.js_rewriting_logs.push(JSON.stringify(log2));

            // write on lastChild property of 'this' node
            var log2 = {'OpType': 'WRITE', 'method': "insertAdjacentHTML", 'PropName': dom_var_name(this_child_path), 'NodeProp': "lastChild", 'id': this_id, 'child_path': this_child_path, 'script': caller, 'OrigLine': line}
            window.js_rewriting_logs.push(JSON.stringify(log2));

            // maybe a write on the  property of 'this' node's previous firstChild
            if ( log_prev_last ) {
                var prev_last_child_vals = get_child_path(prev_last_val);
                var prev_last_child_path = print_nodes(prev_last_child_vals[0]);
                var log4 = {'OpType': 'WRITE', 'method': "insertAdjacentHTML", 'PropName': dom_var_name(prev_last_child_path), 'NodeProp': "firstChild", 'id': prev_last_id, 'child_path': prev_last_child_path, 'script': caller, 'OrigLine': line}
                window.js_rewriting_logs.push(JSON.stringify(log4));
            }
        }


        if ( position == 'afterend' ) {
            // write on childNodes property of 'this.parentNode' node
            var log2 = {'OpType': 'WRITE', 'method': "insertAdjacentHTML", 'PropName': dom_var_name(thisparent_child_path), 'NodeProp': "childNodes", 'id': thisparent_id, 'child_path': thisparent_child_path, 'script': caller, 'OrigLine': line}
            window.js_rewriting_logs.push(JSON.stringify(log2));
            // maybe a write on the  property of 'this.parentNode' node's previous firstChild
            if ( log_this_parent_firstchild1 ) {
                var log4 = {'OpType': 'WRITE', 'method': "insertAdjacentHTML", 'PropName': dom_var_name(thisparent_child_path), 'NodeProp': "firstChild", 'id': thisparent_id, 'child_path': thisparent_child_path, 'script': caller, 'OrigLine': line}
                window.js_rewriting_logs.push(JSON.stringify(log4));
            }

            // write on 'this' node's nextSibling property
            var log1 = {'OpType': 'WRITE', 'method': "insertAdjacentHTML", 'PropName': dom_var_name(this_child_path), 'NodeProp': "nextSibling", 'id': this_id, 'child_path': this_child_path, 'script': caller, 'OrigLine': line}
            window.js_rewriting_logs.push(JSON.stringify(log1));
        }


        return retVal;
    };

    var _matches = Element.prototype.matches;
    Element.prototype.matches = function(selectors){
        var this_id = "null";
        var this_val = this;
        if ( this.hasOwnProperty("_id") ) {
            this_id = this._id;
            this_val = this._base;
        } else {
            console.log( "Calling matches() on DOM node which is not proxy" );
        }
        var this_child_vals = get_child_path(this_val);
        var this_child_path = print_nodes(this_child_vals[0]);
        var caller = get_caller(document.currentScript);
        var stack = new Error().stack.split("\n")[1].split(":");
        var line = stack[stack.length - 2];
        var child_vals = get_child_path(this_val);
        var retVal = _matches.call(this_val, selectors);

        // read on 'this' node's 'attributes' property
        var log1 = {'OpType': 'READ', 'method': "matches", 'PropName': dom_var_name(this_child_path), 'NodeProp': "null", 'id': this_id, 'child_path': this_child_path, 'script': caller, 'OrigLine': line}
        window.js_rewriting_logs.push(JSON.stringify(log1));

        return retVal;
    };

    var _mozMatchesSelector = Element.prototype.mozMatchesSelector;
    Element.prototype.mozMatchesSelector = function(selectors){
        var this_id = "null";
        var this_val = this;
        if ( this.hasOwnProperty("_id") ) {
            this_id = this._id;
            this_val = this._base;
        } else {
            console.log( "Calling matches() on DOM node which is not proxy" );
        }
        var this_child_vals = get_child_path(this_val);
        var this_child_path = print_nodes(this_child_vals[0]);
        var caller = get_caller(document.currentScript);
        var stack = new Error().stack.split("\n")[1].split(":");
        var line = stack[stack.length - 2];
        var child_vals = get_child_path(this_val);
        var retVal = _mozMatchesSelector.call(this_val, selectors);

        // read on 'this' node's 'attributes' property
        var log1 = {'OpType': 'READ', 'method': "mozMatchesSelector", 'PropName': dom_var_name(this_child_path), 'NodeProp': "null", 'id': this_id, 'child_path': this_child_path, 'script': caller, 'OrigLine': line}
        window.js_rewriting_logs.push(JSON.stringify(log1));

        return retVal;
    };

    var __querySelector = Element.prototype.querySelector;
    Element.prototype.querySelector = function(selectors){
        var this_id = "null";
        var this_val = this;
        if ( this.hasOwnProperty("_id") ) {
            this_id = this._id;
            this_val = this._base;
        } else {
            console.log( "Calling querySelector() on DOM node which is not proxy" );
        }
        var this_child_vals = get_child_path(this_val);
        var this_child_path = print_nodes(this_child_vals[0]);
        var prior_subtree = get_subtree_nodes(this_val);
        var caller = get_caller(document.currentScript);
        var stack = new Error().stack.split("\n")[1].split(":");
        var line = stack[stack.length - 2];
        var retVal = __querySelector.call(this_val, selectors);
        var ret = get_multi_child_path(retVal);
        // wrap nodelist in proxy to log queries and wrap returned nodes
        // log reads on 'this' node and its subtree
        var log6 = {'OpType': 'READ', 'method': "querySelector", 'PropName': dom_var_name(this_child_path), 'NodeProp': "null", 'id': this_id, 'child_path': this_child_path, 'script': caller, 'OrigLine': line}
        window.js_rewriting_logs.push(JSON.stringify(log6));
        for ( i = 0; i < prior_subtree[1].length; i++ ) {
            var log6 = {'OpType': 'READ', 'method': "querySelector", 'PropName': dom_var_name(prior_subtree[2][i]), 'NodeProp': "null", 'id': prior_subtree[0][i], 'child_path': prior_subtree[2][i], 'script': caller, 'OrigLine': line}
            window.js_rewriting_logs.push(JSON.stringify(log6));
        }
        var p = wrap_node_in_proxy(retVal);
        // read on returned node
        var ret_val = p[0];
        if ( p[0].hasOwnProperty("_id") ) {
            ret_val = p[0]._base;
        }
        var child_vals = get_child_path(ret_val);
        var child_path = print_nodes(child_vals[0]);
        var log4 = {'OpType': 'READ', 'method': "querySelector", 'PropName': dom_var_name(child_path), 'NodeProp': "null", 'id': p[1], 'child_path': child_path, 'script': caller, 'OrigLine': line}
        window.js_rewriting_logs.push(JSON.stringify(log4));
        return p[0];
    };

    var __querySelectorAll = Element.prototype.querySelectorAll;
    Element.prototype.querySelectorAll = function(selectors){
        var this_id = "null";
        var this_val = this;
        if ( this.hasOwnProperty("_id") ) {
            this_id = this._id;
            this_val = this._base;
        } else {
            console.log( "Calling querySelectorAll() on DOM node which is not proxy" );
        }
        var this_child_vals = get_child_path(this_val);
        var this_child_path = print_nodes(this_child_vals[0]);
        var prior_subtree = get_subtree_nodes(this_val);
        var caller = get_caller(document.currentScript);
        var stack = new Error().stack.split("\n")[1].split(":");
        var line = stack[stack.length - 2];
        var retVal = __querySelectorAll.call(this_val, selectors);
        var ret = get_multi_child_path(retVal);
        // wrap nodelist in proxy to log queries and wrap returned nodes
        var p = null;
        // log reads on 'this' node and its subtree
        var log6 = {'OpType': 'READ', 'method': "querySelectorAll", 'PropName': dom_var_name(this_child_path), 'NodeProp': "null", 'id': this_id, 'child_path': this_child_path, 'script': caller, 'OrigLine': line}
        window.js_rewriting_logs.push(JSON.stringify(log6));
        for ( i = 0; i < prior_subtree[1].length; i++ ) {
            var log6 = {'OpType': 'READ', 'method': "querySelectorAll", 'PropName': dom_var_name(prior_subtree[2][i]), 'NodeProp': "null", 'id': prior_subtree[0][i], 'child_path': prior_subtree[2][i], 'script': caller, 'OrigLine': line}
            window.js_rewriting_logs.push(JSON.stringify(log6));
        }
        if ( retVal != null ) {
            var p = new Proxy( retVal, nodelist_handler );
            Object.defineProperty(p, '_base', {
                enumerable: false,
                configurable: false,
                writable: false,
                value: retVal
            });

            // read on every returned node
            for ( i = 0; i < retVal.length; i++ ) {
                var curr_id = "null";
                var curr_val = retVal[i];
                if ( retVal[i].hasOwnProperty("_id") ) {
                    curr_id = retVal[i]._id;
                    curr_val = retVal[i]._base;
                }
                var child_vals = get_child_path(curr_val);
                var child_path = print_nodes(child_vals[0]);
                var log4 = {'OpType': 'READ', 'method': "querySelectorAll", 'PropName': dom_var_name(child_path), 'NodeProp': "null", 'id': curr_id, 'child_path': child_path, 'script': caller, 'OrigLine': line}
                window.js_rewriting_logs.push(JSON.stringify(log4));
            }
        }
        return p;
    };

    var _removeAttribute = Element.prototype.removeAttribute;
    Element.prototype.removeAttribute = function(attr){
        var this_id = "null";
        var this_val = this;
        if ( this.hasOwnProperty("_id") ) {
            this_id = this._id;
            this_val = this._base;
        } else {
            console.log( "Calling removeAttribute() on DOM node which is not proxy" );
        }
        var this_child_vals = get_child_path(this_val);
        var this_child_path = print_nodes(this_child_vals[0]);
        var caller = get_caller(document.currentScript);
        var stack = new Error().stack.split("\n")[1].split(":");
        var line = stack[stack.length - 2];
        var child_vals = get_child_path(this_val);
        var retVal = _removeAttribute.call(this_val, attr);

        // write on 'this' node's 'attributes' property
        var log1 = {'OpType': 'WRITE', 'method': "removeAttribute", 'PropName': dom_var_name(this_child_path), 'NodeProp': "attributes", 'id': this_id, 'child_path': this_child_path, 'script': caller, 'OrigLine': line}
        window.js_rewriting_logs.push(JSON.stringify(log1));

        return retVal;
    };

    var _removeAttributeNS = Element.prototype.removeAttributeNS;
    Element.prototype.removeAttributeNS = function(namespace, attr){
        var this_id = "null";
        var this_val = this;
        if ( this.hasOwnProperty("_id") ) {
            this_id = this._id;
            this_val = this._base;
        } else {
            console.log( "Calling removeAttributeNS() on DOM node which is not proxy" );
        }
        var this_child_vals = get_child_path(this_val);
        var this_child_path = print_nodes(this_child_vals[0]);
        var caller = get_caller(document.currentScript);
        var stack = new Error().stack.split("\n")[1].split(":");
        var line = stack[stack.length - 2];
        var child_vals = get_child_path(this_val);
        var retVal = _removeAttributeNS.call(this_val, namespace, attr);

        // write on 'this' node's 'attributes' property
        var log1 = {'OpType': 'WRITE', 'method': "removeAttributeNS", 'PropName': dom_var_name(this_child_path), 'NodeProp': "attributes", 'id': this_id, 'child_path': this_child_path, 'script': caller, 'OrigLine': line}
        window.js_rewriting_logs.push(JSON.stringify(log1));

        return retVal;
    };

    var _removeAttributeNodeNS = Element.prototype.removeAttributeNode;
    Element.prototype.removeAttributeNode = function(attrnode){
        var this_id = "null";
        var this_val = this;
        if ( this.hasOwnProperty("_id") ) {
            this_id = this._id;
            this_val = this._base;
        } else {
            console.log( "Calling removeAttributeNode() on DOM node which is not proxy" );
        }
        var this_child_vals = get_child_path(this_val);
        var this_child_path = print_nodes(this_child_vals[0]);
        var caller = get_caller(document.currentScript);
        var stack = new Error().stack.split("\n")[1].split(":");
        var line = stack[stack.length - 2];
        var child_vals = get_child_path(this_val);
        var retVal = _removeAttributeNode.call(this_val, attrnode);

        console.log("We don't handle logging for removeAttributeNode()");

        return retVal;
    };



    var _setAttribute = Element.prototype.setAttribute;
    Element.prototype.setAttribute = function(name, val){
        var this_id = "null";
        var this_val = this;
        if ( this.hasOwnProperty("_id") ) {
            this_id = this._id;
            this_val = this._base;
        } else {
            console.log( "Calling setAttribute() on DOM node which is not proxy" );
        }
        var this_child_vals = get_child_path(this_val);
        var this_child_path = print_nodes(this_child_vals[0]);
        var caller = get_caller(document.currentScript);
        var stack = new Error().stack.split("\n")[1].split(":");
        var line = stack[stack.length - 2];
        var child_vals = get_child_path(this_val);
        var retVal = _setAttribute.call(this_val, name, val);

        // write on 'this' node's 'attributes' property
        var log1 = {'OpType': 'WRITE', 'method': "setAttribute", 'PropName': dom_var_name(this_child_path), 'NodeProp': "attributes", 'id': this_id, 'child_path': this_child_path, 'script': caller, 'OrigLine': line}
        window.js_rewriting_logs.push(JSON.stringify(log1));

        return retVal;
    };

    var _setAttributeNS = Element.prototype.setAttributeNS;
    Element.prototype.setAttributeNS = function(namespace, name, val){
        var this_id = "null";
        var this_val = this;
        if ( this.hasOwnProperty("_id") ) {
            this_id = this._id;
            this_val = this._base;
        } else {
            console.log( "Calling setAttributeNS() on DOM node which is not proxy" );
        }
        var this_child_vals = get_child_path(this_val);
        var this_child_path = print_nodes(this_child_vals[0]);
        var caller = get_caller(document.currentScript);
        var stack = new Error().stack.split("\n")[1].split(":");
        var line = stack[stack.length - 2];
        var child_vals = get_child_path(this_val);
        var retVal = _setAttributeNS.call(this_val, namespace, name, val);

        // write on 'this' node's 'attributes' property
        var log1 = {'OpType': 'WRITE', 'method': "setAttributeNS", 'PropName': dom_var_name(this_child_path), 'NodeProp': "attributes", 'id': this_id, 'child_path': this_child_path, 'script': caller, 'OrigLine': line}
        window.js_rewriting_logs.push(JSON.stringify(log1));

        return retVal;
    };

    var _setAttributeNode = Element.prototype.setAttributeNode;
    Element.prototype.setAttributeNode = function(attr){
        var this_id = "null";
        var this_val = this;
        if ( this.hasOwnProperty("_id") ) {
            this_id = this._id;
            this_val = this._base;
        } else {
            console.log( "Calling setAttributeNode() on DOM node which is not proxy" );
        }
        var this_child_vals = get_child_path(this_val);
        var this_child_path = print_nodes(this_child_vals[0]);
        var caller = get_caller(document.currentScript);
        var stack = new Error().stack.split("\n")[1].split(":");
        var line = stack[stack.length - 2];
        var child_vals = get_child_path(this_val);
        var retVal = _setAttributeNode.call(this_val, attr);

        console.log("We don't handle logging for setAttributeNode()");

        return retVal;
    };

    var _setAttributeNodeNS = Element.prototype.setAttributeNodeNS;
    Element.prototype.setAttributeNodeNS = function(namespace, attr){
        var this_id = "null";
        var this_val = this;
        if ( this.hasOwnProperty("_id") ) {
            this_id = this._id;
            this_val = this._base;
        } else {
            console.log( "Calling setAttributeNodeNS() on DOM node which is not proxy" );
        }
        var this_child_vals = get_child_path(this_val);
        var this_child_path = print_nodes(this_child_vals[0]);
        var caller = get_caller(document.currentScript);
        var stack = new Error().stack.split("\n")[1].split(":");
        var line = stack[stack.length - 2];
        var child_vals = get_child_path(this_val);
        var retVal = _setAttributeNodeNS.call(this_val, namespace, attr);

        console.log("We don't handle logging for setAttributeNodeNS()");

        return retVal;
    };


    // shims for other methods which use DOM nodes

    var _getComputedStyle = window.getComputedStyle;
    window.getComputedStyle = function(arg, pseudoElt){
        var arg1_id = "null";
        var arg1_val = arg;
        if ( arg.hasOwnProperty("_id") ) {
            arg1_id = arg._id;
            arg1_val = arg._base;
        }

        var arg1_child_vals = get_child_path(arg1_val);
        var arg1_child_path = print_nodes(arg1_child_vals[0]);
        var retVal = "";
        var caller = get_caller( document.currentScript);
        var stack = new Error().stack.split("\n")[1].split(":");
        var line = stack[stack.length - 2];
        if ( pseudoElt == undefined ) {
            retVal = _getComputedStyle.call(window, arg1_val);
        } else {
            retVal = _getComputedStyle.call(window, arg1_val, pseudoElt);
        }
        var log1 = {'OpType': 'READ', 'method': "getComputedStyle", 'PropName': dom_var_name(arg1_child_path), 'NodeProp': "null", 'id': arg1_id, 'child_path': arg1_child_path, 'script': caller, 'OrigLine': line}
        window.js_rewriting_logs.push(JSON.stringify(log1));
        return retVal;
    };

    var _addEventListener = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type, listener, useCapture, wantsUntrusted){
        var arg1_val = type;
        var arg2_val = listener;
        var arg3_val = useCapture;
        var arg4_val = wantsUntrusted;
        if ( useCapture == undefined ) {
            arg3_val = false;
        }
        if ( wantsUntrusted == undefined ) {
            arg4_val = true;
        }
        var retVal = "";
        if ( this instanceof HTMLDocument ) {
            retVal = _addEventListener.call(document, arg1_val, arg2_val, arg3_val, arg4_val);
        } else {
            var this_val = this;
            var this_id = "null";
            if ( this.hasOwnProperty("_id") ) {
                this_val = this._base;
                this_id = this._id;
            }
            var this_child_vals = get_child_path(this_val);
            var this_child_path = print_nodes(this_child_vals[0]);
            var caller = get_caller( document.currentScript);
            var stack = new Error().stack.split("\n")[1].split(":");
            var line = stack[stack.length - 2];
            retVal = _addEventListener.call(this_val, arg1_val, arg2_val, arg3_val, arg4_val);
            if ( this_id != "null" ) {
                var log1 = {'OpType': 'WRITE', 'method': "addEventListener", 'PropName': dom_var_name(this_child_path), 'NodeProp': "null", 'id': this_id, 'child_path': this_child_path, 'script': caller, 'OrigLine': line}
                window.js_rewriting_logs.push(JSON.stringify(log1));
            }
        }
        return retVal;
    }

    var _removeEventListener = EventTarget.prototype.removeEventListener;
    EventTarget.prototype.removeEventListener = function(type, listener, useCapture){
        var arg1_val = type;
        var arg2_val = listener;
        var arg3_val = useCapture;
        if ( useCapture == undefined ) {
            arg3_val = false;
        }
        var retVal = "";
        if ( this instanceof HTMLDocument ) {
            retVal = _addEventListener.call(document, arg1_val, arg2_val, arg3_val);
        } else {
            var this_val = this;
            var this_id = "null";
            if ( this.hasOwnProperty("_id") ) {
                this_val = this._base;
                this_id = this._id;
            }
            var this_child_vals = get_child_path(this_val);
            var this_child_path = print_nodes(this_child_vals[0]);
            var caller = get_caller( document.currentScript);
            var stack = new Error().stack.split("\n")[1].split(":");
            var line = stack[stack.length - 2];
            retVal = _removeEventListener.call(this_val, arg1_val, arg2_val, arg3_val);
            if ( this_id != "null" ) {
                var log1 = {'OpType': 'WRITE', 'method': "removeEventListener", 'PropName': dom_var_name(this_child_path), 'NodeProp': "null", 'id': this_id, 'child_path': this_child_path, 'script': caller, 'OrigLine': line}
                window.js_rewriting_logs.push(JSON.stringify(log1));
            }
        }
        return retVal;
    }

    var _focus = HTMLElement.prototype.focus;
    HTMLElement.prototype.focus = function() {
        var this_val = this;
        var this_id = "null";

        if ( this.hasOwnProperty("_id") ) {
            this_id = this._id;
            this_val = this._base;
        }

        if ( this_id != "null" ) {
            var this_child_vals = get_child_path(this_val);
            var this_child_path = print_nodes(this_child_vals[0]);
            var caller = get_caller( document.currentScript);
            var stack = new Error().stack.split("\n")[1].split(":");
            var line = stack[stack.length - 2];
            var log1 = {'OpType': 'WRITE', 'method': "focus", 'PropName': dom_var_name(this_child_path), 'NodeProp': "null", 'id': this_id, 'child_path': this_child_path, 'script': caller, 'OrigLine': line}
            window.js_rewriting_logs.push(JSON.stringify(log1));
        }

        var retVal = _focus.call(this_val);
        return retVal;

    }

    var _reset = HTMLFormElement.prototype.reset;
    HTMLFormElement.prototype.reset = function() {
        var this_val = this;
        var this_id = "null";

        if ( this.hasOwnProperty("_id") ) {
            this_id = this._id;
            this_val = this._base;
        }

        if ( this_id != "null" ) {
            var this_child_vals = get_child_path(this_val);
            var this_child_path = print_nodes(this_child_vals[0]);
            var caller = get_caller(document.currentScript);
            var stack = new Error().stack.split("\n")[1].split(":");
            var line = stack[stack.length - 2];
            var log1 = {'OpType': 'WRITE', 'method': "reset", 'PropName': dom_var_name(this_child_path), 'NodeProp': "null", 'id': this_id, 'child_path': this_child_path, 'script': caller, 'OrigLine': line}
            window.js_rewriting_logs.push(JSON.stringify(log1));
        }

        var retVal = _reset.call(this_val);
        return retVal;

    }

    var _observe = MutationObserver.prototype.observe;
    MutationObserver.prototype.observe = function(target, options) {
        var arg1_val = target;
        var arg1_id = "null";

        if ( target.hasOwnProperty("_id") ) {
            arg1_id = target._id;
            arg1_val = target._base;
        }

        var arg1_child_vals = get_child_path(arg1_val);
        var arg1_child_path = print_nodes(arg1_child_vals[0]);
        var caller = get_caller(document.currentScript);
        var stack = new Error().stack.split("\n")[1].split(":");
        var line = stack[stack.length - 2];
        var log1 = {'OpType': 'READ', 'method': "observe", 'PropName': dom_var_name(arg1_child_path), 'NodeProp': "null", 'id': arg1_id, 'child_path': arg1_child_path, 'script': caller, 'OrigLine': line}
        window.js_rewriting_logs.push(JSON.stringify(log1));

        var retVal = _observe.call(this, arg1_val, options);
        return retVal;

    }

    var ___querySelector = DocumentFragment.prototype.querySelector;
    DocumentFragment.prototype.querySelector = function(selectors){
        var this_id = "null";
        var this_val = this;
        if ( this.hasOwnProperty("_id") ) {
            this_id = this._id;
            this_val = this._base;
        }
        var this_child_vals = get_child_path(this_val);
        var this_child_path = print_nodes(this_child_vals[0]);
        var prior_subtree = get_subtree_nodes(this_val);
        var caller = get_caller(document.currentScript);
        var stack = new Error().stack.split("\n")[1].split(":");
        var line = stack[stack.length - 2];
        var retVal = ___querySelector.call(this_val, selectors);
        var ret = get_multi_child_path(retVal);
        // wrap nodelist in proxy to log queries and wrap returned nodes
        // log reads on 'this' node and its subtree
        var log6 = {'OpType': 'READ', 'method': "querySelector", 'PropName': dom_var_name(this_child_path), 'NodeProp': "null", 'id': this_id, 'child_path': this_child_path, 'script': caller, 'OrigLine': line}
        window.js_rewriting_logs.push(JSON.stringify(log6));
        for ( i = 0; i < prior_subtree[1].length; i++ ) {
            var log6 = {'OpType': 'READ', 'method': "querySelector", 'PropName': dom_var_name(prior_subtree[2][i]), 'NodeProp': "null", 'id': prior_subtree[0][i], 'child_path': prior_subtree[2][i], 'script': caller, 'OrigLine': line}
            window.js_rewriting_logs.push(JSON.stringify(log6));
        }
        var p = wrap_node_in_proxy(retVal);
        return p[0];
    };

    var ___querySelectorAll = DocumentFragment.prototype.querySelectorAll;
    DocumentFragment.prototype.querySelectorAll = function(selectors){
        var this_id = "null";
        var this_val = this;
        if ( this.hasOwnProperty("_id") ) {
            this_id = this._id;
            this_val = this._base;
        }
        var this_child_vals = get_child_path(this_val);
        var this_child_path = print_nodes(this_child_vals[0]);
        var prior_subtree = get_subtree_nodes(this_val);
        var caller = get_caller(document.currentScript);
        var stack = new Error().stack.split("\n")[1].split(":");
        var line = stack[stack.length - 2];
        var retVal = ___querySelectorAll.call(this_val, selectors);
        var ret = get_multi_child_path(retVal);
        // wrap nodelist in proxy to log queries and wrap returned nodes
        var p = null;
        // log reads on 'this' node and its subtree
        var log6 = {'OpType': 'READ', 'method': "querySelectorAll", 'PropName': dom_var_name(this_child_path), 'NodeProp': "null", 'id': this_id, 'child_path': this_child_path, 'script': caller, 'OrigLine': line}
        window.js_rewriting_logs.push(JSON.stringify(log6));
        for ( i = 0; i < prior_subtree[1].length; i++ ) {
            var log6 = {'OpType': 'READ', 'method': "querySelectorAll", 'PropName': dom_var_name(prior_subtree[2][i]), 'NodeProp': "null", 'id': prior_subtree[0][i], 'child_path': prior_subtree[2][i], 'script': caller, 'OrigLine': line}
            window.js_rewriting_logs.push(JSON.stringify(log6));
        }
        if ( retVal != null ) {
            var p = new Proxy( retVal, nodelist_handler );
            Object.defineProperty(p, '_base', {
                enumerable: false,
                configurable: false,
                writable: false,
                value: retVal
            });
        }
        return p;
    };

    var _blur = HTMLElement.prototype.blur;
    HTMLElement.prototype.blur = function() {
        var this_val = this;
        var this_id = "null";

        if ( this.hasOwnProperty("_id") ) {
            this_id = this._id;
            this_val = this._base;
        }

        if ( this_id != "null" ) {
            var this_child_vals = get_child_path(this_val);
            var this_child_path = print_nodes(this_child_vals[0]);
            var caller = get_caller(document.currentScript);
            var stack = new Error().stack.split("\n")[1].split(":");
            var line = stack[stack.length - 2];
            var log1 = {'OpType': 'WRITE', 'method': "blur", 'PropName': dom_var_name(this_child_path), 'NodeProp': "null", 'id': this_id, 'child_path': this_child_path, 'script': caller, 'OrigLine': line}
            window.js_rewriting_logs.push(JSON.stringify(log1));
        }

        var retVal = _blur.call(this_val);
        return retVal;
    }

    var _getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(contextType, contextAttributes) {
        var this_val = this;
        var this_id = "null";

        if ( this.hasOwnProperty("_id") ) {
            this_id = this._id;
            this_val = this._base;
        }

        if ( this_id != "null" ) {
            var this_child_vals = get_child_path(this_val);
            var this_child_path = print_nodes(this_child_vals[0]);
            var caller = get_caller(document.currentScript);
            var stack = new Error().stack.split("\n")[1].split(":");
            var line = stack[stack.length - 2];
            var log1 = {'OpType': 'READ', 'method': "getContext", 'PropName': dom_var_name(this_child_path), 'NodeProp': "null", 'id': this_id, 'child_path': this_child_path, 'script': caller, 'OrigLine': line}
            window.js_rewriting_logs.push(JSON.stringify(log1));
        }

        var retVal = _getContext.call(this_val, contextType, contextAttributes);
        return retVal;
    }

    var _checkValidity = HTMLInputElement.prototype.checkValidity;
    HTMLInputElement.prototype.checkValidity = function() {
        var this_val = this;
        var this_id = "null";

        if ( this.hasOwnProperty("_id") ) {
            this_id = this._id;
            this_val = this._base;
        }

        if ( this_id != "null" ) {
            var this_child_vals = get_child_path(this_val);
            var this_child_path = print_nodes(this_child_vals[0]);
            var caller = get_caller(document.currentScript);
            var stack = new Error().stack.split("\n")[1].split(":");
            var line = stack[stack.length - 2];
            var log1 = {'OpType': 'READ', 'method': "checkValidity", 'PropName': dom_var_name(this_child_path), 'NodeProp': "null", 'id': this_id, 'child_path': this_child_path, 'script': caller, 'OrigLine': line}
            window.js_rewriting_logs.push(JSON.stringify(log1));
        }

        var retVal = _checkValidity.call(this_val);
        return retVal;
    }


    var _document = document;
    var documentBindCache = {};
    // document methods we have shims for---don't need document proxy to log
    document_shims = ["getElementById", "querySelector", "getElementsByName", "getElementsByClassName", "getElementsByTagName",
                      "querySelectorAll", "getElementsByTagNameNS", "adoptNode", "caretPositionFromPoint", "createAttribute",
                      "createCDATASection", "createComment", "createDocumentFragment", "createElement", "createElementNS",
                      "createTextNode", "createCaretProcessingInstruction", "elementFromPoint", "createNodeIterator",
                      "createNSResolver", "importNode"]

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

    var document_handler = {
        "get": function(base, name){
                   // may need to handle pages that dynamically update themselves (eg. document.write())
                   var caller = get_caller( document.currentScript);
                   var stack = new Error().stack.split("\n")[1].split(":");
                   var line = stack[stack.length - 2];
                   var value = base[name];

                   var native_func = false;
                   if ( typeof(value) == "function" ) {
                       native_func = isNativeCodeFunc(value);
                   }
                   var bound_value;
                   if (native_func && (base == document)) {
                       bound_value = value.bind(_document);
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
                   if ( (name == "hasOwnProperty") || (name == "_id" ) ||
                        (name == "_base") || (document_shims.indexOf(name) != -1)) {
                       // don't log since we will log in our shims!
                       return value;
                   }
                   var log = {'OpType': 'READ', 'PropName': name, 'script': caller, 'OrigLine': line}
                   window.js_rewriting_logs.push(JSON.stringify( log  ) );
                   return value;
               },
        "set": function(base, name, value){
                   var caller = get_caller( document.currentScript);
                   var stack = new Error().stack.split("\n")[1].split(":");
                   var line = stack[stack.length - 2];
                   var log = {'OpType': 'WRITE', 'PropName': name, 'script': caller, 'OrigLine': line}
                   window.js_rewriting_logs.push(JSON.stringify( log  ) );
                   base[name] = value;
               }
    };
}
