import re, sys, urlparse
import json
from json import JSONEncoder


# takes in the dot file that we use (it ignores first three lines) and creates dictionary with key for each node and value for each as an array listing its children
# for now, assumes that '/' is the root node
dot = sys.argv[1]

child_deps = {}
unique_edges = []
parents = {}
# must figure out what to do with two edges connecting the nodes (for now, include them in count)
with open(dot) as f:
    for line in f:
        curr = line.strip("\n")
        if "digraph G {" not in curr and curr != "ratio=compress;" and curr != "concentrate=true;" and curr != "}":
            parent = curr.split(" ")[0].replace('"', '')
            child = curr.split("> ")[1].strip(";").strip("[color=red]").replace('"', '')
            if parent != child:
                curr_edge = curr.strip(";").strip("[color=red]")
                if curr_edge not in unique_edges:
                    unique_edges.append(curr_edge)
            if parent not in child_deps:
                child_deps[parent] = [child]
            else:
                child_deps[parent].append(child)
            if child not in child_deps:
                child_deps[child] = []
            if ( parent not in parents ):
                parents[parent] = []
            if ( child not in parents ):
                parents[child] = [parent]
            else:
                parents[child].append(parent)

seen = {}
def depth(mappings, node, path=None):
  if path == None:
    path = []
  if node in path:
    return -1
  if len(mappings[node]) == 0:
    seen[node] = 0
    return seen[node]
  path.append(node)
  d = max([depth(mappings, child, path[:]) for child in mappings[node]]) + 1
  if node in seen:
    seen[node] = max(seen[node], d)
  else:
    seen[node] = d
  return d

  
print json.dumps(parents)
depth(child_deps, '/')
print >> sys.stderr, json.dumps(seen)
#print len(parents)
#print len(seen)
