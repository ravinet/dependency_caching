import re, sys, urlparse
import json
from json import JSONEncoder

import critical_path



# takes in the dot file that we use (it ignores first three lines) and creates dictionary with key for each node and value for each as an array listing its children
# for now, assumes that '/' is the root node
dot = sys.argv[1]

child_deps = {}

with open(dot) as f:
    for line in f:
        curr = line.strip("\n")
        if ( "digraph G {" not in curr and curr != "ratio=compress;" and curr != "concentrate=true;" and curr != "}"):
            parent = curr.split(" ")[0]
            child = curr.split("> ")[1].strip(";").strip("[color=red]")
            if (parent not in child_deps):
                child_deps[parent] = [child]
            else:
                child_deps[parent].append(child)
            if ( child not in child_deps):
                child_deps[child] = []

root = '"/"'
children_mappings = child_deps
#print children_mappings
#print
print "total nodes: "
print len(child_deps.keys())
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

child_dict = mapping_to_child_dict(children_mappings, root)
#print json.dumps(child_dict[root])
#print


(critical_path_nodes, critical_path_lists, slack_nodes) = critical_path.get_critical_path(child_dict)

# map nodes on critical path to location in tree (based on sequence number)
#critical_path_mappings = {}
#for node in critical_path_nodes:
#  critical_path_mappings[all_urls.index(node)] = node

#sorted_critical_path = sorted(critical_path_mappings.values())

slack_nodes_values = {}
for k in slack_nodes.keys():
    slack_nodes_values[k] = slack_nodes[k]["slack_difference"]

#print "\nCritical Path: "
#print sorted_critical_path
#print "Critical Path List:"
tot = 0
for l in critical_path_lists:
    #print l
    tot = tot + 1
#print critical_path_lists
print "\nLength of Critical Path: " + str(len(critical_path_lists[0]))
print "\n"

print "Number of critical paths: " + str(tot)
print "\n"
#print "\nSlack Nodes: "
#print slack_nodes
#print "Slack Nodes values:"
#print slack_nodes_values
print "Percentage Slack nodes:"
print float(len(slack_nodes.keys()))/(len(critical_path_nodes)+len(slack_nodes.keys()))
print "\n"
print "Real Percentage of Slack nodes:"
print float(float(len(slack_nodes.keys()))/len(child_deps.keys()))
print "\n"
