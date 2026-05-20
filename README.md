# AI Link Building Workspace

本项目是一个本地优先的 Chrome 插件，用于辅助外链评论工作流。

## 安装

### 1. 安装依赖

项目使用 pnpm 管理依赖。

```bash
pnpm install
```

### 2. 启动开发版本

```bash
pnpm run dev
```

WXT 会在 `.output/chrome-mv3` 目录生成可加载的 Chrome 插件文件。

### 3. 在 Chrome 里加载插件

1. 打开 `chrome://extensions/`。
2. 打开右上角的 `Developer mode`。
3. 点击 `Load unpacked`。
4. 选择下面这个目录：

```text
.output/chrome-mv3
```

加载完成后，打开任意目标页面。页面右侧会出现 `AI Link` 标签，点击后可以展开侧边栏。

### 构建正式版本

执行：

```bash
pnpm run build
```

构建完成后，仍然通过 `chrome://extensions/` 加载 `.output/chrome-mv3`。

如果需要生成 zip 包：

```bash
pnpm run zip
```

## 使用步骤

### 1. 打开侧边栏

打开需要分析或评论的页面，点击浏览器页面右侧的 `AI Link` 标签。

插件以侧边栏为主要入口，不依赖弹窗完成核心流程。

### 2. 配置项目和评论身份

在侧边栏点击 `Settings`。

需要设置或导入：

- 项目名称、品牌名、网站地址、项目描述
- 评论身份的名称、邮箱、网站地址
- 链接资产配置
- OpenRouter API Key 和模型

项目资料支持 JSON 或 CSV 导入。示例文件：

- `workspace-profile-example.json`
- `workspace-profile-example.csv`

### 3. 配置 AI 生成

在 `Settings` -> `AI Settings` 里填写：

- `OpenRouter API Key`
- `Model`

当前实现使用 OpenRouter。AI provider 已经通过接口隔离，后续可以替换为其他服务。

### 4. 导入外链目标

在队列面板点击 `+`，导入 JSON 或 CSV 文件。

示例文件：

- `backlink-targets-example.json`
- 插件内的 `Download JSON Example` 和 `Download CSV Example`

JSON 最小格式：

```json
[
  {
    "url": "https://example.com/post-1",
    "notes": "First target"
  }
]
```

CSV 格式：

```csv
url,notes
https://example.com/post-1,First target
https://example.com/post-2,Second target
```

导入目标会替换当前项目的队列。队列状态会持久化到 IndexedDB。

### 5. 分析页面并生成评论

可以从侧边栏打开队列里的目标页面，也可以手动进入目标页面。

侧边栏动作说明：

1. `Generate` 会读取当前页面内容，评估页面质量，并生成评论草稿。
2. `Regenerate` 会基于当前项目、身份和评论模式重新生成草稿。
3. 生成后先人工检查草稿，再填入页面。

### 6. 填充评论表单

检查草稿后点击 `Fill`。

插件会通过可替换的 DOM provider 检测评论表单，并填充：

- 评论正文
- 名称
- 邮箱
- 网站地址或已配置的链接资产

填充完成后，需要人工检查页面字段，再手动提交。插件只辅助填写，不自动盲提交。

### 7. 处理队列

常用操作：

- `Next`：打开下一个待处理目标
- `Skip`：把当前目标标记为跳过
- 提交状态控件：记录当前目标的提交结果
- 导出操作：把当前项目队列导出为 CSV

队列进度存储在 IndexedDB 中。即使 Manifest V3 background 重启，或浏览器刷新，队列状态也会保留。

## 开发命令

```bash
pnpm run dev
pnpm run build
pnpm run zip
pnpm run typecheck
pnpm test
```

## Stack

- WXT
- React
- TypeScript
- Zustand
- IndexedDB
- Manifest V3

## Architecture

- Injected sidebar UI
- Content-script DOM interaction
- Provider-based comment form abstraction
- Repository-oriented IndexedDB storage
- Replaceable AI provider interface
- Runtime message router scaffold
