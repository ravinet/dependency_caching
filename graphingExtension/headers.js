// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

var tabId = parseInt(window.location.search.substring(1));

window.addEventListener("load", function() {
  chrome.debugger.sendCommand({tabId:tabId}, "Network.enable");
  chrome.debugger.sendCommand({tabId:tabId}, "Network.setCacheDisabled", {"cacheDisabled": true});
  chrome.debugger.onEvent.addListener(onEvent);
});

window.addEventListener("unload", function() {
  chrome.debugger.detach({tabId:tabId});
});

var requests = {};
var firstRequest = true;
var undefinedURL = "";



function onEvent(debuggeeId, message, params) {
  if (tabId != debuggeeId.tabId)
    return;

  if (firstRequest) {
    var headerDiv = document.createElement("div");
    headerDiv.textContent = "digraph G {\nratio=compress;\n"
    document.getElementById("container").appendChild(headerDiv);
    undefinedURL = params.request.url;
    firstRequest = false;
  }

  if (message == "Network.requestWillBeSent") {
    var requestDiv = requests[params.requestId];
    if (!requestDiv) {
      var requestDiv = document.createElement("div");
      requests[params.requestId] = requestDiv;
    }

    var initiator = "FAILURE!!!!!!!!!!!!!!!!";
    if (params.initiator) {
      initiator = params.initiator.url;
      if(params.initiator.type) {
        if(params.initiator.type == "script") {
          initiator = params.initiator.stackTrace[0].url;
        }
      }
    }
    if (initiator == undefined) {
      initiator = undefinedURL;
    }
    var initiatorLine = document.createElement("div");
    initiatorLine.textContent = "\"" + initiator + "\" -> \"" + params.request.url  + "\";\n";
    requestDiv.appendChild(initiatorLine);

    document.getElementById("container").appendChild(requestDiv);
  
  } else if (message == "Network.loadingFailed") {
    console.log(params.requestId + " Failed")
  }
}

