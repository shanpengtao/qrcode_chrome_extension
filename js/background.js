// 选项卡的数据源（如需增加可补充数据源及相对应的规则）
const segmentItem = {
	id: "segment0",
	label: "58同城",
	logo: "../images/logo.png",
	isShowLogoPadding: true,
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.action === "getSegmentData") {
		sendResponse({ segmentItem });
	}
});
