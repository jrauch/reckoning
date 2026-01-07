# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Reckoning is a Chrome Manifest V3 extension for managing browser tabs through regex-based operations. It enables users to deduplicate tabs, organize tabs into groups, and close tabs matching patterns.

## Installation & Testing

Install the extension via `chrome://extensions/` > Load unpacked, selecting this repository folder. Changes to files require clicking the refresh icon in chrome://extensions/ to reload the extension.

## Architecture

### Service Worker (js/sw.js)
The background service worker is the central coordinator that:
- Listens for keyboard command events via `chrome.commands.onCommand`
- Implements core tab management functions:
  - `deDuplicateTabs(tabs)` - removes duplicate tabs by URL
  - `createTabGroups(tabs)` - groups tabs based on regex patterns from storage
  - `killByRegex(tabs, regex)` - closes tabs matching a regex pattern
  - `killDupsOfThis(activeTab)` - closes duplicates of the active tab

### Configuration System (js/config.js, pages/config.html)
- UI for managing tab grouping rules stored in `chrome.storage.sync`
- Each rule has: name (group title), regex (matching pattern), color (group color)
- Default patterns provided for Jira, Google Docs, and Google Sheets

### Popup UI (js/popup.js, pages/popup.html)
- Small popup window for ad-hoc tab killing by regex
- Matches against both `tab.url` AND `tab.title`
- Triggered by Alt+Shift+X command

### Key Commands (manifest.json)
- Alt+Shift+W: Deduplicate tabs in current window
- Ctrl+Shift+8: Deduplicate all tabs across Chrome
- Alt+Shift+T: Group tabs by regex patterns
- Alt+Shift+X: Open popup to kill tabs by regex
- (no default): Deduplicate only the current tab

## Data Flow

1. User configures regex patterns in config page → stored in `chrome.storage.sync`
2. User triggers command → service worker receives event
3. Service worker queries tabs → applies operation (dedup/group/kill)
4. Tab groups created/updated with configured name and color

## Important Implementation Details

- `createTabGroups()` only groups ungrouped tabs (`tab.groupId < 0`)
- Each tab matches only the first regex pattern (uses `Array.every()` with early exit)
- Group creation checks if a group with the same title already exists before creating new one
- Popup regex matching checks both URL and title, so both can trigger tab closure
