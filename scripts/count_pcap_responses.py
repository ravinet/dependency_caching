import sys, os

pcap = sys.argv[1]

count = 0

os.system("tcptrace -n -xhttp " + pcap + " > curr_pcap_info")
# remove unnecessary output files from tcptrace
os.system("rm *.dat")
os.system("rm *.xpl")

with open("curr_pcap_info") as f:
    for line in f:
        if ( "\tResponse Code:      " in line ):
            count = count + 1

print count
#os.system("rm curr_pcap_info")
#os.system("sudo rm " + pcap)
