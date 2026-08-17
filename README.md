# AI Link Building Workspace

本项目是一个本地优先的 Chrome Manifest V3 插件，用于通过 AI 加速外链评论工作流。
插件支持队列化处理目标页面、评论表单检测、AI 评论生成、自动填写，以及可选的自动提交模式。

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

手动模式下的侧边栏动作说明：

1. 打开队列目标后，目标的流程状态会变为 `opened`。
2. `Generate Comment` 会读取当前页面内容、检测评论 Provider、评估页面质量并生成评论草稿。生成过程中目标会记录为 `analyzed`，成功后记录为 `generated`。
3. `Regenerate` 会基于当前项目、评论风格和固定的 `html_link` 模式重新生成草稿。
4. 生成结果会先显示在侧边栏，用户可以人工检查后再执行填充。

如果手动生成请求失败，错误会显示在侧边栏。当前实现不会在手动模式下自动把目标写成 `generation_failed`；自动化模式下的 AI 请求失败或生成结果验证失败才会持久化为 `generation_failed`，并在队列中显示为 `AI failed`。

### 6. 填充评论表单

检查草稿后点击 `Fill`。

插件会通过可替换的 DOM provider 检测评论表单，并填充：

- 评论正文
- 名称
- 邮箱
- 网站地址或已配置的链接资产

填充完成后，目标状态会记录为 `filled`。手动操作不会自动点击网页 Submit。

### 7. 自动化队列模式

在侧边栏的 `Automation mode` 中选择：

- `Fill only`：自动打开下一个目标、分析页面、生成评论并填写表单；完成后目标流程状态 `status` 为 `filled`，不会点击 Submit。
- `Auto submit`：填写后执行提交前检查并通过当前 DOM Provider 点击 Submit；只有检测到可靠的站点成功证据后，`status` 才会设为 `submitted`。

自动提交不会绕过登录、CAPTCHA 或站点验证。插件会识别成功提示、待审核提示、评论出现在页面、WordPress 评论结果 URL 等证据，并按两套状态分别记录处理阶段和提交结果：

- 确认提交成功：`status=submitted`，`submissionStatus=submitted`。
- 站点确认已接收但提示等待审核：`status=submitted`，`submissionStatus=pending_review`。
- 站点明确返回失败：`status=failed`，`submissionStatus=rejected`。
- 已点击 Submit，但在确认时间内没有可靠结果：保留 `status=filled`，同时记录 `submissionStatus=pending_review`，避免把一次点击误判为成功。
- AI 请求异常或生成内容未通过验证：`status=generation_failed`，队列状态 pill 显示 `AI failed`。

自动队列从当前项目的下一个 `pending` 目标开始，使用当前标签页依次打开目标。当前实现为每个目标设置 180 秒页面就绪超时；页面超时、未检测到可用评论 Provider、评论不可用、需要登录、归档页或质量不合格等不适合自动处理的情况会记录为 `skipped`。

单个目标得到 `filled`、`submitted`、`generation_failed`、`failed` 或 `skipped` 结果后，结果会立即持久化，自动化会继续打开下一个 `pending` 目标。队列处理完毕后自动化会停止。队列状态和自动化会话都存储在 IndexedDB 中，可适应 Manifest V3 background service worker 重启和跨页面导航。

### 8. 处理队列

常用操作：

- `Next`：打开下一个待处理目标
- `Skip`：把当前目标标记为跳过
- 状态 pill：显示目标的流程状态 `status`；其中 `generation_failed` 会显示为 `AI failed`
- 提交状态控件：单独记录当前目标的 `submissionStatus`，可选择 `unknown`、`submitted`、`indexed`、`review` 或 `rejected`
- 导出操作：把当前项目队列导出为 CSV

队列进度存储在 IndexedDB 中。即使 Manifest V3 background 重启，或浏览器刷新，队列状态也会保留。

## 状态记录系统

每个外链目标有两套独立状态。不要只看其中一个字段判断完整结果：

- `status`：目标流程状态，表示插件处理到哪个阶段，以及处理为何结束。
- `submissionStatus`：提交结果状态，表示评论提交后在站点侧的结果或后续跟踪结果。

### 1. 目标流程状态 `status`

队列中的状态 pill 显示这一字段。

| 状态 | 队列显示 | 含义与记录时机 |
|---|---|---|
| `pending` | `pending` | 等待处理。自动队列只会选择当前项目中下一个 `pending` 目标。 |
| `opened` | `opened` | 目标已由队列打开，并被设为当前目标。 |
| `analyzed` | `analyzed` | 手动生成流程已完成当前页面的文章提取、Provider 检测和质量分析。 |
| `generated` | `generated` | AI 评论已成功生成并显示在侧边栏，尚未填写表单。 |
| `filled` | `filled` | 评论字段已经填写，但没有可靠证据证明提交成功。Fill only、手动 Fill、提交前检查阻止自动提交或提交结果无法确认时都可能停在此状态。 |
| `submitted` | `submitted` | 站点暴露了可靠的成功证据，确认评论已被接收或成功提交。 |
| `need_login` | `need_login` | 用于记录目标需要登录后才能继续。当前自动质量筛选通常会把不可自动处理的页面统一结束为 `skipped`。 |
| `comment_closed` | `comment_closed` | 用于记录评论区已关闭。当前自动质量筛选通常会把不可自动处理的页面统一结束为 `skipped`。 |
| `generation_failed` | `AI failed` | 自动化中的 AI 请求失败，或生成的评论没有通过验证。该状态与普通自动化/提交失败分开统计和展示。 |
| `failed` | `failed` | 非 AI 生成类的自动处理异常，或站点明确返回提交失败。若是明确提交失败，通常同时记录 `submissionStatus=rejected`。 |
| `skipped` | `skipped` | 目标被用户手动跳过，或自动化判断页面不适合处理、页面就绪超时等。 |

`failed` 统计同时包含 `failed` 和 `generation_failed`；`completed` 只统计 `status=submitted` 的目标。

### 2. 提交结果状态 `submissionStatus`

队列中的下拉控件显示这一字段。UI 中 `pending_review` 简写为 `review`。

| 状态 | 队列显示 | 含义与记录方式 |
|---|---|---|
| `unknown` | `unknown` | 尚未提交、没有提交证据，或还没有人工记录结果。新导入目标默认为该状态。 |
| `submitted` | `submitted` | 已有可靠证据确认站点成功接收评论。自动提交确认成功时自动写入，也可人工调整。 |
| `indexed` | `indexed` | 后续人工确认评论或链接已被搜索引擎收录。当前由用户通过提交状态控件维护。 |
| `pending_review` | `review` | 站点明确提示评论等待审核，或插件点击 Submit 后无法可靠确认最终结果，需要人工复查。 |
| `rejected` | `rejected` | 站点明确拒绝或返回提交失败，也可由用户后续人工标记。 |

### 3. 常见组合

| `status` | `submissionStatus` | 实际含义 |
|---|---|---|
| `pending` / `opened` / `analyzed` / `generated` | `unknown` | 尚未进入已提交结果跟踪阶段。 |
| `filled` | `unknown` | 只完成了表单填写，还没有点击 Submit，常见于手动 Fill 或 Fill only。 |
| `filled` | `pending_review` | 已尝试自动提交，但站点没有给出可靠成功或失败证据，需要人工检查。 |
| `submitted` | `submitted` | 站点可靠证据确认提交成功。 |
| `submitted` | `pending_review` | 站点确认已经接收评论，但评论处于审核队列。 |
| `submitted` | `indexed` | 评论已提交，且后续人工确认已经收录。 |
| `generation_failed` | `unknown` | AI 请求或生成验证失败，未进入提交阶段。 |
| `failed` | `rejected` | 站点明确返回提交失败或拒绝。 |
| `skipped` | `unknown` | 未执行提交，目标被手动跳过或不适合自动处理。 |

`status=submitted` 只表示站点侧存在可靠的提交成功证据，不等于评论已经公开展示或搜索引擎已经收录；公开审核进度和收录结果应继续通过 `submissionStatus` 跟踪。

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

## 权限说明

- `storage`：保存 AI 配置及本地工作区数据
- `activeTab` / `scripting`：在当前页面运行侧边栏和 DOM Provider
- `tabs`：自动化队列在当前标签页打开下一个目标
- `alarms`：为自动化页面打开设置当前 180 秒超时看门狗
- `<all_urls>`：支持不同站点的评论表单检测和站点成功证据读取

## Architecture

- Injected sidebar UI
- Content-script DOM interaction
- Provider-based comment form abstraction
- Repository-oriented IndexedDB storage
- Replaceable AI provider interface
- Runtime message router scaffold
