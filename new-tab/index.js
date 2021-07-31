import "../components/dialog-base/index.js";
import "../components/book-mark/index.js";
import "../components/edit-dialog/index.js";
import "../components/search-box/index.js";
import "../components/top-site-dialog/index.js";
import "./shortcuts.js";
import settingIcon from "@assets/Setting.svg";
import checkIcon from "@assets/Check.svg";

document.getElementsByTagName("main")[0].insertBefore(
	document.createElement("search-box"),
	document.getElementById("bookmarks"),
);

browser.storage.sync.get("bookmarks").then(entries => {

});

const el = document.createElement("book-mark");
el.name = "测试测试";
el.favicon = "https://blog.kaciras.com/favicon.svg";
el.url = "https://google.com";
document.getElementById("bookmarks").append(el);

const settingEl = document.getElementById("setting");
const btn = document.createElement("button");
btn.innerHTML = settingIcon;
btn.title = "进入设置模式";
btn.onclick = () => {
	btn.style.display = "none";

};
settingEl.append(btn);
