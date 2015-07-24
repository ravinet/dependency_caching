import sys, os

site = sys.argv[1]
folder = sys.argv[2]
response_count = int(sys.argv[3])

# start tcpdump on an ingress interface (should be run within delayshell or linkshell) and then run firefox for a long time!

# find delayshell's egress interface
delay_egress = ''
ifs = netifaces.interfaces()
for interface in ifs:
    if ( interface[0:5] == 'delay' ):
        delay_egress = interface

tcpdump_cmd = "sudo tcpdump -i " + delay_egress + " -w " + folder + ".pcap &"
proc1 = subprocess.Popen([tcpdump_cmd], shell=True)
time.sleep(2)
command = "firefox -private " + site
firefox = subprocess.Popen(command, shell=True, stdout=FNULL, stderr=FNULL)
time.sleep(12)
os.system("sudo pkill -f -2 firefox")
time.sleep(3)
#tcpdump.kill()
#time.sleep(3)

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
                    nth_response_time = float(output[z].split("(")[1].split(")")[0])
                    break

# print page load time in milliseconds
plt = (nth_response_time - first_request_time)*1000
print plt
#
#        if ( "\tResponse Code:      " in line ):
#            count = count + 1
#
#print count
#os.system("rm curr_pcap_info")
#os.system("sudo rm " + pcap)
