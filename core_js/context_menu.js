/*
ClearURLs
Copyright (c) 2017-2025 Kevin Röbert
This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Lesser General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.
This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Lesser General Public License for more details.
You should have received a copy of the GNU Lesser General Public License
along with this program.  If not, see http://www.gnu.org/licenses/.
*/
/*jshint esversion: 6 */

/**
 * This script is responsible for context menu cleaning functions
 */

/**
 * Create or remove the context menu based on the setting
 */
function contextMenuStart() {
    // Always remove existing menus first to prevent duplicates
    browser.contextMenus.removeAll().then(() => {
        if(storage.contextMenuEnabled) {
            browser.contextMenus.create({
                id: "copy-link-to-clipboard",
                title: translate("clipboard_copy_link"),
                contexts: ["link"]
            });
        }
    });
}

/**
 * Listen for messages from settings page to update context menu
 */
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "updateContextMenu") {
        storage.contextMenuEnabled = message.enabled;
        contextMenuStart();
        sendResponse({success: true});
    }
});

/**
 * Handle context menu click
 */
browser.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "copy-link-to-clipboard") {
        const url = pureCleaning(info.linkUrl);

        browser.scripting.executeScript({
            target: { tabId: tab.id },
            files: ["/external_js/clipboard-helper.js"]
        }).then(() => {
            return browser.scripting.executeScript({
                target: { tabId: tab.id },
                func: (cleanUrl) => { copyToClipboard(cleanUrl); },
                args: [url]
            });
        }).catch((error) => {
            console.error("Failed to copy text: " + error);
        });
    }
});
