!function () {
  console.log("got a");
  var request = new XMLHttpRequest();
  request.onload=function()
  {
    eval(request.responseText);
  };
  request.open("GET", "a1.js", true);
  request.send();
}();
