import GoogleIcon from "@assets/search.ico";
import Arrow from "@assets/ArrowRight.svg";
import styles from "./index.css";

// 最多显示 8 个建议，太多反而乱而且显示不下。
const SUGGEST_LIMIT = 8;

const template = document.createElement("template");
template.innerHTML = `
	<style>${styles}</style>
	
	<div id="box">
		<img alt="icon" src="${GoogleIcon}">
		<input id="input" placeholder="搜索">
		<button id="button" type="button" tabindex="-1">${Arrow}</button>
	</div>
	
	<ul id="suggestions"></ul>
`;

const suggestAPI = "https://www.google.com/complete/search?client=firefox&q=";
const searchAPI = "https://www.google.com/search?client=firefox-b-d&q=";

/**
 * 这里不使用 Search API 因为它不支持查询建议。
 * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/search
 */
class SearchBoxElement extends HTMLElement {

	constructor() {
		super();
		this.quering = new AbortController();

		const root = this.attachShadow({ mode: "closed" });
		root.append(template.content.cloneNode(true));

		this.inputEl = root.getElementById("input");
		this.iconEl = root.getElementById("favicon");
		this.boxEl = root.getElementById("box");
		this.suggestions = root.getElementById("suggestions");

		this.suggest = this.suggest.bind(this);

		this.inputEl.addEventListener("input", this.handleInput.bind(this));
		this.inputEl.addEventListener("keyup", this.handleKeyUp.bind(this));
		this.inputEl.addEventListener("blur", this.closeSuggest.bind(this));

		this.addEventListener("keydown", this.handleKeyDown.bind(this));

		root.getElementById("button").addEventListener("click", this.handleClick.bind(this));
	}

	async handleInput() {
		if (!this.inputEl.value) {
			this.closeSuggest();
		} else {
			setTimeout(this.suggest, 500);
		}
	}

	async suggest() {
		this.quering.abort();
		this.quering = new AbortController();
		const { value } = this.inputEl;
		const { signal } = this.quering;

		const response = await fetch(suggestAPI + value, { signal });
		if (!response.ok) {
			console.error("搜索建议失败：" + response.status);
		}
		const [, list] = await response.json();

		this.suggestions.innerHTML = "";
		this.boxEl.classList.add("extend");

		const count = Math.min(SUGGEST_LIMIT, list.length);
		for (let i = 0; i < count; i++) {
			const text = list[i];

			const el = document.createElement("li");
			el.textContent = text;
			el.onclick = () => location.href = searchAPI + text;
			this.suggestions.append(el);
		}
	}

	closeSuggest() {
		this.suggestions.innerHTML = "";
		this.boxEl.classList.remove("extend");
	}

	handleKeyUp(event) {
		if (event.key !== "Enter") {
			return;
		}
		event.stopPropagation();
		location.href = searchAPI + this.inputEl.value;
	}

	handleClick(event) {
		if (event.button !== 0) {
			return;
		}
		location.href = searchAPI + this.inputEl.value;
	}

	handleKeyDown(event) {
		const oldSuggest = this.selected;

		switch (event.key) {
			case "ArrowDown":
				this.selected = oldSuggest
					? oldSuggest.nextElementSibling
					: this.suggestions.firstElementChild;
				break;
			case "ArrowUp":
				this.selected = oldSuggest
					? oldSuggest.previousElementSibling
					: this.suggestions.lastElementChild;
				break;
			case "Escape":
				this.closeSuggest();
				return;
			default:
				return;
		}

		event.preventDefault();
		this.inputEl.value = this.selected.textContent;
		this.selected.classList.add("active");
		oldSuggest?.classList.remove("active");
	}
}

customElements.define("search-box", SearchBoxElement);
