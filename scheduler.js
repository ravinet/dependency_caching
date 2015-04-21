// global variables:

// have a 'pending' queue per origin
pending_queues = {};

// pointers in tree, already sent list, etc. to make sure we know the progress, current state

// global callback function for requests
xhr_callback = function () {
    // if request has a domref property, re-assign the source
    if ( this.hasOwnProperty("domref") ) {
        this.domref.setAttribute("src", this.requested_url);
    } else {
        // from original JS so just execute default callback
        this.onload_orig();
    }

    // check the pending queue for this origin and make the next best request!
    var ret = best_request(this.orig_location.origin);
    if ( ret[0] ) {
        var retVal = _xhrsend.call(ret[1]);
        //!!!!still must update the list of current requests in-flight
    }
};

// function that decides whether or not to make a request based on the tree, pending lists, etc.
// returns an array where first element is bool stating whether or not to make request now, second is the request to make
function best_request(origin) {
    // consult the number of pending requests to this origin and all requests in pending queue for this origin
    return [true, req];
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

    // assign new callback while preserving original
    this.onload_orig = this.onload;
    this.onload = xhr_callback;

    // if the request is synchronous, make it right away, update in-flight vals, and exit
    if ( this.async == false ) {
        var retVal = _xhrsend.call(this);
        //!!!!! still have to update in-flight counter
        break;
    }

    // always add incoming request to pending for the right origin
    if ( this.orig_location.origin in pending_queues ) {
        pending_queues[this.orig_location.origin].append(this);
    } else {
        pending_queues[this.orig_location.origin] = [this];
    }

    // find the best request for this origin and make it if we can make one now
    var ret = best_request( this.orig_location.origin );
    if ( ret[0] ) {
        // make a request now
        var retVal = _xhrsend.call(ret[1]);
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
