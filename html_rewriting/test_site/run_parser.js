var page = require("webpage").create();
var args = require('system').args;

page.open("js_parser.html", function(status) {  
	var string_args = args[1];
	for(var i=1;i<args.length-1;i++) {
		string_args = string_args + args[1+i];
	}
	str_matches = string_args.replace(/\w+/g, "\"$&\"");
	str_matches = str_matches.replace(/"None"/g, null);
	str_matches = str_matches.replace(/"False"/g, false);
	str_matches = str_matches.replace(/"(\d+)"/g,"$1");
	json_args = JSON.parse(str_matches);
	var text = page.evaluate(function (js_text) {
		document.querySelector("textarea#originaljs").value = js_text;
		document.querySelector("#submitButton").click();
		return document.querySelector("textarea#newjs").value;
	  }, json_args);
	  console.log(text);
	phantom.exit();
});
