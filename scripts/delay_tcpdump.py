import subprocess
import sys
import time
import signal
import os 
import dpkt
import numpy
import netifaces

url = sys.argv[1]
delay = sys.argv[2]
folder = sys.argv[3]

cmd = "delayshell " + delay + " /usr/bin/python selenium_load.py " + url
proc = subprocess.Popen([cmd], shell=True)
time.sleep(3)

# find delayshell's egress interface
delay_egress = ''
ifs = netifaces.interfaces()
for interface in ifs:
    if ( interface[0:5] == 'delay' ):
        delay_egress = interface

tcpdump_cmd = "sudo tcpdump -i " + delay_egress + " -w " + folder + ".pcap &"
proc1 = subprocess.Popen([tcpdump_cmd], shell=True)

proc.wait()
time.sleep(3)
