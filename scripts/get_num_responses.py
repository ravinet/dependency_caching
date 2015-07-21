import subprocess
import sys
import time
import signal
import os 
import dpkt
import numpy

sites = sys.argv[1]
results = {}
delay = 50

with open(sites) as f:
    for line in f:
        url = line.split(" ")[0]
        folder = line.split(" ")[1].strip("\n")
        measurements = []
        results[url] = []
        for x in range(0,4):
            sel_cmd = "replayshell /home/ravi/dependency_caching/window_rewriting/prettycorpus/" + folder + " /usr/bin/python delay_tcpdump.py " + url + " 50 " + folder
            proc = subprocess.Popen([sel_cmd], stdout=subprocess.PIPE, shell=True)
            (out, err) = proc.communicate()
            time.sleep(3)
            os.system("sudo killall replayshell 2>/dev/null")
            os.system("sudo killall delayshell 2>/dev/null")
            os.system("sudo rm -r /tmp/* > /dev/null")
            time.sleep(3)
            count_cmd = "python count_pcap_responses.py " + folder + ".pcap"
            proc = subprocess.Popen([count_cmd], stdout=subprocess.PIPE, shell=True)
            (out, err) = proc.communicate()
            out_list = out.strip("\n")
            if ( int(out_list) != 0 ):
                results[url].append(int(out_list))
for key in results.keys():
    print key + ": " + str(results[key])


print "\n\naverages:\n"

for key in results.keys():
    print key + ": mean=" + str(numpy.mean(results[key])) + " median=" + str(numpy.median(results[key])) 
