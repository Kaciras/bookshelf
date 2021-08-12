export function delegate(object, name, target, prop) {
	Object.defineProperty(object, name, {
		configurable: true,
		enumerable: true,
		get: () => target[prop],
		set: value => { target[prop] = value; },
	});
}

/**
 * 插队，先将数组中的元素移除，然后插入到指定位置。
 *
 * @param array 数组
 * @param i 原位置
 * @param j 新位置
 * @param n 移动的元素个数
 */
export function jump(array, i, j, n = 1) {
	array.splice(j, 0, ...array.splice(i,  n));
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
