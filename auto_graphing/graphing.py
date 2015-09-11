import json
import requests
import websocket
import subprocess
import time
import sys
import signal
from sys import platform

chrome_path = "/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome"
if platform == "linux" or platform == "linux2":
  chrome_path = "google-chrome"

chrome = subprocess.Popen(chrome_path + " --incognito --remote-debugging-port=9222 about:blank", shell=True)
time.sleep(8)

site = "http://www.mit.edu/"
output_file = "output"
if len(sys.argv) > 1:
  site = sys.argv[1]
if len(sys.argv) > 2:
  output_file = sys.argv[2]

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

output = "strict digraph G {\n"
output += "ratio=compress;\n"

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
      output += '"' + initiator + '" -> "' + message["params"]["request"]["url"] + '";\n'
    if message["method"] == "Page.loadEventFired":
      output += "}\n"
      break
soc.close()
chrome.send_signal(signal.SIGINT)

print output
with open(output_file, "w") as f:
  f.write(output)

