import os
import sys
import time
folders = sys.argv[1]

with open(folders) as f:
    for line in f:
        folder = line.strip("\n")
        os.system("python pretty_print_site.py " + folder + " " + folder + "1")
        time.sleep(10)
        os.system("rm -r " + folder)
        os.system("mv " + folder + "1 " + folder)
