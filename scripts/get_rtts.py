import os, sys, subprocess, time, numpy

delays = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500]
sites = sys.argv[1]


rtts_100 = {}
rtts_200 = {}
rtts_300 = {}
rtts_400 = {}
rtts_500 = {}
rtts_600 = {}
rtts_700 = {}
rtts_800 = {}
rtts_900 = {}
rtts_1000 = {}
rtts_1100 = {}
rtts_1200 = {}
rtts_1300 = {}
rtts_1400 = {}
rtts_1500 = {}

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
                    measurements.append(rtts/2)
                    print "site: " + url + " delay: " + str(delay) + " plt: " + str(plt) + " rtts: " + str(rtts/2)
                    os.system("sudo killall replayshell 2>/dev/null")
                    os.system("sudo killall delayshell 2>/dev/null")
                    os.system("rm -r /tmp/* > /dev/null")
                    time.sleep(3)
                else:
                    print "caught it!"
            if ( delay == 100 ):
                rtts_100[url] = (numpy.mean(measurements), numpy.median(measurements))
            if ( delay == 200 ):
                rtts_200[url] = (numpy.mean(measurements), numpy.median(measurements))
            if ( delay == 300 ):
                rtts_300[url] = (numpy.mean(measurements), numpy.median(measurements))
            if ( delay == 400 ):
                rtts_400[url] = (numpy.mean(measurements), numpy.median(measurements))
            if ( delay == 500 ):
                rtts_500[url] = (numpy.mean(measurements), numpy.median(measurements))
            if ( delay == 600 ):
                rtts_600[url] = (numpy.mean(measurements), numpy.median(measurements))
            if ( delay == 700 ):
                rtts_700[url] = (numpy.mean(measurements), numpy.median(measurements))
            if ( delay == 800 ):
                rtts_800[url] = (numpy.mean(measurements), numpy.median(measurements))
            if ( delay == 900 ):
                rtts_900[url] = (numpy.mean(measurements), numpy.median(measurements))
            if ( delay == 1000 ):
                rtts_1000[url] = (numpy.mean(measurements), numpy.median(measurements))
            if ( delay == 1100 ):
                rtts_1100[url] = (numpy.mean(measurements), numpy.median(measurements))
            if ( delay == 1200 ):
                rtts_1200[url] = (numpy.mean(measurements), numpy.median(measurements))
            if ( delay == 1300 ):
                rtts_1300[url] = (numpy.mean(measurements), numpy.median(measurements))
            if ( delay == 1400 ):
                rtts_1400[url] = (numpy.mean(measurements), numpy.median(measurements))
            if ( delay == 1500 ):
                rtts_1500[url] = (numpy.mean(measurements), numpy.median(measurements))


print "\n"
print "Measurements for RTT of 200 ms:"
for key in rtts_100.keys():
    print "url: " + key + " mean_rtts: " + str(rtts_100[key][0]) + " median_rtts: " + str(rtts_100[key][1])
print "\n\n"
print "measurements for RTT of 400 ms:"
for key in rtts_200.keys():
    print "url: " + key + " rtts: " + str(rtts_200[key][0]) + " median_rtts: " + str(rtts_200[key][1])
print "\n\n"
print "measurements for RTT of 600 ms:"
for key in rtts_300.keys():
    print "url: " + key + " rtts: " + str(rtts_300[key][0]) + " median_rtts: " + str(rtts_300[key][1])
print "\n\n"
print "measurements for RTT of 800 ms:"
for key in rtts_400.keys():
    print "url: " + key + " rtts: " + str(rtts_400[key][0]) + " median_rtts: " + str(rtts_400[key][1])
print "\n\n"
print "measurements for RTT of 1000 ms:"
for key in rtts_500.keys():
    print "url: " + key + " rtts: " + str(rtts_500[key][0]) + " median_rtts: " + str(rtts_500[key][1])
print "\n\n"
print "measurements for RTT of 1200 ms:"
for key in rtts_600.keys():
    print "url: " + key + " rtts: " + str(rtts_600[key][0]) + " median_rtts: " + str(rtts_600[key][1])
print "\n\n"
print "measurements for RTT of 1400 ms:"
for key in rtts_700.keys():
    print "url: " + key + " rtts: " + str(rtts_700[key][0]) + " median_rtts: " + str(rtts_700[key][1])
print "\n\n"
print "measurements for RTT of 1600 ms:"
for key in rtts_800.keys():
    print "url: " + key + " rtts: " + str(rtts_800[key][0]) + " median_rtts: " + str(rtts_800[key][1])
print "\n\n"
print "measurements for RTT of 1800 ms:"
for key in rtts_900.keys():
    print "url: " + key + " rtts: " + str(rtts_900[key][0]) + " median_rtts: " + str(rtts_900[key][1])
print "\n\n"
print "measurements for RTT of 2000 ms:"
for key in rtts_1000.keys():
    print "url: " + key + " rtts: " + str(rtts_1000[key][0]) + " median_rtts: " + str(rtts_1000[key][1])
print "\n\n"
print "measurements for RTT of 2200 ms:"
for key in rtts_1100.keys():
    print "url: " + key + " rtts: " + str(rtts_1100[key][0]) + " median_rtts: " + str(rtts_1100[key][1])
print "\n\n"
print "measurements for RTT of 2400 ms:"
for key in rtts_1200.keys():
    print "url: " + key + " rtts: " + str(rtts_1200[key][0]) + " median_rtts: " + str(rtts_1200[key][1])
print "\n\n"
print "measurements for RTT of 2600 ms:"
for key in rtts_1300.keys():
    print "url: " + key + " rtts: " + str(rtts_1300[key][0]) + " median_rtts: " + str(rtts_1300[key][1])
print "\n\n"
print "measurements for RTT of 2800 ms:"
for key in rtts_1400.keys():
    print "url: " + key + " rtts: " + str(rtts_1400[key][0]) + " median_rtts: " + str(rtts_1400[key][1])
print "\n\n"
print "measurements for RTT of 3000 ms:"
for key in rtts_1500.keys():
    print "url: " + key + " rtts: " + str(rtts_1500[key][0]) + " median_rtts: " + str(rtts_1500[key][1])
