import subprocess
import sys
import time
import signal
import os 

site = sys.argv[1]
FNULL = open(os.devnull, 'w')
output = open('capture', 'w+')

command = "sudo tcpdump -i eth0 -w test.pcap"
tcpdump = subprocess.Popen(command, shell=True, stderr=subprocess.STDOUT, stdout=output)
time.sleep(1)

command = "firefox -private " + site
firefox = subprocess.Popen(command, shell=True, stdout=FNULL, stderr=FNULL)
time.sleep(8)
os.system("sudo pkill -f -2 firefox")
time.sleep(2)
tcpdump.kill()
