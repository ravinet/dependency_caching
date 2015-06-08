import os
import sys
import json

log = sys.argv[1]
original_log = sys.argv[2]

logs = []

# dictionary with key as write and value as array of reads which depend on it
dependencies = {}
# same info as dependencies---key is (parent,child) tuple and value is tuple of variable and parentid
detailed_deps = {}

# key is (parent, child) tupe and value is array of (var_name, obj_id, line_number_parent, line_number_child)
dep_lines = {}

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

# list of original dependencies on page (avoid having duplicates between new and old)
original = []

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
            if ( log.get('PropName') in variables ):
                variables[log.get('PropName')] += 1
            else:
                variables[log.get('PropName')] = 1
            if ( log.get('NewValId') == "null" and log.get('OldValId') != "null"): # read on object
                is_object = 1
            elif ( log.get('NewValId') == "null" and log.get('OldValId') == "null"): # read on val
                is_val = 1
            else:
                print >> sys.stderr, "ERROR IN READ: " + str(logs[i])
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
                    #dependency_edges.append((logs[n].get('script'), log.get('script')))
                    if ( logs[n].get('script') in dependencies ):
                        # write is already a dependency
                        if ( log.get('script') not in dependencies[logs[n].get('script')] ): # add this read
                            dependencies.get(logs[n].get('script')).append(log.get('script'))
                            dependency_edges.append((logs[n].get('script'), log.get('script')))
                    else:
                        dependencies[logs[n].get('script')] = [log.get('script')]
                        dependency_edges.append((logs[n].get('script'), log.get('script')))
                    # add detailed dependency to detailed_deps with var causing dep
                    parent_child = (logs[n].get('script'), log.get('script'))
                    dep_var = (log.get('PropName'), log.get('ParentId'))
                    parent_line = "null"
                    child_line = "null"
                    if ( 'OrigLine' in logs[n] ):
                        parent_line = logs[n].get('OrigLine')
                    if ( 'OrigLine' in log ):
                        child_line = log.get('OrigLine')
                    line_dep = (log.get('PropName'), log.get('OldValId'), log.get('ParentId'), parent_line, child_line)
                    if ( parent_child in detailed_deps ):
                        if ( dep_var not in detailed_deps[parent_child]):
                            detailed_deps[parent_child].append( dep_var )
                    else:
                        detailed_deps[parent_child] = [dep_var]
                    # add line number deps
                    if ( parent_child in dep_lines ):
                        if ( line_dep not in dep_lines[parent_child] ):
                            dep_lines[parent_child].append( line_dep )
                    else:
                        dep_lines[parent_child] = [line_dep]
                    break;
            if ( not set_write ):
                # no corresponding write (dependency because it cannot be moved after a write!)
                if ( ("No_Write", log.get('script')) not in dependency_edges ):
                    dependency_edges.append(("No_Write", log.get('script')))
                if ( "No_Write" in dependencies ):
                        dependencies.get("No_Write").append(log.get('script'))
                else:
                    dependencies["No_Write"] = [log.get('script')]
            # find all subsequent writes to handle WRW dependencies (only go up to next read to avoid redundancy)
            for p in range(i+1, len(logs)):
                if ( is_val ):
                    if ( logs[p].get('PropName') == log.get('PropName') and logs[p].get('ParentId') == log.get('ParentId')):
                        if ( logs[p].get('OpType') == "WRITE" ):
                            parent_child = (log.get('script'), logs[p].get('script'))
                            if ( parent_child not in dependency_edges ):
                                dependency_edges.append(parent_child)
                        if ( logs[p].get('OpType') == "READ" ):
                            break;
                if ( is_object ):
                    if ( logs[n].get('NewValId') == log.get('OldValId') ):
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

# handle WRW dependencies-->if file1 writes to var, file2 reads var, and file3 writes var
# we should have an edge from file1 to file2 (already do) and file2 to file3 because
# file3 can't be moved ahead of file2 (the read in file2 would be wrong!)
# to do this, when we iterate through the logs, after finding the corresponding write
# for a read by going up in the log, go down in the log and find all writes
# for the corresponding variable and add dependency from the current read to the write for each write encountered.

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
#print >> sys.stderr, "\nDetailed dependencies: "
#print >> sys.stderr, detailed_deps

print >> sys.stderr, "\n\nLINE dependencies (var_name, obj_id, parent_id, parent_line, child_line):\n"
for deppair in dep_lines:
    print >> sys.stderr, deppair
    for i in dep_lines[deppair]:
        print >> sys.stderr, i
    print "\n"

print >> sys.stderr, "\n\n"

## detailed deps between separate files
#print >> sys.stderr, "\n\nDETAILED DEPS: "
#for dep in detailed_deps:
#    if ( dep[0] != dep[1] ):
#        print >> sys.stderr, dep
#        for inner in detailed_deps[dep]:
#            print >> sys.stderr, inner
#        print >> sys.stderr, "\n\n"

#pipe this output to dot
#print "digraph G {"
#print "ratio=compress;"
#print "concentrate=true;"

# print original without the closing '}'
for line in original:
  if ( line != "}" ):
    print line

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
    if ( parent_name != "No_Write" and child_name != "No_Write" ):
        new_line = "\"" + parent_name + "\" -> \"" + child_name + "\";"
        if ( new_line not in original ):
            #print "\"" + a.split("/")[-1] + "\" -> \"" + b.split("/")[-1] + "\";"
            print "\"" + parent_name + "\" -> \"" + child_name + "\"[color=red];"

print "}"
