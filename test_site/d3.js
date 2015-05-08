!function () {
  console.log("got d3");
  var request = new XMLHttpRequest();
  request.onload=function()
  {
    eval(request.responseText);
  };
  request.open("GET", "d4.js", true);
  request.send();
}();
