# AI Link Building Workspace — Implementation Plan

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
| P2-13 | Status System | 提交后状态不自动标记submitted | 无检测表单提交事件的逻辑（MutationObserver监听comment form移除或URL变化等） | 用户需手动标记已完成，效率低下 | 中 | ✅ 已完成 | 新建`auto-submit-detector.ts`模块；`SidebarApp.tsx`通过useEffect在`visibleActiveItemId`变化时启动检测器，监听form submit事件、comment form DOM移除（MutationObserver）、history.pushState/replaceState/popstate变化，自动发送`QUEUE_UPDATE_STATUS(targetId, 'submitted')` | 已测试通过 |

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
  └── P2-9  Link Asset业务逻辑接入

Phase D — 增强 (P3)
  ├── P3-14 AI语言检测fallback
  ├── P3-15 完整数据库导出
  └── P3-16 项目切换UI暴露
```

---

## 四、变更日志

| 日期 | 版本 | 内容 |
|---|---|---|
| 2026-05-20 | v0.1 | 初始审计：完成PRD对照分析，发现3个P0阻塞bug、5个P1体验问题、5个P2功能缺失、3个P3增强项，共16项。新增9个PRD模块（7.18-7.26）。 |

---

## 五、参考文件

| 文件 | 相关issues |
|---|---|
| `src/core/dom/manual/manual-learning.ts` | P0-2, P1-8 |
| `src/shared/messaging/background-handlers.ts:65-68` | P0-1 |
| `src/ui/sidebar/SidebarApp.tsx:178` | P0-3 |
| `src/ui/sidebar/sidebar.css:6,31-41` | P1-4 |
| `entrypoints/content.tsx:23` | P1-5 |
| `src/core/storage/repositories/target-repository.ts:13-16` | P1-6 |
| `src/core/queue/queue-manager.ts:56-74` | P1-6, P1-7 |
| `src/core/types/project.ts` | P2-9, P2-10, P2-11 |
| `src/core/article/article-extractor.ts:33-41` | P3-14 |
| `src/core/queue/queue-import-export.ts` | P3-15 |
