// requires node packages listed below
// example: 'npm install esprima'
//
// TODO: var declaration repeat normal assignment stuff
esprima = require('esprima');
estraverse = require('estraverse');
escodegen = require('escodegen');
util = require('util');

fs = require('fs');

var code = fs.readFileSync(process.argv[2]);
var ast = esprima.parse(code, {loc: true});
console.log(escodegen.generate(ast));

var scopeChain = []; // contains identifiers 
var assignmentChain = [];

estraverse.traverse(ast, {
  enter: enter,
  leave: leave
});

var proxy_wrapper = {"type":"Program","body":[{"type":"ExpressionStatement","expression":{"type":"CallExpression","callee":{"type":"FunctionExpression","id":null,"params":[],"defaults":[],"body":{"type":"BlockStatement","body":[]},"rest":null,"generator":false,"expression":false},"arguments":[]}}]};

// take body from the initial source code and put into our new anonymous function
var body = ast.body;
var window_proxy = {"type": "VariableDeclaration","declarations": [{"type": "VariableDeclarator","id": {"type": "Identifier","name": "window"},"init": {"type": "NewExpression","callee": {"type": "Identifier","name": "Proxy"},"arguments": [{"type": "Identifier","name": "_window"},{"type": "Identifier","name": "window_handler"}]}}],"kind": "var"};
body.splice(0, 0, window_proxy);
proxy_wrapper.body[0].expression.callee.body.body = body;

ast = proxy_wrapper;

console.log(escodegen.generate(ast));
outname = process.argv[3] ? process.argv[3] : "out";
fs.writeFileSync(outname, escodegen.generate(ast));

function createsNewScope(node){
  return node.type === 'FunctionDeclaration' ||
    node.type === 'FunctionExpression' ||
    node.type === 'Program';
}

function enter(node){
  if (createsNewScope(node)){
    if (scopeChain.length > 0) {
      if (scopeChain.length === 1 && node.type === 'FunctionDeclaration') {
        node.type = "ExpressionStatement";
        var assignmentexpr = {"type":"AssignmentExpression", "operator":"=", "left":node.id, "right":node};
        assignmentexpr.right = {"type":"FunctionExpression", "id":null, "params":node.params, "defaults":node.defaults, 
          "body":node.body, "rest":node.rest, "generator":node.generator, "expression":node.expression};
        node.expression = assignmentexpr;
        //console.log(util.inspect(node, {depth:null}));
        return;
      } else {
        scopeChain.push([{name:"this"}, {name:"arguments"}]);
      }
    } else {
      scopeChain.push([]);
    }
    assignmentChain.push([]);
    var currentScope = scopeChain[scopeChain.length - 1];
    if(node.type !== 'Program') {
      //add function args
      if (node.params !== null) {
        for (var i in node.params) {
          if (isObj(node.params[i])) {
            currentScope.push(node.params[i]);
          }
        }
      }
      //add function name
      if (node.id !== null && node.id.name !== null) {
        if (isObj(node.id)) {
          scopeChain[scopeChain.length - 2].push(node.id); // add function name to previous scope as well
          currentScope.push(node.id);
        }
      }
    }
  }

  var currentScope = scopeChain[scopeChain.length - 1];
  var currentAssignment= assignmentChain[assignmentChain.length - 1];

  //rewrite var in global to just be assignments
  if(scopeChain.length === 1 && node.type === 'VariableDeclaration') {
    expressionright = node.declarations[0].init;
    expressionleft = node.declarations[0].id;
    node.type = 'ExpressionStatement';
    node.expression = {"type": "AssignmentExpression",
      "operator": "=", "left" : expressionleft, "right": expressionright};
  }

  if (node.type === 'VariableDeclarator'){
    currentScope.push(node.id);
  }

  if (node.type === 'AssignmentExpression'){
    // if declared in global scope it's a global var
    if (isObj(node.left)) {
      if (scopeChain.length === 1) {
        currentScope.push(memberExpToIdentifier(node.left));
      } else {
        currentAssignment.push(node.left);
      }
    }
    if (isObj(node.right)){
      currentAssignment.push(node.right);
    }
  }

  if (node.type === "ConditionalExpression") {
    if (isObj(node.test)) {
      currentAssignment.push(node.test);
    }
    if (isObj(node.consequent)) {
      currentAssignment.push(node.consequent);
    }
    if (isObj(node.alternate)) {
      currentAssignment.push(node.alternate);
    }
  }

  if (node.type === "LogicalExpression") {
    if (isObj(node.left)) {
      currentAssignment.push(node.left);
    }
    if (isObj(node.right)) {
      currentAssignment.push(node.right);
    }
  }

  if (node.type === "CallExpression") {
    for (var i = 0; i < node.arguments.length; i++){
      if (isObj(node.arguments[i])) {
        currentAssignment.push(node.arguments[i]);
      }
    }
    if (isObj(node.callee)) {
      currentAssignment.push(node.callee);
    }
  }
  // the "proxied" hack is to avoid recursion
  if (node.type === 'NewExpression' && node.proxied == null) {
    newexpression = {"type": node.type, "callee": node.callee, "arguments":node.arguments, "proxied":true};
    node.type = "CallExpression";
    node.callee = {"type": "Identifier", "name": "makeProxy" };
    node.arguments = [newexpression];
  }

  // the "proxied" hack is to avoid recursion
  if (node.type === 'ObjectExpression' && node.proxied == null) {
   for (var i = 0; i < node.properties.length; i++){
      if (isObj(node.properties[i].value)) {
        currentAssignment.push(node.properties[i].value);
      }
    }
    objexpression = {"type": node.type, "properties": node.properties, "proxied":true};
    node.type = "CallExpression";
    node.callee = {"type": "Identifier", "name": "makeProxy" };
    node.arguments = [objexpression];
  }
}

function isObj(node) {
  while (node.type === "MemberExpression") {
    node = node.object; 
  }
  if (node.type === "Identifier" && node.name !== "console") {
    return true;
  }
  /*
  if( (node.type === "MemberExpression" && node.object.type !== "ThisExpression") && 
    (node.type === "MemberExpression" && node.object.type !== "NewExpression") && 
    (node.type === "MemberExpression" && node.object.type !== "CallExpression") ||
    node.type === "Identifier") {
    console.log("ACCESSED");
    console.log(util.inspect(node, {depth:null}));
    return true;
  };
  */
}

function leave(node){
  if (createsNewScope(node)){
    var currentAssignment = assignmentChain.pop();
    checkForGlobals(currentAssignment, scopeChain);
    var currentScope = scopeChain.pop();
    printScope(currentScope, node);
    if (node.type === 'Program') {
      for(var i in currentScope) {
        rewriteAssignment(currentScope[i]);
      }
    }
  }
}

function printScope(scope, node){
  var varsDisplay = scopeToVarnames(scope).join(', ');
  if (node.type === 'Program'){
    console.log('Variables declared in the global scope:', 
      varsDisplay);
  }else{
    if (node.id && node.id.name){
      console.log('Variables declared in the function ' + node.id.name + '():',
        varsDisplay);
    }else{
      console.log('Variables declared in anonymous function:',
        varsDisplay);
    }
  }
}

function checkForGlobals(assignments, scopeChain){
  for (var i = 0; i < assignments.length; i++){
    var assignment = assignments[i];
    var varname = memberExpToIdentifier(assignment).name;
    if (!isVarDefined(varname, scopeChain)){
      /*
        console.log('Global accessed', varname, 
        'on line', assignment.loc.start.line, ':',
        assignment.loc.start.column);
      */
      rewriteAssignment(assignment);
    }
  }
}

function rewriteAssignment(assignment) {
  var node = memberExpToIdentifier(assignment);
  node.name = "window." + node.name;
}

function memberExpToIdentifier(node) {
  //console.log(node);
  while(node.type !== "Identifier") {
    //console.log(node);
    node = node.object;
  }
  return node;  
}

function scopeToVarnames(scope) {
  var output = [];
  for (var i in scope) {
    output.push(scope[i].name);
  }
  return output;
}

function isVarDefined(varname, scopeChain){
  // start at 1 so we skip vars defined in global scope
  for (var i = 1; i < scopeChain.length; i++){
    var scope = scopeToVarnames(scopeChain[i]);
    if (scope.indexOf(varname) !== -1){
      return true;
    }
  }
  return false;
}

