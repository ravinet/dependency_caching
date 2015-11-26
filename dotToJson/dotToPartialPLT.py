import re, sys, urlparse
import json
from json import JSONEncoder

import critical_path

# takes in the dot file that we use (it ignores first three lines) and creates dictionary with key for each node and value for each as an array listing its children
# for now, assumes that '/' is the root node
dot = sys.argv[1]
client_origin = int(sys.argv[2]) if len(sys.argv) > 2 else 1
client_cloud = int(sys.argv[3]) if len(sys.argv) > 3 else 1
cloud_origin = int(sys.argv[4]) if len(sys.argv) > 4 else 1

children = {}
unique_edges = []
parents = {}
# must figure out what to do with two edges connecting the nodes (for now, include them in count)
with open(dot) as f:
    for line in f:
        curr = line.strip("\n")
        if "digraph G {" not in curr and curr != "ratio=compress;" and curr != "concentrate=true;" and curr != "}":
            parent = curr.split(" ")[0].strip('"')
            child = curr.split("> ")[1].strip(";").strip("[color=red]").strip('"')
            if parent != child:
                curr_edge = curr.strip(";").strip("[color=red]")
                if curr_edge not in unique_edges:
                    unique_edges.append(curr_edge)
            if parent not in children:
                children[parent] = [child]
            else:
                children[parent].append(child)
            if child not in children:
                children[child] = []
            if ( parent not in parents ):
                parents[parent] = []
            if ( child not in parents ):
                parents[child] = [parent]
            else:
                parents[child].append(parent)

root = '/'

seen = set()
def mapping_to_dep_graph(mappings, current_node):
  if current_node not in seen:
    seen.add(current_node)
    curr_dict = {current_node : None}
    curr_children = mappings[current_node]
    if len(curr_children) == 0:
      return curr_dict
    else:
      curr_dict[current_node] = filter(None, [mapping_to_dep_graph(mappings, node) for node in curr_children])
      if len(curr_dict[current_node]) == 0:
          curr_dict[current_node] = None
    return curr_dict
  else:
      return None

dep_graph = mapping_to_dep_graph(children, root)

def depth(mappings, node):
  if len(mappings[node]) == 0:
    return 0
  return max([depth(mappings, child) for child in mappings[node]]) + 1
depths = {node: depth(children, node) for node in children}
  
queues = []
def branches(children, node, queue=None):
  if queue == None:
    queue = []
  if len(children[node]) == 0:
    queues.append(queue)
  queue.append(node)
  [branches(children, child, queue[:]) for child in children[node]]
branches(children, root)

def isHttps(node):
  return node.endswith(".https")

def getTiming(queue):
  queue = queue[:]
  client_origin = 0
  client_cloud = 0
  cloud_origin = 0
  https = True
  while len(queue) > 0:
    count = 0
    if https:
      while len(queue) and isHttps(queue[0]):
        queue.pop(0)
        count += 1
      client_origin += count
      https = False
    else:
      while len(queue) and not isHttps(queue[0]):
        queue.pop(0)
        count += 1
      cloud_origin += count
      client_cloud += min(1, count)
      https = True
  return (client_origin, client_cloud, cloud_origin)

def RTTtoPLT(rtts):
  return sum(p*q for p,q in zip(rtts, (client_origin, client_cloud, cloud_origin)))

def getMaxPLT(queues):
  max_plt = 0
  max_leaf = None
  for queue in queues:
    if RTTtoPLT(getTiming(queue)) > max_plt:
      max_plt = RTTtoPLT(getTiming(queue))
      max_leaf = queue[-1]
  return (max_plt, max_leaf)

recursive_branches = []
def getPLTRecursive(children, node, client_origin = 0, client_cloud = 0, cloud_origin = 0, https = True, count = 0):
  if https and not isHttps(node):
    client_origin += count
    count = 1
    https = False
  elif not https and isHttps(node):
    client_cloud += min(1, count)
    cloud_origin += count
    count = 1
    https = True
  else: # continue looking down branch for more of same https/http nodes
    count += 1

  if len(children[node]) == 0:
    # need to account for pending count if this node is a leaf
    if https and isHttps(node):
      client_origin += count
    elif not https and not isHttps(node):
      client_cloud += 1
      cloud_origin += count
    recursive_branches.append((node, (client_origin, client_cloud, cloud_origin)))
    return RTTtoPLT((client_origin, client_cloud, cloud_origin))

  return max([getPLTRecursive(children, child, client_origin, client_cloud, cloud_origin, https, count) for child in children[node]])

print "Branches:"
print queues
print
print "RTTs in format --> leaf_node: (client_origin, client_cloud, cloud_origin)"
print [str(queue[-1]) + ": " + str(getTiming(queue)) for queue in queues]
print
print "Total PLT:", getMaxPLT(queues)[0], "for leaf", getMaxPLT(queues)[1]
print "-----Recursive Algo-------"
print "Total PLT:", getPLTRecursive(children, root)
print recursive_branches
