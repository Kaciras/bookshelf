import { dirname } from "./lang.js";
import { getImageResolution } from "./dom.js";

/** 页面里的网站图标元素都是 48x48 像素 */
const BEST_SIZE = 48;

/**
 * 下载并解析 URL 所指定的网页，从中读取所有的图标信息。
 *
 * 本函数从以下来源获取图标：
 * 1）页面 <head> 中的所有表示图标的 <link> 元素。
 * 2）manifest.json 的 icons 字段。
 *
 * Firefox 的实现挺复杂而且用得 C艹：
 * https://github.com/mozilla/gecko-dev/blob/master/toolkit/components/places/FaviconHelpers.cpp
 *
 * @param url 网页的 URL
 * @param signal 下载过程可以取消
 */
export async function* fetchIconLinks(url, signal) {
	const response = await fetch(url, { mode: "no-cors", signal });
	if (!response.ok) {
		throw new Error(`Request failed, status = ${response.status}`);
	}
	const parser = new DOMParser();
	const doc = parser.parseFromString(await response.text(), "text/html");
	const links = doc.head.getElementsByTagName("link");

	// 不能直接 .href 因为它会转成以本页面为基础的 URL。
	function resolveUrl(link) {
		return new URL(link.getAttribute("href"), url).toString();
	}

	let manifestURL;

	for (const link of links) {
		switch (link.rel) {
			case "manifest":
				manifestURL = resolveUrl(link);
				break;
			case "shortcut icon":
			case "icon":
			case "apple-touch-icon":
				yield {
					sizes: link.sizes,
					type: link.type,
					href: resolveUrl(link),
				};
		}
	}

	if (manifestURL) {
		yield* await fetchManifest(manifestURL, signal);
	}
}

/**
 * 支持 PWA 的网站都有一个清单，里面也有好多图标。
 *
 * @param url Manifest.json 的完整 URL
 * @param signal 取消信号
 * @see https://developer.mozilla.org/zh-CN/docs/Web/Manifest#icons
 */
async function fetchManifest(url, signal) {
	const response = await fetch(url, { mode: "no-cors", signal });
	if (!response.ok) {
		throw new Error(`Request failed, status = ${response.status}`);
	}
	const { icons = [] } = await response.json();
	const baseURL = dirname(url);

	return icons.map(icon => {
		const sizes = icon.sizes.split(" ");
		const href = new URL(icon.src, baseURL);
		return { href, sizes, type: icon.type };
	});
}

/**
 * 获取 URL 所指定的页面的图标（favicon），图标链接从页面中提取，或使用通用的约定。
 *
 * 如果有多个图标，则自动选择最佳的一个，选择规则见函数内的注释。
 *
 * 为了确保图片有效，这里会进行下载，因为有缓存所以外部再下载也没啥问题。
 *
 * @param url 页面的 URL
 * @param signal AbortSignal 取消加载页面
 * @return {Promise<string>} 图标的 URL。
 */
export async function getFaviconUrl(url, signal) {
	let selected;
	let selectedSize = Number.MAX_SAFE_INTEGER;
	let selectedSVG = false;

	for await (const link of fetchIconLinks(url, signal)) {
		const { sizes, href, type } = link;
		let size;
		let actualSize = null;

		if (selectedSVG && type !== "image/svg+xml") {
			continue; // 如果已经有 SVG 则忽略光栅图。
		}

		try {
			// 获取图片的尺寸，这里假定了图片宽高相等。
			const match = /(\d+)x(\d+)/.exec(sizes[0]);
			if (match !== null) {
				size = parseInt(match[1]);
			} else {
				actualSize = await getImageResolution(href);
				size = actualSize.width;
			}

			// 如果已有光栅图，又遇到了 SVG 则选后者。
			// 没有就先选一个。
			// 否则在尺寸至少为 48 的图中选择最小的。
			if (
				!selectedSVG && type === "image/svg+xml" ||
				!selected ||
				size >= BEST_SIZE && size < selectedSize
			) {
				// 前面没有下载的话这里补上，确保资源有效。
				if (!actualSize) {
					await getImageResolution(href);
				}
				if (size >= BEST_SIZE) {
					selectedSize = size;
				}
				selected = href;
				selectedSVG = type === "image/svg+xml";
			}
		} catch (e) {
			console.warn("Cannot load favicon", e);
		}
	}

	// 若是没有指定，则返回默认的 /favicon.ico
	return selected || new URL("/favicon.ico", url).toString();
}
