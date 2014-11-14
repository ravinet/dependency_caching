var code = "l=1; e = {}; f = 2; var h = 1; function m(a, b){ e.y = 8; a=1; k = 2; function n() { l = 2}}"
console.log(code);
var ast = esprima.parse(code, {loc: true});
var scopeChain = []; // contains identifiers 
var assignments = [];

estraverse.traverse(ast, {
  enter: enter,
  leave: leave
});

console.log(escodegen.generate(ast));

function createsNewScope(node){
  return node.type === 'FunctionDeclaration' ||
    node.type === 'FunctionExpression' ||
    node.type === 'Program';
}

function enter(node){
  if (createsNewScope(node)){
    scopeChain.push([]);
    if (node.params !== null) {
      var currentScope = scopeChain[scopeChain.length - 1];
      for (var i in node.params) {
        currentScope.push(node.params[i]);
      }
    }
  }

  var currentScope = scopeChain[scopeChain.length - 1];
  if (node.type === 'VariableDeclarator'){
    currentScope.push(node.id);
  }

  if (node.type === 'AssignmentExpression'){
    // if declared in global scope it's a global var
    if (scopeChain.length === 1) {
      currentScope.push(memberExpToIdentifier(node.left));
    } else {
      assignments.push(node);
    }
  }
}

function leave(node){
  if (createsNewScope(node)){
    checkForGlobals(assignments, scopeChain);
    currentScope = scopeChain.pop();
    printScope(currentScope, node);
    assignments = [];
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

function assignmentName(node) {
  if (node.left.type === "Identifier") {
    return node.left.name;
  }
  // ex: window.x = 1, this will return window
  if (node.left.type === "MemberExpression") {
    return node.left.object.name;
  }
}

function checkForGlobals(assignments, scopeChain){
  for (var i = 0; i < assignments.length; i++){
    var assignment = assignments[i];
    var varname = assignmentName(assignment);
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

