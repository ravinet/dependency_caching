// initial source code (will change this to read from file)
var tree = esprima.parse('var a = 0;');

// json for anonymous function wrapper (note that innermost "body" is empty)
var proxy_wrapper = {"type":"Program","body":[{"type":"ExpressionStatement","expression":{"type":"CallExpression","callee":{"type":"FunctionExpression","id":null,"params":[],"defaults":[],"body":{"type":"BlockStatement","body":[]},"rest":null,"generator":false,"expression":false},"arguments":[]}}]}

// take body from the initial source code and put into our new anonymous function
var body = tree.body;
proxy_wrapper.body[0].expression.callee.body.body = body

//console.log(JSON.stringify(proxy_wrapper, "", 2));

// convert the json back to javascript (should be same code wrapped in anonymous function)
var new_js = escodegen.generate(proxy_wrapper);
console.log(new_js);
