## ADDED Requirements

### Requirement: Popup 主界面
系统 SHALL 提供扩展 Popup 界面，包含转换模式切换、操作按钮（复制 MD / 下载 ZIP）和状态反馈区域。

#### Scenario: Popup 初始状态
- **WHEN** 用户点击扩展图标打开 Popup
- **THEN** 显示模式切换（智能提取 / 完整页面）、"复制 MD"按钮、"下载 ZIP"按钮，状态区域为空

#### Scenario: 模式切换
- **WHEN** 用户切换转换模式
- **THEN** 选择状态即时保存，下次操作使用新模式

### Requirement: 图片下载进度显示
系统 SHALL 在下载 ZIP 过程中显示进度条，格式为"正在下载图片 N / M"，完成后自动隐藏进度条。

#### Scenario: 进度条显示
- **WHEN** 用户点击"下载 ZIP"且页面含图片
- **THEN** 进度条出现，显示当前下载进度（例如 "正在下载图片 3 / 10"）

#### Scenario: 进度条完成隐藏
- **WHEN** 所有图片处理完毕，ZIP 下载已触发
- **THEN** 进度条消失，显示"下载完成"提示

### Requirement: 复制 MD 到剪贴板
系统 SHALL 支持将转换后的纯 Markdown 文本（不含图片二进制）复制到系统剪贴板。

#### Scenario: 复制成功
- **WHEN** 用户点击"复制 MD"按钮
- **THEN** MD 文本写入剪贴板，按钮短暂显示"已复制！"反馈（1.5 秒后恢复）

#### Scenario: 复制 MD 时图片使用原始 URL
- **WHEN** 用户选择复制 MD（而非下载 ZIP）
- **THEN** MD 文本中的图片引用保留原始 URL（不触发图片下载）

### Requirement: 操作错误提示
系统 SHALL 在转换或下载发生异常时，在 Popup 中显示简洁的错误信息，不使用浏览器原生 alert。

#### Scenario: 转换失败提示
- **WHEN** Content Script 注入失败或页面提取出错
- **THEN** Popup 状态区域显示红色错误信息，操作按钮保持可点击状态（可重试）

### Requirement: 转换模式持久化
系统 SHALL 使用 `chrome.storage.local` 持久化用户上次选择的转换模式，下次打开扩展时恢复。

#### Scenario: 模式记忆
- **WHEN** 用户上次使用"完整页面"模式后关闭 Popup
- **THEN** 下次打开 Popup 时默认选中"完整页面"模式
