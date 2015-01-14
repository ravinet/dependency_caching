import os
import sys
import json

log = sys.argv[1]

logs = []

# dictionary with key as write and value as array of reads which depend on it
dependencies = {}
# same info as dependencies---key is (parent,child) tuple and value is tuple of variable and parentid
detailed_deps = {}

# same info as dependencies, but only stores edges as tuple pairs
# of file names i.e. ("file1", "file2")
# use for making dot graphs
dependency_edges = []

# dictionary with variables and number of reads per each
variables = {}

# dictionary with tuples of variable and parentID and list of scripts which write to them per each
variables_scripts = {}

# list of scripts and there parents (values added after processing entire log)
scripts = {}

# final dependencies (with read/write and write/write deps)
final_dependencies = []

with open(log) as file:
    for line in file:
        # remove double quotes wrapping dictionary and also newline
        curr = json.loads(line[1:len(line)-2])
        logs.append(curr)
        if curr.get('var') not in variables:
            variables[curr.get('PropName')] = 0

    # iterate through log and for reads, find corresponding write
    for i in range(0, len(logs)):
        log = logs[i]
        # check script and if new, add to 'scripts'
        if ( log.get('script') not in scripts ):
            scripts[log.get('script')] = []
        # check if WRITE (if so, add to list of which vars get written by which scripts)
        if ( log.get('OpType') == "WRITE" ): # script writes to some var/obj
            curr = (log.get('PropName'), log.get('ParentId'))
            if ( curr in variables_scripts ): # variable already has been written
                if ( log.get('script') not in variables_scripts[curr] ): # script has written to it before!
                    variables_scripts[curr].append( log.get('script') )
            else: # new variable
                variables_scripts[curr] = [log.get('script')]
        # check if READ (can be object with ids, or non-object)
        is_object = 0
        is_val = 0
        if ( log.get('OpType') == "READ" ):
            set_write = 0
            variables[log.get('PropName')] += 1
            if ( log.get('NewValId') == "null" and log.get('OldValId') != "null"): # read on object
                is_object = 1
            elif ( log.get('NewValId') == "null" and log.get('OldValId') == "null"): # read on val
                is_val = 1
            else:
                print >> sys.stderr, "ERROR IN READ: " + logs[n]
            # find corresponding write by going up to top of log
            for n in range(i-1,-1,-1):
                matching_write = 0
                if ( logs[n].get('OpType') == "WRITE" ):
                    if ( is_val ):
                        if ( logs[n].get('PropName') == log.get('PropName') and logs[n].get('ParentId') == log.get('ParentId')):
                            matching_write = 1
                    if ( is_object ):
                        if ( logs[n].get('NewValId') == log.get('OldValId') ):
                            # don't need to consider parentId since each object has unique id?
                            matching_write = 1
                if ( matching_write ):
                    set_write = 1
                    # this is the corresponding write
                    dependency_edges.append((logs[n].get('script'), log.get('script')))
                    if ( logs[n].get('script') in dependencies ):
                        # write is already a dependency
                        if ( log.get('script') not in dependencies[logs[n].get('script')] ): # add this read
                            dependencies.get(logs[n].get('script')).append(log.get('script'))
                    else:
                        dependencies[logs[n].get('script')] = [log.get('script')]
                    # add detailed dependency to detailed_deps with var causing dep
                    parent_child = (logs[n].get('script'), log.get('script'))
                    dep_var = (log.get('PropName'), log.get('ParentId'))
                    if ( parent_child in detailed_deps ):
                        if ( dep_var not in detailed_deps[parent_child]):
                            detailed_deps[parent_child].append( dep_var )
                    else:
                        detailed_deps[parent_child] = [dep_var]
                    break;
            if ( not set_write ):
                # no corresponding write (dependency because it cannot be moved after a write!)
                dependency_edges.append(("No_Write", log.get('script')))
                if ( "No_Write" in dependencies ):
                        dependencies.get("No_Write").append(log.get('script'))
                else:
                    dependencies["No_Write"] = [log.get('script')]

# iterate through read/write rules and fill 'scripts' with parents
for script in scripts:
    for write_script in dependencies:
        if ( script in dependencies[write_script] ): # this is a parent
            scripts[script].append(write_script)

# for every script with multiple parents-->for each parent (old) find variable
# which is reason why it is parent and then check if any other parent (new)
# writes to that...if yes add edge from old to new (store these in write_write_deps)
write_write_deps = []
for script in scripts:
    if ( len(scripts[script]) > 1 ): # script has multiple parents
        for parent in scripts[script]:
            curr_dep = (parent, script)
            # list all variables causing dependency- list of name, parentid tuples
            var_deps = detailed_deps[curr_dep]
            for dep in var_deps:
                # for each dependency, see if any other parent writes to that and if so, add dep
                for other_parent in variables_scripts[dep]:
                    # check if other parent is also parent above, and if so, add dep
                    if ( (other_parent in scripts[script]) and (other_parent != parent) ):
                        write_write_deps.append((other_parent, parent))

# add read/write and write/write deps to final_dependencies
for rw_dep in dependency_edges:
    final_dependencies.append( rw_dep )
for ww_dep in write_write_deps:
    final_dependencies.append( ww_dep)

#print these to stderr so that you can pipe output for the graph (below) easily
print >> sys.stderr, "List of read/write deps:"
print >> sys.stderr, dependency_edges
print >> sys.stderr, "\nList of write/write deps:"
print >> sys.stderr, write_write_deps
print >> sys.stderr, "\nList of final dependencies:"
print >> sys.stderr, final_dependencies
print >> sys.stderr, "\n\n"

#pipe this output to dot
#print "digraph G {"
#print "ratio=compress;"
#print "concentrate=true;"

for (a,b) in final_dependencies:
  print "\"" + a + "\" -> \"" + b + "\";"

#print "}"
