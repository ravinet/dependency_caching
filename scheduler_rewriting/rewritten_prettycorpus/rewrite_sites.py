import os, sys, subprocess, time, numpy

sites = sys.argv[1]

with open(sites) as f:
    for line in f:
        folder = line.split(" ")[0]
        first_chunk = line.split(" ")[1].strip("\n")
        os.system("python modify_site.py /home/ravi/dependency_caching/window_rewriting/prettycorpus/" + folder + " /home/ravi/dependency_caching/corpus_dots/" + folder + " " + folder)
