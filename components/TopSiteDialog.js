import AddIcon from "@tabler/icons/plus.svg";
import CheckIcon from "@tabler/icons/check.svg";
import { i18n } from "@share";
import { defaultFavicon } from "../new-tab/storage.js";
import styles from "./TopSiteDialog.css";

/**
 * Use second level domain for title if it's not present.
 * If the domain has only 1 level, just return it.
 *
 * e.g.
 * "www.example.com" -> "example",
 * "localhost" -> "localhost"
 *
 * @param url The URL of the site
 * @return {string} SLD of TLD if the domain has only 1 level.
 */
function adviceTitle(url) {
	const { hostname } = new URL(url);
	const parts = hostname.split(".");
	const top = parts.pop();
	return parts.length ? parts.pop() : top;
}

const template = document.createElement("template");
template.innerHTML = `
	<style>${styles}</style>
	<dialog-base name='${i18n("TopSiteDialog")}'>
		<ul id='top-sites'></ul>
	</dialog-base>
`;

const itemTemplate = document.createElement("template");
itemTemplate.innerHTML = `
	<li>
		<img alt='favicon'>
		<span></span>
		<span class='url'></span>
		<button
			class='icon'
			title='${i18n("AddToShortcut")}'
		 >
			${AddIcon}
		</button>
	</li>
`;

/**
 * Add shortcuts from browser builtin navigation page.
 *
 * <h2>API Note</h2>
 * browser.topSites is readonly，so we need implement our shortcut storage，
 */
class TopSiteDialogElement extends HTMLElement {

	constructor() {
		super();
		const root = this.attachShadow({ mode: "closed" });
		root.append(template.content.cloneNode(true));

		this.listEl = root.getElementById("top-sites");
		this.dialogEl = root.querySelector("dialog-base");
	}

	async show() {
		// Firefox has an options parameter but Edge has not.
		const sites = browser.topSites.get.length > 0
			? await browser.topSites.get({
				newtab: true,
				includeFavicon: true,
			})
			: await browser.topSites.get();

		if (import.meta.env.dev) {
			console.debug("topSites.get return:", sites);
		}

		const listItems = new Array(sites.length);

		for (let i = 0; i < sites.length; i++) {
			let { title, url, favicon } = sites[i];

			// Can't use default value of destructuring as it only caused by undefined.
			favicon ??= defaultFavicon;
			url = decodeURI(url);

			// Title may be empty, so use ||= instead of ??=
			title ||= adviceTitle(url);

			const fragment = itemTemplate.content.cloneNode(true);
			const item = listItems[i] = fragment.firstChild;

			item.children[0].src = favicon;
			item.children[1].textContent = title;
			item.children[2].textContent = url;
			item.children[3].onclick = async () => {
				const event = new CustomEvent("add", {
					bubbles: true,
					detail: {
						label: title,
						url,
						favicon,
						iconUrl: favicon,
					},
				});
				if (this.dispatchEvent(event)) {
					item.classList.add("added");
					item.children[3].innerHTML = CheckIcon;
				}
			};
		}

		this.listEl.replaceChildren(...listItems);
		this.dialogEl.showModal();
	}
}

customElements.define("top-site-dialog", TopSiteDialogElement);
