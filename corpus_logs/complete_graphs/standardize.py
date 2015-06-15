import os
import sys

# newdot should include original and new deps!
newdot = sys.argv[1]

def longest_substring(s1, s2):
    m = [[0] * (1 + len(s2)) for i in range(1 + len(s1))]
    longest, x_longest = 0, 0
    for x in range(1, 1 + len(s1)):
        for y in range(1, 1 + len(s2)):
            if s1[x - 1] == s2[y - 1]:
                m[x][y] = m[x - 1][y - 1] + 1
                if m[x][y] > longest:
                    longest = m[x][y]
                    x_longest = x
            else:
                m[x][y] = 0
    return longest

# finds best matching url...returns [true/false, url]---first arg is false if no matching resource name!
def best_match(url, original):
    best = ("", -1) # (url, match_length)
    for orig in original:
        if ( orig == url ):
            # exact match so return
            return [1, orig]
        resource_orig = orig
        resource_new = url
        query_orig = ""
        query_new = ""
        if ( "?" in orig ):
            query_orig = orig.split("?")[1]
            resource_orig = orig.split("?")[0]
        if ( "?" in url ):
            query_new = url.split("?")[1]
            resource_new = url.split("?")[0]
        if ( resource_orig == resource_new ):
            # resource name matches
            query_match = longest_substring(query_orig, query_new)
            if ( query_match > best[1] ):
                best = (orig, query_match)
    if ( best == ("", -1) ):
        # no match!
        return [0, ""]
    else:
        return [1, best[0]]

# get list of all original nodes
original_nodes = []
children_to_handle = []
original_complete = []
with open(newdot) as file1:
    for line in file1:
        line = line.strip("\n")
        if ( line != "strict digraph G {" and line != "ratio=compress;" and line != "concentrate=true;" and line != "}" ):
            if ( "color=red" not in line ): # original dep
                original_complete.append(line)
                child = line.split(" ->")[0]
                parent = line.split("-> ")[1].strip(";")
                # strip quotes
                child = child[1:len(child)-1]
                parent = parent[1:len(parent)-1]
                if ( child not in original_nodes ):
                    original_nodes.append(child)
                if ( parent not in original_nodes ):
                    original_nodes.append(parent)
            else: # new dep
                children_to_handle.append(line)
# fix new deps
fixed_new_deps = []
for dep in children_to_handle:
    child = dep.split(" ->")[0]
    parent = dep.split("-> ")[1].strip("[color=red];")
    child = child[1:len(child)-1]
    parent = parent[1:len(parent)-1]
    new_child = child
    new_parent = parent
    child_ret = best_match(child, original_nodes)
    if ( child_ret[0] ):
        # we have a best match
        new_child = child_ret[1]
    parent_ret = best_match(parent, original_nodes)
    if ( parent_ret[0] ):
        # we have a best match
        new_parent = parent_ret[1]
    fixed_new_deps.append("\""  + new_child + "\" -> \"" + new_parent + "\"[color=red];")

print "strict digraph G {\nratio=compress;"
for dep in original_complete:
    print dep
for newdep in fixed_new_deps:
    print newdep
print "}"
