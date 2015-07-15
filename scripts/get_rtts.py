import os, sys, subprocess, time, numpy

delays = [500, 1000, 2000, 4000]
sites = sys.argv[1]


rtts_500 = {}
rtts_1000 = {}
rtts_2000 = {}
rtts_4000 = {}

with open(sites) as f:
    for line in f:
        url = line.split(" ")[0]
        folder = line.split(" ")[1].strip("\n")
        for delay in delays:
            measurements = []
            for x in range(0,2):
                sel_cmd = "replayshell /home/ravi/dependency_caching/window_rewriting/prettycorpus/" + folder + " /usr/local/bin/delayshell " + str(delay) + " /usr/bin/python selenium_load.py " + url
                proc = subprocess.Popen([sel_cmd], stdout=subprocess.PIPE, shell=True)
                (out, err) = proc.communicate()
                plt = out.strip("\n")
                if ( out !=  " " and out != "" and len(out) < 10):
                    rtts = int(float(plt)/float(delay))
                    measurements.append(rtts)
                    print "site: " + url + " delay: " + str(delay) + " plt: " + str(plt) + " rtts: " + str(rtts)
                    os.system("sudo killall replayshell 2>/dev/null")
                    os.system("sudo killall delayshell 2>/dev/null")
                    os.system("rm -r /tmp/* > /dev/null")
                    time.sleep(3)
                else:
                    print "caught it!"
            if ( delay == 500 ):
                rtts_500[url] = numpy.mean(measurements)
            if ( delay == 1000 ):
                rtts_1000[url] = numpy.mean(measurements)
            if ( delay == 2000 ):
                rtts_2000[url] = numpy.mean(measurements)
            if ( delay == 4000 ):
                rtts_4000[url] = numpy.mean(measurements)

print "\n"
print "measurements for RTT of 1 second:"
for key in rtts_500.keys():
    print "url: " + key + " rtts: " + str(rtts_500[key])
print "\n\n"
print "measurements for RTT of 2 seconds:"
for key in rtts_1000.keys():
    print "url: " + key + " rtts: " + str(rtts_1000[key])
print "\n\n"
print "measurements for RTT of 4 seconds:"
for key in rtts_2000.keys():
    print "url: " + key + " rtts: " + str(rtts_2000[key])
print "\n\n"
print "measurements for RTT of 8 seconds:"
for key in rtts_4000.keys():
    print "url: " + key + " rtts: " + str(rtts_4000[key])

