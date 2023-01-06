import { Debounced, i18n } from "../share/index.js";
import SearchIcon from "@tabler/icons/search.svg";
import styles from "./SearchBox.css";

const template = document.createElement("template");
template.innerHTML = `
	<style>${styles}</style>

	<img alt='icon'>
	<input
		id='input'
		enterkeyhint='search'
		placeholder='${i18n("Search")}'
	>
	<div id='spinner'/>
	<button
		id='button'
		tabindex='-1'
		title='${i18n("Search")}'
		class='plain'
		type='button'
	>
		${SearchIcon}
	</button>

	<ul id='suggestions'/>
`;

/**
 * Search box in center of the page.
 *
 * SearchBox does not have a default engine, you muse set one before entering search terms.
 *
 * We do not use the Search API, because it does not support get suggestions.
 * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/search
 */
class SearchBoxElement extends HTMLElement {

	limit = 8;		// Maximum number of suggestions.
	api;			// Backend of the engine property.
	waitIME = true;	// Don't show suggestions for uncompleted IME input.

	index = null;	// The index of the selected suggestion.

	constructor() {
		super();
		const root = this.attachShadow({ mode: "closed", delegatesFocus: true });
		root.append(template.content.cloneNode(true));

		this.inputEl = root.getElementById("input");
		this.iconEl = root.querySelector("img");
		this.loadingEl = root.getElementById("spinner");
		this.suggestionEl = root.getElementById("suggestions");

		this.fetcher = new Debounced(this.suggest.bind(this));
		this.fetcher.threshold = 500;

		this.inputEl.onkeydown = this.handleInputKeyDown.bind(this);
		this.inputEl.oninput = this.handleInput.bind(this);
		root.addEventListener("keydown", this.handleKeyDown.bind(this));
		root.getElementById("button").onclick = this.handleSearchClick.bind(this);
	}

	/**
	 * Get currently used search engine.
	 */
	get engine() {
		return this.api;
	}

	/**
	 * Change the search engine to use.
	 *
	 * @param value The new search engine
	 */
	set engine(value) {
		this.api = value;
		this.iconEl.src = value.favicon;
	}

	get searchTerms() {
		return this.inputEl.value;
	}

	set searchTerms(value) {
		this.inputEl.value = value;
	}

	get threshold() {
		return this.fetcher.threshold;
	}

	set threshold(value) {
		this.fetcher.threshold = value;
	}

	handleInput(event) {
		if (this.waitIME && event.isComposing) {
			return;
		}
		if (this.searchTerms) {
			this.fetcher.reschedule();
		} else {
			this.fetcher.stop();
			this.index = null;
			this.classList.remove("suggested");
		}
	}

	/**
	 * Fetch suggestions from search engine, and update the suggestion list.
	 *
	 * Call this method will abort the previous.
	 */
	async suggest(signal) {
		const { api, searchTerms, loadingEl } = this;
		loadingEl.classList.add("active");
		try {
			const list = await api.suggest(searchTerms, signal);
			this.setSuggestions(list);
		} catch (e) {
			if (e.name === "AbortError") {
				return;
			}
			console.error(e);
		}
		// Hide loading indicator only if finished (not aborted).
		loadingEl.classList.remove("active");
	}

	setSuggestions(list) {
		const count = Math.min(this.limit, list.length);
		const newItems = new Array(count);

		for (let i = 0; i < count; i++) {
			const text = list[i];

			const el = newItems[i] = document.createElement("li");
			el.textContent = text;
			el.onclick = () => location.href = this.api.getResultURL(text);
		}

		this.suggestionEl.replaceChildren(...newItems);
		this.classList.toggle("suggested", count > 0);
	}

	/**
	 * Press the Enter key to jump to the search page, and deal with the IME。
	 *
	 * Since compositionend precedes KeyUp, only KeyDown can be used
	 * to ensure `isComposing` is set. Google search also uses the KeyDown event.
	 */
	handleInputKeyDown(event) {
		if (event.key !== "Enter") {
			return;
		}
		if (this.waitIME && event.isComposing) {
			return;
		}
		event.stopPropagation();
		location.href = this.api.getResultURL(this.searchTerms);
	}

	handleSearchClick() {
		location.href = this.api.getResultURL(this.searchTerms);
	}

	// Input Method does not trigger this event.
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
				this.searchTerms = "";
				this.handleInput(event);
				return;
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
