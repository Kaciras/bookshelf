export function delegate(object, name, target, prop) {
	Object.defineProperty(object, name, {
		configurable: true,
		enumerable: true,
		get: () => target[prop],
		set: value => { target[prop] = value; },
	});
}

/**
 * 弹出文件选择框，在用户点确定之后 resolve。
 *
 * @param accept 文件类型
 * @param multiple 是否多选，如果为 true 返回文件列表，否则返回单个文件
 * @return 在用户点击确定时完成的 Promise
 */
export function openFile(accept, multiple = false) {
	const input = document.createElement("input");
	input.type = "file";
	input.accept = accept;
	input.multiple = multiple;
	input.click();

	return new Promise(resolve => input.onchange = event => {
		const { files } = event.target;
		resolve(multiple ? files : files[0]);
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
export function blobToURL(blob) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onerror = reject;
		reader.onloadend = () => resolve(reader.result);
		reader.readAsDataURL(blob);
	});
}
