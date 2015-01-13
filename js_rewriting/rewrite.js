// requires node packages listed below
// example: 'npm install esprima'
esprima = require('esprima');
estraverse = require('estraverse');
escodegen = require('escodegen');

fs = require('fs');

//var code = "l=1; e = {key: l}; f = 2; var h = 1; z = function m(a, b){ m = 2; e.x.y = 8; a=1; k = 2; q =function() { b = 2;l = 2}; var q = function x() {a = 1; k =1; x = 2;};}"
var code = fs.readFileSync(process.argv[2]);
var ast = esprima.parse(code, {loc: true});
console.log(escodegen.generate(ast));

var scopeChain = []; // contains identifiers 
var assignmentChain = [];

estraverse.traverse(ast, {
  enter: enter,
  leave: leave
});

console.log(ast);
console.log(escodegen.generate(ast));
fs.writeFileSync(process.argv[3], escodegen.generate(ast));

function createsNewScope(node){
  return node.type === 'FunctionDeclaration' ||
    node.type === 'FunctionExpression' ||
    node.type === 'Program';
}

function enter(node){
  if (createsNewScope(node)){
    scopeChain.push([]);
    assignmentChain.push([]);
    var currentScope = scopeChain[scopeChain.length - 1];
    if(node.type !== 'Program') {
      //add function args
      if (node.params !== null) {
        for (var i in node.params) {
          currentScope.push(node.params[i]);
        }
      }
      //add function name
      if (node.id !== null && node.id.name !== null) {
        currentScope.push(node.id);
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
    if (scopeChain.length === 1) {
      currentScope.push(memberExpToIdentifier(node.left));
    } else {
      currentAssignment.push(node);
    }
  }
  
  if(node.type == 'ObjectExpression') {

  }
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
    var varname = memberExpToIdentifier(assignment.left).name;
    if (!isVarDefined(varname, scopeChain)){
      console.log('Global accessed', varname, 
        'on line', assignment.loc.start.line, ':',
        assignment.loc.start.column);
      rewriteAssignment(assignment.left);
    }
  }
}

function rewriteAssignment(assignment) {
  var node = memberExpToIdentifier(assignment);
  node.name = "window." + node.name;
}

function memberExpToIdentifier(node) {
  while(node.type !== "Identifier") {
    node = node.object;
  }
  return node;  
}

function scopeToVarnames(scope) {
  var output = [];
  for (var i in scope) {
    output.push(scope[i].name)
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

