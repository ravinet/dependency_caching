var _document = document;
var documentBindCache = {};

function list_properties(properties){
    var props = "";
    for (var key in properties){
        props = props.concat(key + ":" + properties[key] + ", ");
    }
    props = props.slice(0, props.length-2);
    return props;
}

function print_single_attr(child_attributes){
    var final_attributes = "";
    for (y=0; y<child_attributes.length; y++){
        final_attributes = final_attributes.concat(child_attributes[y] + "; ");
    }
    final_attributes = final_attributes.slice(0, final_attributes.length-2);
    return final_attributes;
}

function print_multiple_attr(child_attributes){
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
        nodes = nodes.concat(key +",");
    }
    nodes = nodes.slice(0, nodes.length-1);
    return nodes;
}

var document_handler = {
    "get": function(base, name){
               if(name in documentBindCache){
                   return documentBindCache[name];
               }
               
               var value = base[name];

               if(typeof(value) == "function"){
                   value = value.bind(base);
                   // document.getElementById, document.querySelector- log id, return value, and parents
                   if((name == "getElementById") || (name == "querySelector")){
                       var documentProxy = function(id){
                             var retVal = value(id);
                             if ( retVal == null ) {
                                 console.log( "READ: document- " + name + ": arg=" + id + "; return_value=" + retVal);
                                 return retVal;
                             }
                             curr = retVal;
                             parents = [];
                             child_path = [];
                             child_path_tags = [];
                             child_path_attr = [];
                             while ( curr.parentNode != null ) {
                                parents.push(curr.parentNode.id);
                                var children = curr.parentNode.children;
                                for (j = 0; j < children.length; j++){
                                    if( children[j] == curr ){
                                        child_path.push(j);
                                        child_path_tags.push(children[j].tagName);
                                        var attr = children[j].attributes;
                                        var attributes = [];
                                        for( a=0; a<attr.length; a++){
                                            attributes.push(attr[a].name + ":" + attr[a].value);
                                        }
                                        child_path_attr.push(attributes);
                                    }
                                }
                                curr = curr.parentNode; 
                             }

                             console.log( "READ: document- " + name + ": arg=" + id + "; return_value=" + retVal + "=" + retVal.id + "; parents=" + parents + "; child_path=" + child_path + "; child_path_tags=" + child_path_tags + "; child_path_attributes=" + print_single_attr(child_path_attr) );
                             return retVal;
                       };
                       documentBindCache[name] = documentProxy;
                       return documentProxy;
                   }

                   // document.elementFromPoint- log id, return value, and parents
                   if(name == "elementFromPoint"){
                       var documentProxy = function(p1, p2){
                             var retVal = value(p1, p2);
                             if ( retVal == null ) {
                                 console.log( "READ: document- " + name + ": arg=" + p1 + "," + p2 + "; return_value=" + retVal);
                                 return retVal;
                             }
                             curr = retVal;
                             parents = [];
                             child_path = [];
                             child_path_tags = [];
                             child_path_attr = [];
                             while ( curr.parentNode != null ) {
                                parents.push(curr.parentNode.id);
                                var children = curr.parentNode.children;
                                for (j = 0; j < children.length; j++){
                                    if( children[j] == curr ){
                                        child_path.push(j);
                                        child_path_tags.push(children[j].tagName);
                                        var attr = children[j].attributes;
                                        var attributes = [];
                                        for( a=0; a<attr.length; a++){
                                            attributes.push(attr[a].name + ":" + attr[a].value);
                                        }
                                        child_path_attr.push(attributes);
                                    }
                                }
                                curr = curr.parentNode;
                             }

                             console.log( "READ: document- " + name + ": arg=" + p1 + "," + p2 + "; return_value=" + retVal + "=" + retVal.id + "; parents=" + parents + "; child_path=" + child_path + "; child_path_tags=" + child_path_tags + "; child_path_attributes= " + print_single_attr(child_path_attr) );
                             return retVal;
                       };
                       documentBindCache[name] = documentProxy;
                       return documentProxy;
                   }

                   // document.getElementsByName, document.getElementsByClassName, document.getElementsByTagName document.querySelectorAll
                   // log name, return value, and for each node returned list node name and its parents
                   if((name == "getElementsByName") || (name == "getElementsByClassName") || (name == "getElementsByTagName") || (name == "querySelectorAll")){
                       var documentProxy = function(id){
                             var retVal = value(id);
                             curr = retVal;
                             parents = {};
                             child_paths = {};
                             child_path_tags = {};
                             child_path_attr = {};
                             for (i = 0; i < retVal.length; i++) {
                                 curr_child_path = [];
                                 curr_child_path_tags = [];
                                 curr_parents = [];
                                 curr_child_path_attr = [];
                                 curr = retVal[i];
                                 while ( curr.parentNode != null ) {
                                     curr_parents.push(curr.parentNode.id);
                                     var children = curr.parentNode.children;
                                     for (j = 0; j < children.length; j++){
                                         if( children[j] == curr ){
                                             curr_child_path.push(j);
                                             curr_child_path_tags.push(children[j].tagName);
                                             var attr = children[j].attributes;
                                             var attributes = [];
                                             for( a=0; a<attr.length; a++){
                                                 attributes.push(attr[a].name + ":" + attr[a].value);
                                             }
                                             curr_child_path_attr.push(attributes);
                                         }
                                     }
                                     curr = curr.parentNode;
                                 }
                                 parents[retVal[i].id] = curr_parents;
                                 child_paths[retVal[i].id] = curr_child_path;
                                 child_path_tags[retVal[i].id] = curr_child_path_tags;
                                 child_path_attr[retVal[i].id] = curr_child_path_attr;
                             }

                             console.log( "READ: document- " + name + ": arg=" + id + "; return_value=" + retVal + "=" + print_nodes(parents) + "; parents=" + list_properties(parents) + "; child_paths=" + list_properties(child_paths) + "; child_path_tags= " + list_properties(child_path_tags) + "; child_path_attributes=" + print_multiple_attr(child_path_attr) );
                             return retVal;
                       };
                       documentBindCache[name] = documentProxy;
                       return documentProxy;
                   }

                   // document.getElementsByTagNameNS
                   // log name, return value, and for each node returned list node name and its parents
                   if(name == "getElementsByTagNameNS"){
                       var documentProxy = function(ns, id){
                             var retVal = value(ns, id);
                             curr = retVal;
                             parents = {};
                             child_paths = {};
                             child_path_tags = {};
                             child_path_attr = {};
                             for (i = 0; i < retVal.length; i++) {
                                 curr_child_path = [];
                                 curr_child_path_tags = [];
                                 curr_parents = [];
                                 curr_child_path_attr = [];
                                 curr = retVal[i];
                                 while ( curr.parentNode != null ) {
                                     curr_parents.push(curr.parentNode.id);
                                     var children = curr.parentNode.children;
                                     for (j = 0; j < children.length; j++){
                                         if( children[j] == curr ){
                                             curr_child_path.push(j);
                                             curr_child_path_tags.push(children[j].tagName);
                                             var attr = children[j].attributes;
                                             var attributes = [];
                                             for( a=0; a<attr.length; a++){
                                                 attributes.push(attr[a].name + ":" + attr[a].value);
                                             }
                                             curr_child_path_attr.push(attributes);
                                         }
                                     }
                                     curr = curr.parentNode;
                                 }
                                 parents[retVal[i].id] = curr_parents;
                                 child_paths[retVal[i].id] = curr_child_path;
                                 child_path_tags[retVal[i].id] = curr_child_path_tags;
                                 child_path_attr[retVal[i].id] = curr_child_path_attr;
                             }

                             console.log( "READ: document- " + name + ": arg= " + ns + "; tag=" + id + "; return_value=" + retVal + "=" + print_nodes(parents) + "; parents=" + list_properties(parents) + "; child_paths=" + list_properties(child_paths) + "; child_path_tags=" + list_properties(child_path_tags) + "; child_path_attributes=" + print_multiple_attr(child_path_attr) );
                             return retVal;
                       };
                       documentBindCache[name] = documentProxy;
                       return documentProxy;
                   }

                   documentBindCache[name] = value;
               }
               return value;
           },
    "set": function(base, name, value){
               console.log("[WRITE][document]: " + name);
               base[name] = value;
               if(name in documentBindCache){
                   delete documentBindCache[name];
               }
           }
};
