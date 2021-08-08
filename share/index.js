export function delegate(object, name, target, prop) {
	Object.defineProperty(object, name, {
		configurable: true,
		enumerable: true,
		get: () => target[prop],
		set: value => { target[prop] = value; },
	});
}

/**
 * 将 Blob 对象转为 base64 编码的 Data-URL 字符串。
 *
 * 【其他方案】
 * 如果可能，使用 URL.createObjectURL + URL.revokeObjectURL 性能更好。
 *
 * @param blob Blob对象
 * @return Data-URL 字符串
 */
export function blobToBase64URL(blob) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onerror = reject;
		reader.onloadend = () => resolve(reader.result);
		reader.readAsDataURL(blob);
	});
}

// TODO: 跟 Rollup 插件里重复，但那边目前没法用 ESModule 只能分开了。
const encodeMap = {
	'"': "'",
	"%": "%25",
	"#": "%23",
	"{": "%7B",
	"}": "%7D",
	"<": "%3C",
	">": "%3E",
};

export function encodeSVG(code) {
	return code.replaceAll(/["%#{}<>]/g, v => encodeMap[v]);
}

/**
 * 获取元素在其父元素的所有子元素中的位置。
 *
 * @param el DOM 元素
 * @return {number} 位置，如果没有父元素则出错。
 */
export function indexOfParent(el) {
	return Array.prototype.indexOf.call(el.parentNode.children, el);
}
