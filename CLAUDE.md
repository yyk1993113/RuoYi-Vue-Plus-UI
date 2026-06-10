# findwork 平台总后台 (RuoYi-Vue-Plus-UI)

平台**运营总后台**（公司内部用），基于 RuoYi-Vue-Plus 官方 plus-ui。配合后端仓库 `RuoYi-Vue-Plus` 使用，是其管理前端。

## 技术栈 / 端口
Vue 3 + Vite + pnpm + Element Plus + UnoCSS + TypeScript + Pinia。Node ≥ 20.19。本地 dev 端口约定 **8081**。

## 启动 / 构建
```bash
pnpm install
pnpm exec vite serve --mode development --port 8081   # 开发（等价 pnpm dev）
pnpm build:prod                                        # 生产构建 → dist/
```
- 登录：`admin` / `admin123`（本地已重置），租户 `000000`。
- 接口走**同源 `/prod-api`** 反代到后端（`VITE_APP_BASE_API=/prod-api`）；生产 nginx 在 `admin.zgypzp.com` 已配该反代。

## 约定
遵循全局 `~/.codex/AGENTS.md`：改 JS/TS/Vue 时加**意图性注释**（组件职责、数据来源、非显然的字段映射、重要副作用）；重大改动先列选项让用户拍板；提交信息用清晰中文。
项目整体背景、生产环境与安全待办见后端仓库 `RuoYi-Vue-Plus/docs/`。

## Skills(本仓,在 `.claude/skills/`)
- **`frontend-code-review`** — 审查本仓改动/指定文件/片段(重点 `src/views/recruitment/**`):Element Plus 用法、运营台路径口径(直写 `/admin/*`、**不补 /api**)、v-hasPermi、三态、敏感数据脱敏、TS 与注释;输出 🔴🟡🟢,默认只报告不改码。框架自带 system/monitor 等页面跟随上游,不成片重写。
- 疑似**后端字段缺失/404** → 用工作区根的 `api-contract` 技能跨仓核对。

## 任务完成后汇报格式
1. 修改内容 2. 修改原因 3. 验证方式(`pnpm lint:eslint` / `pnpm build:prod` / 页面点验) 4. 风险与未验证点 5. 建议下一步
