import Icon from "@assets/CheckBox.svg";
import IconChecked from "@assets/CheckBoxChecked.svg";
import { delegate } from "@share";
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
		return ["checked", "disabled", "name"];
	}

	constructor() {
		super();
		const root = this.attachShadow({ mode: "closed" });
		root.append(template.content.cloneNode(true));

		this.inputEl = root.getElementById("input");
		this.markEl = root.getElementById("icon");

		delegate(this, "name", this.inputEl, "name");

		this.addEventListener("keyup", this.handleKeyup);
		this.addEventListener("click", this.toggleChecked);
	}

	set checked(value) {
		this.inputEl.checked = Boolean(value);
		this.markEl.innerHTML = value ? IconChecked : Icon;
	}

	get checked() {
		return this.inputEl.checked;
	}

	attributeChangedCallback(name, oldValue, newValue) {
		const { inputEl } = this;
		if (newValue === null) {
			inputEl.removeAttribute(name);
		} else {
			inputEl.setAttribute(name, newValue);
		}
	}

	handleKeyup(event) {
		if (event.key === " ") {
			event.preventDefault();
			this.toggleChecked();
		}
	}

	toggleChecked() {
		if (this.inputEl.disabled) {
			return;
		}
		this.checked = !this.checked;
		this.dispatchEvent(new CustomEvent("input"));
	}
}

// 尽量跟原生的 input 属性保持一致，在一些场合可以减少无聊的判断。
CheckBoxElement.prototype.type = "checkbox";

customElements.define("check-box", CheckBoxElement);
