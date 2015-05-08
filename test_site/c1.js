!function () {
  console.log("got c1");
  var request = new XMLHttpRequest();
  request.onload=function()
  {
    eval(request.responseText);
  };
  request.open("GET", "c2.js", true);
  request.send();
}();
