document.addEventListener("DOMContentLoaded", function async() {
	// 获取app数据源并且渲染
	// chrome.runtime.sendMessage({ action: "getSegmentData" }, (response) => {
	// const segmentData = response.segmentData || [];
	// 获取 select 容器
	// const selectElement = document.getElementById("which-app-select");
	// 清空 select 的内容（防止重复插入）
	// selectElement.innerHTML = "";
	// 遍历 segmentData 生成选项
	// segmentData.forEach((segment) => {
	// 	const optionElement = document.createElement("option");
	// 	optionElement.value = segment.id; // 设置选项的值
	// 	optionElement.textContent = segment.label; // 设置选项的显示文字

	// 	// 如果有 disabled 属性，设置为禁用状态
	// 	if (segment.disabled) {
	// 		optionElement.disabled = true;
	// 	}
	// 	// 将选项添加到 select 中
	// 	selectElement.appendChild(optionElement);
	// });

	// 在所有 options 添加完之后，再执行后续代码
	// 	handleSettings(); // 调用后续操作的函数
	// });

	// 联系人
	// const contactElement = document.getElementById("contact");
	// 颜色
	const colorElement = document.getElementById("color");
	// 保存按钮
	const submitElement = document.getElementById("submit");

	function handleSettings() {
		// 读取缓存配置并且渲染
		chrome.storage.local.get("settings", (result) => {
			const settings = result.settings || {};
			console.log("获取缓存数据：", result.settings);

			//二维码颜色，默认黑色
			colorElement.value = settings.color || "#000000";

			// 是否展示logo，默认展示
			const showLogoValue = settings.showLogo || "1";
			// 根据存储的值设置对应的单选框为选中状态
			const logoButtons = document.getElementsByName("showLogo");
			for (const logoRadio of logoButtons) {
				logoRadio.checked = `${logoRadio.value}` === `${showLogoValue}`;
			}

			// 二维码等级
			const level = settings.level || "M";
			// 二维码纠错等级
			const selectElement = document.getElementById("eclevel");
			for (const optionElement of selectElement.options) {
				if (optionElement.value === level) {
					optionElement.selected = true;
				} else {
					optionElement.removeAttribute("selected");
				}
			}

			// 默认选择app
			const selectApp = settings.selectApp || "segment0";
			const selectAppElement = document.getElementById("which-app-select");
			console.log(
				settings.selectApp,
				selectAppElement,
				selectAppElement.options
			);
			for (const optionElement of selectAppElement.options) {
				console.log(optionElement.value);

				if (optionElement.value === selectApp) {
					optionElement.selected = true;
				} else {
					optionElement.removeAttribute("selected");
				}
			}
		});
	}

	// 保存配置
	submitElement.addEventListener("click", (event) => {
		event.preventDefault(); // 阻止表单默认提交

		// 是否展示logo
		const showLogo = document.querySelector(
			'input[name="showLogo"]:checked'
		).value;

		// 二维码质量等级
		console.log(document.getElementById("eclevel"));
		console.log(document.querySelector("which-app-select"));

		const levelValue = document.getElementById("eclevel").value;

		// 默认选择app
		// const selectAppValue = document.getElementById("which-app-select").value;

		const settings = {
			showLogo: showLogo,
			color: colorElement.value,
			level: levelValue,
			// selectApp: selectAppValue,
		};

		console.log("缓存数据：", settings);

		chrome.storage.local.set({ settings }, () => {
			showToast("保存成功！");
		});
	});
});

// 提示框
function showToast(message) {
	// 创建div元素
	const toast = document.createElement("div");
	toast.textContent = message;

	// 设置样式
	toast.style.position = "fixed";
	toast.style.top = "calc(50%)";
	toast.style.left = "50%";
	// 使用CSS3的transform属性来将元素向左和向上移动其自身宽度/高度的一半，从而实现居中
	toast.style.transform = "translate(-50%, -50%)";
	toast.style.padding = "15px";
	toast.style.fontSize = "18px";
	toast.style.background = "rgba(0, 0, 0, 0.6)";
	toast.style.color = "white";
	toast.style.borderRadius = "2px";
	toast.style.opacity = 0;

	// 添加到文档中
	document.body.appendChild(toast);

	// 渐显动画
	setTimeout(function () {
		toast.style.opacity = 1;
	}, 100);

	// 1.5秒后消失
	setTimeout(function () {
		toast.style.opacity = 0;
		setTimeout(function () {
			document.body.removeChild(toast);
		}, 500);
	}, 1500);
}
