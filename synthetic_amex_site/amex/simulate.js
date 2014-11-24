/* Json should be arranged so that if a node has a child, its value is an array
of objects. If a node has no children, its value is null. 
*/

var tree; // holds json tree    
var queue = []; // holds queue of requestable nodes
var numRequests = 0; //number of outstanding reqs
var maxNumRequests = 4; // max number of outstanding reqs

xmlhttp = new XMLHttpRequest();

//populate tree and queue
$.getJSON('amex.json', function(data) {
  tree=data;
  console.log(tree);
  addChildrenToQueue(tree);
  console.log('launching test');
  launchRequesters();
}).fail(function() {
  console.log("json error");
});

function launchRequesters() {
  //launch requesters
  for(i = numRequests; i < maxNumRequests; i++) {
    numRequests++;
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
/*
  addChildrenToQueue(children);
  numRequests = numRequests - 1;
  launchRequesters();
  */
  filename = filename.split(" ")[0];
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.onreadystatechange = function() {
    if (xmlHttp.readyState==4) {
      if(xmlHttp.status === 200) {
        addChildrenToQueue(children);
        numRequests = numRequests - 1;
        launchRequesters();
      } else {
        console.log("can't request" +  filename);
      }
    }
  };
  xmlHttp.open("GET", filename);
  xmlHttp.send();
  /*$.get(filename, function() {
    addChildrenToQueue(children);
    numRequests = numRequests - 1;
    launchRequesters();
  }).fail(function() {
    console.log("can't request" +  filename);
  });
  */
}

function addChildrenToQueue(node) {
  if(node === null) {
    return;
  }
//  console.log("adding children");
//  console.log(node[0]);
  $.each(node.reverse(), function(index, val) { // add in reverse when prepending
    if(val !== null) { //if child isn't null
      queue.unshift(val);//prepend
      test = val;
    }
  });
  //console.log(queue.slice());
}

function dequeue() {
  if(queue.length == 0) {
    return null;
  }
  k = queue;
  queue = queue.sort(sortfunction).reverse();
  ret = queue.shift();  // pop(0)
  return ret;
}

function sortfunction(a,b) {
  a = Object.keys(a)[0].split(" ")[1];
  b = Object.keys(b)[0].split(" ")[1];
  return a -b ;
}

