// have a 'pending' queue per origin and also number of requests in flight
pending_queues = {};
in_flight = {};

// urls which we have already evaluated
evaluated = [];

// requests which we have not yet evaluated because parent was not yet evaluated
to_evaluate = [];
// prefetch is dict where keys are origins and values are arrays...values are arrays of arrays where each array is url and the corresponding id
for ( y = 0; y < Object.keys(prefetch); y++ ) {
    // handle this origin (if more than 6, consider depth)!
    curr_origin = Object.keys[y]
    if ( curr_origin == "use_location" ) {
        curr_origin == window.location.hostname
    }
    reqs_to_make = prefetch[Object.keys[y]] // array of arrays where each inner array is url, id
    //if ( reqs_to_make.length > 6 ) {
    for ( i = 0; i < reqs_to_make.length; i++ ) {
        // make xhr request for each (and add origin attirbute as location.hostname) and then send it
        var req = new XMLHttpRequest();
        req.original_origin = curr_origin;
        req.requested_url = reqs_to_make[i][0];
        req.src_tag = reqs_to_make[i][1];
        req.async == true;
        req.open("GET", reqs_to_make[i][0], "false");
        req.send();

// assign id to scheduler so we can remove it after the page is loaded
document.currentScript.setAttribute("id", "scheduler");

// function to evaluate a response
function evaluate_response(req) {
    // if request has an imageid, re-assign the source
    if ( req.hasOwnProperty("src_tag") ) {
        document.getElementById(req.src_tag).setAttribute("src", req.requested_url);
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

// function that returns array stating whether it is a chunk, begin line and end line
function is_chunk (url) {
// format of a chunk: /---10:40
    if ( url.indexOf("---") != -1 ) {
        // this is a chunk
        chunk = url.split("---");
        lines = chunk[1].split(":");
        return [true, lines[0], lines[1]];
    }

    // not a chunk!
    return [false, 0, 0];
}

// function which checks if we can evaluate a specific response now
function can_eval (req) {
    curr_url = validURL(req);
    can_eval_req = true;
    for ( j = 0; j < scheduler_parents(curr_url); j++ ) {
        parent_url = scheduler_parents(curr_url)[j];
        if ( evaluated.indexOf(parent_url) == -1 ) {
            ret = is_chunk(parent_url);
            if ( ret[0] ) {
                can_eval_parent = true;
                // this is a chunk so check if we can eval it and if so, do it
                for ( q = 0; q < scheduler_parents(parent_url); q++ ) {
                    parent_parent = scheduler_parents(parent_url)[q];
                    if ( evaluated.indexOf(parent_parent) == -1 ) {
                        can_eval_parent = false;
                    }
                }
                if ( can_eval_parent ) {
                    // document.write chunk and add to evaled
                    var html_to_eval = window.chunked_html.slice(ret[1]-1, ret[2]).join("");
                    document.write(html_to_eval);
                    evaluated.push(parent_url);
                } else {
                    // chunk can't be evaled
                    return false;
                }
            } else {
                // not a chunk so we can't be evaled yet!
                return false;
            }
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
            in_flight[ret[1].orig_location.hostname] = in_flight[ret[1].orig_location.hostname] + 1;
            ret = best_request( this.orig_location.hostname );
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
            if ( scheduler_depths[validURL(req)] > curr_depth ) {
                curr_depth = scheduler_depths[validURL(req)];
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
        url = "http://" + req.original_origin + url;
    } else {
        url = "http://" + req.original_origin + "/" + url;
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
        in_flight[this.original_origin] = in_flight[this.original_origin] + 1;
        return;
    }

    // always add incoming request to pending for the right origin
    if ( this.original_origin in pending_queues ) {
        pending_queues[this.original_origin].append(this);
    } else {
        pending_queues[this.original_origin] = [this];
    }

    // find the best request for this origin and make it if we can make one now, until we can't make one
    var ret = best_request( this.original_origin );
    while ( ret[0] ) {
        var retVal = _xhrsend.call(ret[1]);
        in_flight[ret[1].original_origin] = in_flight[ret[1].original_origin] + 1;
        ret = best_request( this.original_origin );
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
        this.original_origin = window.location.hostname;
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

// add onload which remove "scheduler" from DOM
window.addEventListener("load", function(){
    var t = document.getElementById("scheduler");
    t.parentNode.removeChild(t);
});
