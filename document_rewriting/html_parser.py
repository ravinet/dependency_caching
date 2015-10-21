from HTMLParser import HTMLParser
from bs4 import BeautifulSoup, element
import sys
import json
html_doc = sys.argv[1]
html_name = sys.argv[2]

soup = BeautifulSoup(open(html_doc))
new_script = soup.new_tag('script')
new_script.string = 'var logs_html = _getAttribute.call(document.currentScript, "htmllogs").split("---");for ( j = 0; j < logs_html.length; j++ ) {window.js_rewriting_logs.push(logs_html[j]);}_removeChild.call(document.currentScript.parentNode, document.currentScript);'
soup.body.append(new_script)

log = []

lineNumbers = {}
def getLineNumber(child_path):
  class LineParser(HTMLParser):
    def __init__(self):
      HTMLParser.__init__(self)
      self.depth = -1
      self.index = 0
      self.indices = []

    def handle_starttag(self, tag, attrs):
      self.depth += 1
      if len(self.indices) < self.depth + 1:
        self.indices.append(-1)
      self.indices[self.depth] += 1
      lineNumbers[listToString(self.indices)] = parser.getpos()[0]

    def handle_endtag(self, tag):
      if len(self.indices) == self.depth + 2:
        del self.indices[self.depth+1]
      self.depth -= 1

  def listToString(l):
    return ','.join([str(i) for i in l])

  if listToString(child_path[::-1]) not in lineNumbers:
    parser = LineParser()
    parser.feed(soup.prettify())

  return lineNumbers[listToString(child_path[::-1])]

def func(head, parent_path=[]):
  index = 0
  for child in head.children:
    if isinstance(child, element.Tag):
      if child.name == "script":
        child['htmllogs'] = '---'.join(log)
        del log[:]
      child_path = [index] + parent_path

      #current node
      log.append(logString(child_path, "null", html_name, child.name))

      if child.name == "link":
        log.append(linkLogString("WRITE", html_name, getLineNumber(child_path)))
        css_name = child["href"]
        log.append(linkLogString("READ", css_name, getLineNumber(child_path)))

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
  output = str(json.dumps({"name": name, "OpType": "WRITE", "method": "null", "PropName": prop_name, "NodeProp": node_prop,
    "id": "null", "child_path": child_path, "script": script, "line": getLineNumber(child_path)}))
  return output

def linkLogString(optype, script, linenumber):
  if optype == "READ":
    output = str(json.dumps({"OpType": optype, "method": "cssfile", "PropName": "csschunk", "NodeProp": "null",
      "id": "null", "child_path": "null", "script": script, "line": linenumber}))
    return output
  output = str(json.dumps({"name": "cssclose", "OpType": optype, "method": "null", "PropName": "csschunk", "NodeProp": "null",
    "id": "null", "child_path": "null", "script": script, "line": linenumber}))
  return output

func(soup)

print soup.prettify().encode('utf-8')
