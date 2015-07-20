import subprocess
import sys
import time
import signal
import os 
import dpkt

#response_count = int(sys.argv[1])

first_response_time = ""
responses = []
f = open('ebay.pcap')
pcap = dpkt.pcap.Reader(f)
buff = ""
for ts, buf in pcap:
    #eth = dpkt.ethernet.Ethernet(buf)
    #if ((eth.type!=2048) & (type(eth.data)!=dpkt.ethernet.ETH_TYPE_IP)): # check if ip packet
    #    x = 1
    #    #continue
    ip=dpkt.ip.IP(buf)
    if ip.p!=6: # check if tcp
        continue
    tcp=ip.data
    if tcp.dport == 80 and len(tcp.data) > 0: # check if http request
        http = dpkt.http.Request(tcp.data)
        if ( first_response_time == "" ):
            first_response_time = ts
        #print http.uri
    if tcp.sport == 80: # this is a response
        try:
            y = dpkt.http.Response(tcp.data + buff)
            #print y.status
            responses.append(ts)
            #print "LENGTH: " + str(len(responses))
            #if ( len(responses) == response_count ): # we now have enough responses
            #    page_load_time = float(responses[len(responses)-1]) - float(first_response_time)
            #    page_load_time = page_load_time * 1000
            #    # currently prints page load time in seconds
            #    print page_load_time
            buff = ""
        except:
            #print "Unexpected error:", sys.exc_info()[0]
            buff = buff + tcp.data
            pass
print len(responses)
f.close()
