import { dirname, fetchChecked } from "./lang.js";
import { getImageResolution } from "./dom.js";

/**
 *
 * @param pageURL The URL of the page
 * @param signal
 */
export async function metaScraper(pageURL, signal) {
	const html = await (await fetchChecked(pageURL, signal)).text();
	const doc = new DOMParser().parseFromString(html, "text/html");

	function resolveUrl(link) {
		// Don't use .href as it returns absolute URL based on our page。
		return new URL(link.getAttribute("href"), pageURL).toString();
	}

	/**
	 * This function gets favicons of the page from the following sources:
	 * 1）<link> elements in the <head>.
	 * 2）icons property in PWA manifest。
	 */
	async function* fetchIconLinks() {
		const links = doc.head.getElementsByTagName("link");
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
			yield* await searchManifest(manifestURL, signal);
		}
	}

	/**
	 * PWA manifest may contain HD favicons, add them to candidate list.
	 *
	 * @param url The URL of the manifest.json.
	 * @see https://developer.mozilla.org/zh-CN/docs/Web/Manifest#icons
	 */
	async function searchManifest(url) {
		const response = await fetchChecked(url, { signal });
		const { icons = [] } = await response.json();
		const baseURL = dirname(url);

		return icons.map(icon => {
			const sizes = icon.sizes.split(" ");
			const href = new URL(icon.src, baseURL);
			return { href, sizes, type: icon.type };
		});
	}

	/**
	 * Extract the best favicon of specified page. see the comments in
	 * the function for the strategy.
	 *
	 * To get the real size, favicons can be downloaded. Because browsers have cache,
	 * downloading them again will not produce any additional traffic.
	 *
	 * @param bestSize The size of the icon you want to download.
	 * @return {Promise<string>} URL of the favicon, may not exist.
	 */
	async function selectFavicon(bestSize) {
		let selected;
		let selectedSize = Number.MAX_SAFE_INTEGER;
		let selectedSVG = false;

		for await (const link of fetchIconLinks(signal)) {
			const { sizes, href, type } = link;
			let size;
			let actualSize = null;

			if (selectedSVG && type !== "image/svg+xml") {
				continue; // Ignore raster images if there are SVG。
			}

			try {
				// Assume the image has same width and height.
				const match = /(\d+)x(\d+)/.exec(sizes[0]);
				if (match !== null) {
					size = parseInt(match[1]);
				} else {
					actualSize = await getImageResolution(href);
					size = actualSize.width;
				}

				/*
				 * 1) SVG is better than raster image.
				 * 2) Choose one first.
				 * 3) Choose the smallest among larger than bestSize.
				 */
				if (
					!selectedSVG && type === "image/svg+xml" ||
					!selected ||
					size >= bestSize && size < selectedSize
				) {
					// Ensure the file is available。
					if (!actualSize) {
						await getImageResolution(href);
					}
					if (size >= bestSize) {
						selectedSize = size;
					}
					selected = href;
					selectedSVG = type === "image/svg+xml";
				}
			} catch (e) {
				console.warn(`Cannot load favicon ${href}`, e);
			}
		}

		// If no links in page, return /favicon.ico
		return selected || new URL("/favicon.ico", pageURL).toString();
	}

	return { html, doc, selectFavicon, fetchIconLinks };
}
