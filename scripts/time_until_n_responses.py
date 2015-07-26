import sys, os, netifaces, subprocess, time


url = sys.argv[1]
delay = sys.argv[2]
folder = sys.argv[3]
response_count = int(sys.argv[4])

cmd = "delayshell " + delay + " /usr/bin/python run_firefox.py " + url
proc = subprocess.Popen([cmd], shell=True)
time.sleep(3)

# find delayshell's egress interface
delay_egress = ''
ifs = netifaces.interfaces()
for interface in ifs:
    if ( interface[0:5] == 'delay' ):
        delay_egress = interface
tcpdump_cmd = "sudo tcpdump -i " + delay_egress + " -w " + folder + ".pcap &"
proc1 = subprocess.Popen([tcpdump_cmd], shell=True)

proc.wait()
time.sleep(5)

count = 0
pcap = folder + ".pcap"
os.system("tcptrace -n -xhttp " + pcap + " > curr_pcap_info")
# remove unnecessary output files from tcptrace
os.system("rm *.dat")
os.system("rm *.xpl")

output = []
with open("curr_pcap_info") as f:
    for line in f:
        output.append(line.strip("\n"))

# get time of first request
first_request_time = ""
for x in range(0, len(output)):
    if ( "Time request sent:  " in output[x] ):
        first_request_time = float(output[x].split("(")[1].split(")")[0])
        break


# find timestamp for nth (client specified) response
nth_response_time = ""
for y in range(0, len(output)):
    if ( "\tResponse Code: " in output[y] ):
        count = count + 1
        if ( count == response_count ):
            for z in range(y, len(output)):
                if ( "\tTime reply ACKed: " in output[z] ):
                    if ( "<the epoch>" in output[z] ):
                        nth_response_time = ""
                    else:
                        nth_response_time = float(output[z].split("(")[1].split(")")[0])
                    break

# print page load time in milliseconds
if ( nth_response_time == "" ):
    print ""
else:
    plt = (nth_response_time - first_request_time)*1000
    print plt
#
#        if ( "\tResponse Code:      " in line ):
#            count = count + 1
#
#print count
#os.system("rm curr_pcap_info")
#os.system("sudo rm " + pcap)
