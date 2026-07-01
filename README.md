# findwork 平台运营总后台（RuoYi-Vue-Plus-UI）

平台运营总后台，基于 RuoYi-Vue-Plus 官方 plus-ui 二次开发，是后端仓 `RuoYi-Vue-Plus` 的管理前端。

## 本地开发

日常完整联调优先使用工作区根目录：

```bash
cd ~/Desktop/Project
./dev.sh
```

只启动本前端时：

```bash
cd ~/Desktop/Project/RuoYi-Vue-Plus-UI
pnpm install
pnpm dev
```

- 访问地址：`http://localhost:8081`
- 后端代理：`.env.development` 中的 `VITE_PROXY_TARGET=http://127.0.0.1:8088`
- dev 接口基址：`/dev-api`
- prod 接口基址：`/prod-api`

## 登录口径

当前 dev 库是生产快照，使用生产账号登录（超管 `admin` + 生产密码，或实际角色账号），租户 `000000`。旧本地弱口令不再作为当前 dev 快照默认口径。

## 常用脚本

```bash
pnpm dev
pnpm build:prod
pnpm build:dev
pnpm preview
pnpm lint:eslint
pnpm lint:eslint:fix
pnpm prettier
```

## 协作入口

- 本仓规则：`AGENTS.md`
- 本地完整启动：工作区根 `README.md`
- 部署/回滚：工作区根 `.agents/runbooks/server-deploy.md`
- 后端背景与安全待办：`../RuoYi-Vue-Plus/AGENTS.md`、`../RuoYi-Vue-Plus/docs/SECURITY-KEY-ROTATION.md`
