import os, sys

orig = sys.argv[1]

start = ""
with open(orig) as f:
    for line in f:
        count = line.split(" ")[0]
        time = round(float(line.split(" ")[1].strip("\n")),3)
        if ( start == "" ):
            start = time
            print count + " " + str(0)
        else:
            new_time = (time - start)*1000
            print count + " " + str(new_time)
