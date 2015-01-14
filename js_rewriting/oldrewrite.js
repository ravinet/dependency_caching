// initial source code (will change this to read from file)
var tree = esprima.parse('var a = 0;');

// json for anonymous function wrapper (note that innermost "body" is empty)
var proxy_wrapper = {"type":"Program","body":[{"type":"ExpressionStatement","expression":{"type":"CallExpression","callee":{"type":"FunctionExpression","id":null,"params":[],"defaults":[],"body":{"type":"BlockStatement","body":[]},"rest":null,"generator":false,"expression":false},"arguments":[]}}]}

// take body from the initial source code and put into our new anonymous function
var body = tree.body;
// prepend previous source code with proxy declarations
var window_proxy = {"type": "VariableDeclaration","declarations": [{"type": "VariableDeclarator","id": {"type": "Identifier","name": "window"},"init": {"type": "NewExpression","callee": {"type": "Identifier","name": "Proxy"},"arguments": [{"type": "Identifier","name": "_window"},{"type": "Identifier","name": "window_handler"}]}}],"kind": "var"};
var document_proxy = {"type": "VariableDeclaration","declarations": [{"type": "VariableDeclarator","id": {"type": "Identifier","name": "document"},"init": {"type": "NewExpression","callee": {"type": "Identifier","name": "Proxy"},"arguments": [{"type": "Identifier","name": "_document"},{"type": "Identifier","name": "document_handler"}]}}],"kind": "var"};
body.splice(0, 0, document_proxy);
body.splice(0, 0, window_proxy);
proxy_wrapper.body[0].expression.callee.body.body = body;
var new_js = escodegen.generate(proxy_wrapper);
console.log(new_js);
