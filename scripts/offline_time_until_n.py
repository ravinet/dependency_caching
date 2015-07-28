import sys, os, netifaces, subprocess, time

pcap = sys.argv[1]
response_count = int(sys.argv[2])

count = 0
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

res_times = []
# find timestamp for nth (client specified) response
nth_response_time = ""
for y in range(0, len(output)):
    if ( "\tResponse Code: " in output[y] ):
        for z in range(y, len(output)):
            if ( "\tTime reply ACKed: " in output[z] ):
                if ( "<the epoch>" in output[z] ):
                    nth_response_time = ""
                else:
                    nth_response_time = float(output[z].split("(")[1].split(")")[0])
                    res_times.append(float(output[z].split("(")[1].split(")")[0]))
                break


# sort the response times
res_times.sort()

# print page load time in milliseconds
if ( len(res_times) < response_count ):
    print ""
else:
    nth_response_time = res_times[response_count-1]
    #print "first: " + str(first_request_time)
    #print "nth: " + str(nth_response_time)
    plt = (nth_response_time - first_request_time)*1000
    print plt
