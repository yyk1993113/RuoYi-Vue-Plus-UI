// 运营台招聘域 —— 业务状态枚举与「状态码 → 中文标签 / el-tag 颜色」集中映射。
// 目的：消除 13 个视图中复制的 `v-if row.status==='0'` 标签 / 颜色阶梯。
// 迁移原则：每个域的映射逐条搬自原视图模板，默认项（fallback）对应原 `v-else` 兜底分支，
//          保证 <el-tag> 渲染出的文案与颜色在改造前后完全一致。
// 用法：<el-tag :type="taskStatusMeta(row.status).type">{{ taskStatusMeta(row.status).label }}</el-tag>

// el-tag 支持的语义类型（'' 为默认灰色）
export type TagType = '' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

export interface StatusMeta {
  label: string;
  type: TagType;
}

// 通用解析：命中映射取之，否则返回该域的兜底（对应原模板 v-else 分支）。
function resolve(map: Record<string, StatusMeta>, status: string | undefined | null, fallback: StatusMeta): StatusMeta {
  return (status != null && map[status]) || fallback;
}

// ========== 任务状态 task：pending_confirm / in_progress / submitted / rejected / completed / cancelled ==========
// 来源：履约 1.0 新契约。运营台只识别语义状态,避免旧数字码继续扩散。
const TASK_STATUS: Record<string, StatusMeta> = {
  pending_confirm: { label: '待确认', type: 'warning' },
  in_progress: { label: '进行中', type: 'primary' },
  submitted: { label: '待核验', type: 'warning' },
  rejected: { label: '已退回', type: 'danger' },
  completed: { label: '已完成', type: 'success' },
  cancelled: { label: '已取消', type: 'info' }
};
export const taskStatusMeta = (status?: string | null): StatusMeta => resolve(TASK_STATUS, status, { label: '未知', type: 'info' });

// ========== 发票状态 invoice：0未开票 / 1已开票 / 2已作废 ==========
// 来源：invoice.vue 表格列与详情弹窗的 el-tag 阶梯；原 v-else 兜底为「已作废 / danger」。
const INVOICE_STATUS: Record<string, StatusMeta> = {
  '0': { label: '未开票', type: 'warning' },
  '1': { label: '已开票', type: 'success' },
  '2': { label: '已作废', type: 'danger' }
};
export const invoiceStatusMeta = (status?: string | null): StatusMeta => resolve(INVOICE_STATUS, status, INVOICE_STATUS['2']);

// ========== 台账结算状态 ledger.status：0待结算 / 1已结算 / 2已取消 ==========
// 来源：后端 Ledger.status。运营端「履约监控台」详情的资金主线展示该任务最新台账的结算状态。
// 未命中（含 undefined/null）兜底为「待结算 / warning」。
const LEDGER_STATUS: Record<string, StatusMeta> = {
  '0': { label: '待结算', type: 'warning' },
  '1': { label: '已结算', type: 'success' },
  '2': { label: '已取消', type: 'info' }
};
export const ledgerStatusMeta = (status?: string | null): StatusMeta => resolve(LEDGER_STATUS, status, LEDGER_STATUS['0']);

// ========== 履约异常类型 abnormalType（运营端只读预警，无对应数据库字段，为服务端按阈值计算的派生维度）==========
// pending_timeout 待确认超时 / verify_timeout 待核验超时(催企业核验) / completed_unsettled 完成未结算。
// 用于异常预警卡标题着色与列表「异常」列打标；未命中兜底为「异常 / danger」。
const TASK_ABNORMAL: Record<string, StatusMeta> = {
  pending_timeout: { label: '待确认超时', type: 'warning' },
  verify_timeout: { label: '待核验超时', type: 'danger' },
  completed_unsettled: { label: '完成未结算', type: 'danger' }
};
export const taskAbnormalMeta = (type?: string | null): StatusMeta => resolve(TASK_ABNORMAL, type, { label: '异常', type: 'danger' });

// ========== 台账发票绑定状态 ledger.invoiceStatus：0未绑定 / 1已绑定 ==========
// 来源：后端台账 Ledger.invoiceStatus（台账是否已绑定发票）。
// 注意：这是「台账侧的发票绑定状态」，区别于上方 invoiceStatusMeta（发票自身的开票/作废状态）。
// 未命中（含 undefined/null）兜底为「未绑定 / info」。
const LEDGER_INVOICE_STATUS: Record<string, StatusMeta> = {
  '0': { label: '未绑定', type: 'info' },
  '1': { label: '已绑定', type: 'success' }
};
export const ledgerInvoiceStatusMeta = (status?: string | null): StatusMeta => resolve(LEDGER_INVOICE_STATUS, status, LEDGER_INVOICE_STATUS['0']);

// ========== 企业认证状态 company：0待审核 / 1已认证 / 2已禁用 ==========
// 来源：company.vue 表格列与详情弹窗的 el-tag 阶梯；原 v-else 兜底为「已禁用 / danger」。
const COMPANY_STATUS: Record<string, StatusMeta> = {
  '0': { label: '待审核', type: 'warning' },
  '1': { label: '已认证', type: 'success' },
  '2': { label: '已禁用', type: 'danger' },
  '4': { label: '草稿', type: 'warning' }
};
export const companyStatusMeta = (status?: string | null): StatusMeta => resolve(COMPANY_STATUS, status, COMPANY_STATUS['2']);

// ========== 企业认证材料审核状态 cert：0待审核 / 1已通过 / 2已拒绝 ==========
// 来源：company.vue 详情「认证历史」卡片的 el-tag 阶梯；原 v-else 兜底为「已拒绝 / danger」。
const CERT_STATUS: Record<string, StatusMeta> = {
  '0': { label: '待审核', type: 'warning' },
  '1': { label: '已通过', type: 'success' },
  '2': { label: '已拒绝', type: 'danger' }
};
export const certStatusMeta = (status?: string | null): StatusMeta => resolve(CERT_STATUS, status, CERT_STATUS['2']);

// ========== 岗位状态 job：0待审核 / 1已上架 / 2已下架 / 6驳回 ==========
// 来源：job.vue 表格列与详情弹窗的 el-tag 阶梯；原 v-else 兜底为「已下架 / info」。
// 6=驳回：平台审核未通过，区别于企业自主下架(2)；小程序企业端据此展示驳回原因并提供「修改重新提交」。
const JOB_STATUS: Record<string, StatusMeta> = {
  '0': { label: '待审核', type: 'warning' },
  '1': { label: '已上架', type: 'success' },
  '2': { label: '已下架', type: 'info' },
  '6': { label: '驳回', type: 'danger' }
};
export const jobStatusMeta = (status?: string | null): StatusMeta => resolve(JOB_STATUS, status, JOB_STATUS['2']);

// ========== 用工性质 jobType：0全职 / 1兼职 / 2临时工 / 3项目制 ==========
// 来源：job.vue 表格列与详情弹窗的 el-tag 阶梯。
// 兜底为「未知 / info」，避免把字段缺失伪装成正常业务值。
const JOB_TYPE: Record<string, StatusMeta> = {
  '0': { label: '全职', type: 'success' },
  '1': { label: '兼职', type: 'warning' },
  '2': { label: '临时工', type: 'danger' },
  '3': { label: '项目制', type: '' }
};
export const jobTypeMeta = (jobType?: string | null): StatusMeta => resolve(JOB_TYPE, jobType, { label: '未知', type: 'info' });

// ========== 投递状态 apply：0已投递 / 1面试邀请 / 2已录用 / 3已拒绝 ==========
// 来源：apply.vue 详情头部 getStatusLabel 与 index.vue「最新投递」列表的状态着色。
// 注意：apply.vue 表格列对 '0' 还会按 isRead 细分「新投递/已投递」并切换 warning/info，
//      属该列特有逻辑，仍保留在视图内，不并入此通用映射；本表只承载「投递状态 → 标准文案/颜色」。
// 未命中（含 undefined）兜底为「未知 / info」，与原 getStatusLabel 的 '未知' 默认一致。
const APPLY_STATUS: Record<string, StatusMeta> = {
  submitted: { label: '已投递', type: 'info' },
  interview: { label: '面试邀请', type: 'primary' },
  hired: { label: '已录用', type: 'success' },
  rejected: { label: '已拒绝', type: 'danger' },
  '0': { label: '已投递', type: 'info' },
  '1': { label: '面试邀请', type: 'primary' },
  '2': { label: '已录用', type: 'success' },
  '3': { label: '已拒绝', type: 'danger' }
};
export const applyStatusMeta = (status?: string | null): StatusMeta => resolve(APPLY_STATUS, status, { label: '未知', type: 'info' });
