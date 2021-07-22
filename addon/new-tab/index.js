import "webextension-polyfill";

import "../components/book-mark/index.js";
import "../components/edit-dialog/index.js";
import "../components/search-box/index.js";

const settingIcon = `
<svg xmlns="http://www.w3.org/2000/svg" 
	 width="24"
	 height="24"
	 viewBox="0 0 24 24" 
	 stroke-width="2"
	 stroke="currentColor" 
	 fill="none" 
	 stroke-linecap="round"
	 stroke-linejoin="round"
>
   <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
   <path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z"></path>
   <circle cx="12" cy="12" r="3"></circle>
</svg>`;

const addIcon = `
<svg xmlns="http://www.w3.org/2000/svg"
	 width="24"
	 height="24"
	 viewBox="0 0 24 24" 
	 stroke-width="2"
	 stroke="currentColor"
	 fill="none" 
	 stroke-linecap="round"
	 stroke-linejoin="round"
>
   <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
   <line x1="12" y1="5" x2="12" y2="19"></line>
   <line x1="5" y1="12" x2="19" y2="12"></line>
</svg>`;

document.getElementsByTagName("main")[0].insertBefore(
	document.createElement("search-box"),
	document.getElementById("bookmarks"),
);

browser.storage.sync.get("bookmarks");

const el=document.createElement("book-mark");
el.name = "测试测试";
el.favicon = "https://blog.kaciras.com/favicon.svg";
el.url = "https://google.com";
document.getElementById("bookmarks").append(el);


