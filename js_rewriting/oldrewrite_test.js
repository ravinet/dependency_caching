var t = {'body': [{'expression': {'callee': {'body': {'body': "{'kind': 'var', 'declarations': [{'init': {'callee': {'type': 'Identifier', 'name': 'Proxy'}, 'type': 'NewExpression', 'arguments': [{'type': 'Identifier', 'name': '_window'}, {'type': 'Identifier', 'name': 'window_handler'}]}, 'type': 'VariableDeclarator', 'id': {'type': 'Identifier', 'name': 'window'}}], 'type': 'VariableDeclaration'}{'kind': 'var', 'declarations': [{'init': {'callee': {'type': 'Identifier', 'name': 'Proxy'}, 'type': 'NewExpression', 'arguments': [{'type': 'Identifier', 'name': '_document'}, {'type': 'Identifier', 'name': 'document_handler'}]}, 'type': 'VariableDeclarator', 'id': {'type': 'Identifier', 'name': 'document'}}], 'type': 'VariableDeclaration'}{'body': [{'kind': 'var', 'declarations': [{'init': {'raw': u'0', 'type': 'Literal', 'value': 0.0}, 'type': 'VariableDeclarator', 'id': {'type': 'Identifier', 'name': u'a'}}], 'type': 'VariableDeclaration'}], 'type': 'Program'}", 'type': 'BlockStatement'}, 'params': [], 'generator': false, 'defaults': [], 'expression': false, 'type': 'FunctionExpression', 'id': null, 'rest': null}, 'type': 'CallExpression', 'arguments': []}, 'type': 'ExpressionStatement'}], 'type': 'Program'}

var new_js = escodegen.generate(t);

console.log(new_js);
