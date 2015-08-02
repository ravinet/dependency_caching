import os, sys

orig = sys.argv[1]

# array of tuples---(url, req_time, res_time)
obj_info = []

with open(orig) as f:
    for line in f:
        url = line.split("URL: ")[1].split(" Request_time")[0]
        req_time = round(float(line.split(" Request_time: ")[1].split(" Response_time:")[0]), 3)
        res_time = round(float(line.split(" Response_time: ")[1].strip("\n")), 3)
        obj_info.append((url, req_time, res_time))


# process list of objects (which are sorted by request time)
# for each, go up the list to see if a previous one that was requested is still in flight
# do this by checking if current request time is less than a previous response time

# first request is 0 in flight
print str(obj_info[0][0]) + " " + str(obj_info[0][1]) + " 0"
for i in range(1, len(obj_info)):
    inflight = 0
    for y in range(i-1,0,-1):
        if ( obj_info[y][2] > obj_info[i][1] ):
            # this prev request is still in flight
            inflight = inflight + 1
    print str(obj_info[i][0]) + " " + str(obj_info[i][1]) + " " + str(inflight)
