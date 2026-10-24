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

const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'data', 'data.min.json');
const outputPath = path.join(__dirname, 'rules.json');

if (!fs.existsSync(dataPath)) {
    console.error('Error: data/data.min.json not found. Did you initialize submodules?');
    process.exit(1);
}

const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
let rules = [];
let ruleId = 1;

// Only apply to page loads to prevent crashing on subresources
const pageResourceTypes = ["main_frame", "sub_frame"];

for (const [providerName, provider] of Object.entries(data.providers)) {

    // Handle redirections
    if (provider.redirections && Array.isArray(provider.redirections)) {
        for (const redir of provider.redirections) {
            if (redir.urlPattern && redir.target) {
                rules.push({
                    id: ruleId++,
                    priority: 2,
                    action: { type: "redirect", redirect: { regexSubstitution: redir.target } },
                    condition: {
                        regexFilter: redir.urlPattern,
                        resourceTypes: pageResourceTypes
                    }
                });
            }
        }
    }

    // Handle rules (parameter stripping)
    if (provider.rules && Array.isArray(provider.rules)) {
        for (const regexStr of provider.rules) {
            // Skip RE2-incompatible lookarounds
            if (/\(\?[=<!]/.test(regexStr)) continue;

            const paramRegex = `${regexStr}(?:=[^&]*)?`;

            // Rule A: Preceded by '&' (middle or end of query string)
            rules.push({
                id: ruleId++,
                priority: 1,
                action: { type: "redirect", redirect: { regexSubstitution: "\\1\\3" } },
                condition: {
                    regexFilter: `^(.*)&(${paramRegex})(.*)$`,
                    resourceTypes: pageResourceTypes
                }
            });

            // Rule B: Preceded by '?' and followed by '&' (first param, more follow)
            rules.push({
                id: ruleId++,
                priority: 1,
                action: { type: "redirect", redirect: { regexSubstitution: "\\1?\\3" } },
                condition: {
                    regexFilter: `^(.*)\\?(${paramRegex})&(.*)$`,
                    resourceTypes: pageResourceTypes
                }
            });

            // Rule C: Preceded by '?' and followed by '#' (first param, followed by hash)
            rules.push({
                id: ruleId++,
                priority: 1,
                action: { type: "redirect", redirect: { regexSubstitution: "\\1#\\3" } },
                condition: {
                    regexFilter: `^(.*)\\?(${paramRegex})#(.*)$`,
                    resourceTypes: pageResourceTypes
                }
            });

            // Rule D: Preceded by '?' and at the very end of the URL ($)
            rules.push({
                id: ruleId++,
                priority: 1,
                action: { type: "redirect", redirect: { regexSubstitution: "\\1" } },
                condition: {
                    regexFilter: `^(.*)\\?(${paramRegex})$`,
                    resourceTypes: pageResourceTypes
                }
            });
        }
    }

    // Handle rawRules
    if (provider.rawRules && Array.isArray(provider.rawRules)) {
        for (const raw of provider.rawRules) {
            const escaped = raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            rules.push({
                id: ruleId++,
                priority: 1,
                action: { type: "redirect", redirect: { regexSubstitution: "\\1?\\3" } },
                condition: { regexFilter: `^(.*)\\?(${escaped})&(.*)$`, resourceTypes: pageResourceTypes }
            });
            rules.push({
                id: ruleId++,
                priority: 1,
                action: { type: "redirect", redirect: { regexSubstitution: "\\1\\3" } },
                condition: { regexFilter: `^(.*)&(${escaped})(.*)$`, resourceTypes: pageResourceTypes }
            });
            rules.push({
                id: ruleId++,
                priority: 1,
                action: { type: "redirect", redirect: { regexSubstitution: "\\1" } },
                condition: { regexFilter: `^(.*)\\?(${escaped})$`, resourceTypes: pageResourceTypes }
            });
        }
    }
}

// Chrome has a silly HARD LIMIT of 1,000 regex rules per extension
// ClearURLs2 caps it at 950 max as a safety net to avoid the "rule count exceeded" warning
if (rules.length > 950) {
    console.warn(`Chrome limits regex rules to 1,000. Truncating to 950 rules.`);
    rules = rules.slice(0, 950);
}

fs.writeFileSync(outputPath, JSON.stringify(rules, null, 2));
console.log(`Generated rules.json with ${rules.length} rules (Safe for Chrome's 1k regex limit).`);
