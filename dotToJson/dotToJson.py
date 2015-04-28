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

root = '"/"'

seen = set()
def mapping_to_child_dict(mappings, current_node):
  if current_node not in seen:
    seen.add(current_node)
    curr_dict = {current_node : None}
    curr_children = mappings[current_node]
    if len(curr_children) == 0:
      return curr_dict
    else:
      curr_dict[current_node] = filter(None, [mapping_to_child_dict(mappings, node) for node in curr_children])
      if len(curr_dict[current_node]) == 0:
          curr_dict[current_node] = None
    return curr_dict
  else:
      return None

child_dict = mapping_to_child_dict(child_deps, root)
print json.dumps(parents)
print json.dumps(child_dict[root])
