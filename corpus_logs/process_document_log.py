# document logging nodes
'''
go through logs and for each log, track up to find corresponding write
write can be corresponding due to matching id, PropName (var/childpath)
must also check to make sure that the NodeProp fields match (both can be null)
if they don't match, then it is not a dependency because the properties changed/read are not same
'''

import os
import sys
import json

log = sys.argv[1]
original_log = sys.argv[2]

logs = []

# dictionary with key as write and value as array of reads which depend on it
dependencies = {}
# same info as dependencies---key is (parent,child) tuple and value is tuple of variable and id
detailed_deps = {}

# same info as dependencies, but only stores edges as tuple pairs
# of file names i.e. ("file1", "file2")
# use for making dot graphs
dependency_edges = []

# dictionary with variables and number of reads per each
variables = {}

# dictionary with tuples of variable and id and list of scripts which write to them per each
variables_scripts = {}

# list of scripts and there parents (values added after processing entire log)
scripts = {}

# final dependencies (with read/write and write/write deps)
final_dependencies = []

# list of original dependencies on page (avoid having duplicates between new and old)
original = []

# store html dependencies with line numbers for chunking (dictionary where key is tuple of parent,child and value is array of line numbers)
html_deps = {}

with open(original_log) as file1:
    for line1 in file1:
        original.append(line1[0:len(line1)-1])

with open(log) as file:
    for line in file:
        # remove double quotes wrapping dictionary and also newline
        curr = json.loads(line[0:len(line)-1])
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
            curr = (log.get('PropName'), log.get('id'))
            if ( curr in variables_scripts ): # variable already has been written
                if ( log.get('script') not in variables_scripts[curr] ): # script has written to it before!
                    variables_scripts[curr].append( log.get('script') )
            else: # new variable
                variables_scripts[curr] = [log.get('script')]
        # check if READ
        if ( log.get('OpType') == "READ" ):
            set_write = 0
            if ( log.get('PropName') in variables ):
                variables[log.get('PropName')] += 1
            else:
                variables[log.get('PropName')] = 1
            # find corresponding write by going up to top of log
            for n in range(i-1,-1,-1):
                matching_write = 0
                if ( logs[n].get('OpType') == "WRITE" ):
                    # matching write can be from id or childpath (or both)
                    # may be worth checking to make sure both match if both are present (if present, should match)
                    if ( (logs[n].get('PropName') == log.get('PropName')) or (logs[n].get('id') == log.get('id'))):
                        # only a dependency if the property written matches the property read (or if either read or write are of entire node)
                        if ( (logs[n].get('NodeProp') == log.get('NodeProp')) or (logs[n].get('NodeProp') == "null" ) or (log.get('NodeProp') == "null") ):
                            matching_write = 1
                if ( matching_write ):
                    set_write = 1
                    # this is the corresponding write
                    if ( logs[n].get('script') in dependencies ):
                        # write is already a dependency
                        if ( log.get('script') not in dependencies[logs[n].get('script')] ): # add this read
                            dependencies.get(logs[n].get('script')).append(log.get('script'))
                            dependency_edges.append((logs[n].get('script'), log.get('script')))
                    else:
                        dependencies[logs[n].get('script')] = [log.get('script')]
                        dependency_edges.append((logs[n].get('script'), log.get('script')))
                    if ( 'line' in logs[n] ):
                        # this is an html dep (js is read and html is write)
                        dep_tuple = (logs[n].get('script'), log.get('script'))
                        if ( dep_tuple in html_deps ):
                            html_deps[dep_tuple].append(logs[n].get('line'));
                        else:
                            html_deps[dep_tuple] = [logs[n].get('line')]
                    # add detailed dependency to detailed_deps with var causing dep
                    parent_child = (logs[n].get('script'), log.get('script'))
                    dep_var = (log.get('PropName'), log.get('id'))
                    if ( parent_child in detailed_deps ):
                        if ( dep_var not in detailed_deps[parent_child]):
                            detailed_deps[parent_child].append( dep_var )
                    else:
                        detailed_deps[parent_child] = [dep_var]
                    break;
            if ( not set_write ):
                # no corresponding write (dependency because it cannot be moved after a write!)
                if ( ("No_Write", log.get('script')) not in dependency_edges ):
                    dependency_edges.append(("No_Write", log.get('script')))
                if ( "No_Write" in dependencies ):
                        dependencies.get("No_Write").append(log.get('script'))
                else:
                    dependencies["No_Write"] = [log.get('script')]

            # find all subsequent writes to handle RWR dependencies
            for p in range(i+1, len(logs)):
                if ( (logs[p].get('PropName') == log.get('PropName')) or (logs[p].get('id') == log.get('id'))):
                    # only a dependency if the property written matches the property read (or if either read or write are of entire node)
                    if ( (logs[p].get('NodeProp') == log.get('NodeProp')) or (logs[p].get('NodeProp') == "null" ) or (log.get('NodeProp') == "null") ):
                        if ( logs[p].get('OpType') == "WRITE" ):
                            parent_child = (log.get('script'), logs[p].get('script'))
                            if ( parent_child not in dependency_edges ):
                                dependency_edges.append(parent_child)
                        if ( logs[p].get('OpType') == "READ" ):
                            break;

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
            try:
                var_deps = detailed_deps[curr_dep]
                for dep in var_deps:
                    # for each dependency, see if any other parent writes to that and if so, add dep
                    for other_parent in variables_scripts[dep]:
                        # check if other parent is also parent above, and if so, add dep
                        if ( (other_parent in scripts[script]) and (other_parent != parent) ):
                            write_write_deps.append((other_parent, parent))
            except:
                print >> sys.stderr, "KEY ERROR"
                pass

# add read/write and write/write deps to final_dependencies
for rw_dep in dependency_edges:
    if ( rw_dep not in final_dependencies ):
        final_dependencies.append( rw_dep )
for ww_dep in write_write_deps:
    if ( ww_dep not in final_dependencies ):
        final_dependencies.append( ww_dep)

#print these to stderr so that you can pipe output for the graph (below) easily
print >> sys.stderr, "List of read/write deps:"
print >> sys.stderr, dependency_edges
print >> sys.stderr, "\nList of write/write deps:"
print >> sys.stderr, write_write_deps
print >> sys.stderr, "\nList of final dependencies:"
print >> sys.stderr, final_dependencies
print >> sys.stderr, "\nDetailed dependencies: "
print >> sys.stderr, detailed_deps
print >> sys.stderr, "\nHTML dependencies:"
print >> sys.stderr, html_deps
print >> sys.stderr, "\n\n"

#pipe this output to dot
#print "digraph G {"
#print "ratio=compress;"
#print "concentrate=true;"

for (a,b) in final_dependencies:
  if ( a != b ):
    parent_name = a.split("/")[-1]
    child_name = b.split("/")[-1]
    if ( a == "/" ):
        parent_name = a
    if ( b == "/" ):
        child_name = b
    if ( "?" in parent_name ):
        temp = parent_name
        parent_name = temp.split("?")[0]
    if ( "?" in child_name ):
        temp = child_name
        child_name = temp.split("?")[0]
    new_line = "\"" + parent_name + "\" -> \"" + child_name + "\";"
    if ( new_line not in original ):
        #print "\"" + a.split("/")[-1] + "\" -> \"" + b.split("/")[-1] + "\";"
        print "\"" + parent_name + "\" -> \"" + child_name + "\"[color=red];"

#print "}"
