#!/usr/bin/env python
import os
import csv
from urlparse import urlparse

DOM = 'document_complete_logs'
window = 'window_complete_logs'
original = 'original_logs'

missing_logs = ["irs", "indeed", "outlook", "noaa", "timewarnercable"]

stats = {}

def get_dep_counts(dot): 
  num_normal = 0
  num_red = 0
  js_leaf = []
  with open(dot) as f:
    for line in f:
      curr = line.strip("\n")
      if "digraph G {" not in curr and curr != "ratio=compress;" and curr != "concentrate=true;" and curr != "}":
        parent = curr.split(" ")[0]
        child = curr.split("> ")[1].strip(";")
        if is_js(parent) and parent not in js_leaf:
          
        if child.endswith("[color=red]"):
          num_red += 1
        else:
          num_normal += 1
  return (num_normal, num_red)

def is_js(path):
  return urlparse(path).path.endswith(".js")

for root, dirs, filenames in os.walk("."):
  for f in filenames:
    if not f.startswith(".") and root != ".":
      stats.setdefault(f, {})
      (num_normal, num_red) = get_dep_counts(os.path.join(root,f))
      if root.endswith(DOM):
        stats[f][DOM] = (num_normal, num_red)
      if root.endswith(window):
        stats[f][window] = (num_normal, num_red)
      if root.endswith(original):
        stats[f][original] = (num_normal, num_red)

with open('stats.csv', 'wb') as csvfile:
  csvwriter = csv.writer(csvfile)
  csvwriter.writerow(["Site", "normal dom", "new dom", "new window"])
  for site in sorted(stats):
    if DOM not in stats[site]:
      print "missing DOM/window log: ", site
    elif original not in stats[site]:
      print "missing original: ", site 
    else:
      original_deps = stats[site][DOM][0]
      new_dom = stats[site][DOM][1]
      new_window = stats[site][window][1]
      csvwriter.writerow([site, original_deps, new_dom, new_window])













