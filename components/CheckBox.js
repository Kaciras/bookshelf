import Icon from "@assets/CheckBox.svg";
import IconChecked from "@assets/CheckBoxChecked.svg";
import styles from "./CheckBox.css";

const template = document.createElement("template");
template.innerHTML = `
	<style>${styles}</style>
	<input id="input" type="checkbox">
	<div id="icon"></div>
	<span id="label"><slot></slot></span>
`;

/*
 * 实现自定义的复选框可以参考这个教程：
 * https://developers.google.com/web/fundamentals/web-components/examples/howto-checkbox
 */

class CheckBoxElement extends HTMLElement {

	static get observedAttributes() {
		return ["checked", "disabled"];
	}

	constructor() {
		super();
		const root = this.attachShadow({ mode: "closed" });
		root.append(template.content.cloneNode(true));

		this.input = root.getElementById("input");
		this.markEl = root.getElementById("icon");

		this.addEventListener("click", this.handleClick);
		this.addEventListener("keyup", this.handleKeyup);
	}

	set checked(value) {
		this.input.checked = Boolean(value);
		this.markEl.innerHTML = value ? IconChecked : Icon;
	}

	get checked() {
		return this.input.checked;
	}

	attributeChangedCallback(name, oldValue, newValue) {
		const { input } = this;
		if (newValue === null) {
			input.removeAttribute(name);
		} else {
			input.setAttribute(name, newValue);
		}
	}

	handleClick() {
		this.toggleChecked();
	}

	handleKeyup(event) {
		if (event.key === " ") {
			event.preventDefault();
			this.toggleChecked();
		}
	}

	toggleChecked() {
		if (this.input.disabled) {
			return;
		}
		const checked = this.checked = !this.checked;
		this.dispatchEvent(new CustomEvent("change", { detail: { checked } }));
	}
}

customElements.define("check-box", CheckBoxElement);
