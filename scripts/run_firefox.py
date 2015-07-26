import subprocess, sys, time, os
from pyvirtualdisplay import Display

site = sys.argv[1]

display = Display(visible=0, size=(800,600))
display.start()

time.sleep(12)
command = "firefox -private " + site + " > /dev/null 2>&1"
firefox = subprocess.Popen(command, shell=True)
time.sleep(12)
os.system("sudo pkill -f -2 firefox")
time.sleep(6)
display.stop()
