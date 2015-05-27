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

# key is (parent, child) tupe and value is array of (var_name, obj_id, line_number_parent, line_number_child)
dep_lines = {}

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
                            html_deps[dep_tuple].append(int(logs[n].get('line')));
                        else:
                            html_deps[dep_tuple] = [logs[n].get('line')]
                    # add detailed dependency to detailed_deps with var causing dep
                    parent_child = (logs[n].get('script'), log.get('script'))
                    dep_var = (log.get('PropName'), log.get('id'))
                    parent_line = "null"
                    child_line = "null"
                    if ( 'line' in logs[n] ):
                        parent_line = logs[n].get('line')
                    if ( 'OrigLine' in log ):
                        child_line = log.get('OrigLine')
                    line_dep = (log.get('PropName'), log.get('id'), parent_line, child_line)
                    if ( parent_child in detailed_deps ):
                        if ( dep_var not in detailed_deps[parent_child]):
                            detailed_deps[parent_child].append( dep_var )
                    else:
                        detailed_deps[parent_child] = [dep_var]
                    # add line number deps
                    if ( parent_child in dep_lines ):
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
print >> sys.stderr, "\n\nLINE dependencies (var_name, id, parent_line, child_line):\n"
for deppair in dep_lines:
    print >> sys.stderr, deppair
    for i in dep_lines[deppair]:
        print >> sys.stderr, i
    print "\n"

print >> sys.stderr, "\n\n"

# keys are parents and values are dictionaries with keys as children and values as tuples (chunk line start, chunk line end)
final_html_chunks = {}

# make chunks based on HTML/JS dependencies (line ranges for each and for each JS file, store tuple (html file, line range))
# iterate through html_chunks and for each parent, iterate to find all other cases where it is parent and then for each one find max in array (store it as a local var dict with child and line number and then make chunks based on that...then print parent:line range and then child
# don't want to keep iterating over same parents!

new_final_dependencies = []

# keys are original files and values are tuples (start chunk name and end chunk name)
chunk_info = {}

handled_parents = []
last_chunks = {}
for dep in html_deps:
    curr_parent = dep[0]
    if ( curr_parent not in handled_parents ):
      final_html_chunks[curr_parent] = {}
      chunks = {}
      lines = []
      handled_parents.append(curr_parent)
      for inner_dep in html_deps:
          if ( inner_dep[0] == curr_parent ):
              chunks[int(max(html_deps[inner_dep]))] = inner_dep[1]
              lines.append(html_deps[inner_dep])
      # now we have chunks where keys are line numbers  and values are the children
      # want to go through this and make the chunks and link them to their children
      prev = -1
      prev_chunk = ()
      start_chunk = ""
      for x in sorted(chunks):
        child = chunks[x]
        begin = int(prev) + 1
        final_html_chunks[curr_parent][child] = (begin, x)
        prev = x
        if ( prev_chunk != () ):
          prev_name = curr_parent + "---" + str(prev_chunk[0]) + ":" + str(prev_chunk[1])
          new_name = curr_parent + "---" + str(begin) + ":" + str(x)
          new_final_dependencies.append((prev_name, new_name))
          prev_chunk = (begin,x)
        else: # if prev chunk was (), then this is the first chunk!
          start_chunk = curr_parent + "---" + str(begin) + ":" + str(x)
        prev_chunk = (begin,x)
      if ( prev_chunk != () ):
        last_prev = curr_parent + "---" + str(prev_chunk[0]) + ":" + str(prev_chunk[1])
        final_curr = curr_parent + "---" + str(prev_chunk[1] + 1) + ":end"
        new_final_dependencies.append((last_prev, final_curr))
        last_chunks[curr_parent] = final_curr
      chunk_info[curr_parent] = (start_chunk, final_curr)

#pipe this output to dot
#print "digraph G {"
#print "ratio=compress;"
#print "concentrate=true;"

for (x,y) in final_dependencies:
  if ( x in final_html_chunks ):
    if (y in final_html_chunks[x] ):
      # chunk dependency!
      new_parent = x + "---" + str(final_html_chunks[x][y][0]) + ":" + str(final_html_chunks[x][y][1])
      new_final_dependencies.append((new_parent, y))
    else:
      if ( x in last_chunks ):
        new_final_dependencies.append((last_chunks[x], y))
      else:
        new_final_dependencies.append((x,y))
  else:
    new_final_dependencies.append((x,y))

# iterate through original deps and replace non-chunked nodes with their chunked counterparts (consider start and end chunks
# depending on whether the node was a parent or a child in the original deps
new_original = []
for line in original:
  if ( line != "strict digraph G {" and line != "ratio=compress;" and line != "concentrate=true;" and line != '}' ):
    parent = line.split(" ")[0].replace("\"","")
    child = line.split("> ")[1].strip(";").replace("\"","")
    new_parent = parent
    new_child = child
    if ( parent in chunk_info ): # use end chunk because this is a parent (whole file must finish before child)
        new_parent = chunk_info[parent][1]
        # check if child was part of real chunks made---if so, delete original
        if ( parent in final_html_chunks ):
            if ( child in final_html_chunks[parent] ):
                # was previously a child of a chunk so delete original
                continue
    if ( child in chunk_info ): # use start chunk because this is a child (parent should go to the start of this file)
        new_child = chunk_info[child][0]

    new_original.append(new_parent + " -> " + new_child + ";")
  else:
    if ( line != "}" ):
        new_original.append(line)
new_original.append("}")

# if chunk is only based on one file then change it to just be normal dependency for that file and remove other instances
#handled = []
#to_handle = {}
#for i in range(0, len(new_final_dependencies)):
#  p = new_final_dependencies[i][0]
#  c = new_final_dependencies[i][1]
#  parents_to_replace = []
#  children_to_replace = []
#  if ( "---" in p ):
#    curr_parent = p.split("---")[0]
#    if ( curr_parent not in handled ):
#      handled.append(curr_parent)
#      curr_children = []
#      for j in range(i, len(new_final_dependencies)):
#        inp = new_final_dependencies[j][0]
#        inc = new_final_dependencies[j][1]
#        now_parent = inp.split("---")[0]
#        if ( now_parent == curr_parent ):
#          if ( "---" not in inc):
#            if ( inc not in curr_children ):
#              curr_children.append(inc)
#          elif ( inc.split("---")[0] == curr_parent ):
#              children_to_replace.append(j)
#          if ( j not in children_to_replace ):
#            parents_to_replace.append(j)
#      to_handle[curr_parent] = ((parents_to_replace, children_to_replace), curr_children)
#
## parents_to_replace has lines where parent should remove chunk name but child is not chunk
## children_to_replace has lines to be removed because child is chunk!
## only do anything if there is one non-chunk child for the parent
#for par in to_handle:
#  if (len(to_handle[par][1]) == 1):
#    # only one child so fix all parents and children
#    for y in to_handle[par][0][0]:
#      orig = new_final_dependencies[y]
#      new_final_dependencies[y] = (par, orig[1])
#    # remove children
#    removed = 0
#    for x in to_handle[curr_parent][0][1]:
#      new_final_dependencies.pop(x-removed)
#      removed = removed + 1

# print original without the closing '}'
for line in new_original:
  if ( line == "strict digraph G {" or line == "ratio=compress;" or line == "concentrate=true;"):
    print line
  else:
    if ( line != "}" ):
      parent = line.split(" ")[0]
      child = line.split("> ")[1].strip(";")
      parent = "\"" + parent + "\""
      child = "\"" + child + "\""
      print parent + " -> " + child + ";"

for (a,b) in new_final_dependencies:
  if ( a != b ):
    parent_name = a.split("/")[-1]
    child_name = b.split("/")[-1]
    if ( (a[0:4] == "/---") or (a == "/") ):
        parent_name = a
    if ( (b[0:4] == "/---") or (b == "/") ):
        child_name = b
    if ( "?" in parent_name ):
        temp = parent_name
        parent_name = temp.split("?")[0]
    if ( "?" in child_name ):
        temp = child_name
        child_name = temp.split("?")[0]
    new_line = "\"" + parent_name + "\" -> \"" + child_name + "\";"
    if ( new_line not in new_original ):
        #print "\"" + a.split("/")[-1] + "\" -> \"" + b.split("/")[-1] + "\";"
        print "\"" + parent_name + "\" -> \"" + child_name + "\"[color=red];"

print "}"
