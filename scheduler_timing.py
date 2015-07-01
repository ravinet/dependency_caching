import subprocess
import sys
import time
import signal
import os 

site = sys.argv[1]
FNULL = open(os.devnull, 'w')
output = open('capture', 'w+')

command = "sudo tcpdump tcp port http -l -i eth0"
tcpdump = subprocess.Popen(command, shell=True, stderr=subprocess.STDOUT, stdout=output)
time.sleep(1)

command = "firefox --private " + site
firefox = subprocess.Popen(command, shell=True, stdout=FNULL, stderr=FNULL)
time.sleep(3)
os.system("sudo pkill -2 firefox")
time.sleep(2)
tcpdump.kill()

print output.readlines()

