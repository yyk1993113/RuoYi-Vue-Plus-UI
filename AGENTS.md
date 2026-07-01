# findwork 平台总后台 (RuoYi-Vue-Plus-UI)

平台**运营总后台**（公司内部用），基于 RuoYi-Vue-Plus 官方 plus-ui。配合后端仓库 `RuoYi-Vue-Plus` 使用，是其管理前端。

## 技术栈 / 端口
Vue 3 + Vite + pnpm + Element Plus + UnoCSS + TypeScript + Pinia。Node ≥ 20.19。本地 dev 端口约定 **8081**。

## 启动 / 构建
日常完整联调用工作区根目录 `./dev.sh`，它会同时启动后端、运营台、企业台和小程序构建。

```bash
pnpm install
pnpm dev                                             # 开发 → http://localhost:8081
pnpm build:prod                                        # 生产构建 → dist/
```
- 登录：dev 库是生产快照，用生产账号登录（超管 `admin` + 生产密码，或实际角色账号），租户 `000000`。旧本地弱口令不再作为当前 dev 快照的默认口径。
- 接口走同源代理：dev `/dev-api`（`.env.development` 的 `VITE_PROXY_TARGET=http://127.0.0.1:8088` → 本机后端单体）/ prod `/prod-api`（生产 nginx 在 `admin.zgypzp.com` 反代）。

## 约定
遵循全局 `~/.codex/AGENTS.md`：改 JS/TS/Vue 时加**意图性注释**（组件职责、数据来源、非显然的字段映射、重要副作用）；重大改动先列选项让用户拍板；提交信息用清晰中文。
项目整体背景、生产环境与安全待办见后端仓库 `RuoYi-Vue-Plus/docs/`。

## Review Focus
- 审查本仓改动时重点看 `src/views/recruitment/**`：Element Plus 用法、运营台路径口径（直写 `/admin/*`，不补 `/api`）、`v-hasPermi`、三态、敏感数据脱敏、TS 与意图性注释。
- 疑似后端字段缺失、404 或路径口径不一致时，先按工作区根 `.agents/references/api-contract.md` 核对跨端契约，别在前端默默兜底。

## 任务完成后汇报格式
1. 修改内容 2. 修改原因 3. 验证方式（`pnpm lint:eslint` / `pnpm build:prod` / 页面点验）4. 风险与未验证点 5. 建议下一步
