!function () {
  console.log("got b2");
  var request = new XMLHttpRequest();
  request.onload=function()
  {
    eval(request.responseText);
  };
  request.open("GET", "b3.js", true);
  request.send();
}();
