## Context

全新 Chrome 扩展项目，无历史代码。目标用户：需要将网页内容转为 Markdown 的研究人员、笔记用户和 AI 工作流使用者。核心约束：Chrome MV3 强制要求（MV2 即将停止支持）；图片跨域下载必须在 Background Service Worker 中执行；输出须为标准 Markdown 以兼容所有笔记软件和 LLM。

## Goals / Non-Goals

**Goals:**
- 从任意网页一键提取内容并转为标准 Markdown
- 图片完整下载并打包 ZIP，保证离线可用
- 两种提取模式满足不同网页类型需求
- 进度可见，失败优雅降级

**Non-Goals:**
- 不处理动态加载/无限滚动内容（SPA 动态内容暂不支持）
- 不支持 Obsidian wikilink 格式（使用标准 MD）
- 不提供图床上传功能
- 不处理 PDF、视频等非 HTML 内容

## Decisions

### 决策 1：Manifest V3（而非 MV2）

**选择**：Manifest V3

**理由**：Chrome Web Store 已停止接受 MV2 新扩展，现有 MV2 扩展将在 2025 年后停止支持。MV3 的 Service Worker 生命周期虽有限制，但图片下载任务通过 `chrome.downloads` API 可以完成。

**替代方案**：MV2 — 更宽松但已被废弃，不考虑。

---

### 决策 2：图片在 Background Service Worker 中下载（而非 Content Script）

**选择**：Background Service Worker 使用 `fetch()` 下载图片

**理由**：Content Script 的 `fetch()` 受页面 CORS 策略限制，大量图片会被拒绝。Background Worker 的网络请求不受 CORS 限制（扩展上下文），成功率显著更高。

**数据流**：
```
Content Script
  └─ 收集 img URL 列表
  └─ postMessage → Background Worker
        └─ 逐个 fetch(url) as ArrayBuffer
        └─ 成功 → 传回 blob data
        └─ 失败 → 传回原始 URL（降级）
  └─ JSZip 打包
  └─ 触发下载
```

**替代方案**：Content Script 直接 fetch — CORS 失败率高，不选。

---

### 决策 3：Readability.js + Turndown 组合（而非单一库）

**选择**：`@mozilla/readability`（提取）+ `turndown` + `turndown-plugin-gfm`（转换）

**理由**：
- Readability 是 Firefox 阅读模式的核心，文章提取质量最高
- Turndown 对 HTML→MD 转换最成熟，GFM 插件补充表格支持
- 两者分工明确：Readability 负责"提取什么"，Turndown 负责"如何转换"

**完整页面模式**：跳过 Readability，直接将 `document.body.innerHTML` 传给 Turndown。

**替代方案**：`html-to-md` 单一库 — 不具备文章提取能力，不选。

---

### 决策 4：JSZip 在渲染进程打包（而非原生 Downloads API 分别下载）

**选择**：JSZip 在 Background Worker 中内存组装 ZIP，一次性下载

**理由**：用户体验更好（一个文件），目录结构（`images/`）清晰，Obsidian vault 导入友好。

**替代方案**：MD 和图片分别下载多个文件 — 用户体验差，不选。

---

### 决策 5：懒加载图片识别策略

扫描以下属性作为真实图片 URL 来源（优先级从高到低）：
1. `data-src`
2. `data-original`
3. `data-lazy-src`
4. `data-srcset` / `srcset`（取第一个 URL）
5. 回退到 `src`（排除 base64 占位图和 1px 占位图）

---

### 决策 6：图片顺序命名

所有图片按页面出现顺序重命名为 `img_001.jpg`、`img_002.png` 等，扩展名从原始 URL 或 Content-Type 推断。

**理由**：避免文件名冲突；路径简洁；MD 引用可预测。

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| 部分图片服务器验证 Referer，Background Worker fetch 仍失败 | 降级保留原始 URL，MD 可正常阅读 |
| 页面图片数量极多（50+）时 ZIP 内存占用高 | 进度条提示用户；未来可加并发限制 |
| Readability 对非文章页面（如首页、搜索结果）提取效果差 | 提供完整页面模式兜底 |
| Service Worker 被浏览器在下载过程中终止 | 使用 `chrome.downloads` API（不依赖 SW 生命周期）触发最终下载 |
| MV3 `scripting` 权限注入 Content Script 需要 `activeTab` | 明确在 manifest 中声明，用户安装时授权 |

## Open Questions

- 是否需要支持 `<picture>` 元素的多源图片（`srcset` 选最优分辨率）？— 初版按最简单策略处理（取第一个 URL）
- 页面 title 含特殊字符（`/`、`:`、`?`）时的文件名清洗规则？— 替换为 `-`，长度截断至 100 字符
