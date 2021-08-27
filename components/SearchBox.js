import GoogleIcon from "@assets/search.ico";
import ArrowIcon from "@assets/ArrowRight.svg";
import styles from "./SearchBox.css";

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
			tabindex="-1"
			title="搜索"
			class="plain"
			type="button"
		>
			${ArrowIcon}
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
		this.threshold = 500;
		this.waitIME = true;
		this.updateSuggestions = this.updateSuggestions.bind(this);

		/*
		 * 实现点击搜索框外时关闭建议列表的功能。
		 *
		 * 无论是 blur 事件还是 :focus 伪类的触发都先于 click 事件，导致点击建议项时无法跳转，
		 * 因为此时建议列表已经关闭了。
		 *
		 * 所以换了种思路，监听全局 click 并排除本元素内触发的，我看 Edge 也是这么做的。
		 */
		window.addEventListener("click", event => {
			if (event.target !== this) this.setSuggestVisible(false);
		});

		this.inputEl.oninput = this.handleInput.bind(this);
		this.inputEl.onkeyup = this.handleKeyUp.bind(this);
		this.inputEl.onfocus = () => this.setSuggestVisible(true);

		// 这俩没有 onXXX 格式
		this.inputEl.addEventListener("compositionstart", () => this.isIMEInput = true);
		this.inputEl.addEventListener("compositionend", () => this.isIMEInput = false);

		root.addEventListener("keydown", this.handleKeyDown.bind(this));
		root.getElementById("button").onclick = this.handleSearchClick.bind(this);
	}

	/*
	 * 建议列表的显示由两个类控制：
	 * 1）suggested 表示列表拥有项目，在获取建议后设置，当输入框为空时删除。
	 * 2）focused 表示聚焦，在失去焦点时删除。
	 *
	 * 这两个类分别表示两个独立的条件，仅当同时存在建议列表才会显示。
	 */

	setSuggestVisible(value) {
		const { classList } = this.boxEl;
		value ? classList.add("focused") : classList.remove("focused");
	}

	/*
	 * 对获取建议的中断分为两个阶段，先是防抖，一旦开始请求则不再受防抖的影响，
	 * 只有下一次的请求才能中断前面的。
	 * 这样的设计使得输入中途也能显示建议，并尽可能地减少了请求，与其他平台一致。
	 */
	async handleInput() {
		const { waitIME, isIMEInput, threshold } = this;
		if (waitIME && isIMEInput) {
			return;
		}
		if (this.inputEl.value) {
			clearTimeout(this.timer);
			this.timer = setTimeout(this.updateSuggestions, threshold);
		} else {
			this.index = null;
			this.boxEl.classList.remove("suggested");
		}
	}

	async updateSuggestions() {
		const searchTerms = this.inputEl.value;

		this.quering.abort();
		this.quering = new AbortController();

		// 禁止发送 Cookies 避免跟踪
		const response = await fetch(suggestAPI + searchTerms, {
			credentials: "omit",
			signal: this.quering.signal,
		});
		if (!response.ok) {
			return console.error("搜索建议失败：" + response.status);
		}

		const [, list] = await response.json();
		const count = Math.min(SUGGEST_LIMIT, list.length);
		const newItems = new Array(count);

		for (let i = 0; i < count; i++) {
			const text = list[i];

			const el = newItems[i] = document.createElement("li");
			el.textContent = text;
			el.onclick = () => location.href = searchAPI + text;
		}

		if (count > 0) {
			this.boxEl.classList.add("suggested");
		}
		this.suggestions.replaceChildren(...newItems);
	}

	handleKeyUp(event) {
		if (event.key !== "Enter") {
			return;
		}
		event.stopPropagation();
		location.href = searchAPI + this.inputEl.value;
	}

	// click 只由左键触发，无需检查 event.button
	handleSearchClick() {
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
				this.setSuggestVisible(false);
				return;
			default:
				return;
		}

		event.preventDefault();
		const { children } = this.suggestions;
		const { index } = this;
		const { length } = children;

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
