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
    const statusDiv = document.getElementById('status');
    const totalCounterSpan = document.getElementById('totalCounter');
    const cleanedCounterSpan = document.getElementById('cleanedCounter');
    const toggleBtn = document.getElementById('toggleBtn');
    const optionsBtn = document.getElementById('optionsBtn');
    const clearLogBtn = document.getElementById('clearLogBtn');
    const viewLogBtn = document.getElementById('viewLogBtn');
    const loggingToggle = document.getElementById('loggingToggle');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const logViewer = document.getElementById('logViewer');
    const logContent = document.getElementById('logContent');

    // Init theme
    initTheme(darkModeToggle);

    // Dark mode toggle
    darkModeToggle.addEventListener('change', function() {
        toggleTheme(darkModeToggle.checked);
    });

    // Load current state
    browser.storage.local.get(['globalStatus', 'totalCounter', 'cleanedCounter', 'loggingStatus']).then((data) => {
        updateUI(data);
    }).catch((error) => {
        console.error('Error loading storage:', error);
    });

    // Toggle extension
    toggleBtn.addEventListener('click', function() {
        browser.storage.local.get(['globalStatus']).then((data) => {
            const newStatus = !data.globalStatus;
            return browser.storage.local.set({ globalStatus: newStatus });
        }).then(() => {
            return browser.storage.local.get(['globalStatus', 'totalCounter', 'cleanedCounter', 'loggingStatus']);
        }).then((data) => {
            updateUI(data);
        }).catch((error) => {
            console.error('Error toggling extension:', error);
        });
    });

    // Open settings
    optionsBtn.addEventListener('click', function() {
        browser.runtime.openOptionsPage();
    });

    // Toggle logging
    loggingToggle.addEventListener('change', function() {
        browser.storage.local.set({ loggingStatus: loggingToggle.checked }).then(() => {
            console.log('Logging status updated:', loggingToggle.checked);
        }).catch((error) => {
            console.error('Error updating logging status:', error);
        });
    });

    // View log
    viewLogBtn.addEventListener('click', function() {
        if (logViewer.style.display === 'none') {
            logViewer.style.display = 'block';
            viewLogBtn.textContent = 'Hide Log';
            loadLog();
        } else {
            logViewer.style.display = 'none';
            viewLogBtn.textContent = 'View Log';
        }
    });

    // Clear log with visual feedback
    clearLogBtn.addEventListener('click', function() {
        browser.storage.local.set({ log: { log: [] } }).then(() => {
            const originalText = clearLogBtn.textContent;
            clearLogBtn.textContent = '✓ Log Cleared';
            clearLogBtn.style.backgroundColor = 'var(--success)';

            if (logViewer.style.display === 'block') {
                loadLog();
            }

            setTimeout(() => {
                clearLogBtn.textContent = originalText;
                clearLogBtn.style.backgroundColor = 'var(--danger)';
            }, 2000);
        }).catch((error) => {
            console.error('Error clearing log:', error);
        });
    });

    // Load log entries
    function loadLog() {
        browser.storage.local.get(['log']).then((data) => {
            const logs = data.log && data.log.log ? data.log.log : [];

            if (logs.length === 0) {
                logContent.innerHTML = '<div class="no-logs">No log entries yet</div>';
                return;
            }

            const reversedLogs = logs.slice().reverse();

            logContent.innerHTML = reversedLogs.map(entry => {
                const time = new Date(entry.timestamp).toLocaleString();
                return `
                    <div class="log-entry">
                        <div class="log-url"><strong>Before:</strong> ${escapeHtml(entry.before)}</div>
                        <div class="log-url"><strong>After:</strong> ${escapeHtml(entry.after)}</div>
                        <div class="log-rule">Rule: ${escapeHtml(entry.rule)}</div>
                        <div class="log-time">${time}</div>
                    </div>
                `;
            }).join('');
        }).catch((error) => {
            console.error('Error loading log:', error);
            logContent.innerHTML = '<div class="no-logs">Error loading log</div>';
        });
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function updateUI(data) {
        if (data.globalStatus) {
            statusDiv.textContent = 'Extension enabled';
            statusDiv.className = 'status active';
            toggleBtn.textContent = 'Disable Extension';
        } else {
            statusDiv.textContent = 'Extension disabled';
            statusDiv.className = 'status inactive';
            toggleBtn.textContent = 'Enable Extension';
        }

        totalCounterSpan.textContent = data.totalCounter || 0;
        cleanedCounterSpan.textContent = data.cleanedCounter || 0;
        loggingToggle.checked = data.loggingStatus || false;
    }
});
