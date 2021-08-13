import GoogleIcon from "@assets/search.ico";
import Arrow from "@assets/ArrowRight.svg";
import styles from "./index.css";

// 最多显示 8 个建议，太多反而乱而且显示不下。
const SUGGEST_LIMIT = 8;

const suggestAPI = "https://www.google.com/complete/search?client=firefox&q=";
const searchAPI = "https://www.google.com/search?client=firefox-b-d&q=";

const template = document.createElement("template");
template.innerHTML = `
	<style>${styles}</style>

	<div id="box">
		<img alt="icon" src="${GoogleIcon}">
		<input id="input" placeholder="搜索">
		<button
			id="button"
			class="plain"
			type="button"
			tabindex="-1"
		>
			${Arrow}
		</button>
	</div>

	<ul id="suggestions"></ul>
`;

/**
 * 这里不使用 Search API 因为它不支持查询建议。
 * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/search
 */
class SearchBoxElement extends HTMLElement {

	constructor() {
		super();
		const root = this.attachShadow({ mode: "closed" });
		root.append(template.content.cloneNode(true));

		this.inputEl = root.getElementById("input");
		this.iconEl = root.getElementById("favicon");
		this.boxEl = root.getElementById("box");
		this.suggestions = root.getElementById("suggestions");

		this.quering = new AbortController();
		this.suggest = this.suggest.bind(this);

		this.inputEl.oninput = this.handleInput.bind(this);
		this.inputEl.onkeyup = this.handleKeyUp.bind(this);
		this.inputEl.onblur = this.closeSuggest.bind(this);

		root.addEventListener("keydown", this.handleKeyDown.bind(this));
		root.getElementById("button").onclick = this.handleClick.bind(this);
	}

	async handleInput() {
		if (!this.inputEl.value) {
			this.closeSuggest();
		} else {
			setTimeout(this.suggest, 500);
		}
	}

	async suggest() {
		const searchTerms = this.inputEl.value;

		this.quering.abort();
		this.quering = new AbortController();
		const { signal } = this.quering;

		const response = await fetch(suggestAPI + searchTerms, { signal });
		if (!response.ok) {
			return console.error("搜索建议失败：" + response.status);
		}
		const [, list] = await response.json();

		const count = Math.min(SUGGEST_LIMIT, list.length);
		this.suggestions.innerHTML = "";
		for (let i = 0; i < count; i++) {
			const text = list[i];

			const el = document.createElement("li");
			el.textContent = text;
			el.onclick = () => location.href = searchAPI + text;
			this.suggestions.append(el);
		}

		this.boxEl.classList.add("extend");
		this.suggestions.classList.add("open");
	}

	closeSuggest() {
		this.suggestions.classList.remove("open");
		this.suggestions.innerHTML = "";
		this.index = null;
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
		let diff;

		switch (event.key) {
			case "ArrowDown":
				diff = 1;
				break;
			case "ArrowUp":
				diff = -1;
				break;
			case "Escape":
				this.closeSuggest();
				return;
			default:
				return;
		}

		event.preventDefault();
		const { children } = this.suggestions;
		const { index } = this;
		const { length } = children;

		// 如果建议被关闭了按 ↓ 即可再次打开。
		if (length === 0) {
			return diff === 1 && this.suggest();
		}

		if (Number.isInteger(index)) {
			children[index].classList.remove("active");
			this.index = (index + diff + length) % length;
		} else {
			this.index = diff > 0 ? 0 : length - 1;
		}

		children[this.index].classList.add("active");
		this.inputEl.value = children[this.index].textContent;
	}
}

customElements.define("search-box", SearchBoxElement);
