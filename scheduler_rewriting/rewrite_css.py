import sys
import re
from urlparse import urljoin

css_file = sys.argv[1]
site = sys.argv[2]

def site_repl(matchobj):
  return "url(" + urljoin(site, matchobj.group(1)) + ")"

css = ""
with open(css_file) as f:
  for line in f:
    css = css + line

pattern = r"url\([\"']?(.*?)[\"']?\)"
print re.sub(pattern, site_repl, css, flags=re.IGNORECASE)
