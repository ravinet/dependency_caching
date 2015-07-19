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
        folder = line.split(" ")[1].strip("\n")
        measurements = []
        results[url] = []
        for x in range(0,2):
            command = "sudo tcpdump -i ingress -w test.pcap"
            tcpdump = subprocess.Popen(command, shell=True, stderr=subprocess.STDOUT)
            time.sleep(1)
            sel_cmd = "replayshell /home/ravi/dependency_caching/window_rewriting/prettycorpus/" + folder + " /usr/local/bin/delayshell 50 /usr/bin/python selenium_load.py " + url
            proc = subprocess.Popen([sel_cmd], stdout=subprocess.PIPE, shell=True)
            (out, err) = proc.communicate()
            time.sleep(2)
            tcpdump.kill()
            time.sleep(3)
            os.system("sudo killall replayshell 2>/dev/null")
            os.system("sudo killall delayshell 2>/dev/null")
            os.system("rm -r /tmp/* > /dev/null")
            time.sleep(3)
            plt = out.strip("\n")
            if ( out !=  " " and out != "" and len(out) < 10):
                try:
                    f = open('test.pcap')
                    pcap = dpkt.pcap.Reader(f)
                    for ts, buf in pcap:
                        try:
                            eth = dpkt.ethernet.Ethernet(buf)
                            if eth.type!=2048: # check if ip packet
                                continue
                            ip=eth.data
                            if ip.p!=6: # check if tcp 
                                continue 
                            tcp=ip.data
                            if tcp.dport == 80 and len(tcp.data) > 0: # check if http request 
                                http = dpkt.http.Request(tcp.data)
                            if tcp.sport == 80: # this is a response
                                y = dpkt.http.Response(tcp.data)
                                responses.append(ts)
                        except:
                            pass
                    results[url].append(len(responses))
                except:
                    print >> sys.stderr, "error reading pcap"
                f.close()
                os.system("sudo rm test.pcap")
            else:
                print "caught it!"

for key in results.keys():
    print key + ": " + numpy.mean(results[key])
