var page = require("webpage").create();
var args = require('system').args;

page.open("js_parser.html", function(status) {  
	var string_args = args[1];
	for(var i=0;i<args.length-1;i++) {
		string_args = string_args + args[1+i];
	}
	string_args = string_args.replace(/None/g, null);
	string_args = string_args.replace(/False/g, false);
    json_args = JSON.parse(string_args);
	var text = page.evaluate(function (js_text) {
		document.querySelector("textarea#originaljs").value = js_text;
		document.querySelector("#submitButton").click();
		return document.querySelector("textarea#newjs").value;
	  }, string_args);
	  console.log(text);
	phantom.exit();
});
