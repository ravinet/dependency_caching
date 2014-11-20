var _appendChild = Node.prototype.appendChild;
Node.prototype.appendChild = function(child){
                                 var retVal = _appendChild.call(this, child);
                                 var caller = document.currentScript;
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

                                 curr = this;
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

                                 console.log( "Call to Node.prototype.appendChild() in " + script_attributes + "; arg=" + child + "=" + child.id + "; node_modified=" + this.id + ": child_path=" + child_path + "; child_path_tags=" + child_path_tags);
                                 return retVal;
                             };
