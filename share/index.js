export * from "./lang.js";
export * from "./dom.js";
export * from "./favicon.js";

if (globalThis.browser === undefined) {
	// noinspection JSUnresolvedVariable; The `chrome` is avaliable in Chromium-based browsers.
	globalThis.browser = chrome;
}

export const i18n = browser.i18n.getMessage;
