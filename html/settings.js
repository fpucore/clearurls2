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

document.addEventListener('DOMContentLoaded', function() {
    const settings = {
        globalStatus: document.getElementById('globalStatus'),
        loggingStatus: document.getElementById('loggingStatus'),
        badgedStatus: document.getElementById('badgedStatus'),
        statisticsStatus: document.getElementById('statisticsStatus'),
        localHostsSkipping: document.getElementById('localHostsSkipping'),
        contextMenuEnabled: document.getElementById('contextMenuEnabled'),
        historyListenerEnabled: document.getElementById('historyListenerEnabled'),
        domainBlocking: document.getElementById('domainBlocking'),
        pingBlocking: document.getElementById('pingBlocking'),
        referralMarketing: document.getElementById('referralMarketing'),
        logLimit: document.getElementById('logLimit')
    };

    const darkModeToggle = document.getElementById('darkModeToggle');
    const totalCounterSpan = document.getElementById('totalCounter');
    const cleanedCounterSpan = document.getElementById('cleanedCounter');
    const resetStatsBtn = document.getElementById('resetStatsBtn');
    const clearLogBtn = document.getElementById('clearLogBtn');
    const statusMessage = document.getElementById('statusMessage');

    // Init theme
    initTheme(darkModeToggle);

    // Dark mode toggle
    darkModeToggle.addEventListener('change', function() {
        toggleTheme(darkModeToggle.checked);
    });

    // Load all settings
    browser.storage.local.get(null).then((data) => {
        Object.keys(settings).forEach(key => {
            if (settings[key].type === 'checkbox') {
                settings[key].checked = data[key] || false;
            } else if (settings[key].type === 'number') {
                settings[key].value = data[key] || 100;
            }
        });

        totalCounterSpan.textContent = data.totalCounter || 0;
        cleanedCounterSpan.textContent = data.cleanedCounter || 0;
    }).catch((error) => {
        console.error('Error loading settings:', error);
        showStatus('Error loading settings', 'error');
    });

    // Add event listeners to all settings
    Object.keys(settings).forEach(key => {
        if (settings[key].type === 'checkbox') {
            settings[key].addEventListener('change', function() {
                const update = {};
                update[key] = settings[key].checked;
                browser.storage.local.set(update).then(() => {
                    showStatus('Setting saved', 'success');
                }).catch((error) => {
                    console.error('Error saving setting:', error);
                    showStatus('Error saving setting', 'error');
                });
            });
        } else if (settings[key].type === 'number') {
            settings[key].addEventListener('change', function() {
                const update = {};
                update[key] = parseInt(settings[key].value) || 100;
                browser.storage.local.set(update).then(() => {
                    showStatus('Setting saved', 'success');
                }).catch((error) => {
                    console.error('Error saving setting:', error);
                    showStatus('Error saving setting', 'error');
                });
            });
        }
    });

    // Reset stats
    resetStatsBtn.addEventListener('click', function() {
        browser.storage.local.set({
            totalCounter: 0,
            cleanedCounter: 0
        }).then(() => {
            totalCounterSpan.textContent = '0';
            cleanedCounterSpan.textContent = '0';
            showStatus('Statistics reset', 'success');
        }).catch((error) => {
            console.error('Error resetting statistics:', error);
            showStatus('Error resetting statistics', 'error');
        });
    });

    // Clear log
    clearLogBtn.addEventListener('click', function() {
        browser.storage.local.set({
            log: { log: [] }
        }).then(() => {
            showStatus('Log cleared', 'success');
        }).catch((error) => {
            console.error('Error clearing log:', error);
            showStatus('Error clearing log', 'error');
        });
    });

    function showStatus(message, type) {
        statusMessage.textContent = message;
        statusMessage.className = 'status-message ' + type;

        setTimeout(() => {
            statusMessage.className = 'status-message';
        }, 3000);
    }
});
