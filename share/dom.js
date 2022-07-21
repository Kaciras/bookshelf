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

/**
 * Download the image by url and return its width & height.
 *
 * @param url The url of the image.
 * @returns {Promise<{width: number, height: number}>}
 */
export function getImageResolution(url) {
	const element = document.createElement("img");
	element.src = url;

	return new Promise((resolve, reject) => {
		element.onerror = reject;
		element.onload = () => resolve(element);
	});
}

/**
 * Gets the element's index among all children of its parent.
 * Throw an error if the element does not have a parent.
 *
 * @param el The DOM element.
 * @return {number} The index.
 */
export function indexInParent(el) {
	return Array.prototype.indexOf.call(el.parentNode.children, el);
}
