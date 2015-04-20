// global variables:

// have a 'pending' queue per origin
pending_queues = {};
// iterate through tree and populate pending_queues with origins as keys and arrays as values
// values should be arrays of tuples (xhrrequest, url)

// tree

// pointers in tree, already sent list, etc. to make sure we know the progress, current state

// global callback function for requests
function xhr_callback {
    // check state of tree and pending requests to this origin and make next one if we want to
    // if request has a domref property, re-assign the source
    if ( this.hasOwnProperty("domref") ) {
        // from our html rewriting
        this.domref.setAttribute("src", this.requested_url);
    } else {
        // from original JS so much execute properly
        window.eval(this.responseText);
    }
}


//function that decides whether or not to make a request based on the tree, pending lists, etc.
function send_request_now(req, url) {
    // make synchronous requests right away
    if( req._async == false ) {
        return true;
    }

    return true;
}

// given request, function returns the corresponding complete url
function validURL(req) {
    var url = this.requested_url;

    // check if it is valid---probably need a better way
    var top_domains = [".com", ".org", ".net", ".int", ".edu", ".gov", ".mil"];
    for (domain in top_domains) {
        if ( url.indexOf(domain) > -1 ) {
            // contains a valid top-level domain so assume it is a url, not filename
            return url;
        }
    }

    // url did not have top level domain so assume file and add domain
    if ( url.charAt(0) == '/' ) {
        // starts with / so likely request to same domain as original scope
        url = req.orig_location.origin + url;
    } else {
        url = req.orig_location.origin + "/" + url
    }

    return url;
}

var _xhrsend = XMLHttpRequest.prototype.send;
XMLHttpRequest.prototype.send = function(){
    // requests coming in have URL and location and async info

    var url = validURL(this);

    // decide if we are going to make the request or add it to pending for its origin
    if ( send_request_now( req, url ) ) {
        // request now
        var retVal = _xhrsend.call(this);
        handle_response(retVal, this);
    } else {
        // add to pending
        if ( this.orig_location.origin in pending_queues ) {
            pending_queues[this.orig_location.origin].append((req, url));
        } else {
            console.log("Request to origin we were not expecting!");
        }
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

    // check if request is synchronous
    if ( async == false ) {
         this._async = false;
    } else {
        this._async = true;
    }

    var retVal = _xhropen.call(this, method, url, async_use, user_use, password_use);
    return retVal;
};
