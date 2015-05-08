!function () {
  console.log("got a1");
  var request = new XMLHttpRequest();
  request.onload=function()
  {
    eval(request.responseText);
  };
  request.open("GET", "a2.js", true);
  request.send();
}();
