# page-extraction Specification

## Purpose
TBD - created by archiving change webpage-to-markdown-extension. Update Purpose after archive.
## Requirements
### Requirement: 智能模式提取页面正文
系统 SHALL 使用 Readability.js 从当前页面 DOM 中提取主要正文内容，去除导航栏、广告、侧边栏等噪音元素，返回清洁的 HTML 片段。

#### Scenario: 成功提取文章正文
- **WHEN** 用户在文章类页面（博客、新闻、文档）触发智能提取
- **THEN** 返回仅包含标题、正文段落、图片、代码块的 HTML，不含导航和广告

#### Scenario: Readability 提取失败回退
- **WHEN** Readability 判定页面不可提取（非文章页面）
- **THEN** 自动降级为完整页面模式并通知 UI 层

### Requirement: 完整页面模式提取
系统 SHALL 支持完整页面模式，直接使用 `document.body.innerHTML` 作为提取结果，不做内容过滤。

#### Scenario: 完整页面提取
- **WHEN** 用户选择完整页面模式
- **THEN** 返回页面 body 的完整 HTML 内容

### Requirement: 懒加载图片识别
系统 SHALL 在提取阶段扫描所有 `<img>` 元素，按优先级读取真实图片 URL：`data-src` > `data-original` > `data-lazy-src` > `srcset`（取第一项）> `src`。

#### Scenario: 识别 data-src 懒加载图片
- **WHEN** 页面中存在 `<img data-src="real.jpg" src="placeholder.gif">` 元素
- **THEN** 系统使用 `data-src` 的值作为真实图片 URL，忽略占位符

#### Scenario: 过滤无效占位图
- **WHEN** `src` 属性值为 base64 data URI 或尺寸小于等于 1px 的占位图
- **THEN** 系统跳过该图片，不将其纳入下载队列

### Requirement: 提取页面元数据
系统 SHALL 提取页面 `<title>` 标签内容作为文件命名依据，并对特殊字符（`/`、`:`、`?`、`*`、`\`、`"`、`<`、`>`、`|`）替换为 `-`，截断至 100 字符。

#### Scenario: 正常 title 提取
- **WHEN** 页面 `<title>` 为 "How to Build a Chrome Extension"
- **THEN** 文件名为 `How to Build a Chrome Extension`

#### Scenario: 特殊字符清洗
- **WHEN** 页面 `<title>` 含有 `:`、`/` 等非法文件名字符
- **THEN** 字符被替换为 `-`，结果可用作文件名

