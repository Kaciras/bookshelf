/**
 * 将输入组件的值与另一个对象的属性绑定。
 * 属性名等于输入组件的 name 属性，监听使用 input 事件。
 *
 * @param input 输入组件，必须有 name 和 type 属性。
 * @param receiver 要绑定的对象
 */
export function bindInput(input, receiver) {
	const { type, name } = input;
	let prop;

	switch (type) {
		case "number":
			prop = "valueAsNumber";
			break;
		case "checkbox":
			prop = "checked";
			break;
		default:
			prop = "value";
			break;
	}

	input[prop] = receiver[name];
	input.addEventListener("input", event => {
		receiver[name] = event.target[prop];
	});
}

export function getImageResolution(url) {
	const element = document.createElement("img");
	element.src = url;

	return new Promise((resolve, reject) => {
		element.onerror = reject;
		element.onload = () => resolve(element);
	});
}

/**
 * 获取元素在其父元素的所有子元素中的位置。
 *
 * @param el DOM 元素
 * @return {number} 位置，如果没有父元素则出错。
 */
export function indexInParent(el) {
	return Array.prototype.indexOf.call(el.parentNode.children, el);
}
