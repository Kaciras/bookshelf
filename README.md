# Bookshelf

![Screenshot](https://github.com/Kaciras/browser-theme/raw/master/screenshot.webp)
 
minimalist (< 30 KB) browser new tab page.

Supported platforms:
- Firefox >= 109.0
- Edge & Chrome >= 89

> **Note**
> As of Some of the suggestion providers does not support CORS, Bookshelf need [host permissions](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/host_permissions) to read responses of them. In Manifest V3 host permissions are disabled by default, you need to turn on it after install.
> 
> Firefox: goto "about:addons" > extensions > Bookshelf > permissions > Access your data for all websites

# Shortcuts

`PageUp/PageDown` switches search engines when focus on the search box.

# Developing

Install all dependencies:

```
pnpm install
```

Build and package the app:

```
pnpm build
```

# FAQ

## Why images are not synchronized?

Due to browser data size limit, we can not save images to synchronized storage. You can use Import Data / Export Data in setting menu instead.
