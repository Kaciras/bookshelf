const template = document.createElement("template");
template.innerHTML = `
	<link rel="stylesheet" href="components/search-box/index.css">
	
	<button type="button">
		<img alt="icon" src="#">
		<input placeholder="搜索">
		<div id="button">按钮</div>
	</button>
	
	<ul id="suggestions"></ul>
`;

export default class SearchBoxElement extends HTMLElement {

	constructor() {
		super();
		const root = this.attachShadow({ mode: "closed" });
		root.append(template.content.cloneNode(true));

		this.inputEl = root.host.getElementsByTagName("input")[0];
		this.iconEl = root.getElementById("favicon");

		this.inputEl.addEventListener("input", this.handleInput);

		this.addEventListener("click", this.handleClick);
		this.addEventListener("keyup", this.handleKeyUp);
	}

	async handleInput() {
		const value = this.inputEl.value;
		const response = await fetch(`http://suggestqueries.google.com/complete/search?output=firefox&q=${value}`)
		if (!response.ok) {
			console.error("搜索建议错误" + response.status);
		}
		const json = await response.json();

	}
}

customElements.define("search-box", SearchBoxElement);
