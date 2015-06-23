from bs4 import BeautifulSoup, element
import sys
import json
from urlparse import urlparse
import re

counter = 0

html_doc = sys.argv[1]
html_name = sys.argv[2]

soup = BeautifulSoup(open(html_doc), "html5lib")

# mapping urls to ids
url_map = {}

def rewrite_css(css, site):
  pattern = r"url\([\"']?([./a-gi-z][^/].*?)[\"']?\)"
  replacement = r"url(" + html_doc + r"\1)"
  first = re.sub(pattern, replacement, css, flags=re.IGNORECASE)
  
  pattern = r"url\([\"']?(//.*?)[\"']?\)"
  replacement = r"url(http:" + r"\1)"
  return re.sub(pattern, replacement, first, flags=re.IGNORECASE)


def func(head):
  global counter
  for child in head.children:
    if isinstance(child, element.Tag):
      # remove relative paths from css
      orig_css = child.get('style')
      if ( orig_css != None and orig_css != "" ):
        child['style'] = rewrite_css(orig_css, html_name)
      if ( child.name == "img" or child.name == "script" or child.name == "iframe" or child.name == "link" ):
        if ( child.name == "link" ):
          if ( child['rel'][0] == 'canonical' ):
            original_src = ""
          else:
            original_src = child.get('href')
        else:
          original_src = child.get('src')
        if ( original_src != None and original_src != ""):
          #if ( original_src[0:5] == "https" ): # force http, disallow https
          #  original_src = "http" + original_src[5:]
          if ( child.name == "script" ):
            del child['src']
          else:
            if ( child.name == "link" ):
              child['href'] = ""
            else:
              child['src'] = ""
          if ( child.name == "img" or child.name == "iframe" or child.name == "link" ):
            child['imgid'] = counter
            if ( original_src in url_map ):
              to_use = "**" + original_src
              url_map[to_use] = counter
            else:
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

output = soup.prettify().encode('utf-8')
chunked = output.split("\n")
clean_chunked = []
for line in chunked:
  clean_chunked.append(line.replace("</script>", "<\/script>"))

print json.dumps(clean_chunked)

# go through url_map and organize per origin
origin_mappings= {}
for url in url_map:
  real_url = url
  if ( url[0:2] == "**" ):
    url = url[2:]
  curr_origin = urlparse(url).netloc
  if ( curr_origin == '' ):
    curr_origin = "use_location"
  if ( curr_origin in origin_mappings ):
    origin_mappings[curr_origin].append([url, url_map[real_url]])
  else:
    origin_mappings[curr_origin] = [[url, url_map[real_url]]]


print >> sys.stderr, json.dumps(origin_mappings)
#print >> sys.stderr, json.dumps(url_map)

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
