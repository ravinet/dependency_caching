!function () {
  console.log("got b");
  var request = new XMLHttpRequest();
  request.onload=function()
  {
    eval(request.responseText);
  };
  request.open("GET", "b1.js", true);
  request.send();
}();
