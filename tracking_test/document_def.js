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
                   if(name == "getElementById"){
                       var documentProxy = function(id){
                             var retVal = value(id);
                             curr = retVal;
                             parents = [];
                             while ( curr.parentNode != null && curr.parentNode.id != "" ) {
                                parents.push(curr.parentNode.id);
                                curr = curr.parentNode; 
                             }
                             console.log( "getElementById(): id=" + id + "; return_value=" + retVal + "; parents:" + parents);
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
