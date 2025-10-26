import xIcon from "@tabler/icons/outline/x.svg";
import { i18n } from "../share/index.js";
import styles from "./DialogBase.css";

const template = document.createElement("template");
template.innerHTML = `
	<style>${styles}</style>
	<dialog closedby='any'>
		<h1></h1>
		<button
			class='plain'
			title='${i18n("Close")}'
			type='button'
		 >
			${xIcon}
		</button>
		<slot></slot>
	</dialog>
`;

/**
 * Simple wrapper of <dialog>, add a title, a close button and
 * support click the backdrop to close.
 */
class DialogBaseElement extends HTMLElement {

	static get observedAttributes() {
		return ["name"];
	}

	constructor() {
		super();
		const root = this.attachShadow({ mode: "open" });
		root.append(template.content.cloneNode(true));

		this.dialogEl = root.querySelector("dialog");
		this.titleEl = root.querySelector("h1");

		root.querySelector("button").onclick = this.close.bind(this);
	}

	get name() {
		return this.getAttribute("aria-labelledby");
	}

	set name(value) {
		this.titleEl.textContent = value;
		this.setAttribute("aria-labelledby", value);
	}

	// setAttribute() cannot be called in constructor.
	connectedCallback() {
		this.setAttribute("role", "dialog");
		this.setAttribute("aria-modal", "true");
	}

	attributeChangedCallback(name, old, value) {
		this[name] = value;
	}

	close() {
		this.dialogEl.close();
	}

	showModal() {
		this.dialogEl.showModal();
	}
}

customElements.define("dialog-base", DialogBaseElement);
