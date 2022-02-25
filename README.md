# browser-theme

自 Firefox 89.0 起，标签栏和新标签页被重构的极其丑陋且难用，本项目旨在将它们恢复到以前的样式。

本项目并非使用旧版 Firefox 的代码，也不是让浏览器恢复之前的状态，而是仿照旧版样式从头构建。

浏览器支持：

- Firefox >= 98.0
- Edge & Chrome >= 89

没有适配移动端，仅适用于宽度大于 1200px 的桌面浏览器。

![Screenshot](https://github.com/Kaciras/browser-theme/raw/master/screenshot.png)

# 使用

## 恢复方形标签页

将`/chrome/userChrome.css`复制到 Firefox 的配置目录下，重启浏览器生效。

## 新标签页

一个浏览器插件，包含了仿照旧版样式的新标签页，该页面使用 Rollup 构建，同时支持 Firefox 和 Chromium 内核的浏览器。

该页面中的搜索框不会重定向到地址栏，支持百度、Google、DuckDuckGo 搜索引擎，可以通过`PageUp/PageDown`键切换。

开发原因:

Firefox 的新版新标签页抄袭了 Chrome 的设计，搜索框会将输入重定向到地址栏，也不知道是哪位小天才想出来的，不仅要动视觉焦点，还要多切一次输入法（如果非英文），太反人类，故有了重写新标签页的想法。

构建插件：

```shell
pnpm run build
```

构建的结果在 `/dist` 目录下，直接载入 `manifest.json` 或是打包整个目录即可。

## 数据同步

由于存储空间的限制，网站图标无法通过浏览器自身的同步功能进行同步，使用导出数据功能则能够导出图标。
