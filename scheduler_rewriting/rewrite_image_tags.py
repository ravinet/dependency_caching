from bs4 import BeautifulSoup, element
import sys

html_doc = sys.argv[1]

soup = BeautifulSoup(open(html_doc), "html5lib")

# mapping urls to ids
url_map = {}

def func(head):
  counter = 0
  for child in head.children:
    if isinstance(child, element.Tag):
      if ( child.name == "img" or child.name == "script" ):
        original_src = child.get('src')
        if ( original_src != None and original_src != ""):
          child['src'] = ""
          if ( child.name == "img" ):
            child['imgid'] = counter
            url_map[original_src] = counter
            counter = counter + 1
          else:
            url_map[original_src] = "null"
          func(child)
        else:
          func(child)
      else:
        func(child)

func(soup)

print soup.prettify().encode('utf-8')

print >> sys.stderr, url_map
''' problems
1. we are adding a script to the DOM after each image tag---we probably want to remove this script tag in the xhr wrapper
meaning we probably have to pass the script id or path to the xhr wrapper so we can delete it
This is still wrong because something in the interim can call childNodes and that value would then be incorrect
Maybe the right thing to do is have the script tag remove itself from the dom after making the xhr request?
(This is what is currently done)

2. make sure child paths are correct when we add the scripts (know we are removing them so the paths must reflect the path after removing them)

3. maybe rather than child paths which would require the xhr request to traverse the DOM inline, we should just pass a ref of the image tag
as a property of the xhr request (doing this now...commented out the child path stuff)
'''