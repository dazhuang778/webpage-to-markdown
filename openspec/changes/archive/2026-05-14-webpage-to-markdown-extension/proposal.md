## Why

将网页内容手动整理为 Markdown 文件耗时且容易遗漏内容，尤其当需要将文章喂给大模型分析或保存到 Obsidian 等笔记软件时，缺乏一键完成的工具。该扩展解决"从网页到结构化 Markdown 的最后一公里"问题。

## What Changes

- 新增 Chrome 浏览器扩展（Manifest V3），用户点击图标即可触发转换
- 提供两种转换模式：**智能提取**（Readability 去掉导航/广告噪音）和**完整页面**（全 DOM 转换）
- 图片全量下载并随 Markdown 打包为 ZIP 文件（`images/img_001.jpg` 格式本地引用）
- 识别懒加载图片（`data-src`、`data-original` 等属性）
- 图片 CORS 下载失败时自动降级为保留原始 URL，不中断流程
- 支持两种输出：复制 MD 到剪贴板、下载 ZIP 压缩包
- 多图页面下载时显示实时进度条
- 文件命名使用页面 `<title>`

## Capabilities

### New Capabilities

- `page-extraction`: 从当前网页 DOM 提取结构化内容，支持智能模式（Readability）和完整页面模式，处理懒加载图片识别
- `html-to-markdown`: 将提取的 HTML 转换为标准 Markdown，包含标题、段落、链接、表格、代码块等完整元素支持
- `image-download`: 后台批量下载页面图片，处理 CORS 失败降级，提供实时进度反馈
- `zip-packaging`: 将 Markdown 文件与图片文件夹打包为 ZIP，按页面 title 命名
- `extension-ui`: 扩展 Popup 界面，提供模式切换、进度显示、复制/下载操作

### Modified Capabilities

## Impact

- **新增依赖**：`@mozilla/readability`、`turndown`、`turndown-plugin-gfm`、`jszip`
- **构建工具**：Vite + TypeScript，输出 Chrome Extension 标准目录结构
- **权限需求**：`activeTab`、`downloads`、`clipboardWrite`、`scripting`
- **不影响任何现有代码**（全新项目）
