---
name: frontend-code-review
description: 审查 RuoYi-Vue-Plus-UI(平台运营总后台,Vue3+TS+Element Plus+UnoCSS+Pinia)前端代码 —— src/ 下的 .vue/.ts(views、api/recruitment、store、utils)。检查正确性、Element Plus 表格/表单/弹窗、运营台路径口径(直写 /admin/* 与 /system/*,不补 /api)、v-hasPermi 按钮权限、loading/error/empty 三态、敏感数据展示(简历/手机号脱敏)、TS 类型与意图注释。支持三种输入:待提交改动 / 指定文件 / 粘贴片段。不审后端、不审框架自带 system/monitor/tool 页面的大改、不生成测试。
---

# Frontend Code Review(RuoYi-Vue-Plus-UI / 运营总后台)

## When to use this skill

用户要求**审查 / 分析 / sanity-check** 本仓前端代码时。三种输入模式:

- **待提交改动**:审当前 staged / working-tree 改动(`git diff`)。
- **指定文件**:审用户点名的一个或少数几个文件(`src/...`),重点是招聘业务页(`src/views/recruitment/**`、`src/api/recruitment/**`)。
- **片段**:审用户粘贴的代码片段(尽力结合上下文)。

## When NOT to use this skill

- **后端代码**:Java / RuoYi 在独立仓 `RuoYi-Vue-Plus`,不归本技能。
- **接口契约对齐**(路径、字段对齐后端 VO):按工作区根 `.agents/references/api-contract.md` 核对。
- **框架自带页面**(`system/monitor/tool/workflow` 等 plus-ui 原生页)的成片重写:框架页保持跟随上游,只审业务性小改。
- **生成/审测试**:本仓无测试框架(`@vue/test-utils` 在 devDeps 但无 runner/脚本),不强行引入。
- **写新功能 / 重构**:本技能只审、不改业务码。

## How to use this skill

1. 判断输入模式,**收紧范围**,只审用户给的东西。
2. 读必要上下文:目标文件 + 它引用的 `src/api/recruitment/*`、`src/utils/request.ts`、相关 store/enums/types。
3. 按 [`references/checklist.md`](references/checklist.md) 逐域检查(正确性/三态、Element Plus、路径口径与权限、敏感数据、TS 与注释)。
4. 严格按下方 Required Output Format 输出。
5. **默认只出报告、不改代码**;除非用户已明确要求"直接改",否则结尾问一句是否应用。

## Checklist(详见 references/checklist.md)

- 正确性与三态(loading/error/empty、分页、竞态)
- Element Plus 用法(表单校验/弹窗复位/危险操作确认)
- 运营台路径口径(直写 `/admin/*`、`/system/*`,**不补 /api**)与 `v-hasPermi` 按钮权限
- 敏感数据展示(简历/手机号/台账金额,导出收敛)
- TS 类型与意图注释、plus-ui 既有范式(useTable/字典 hooks 等跟随现有页面写法)

## Required Output Format

### Summary
<一句话总体结论>

### 🔴 Must fix
<影响正确性 / 安全 / 数据 / 构建的问题;每条带 文件:行 + 为什么 + 怎么改>

### 🟡 Should fix
<影响可维护性 / 性能 / 三态完整性 / 可读性的问题>

### 🟢 Optional
<不阻塞当前需求的优化建议>

### Verification
<已做/建议的验证:`pnpm lint:eslint`、`pnpm build:prod`、`pnpm dev`(:8081, 使用当前 dev 快照账号)页面点验;哪些无法静态验证>

### Next step
是否需要我现在应用这些修改?
