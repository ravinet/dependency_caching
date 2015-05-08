!function () {
  console.log("got c");
  var request = new XMLHttpRequest();
  request.onload=function()
  {
    eval(request.responseText);
  };
  request.open("GET", "c1.js", true);
  request.send();
}();
