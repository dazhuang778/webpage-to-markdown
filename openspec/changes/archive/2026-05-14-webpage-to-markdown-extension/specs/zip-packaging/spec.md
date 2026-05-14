## ADDED Requirements

### Requirement: 打包 ZIP 文件
系统 SHALL 使用 JSZip 将 Markdown 文件和所有成功下载的图片打包为单个 ZIP 文件，ZIP 内顶层目录使用页面 title（清洗后）命名。

#### Scenario: 标准 ZIP 结构生成
- **WHEN** 页面 title 为 "My Article"，含 3 张图片
- **THEN** ZIP 结构为：
  ```
  My Article/
    article.md
    images/
      img_001.jpg
      img_002.png
      img_003.webp
  ```

#### Scenario: 无图片页面
- **WHEN** 页面不含任何图片
- **THEN** ZIP 结构为：
  ```
  My Article/
    article.md
  ```
  不包含 images/ 目录

### Requirement: ZIP 文件命名
系统 SHALL 将 ZIP 文件命名为 `{清洗后的页面title}.zip`，与 ZIP 内顶层目录名一致。

#### Scenario: ZIP 文件命名
- **WHEN** 页面 title 为 "How to: Build Extensions"
- **THEN** 下载的文件名为 `How to- Build Extensions.zip`

### Requirement: 触发浏览器下载
系统 SHALL 通过 `chrome.downloads.download()` API 将生成的 ZIP Blob 触发为浏览器文件下载，保存到用户默认下载目录。

#### Scenario: 下载触发
- **WHEN** ZIP 组装完成
- **THEN** 浏览器弹出下载提示（或直接保存到下载目录），文件名正确

### Requirement: 图片在 ZIP 中的命名
系统 SHALL 将图片按页面出现顺序命名为 `img_001.{ext}`、`img_002.{ext}` 等，扩展名与原始图片类型一致。

#### Scenario: 图片顺序命名
- **WHEN** 页面有 12 张图片
- **THEN** 命名从 `img_001` 到 `img_012`，编号使用零填充至三位
