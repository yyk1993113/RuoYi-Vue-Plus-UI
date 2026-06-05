# findwork 平台运营总后台（RuoYi-Vue-Plus-UI）

平台**运营总后台**（公司内部用），基于 RuoYi-Vue-Plus 官方 plus-ui 二次开发，是后端仓 `RuoYi-Vue-Plus` 的管理前端。

## 技术栈 / 端口
Vue 3 + Vite + Element Plus + UnoCSS + TypeScript + Pinia，包管理 **pnpm**。本地 dev 端口 **8081**。

## 前置依赖
- **Node ≥ 20.19、pnpm**
- 后端 API 在 `http://localhost:8080`（登录与全部数据靠它，必须先起）

## 快速开始

### 1）先把后端 + MySQL + Redis 跑起来
本后台是纯前端，必须有后端。clone 后端仓 `RuoYi-Vue-Plus` 并起好（摘要，详见其 README）：

```bash
mysql -u root -proot -e "CREATE DATABASE IF NOT EXISTS find_work DEFAULT CHARSET utf8mb4;"
cd RuoYi-Vue-Plus/script/sql
mysql -u root -proot find_work < ry_vue_5.X.sql
mysql -u root -proot find_work < ry_workflow.sql
mysql -u root -proot find_work < ry_job.sql
mysql -u root -proot find_work < ruoyi_recruitment_full.sql
for f in v1_complete/*.sql; do mysql -u root -proot find_work < "$f"; done
cd ../.. && export JAVA_HOME=$(/usr/libexec/java_home -v 17)
mvn install -DskipTests -pl ruoyi-admin -am
mvn spring-boot:run -pl ruoyi-admin -Dspring-boot.run.profiles=dev   # → :8080
```
> MySQL `root/root`、Redis 密码 `ruoyi123` 是后端 `application-dev.yml` 的本地默认值。

### 2）装依赖 + 起前端
```bash
cd RuoYi-Vue-Plus-UI
pnpm install
pnpm dev            # → http://localhost:8081
```

### 3）登录
`admin` / `admin123`，租户 `000000`。其它角色测试号：`test`(运营) / `test_auditor`(审核) / `test_finance`(财务)，密码同为 `admin123`。

## 接口代理 / 配置
- **开发**：`VITE_APP_BASE_API=/dev-api`（`.env.development`），Vite 把 `/dev-api/*` 反代到 `http://localhost:8080` 并剥掉前缀（见 `vite.config.ts`）。
- **生产**：`VITE_APP_BASE_API=/prod-api`，由 nginx（`admin.zgypzp.com`）反代到后端。
- **接口加解密**：`VITE_APP_ENCRYPT=true`（RSA/AES），需与后端密钥匹配，勿单方面改。
- dev 端口由 `.env.development` 的 `VITE_APP_PORT=8081` 决定。

## 脚本
```bash
pnpm dev               # 开发服务器（--mode development，端口 8081）
pnpm build:prod        # 生产构建 → dist/
pnpm build:dev         # 以 development 模式构建
pnpm preview           # 预览构建产物
pnpm lint:eslint       # ESLint 检查
pnpm lint:eslint:fix   # ESLint 自动修
pnpm prettier          # Prettier 格式化
```

## 约定 / 分支
改 JS/TS/Vue 加**意图性注释**（组件职责、数据来源、非显然字段映射、重要副作用）；重大改动先列选项让用户拍板；提交信息用清晰中文。
分支：只用 `dev`(开发) + `main`(稳定)，日常在 `dev` 改，**别直接改 `main`**。
项目整体背景、生产环境、安全待办见后端仓 `RuoYi-Vue-Plus/docs/`。
