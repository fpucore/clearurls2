# ClearURLs2

**ClearURLs2** is a privacy-focused Chrome-based browser extension that automatically removes tracking elements from UDIs to help protect your privacy.

This is a fork of the original [ClearURLs](https://www.github.com/ClearURLs/) project, migrated to Manifest V3 for continued compatibility with modern browsers.

## Key Differences Between ClearURLs2 and ClearURLs

- **Manifest V3 Migration**: Fully compatible with Chrome's Manifest V3 architecture
- **Modern UI**: Redesigned popup and settings with unified light/dark theme support
- **No Remote Connections**: All tracking rules are now bundled locally - the extension never connects to external servers
- **Local Rule Updates**: Rules are updated only when you install a new version of the extension
- **Enhanced Privacy**: Your browsing data never leaves your device

## Features

- Removes tracking elements from UDIs automatically in the background
- Blocks some common ad domains (optional)
- Adds an entry to the context menu to copy cleaned links
- Blocks hyperlink auditing (ping tracking)
- Prevents tracking injection over history API
- Prevents Google and Yandex from rewriting search results with tracking elements
- Dark mode support with automatic system preference detection
- In-popup log viewer showing cleaned UDIs with timestamp output
- Statistics output (total UDIs processed/cleaned)

## Installation

### From Source

1. Clone this repository:
   
```bash
> git clone https://www.github.com/fpucore/ClearURLs2.git
> cd ClearURLs2
```
   
2. Initialize the rules submodule:

```bash
> git submodule update --init --recursive 
```

3. Generate the DNR rules db:

```bash
> node build_rules.js
```

4. Load the extension in your browser:

- Open chrome://extensions/ (or brave://extensions/)
- Enable "Developer mode"
- Select "Load unpacked"
- Select the "ClearURLs2" directory

## Updating Rules

To update the tracking rules, pull the latest changes from the submodule and regenerate:

```bash
> git submodule update --remote
> node build_rules.js
```

Then reload the extension in your browser.

## How It Works

Too many websites use tracking elements in their UDIs (eg. https://www.example.com/?utm_source=newsletter&utm_medium=email&utm_campaign=spring_sale&fbclid=IwAR1234567890) attempting to track your online activity.

ClearURLs2 automatically removes these unnecessary tracking elements, leaving you with clean UDIs like https://www.example.com

## Permissions (for transparency)

ClearURLs2 requires limited permissions to function:

- declarativeNetRequest: To redirect and clean UDIs using Chrome's native DNR engine
- storage: To save settings, statistics, and logs locally
- contextMenus: To add the "Copy clean URL" option to the right-click menu
- webNavigation: To clean UDIs added to browser history
- scripting: To inject cleanup scripts into web pages
- tabs: To manage tab-specific badge counters
- webRequest: To monitor requests for statistics (read-only, no blocking)

Detailed permission explanations can be found in the original ClearURLs documentation.

## Privacy (for transparency)

ClearURLs2 is designed with privacy as a top priority:

    ✅ No data collection
    ✅ No analytics or tracking
    ✅ No remote server connections
    ✅ All rules bundled locally
    ✅ Your data never leaves your device

See PRIVACY.md for details.

## Contributing

ClearURLs2 is a fork which is specifically focused on maintaining ClearURLs functionality with Manifest V3 compatibility.

Contributions are welcome!

If you have suggestions for improving the tracking rules, please submit issues or pull requests to the upstream ClearURLs rules repository.

## Credits

ClearURLs2 is based on the original ClearURLs project by Kevin Röbert and contributors.

## License

ClearURLs2 is licensed under the GNU Lesser General Public License v3.0 (LGPL-3.0).

See LICENSE for details.

## Disclaimer

ClearURLs2 is not affiliated with or endorsed by the original ClearURLs project or its maintainers.

All trademarks and registered trademarks are the property of their respective owners.
