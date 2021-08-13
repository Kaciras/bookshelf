import { blobToBase64URL, encodeSVG } from "./codec.js";

function isFaviconLink(link) {
	switch (link.rel) {
		case "shortcut icon":
		case "icon":
		case "apple-touch-icon":
			return true;
		default:
			return false;
	}
}

/**
 * 获取网页中所有包含图标的 <link> 元素。
 *
 * Firefox 的实现挺复杂而且用得 C艹：
 * https://github.com/mozilla/gecko-dev/blob/master/toolkit/components/places/FaviconHelpers.cpp
 */
async function fetchLinks(url, signal) {
	const response = await fetch(url, { mode: "no-cors", signal });
	if (!response.ok) {
		throw new Error(`Request is not OK (status = ${response.status})`);
	}
	const parser = new DOMParser();
	const doc = parser.parseFromString(await response.text(), "text/html");
	const links = doc.head.getElementsByTagName("link");

	return Array.from(links).filter(isFaviconLink);
}

/**
 * 从页面的 link 元素列表中选出最佳的图标，如果没有则返回 /favicon.ico
 *
 * 优选规则：
 * 如果有 SVG 格式则选中，否则在尺寸至少为 48 的图中选择最小的，如果全部小于 48 或没写尺寸则选第一个。
 *
 * @param url 页面的 URL
 * @param signal AbortSignal 取消加载页面
 * @return {Promise<string>} 图标的 URL 片段。
 */
export async function getFaviconUrl(url, signal) {
	const links = await fetchLinks(url, signal);

	let size = Number.MAX_SAFE_INTEGER;
	let best = links[0];
	for (const link of links) {
		const { sizes, type } = link;

		if (type === "image/svg+xml") {
			best = link;
			break;
		}
		if (!sizes.length) {
			continue;
		}
		let [w] = /(\d+)x(\d+)/.exec(sizes[0]);
		w = parseInt(w);
		if (w >= 48 && w < size) {
			size = w;
			best = link;
		}
	}

	// 不能直接 .href 因为它会转成以本页面为基础的 URL。
	const href = best?.getAttribute("href");
	return new URL(href || "/favicon.ico", url).toString();
}

/**
 * 将远程的图片 URL 转换为本地的 DataURL。
 *
 * @param url 原始 URL
 * @return {Promise<string>} DataURL
 */
export async function imageUrlToLocal(url) {
	const response = await fetch(url, { mode: "no-cors" });
	if (!response.ok) {
		throw new Error(`资源下载失败：${url}`);
	}
	const blob = await response.blob();

	if (blob.type === "image/svg+xml") {
		const code = encodeSVG(await blob.text());
		return `data:image/svg+xml,${code}`;
	} else {
		return await blobToBase64URL(blob);
	}
}
