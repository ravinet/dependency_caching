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

with open(log) as file:
    for line in file:
        # remove double quotes wrapping dictionary and also newline
        curr = json.loads(line[1:len(line)-2])
        logs.append(curr)
        if curr.get('var') not in variables:
            variables[curr.get('var')] = 0

    # iterate through log and for reads, find corresponding write
    for i in range(0, len(logs)):
        log = logs[i]
        # check if READ
        if ( log.get('window') == "READ" ):
            set_write = 0
            variables[log.get('var')] += 1
            # find corresponding write by going up to top of log
            for n in range(i-1,-1,-1):
                if ( logs[n].get('window') == "WRITE" and logs[n].get('var') == log.get('var') ):
                    set_write = 1
                    # this is the corresponding write
                    dependency_edges.append((logs[n].get('script'), log.get('script')))
                    if ( logs[n].get('script') in dependencies ):
                        # write is already a dependency, so add this read
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

#pipe this output to dot
print "digraph G {"
print "ratio=compress;"
print "concentrate=true;"

for (a,b) in dependency_edges:
  print "\"" + a + "\" -> \"" + b + "\";"

print "}"
