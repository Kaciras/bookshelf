import xIcon from "./Close.svg";
import styles from "./index.css";

const template = document.createElement("template");
template.innerHTML = `
	<style>${styles}</style>
	<div>
		<h1>编辑快捷方式</h1>
		<button id="close" type="button">${xIcon}</button>

		<div id="icon-group">
			<img id="favicon" alt="icon" src="#">
			<button id="fetch" type="button">自动获取</button>
		</div>
		<div id="field-group">
			<input name="name" placeholder="名字" required>
			<input name="url" placeholder="地址" required>
		</div>
		<div id="button-group">
			<button id="cancel" type="button">取消</button>
			<button id="accept" type="button">确定</button>
		</div>
	</div>	
`;

class EditDialogElement extends HTMLElement {

	constructor() {
		super();
		const root = this.attachShadow({ mode: "closed" });
		root.append(template.content.cloneNode(true));

		this.style.display = "none";

		this.inputEl = root.getElementById("input");
		this.iconEl = root.getElementById("favicon");

		this.inputEl.addEventListener("input", this.handleInput.bind(this));
		this.inputEl.addEventListener("keyup", this.handleKeyUp.bind(this));

		root.getElementById("cancel").addEventListener("click", this.handleResultButtonClick.bind(this));
		root.getElementById("accept").addEventListener("click", this.handleResultButtonClick.bind(this));
	}

	showDialog() {
		this.style.removeProperty("display");
		return new Promise(resolve => this.resolve = resolve);
	}

	handleResultButtonClick(event) {
		this.style.display = "none";
		this.resolve(event.target.id === "accept");
	}
}

customElements.define("edit-dialog", EditDialogElement);
