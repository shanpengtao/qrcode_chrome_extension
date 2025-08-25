// 选项卡的数据源（如需配置，可以在 background.js 中添加）
let segmentItem = {};

// 全局变量存储配置
let settingsCache = {
	color: "#000000",
	showLogo: "1",
	level: "M",
	selectApp: "segment0",
};

// 二维码纠错等级映射表
const correctLevelMap = {
	L: QRCode.CorrectLevel.L,
	M: QRCode.CorrectLevel.M,
	Q: QRCode.CorrectLevel.Q,
	H: QRCode.CorrectLevel.H,
};

// 上一次生成的url
let tmpUrl = "";
// 原始tab上的URL
let originUrl;

// 监听配置变化
chrome.storage.onChanged.addListener((changes, namespace) => {
	if (namespace === "local" && changes.settings) {
		settingsCache = changes.settings.newValue || settingsCache;
		console.log("配置已更新：", settingsCache);
	}
});

// 加载配置（Promise 封装）
function loadSettings() {
	return new Promise((resolve) => {
		chrome.storage.local.get("settings", (result) => {
			settingsCache = result.settings || settingsCache;
			console.log("加载配置：", settingsCache);
			resolve(settingsCache); // 配置加载完成后返回
		});
	});
}

function loadSegmentData() {
	return new Promise((resolve) => {
		// 获取app数据源并且渲染
		chrome.runtime.sendMessage({ action: "getSegmentData" }, (response) => {
			segmentItem = response.segmentItem || {};
			console.log("加载数据源：", segmentItem);
			resolve(segmentItem); // 配置加载完成后返回
		});
	});
}

// 加载完成的生命周期
document.addEventListener("DOMContentLoaded", async () => {
	// 二维码展示区域
	const canvas = document.getElementById("qr-code");
	// 切换条
	const segmentContainer = document.getElementById("segment-container");
	// 输入框
	const textarea = document.getElementById("input-text");

	// 加载配置
	await loadSettings();
	// 加载数据源
	await loadSegmentData();

	/* ======== 处理横向滑动的逻辑 start ======== */

	let isDragging = false; // 标记是否在拖拽
	let startX = 0; // 起始位置
	let scrollLeft = 0; // 容器的初始滚动位置

	// 开始拖拽
	segmentContainer.addEventListener("mousedown", (e) => {
		isDragging = true;
		startX = e.pageX - segmentContainer.offsetLeft; // 计算鼠标位置相对容器的偏移
		scrollLeft = segmentContainer.scrollLeft; // 记录初始滚动位置
		segmentContainer.style.cursor = "grabbing"; // 修改光标样式
	});

	// 拖拽中
	segmentContainer.addEventListener("mousemove", (e) => {
		if (!isDragging) return; // 如果未拖拽，直接返回
		e.preventDefault(); // 阻止默认行为（如选择文本）
		const x = e.pageX - segmentContainer.offsetLeft;
		const walk = x - startX; // 计算移动距离
		segmentContainer.scrollLeft = scrollLeft - walk; // 更新滚动位置
	});

	// 结束拖拽
	segmentContainer.addEventListener("mouseup", () => {
		isDragging = false;
		segmentContainer.style.cursor = "grab"; // 恢复光标样式
	});

	// 鼠标离开容器时停止拖拽
	segmentContainer.addEventListener("mouseleave", () => {
		isDragging = false;
		segmentContainer.style.cursor = "grab";
	});

	/* ======== 处理横向滑动的逻辑 end ======== */

	// 生成二维码
	chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		originUrl = tabs[0].url;
		let url = originUrl;
		textarea.innerText = url;

		// 默认选中第一个选项卡，并生成二维码
		updateQRCode();

		// 监听输入框
		textarea.addEventListener("input", (e) => {
			url = e.target.value;
			if (!url || url.length === 0) {
				// 当清空输入框后，将其还原为已保存的 originUrl
				// textarea.value = originUrl;
				return;
			}
			updateQRCode();
		});

		// 刷新二维码
		function updateQRCode() {
			let targetURL = url;
			// 自定义数据处理(后续可以扩展其他参数)
			var obj = {
				title: "",
				url,
			};

			if (targetURL === tmpUrl) {
				// 没有变化不重新生成，提高效率
				return;
			}
			tmpUrl = targetURL;

			const qrCodeColor = settingsCache.color || "#000000";
			const qrCodeshowLogo = settingsCache.showLogo || "1";
			const qrCodeLevel = settingsCache.level || "M";

			// 获取logo
			const logo = segmentItem.logo;
			// 是否展示loading的padding
			const isShowLogoPadding = segmentItem.isShowLogoPadding;

			// 获取画布
			const ctx = canvas.getContext("2d");

			// 清空旧二维码并生成新二维码
			canvas.innerHTML = "";
			var qrCode = new QRCode(canvas, {
				// text: targetURL.toString(),
				width: 256,
				height: 256,
				colorDark: qrCodeColor || "#000000",
				colorLight: "#ffffff",
				correctLevel: correctLevelMap[qrCodeLevel] || QRCode.CorrectLevel.M,
			});
			qrCode.makeCode(targetURL.toString());
			const logoImg = new Image();
			const logoPath = chrome.runtime.getURL("../images/logo.png");
			logoImg.src = logoPath;
			logoImg.onerror = () => {
				console.error("Logo 加载失败", logoPath);
			};

			const canvasData = qrCode._oDrawing._elCanvas; // 获取绘制的 Canvas 对象
			const dataUrl = canvasData.toDataURL(); // 转换为 base64 格式数据 URL

			const qrImage = new Image();
			qrImage.src = dataUrl;
			qrImage.onerror = () => {
				console.error("二维码图片加载失败");
			};
			qrImage.onload = () => {
				// 清除画布
				ctx.clearRect(0, 0, canvas.width, canvas.height);

				// 设置画布尺寸
				canvas.width = qrImage.width;
				canvas.height = qrImage.height;

				// 绘制二维码
				ctx.drawImage(qrImage, 0, 0);

				// 加载本地 Logo
				const logoImg = new Image();
				logoImg.src = chrome.runtime.getURL(logo); // 获取本地图片路径
				if (qrCodeshowLogo === "1") {
					logoImg.onload = () => {
						let logoSize = Math.min(canvas.width, canvas.height) * 0.2; // Logo 大小
						// 空隙大小
						const padding = isShowLogoPadding ? logoSize * 0.1 : 0;

						if (!isShowLogoPadding) {
							logoSize = logoSize + logoSize * 0.2;
						}

						// 白色背景矩形
						const bgSize = logoSize + 2 * padding; // 背景比 Logo 稍大
						const bgX = (canvas.width - bgSize) / 2; // 背景的 x 坐标
						const bgY = (canvas.height - bgSize) / 2; // 背景的 y 坐标

						// 绘制白色背景
						ctx.fillStyle = "#ffffff";
						ctx.fillRect(bgX, bgY, bgSize, bgSize);

						// 绘制 Logo
						const logoX = (canvas.width - logoSize) / 2; // Logo 的 x 坐标
						const logoY = (canvas.height - logoSize) / 2; // Logo 的 y 坐标
						ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
					};
				}
			};
		}
	});

	// 下载图片
	const downloadBtn = document.getElementById("download-btn");
	downloadBtn.addEventListener("click", () => {
		// 使用 html2canvas 截图
		html2canvas(canvas).then((canvas) => {
			// 将 canvas 转换为图片 URL
			const image = canvas.toDataURL("image/png");

			// 创建一个临时链接用于下载
			const link = document.createElement("a");
			link.href = image;
			link.download = "screenshot.png";
			link.click();
		});
	});

	document
		.getElementById("contact-link")
		.addEventListener("click", function (event) {
			// 阻止默认的跳转行为
			event.preventDefault();
			try {
				window.open("meishiim://person?201503241424345c874571");
			} catch (error) {
				console.log("打开美事失败:", error);
			}
		});
});
