import subprocess
import sys
import time
import signal
import os 
import dpkt
import numpy
import netifaces


cmd = "delayshell 10 /usr/bin/python selenium_load.py http://www.mit.edu"
proc = subprocess.Popen([cmd], shell=True)
time.sleep(3)

# find delayshell's egress interface
delay_egress = ''
ifs = netifaces.interfaces()
print ifs
for interface in ifs:
    if ( interface[0:5] == 'delay' ):
        delay_egress = interface

print delay_egress
tcpdump_cmd = "sudo tcpdump -i " + delay_egress + " -w test.pcap &"
proc1 = subprocess.Popen([tcpdump_cmd], shell=True)

proc.wait()
time.sleep(3)

response_count = 5
first_response_time = ""
responses = []
try:
    f = open('test.pcap')
    print "opened test pcap file"
    pcap = dpkt.pcap.Reader(f)
    for ts, buf in pcap:
        try:
            eth = dpkt.ethernet.Ethernet(buf)
            if eth.type!=2048: # check if ip packet
                continue
            print "passed ethernet"
            ip=eth.data
            if ip.p!=6: # check if tcp
                continue
            tcp=ip.data
            if tcp.dport == 80 and len(tcp.data) > 0: # check if http request
                http = dpkt.http.Request(tcp.data)
                if ( first_response_time == "" ):
                    first_response_time = ts
                #print http.uri
            if tcp.sport == 80: # this is a response
                y = dpkt.http.Response(tcp.data)
                #print y.status
                responses.append(ts)
                print "added response"
                if ( len(responses) == response_count ): # we now have enough responses
                    page_load_time = float(responses[len(responses)-1]) - float(first_response_time)
                    page_load_time = page_load_time * 1000
                    # currently prints page load time in seconds
                    print page_load_time
        except:
            pass
except:
    print >> sys.stderr, "error reading pcap"
f.close()
print "finished processing"
#os.system("sudo rm test.pcap")
