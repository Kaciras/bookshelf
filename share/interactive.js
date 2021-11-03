/**
 * 触发下载文件，该函数立即返回，无法得知用户是否真的下载了。
 *
 * @param blob 文件数据 Blob 对象。
 * @param name 文件名，如果没有则尝试使用 blob 的名字。
 */
export function saveFile(blob, name) {
	const a = document.createElement("a");
	a.download = name ?? blob.name;
	a.href = URL.createObjectURL(blob);

	// click() 立即返回但下载仍然成功，
	// 推测在数据在 revoke 前就已经使用了。
	try {
		a.click();
	} finally {
		URL.revokeObjectURL(a.href);
	}
}

/**
 * 弹出文件选择框并等待完成，当用户点击确定后返回选中的文件。
 *
 * <h1>注意事项</h1>
 * 由于没有办法检测是否取消选择，如果取消，则 Promise 不会 resolve。
 *
 * @param accept 应该选择的文件类型
 * @param multiple 是否多选
 * @return 一个 Promise，将在用户点击确定时完成
 */
export function selectFile(accept, multiple = false) {
	const input = document.createElement("input");
	input.type = "file";
	input.accept = accept;
	input.multiple = multiple;
	input.click();

	return new Promise((resolve, reject) => {
		input.onerror = reject;
		input.onchange = e => resolve(e.target.files);
	});
}
