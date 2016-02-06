var tabId = parseInt(window.location.search.substring(1));

var requests = {};
var firstRequest = true;
var undefinedURL = "";

var headerDiv = document.createElement("div");
headerDiv.textContent = "strict digraph G {\nratio=compress;\n"
document.getElementById("container").appendChild(headerDiv);

var headerDiv = document.createElement("div");
headerDiv.textContent = "TIMELINE:\n"
document.getElementById("timeline").appendChild(headerDiv);

window.addEventListener("load", function() {
  chrome.debugger.sendCommand({tabId:tabId}, "Page.enable");
  chrome.debugger.sendCommand({tabId:tabId}, "Tracing.start");
  chrome.debugger.sendCommand({tabId:tabId}, "Network.enable");
  chrome.debugger.sendCommand({tabId:tabId}, "Network.setCacheDisabled", {"cacheDisabled": true});
  chrome.debugger.onEvent.addListener(onNetworkEvent);
  chrome.debugger.onEvent.addListener(onTimelineEvent);
});

window.addEventListener("unload", function() {
  chrome.debugger.detach({tabId:tabId});
});

function onNetworkEvent(debuggeeId, message, params) {
  if (tabId != debuggeeId.tabId)
    return;

  if (message == "Network.requestWillBeSent") {
    if (firstRequest) {
      undefinedURL = params.request.url;
      firstRequest = false;
    }
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
          if(params.initiator.stackTrace) {
            initiator = params.initiator.stackTrace[0].url;
          }
        }
      }
    }
    if (initiator == undefined) {
      initiator = undefinedURL;
    }
    var initiatorLine = document.createElement("div");
    initiatorLine.textContent = "\"" + initiator + "\" -> \"" + params.request.url  + "\";\nRequest Sent: " + params.timestamp; 
    requestDiv.appendChild(initiatorLine);

    document.getElementById("container").appendChild(requestDiv);
  
  } else if (message == "Network.loadingFailed") {
    console.log(params.requestId + " failed");
    var requestDiv = requests[params.requestId];
    document.getElementById("container").removeChild(requestDiv);
    delete requests[params.requestId];
  } else if (message == "Network.responseReceived") {
    var requestDiv = requests[params.requestId];
    var timingLine = document.createElement("div");
    timingLine.textContent = JSON.stringify(params.response.timing);
    requestDiv.appendChild(timingLine);
    document.getElementById("container").appendChild(requestDiv);
  } else if (message == "Network.loadingFinished") {
    var requestDiv = requests[params.requestId];
    var timingLine = document.createElement("div");
    timingLine.textContent = "Loading Finished: " + params.timestamp + "\n\n";
    requestDiv.appendChild(timingLine);
    document.getElementById("container").appendChild(requestDiv);
  }
}

function onTimelineEvent(debuggeeId, message, params) {
  if (tabId != debuggeeId.tabId)
    return;

  if (message == "Page.loadEventFired") {
    console.log("LOADED");
    chrome.debugger.sendCommand({tabId:tabId}, "Tracing.end");
  }

  if (message == "Tracing.dataCollected") {
    var timelineLine = document.createElement("div");
    timelineLine.textContent = JSON.stringify(params.value);
    document.getElementById("timeline").appendChild(timelineLine);
  }
}

