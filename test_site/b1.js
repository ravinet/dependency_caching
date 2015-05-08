!function () {
  console.log("got b1");
  var request = new XMLHttpRequest();
  request.onload=function()
  {
    eval(request.responseText);
  };
  request.open("GET", "b2.js", true);
  request.send();
}();
