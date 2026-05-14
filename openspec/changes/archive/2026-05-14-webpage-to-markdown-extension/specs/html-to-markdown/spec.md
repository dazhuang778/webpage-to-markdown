## ADDED Requirements

### Requirement: 标准 Markdown 转换
系统 SHALL 使用 Turndown + turndown-plugin-gfm 将 HTML 转换为标准 GitHub Flavored Markdown，支持标题、段落、粗体、斜体、链接、有序/无序列表、代码块、表格、引用块。

#### Scenario: 基础元素转换
- **WHEN** 输入包含 `<h1>`、`<p>`、`<strong>`、`<a>` 的 HTML
- **THEN** 输出对应的 `#`、段落文本、`**粗体**`、`[文字](url)` Markdown 语法

#### Scenario: 表格转换
- **WHEN** 输入包含 `<table>` 元素
- **THEN** 输出 GFM 格式的 Markdown 表格（含对齐分隔行）

#### Scenario: 代码块转换
- **WHEN** 输入包含 `<pre><code>` 或带 language class 的代码块
- **THEN** 输出带语言标识的 ` ``` ` 围栏代码块

### Requirement: 图片引用路径替换
系统 SHALL 在 HTML→MD 转换过程中，将所有图片的 `src` 替换为本地相对路径 `images/img_001.jpg` 格式（按页面顺序编号，扩展名从原始 URL 或 Content-Type 推断）。

#### Scenario: 图片路径替换
- **WHEN** HTML 中存在 `<img src="https://example.com/photo.jpg" alt="示例">` 
- **THEN** MD 输出为 `![示例](images/img_001.jpg)`

#### Scenario: 无法确定扩展名时的回退
- **WHEN** 图片 URL 不含扩展名且 Content-Type 未知
- **THEN** 默认使用 `.jpg` 扩展名

### Requirement: 保留页面标题作为 MD 一级标题
系统 SHALL 在 Markdown 内容开头插入页面 `<title>` 作为 `# 标题`，随后附加原始 URL 作为来源引用。

#### Scenario: MD 文件头部结构
- **WHEN** 转换任意页面
- **THEN** MD 文件首行为 `# {页面title}`，第二行为 `> 来源：{页面URL}`

### Requirement: 处理 CORS 降级图片的引用
系统 SHALL 对下载失败、以原始 URL 降级的图片，在 MD 中保留原始 URL 引用而非本地路径。

#### Scenario: 降级图片在 MD 中的引用
- **WHEN** 某张图片因 CORS 或网络错误无法下载
- **THEN** MD 中该图片引用为 `![alt](https://original-url.com/image.jpg)`（原始 URL）
