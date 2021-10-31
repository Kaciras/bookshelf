# browser-theme

自 Firefox 89.0 起，标签栏和新标签页被重构的极其丑陋且难用，本项目旨在将它们恢复到以前版本的样式。

本项目并非使用旧版 Firefox 的代码，也不是让浏览器恢复之前的状态，而是仿照旧版样式从头编写。

浏览器要求：

- Firefox >= 89.0
- Edge & Chrome >= 89

# 使用

## userChrome.css

在 `/chrome` 文件夹下有一个自定义浏览器界面的样式表，用于恢复方形标签页，将该文件夹复制到 Firefox 的配置目录下，重启浏览器生效。

## new-tab

一个浏览器插件，包含了仿照旧版设计的新标签页（与新版的主要区别是搜索框不会重定向到地址栏），该页面使用 Rollup 构建，并同时支持 Firefox 和 Chromium 内核的浏览器。

Firefox 的新版新标签页抄袭了 Chrome 的设计，搜索框会将输入重定向到地址栏，也不知道是哪位小天才想出来的，不仅要动视觉焦点，还要多切一次输入法（如果非英文）。

构建插件：

```shell
pnpm install
pnpm run build
```

构建的结果在 `/dist` 目录下，直接载入 `manifest.json` 或是打包整个目录即可。
