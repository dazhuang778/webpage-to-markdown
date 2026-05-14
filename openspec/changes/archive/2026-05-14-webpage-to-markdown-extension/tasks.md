## 1. 项目初始化与构建配置

- [x] 1.1 初始化项目：`npm init`，配置 Vite + TypeScript，安装依赖（`@mozilla/readability`、`turndown`、`turndown-plugin-gfm`、`jszip`、`@types/chrome`）
- [x] 1.2 创建 `manifest.json`（MV3），声明权限：`activeTab`、`scripting`、`downloads`、`clipboardWrite`、`storage`
- [x] 1.3 配置 Vite 多入口构建（content script、background service worker、popup）
- [x] 1.4 创建项目目录结构：`src/content/`、`src/background/`、`src/popup/`、`public/`

## 2. Content Script：页面提取

- [x] 2.1 实现懒加载图片 URL 识别函数，按优先级扫描 `data-src` > `data-original` > `data-lazy-src` > `srcset` > `src`，过滤 base64 占位图和 1px 占位图
- [x] 2.2 实现智能提取模式：使用 Readability 提取正文 HTML，提取失败时自动降级为完整页面模式
- [x] 2.3 实现完整页面模式：直接返回 `document.body.innerHTML`
- [x] 2.4 实现页面元数据提取：获取 `<title>` 并清洗特殊字符（替换为 `-`，截断至 100 字符），获取当前页面 URL
- [x] 2.5 实现 Content Script 消息监听，响应来自 Popup 的提取请求，返回 `{ html, title, pageUrl, images: [{url, index}] }`

## 3. HTML → Markdown 转换

- [x] 3.1 初始化 Turndown 实例，加载 GFM 插件（表格、删除线、任务列表支持）
- [x] 3.2 实现图片引用替换逻辑：转换前将 img src 替换为占位符，转换后映射为 `images/img_001.jpg` 格式路径（零填充三位编号）
- [x] 3.3 实现 MD 文件头部注入：在输出 MD 开头插入 `# {title}` 和 `> 来源：{pageUrl}`
- [x] 3.4 实现"复制 MD"路径：图片使用原始 URL（不替换为本地路径），转换完成后直接写入剪贴板
- [x] 3.5 实现"下载 ZIP"路径：图片使用 `images/img_XXX.ext` 本地路径，输出 MD 文本供 ZIP 打包使用

## 4. Background Service Worker：图片下载

- [x] 4.1 实现图片下载函数：`fetch(url)` 获取 ArrayBuffer，从 URL 路径或响应头 `Content-Type` 推断扩展名
- [x] 4.2 实现并发控制：最大 5 个并发下载任务（Promise 池）
- [x] 4.3 实现单图下载失败降级：catch 错误后标记为降级状态，记录原始 URL，继续处理其余图片
- [x] 4.4 实现进度上报：每张图片完成后向 Popup 发送 `{ type: 'PROGRESS', done: N, total: M }` 消息
- [x] 4.5 实现 Background Worker 消息路由，处理来自 Popup 的 `DOWNLOAD_IMAGES` 请求，完成后返回下载结果数组

## 5. ZIP 打包与下载

- [x] 5.1 实现 JSZip 打包逻辑：创建 `{title}/article.md` 和 `{title}/images/img_XXX.ext` 条目
- [x] 5.2 处理无图片场景：ZIP 中仅含 `article.md`，不创建 `images/` 目录
- [x] 5.3 生成 ZIP Blob 并通过 `chrome.downloads.download()` 触发浏览器下载，文件名为 `{title}.zip`

## 6. Popup UI

- [x] 6.1 创建 Popup HTML + CSS：包含模式切换单选组（智能提取 / 完整页面）、"复制 MD"按钮、"下载 ZIP"按钮、进度条区域、状态文字区域
- [x] 6.2 实现模式持久化：读写 `chrome.storage.local` 保存用户选择的转换模式
- [x] 6.3 实现"复制 MD"流程：向 Content Script 请求提取 → 转换 MD（保留原始图片 URL）→ 写入剪贴板 → 显示"已复制！"反馈（1.5 秒后恢复）
- [x] 6.4 实现"下载 ZIP"流程：向 Content Script 请求提取 → 转换 MD（本地图片路径）→ 向 Background Worker 请求下载图片 → 实时更新进度条 → ZIP 打包 → 触发下载
- [x] 6.5 实现进度条组件：接收 `PROGRESS` 消息更新进度条显示，下载完成后显示"下载完成"并隐藏进度条
- [x] 6.6 实现错误处理：捕获任意步骤异常，在状态区域显示红色错误信息

## 7. 集成测试与打包

- [ ] 7.1 在 Chrome 中以开发模式加载扩展（`chrome://extensions` → 加载已解压），测试文章页面（智能提取）
- [ ] 7.2 测试非文章页面自动降级为完整页面模式
- [ ] 7.3 测试含懒加载图片的页面（如电商、图片博客），验证图片正确识别
- [ ] 7.4 测试 CORS 失败降级：验证部分图片失败时 MD 中保留原始 URL，ZIP 正常生成
- [ ] 7.5 测试大图片页面（10+ 张图），验证进度条显示正常
- [ ] 7.6 测试含特殊字符 title 的页面，验证文件名清洗逻辑
- [x] 7.7 执行 `npm run build` 生成生产包，验证扩展目录结构完整可加载
