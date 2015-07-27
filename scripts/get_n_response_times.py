import subprocess
import sys
import time
import signal
import os 
import dpkt
import numpy


sites = sys.argv[1]
results = {}

with open(sites) as f:
    for line in f:
        url = line.split(" ")[0]
        folder = line.split(" ")[1]
        response_count = line.split(" ")[2].strip("\n")
        measurements = []
        results[url] = []
        for x in range(0,1):
            sel_cmd = "replayshell /home/ravi/dependency_caching/window_rewriting/prettycorpus/" + folder + " /usr/bin/python time_until_n_responses.py " + url + " 50 " + folder + " " + response_count
            proc = subprocess.Popen([sel_cmd], stdout=subprocess.PIPE, shell=True)
            (out, err) = proc.communicate()
            time.sleep(3)
            os.system("sudo killall replayshell 2>/dev/null")
            os.system("sudo killall delayshell 2>/dev/null")
            os.system("sudo rm -r /tmp/* > /dev/null")
            time.sleep(3)
            if ( out.strip("\n") != "" ):
                plt = float(out.strip("\n"))
                results[url].append(plt)
for key in results.keys():
    print key + ": " + str(results[key])


print "\naverages:\n"

for key in results.keys():
    if ( len(results[key]) > 0 ):
        print key + ": mean=" + str(numpy.mean(results[key])) + " median=" + str(numpy.median(results[key])) 
