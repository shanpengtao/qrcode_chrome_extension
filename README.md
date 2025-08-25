# 说明
```
Chrome插件，用于生成二维码。
```

# 安装
```
Chrome扩展程序-->开发者模式-->加载已解压的扩展程序-->选择项目中「qrcode_chrome_extension.zip」
```

# 使用说明
```
1. 通过当前tab的url直接生成二维码
2. 顶部输入框：可以手动输入url来生成二维码
3. Options：打开设置，可以修改二维码颜色、是否展示logo、默认等级
```

# 文件说明
```
qrcode_chrome_extension/
├── manifest.json       # 配置文件
├── popup.html          # 弹窗页面
├── options.html        # 设置页面
├── images              # 资源文件
├── js/
│    ├── popup.js       # 弹窗
│    ├── options.js     # 设置
│    ├── background.js  # 服务
│    ├── html2canvas.js # 截图
│    └── qrcode.min.js  # 生成二维码
└── css/
     ├── popup.css      # 弹窗
     └── options.css    # 设置
```
