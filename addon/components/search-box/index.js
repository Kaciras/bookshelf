import GoogleIcon from "./search.ico";
import Arrow from "./ArrowRight.svg";

const template = document.createElement("template");
template.innerHTML = `
	<link rel="stylesheet" href="./index.css">
	
	<div id="box">
		<img alt="icon" src="${GoogleIcon}">
		<input id="input" placeholder="搜索">
		<button id="button" type="button">${Arrow}</button>
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
		const root = this.attachShadow({ mode: "closed" });
		root.append(template.content.cloneNode(true));

		this.quering = new AbortController();
		this.inputEl = root.getElementById("input");
		this.iconEl = root.getElementById("favicon");
		this.suggestions = root.getElementById("suggestions");

		this.suggest = this.suggest.bind(this);

		this.inputEl.addEventListener("input", this.handleInput.bind(this));
		this.inputEl.addEventListener("keyup", this.handleKeyUp.bind(this));
		root.getElementById("button").addEventListener("click", this.handleClick.bind(this));
	}

	async handleInput() {
		if (!this.inputEl.value) {
			this.suggestions.innerHTML = "";
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
			console.error("搜索建议错误" + response.status);
		}
		const [, list] = await response.json();

		this.suggestions.innerHTML = "";
		for (let i = 0; i < list.length; i++) {
			const text = list[i];

			const el = document.createElement("li");
			el.textContent = text;
			el.onclick = () => location.href = searchAPI + text;
			this.suggestions.append(el);
		}
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
}

customElements.define("search-box", SearchBoxElement);
