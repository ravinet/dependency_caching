/* Json should be arranged so that if a node has a child, its value is an array
of objects. If a node has no children, its value is null. 
*/

var tree; // holds json tree    
var queue = []; // holds queue of requestable nodes
var numRequests = 1; //number of outstanding reqs

//populate tree and queue
$.getJSON('sample.json', function(data) {
  tree=data;
  addChildrenToQueue(tree);
}).fail(function() {
  console.log("json error");
});

//launch requesters
for(i = 0; i < numRequests; i++) {
  //timeout so json has time to process
  setTimeout(callback, 100);
} 

function callback() {
  node = dequeue();

   if(node == null) {
    setTimeout(callback, 100);
    console.log('queue empty');
    return;
  }

   filename = Object.keys(node)[0];
   children = node[filename];
  
  $.get(filename, function() {
    addChildrenToQueue(children);
    callback()
  }).fail(function() {
    console.log("can't request" +  filename);
  });
}

function addChildrenToQueue(node) {
  if(node === null) {
    return;
  }
  $.each(node.reverse(), function(index, val) { // add in reverse when prepending
    if(val !== null) { //if child isn't null
      queue.unshift(val);//prepend
      test = val;
    }
  });
  console.log(queue);
}

function dequeue() {
  if(queue.length == 0) {
    return null;
  }
  ret = queue.shift();  // pop(0)
  return ret;
}

