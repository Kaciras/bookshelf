import styles from "./EngineSelect.css";

/*
 * 为了方便地用 replaceChildren 更新内容，只能多套一层。
 */
const template = document.createElement("template");
template.innerHTML = `
	<style>${styles}</style>
	<div id="container"></div>
`;

class EngineSelectElement extends HTMLElement {

	selected;
	engines;

	constructor() {
		super();
		const root = this.attachShadow({ mode: "open" });
		root.append(template.content.cloneNode(true));

		this.container = root.getElementById("container");
	}

	get value() {
		return this.engines[this.selected];
	}

	set value(value) {
		const i = this.engines.indexOf(value);
		if (i === -1) {
			throw new Error("值不在选项中");
		}
		const old = this.container.children[this.selected];
		this.selected = i;

		old?.classList.remove("active");
		this.container.children[i].classList.add("active");
	}

	get list() {
		return this.engines;
	}

	set list(value) {
		this.engines = value;
		this.render(value);
	}

	render(value) {
		const buttons = value.map(engine => {
			const img = document.createElement("img");
			img.src = engine.favicon;

			const button = document.createElement("button");
			button.type = "button";
			button.title = engine.name;
			button.engine = engine;
			button.onclick = this.handleClick.bind(this);

			button.append(img);
			return button;
		});

		this.container.replaceChildren(...buttons);
	}

	handleClick(event) {
		const { engine } = event.currentTarget;
		this.value = engine;
		this.dispatchEvent(new CustomEvent("change"));
	}
}

customElements.define("engine-select", EngineSelectElement);
