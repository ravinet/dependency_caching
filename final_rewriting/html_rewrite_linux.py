from bs4 import BeautifulSoup
import subprocess
import sys
import os

html_file = sys.argv[1]
new_html_file = sys.argv[2]

temp_file_name = "temp.js"
temp_file_rewrite = "temp_rewrite.js"

soup = BeautifulSoup(open(html_file))

for script in soup.find_all('script'):
	soup_string = str(script.string)
	if ( soup_string != str(None) ): # only rewrite if script has content (not external ref)
		temp_file = open(temp_file_name, "w+")
		temp_file.write(soup_string)
		temp_file.close()

		temp_file2 = open(temp_file_rewrite, "w+")

		proc = subprocess.call(['nodejs rewrite.js %s %s' % (temp_file_name, temp_file_rewrite)],stdout = subprocess.PIPE, shell=True)
		script.string = temp_file2.read()
		
		os.remove(temp_file.name)
		os.remove(temp_file2.name)

file1=open(new_html_file,"w")
file1.write(str(soup))
file1.close()