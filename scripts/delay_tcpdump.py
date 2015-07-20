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
response_count = int(sys.argv[3])

cmd = "delayshell " + delay + " /usr/bin/python selenium_load.py " + url
proc = subprocess.Popen([cmd], shell=True)
time.sleep(3)

# find delayshell's egress interface
delay_egress = ''
ifs = netifaces.interfaces()
for interface in ifs:
    if ( interface[0:5] == 'delay' ):
        delay_egress = interface

tcpdump_cmd = "sudo tcpdump -i " + delay_egress + " -w test.pcap &"
proc1 = subprocess.Popen([tcpdump_cmd], shell=True)

proc.wait()
time.sleep(3)

first_response_time = ""
responses = []
try:
    f = open('test.pcap')
    pcap = dpkt.pcap.Reader(f)
    for ts, buf in pcap:
        try:
            ip=dpkt.ip.IP(buf)
            if ip.p!=6: # check if tcp
                continue
            tcp=ip.data
            if tcp.dport == 80 and len(tcp.data) > 0: # check if http request
                http = dpkt.http.Request(tcp.data)
                if ( first_response_time == "" ):
                    first_response_time = ts
            if tcp.sport == 80: # this is a response
                y = dpkt.http.Response(tcp.data)
                responses.append(ts)
                if ( response_count != 0 ):
                    if ( len(responses) == response_count ): # we now have enough responses
                        page_load_time = float(responses[len(responses)-1]) - float(first_response_time)
                        page_load_time = page_load_time * 1000
                        # currently prints page load time in seconds
                        print "plt: " + str(page_load_time)
        except:
            pass
except:
    print >> sys.stderr, "error reading pcap"
if ( response_count == 0 ):
    print "responses: " + str(len(responses))
f.close()
#os.system("sudo rm test.pcap")
