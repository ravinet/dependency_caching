from bs4 import BeautifulSoup
import copy
import pyesprima
import json
import ast
import subprocess

soup = BeautifulSoup(open("rewrite.html"))

proxy_wrapper = {"type":"Program","body":[{"type":"ExpressionStatement","expression":{"type":"CallExpression","callee":{"type":"FunctionExpression","id":None,"params":[],"defaults":[],"body":{"type":"BlockStatement","body":[]},"rest":None,"generator":False,"expression":False},"arguments":[]}}]}

window_proxy = {"type": "VariableDeclaration","declarations": [{"type": "VariableDeclarator","id": {"type": "Identifier","name": "window"},"init": {"type": "NewExpression","callee": {"type": "Identifier","name": "Proxy"},"arguments": [{"type": "Identifier","name": "_window"},{"type": "Identifier","name": "window_handler"}]}}],"kind": "var"}

document_proxy = {"type": "VariableDeclaration","declarations": [{"type": "VariableDeclarator","id": {"type": "Identifier","name": "document"},"init": {"type": "NewExpression","callee": {"type": "Identifier","name": "Proxy"}, "arguments": [{"type": "Identifier","name": "_document"},{"type": "Identifier","name": "document_handler"}]}}],"kind": "var"}

for script in soup.find_all('script'):
	soup_string = str(script.string)
	body = pyesprima.parse(soup_string)['body']
	body.insert(0,document_proxy)
	body.insert(0, window_proxy)
	proxy_wrapper['body'][0]['expression']['callee']['body']['body'] = body
	proc = subprocess.Popen(['node ../../rewrite.js '+ str(proxy_wrapper)],stdout = subprocess.PIPE, shell=True)
	(out, err) = proc.communicate()
	script.string = out

file1=open("newhtml.html","w")

file1.write(str(soup))

file1.close()


