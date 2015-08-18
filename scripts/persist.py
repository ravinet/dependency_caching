#import httplib
#conn = httplib.HTTPConnection("127.0.0.1:8090")
#conn.request("GET", "/deep.js")
#r1 = conn.getresponse()
##print r1.status, r1.reason
#data1 = r1.read()
#conn.request("GET", "/deep.js")
#r2 = conn.getresponse()
##print r2.status, r2.reason
#data2 = r2.read()
#print data2
#conn.close()

from httplib import HTTPConnection
conn = HTTPConnection("nyc.csail.mit.edu", 8090, timeout=50)
conn.connect()

conn.request("GET", "/deep.js")
resp = conn.getresponse()
data = resp.read()
#print resp.getheaders()
#print resp.status
print(data)

conn.request("GET", "/deep.js")
resp1 = conn.getresponse()
data = resp1.read()
print(data)
