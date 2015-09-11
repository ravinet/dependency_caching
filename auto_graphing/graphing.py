import json
import requests
import websocket
import time
import sys
import os

site = "http://www.mit.edu/"
if len(sys.argv) > 1:
  site = sys.argv[1]

enable_network = json.dumps({"id": 0,
                             "method": "Network.enable"})
enable_page= json.dumps({"id": 0,
                         "method": "Page.enable"})
set_cache_disabled = json.dumps({"id": 1,
                                 "method": "Network.setCacheDisabled",
                                 "params": {"cacheDisabled": True}})
load_page = json.dumps({"id": 2,
                     "method": "Page.navigate",
                     "params": {"url": site}})

response = requests.get("http://localhost:9222/json")
tablist = json.loads(response.text)
wsurl = tablist[0]['webSocketDebuggerUrl']
soc = websocket.create_connection(wsurl)
soc.send(enable_page)
soc.send(enable_network)
soc.send(set_cache_disabled)
soc.send(load_page)

print "strict digraph G {"
print "ratio=compress;"

while True:
  raw_recv = soc.recv()
  message = json.loads(raw_recv)
  if "method" in message:
    if message["method"] == "Network.requestWillBeSent":
      initiator = site
      if "initiator" in message["params"]:
        if "url" in message["params"]["initiator"]:
          initiator = message["params"]["initiator"]["url"]
        if message["params"]["initiator"]["type"] == "script":
          initiator = message["params"]["initiator"]["stackTrace"][0]["url"]
      print '"' + initiator + '" -> "' + message["params"]["request"]["url"] + '";'
    if message["method"] == "Page.loadEventFired":
      print "}"
      break
soc.close()
