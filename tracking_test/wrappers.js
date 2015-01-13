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

var _appendChild = Node.prototype.appendChild;
Node.prototype.appendChild = function(child){
                                 var retVal = _appendChild.call(this, child);
                                 var caller = get_caller(document.currentScript);
                                 child_vals = get_child_path(this);
                                 console.log( "Call to Node.prototype.appendChild() in " + caller + "; arg=" + child +
                                              "=" + child.id + "; node_modified=" + this.id + ": child_path=" +
                                              child_vals[0] + "; child_path_tags=" + child_vals[1]);
                                 return retVal;
                             };

var _removeChild = Node.prototype.removeChild;
Node.prototype.removeChild = function(child){
                                 var retVal = _removeChild.call(this, child);
                                 var caller = get_caller(document.currentScript);
                                 child_vals = get_child_path(this);
                                 console.log( "Call to Node.prototype.removeChild() in " + caller + "; arg="+ child +
                                              "=" + child.id + "; node_modified=" + this.id + ": child_path=" +
                                              child_vals[0] + "; child_path_tags=" + child_vals[1]);
                                 return retVal;
                             };

var _replaceChild = Node.prototype.replaceChild;
Node.prototype.replaceChild = function(newchild, oldchild){
                                 var retVal = _replaceChild.call(this, newchild, oldchild);
                                 var caller = get_caller(document.currentScript);
                                 child_vals = get_child_path(this);
                                 console.log( "Call to Node.prototype.replaceChild() in " + caller + "; args="+ newchild +
                                              "," + oldchild + "=" + newchild.id + "," + oldchild.id + "; node_modified=" +
                                              this.id + ": child_path=" + child_vals[0] + "; child_path_tags=" + child_vals[1]);
                                 return retVal;
                             };

var _insertBefore = Node.prototype.insertBefore;
Node.prototype.insertBefore = function(newchild, referencechild){
                                 if (referencechild == undefined) { referencechild = null; }
                                 var retVal = _insertBefore.call(this, newchild, referencechild);
                                 var caller = get_caller(document.currentScript);
                                 child_vals = get_child_path(this);
                                 if ( referencechild == null ) {
                                     console.log( "Call to Node.prototype.insertBefore() in " + caller + "; args="+ newchild +
                                     "," + referencechild + "=" + newchild.id + ",null; node_modified=" +
                                     this.id + ": child_path=" + child_vals[0] + "; child_path_tags=" + child_vals[1]);
                                     return retVal;
                                 }
                                 console.log( "Call to Node.prototype.insertBefore() in " + caller + "; args="+ newchild +
                                              "," + referencechild + "=" + newchild.id + "," + referencechild.id + "; node_modified=" +
                                              this.id + ": child_path=" + child_vals[0] + "; child_path_tags=" + child_vals[1]);
                                 return retVal;
                             };

var _alert = window.alert;
window.alert = function(arg){
                   var caller = get_caller( document.currentScript);
                   var log_read = {"window": "READ", "var": "screen", "new_value": null, "script": caller};
                   var log_write = {"window": "WRITE", "var": "screen", "new_value": null, "script": caller};
                   console.log( JSON.stringify( log_read ) );
                   console.log( JSON.stringify( log_write ) );
                   var retVal = _alert.call(this, arg);
                   return retVal;
               };