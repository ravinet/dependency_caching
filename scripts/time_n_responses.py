import subprocess
import sys
import time
import signal
import os 
import dpkt

site = sys.argv[1]
response_count = int(sys.argv[2])
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
time.sleep(3)

first_response_time = ""
responses = []
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
                if ( first_response_time == "" ):
                    first_response_time = ts
                #print http.uri
            if tcp.sport == 80: # this is a response
                y = dpkt.http.Response(tcp.data)
                #print y.status
                responses.append(ts)
                if ( len(responses) == response_count ): # we now have enough responses
                    page_load_time = float(responses[len(responses)-1]) - float(first_response_time)
                    # currently prints page load time in seconds
                    print page_load_time
        except:
            pass
except:
    print >> sys.stderr, "error reading pcap"
f.close()
os.system("sudo rm test.pcap")
