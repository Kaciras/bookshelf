const el = document.createElement("book-mark");
el.label = "测试测试";
el.favicon = "https://blog.kaciras.com/favicon.svg";
el.url = "https://google.com";
document.getElementById("bookmarks").append(el);

browser.storage.sync.get("bookmarks").then(entries => {

});
