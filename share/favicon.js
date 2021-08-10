import { blobToBase64URL, encodeSVG } from "./codec.js";

/**
 * 获取网页中所有包含图标的 <link> 元素。
 *
 * Firefox 的实现挺复杂而且用得 C艹：
 * https://github.com/mozilla/gecko-dev/blob/master/toolkit/components/places/FaviconHelpers.cpp
 */
async function fetchFaviconLinks(url, signal) {
	const response = await fetch(url, { mode: "no-cors", signal });
	if (!response.ok) {
		throw new Error(`Request is not OK (status = ${response.status})`);
	}
	const parser = new DOMParser();
	const doc = parser.parseFromString(await response.text(), "text/html");
	const links = doc.head.getElementsByTagName("link");

	return Array.from(links)
		.filter(({ rel }) => rel === "icon" || rel === "shortcut icon");
}

/**
 * 从页面的 link 元素列表中选出最佳的图标，如果没有则尝试默认的 /favicon.ico。
 *
 * @param url 页面的 URL
 * @param signal AbortSignal 取消加载页面
 * @return {Promise<string>} 图标的 URL 片段。
 */
export async function getFaviconUrl(url, signal) {
	const links = await fetchFaviconLinks(url, signal);

	if (links.length === 0) {
		return "/favicon.ico";
	}
	const link = links.find(v => v.type === "image/svg+xml") ?? links[0];

	// 不能直接 .href 因为它会转成完整的 URL
	return new URL(link.getAttribute("href"), url).toString();
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
