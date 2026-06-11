# 审查清单(RuoYi-Vue-Plus-UI / 运营总后台)

## 1. 正确性与三态

- [ ] 每个请求点有 loading(`v-loading`)、error(统一拦截器 + 必要的 catch)、empty(空表占位)三态。
- [ ] 列表分页 `pageNum`/`pageSize` 对齐后端 `PageQuery`;响应按 `{ rows, total }` / `{ code, msg, data }` 解包。
- [ ] 后端可能为 null 的字段渲染前兜底;疑似后端缺字段(前端要展示但 VO 没有)→ **转 api-contract 技能核对**,别默默兜底。
- [ ] 审核/状态流转页:操作成功后刷新列表与统计,状态码→文案映射集中在 enums/constants。

## 2. Element Plus 用法

- [ ] el-form 校验与后端校验口径一致,提交前 `validate()`;el-dialog 关闭复位。
- [ ] 审核驳回、删除、强制下线等危险操作有 `ElMessageBox.confirm` 二次确认。
- [ ] 表格 formatter/字典翻译用项目现有字典 hooks(跟随 plus-ui 既有页面范式,如 `useDict`),不在模板写复杂表达式。

## 3. 路径口径与权限(运营台特例)

- [ ] 运营台**不补 /api**:业务接口直写 `/admin/recruitment/*`、`/admin/content/*`,框架接口直写 `/system/*` 等(契约见 `_hub/API-PATH-CONVENTION.md` 原则 5)。
- [ ] 不硬编码 host 或 `/prod-api`;基址由 `VITE_APP_BASE_API` + 代理/nginx 处理。
- [ ] 新增运营页面:路由/菜单走后端 `sys_menu`(配套 SQL 在后端仓 `script/sql/v1_complete/menu.sql` 范式),按钮级权限用 `v-hasPermi`;**按钮隐藏≠权限**,真正的拦截在后端 `@SaCheckRole("admin")`。
- [ ] 不向后端传 `userId`/`role`/租户参数让其"代为生效"。

## 4. 敏感数据(运营台能看到全平台数据,口子最大)

- [ ] 求职者手机号、身份证、简历详情:列表默认脱敏,详情页按需求展示;不写 localStorage、不打 console。
- [ ] 导出功能(台账/发票/用户):确认接口侧有权限与行数控制;前端不自行拼全量导出。
- [ ] 不在源码/`.env` 提交密钥。

## 5. TS 类型、注释与范式

- [ ] api 函数有入参/出参类型(`src/api/recruitment/*` 对齐后端 VO/BO,放同目录 types),不裸 `any`。
- [ ] 按全局约定加**意图性注释**:组件职责、数据来源(哪个接口)、非显然字段映射、重要副作用。
- [ ] 新页面跟随本仓既有 recruitment 页面的写法(组合式 API、查询区+表格+弹窗结构),不自创目录或引入新 UI 范式;样式优先 UnoCSS 原子类与现有 scss。
