// have a 'pending' queue per origin and also number of requests in flight
pending_queues = {};
in_flight = {};

// list parent URLs for each url
parents = {};

// number of urls which are later in the chain for each url
depth = {};

// urls which we have already evaluated
evaluated = [];

// requests which we have not yet evaluated because parent was not yet evaluated
to_evaluate = [];

// function to evaluate a response
function evaluate_response(req) {
    // if request has a domref property, re-assign the source
    if ( req.hasOwnProperty("domref") ) {
        req.domref.setAttribute("src", req.requested_url);
    } else {
        // from original JS so just execute default callback
        req.onload_orig();
    }

    // add url to evaluated list
    evaluated.append(validURL(req));
}

// function which recursively handles all to_eval requests based on what urls have already been evaluated
function handle_to_eval () {
    eval_index = []
    for ( int q = 0; q < to_evaluate.length(); q++ ) {
        if ( can_eval(to_evaluate[q]) ) {
            evaluate_response(to_evaluate[q]);
            eval_index.append(q);
        }
    }

    // remove all evaluated responses from the to_evaluate queue
    first = true;
    for ( i = 0; i < eval_index.length; i++) {
        if ( first) {
            to_evaluate.splice(eval_index[i],1);
            first = false;
        } else {
            to_evaluate.splice(eval_index[i]-1, 1);
        }
    }
};

// function which checks if we can evaluate a specific response now
function can_eval (req) {
    curr_url = validURL(req);
    for ( j = 0; j < parents(curr_url); j++ ) {
        if ( evaluted.indexOf(parents(curr_url)[j]) == -1 )
            return false;
        }
    }
    // we can evaluate it now!
    return true;
}

// global callback function for requests
xhr_callback = function () {
    if ( can_eval(this) ) { // we can eval it now!
        evaluate_response(this);

        // check the pending queue for this origin and make the next best request (as many as possible)!
        var ret = best_request( this.orig_location.origin );
        while ( ret[0] ) {
            var retVal = _xhrsend.call(ret[1]);
            in_flight[ret[1].orig_location.origin] = in_flight[ret[1].orig_location.origin] + 1;
            ret = best_request( this.orig_location.origin );
        }

        handle_to_eval();
    } else { // we cant eval it now
        to_evaluate.append(this);
    }
};

// function that decides whether or not to make a request based on the tree, pending lists, etc.
function best_request(origin) {
    var best_req = "null";
    var best_req_index = "null";
    var curr_depth = 0;
    // find request if we have open connections
    if ( in_flight[origin] < 6 ) {
        // find the request with the longest chain remaining
        for ( int i = 0; i < pending_queues[origin].length; i++ ) {
            var curr = pending_queues[origin][i];
            if ( depth[validURL(req)] > curr_depth ) {
                curr_depth = depth[validURL(req)];
                best_req_index = i;
                best_req = curr;
            }
        }
    }

    if ( best_req != "null" ) {
        // we have a request to send so remove from pending
        pending_queues[origin].splice(best_req_index, 1);
        return [true, best_req];
    }

    // we can't send anything!
    return [false, "null"];
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
    // assign new callback while preserving original
    this.onload_orig = this.onload;
    this.onload = xhr_callback;

    // if the request is synchronous, make it right away, update in-flight vals, and exit
    if ( this.async == false ) {
        var retVal = _xhrsend.call(this);
        in_flight[this.orig_location.origin] = in_flight[this.orig_location.origin] + 1;
        return;
    }

    // always add incoming request to pending for the right origin
    if ( this.orig_location.origin in pending_queues ) {
        pending_queues[this.orig_location.origin].append(this);
    } else {
        pending_queues[this.orig_location.origin] = [this];
    }

    // find the best request for this origin and make it if we can make one now, until we can't make one
    var ret = best_request( this.orig_location.origin );
    while ( ret[0] ) {
        var retVal = _xhrsend.call(ret[1]);
        in_flight[ret[1].orig_location.origin] = in_flight[ret[1].orig_location.origin] + 1;
        ret = best_request( this.orig_location.origin );
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
