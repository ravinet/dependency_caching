var _document = document;
var documentBindCache = {};
var document_handler = {
    "get": function(base, name){
               console.log("[READ][document]: " + name);
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
                                 if( name == "getElementById" ){
                                     console.log( "getElementById(): id=" + id + "; return_value=" + retVal);
                                 }
                                 if ( name == "querySelector" ){
                                     console.log( "querySelector(): selectors=" + id + "; return_value=" + retVal);
                                 }
                                 return retVal;
                             }
                             curr = retVal;
                             parents = [];
                             child_path = [];
                             while ( curr.parentNode != null ) {
                                parents.push(curr.parentNode.id);
                                var children = curr.parentNode.children;
                                for (j = 0; j < children.length; j++){
                                    if( children[j] == curr ){
                                        child_path.push(j);
                                    }
                                }
                                curr = curr.parentNode; 
                             }
                             if( name == "getElementById" ){
                                 console.log( "getElementById(): id=" + id + "; return_value=" + retVal + "=" + retVal.id + "; parents=" + parents + "; child_path=" + child_path);
                             }
                             if ( name == "querySelector" ){
                                 console.log( "querySelector(): selectors=" + id + "; return_value=" + retVal + "=" + retVal.id + "; parents=" + parents + "; child_path=" + child_path);
                             }
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
                                 console.log( "elementFromPoint(): point=" + p1 + "," + p2 + "; return_value=" + retVal);
                                 return retVal;
                             }
                             curr = retVal;
                             parents = [];
                             child_path = [];
                             while ( curr.parentNode != null ) {
                                parents.push(curr.parentNode.id);
                                var children = curr.parentNode.children;
                                for (j = 0; j < children.length; j++){
                                    if( children[j] == curr ){
                                        child_path.push(j);
                                    }
                                }
                                curr = curr.parentNode;
                             }
                             console.log( "elementFromPoint(): point=" + p1 + "," + p2 + "; return_value=" + retVal + "=" + retVal.id + "; parents=" + parents + "; child_path=" + child_path);
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
                             for (i = 0; i < retVal.length; i++) {
                                 curr_child_path = [];
                                 curr_parents = [];
                                 curr = retVal[i];
                                 while ( curr.parentNode != null ) {
                                     curr_parents.push(curr.parentNode.id);
                                     var children = curr.parentNode.children;
                                     for (j = 0; j < children.length; j++){
                                         if( children[j] == curr ){
                                             curr_child_path.push(j);
                                         }
                                     }
                                     curr = curr.parentNode;
                                 }
                                 parents[retVal[i].id] = curr_parents;
                                 child_paths[retVal[i].id] = curr_child_path;
                             }
                             var parent_mappings = "";
                             var nodes = "";
                             for (var key in parents) {
                                 nodes = nodes.concat(key +",");
                                 parent_mappings = parent_mappings.concat(key + ":" + parents[key] + ", ");
                             }
                             parent_mappings = parent_mappings.slice(0, parent_mappings.length-2);
                             nodes = nodes.slice(0, nodes.length-1);

                             var final_child_path = "";
                             for (var key in child_paths){
                                 final_child_path = final_child_path.concat(key + ": " + child_paths[key] + ", ");
                             }
                             final_child_path = final_child_path.slice(0, final_child_path.length-2);

                             if( name == "getElementsByName" ){
                                 console.log( "getElementsByName(): name=" + id + "; return_value=" + retVal + "=" + nodes + "; parents=" + parent_mappings + "; child_paths=" + final_child_path );
                             }
                             if( name == "getElementsByClassName" ){
                                 console.log( "getElementsByClassName(): class=" + id + "; return_value=" + retVal + "=" + nodes + "; parents=" + parent_mappings + "; child_paths=" + final_child_path  );
                             }
                             if( name == "getElementsByTagName" ){
                                 console.log( "getElementsByTagName(): tag=" + id + "; return_value=" + retVal + "=" + nodes + "; parents=" + parent_mappings + "; child_paths=" + final_child_path );
                             }
                             if( name == "querySelectorAll" ){
                                 console.log( "querySelectorAll(): selectors=" + id + "; return_value=" + retVal + "=" + nodes + "; parents=" + parent_mappings + "; child_paths=" + final_child_path );
                             }
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
                             for (i = 0; i < retVal.length; i++) {
                                 curr_child_path = [];
                                 curr_parents = [];
                                 curr = retVal[i];
                                 while ( curr.parentNode != null ) {
                                     curr_parents.push(curr.parentNode.id);
                                     var children = curr.parentNode.children;
                                     for (j = 0; j < children.length; j++){
                                         if( children[j] == curr ){
                                             curr_child_path.push(j);
                                         }
                                     }
                                     curr = curr.parentNode;
                                 }
                                 parents[retVal[i].id] = curr_parents;
                                 child_paths[retVal[i].id] = curr_child_path;
                             }
                             var parent_mappings = "";
                             var nodes = "";
                             for (var key in parents) {
                                 nodes = nodes.concat(key +",");
                                 parent_mappings = parent_mappings.concat(key + ":" + parents[key] + ", ");
                             }
                             parent_mappings = parent_mappings.slice(0, parent_mappings.length-2);
                             nodes = nodes.slice(0, nodes.length-1);

                             var final_child_path = "";
                             for (var key in child_paths){
                                 final_child_path = final_child_path.concat(key + ": " + child_paths[key] + ", ");
                             }
                             final_child_path = final_child_path.slice(0, final_child_path.length-2);

                             if( name == "getElementsByTagNameNS" ){
                                 console.log( "getElementsByTagNameNS(): ns= " + ns + "; tag=" + id + "; return_value=" + retVal + "=" + nodes + "; parents=" + parent_mappings + "; child_paths=" + final_child_path );
                             }
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
