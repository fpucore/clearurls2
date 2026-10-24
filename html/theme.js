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

// Apply theme on load
function applyTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
}

// Init theme from storage or sys pref
function initTheme(toggleElement) {
    browser.storage.local.get(['themePreference']).then((data) => {
        let theme = data.themePreference;

        // If no pref saved, detect sys pref
        if (!theme) {
            theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }

        applyTheme(theme);

        if (toggleElement) {
            toggleElement.checked = (theme === 'dark');
        }
    }).catch((error) => {
        console.error('Error loading theme preference:', error);
    });
}

// Toggle theme and save pref
function toggleTheme(isDark) {
    const theme = isDark ? 'dark' : 'light';
    applyTheme(theme);

    browser.storage.local.set({ themePreference: theme }).then(() => {
        console.log('Theme preference saved:', theme);
    }).catch((error) => {
        console.error('Error saving theme preference:', error);
    });
}

// Listen for sys theme changes (only if no manual pref set)
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    browser.storage.local.get(['themePreference']).then((data) => {
        if (!data.themePreference) {
            applyTheme(e.matches ? 'dark' : 'light');
            const toggle = document.getElementById('darkModeToggle');
            if (toggle) toggle.checked = e.matches;
        }
    });
});
