import re, sys, urlparse
import json
from json import JSONEncoder

import critical_path

host = sys.argv[2]
interesting_uuids = []#[176, 173, 167, 160, 143, 142, 139, 138, 136, 135, 0]

r = r".*(:\d+)"
p = re.compile(r)

urls = []
parents = []

with open(sys.argv[1], 'r') as tmz_file:
  tmz_lines = tmz_file.read().split('\n')

def standardize(url,isparent=False):
  #remove unicode type string
  ellipi = url.rfind("\xe2\x80\xa6") 
  if ellipi != -1:
    url = url[:ellipi]

  #match for url
  m = p.match(url)
  if isparent and m != None:
    url = url[:-len(m.group(1))]

  parsed = urlparse.urlparse(url)
  if parsed.scheme == 'data':
      return url
  url = parsed.path
  query = parsed.query

#remove everything before a slash, probably unecessary.
  '''
  if url != "/":
    slashi = url.rfind("/")
    if slashi != -1:
      url = url[slashi:]
  '''
  if url[:1] == "/":
    url = url[1:]
  if len(url) == 0:
    url = "/"
  # remove beginning slash
  elif url[:1] == "/":
    url = url[1:]

  if len(query) > 0:
    url += "?" + query

  if url == "(index)" or url.startswith(host):
    url = "/"

  if isparent:
    for u in urls:
      if url == "/":
          return url
      if u.startswith(url):
        url = u

  return url

for i, l in enumerate(tmz_lines):
  if "GET" in l:
    line = l.split()
    url = line[0].strip()

    parent = line[4].strip()

    if parent == "Other":
      parent = "/"

    url = standardize(url)
    parent = standardize(parent, isparent=True)

    if not (url in urls):
      urls.append(url)
      parents.append(parent)

for parent in list(set([parent for parent in parents if not(parent in urls) and parent != "/"])):
  urls.append(parent)
  parents.append("/")

all_urls = []
zipped = []
for url, parent in zip(urls, parents):
  if parent not in all_urls:
    all_urls.append(parent)
  if url not in all_urls:
    all_urls.append(url)

  if not((url, parent) in zipped or (parent, url) in zipped):
    zipped.append( (url, parent) )

def uuid(url):
  return all_urls.index(url)

#print all nodes with listed parents
children_mappings = {}

# iterate through urls and make list of children per url
for url, parent in zipped:
  #print "url: " + str(url) + " parent: " + str(parent)
  children = []
  for url1,parent1 in zipped:
      if ( parent1 == url ):
            children.append( url1 )
  #print new_node.url + " " + new_node.parent
  children_mappings[url] = children
  #print json.dumps(new_node, cls=MyEncoder)

root = zipped[0][0]
def mapping_to_child_dict(mappings, current_node):
  curr_dict = {current_node : None}
  curr_children = mappings[current_node]
  if len(curr_children) == 0:
    return curr_dict
  else:
    curr_dict[current_node] = [mapping_to_child_dict(mappings, node) for node in curr_children]
  return curr_dict

child_dict = mapping_to_child_dict(children_mappings, root)
print child_dict

(critical_path_nodes, slack_nodes) = critical_path.get_critical_path(child_dict)
print critical_path_nodes
print slack_nodes
