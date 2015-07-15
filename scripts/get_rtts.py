import os, sys, subprocess

delays = [500, 1000, 2000]

sites = sys.argv[1]

with open(sites) as f:
    for line in f:
        url = line.split(" ")[0]
        folder = line.split(" ")[1].strip("\n")
        for delay in delays:
            sel_cmd = "replayshell /home/ravi/dependency_caching/window_rewriting/prettycorpus/" + folder + " /usr/local/bin/delayshell " + str(delay) + " /usr/bin/python selenium_load.py " + url
            proc = subprocess.Popen([command_proxy], stdout=subprocess.PIPE, shell=True)
            (out, err) = proc.communicate()
            plt = out.strip("\n")
            rtts = int(float(plt)/float(delay))
            print "site: " + url + " delay: " + str(delay) + " plt: " + str(plt) + " rtts: " + str(rtts)
            os.system("sudo killall replayshell")
            os.system("sudo killall delayshell")

