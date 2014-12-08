from bs4 import BeautifulSoup
import pyesprima
import json

soup = BeautifulSoup(open("rewrite.html"))

print soup

proxy_wrapper = {"type":"Program","body":[{"type":"ExpressionStatement","expression":{"type":"CallExpression","callee":{"type":"FunctionExpression","id":None,"params":[],"defaults":[],"body":{"type":"BlockStatement","body":[]},"rest":None,"generator":False,"expression":False},"arguments":[]}}]}

window_proxy = {"type": "VariableDeclaration","declarations": [{"type": "VariableDeclarator","id": {"type": "Identifier","name": "window"},"init": {"type": "NewExpression","callee": {"type": "Identifier","name": "Proxy"},"arguments": [{"type": "Identifier","name": "_window"},{"type": "Identifier","name": "window_handler"}]}}],"kind": "var"}

document_proxy = {"type": "VariableDeclaration","declarations": [{"type": "VariableDeclarator","id": {"type": "Identifier","name": "document"},"init": {"type": "NewExpression","callee": {"type": "Identifier","name": "Proxy"}, "arguments": [{"type": "Identifier","name": "_document"},{"type": "Identifier","name": "document_handler"}]}}],"kind": "var"}


for script in soup.find_all('script'):
	body = pyesprima.parse(script.string);
	print "\n"
	print script.string


	prepend_doc_proxy = ''.join((str(document_proxy), str(body)))
	prepend_window_proxy = ''.join((str(window_proxy), str(prepend_doc_proxy)))

	proxy_wrapper['body'][0]['expression']['callee']['body']['body'] = prepend_window_proxy

	output = json.dumps(proxy_wrapper)

	script.string = output

#	print script.string

print soup
