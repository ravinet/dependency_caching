var _appendChild = Node.prototype.appendChild;
Node.prototype.appendChild = function(child){
                                 var retVal = _appendChild.call(this, child);
                                 console.log("Call to Node.prototype.appendChild() in: arg=" + child + "= " + child.id + "; return_value=" + retVal);
                                 return retVal;
                             };
