!function () {
  console.log("got d1");
  var request = new XMLHttpRequest();
  request.onload=function()
  {
    eval(request.responseText);
  };
  request.open("GET", "d2.js", true);
  request.send();
}();
