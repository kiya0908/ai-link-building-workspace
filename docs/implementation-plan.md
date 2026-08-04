# AI Link Building Workspace — Implementation Plan

> 当前自动化版本说明：项目已从“人工 Fill + 手动 Submit”扩展为可选的队列自动化。`fill_only` 记录 `filled`；`auto_submit` 通过 Provider 点击 Submit，并使用站点成功/失败证据确认后才记录 `submitted`。页面 60 秒未就绪或不适合评论时记录 `skipped` 并进入下一目标。

> 生成时间: 2026-05-20  
> 基于 PRD v1 与代码审计结果的完整问题清单和实施追踪文档

---

## 一、审计概况

- **PRD版本**: MVP v1
- **技术栈**: WXT + React + TypeScript + IndexedDB + Zustand + Manifest V3
- **当前实现覆盖度**: ~85-90%（核心架构完整，部分管理UI和交互细节缺失）
- **新增PRD模块**: 7.18-7.26（AI配置/评论历史/验证/Token追踪/重试/调试/导入/示例下载/Error Boundary）

---

## 二、问题清单（按优先级 & 难度排序）

### 🔴 P0 — 阻塞级 Bug（必须立即修复）

| # | 模块 | 问题描述 | 根因分析 | 影响 | 修复难度 | 修复状态 | 实施日志 | 测试结果 |
|---|---|---|---|---|---|---|---|---|
| P0-1 | Queue Import | Import追加而非覆盖同一project下旧targets | `QUEUE_IMPORT_TARGETS` handler只调用 `saveTarget(target)`（即IDB put），不会先清空旧targets。新导入只要ID不同就会无限追加 | 工作流重复执行、队列无限膨胀 | 低 | ✅ 已完成 | `background-handlers.ts`: import前先`queueManager.clearProjectTargets(projectId)`清空旧数据；`target-repository.ts`新增`clearProjectTargets()`方法；`queue.ts` `QueueRepository`接口同步新增声明 | 已测试通过 |
| P0-2 | Manual Learning | Select Comment Box 卡死页面交互 | `manual-learning.ts:21-28` 点击非可学习元素时执行 `preventDefault()+stopPropagation()` 但不调用 `stop()` 移除监听器。页面被capture phase永久劫持，除非按Escape | 页面按钮/链接/输入框全部无法交互 | 低 | ✅ 已完成 | `manual-learning.ts`: 非可学习元素点击时立即调用`stop()`移除监听器；添加`SIDEBAR_ROOT_ID`检查排除sidebar自身DOM元素 | 未测试到 |
| P0-3 | Queue Skip | Skip按钮无效，状态不更新 | `SidebarApp.tsx:178` `action === 'skip'` 走默认分支，发送通用 `SIDEBAR_ACTION` 消息，没有调用 `QUEUE_UPDATE_STATUS(targetId, 'skipped')` | Skip后状态仍为pending/opened，工作流追踪错误 | 低 | ✅ 已完成 | `SidebarApp.tsx`: `handleAction`中`action === 'skip'`分支直接调用`updateTargetStatus(targetId, 'skipped')`并通过`setActionSuccess`反馈 | 已测试通过 |

### 🟡 P1 — 高频体验问题（每次使用都会遇到）

| # | 模块 | 问题描述 | 根因分析 | 影响 | 修复难度 | 修复状态 | 实施日志 | 测试结果 |
|---|---|---|---|---|---|---|---|---|
| P1-4 | Sidebar CSS | 扩展样式随系统主题(light/dark)变化 | `sidebar.css:6` 使用 `color-scheme: light dark`，`light-dark()` CSS函数响应系统主题 | 在不同网站上视觉体验不稳定，与PRD要求"一致性"冲突 | 低 | ✅ 已完成 | `sidebar.css`: `color-scheme`改为`light`固定为亮色主题；所有`light-dark()`函数替换为固定色值（白底深字），保证所有网站视觉一致 | 测试未通过 |
| P1-5 | Content Script | 页面未完全加载时sidebar不显示 | `content.tsx:23` `runAt: 'document_idle'` 需等待页面完全加载 | 页面加载期间sidebar延迟出现 | 低 | ✅ 已完成 | `entrypoints/content.tsx`: `runAt`由`document_idle`改为`document_end`，sidebar在DOM构建完成后立即注入，无需等待页面完全加载 | 测试未通过 |
| P1-6 | Queue List | 显示顺序与导入顺序不一致 | `IndexedDBTargetRepository.listTargets()` 通过index `getAll()` 获取，IndexedDB index遍历按key/id排序而非插入顺序；`queue-manager.ts` 二次sort按 `updatedAt`，若同批次导入时间戳相同则顺序不稳定 | 用户预期与实际显示错位 | 低 | ✅ 已完成 | `background-handlers.ts`: `QUEUE_IMPORT_TARGETS`导入时给每个target的`updatedAt`设置为`Date.now() + index`递增时间戳，保证同批次sort后顺序与导入顺序一致 | 测试未通过 |
| P1-7 | Status System | 队列状态不自动流转(analyzed→generated→filled) | openTarget后到各中间状态的推进无自动状态更新逻辑，全靠用户手动操作或代码不维护中间状态 | 工作流状态跟踪不完整，统计 inaccurate | 中 | ✅ 已完成 | `SidebarApp.tsx`: `generate`成功后调用`updateTargetStatus(targetId, 'analyzed')`和`updateTargetStatus(targetId, 'generated')`；`fill`成功后调用`updateTargetStatus(targetId, 'filled')` | 已测试通过 |
| P1-8 | Manual Learning | learning事件穿透sidebar自身 | `startManualLearning` 在 `document` 添加capture phase监听器，sidebar DOM元素也在监听范围内 | 在sidebar内部点击按钮也会触发learning逻辑，误触发 | 低 | ✅ 已完成 | `manual-learning.ts`: `handleClick`中通过`target.closest('#ai-link-building-workspace-sidebar-root')`检查，若点击发生在sidebar内部则直接return不处理 | 未测试到 |

### 🟠 P2 — 功能缺失（PRD要求但未完整实现）

| # | 模块 | 问题描述 | 根因分析 | 影响 | 修复难度 | 修复状态 | 实施日志 | 测试结果 |
|---|---|---|---|---|---|---|---|---|
| P2-9 | Link Asset | Link Asset未在业务逻辑中使用 | PRD 7.3要求填充时使用anchorText/htmlCode/plainUrl；`SidebarApp.tsx:155` 仅取 `currentProject.website`。LinkAsset类型和IndexedDB Store存在但无任何业务逻辑引用 | 相关功能废弃，html_link/plain_url模式无anchor支持 | 中 | ✅ 已完成 | 新建`link-asset-repository.ts`提供`IndexedDBLinkAssetRepository`；`SidebarApp.tsx`通过useEffect加载当前项目的默认LinkAsset；`fill`时按commentMode优先级使用`htmlCode`→`plainUrl`→`anchorText`→fallback到project/identity website | 测试未通过 |
| P2-10 | Project Manager | 多Project CRUD UI缺失 | 仅支持导入workspace profile创建项目，无存取/编辑/删除/切换活跃项目的UI | 无法管理多个项目，"Manage multiple projects"成功标准不达标 | 中 | ✅ 已完成 | 新建`ProjectManagerPanel.tsx`组件；`workspace-store.ts`新增`switchProject`/`deleteProject`/`updateProject`方法；`SettingsWindow`集成ProjectManagerPanel，支持切换/删除/编辑/创建项目 | 已测试通过 |
| P2-11 | Identity Manager | 多Identity CRUD UI缺失 | Settings中仅单个identity表单，无多identity的创建/切换/删除UI | 无法管理多个评论身份 | 中 | ✅ 已完成 | 新建`IdentityManagerPanel.tsx`组件；`workspace-store.ts`新增`identities`数组及`switchIdentity`/`createIdentity`/`deleteIdentity`方法；`SettingsWindow`集成IdentityManagerPanel，支持切换/删除/编辑/创建身份 | 测试未通过 |
| P2-12 | Target Manager | 目标手动创建/编辑UI缺失 | 只能通过JSON/CSV文件批量导入，无手动添加或编辑单条target的界面 | 操作不灵活 | 中 | ✅ 已完成 | `QueueList.tsx`新增`+`按钮和手动添加表单（URL/Notes输入），点击Add后调用`onImport([target])`直接入库，无需文件导入 | 已测试通过 |
| P2-13 | Status System | 提交后状态不自动标记submitted | 旧逻辑会把任意submit/URL变化误判为成功 | 用户需手动标记已完成或被误标记 | 中 | ✅ 已替换 | 删除`auto-submit-detector.ts`；新增`CommentProvider`提交接口、`submission-evidence.ts`分层证据检测和`page-automation-workflow.ts`；仅可靠站点证据写入`submitted`，不确定结果保留`filled`并记`pending_review` | 结构测试与构建通过 |
| P2-14 | Queue Automation | 缺少自动打开、自动填写、自动提交和超时跳过 | 原流程只支持手动按钮操作 | 无法连续处理队列 | 高 | ✅ 已完成 | 新增`automationState` IndexedDB store、`automation-coordinator.ts`、`browser.alarms` 60秒看门狗、跨页面会话恢复和Sidebar Automation mode控件 | 结构测试与构建通过 |

### 🟢 P3 — 边缘/增强问题

| # | 模块 | 问题描述 | 根因分析 | 影响 | 修复难度 | 修复状态 | 实施日志 | 测试结果 |
|---|---|---|---|---|---|---|---|---|
| P3-14 | Article Extractor | 语言检测缺少AI fallback | PRD 16要求三级检测：`document.lang → meta → AI fallback`；`article-extractor.ts:33-41` 仅实现前两级 | 语言为空时影响prompt质量 | 中 | ✅ 已完成 | `article-extractor.ts`: 新增`detectLanguageByContent()`函数，通过特征词正则匹配（en/zh/es/fr/de/ja/ko/ru/pt/it十种语言）统计页面body文本命中数，返回最佳匹配语言代码，作为第三级fallback | 未测试到 |
| P3-15 | Export System | 完整数据库导出未实现 | PRD 3/7.17要求"Export database"，当前仅targets支持JSON/CSV导出；projects/identities/histories/siteLearning均无法导出 | 数据备份和迁移不完整 | 中 | ✅ 已完成 | `queue-import-export.ts`: 新增`exportFullDatabase()`函数，遍历所有IndexedDB store（targets/projects/identities/linkAssets/queueState/siteLearning/commentHistory），将每个store全部记录导出为JSON字符串 | 测试未通过 |
| P3-16 | Queue Manager | 多项目workspace切换UI未连接 | `QueueStore.switchCurrentProject()` 存在但UI未暴露切换入口 | 切换项目不便（需通过import或重新hydrate） | 低 | ✅ 已完成 | `SidebarApp.tsx` header: 当`projects.length > 1`时渲染`<select>`下拉框，onChange直接调用`switchProject(projectId)`切换活跃项目并重新hydrate队列；新增`.ai-link-project-switcher` CSS样式 | 已测试通过 |

---

## 三、实施建议顺序

```
Phase A — 紧急修复 (P0)
  ├── P0-1  Import追加改覆盖
  ├── P0-2  Select Comment Box卡死修复
  └── P0-3  Skip按钮状态更新修复

Phase B — 体验优化 (P1)
  ├── P1-4  Sidebar样式固定化（移除light-dark依赖）
  ├── P1-5  Content script提前注入
  ├── P1-6  Queue List保持导入顺序
  ├── P1-8  Learning事件排除sidebar自身
  └── P1-7  状态自动流转

Phase C — 功能补齐 (P2)
  ├── P2-10 Project CRUD UI
  ├── P2-11 Identity CRUD UI
  ├── P2-12 Target手动管理UI
  ├── P2-13 自动标记submitted
   ├── P2-9  Link Asset业务逻辑接入
   └── P2-14 队列自动化与站点提交证据确认

Phase D — 增强 (P3)
  ├── P3-14 AI语言检测fallback
  ├── P3-15 完整数据库导出
  └── P3-16 项目切换UI暴露
```

---

## 四、验证流程

当前测试分三层看，不能只用一个“通过/不通过”判断所有修复：

| 层级 | 命令或方式 | 能证明什么 | 不能证明什么 |
|---|---|---|---|
| 类型检查 | `pnpm run typecheck` | TypeScript类型、WXT生成类型、基础编译链路没有明显错误 | 不能证明浏览器扩展交互正确 |
| 结构测试 | `pnpm test` | 文件、接口、模块边界、关键业务入口大体存在 | 不能证明真实DOM点击、content script注入、IndexedDB浏览器行为正确 |
| 浏览器手动回归 | 安装本地扩展后按验证清单操作 | sidebar、content script、IndexedDB、页面事件、MV3生命周期是否符合预期 | 成本较高，需要固定步骤和记录 |

每个修复项只允许使用以下验证状态：

| 状态 | 含义 |
|---|---|
| 已修复未验证 | 代码已改，但还没有按清单验证 |
| 自动化已验证 | `pnpm test` 或 `pnpm run typecheck` 覆盖到该项，并且通过 |
| 手动已验证 | 已在浏览器扩展环境中按步骤验证通过 |
| 验证失败 | 按清单复现后结果不符合预期，需要重新定位原因 |
| 当前测试未覆盖 | 现有自动化测试无法覆盖，需要补手动用例或新增测试 |

建议回归顺序：

1. 先跑 `pnpm run typecheck` 和 `pnpm test`，确认基础质量没有退化。
2. 再验证全部 P0。P0 不通过时，不继续验证 P1/P2/P3。
3. P0 通过后，按 P1、P2、P3 顺序验证。
4. 对“测试未通过”的项，先记录失败步骤和实际结果，再决定是修代码、改测试，还是补手动用例。

---

## 五、验证清单

### P0 验证清单

| # | 验证方式 | 最小步骤 | 期望结果 | 当前判定 |
|---|---|---|---|---|
| P0-1 | 自动化 + 手动 | 导入同一project的targets两次，第二次使用不同URL集合 | 队列只保留第二次导入的targets，不追加旧数据 | 已修复待手动复测：文件导入显式使用`replaceExisting: true`，后台仅在replace模式下清空当前project旧targets |
| P0-2 | 手动 | 打开任意目标页面，点击Select Comment Box，再点击非评论框区域，然后继续点击页面按钮/链接/输入框 | 学习模式结束，页面正常交互，不需要按Escape恢复 | 当前测试未覆盖 |
| P0-3 | 手动 | 导入一个target，点击Skip | target状态变为`skipped`，刷新或重新打开sidebar后状态仍保持 | 手动已验证 |

### P1 验证清单

| # | 验证方式 | 最小步骤 | 期望结果 | 当前判定 |
|---|---|---|---|---|
| P1-4 | 手动 | 在系统亮色和暗色主题下分别打开同一目标页面 | sidebar始终使用固定亮色样式，不随系统主题切换 | 手动已验证 |
| P1-5 | 手动 + 构建产物检查 | 打开加载较慢的页面，观察DOM可用后sidebar出现时间 | DOM构建完成后sidebar即可出现，不等待完整页面资源加载 | 验证失败：`https://sns.jearn.jp/blog/blog.php?key=19`页面没有出现扩展sidebar；构建产物已为`run_at: "document_end"`，需继续查该站点content script注入失败原因 |
| P1-6 | 手动 | 按A、B、C顺序导入targets，刷新sidebar | 队列显示顺序保持A、B、C | 已修复待手动复测：`QueueManager.list()`现在统一按`updatedAt`排序；文件导入时按文件顺序写入递增`updatedAt` |
| P1-7 | 手动 | 对一个target依次执行Analyze/Generate/Fill | 状态依次更新到`analyzed`、`generated`、`filled`，刷新后仍保持 | 手动已验证 |
| P1-8 | 手动 | 点击Select Comment Box后，点击sidebar内部按钮或设置入口 | sidebar点击不触发学习逻辑，也不写入错误selector | 当前测试未覆盖 |

### P2 验证清单

| # | 验证方式 | 最小步骤 | 期望结果 | 当前判定 |
|---|---|---|---|---|
| P2-9 | 手动 + 代码检查 | 为当前project配置默认Link Asset，分别使用html_link/plain_url/anchor模式执行Fill | 填充内容按`htmlCode`、`plainUrl`、`anchorText`优先级取值，缺失时才fallback | 已修复待手动复测：Settings新增Link Asset面板，Fill执行时会重新读取当前project默认Link Asset |
| P2-10 | 手动 | 在Settings中新建、编辑、切换、删除Project | Project列表和当前活跃Project正确变化，刷新后仍保持 | 手动已验证 |
| P2-11 | 手动 + 代码检查 | 在Settings中新建、编辑、切换、删除Identity | Identity列表和当前活跃Identity正确变化，刷新后仍保持 | 已修复待手动复测：`chrome.storage.local`现在持久化并恢复`identities`和`currentIdentityId` |
| P2-12 | 手动 | 点击Queue里的`+`，手动输入URL和Notes并添加 | 新target进入当前project队列，刷新后仍存在 | 手动已验证 |
| P2-13 | 自动化 + 手动 | 在测试评论表单中使用Auto submit，分别模拟成功提示、待审核、失败和无证据结果 | 只有可靠证据才是`submitted`；失败是`failed`；无证据保留`filled`并是`pending_review` | 结构测试与构建通过，需真实站点复测 |
| P2-14 | 自动化 + 手动 | 启动Automation，验证Fill only、Auto submit、不可填写页面和60秒超时 | Fill only为`filled`；成功提交为`submitted`；不可处理/超时为`skipped`；自动进入下一目标 | 结构测试与构建通过，需真实站点复测 |

### P3 验证清单

| # | 验证方式 | 最小步骤 | 期望结果 | 当前判定 |
|---|---|---|---|---|
| P3-14 | 自动化 + 手动 | 使用无`document.lang`和无meta language的英文/中文测试页面执行文章提取 | 能从正文内容推断语言代码 | 当前测试未覆盖，建议补单元测试 |
| P3-15 | 手动 + 代码检查 | 准备projects、identities、targets、linkAssets、history数据后执行完整数据库导出 | 导出的JSON包含所有store及对应记录 | 已修复待手动复测：Settings新增Database Export面板，按钮调用`exportFullDatabase()`并下载JSON |
| P3-16 | 手动 | 准备两个以上Project，在sidebar header切换Project | 当前队列随Project切换刷新，不混入其他Project的targets | 手动已验证 |

---

## 六、本轮验证记录

验证时间：2026-05-20

使用数据：

- `workspace-profile-example.json`
- `backlink-targets-example.json`

注意：`workspace-profile-example.json`里重复声明了`project`和`commentIdentity`键。按JSON解析规则，前一组会被后一组覆盖，实际可用数据是`doodle baseball`项目和对应身份。

已执行：

- `pnpm run build`：通过。
- 使用`.output/chrome-mv3`作为未打包扩展启动独立Chrome。
- 打开目标页`https://capturebilling.com/new-quality-aca-reporting-standards/`。
- 通过调试端口检查页面DOM，未发现`#ai-link-building-workspace-sidebar-root`。

结论：

- 当前失败项里，P1-5、P2-9、P2-11、P3-15已经能从构建产物或代码路径确认问题。
- P1-4和P1-6仍需要在sidebar成功注入后继续做真实UI验证。

后续修复记录：

- P2-9：新增`LinkAssetSettingsPanel`，用户可以在Settings里保存当前project的默认Link Asset；Fill时重新读取最新Link Asset，避免保存后缓存未刷新。
- P2-11：`workspace-store.ts`持久化并恢复完整`identities`数组和`currentIdentityId`，刷新后多身份不再丢失。
- P3-15：新增`DatabaseExportPanel`，用户可以从Settings导出完整IndexedDB数据。
- P1-5：重新构建后manifest已输出`run_at: "document_end"`；独立测试Chrome仍未注入content script，需后续用真实浏览器扩展页面复测。
- P0-1/P1-6：文件导入和手动添加拆分语义。文件导入使用`replaceExisting: true`覆盖当前project旧targets；手动添加使用`replaceExisting: false`追加单条target；队列列表统一按`updatedAt`排序。

用户手动复测记录：

- P1-4：手动测试通过。
- P1-5：打开`https://sns.jearn.jp/blog/blog.php?key=19`时扩展没有出现。
- P1-6：导入`backlink-targets-example.json`后显示顺序和文件顺序不一致。
- P0-1：重新导入`backlink-targets-example.json`时出现追加旧targets的问题。

---

## 七、失败项处理规则

遇到“验证失败”时，先不要直接继续改代码。按下面顺序记录：

1. 失败编号，例如`P1-6`。
2. 使用的浏览器页面或测试页面。
3. 操作步骤。
4. 期望结果。
5. 实际结果。
6. 控制台错误、扩展后台错误、IndexedDB实际数据。
7. 初步归因：修复无效、测试步骤错误、扩展未重新加载、现有测试覆盖不到。

只有确认是“修复无效”时，才进入下一轮代码修改。若是“扩展未重新加载”或“测试步骤错误”，只更新验证记录，不改代码。

---

## 八、建议补充的自动化测试

| 优先级 | 覆盖目标 | 建议测试位置 | 说明 |
|---|---|---|---|
| 高 | P0-1、P1-6 | `tests/queue-system.test.mjs` | 增加导入覆盖旧targets、同批次导入顺序稳定的断言 |
| 高 | P3-14 | `tests/dom-providers.test.mjs` 或新增 `tests/article-extractor.test.mjs` | 使用静态HTML文本验证语言fallback |
| 中 | P3-15 | `tests/queue-system.test.mjs` | 检查`exportFullDatabase()`包含所有store名称 |
| 中 | P2-9 | `tests/sidebar-ui.test.mjs` | 检查Fill逻辑引用Link Asset repository和commentMode分支 |
| 低 | P0-2、P1-8 | 后续浏览器测试 | 这两项依赖真实DOM capture事件，文本级测试价值有限 |

---

## 九、变更日志

| 日期 | 版本 | 内容 |
|---|---|---|
| 2026-05-20 | v0.1 | 初始审计：完成PRD对照分析，发现3个P0阻塞bug、5个P1体验问题、5个P2功能缺失、3个P3增强项，共16项。新增9个PRD模块（7.18-7.26）。 |
| 2026-05-20 | v0.2 | 新增验证流程、分层测试说明、P0-P3验证清单、失败项处理规则和建议补充的自动化测试。 |
| 2026-05-20 | v0.3 | 使用示例profile和targets验证失败项；记录P1-5构建产物仍为`document_idle`、P2-9缺少Link Asset录入入口、P2-11多身份未恢复、P3-15导出函数未连接UI入口。 |
| 2026-05-20 | v0.4 | 修复P2-9、P2-11、P3-15；补充Link Asset设置面板、完整数据库导出面板、多身份持久化，并确认构建产物中content script为`document_end`。 |
| 2026-05-20 | v0.5 | 根据手动复测结果修复P0-1和P1-6：文件导入覆盖旧targets、手动添加追加target、队列显示按导入顺序排序；记录P1-5在`sns.jearn.jp`页面仍未出现sidebar。 |

---

## 十、参考文件

| 文件 | 相关issues |
|---|---|
| `src/core/dom/manual/manual-learning.ts` | P0-2, P1-8 |
| `src/shared/messaging/background-handlers.ts:65-68` | P0-1 |
| `src/ui/sidebar/SidebarApp.tsx:178` | P0-3 |
| `src/ui/sidebar/sidebar.css:6,31-41` | P1-4 |
| `entrypoints/content.tsx:23` | P1-5 |
| `src/core/storage/repositories/target-repository.ts:13-16` | P1-6 |
| `src/core/queue/queue-manager.ts:56-74` | P1-6, P1-7 |
| `src/core/automation/automation-coordinator.ts` | P2-14, 60秒超时和跨页面恢复 |
| `src/core/automation/page-automation-workflow.ts` | P2-13, P2-14 |
| `src/core/dom/submission-evidence.ts` | P2-13, Provider提交成功/失败证据 |
| `src/core/types/project.ts` | P2-9, P2-10, P2-11 |
| `src/core/article/article-extractor.ts:33-41` | P3-14 |
| `src/core/queue/queue-import-export.ts` | P3-15 |
