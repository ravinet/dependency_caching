import os
import sys
import json

log = sys.argv[1]

logs = []

# dictionary with key as write and value as array of reads which depend on it
dependencies = {}

# same info as dependencies, but only stores edges as tuple pairs
# of file names i.e. ("file1", "file2")
# use for making dot graphs
dependency_edges = []

# dictionary with variables and number of reads per each
variables = {}

# dictionary with tuples of variable and parentID and list of scripts which write to them per each
variables_scripts = {}

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
                    break;
            if ( not set_write ):
                # no corresponding write (dependency because it cannot be moved after a write!)
                dependency_edges.append(("No_Write", log.get('script')))
                if ( "No_Write" in dependencies ):
                        dependencies.get("No_Write").append(log.get('script'))
                else:
                    dependencies["No_Write"] = [log.get('script')]

#print these to stderr so that you can pipe output for the graph (below) easily
print >> sys.stderr, dependencies
print >> sys.stderr, dependency_edges
print >> sys.stderr, variables
print >> sys.stderr, variables_scripts
print >> sys.stderr, "\n\n\n\n"

#pipe this output to dot
print "digraph G {"
print "ratio=compress;"
print "concentrate=true;"

for (a,b) in dependency_edges:
  print "\"" + a + "\" -> \"" + b + "\";"

print "}"
