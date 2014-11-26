from bs4 import BeautifulSoup
import pyesprima

soup = BeautifulSoup(open("rewrite.html"))

null = None
false = False

proxy_wrapper = {"type":"Program","body":[{"type":"ExpressionStatement","expression":{"type":"CallExpression","callee":{"type":"FunctionExpression","id":null,"params":[],"defaults":[],"body":{"type":"BlockStatement","body":[]},"rest":null,"generator":false,"expression":false},"arguments":[]}}]}	

window_proxy = {"type": "VariableDeclaration","declarations": [{"type": "VariableDeclarator","id": {"type": "Identifier","name": "window"},"init": {"type": "NewExpression","callee": {"type": "Identifier","name": "Proxy"},"arguments": [{"type": "Identifier","name": "_window"},{"type": "Identifier","name": "window_handler"}]}}],"kind": "var"}

document_proxy = {"type": "VariableDeclaration","declarations": [{"type": "VariableDeclarator","id": {"type": "Identifier","name": "document"},"init": {"type": "NewExpression","callee": {"type": "Identifier","name": "Proxy"},         "arguments": [{"type": "Identifier","name": "_document"},{"type": "Identifier","name": "document_handler"}]}}],"kind": "var"}


for script in soup.find_all('script'):
	body = pyesprima.parse(script.string);

	print body

	prepend_doc_proxy = ''.join((str(document_proxy), str(body)))
	prepend_window_proxy = ''.join((str(window_proxy), str(prepend_doc_proxy)))

	print "\n final body"
	print prepend_window_proxy

	proxy_wrapper['body'][0]['expression']['callee']['body']['body'] = prepend_window_proxy

	print proxy_wrapper
