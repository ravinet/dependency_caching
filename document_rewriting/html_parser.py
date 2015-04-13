from HTMLParser import HTMLParser
from bs4 import BeautifulSoup, element
import sys

html_doc = sys.argv[1]
soup = BeautifulSoup(open(html_doc))
log = []

def getLineNumber(child_path):
  lineNumber = [] 

  class LineParser(HTMLParser):
    def __init__(self):
      HTMLParser.__init__(self)
      self.depth = -1
      self.index = 0
      self.indices = {}

    def handle_starttag(self, tag, attrs):
      self.depth += 1
      self.indices.setdefault(self.depth, -1)
      self.indices[self.depth] += 1
      matches(self.indices)

    def handle_endtag(self, tag):
      self.depth -= 1

  def matches(indices):
    #just to make it easier to think about, reverse the childpath
    for i, x in enumerate(child_path[::-1]):
      if i not in indices or indices[i] != x:
        return False
    lineNumber.append(parser.getpos()[0])
    return True

  parser = LineParser()
  parser.feed(open(html_doc).read())

  return lineNumber[0]

def func(head, parent_path=[]):
  index = 0
  for child in head.children:
    if isinstance(child, element.Tag):
      if child.name == "script":
        child['log'] = '\n'.join(log) 
        del log[:]
      child_path = [index] + parent_path

      #current node
      log.append(logString(child_path, "null", html_doc))

      #parent node
      if len(child_path) > 1:
        log.append(logString(child_path[1:], "childNodes", html_doc))
        log.append(logString(child_path[1:], "lastChild", html_doc))
        if child_path[0] == 0:
          log.append(logString(child_path[1:], "firstChild", html_doc))

      #previousSibling
      if child_path[0] > 0:
          previous_sibling = child_path[:]
          previous_sibling[0] -= 1
          log.append(logString(previous_sibling, "nextSibling", html_doc))

      func(child, child_path)
      index += 1

def logString(child_path, node_prop, script):
  prop_name = "$$dom." + ".".join([str(num) for num in child_path])
  string_path = ", ".join([str(num) for num in child_path])
  return str({'OpType': 'WRITE', 'method': "null", 'PropName': prop_name, 'NodeProp': node_prop, 
    'id': "null", 'child_path': child_path, 'script': script, 'line': getLineNumber(child_path)})

func(soup)

print soup.prettify().encode('utf-8')







