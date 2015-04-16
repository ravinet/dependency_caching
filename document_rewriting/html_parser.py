from HTMLParser import HTMLParser
from bs4 import BeautifulSoup, element
import sys
import json
html_doc = sys.argv[1]
html_name = sys.argv[2]

soup = BeautifulSoup(open(html_doc))
new_script = soup.new_tag('script')
new_script.string = 'var logs_html = document.currentScript.getAttribute("htmllogs").split("\\n");for ( j = 0; j < logs_html.length; j++ ) {window.js_rewriting_logs.push(logs_html[j]);}document.currentScript.parentNode.removeChild(document.currentScript);'
soup.body.append(new_script)

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
      if self.depth+1 in self.indices:
        del self.indices[self.depth+1]
      self.depth -= 1

    def handle_startendtag(self, tag, attrs):
      self.handle_starttag(tag,attrs)
      self.handle_endtag(tag)

  def matches(indices):
    #just to make it easier to think about, reverse the childpath
    for i, x in enumerate(child_path[::-1]):
      if i not in indices or indices[i] != x:
        return False
    lineNumber.append(parser.getpos()[0])
    return True

  parser = LineParser()
  parser.feed(soup.prettify())#open(html_doc).read())

  return lineNumber[0]

def func(head, parent_path=[]):
  index = 0
  for child in head.children:
    if isinstance(child, element.Tag):
      if child.name == "script":
        child['htmllogs'] = '\n'.join(log)
        del log[:]
      child_path = [index] + parent_path

      #current node
      log.append(logString(child_path, "null", html_name, child.name))

      #parent node
      if len(child_path) > 1:
        log.append(logString(child_path[1:], "childNodes", html_name, child.name))
        log.append(logString(child_path[1:], "lastChild", html_name, child.name))
        if child_path[0] == 0:
          log.append(logString(child_path[1:], "firstChild", html_name, child.name))

      #previousSibling
      if child_path[0] > 0:
          previous_sibling = child_path[:]
          previous_sibling[0] -= 1
          log.append(logString(previous_sibling, "nextSibling", html_name, child.name))

      func(child, child_path)
      index += 1

def logString(child_path, node_prop, script, name):
  prop_name = "$$dom." + ".".join([str(num) for num in child_path])
  string_path = ", ".join([str(num) for num in child_path])
  output = str(json.dumps({"name": name, "OpType": "WRITE", "method": "null", "PropName": prop_name, "NodeProp": node_prop,
    "id": "null", "child_path": child_path, "script": script, "line": getLineNumber(child_path)}))
  return output

func(soup)

print soup.prettify().encode('utf-8')
