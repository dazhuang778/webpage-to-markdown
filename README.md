# Webpage to Markdown

一键将任意网页转换为 Markdown 文件的 Chrome 扩展，支持图片下载并打包为 ZIP。

## 功能特性

- **智能提取模式**：使用 Mozilla Readability 自动去除广告、导航栏等噪音，专注文章正文
- **完整页面模式**：保留页面全部内容，完整转换为 Markdown
- **图片一并下载**：自动识别并下载所有图片（含懒加载图片），与 Markdown 一起打包为 ZIP
- **实时进度显示**：多图页面下载时展示进度条
- **一键复制**：将 Markdown 直接复制到剪贴板，方便粘贴到任意编辑器
- **智能文件命名**：ZIP 文件按页面标题自动命名，图片统一命名为 `img_001.jpg` 格式
- **优雅降级**：图片因 CORS 下载失败时自动保留原始 URL，不中断整体流程

## 效果预览

点击扩展图标后弹出操作面板：

```
┌────────────────────────┐
│   网页转 Markdown       │
│                        │
│  ● 智能提取  ○ 完整页面  │
│                        │
│  [复制 MD]  [下载 MD]   │
│                        │
│  ████████░░ 下载图片 8/10│
└────────────────────────┘
```

## 安装方法

### 方式一：从源码构建

1. 克隆仓库

```bash
git clone https://github.com/dazhuang778/webpage-to-markdown.git
cd webpage-to-markdown
```

2. 安装依赖并构建

```bash
npm install
npm run build
```

3. 在 Chrome 中加载扩展
   - 打开 `chrome://extensions/`
   - 启用右上角「开发者模式」
   - 点击「加载已解压的扩展程序」
   - 选择项目根目录下的 `dist/` 文件夹

### 方式二：直接加载 dist（暂不支持 Web Store 分发）

下载 Release 中的 `dist.zip`，解压后按上述步骤第 3 步加载。

## 使用方法

1. 打开任意网页
2. 点击浏览器工具栏中的扩展图标
3. 选择转换模式：
   - **智能提取**：适合新闻文章、博客、文档等以内容为主的页面
   - **完整页面**：适合需要保留完整结构的页面（如表格、代码文档）
4. 点击 **复制 MD** 将 Markdown 复制到剪贴板，或点击 **下载 MD** 下载包含图片的 ZIP 文件

## ZIP 文件结构

```
页面标题.zip
├── 页面标题.md       # Markdown 正文（图片引用本地路径）
└── images/
    ├── img_001.jpg
    ├── img_002.png
    └── ...
```

## 技术栈

| 模块 | 技术 |
|------|------|
| 扩展标准 | Chrome Manifest V3 |
| 内容提取 | [@mozilla/readability](https://github.com/mozilla/readability) |
| HTML 转 Markdown | [Turndown](https://github.com/mixmark-io/turndown) + [turndown-plugin-gfm](https://github.com/Bonjour-Interactive-Lab/turndown-plugin-gfm) |
| ZIP 打包 | [JSZip](https://stuk.github.io/jszip/) |
| 构建工具 | Vite + TypeScript |

## 权限说明

| 权限 | 用途 |
|------|------|
| `activeTab` | 读取当前标签页内容 |
| `scripting` | 注入内容脚本提取页面 HTML |
| `downloads` | 触发 ZIP 文件下载 |
| `clipboardWrite` | 将 Markdown 写入剪贴板 |
| `storage` | 记忆上次选择的转换模式 |

## 开发

```bash
# 开发模式（监听文件变化自动重新构建）
npm run dev

# 完整构建
npm run build
```

构建产物输出到 `dist/` 目录。修改代码后需在 `chrome://extensions/` 页面点击扩展的刷新按钮。

## 已知限制

- 不支持动态加载内容（React/Vue SPA 异步渲染的内容可能无法完整获取）
- 不支持 PDF、视频等非 HTML 内容
- 不提供图床上传，图片仅支持本地打包

## License

ISC
