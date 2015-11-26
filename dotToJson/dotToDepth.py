import re, sys, urlparse
import json
from json import JSONEncoder

import critical_path

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
            parent = curr.split(" ")[0]
            child = curr.split("> ")[1].strip(";").strip("[color=red]")
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

def depth(mappings, node):
  if len(mappings[node]) == 0:
    return 0
  return max([depth(mappings, child) for child in mappings[node]]) + 1
  
depths = {node: depth(child_deps, node) for node in child_deps}
print (parents)
print (depths)
