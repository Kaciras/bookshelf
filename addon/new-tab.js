import "./components/book-mark/index.js";
import "./components/search-box/index.js";

document.getElementsByTagName("main")[0].insertBefore(
	document.createElement("search-box"),
	document.getElementById("bookmarks")
);

const el=document.createElement("book-mark");
el.name = "测试测试";
el.favicon = "https://blog.kaciras.com/favicon.svg";
el.url = "https://google.com";
document.getElementById("bookmarks").append(el);


