import subprocess, sys, time, os

site = sys.argv[1]


command = "firefox -private " + site + " > /dev/null 2>&1"
firefox = subprocess.Popen(command, shell=True)
time.sleep(12)
os.system("sudo pkill -f -2 firefox")
time.sleep(3)
