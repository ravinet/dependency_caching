!function () {
  console.log("got d2");
  var request = new XMLHttpRequest();
  request.onload=function()
  {
    eval(request.responseText);
  };
  request.open("GET", "d3.js", true);
  request.send();
}();
