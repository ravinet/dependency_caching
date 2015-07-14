from bs4 import BeautifulSoup
import subprocess
import sys
import os
# pip install beautifulsoup4 and html5lib

html_file = sys.argv[1]
new_html_file = sys.argv[2]

soup = BeautifulSoup(open(html_file), "html5lib")
file1=open(new_html_file,"w")
#soup1 = BeautifulSoup(str(soup), "html.parser")
file1.write(soup.prettify().encode('utf-8'))
#file1.write(str(soup))
file1.close()
