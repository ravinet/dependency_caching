import sys
import re

css_file = sys.argv[1]
site = sys.argv[2]

css = ""

with open(css_file) as f:
    for line in f:
        css = css + line

pattern = r"url\([\"']?([./a-gi-z][^/].*?)[\"']?\)"
replacement = r"url(" + site + r"\1)"
print re.sub(pattern, replacement, css, flags=re.IGNORECASE)
