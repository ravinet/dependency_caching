import re, sys, urlparse
import pprint
import json
from json import JSONEncoder

pp = pprint.PrettyPrinter(indent=2)

dot = sys.argv[1]
start_node = '/'
if ( len(sys.argv) == 3 ):
  start_node = sys.argv[2]

parents = {}
children  = {}
edges = {}
depths = {}
# must figure out what to do with two edges connecting the nodes (for now, include them in count)
with open(dot) as f:
  for linenumber, line in enumerate(f):
    curr = line.strip("\n")
    if "digraph G {" not in curr and curr != "ratio=compress;" and curr != "concentrate=true;" and curr != "}":
      parent = curr.split(" ")[0].replace('"', '')
      child = curr.split("> ")[1].strip(";").strip("[color=red]").replace('"', '')
      edge = (parent, child)

      parents.setdefault(parent,[])
      children.setdefault(child,[])

      if edge in edges or parent == child:
        continue

      edges[edge] = linenumber
      parents.setdefault(child,[]).append(parent)
      children.setdefault(parent,[]).append(child)

def find_loops(graph, start, path=[]):
  if start in path:
    return [path + [start]]
  path = path + [start]

  loops = []
  for child in graph[start]:
    childs_loops = find_loops(graph, child, path)
    for loop in childs_loops:
      loops.append(loop)
  return loops
    
loops = find_loops(children, start_node)

def break_loops(loops, parents, children, edges):
  #change loops to edges
  loops = [[(a,b) for a,b in zip(loop[:-1], loop[1:])] for loop in loops]
  deleted_edges = []

  '''
  length_loops = {}
  for loop in loops:
    length_loops.setdefault(len(loop), []).append(loop)

  for l in sorted(length_loops.keys()):
    l_length_loops = length_loops[l]
    while len(l_length_loops) > 0:
      max_edge_time = -1
      max_edge_index = None
      for index, loop in enumerate(l_length_loops):
        if len(set(loop).intersection(deleted_edges)) > 0:
          l_length_loops.remove(loop)
          continue
        if edges[loop[-1]] > max_edge_time:
          max_edge_time = edges[loop[-1]]
          max_edge_index = index
      if max_edge_index is not None:
        delete_edge = l_length_loops[max_edge_index][-1]
        #print "deleting edge " + str(delete_edge)
        parents[delete_edge[1]].remove(delete_edge[0])
        children[delete_edge[0]].remove(delete_edge[1])
        del edges[delete_edge]
        deleted_edges.append(delete_edge)
        l_length_loops.pop(max_edge_index)
  '''
  while len(loops) > 0:
    max_edge_time = -1
    max_edge_index = None
    for index, loop in enumerate(loops):
      if len(set(loop).intersection(deleted_edges)) > 0:
        loops.remove(loop)
        continue
      if edges[loop[-1]] > max_edge_time:
        max_edge_time = edges[loop[-1]]
        max_edge_index = index
    if max_edge_index is not None:
      delete_edge = loops[max_edge_index][-1]
      #print "deleting edge " + str(delete_edge)
      parents[delete_edge[1]].remove(delete_edge[0])
      children[delete_edge[0]].remove(delete_edge[1])
      del edges[delete_edge]
      deleted_edges.append(delete_edge)
      loops.pop(max_edge_index)


break_loops(loops, parents, children, edges)

def depth(children, node, depths, path=[]):
  if node in path:
    return -1
  if len(children[node]) == 0:
    depths[node] = 0
    return 0
  path = path + [node]

  d = max([depth(children, child, depths, path) 
    for child in children[node]]) + 1
  if node in depths:
    depths[node] = max(depths[node], d)
  else:
    depths[node] = d
  return d

depth(children, start_node, depths)

'''
print "\nloops:"
pp.pprint(loops)
print "\nparents:"
pp.pprint(parents)
print "\nchildren:"
pp.pprint(children)
print "\ndepths:"
pp.pprint(depths)
'''
print json.dumps(parents)
print >> sys.stderr, json.dumps(depths)
dot = open("newdot.dot", 'w')
dot.write("strict digraph G {\nratio=compress;\n")
for edge in edges:
   dot.write("\"" + edge[0] + "\" -> \"" + edge[1] + "\";\n")
dot.write("}") 

