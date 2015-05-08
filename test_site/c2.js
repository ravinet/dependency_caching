!function () {
  console.log("got c2");
  var request = new XMLHttpRequest();
  request.onload=function()
  {
    eval(request.responseText);
  };
  request.open("GET", "c3.js", true);
  request.send();
}();
