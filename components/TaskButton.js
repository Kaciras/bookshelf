import styles from "./TaskButton.css";

const template = document.createElement("template");
template.innerHTML = `
	<style>${styles}</style>
	<slot></slot>
	<div class='dot-flashing'>
		<div class='middle'></div>
	</div>
`;

/*
 * Custom Element v1 不支持继承其他元素，如果这么做会显示不出 ShadowDOM。
 */
class TaskButtonElement extends HTMLElement {

	constructor() {
		super();
		const root = this.attachShadow({ mode: "closed" });
		root.append(template.content.cloneNode(true));

		this.slotEl = root.querySelector("slot");
		this.loadingEl = root.querySelector(".dot-flashing");
		this.loadingEl.remove();

		// ShadowDOM 是包裹内部元素的大小，小于整个按钮，所以要监听外层。
		this.addEventListener("click", this.handleClick.bind(this));
	}

	connectedCallback() {
		this.classList.add("button");
	}

	async handleClick() {
		const { slotEl, loadingEl, taskFn } = this;

		if (!taskFn) {
			return;
		}
		const { width, height } = this.getBoundingClientRect();
		this.style.width = width + "px";
		this.style.height = height + "px";
		slotEl.replaceWith(loadingEl);

		taskFn().finally(() => {
			loadingEl.replaceWith(slotEl);
			this.removeAttribute("style");
		});
	}
}

customElements.define("task-button", TaskButtonElement);
