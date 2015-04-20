// xhr wrapper that can handle our html rewriting techniques
// or just evals stuff as we see fit

// need an open() wrapper because send is not exposed URL and original XHR requests that we did
// not create will not add URL properties to the request (we can access those in send() using this.url...
// presumably, open() must be called before send() so all reqs in send will have the URL/location info

// have a 'pending' queue per origin
pending_queues = {};
// iterate through tree and populate pending_queues with origins as keys and arrays as values


//function that decides whether or not to make a request based on the tree, pending lists, etc.
function check_request() {
// make synchronous requests right away
return true;
}


function validateURL(url) {
// check if it is valid!

return false;
}

var _xhrsend = XMLHttpRequest.prototype.send;
XMLHttpRequest.prototype.send = function(){
    // need way to validate URL (check if URL is good on its own or if we need to add location info!)
    var url = this.requested_url;
    if ( !validateURL(this.requested_url) ) {
        //recreate original URL
        if ( url.charAt(0) == '/' ) {
            // starts with / so likely request to same domain as original scope
            url = this.orig_location.origin + url;
        } else {
            url = this.orig_location.origin + "/" + url
        }
    }

    // decide if we are going to make the request or add it to pending for its origin
    if ( check_request( url ) ) {
        var retVal = _xhrsend.call(this);
        handle_response(retVal, this);
    } else {
        pending_queues[this.orig_location.origin].append(url);
    }
};

var _xhropen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function(method, url, async, user, password){
    // handle optional arguments
    var async_use;
    var user_use;
    var password_use;
    if ( async == undefined ) {
        async_use = true;
    }
    if ( user == undefined ) {
        user_use = "";
    }
    if ( password == undefined ) {
        password_use = "";
    }

    // check if URL info was added to request...if not, add it
    if ( !this.hasOwnProperty("orig_location") ) {
        this.orig_location = window.location;
        this.requested_url = url;
    }


    var retVal = _xhropen.call(this, method, url, async_use, user_use, password_use);
    return retVal;
};

var test = new XMLHttpRequest();
test.open("GET", "test2.js", false);
test.send();
