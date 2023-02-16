import xIcon from "@tabler/icons/x.svg";
import { isPointerInside } from "@kaciras/utilities/browser";
import { i18n } from "../share/index.js";
import styles from "./DialogBase.css";

const template = document.createElement("template");
template.innerHTML = `
	<style>${styles}</style>
	<dialog>
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
		this.dialogEl.onclick = this.handleClick.bind(this);
		this.dialogEl.onpointerdown = this.handlePointerDown.bind(this);
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

	showModal() {
		this.dialogEl.showModal();
	}

	close() {
		this.dialogEl.close();
	}

	/**
	 * Detect backdrop clicks and close the dialog.
	 *
	 * https://stackoverflow.com/a/70593278/7065321
	 */
	handlePointerDown(event) {
		this.pressOutside = !isPointerInside(event);
	}

	handleClick(event) {
		if (event.target !== this.dialogEl) {
			return;
		}
		if (this.pressOutside && !isPointerInside(event)) {
			this.close();
		}
	}
}

customElements.define("dialog-base", DialogBaseElement);
