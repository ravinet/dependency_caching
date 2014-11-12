var _document = document;
var documentBindCache = {};
var document_handler = {
    "get": function(base, name){
               console.log("[READ][document]: " + name);
               if(name in documentBindCache){
                   return documentBindCache[name];
               }
               
               var value = base[name];

               // document.getElementById- log id, return value, and parents
               if(typeof(value) == "function"){
                   value = value.bind(base);
                   if(name == "getElementById"){
                       var documentProxy = function(id){
                             var retVal = value(id);
                             curr = retVal;
                             parents = [];
                             while ( curr.parentNode != null && curr.parentNode.id != "" ) {
                                parents.push(curr.parentNode.id);
                                curr = curr.parentNode; 
                             }
                             console.log( "getElementById(): id=" + id + "; return_value=" + retVal + "=" + retVal.id + "; parents=" + parents);
                             return retVal;
                       };
                       documentBindCache[name] = documentProxy;
                       return documentProxy;
                   }

                   // document.getElementsByName- log name, return value, and for each node returned list node name and its parents
                   if((name == "getElementsByName") || (name == "getElementsByClassName")){
                       var documentProxy = function(id){
                             var retVal = value(id);
                             curr = retVal;
                             parents = {};
                             for (i = 0; i < retVal.length; i++) {
                                 curr_parents = [];
                                 curr = retVal[i];
                                 while ( curr.parentNode != null && curr.parentNode.id != "" ) {
                                     curr_parents.push(curr.parentNode.id);
                                     curr = curr.parentNode;
                                 }
                                 parents[retVal[i].id] = curr_parents;
                             }
                             var parent_mappings = "";
                             var nodes = "";
                             for (var key in parents) {
                                 nodes = nodes.concat(key +",");
                                 parent_mappings = parent_mappings.concat(key + ":" + parents[key] + ", ");
                             }
                             parent_mappings = parent_mappings.slice(0, parent_mappings.length-2);
                             nodes = nodes.slice(0, nodes.length-1);
                             if( name == "getElementsByName" ){
                                 console.log( "getElementsByName(): name=" + id + "; return_value=" + retVal + "=" + nodes + "; parents=" + parent_mappings );
                             }
                             if( name == "getElementsByClassName" ){
                                 console.log( "getElementsByClassName(): name=" + id + "; return_value=" + retVal + "=" + nodes + "; parents=" + parent_mappings );
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
