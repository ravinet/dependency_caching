import os, sys

orig = sys.argv[1]

start = 1438524209.38
with open(orig) as f:
    for line in f:
        count = line.split(" ")[0]
        time = round(float(line.split(" ")[1].strip("\n")),3)
        new_time = (time - start)*1000
        print count + " " + str(new_time)
