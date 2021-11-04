import { RotateAbortController } from "@share";
import GoogleIcon from "@assets/search.ico";
import ArrowIcon from "@assets/ArrowRight.svg";
import styles from "./SearchBox.css";

// 目前仅支持一个 Google 搜索，没找到怎么获取浏览器里的搜索引擎配置。
const engine = {

	suggestAPI: "https://www.google.com/complete/search?client=firefox&q=",
	searchAPI: "https://www.google.com/search?client=firefox-b-d&q=",

	// 【关于转义】
	// 大多数地方会把空格改成 +，但实测空格也能显示正确的结果。

	async suggest(searchTerms, signal) {
		searchTerms = encodeURIComponent(searchTerms);
		const url = this.suggestAPI + searchTerms;

		// 禁止发送 Cookies 避免跟踪
		const response = await fetch(url, {
			signal,
			credentials: "omit",
		});

		const { status } = response;
		if (status !== 200) {
			throw new Error("搜索建议失败：" + status);
		}
		return (await response.json())[1];
	},

	getResultURL(searchTerms) {
		return this.searchAPI + encodeURIComponent(searchTerms);
	},
};

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
 * 搜索框，高仿 Firefox 内置样式，不过不会像它一样傻逼把输入重定向到地址栏。
 *
 * 这里不使用 Search API 因为不支持获取建议。
 * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/search
 */
class SearchBoxElement extends HTMLElement {

	constructor() {
		super();
		const root = this.attachShadow({ mode: "closed", delegatesFocus: true });
		root.append(template.content.cloneNode(true));

		this.inputEl = root.getElementById("input");
		this.iconEl = root.getElementById("favicon");
		this.boxEl = root.getElementById("box");
		this.suggestionEl = root.getElementById("suggestions");

		this.queringAborter = new RotateAbortController();
		this.limit = 8;
		this.threshold = 500;
		this.waitIME = true;
		this.index = null;

		this.suggest = this.suggest.bind(this);

		this.inputEl.onkeydown = this.handleInputKeyDown.bind(this);
		this.inputEl.oninput = this.handleInput.bind(this);
		root.addEventListener("keydown", this.handleKeyDown.bind(this));
		root.getElementById("button").onclick = this.handleSearchClick.bind(this);
	}

	get searchTerms() {
		return this.inputEl.value;
	}

	set searchTerms(value) {
		this.inputEl.value = value;
	}

	/*
	 * 对获取建议的中断分为两个阶段，先是防抖，一旦开始请求则不再受防抖的影响，
	 * 只有下一次的请求才能中断前面的。
	 *
	 * 这样的设计使得输入中途也能显示建议，并尽可能地减少了请求，与其他平台一致。
	 */
	async handleInput(event) {
		const { waitIME, threshold } = this;
		if (waitIME && event.isComposing) {
			return;
		}
		clearTimeout(this.timer);

		if (this.searchTerms) {
			this.timer = setTimeout(this.suggest, threshold);
		} else {
			this.index = null;
			this.boxEl.classList.remove("suggested");
		}
	}

	/**
	 * 从搜索引擎查询当前搜索词的建议，然后更新建议菜单。
	 * 该方法只能同时运行一个，每次调用都会取消上一次的。
	 */
	async suggest() {
		const { searchTerms, queringAborter } = this;
		const signal = queringAborter.rotate();
		try {
			const list = await engine.suggest(searchTerms, signal);
			this.setSuggestions(list);
		} catch (e) {
			if (e.name !== "AbortError") console.error(e);
		}
	}

	setSuggestions(list) {
		const count = Math.min(this.limit, list.length);
		const newItems = new Array(count);

		for (let i = 0; i < count; i++) {
			const text = list[i];

			const el = newItems[i] = document.createElement("li");
			el.textContent = text;
			el.onclick = () => location.href = engine.getResultURL(text);
		}

		this.suggestionEl.replaceChildren(...newItems);
		this.boxEl.classList.toggle("suggested", count > 0);
	}

	/**
	 * 按回车键跳转到搜索页面，同时处理了输入法的问题。
	 *
	 * 由于 compositionend 先于 KeyUp 所以只能用 KeyDown 确保能获取输入状态。
	 * Google 的搜索页面也是在 KeyDown 阶段就触发。
	 */
	handleInputKeyDown(event) {
		if (event.key !== "Enter") {
			return;
		}
		if (this.waitIME && event.isComposing) {
			return;
		}
		event.stopPropagation();
		location.href = engine.getResultURL(this.searchTerms);
	}

	// click 只由左键触发，无需检查 event.button
	handleSearchClick() {
		location.href = engine.getResultURL(this.searchTerms);
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
				return this.blur();
			default:
				return;
		}

		event.preventDefault();
		const { children } = this.suggestionEl;
		const { index } = this;
		const { length } = children;

		if (index !== null) {
			children[index].classList.remove("active");
			this.index = (index + diff + length) % length;
		} else {
			this.index = diff > 0 ? 0 : length - 1;
		}

		children[this.index].classList.add("active");
		this.searchTerms = children[this.index].textContent;
	}
}

customElements.define("search-box", SearchBoxElement);
