/* Json should be arranged so that if a node has a child, its value is an array
of objects. If a node has no children, its value is null. 
*/

var tree; // holds json tree    
var queue = []; // holds queue of requestable nodes
var numRequests = 0; //number of outstanding reqs
var maxNumRequests = 4; // max number of outstanding reqs

//populate tree and queue
$.getJSON('sample.json', function(data) {
  tree=data;
  addChildrenToQueue(tree);
  console.log('launching test');
  launchRequesters();
}).fail(function() {
  console.log("json error");
});

function launchRequesters() {
  //launch requesters
  for(i = numRequests; i < maxNumRequests; i++) {
    callback();
  } 
}

function callback() {
  node = dequeue();

  if(node == null) {
    // kill self
    console.log('killed self');
    numRequests = numRequests - 1;
    return;
  }

  var filename = Object.keys(node)[0];
  var children = node[filename];
  
  console.log("requesting " +  filename);
  $.get(filename, function() {
    addChildrenToQueue(children);
    launchRequesters();
  }).fail(function() {
    console.log("can't request" +  filename);
  });
}

function addChildrenToQueue(node) {
  if(node === null) {
    return;
  }
  console.log("adding children");
  console.log(node[0]);
  $.each(node.reverse(), function(index, val) { // add in reverse when prepending
    if(val !== null) { //if child isn't null
      queue.unshift(val);//prepend
      test = val;
    }
  });
  console.log(queue.slice());
}

function dequeue() {
  if(queue.length == 0) {
    return null;
  }
  ret = queue.shift();  // pop(0)
  return ret;
}

