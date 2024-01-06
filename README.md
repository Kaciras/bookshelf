# Bookshelf

[![Firefox Add-on](https://img.shields.io/amo/v/bookshelf-newtab)](https://addons.mozilla.org/en-US/firefox/addon/bookshelf-newtab)

![Screenshot](https://github.com/Kaciras/browser-theme/raw/master/doc/banner.webp)

minimalist & small (21KB zipped) new tab page. Instantly load without any network traffic.

# Install

[Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/bookshelf-newtab)

> [!NOTE]
> 
> As of Some of the suggestion providers does not support CORS, Bookshelf need [host permissions](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/host_permissions) to read responses of them. In Firefox host permissions are disabled by default, you need to turn on it after install.
> 
> goto "about:addons" > extensions > Bookshelf > permissions > Access your data for all websites

# Shortcuts

`PageUp/PageDown` switches search engines when focus on the search box.

# Developing

Install dependencies:

```
pnpm install
```

Build the app:

```
pnpm build
```

Pack build result and source files:

```
pnpm run pack
```

# FAQ

## Why images are not synchronized?

Due to browser data size limit, we can not save images to synchronized storage. You can use Import Data / Export Data in setting menu instead.
