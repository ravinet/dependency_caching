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
        first_request_time = round(float(output[x].split("(")[1].split(")")[0]), 3)
        break

res_times = []
# key is response time and value is tuple of url and request time
total_info = {}
# find timestamp for nth (client specified) response
nth_response_time = ""
for y in range(0, len(output)):
    if ( "\tResponse Code: " in output[y] ):
        req_time = ""
        url = ""
        for z in range(y, len(output)):
            if ( "\tTime request sent: " in output[z] ):
                req_time = round(float(output[z].split("(")[1].split(")")[0]), 3)
                if ( "GET /" in output[y-1] ):
                    url = output[y-1].split("    ")[1].strip("\n")
                    if ( url[0:3] == "GET" ):
                        url = url[4:]
                    if ( url[-3:] == "1.1" ):
                        url = url[0:-9]
            if ( "\tTime reply ACKed: " in output[z] ):
                if ( "<the epoch>" in output[z] ):
                    nth_response_time = ""
                else:
                    nth_response_time = round(float(output[z].split("(")[1].split(")")[0]), 3)
                    res_times.append(round(float(output[z].split("(")[1].split(")")[0]), 3))
                    if ( req_time != "" ):
                        if ( nth_response_time in total_info ):
                            total_info[nth_response_time].append((url, req_time))
                        else:
                            total_info[nth_response_time] = [(url, req_time)]
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

for res_time in sorted(total_info):
    for i in range(0, len(total_info[res_time])):
        print "URL: " + str(total_info[res_time][i][0]) + " Request_time: " + str(total_info[res_time][i][1]) + " Response_time: " + str(res_time)
