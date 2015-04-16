from bs4 import BeautifulSoup, element
import sys

html_doc = sys.argv[1]

soup = BeautifulSoup(open(html_doc), "html5lib")

def func(head, parent_path=[]):
  index = 0
  for child in head.children:
    if isinstance(child, element.Tag):
      child_path = [index] + parent_path
      prop_name = "$$dom." + ".".join([str(num) for num in child_path])
      string_path = ", ".join([str(num) for num in child_path])
      if ( child.name == "img" or child.name == "script" ):
        original_src = child.get('src')
        if ( original_src != None and original_src != ""):
          child['src'] = ""
          new_script = soup.new_tag('script')
          new_script.string = 'var req = new XMLHttpRequest;req.open("get", "' + original_src + '");if(document.currentScript.previousSibling instanceof Text){console.log("Text node between image tag and corresponding inline script!");}req.domref = document.currentScript.previousSibling;req.send();document.currentScript.parentNode.removeChild(document.currentScript);';
          child.insert_after(new_script);
          func(child, child_path)
          index += 2
        else:
          func(child, child_path)
          index += 1
      else:
        func(child, child_path)
        index += 1

func(soup)

print soup.prettify().encode('utf-8')

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
