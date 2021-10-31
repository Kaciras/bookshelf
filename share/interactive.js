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
