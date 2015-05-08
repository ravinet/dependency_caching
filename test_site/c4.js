!function () {
  console.log("got c4");
  var request = new XMLHttpRequest();
  request.onload=function()
  {
    eval(request.responseText);
  };
  request.open("GET", "c5.js", true);
  request.send();
}();
