!function () {
  console.log("got c3");
  var request = new XMLHttpRequest();
  request.onload=function()
  {
    eval(request.responseText);
  };
  request.open("GET", "c4.js", true);
  request.send();
}();
