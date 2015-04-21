import os
import sys

dot = sys.argv[1]

new = []
# key is string and val is num
nums = {}
counter = 0

with open(dot) as f:
    for line in f:
        red = 0
        curr = line.strip("\n")
        if ( "digraph G {" not in curr and curr != "ratio=compress;" and curr != "concentrate=true;" and curr != "}"):
            parent = curr.split(" ")[0]
            if ( "[color=red]" in curr ):
                red = 1
            child = curr.split("> ")[1].strip(";").strip("[color=red]")
            parent_num = 0
            child_num = 0
            if ( parent in nums ):
                parent_num = nums[parent]
            else:
                parent_num = counter
                nums[parent] = counter
                counter = counter + 1

            if ( child in nums ):
                child_num = nums[child]
            else:
                child_num = counter
                nums[child] = counter
                counter = counter + 1

            if ( not red ):
                new.append("\"" + str(parent_num) + "\" -> \"" + str(child_num) + "\";")
            else:
                new.append("\"" + str(parent_num) + "\" -> \"" + str(child_num) + "\"[color=red];")

print "strict digraph G {\nratio=compress;\nconcentrate=true;"
for x in new:
    print x
print "}"
