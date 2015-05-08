!function () {
  console.log("got d");
  var request = new XMLHttpRequest();
  request.onload=function()
  {
    eval(request.responseText);
  };
  request.open("GET", "d1.js", true);
  request.send();
}();
