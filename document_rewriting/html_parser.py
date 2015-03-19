from bs4 import BeautifulSoup, element
import sys

html_doc = sys.argv[1]

soup = BeautifulSoup(open(html_doc))
print soup.prettify()


def func(head, parent_path=[]):
  index = 0
  for child in head.children:
    if isinstance(child, element.Tag):
      child_path = [index] + parent_path
      prop_name = "$$dom." + ".".join([str(num) for num in child_path])
      string_path = ", ".join([str(num) for num in child_path])
      print {'OpType': 'WRITE', 'method': "null", 'PropName': prop_name, 'NodeProp': "null", 'id': "null", 'child_path': string_path, 'script': html_doc, "line": 0}
      func(child, child_path)
      index += 1

func(soup)
