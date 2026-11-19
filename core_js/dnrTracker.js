/*
 ClearURLs2
 Copyright (c) 2026  Chris McGimpsey-Jones <chrisjones.unixmen@gmail.com>

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU Lesser General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Lesser General Public License for more details.

 You should have received a copy of the GNU Lesser General Public License
 along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

// core_js/dnrTracker.js
const seenRequests = new Map();

function recordCleanedUrl(previousUrl, cleanUrl, details) {
  // Increment "URLs cleaned" counter
  if (typeof increaseCleanedCounter === "function") {
    increaseCleanedCounter(1);
  }

  // Update toolbar icon badge
  if (typeof increaseBadged === "function") {
    increaseBadged(false, details);
  }

  // Ensure loggingStatus and log array are hydrated from chrome.storage.local
  chrome.storage.local.get(["loggingStatus", "log", "logLimit"], (res) => {
    if (typeof storage !== "undefined") {
      if (typeof res.loggingStatus === "boolean") {
        storage.loggingStatus = res.loggingStatus;
      }
      if (res.log) {
        try {
          const parsedLog = typeof res.log === "string" ? JSON.parse(res.log) : res.log;
          if (parsedLog && Array.isArray(parsedLog.log)) {
            storage.log = parsedLog;
          }
        } catch (e) {
          // Keep existing storage.log if parsing fails
        }
      }
      if (res.logLimit !== undefined) {
        storage.logLimit = res.logLimit;
      }
    }

    if (typeof pushToLog === "function") {
      pushToLog(previousUrl, cleanUrl, "declarativeNetRequest");
      if (typeof saveOnDisk === "function") {
        saveOnDisk(["log"]);
      }
    }
  });
}

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (details.type !== "main_frame" && details.type !== "sub_frame") return;
    if (!details.url || !details.requestId) return;

    const previousUrl = seenRequests.get(details.requestId);

    // First time seeing requestId: store initial UDI if it has query params
    if (!previousUrl) {
      if (details.url.includes("?")) {
        seenRequests.set(details.requestId, details.url);
      }
      return;
    }

    // Second time seeing same requestId: check if params were stripped
    if (previousUrl !== details.url) {
      seenRequests.delete(details.requestId);

      try {
        const beforeObj = new URL(previousUrl);
        const afterObj = new URL(details.url);

        const sameTarget =
          beforeObj.origin === afterObj.origin &&
          beforeObj.pathname === afterObj.pathname;
        const beforeCount = Array.from(beforeObj.searchParams.keys()).length;
        const afterCount = Array.from(afterObj.searchParams.keys()).length;

        if (sameTarget && afterCount < beforeCount) {
          recordCleanedUrl(previousUrl, details.url, details);
        }
      } catch (e) {
        console.error("[ClearURLs2 dnrTracker error]", e);
      }
    }
  },
  { urls: ["<all_urls>"], types: ["main_frame", "sub_frame"] }
);

// Clean up Map when requests complete or fail
const cleanupRequest = (details) => {
  if (details && details.requestId) {
    seenRequests.delete(details.requestId);
  }
};
chrome.webRequest.onCompleted.addListener(cleanupRequest, { urls: ["<all_urls>"] });
chrome.webRequest.onErrorOccurred.addListener(cleanupRequest, { urls: ["<all_urls>"] });


// Dynamic rule IDs reserved for local host exemption
const LOCAL_HOSTS_RULE_IDS = [900001, 900002, 900003];

const ALL_RESOURCE_TYPES = [
  "main_frame",
  "sub_frame",
  "stylesheet",
  "script",
  "image",
  "font",
  "object",
  "xmlhttprequest",
  "ping",
  "csp_report",
  "media",
  "websocket",
  "webtransport",
  "webbundle",
  "other"
];

// Sync high-priority DNR "allow" rules when localHostsSkipping is enabled
function syncLocalHostsSkippingState(skipLocal) {
  if (!chrome.declarativeNetRequest || !chrome.declarativeNetRequest.updateDynamicRules) return;

  if (!skipLocal) {
    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: LOCAL_HOSTS_RULE_IDS
    }).catch((err) => {
      console.error("[ClearURLs2] Failed to remove localHostsSkipping rules:", err);
    });
    return;
  }

  const localDomains = ["localhost", "local", "127.0.0.1", "::1"];

  const addRules = [
    {
      id: 900001,
      priority: 10000,
      action: { type: "allow" },
      condition: {
        requestDomains: localDomains,
        resourceTypes: ALL_RESOURCE_TYPES
      }
    },
    {
      id: 900002,
      priority: 10000,
      action: { type: "allow" },
      condition: {
        initiatorDomains: localDomains,
        resourceTypes: ALL_RESOURCE_TYPES
      }
    },
    {
      id: 900003,
      priority: 10000,
      action: { type: "allow" },
      condition: {
        regexFilter: "^https?://(\\[::1\\]|127(?:\\.[0-9]{1,3}){3}|10(?:\\.[0-9]{1,3}){3}|172\\.(?:1[6-9]|2[0-9]|3[0-1])(?:\\.[0-9]{1,3}){2}|192\\.168(?:\\.[0-9]{1,3}){2})(?::[0-9]+)?(?:/|\\?|#|$)",
        resourceTypes: ALL_RESOURCE_TYPES
      }
    }
  ];

  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: LOCAL_HOSTS_RULE_IDS,
    addRules: addRules
  }).catch((err) => {
    console.error("[ClearURLs2] Failed to apply localHostsSkipping rules:", err);
  });
}


// Sync Manifest V3 declarativeNetRequest ruleset with globalStatus toggle
function syncDnrRulesetState(isEnabled) {
  if (!chrome.declarativeNetRequest || !chrome.declarativeNetRequest.updateEnabledRulesets) return;

  const options = isEnabled
    ? { enableRulesetIds: ["clearurls_rules"] }
    : { disableRulesetIds: ["clearurls_rules"] };

  chrome.declarativeNetRequest.updateEnabledRulesets(options).catch((err) => {
    console.error("[ClearURLs2] Failed to toggle DNR ruleset:", err);
  });
}

// Keep DNR ruleset, dynamic rules, and in-memory storage flags synced when popup/settings change storage
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") return;

  if (changes.globalStatus) {
    if (typeof storage !== "undefined") {
      storage.globalStatus = Boolean(changes.globalStatus.newValue);
    }
    syncDnrRulesetState(Boolean(changes.globalStatus.newValue));
  }

  if (changes.localHostsSkipping) {
    if (typeof storage !== "undefined") {
      storage.localHostsSkipping = Boolean(changes.localHostsSkipping.newValue);
    }
    syncLocalHostsSkippingState(Boolean(changes.localHostsSkipping.newValue));
  }

  if (changes.loggingStatus && typeof storage !== "undefined") {
    storage.loggingStatus = Boolean(changes.loggingStatus.newValue);
  }

  if (changes.logLimit && typeof storage !== "undefined") {
    storage.logLimit = changes.logLimit.newValue;
  }
});

// Ensure ruleset and dynamic local-host rules match stored settings whenever service worker starts
chrome.storage.local.get(["globalStatus", "localHostsSkipping", "loggingStatus", "logLimit"], (res) => {
  if (typeof res.globalStatus === "boolean") {
    syncDnrRulesetState(res.globalStatus);
  }
  if (typeof res.localHostsSkipping === "boolean") {
    syncLocalHostsSkippingState(res.localHostsSkipping);
  }
  if (typeof storage !== "undefined") {
    if (typeof res.loggingStatus === "boolean") storage.loggingStatus = res.loggingStatus;
    if (typeof res.localHostsSkipping === "boolean") storage.localHostsSkipping = res.localHostsSkipping;
    if (res.logLimit !== undefined) storage.logLimit = res.logLimit;
  }
});
