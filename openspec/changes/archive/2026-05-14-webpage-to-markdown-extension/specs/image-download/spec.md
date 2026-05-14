## ADDED Requirements

### Requirement: 后台批量下载图片
系统 SHALL 在 Background Service Worker 中通过 `fetch()` 逐一下载图片列表中的所有图片，以 ArrayBuffer 形式返回数据。

#### Scenario: 成功下载图片
- **WHEN** Background Worker 收到图片 URL 列表
- **THEN** 对每个 URL 发起 fetch 请求，成功时返回图片二进制数据和推断的文件扩展名

#### Scenario: 并发控制
- **WHEN** 页面含有超过 5 张图片
- **THEN** 系统以最大 5 个并发请求下载，避免占用过多网络资源

### Requirement: CORS 失败降级处理
系统 SHALL 对下载失败的图片（网络错误、HTTP 4xx/5xx、CORS 拒绝）不中断整体流程，降级保留原始 URL。

#### Scenario: 单张图片下载失败
- **WHEN** 某图片 fetch 返回错误或被拒绝
- **THEN** 该图片标记为"降级"状态，记录原始 URL，其余图片继续下载

#### Scenario: 所有图片均失败
- **WHEN** 所有图片 fetch 均失败
- **THEN** 生成仅含原始 URL 引用的 MD 文件，ZIP 中 images/ 文件夹为空，正常完成流程

### Requirement: 实时进度上报
系统 SHALL 在每张图片下载完成后向 Popup 上报当前进度（已完成数 / 总数）。

#### Scenario: 进度更新
- **WHEN** 第 N 张图片下载完成（成功或失败）
- **THEN** 向 Popup 发送消息 `{ done: N, total: M }`，UI 更新进度条

#### Scenario: 下载完成通知
- **WHEN** 所有图片处理完毕
- **THEN** 发送完成消息，UI 隐藏进度条并显示操作按钮

### Requirement: 从 Content-Type 推断图片扩展名
系统 SHALL 优先从图片 URL 路径推断扩展名，若 URL 无扩展名则从响应头 `Content-Type` 推断（`image/jpeg` → `.jpg`，`image/png` → `.png`，`image/webp` → `.webp`，`image/gif` → `.gif`，`image/svg+xml` → `.svg`）。

#### Scenario: 从 URL 推断扩展名
- **WHEN** 图片 URL 为 `https://cdn.example.com/photo.webp`
- **THEN** 文件扩展名为 `.webp`

#### Scenario: 从 Content-Type 推断扩展名
- **WHEN** 图片 URL 为 `https://api.example.com/image?id=123`（无扩展名），响应头 `Content-Type: image/png`
- **THEN** 文件扩展名为 `.png`
