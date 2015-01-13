#!/usr/bin/env python
# -*- coding: utf-8 -*-
import re, sys, urlparse, subprocess

host = sys.argv[2]
log_file = sys.argv[3]
interesting_uuids = []#[176, 173, 167, 160, 143, 142, 139, 138, 136, 135, 0]
# if (uuid(url) >= 40 and uuid(url) <= 117) or (uuid(parent) >= 40 and uuid(parent) <= 117): continue

r = r".*(:\d+)"
p = re.compile(r)
# match for siteurl:95 shit

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
  url = parsed.path
  query = parsed.query

  if url != "/":
    slashi = url.rfind("/")
    if slashi != -1:
      url = url[slashi:]

  if url[:1] == "/":
    url = url[1:]
  if len(url) == 0:
    url = "/"
  elif url[:1] == "/":
    url = url[1:]

  if len(query) > 0:
    url += "?" + query

  if url == "(index)" or url.startswith(host):
    url = "/"

  if isparent:
    for u in urls:
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

    print >> sys.stderr, url,'\t\t', parent

    if not (url in urls):
      urls.append(url)
      parents.append(parent)

for parent in list(set([parent for parent in parents if not(parent in urls) and parent != "/"])):
  print >> sys.stderr, "orphan =", parent

  urls.append(parent)
  parents.append("/")

print "digraph G {"

print "ratio=compress;"
print "concentrate=true;"

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
  return "\"" + url + "\""

for url, parent in zipped:
  print "{} -> {};".format(uuid(parent), uuid(url))

for iuuid in interesting_uuids:
  print "{}[color=red,fontcolor=red];".format(iuuid)

command = "python process_window_log.py " + log_file
proc = subprocess.Popen([command], stdout=subprocess.PIPE, shell=True)
(out, err) = proc.communicate()
return_code = proc.returncode
#out = out.strip("\n")
print out
print "}"
