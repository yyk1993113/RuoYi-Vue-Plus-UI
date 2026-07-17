import request from '@/utils/request';
import { UserForm } from '@/api/system/user/types';

// ========== 企业相关 ==========

export interface CompanyStatistics {
  totalCount: number;
  pendingCount: number;
  approvedCount: number;
  disabledCount: number;
  silencedCount: number;
}

export interface CompanyVO {
  companyId?: number;
  companyNo?: string;
  companyName?: string;
  description?: string;
  contactPerson?: string;
  contactPhone?: string;
  // 联系人微信（后端 company.contact_wechat），详情主体信息展示用
  contactWechat?: string;
  logoUrl?: string;
  // 营业执照图片地址（后端 company.business_license），资质图片预览用
  businessLicense?: string;
  status?: string;
  // 业务归档状态 0:正常 1:已删除；活动列表默认只查正常企业。
  deleted?: string;
  deletedTime?: string;
  deletedBy?: number;
  deleteReason?: string;
  // 平台禁言状态 0:未禁言 1:禁言中（后端 company.is_silenced）
  isSilenced?: string;
  silenceReason?: string;
  silenceTime?: string;
  userId?: number;
  createTime?: string;
  updateTime?: string;
  remark?: string;
  jobCount?: number;
  applyCount?: number;
}

// ========== 岗位相关 ==========

export interface JobStatistics {
  totalCount: number;
  pendingCount: number;
  onlineCount: number;
  offlineCount: number;
}

export interface JobVO {
  jobId?: number;
  jobNo?: string;
  companyId?: number;
  companyName?: string;
  positionId?: number | string;
  positionName?: string;
  jobName?: string;
  salary?: string;
  location?: string;
  categoryId?: number | string;
  categoryName?: string;
  jobType?: string;
  jobTypeName?: string;
  experience?: string;
  experienceName?: string;
  description?: string;
  publishTime?: string;
  applyCount?: number;
  status?: string;
  statusName?: string;
  createTime?: string;
  remark?: string;
  isRecommend?: string;
  isHot?: string;
  // 意向结算：来自 job_settlement_intent，岗位管理列表展示/编辑/线索入口使用。
  settlementIntentId?: number | string;
  settlementIntentType?: string;
  settlementNeedFollowUp?: string;
  settlementFollowStatus?: string;
  settlementFollowRemark?: string;
  settlementCreateTime?: string;
}

// 岗位完整字段 VO（运营台审核详情用）。
// 数据来源：后端 AdminJobDetailController.getJobFullDetail
//   (GET /admin/recruitment/jobDetail/{jobId}) → com.ruoyi.project.domain.vo.JobFullVO。
// 字段与 JobFullVO 一一对应；所有枚举后端已附带 *Name 中文译名，前端可直接渲染无需再硬编码映射。
// 注意：workTime / benefits 为 JSON 字符串（后端原样透传），前端需自行 JSON.parse 后渲染。
export interface JobFullVO {
  tenantId?: string;
  jobId?: number;
  jobNo?: string;
  companyId?: number;
  companyName?: string;
  positionId?: number | string;
  positionName?: string;
  jobName?: string;
  // 用工性质 0:全职 1:兼职 2:临时工 3:项目制
  jobType?: string;
  jobTypeName?: string;
  // 用工性质（兼容旧字段）0:全职 1:兼职
  employmentType?: string;
  employmentTypeName?: string;
  // 薪资
  salary?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryUnit?: string;
  salaryUnitName?: string;
  location?: string;
  province?: string;
  city?: string;
  district?: string;
  regionScope?: string;
  // 职位所属类目
  categoryId?: number | string;
  categoryName?: string;
  category?: string;
  // 岗位实际工作地点
  workAddress?: string;
  experience?: string;
  experienceName?: string;
  // 学历要求 0:不限 1:初中 2:高中 3:中专 4:大专 5:本科 6:硕士 7:博士
  education?: string;
  educationName?: string;
  // 招聘人数
  recruitNumber?: number;
  // 兼职工作时间类型 0:固定时段 1:时间区间
  workTimeType?: string;
  // 兼职工作时间（JSON 字符串，需前端解析）
  workTime?: string;
  // 期望到岗时间
  expectedStartDate?: string;
  description?: string;
  // 岗位福利（JSON 数组字符串，需前端解析）
  benefits?: string;
  // 团队介绍
  teamIntro?: string;
  // 任职附加条件
  additionalConditions?: string;
  // 职位亮点
  highlights?: string;
  status?: string;
  statusName?: string;
  publishTime?: string;
  applyCount?: number;
  browseCount?: number;
  isRecommend?: string;
  isHot?: string;
  createTime?: string;
  updateTime?: string;
  remark?: string;
  // 意向结算：来自 job_settlement_intent，详情弹窗展示使用。
  settlementIntentId?: number | string;
  settlementIntentType?: string;
  settlementNeedFollowUp?: string;
  settlementFollowStatus?: string;
  settlementFollowRemark?: string;
  settlementCreateTime?: string;
}

// ========== 投递相关 ==========

export interface ApplyStatistics {
  totalCount: number;
  appliedCount: number;
  interviewCount: number;
  hiredCount: number;
  rejectedCount: number;
  unreadCount: number;
}

export interface ApplyVO {
  applyId?: number;
  /** 对外展示的投递业务编号，由流水号规则生成。 */
  applyNo?: string;
  jobId?: number;
  jobName?: string;
  salary?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryUnit?: string;
  companyId?: number | string;
  companyName?: string;
  userId?: number | string;
  userName?: string;
  phonenumber?: string;
  phone?: string;
  applyTime?: string;
  status?: string;
  statusName?: string;
  isRead?: string;
  message?: string;
  createTime?: string;
  avatar?: string;
  avatarUrl?: string;
  resumeAvatarUrl?: string;
  exchangeStatus?: string;
  exchanged?: boolean;
  contactPerson?: string;
  contactPhone?: string;
  recruiterContact?: string;
  jobSeekerContact?: string;
  realName?: string;
  education?: string;
  workYears?: string;
  city?: string;
  expectPosition?: string;
  skills?: string;
  summary?: string;
}

// ========== 任务相关 ==========

export interface TaskStatistics {
  totalCount: number;
  inProgressCount: number;
  pendingVerifyCount: number;
  verifiedCount: number;
  rejectedCount: number;
  settledCount: number;
}

export interface TaskVO {
  taskId?: number;
  /** 业务编码：来自 serialRule 的 FUL 编码，列表展示优先使用。 */
  taskNo?: string;
  jobId?: number;
  jobName?: string;
  applyId?: number;
  userId?: number;
  workerName?: string;
  workerPhone?: string;
  workerAvatar?: string;
  companyId?: number;
  companyName?: string;
  photoPath?: string;
  reportContent?: string;
  workTime?: string;
  address?: string;
  status?: string;
  statusName?: string;
  remark?: string;
  createTime?: string;
  updateTime?: string;
  // 薪资（来自 job JOIN）与三段履约照片
  salaryMin?: number;
  salaryMax?: number;
  salaryUnit?: string;
  arrivalPhotos?: string;
  midPhotos?: string;
  finishPhotos?: string;
  // 核验结果（B 端录入）
  workHours?: number;
  settleAmount?: number;
  // 资金主线：该任务最新一条台账（后端详情 LEFT JOIN ledger，无台账时为空）
  ledgerId?: number;
  orderNo?: string;
  ledgerStatus?: string; // 台账结算状态 0待结算/1已结算/2已取消
  ledgerInvoiceStatus?: string; // 台账发票绑定状态 0未绑定/1已绑定
}

// 履约异常统计（运营端只读预警卡，对应后端 TaskAbnormalStatVO）
export interface TaskAbnormalStat {
  pendingTimeout: number; // 待确认超时
  verifyTimeout: number; // 待核验超时
  pendingSettlement?: number; // 待结算提醒：临时由前端用 ledger/list status=0 补齐，后端待并入统计 VO
  completedUnsettled: number; // 完成未结算
}

// ========== 台账相关 ==========

export interface LedgerStatistics {
  totalCount: number;
  totalAmount: number;
  todayAmount: number;
  pendingCount?: number; // 待结算台账数，后端待补字段
  pendingAmount?: number; // 待结算金额合计，后端待补字段
}

export interface LedgerVO {
  ledgerId?: number | string;
  taskId?: number;
  // 岗位ID（后端 Ledger.jobId），操作/跳转用；展示编号优先用 jobNo
  jobId?: number;
  jobNo?: string;
  // 投递ID（后端 Ledger.applyId），操作/跳转用；展示编号优先用 applyNo
  applyId?: number;
  applyNo?: string;
  taskNo?: string;
  jobSeekerNo?: string;
  companyId?: number | string;
  companyName?: string;
  userId?: number;
  userName?: string;
  // 台账编号（订单号），台账列表「台账编号」列用此字段
  orderNo?: string;
  // 发票绑定状态 0:未绑定 1:已绑定（后端 Ledger.invoiceStatus）
  invoiceStatus?: string;
  // 台账业务状态（后端 Ledger.status）0待结算/1已结算/2已取消
  status?: string;
  timestamp?: string;
  amount?: number;
  createTime?: string;
  // 结算可追溯字段（运营标记已结算时回填）
  settleTime?: string;
  settleRemark?: string;
}

// ========== 发票相关 ==========

export interface InvoiceStatistics {
  totalCount: number;
  pendingCount: number;
  issuedCount: number;
  cancelledCount: number;
  totalAmount?: number;
  pendingAmount?: number;
  issuedAmount?: number;
  cancelledAmount?: number;
  monthNewCount?: number;
  monthNewAmount?: number;
  monthDeltaCount?: number;
  monthDeltaAmount?: number;
}

export interface InvoiceVO {
  invoiceId?: number | string;
  invoiceNo?: string;
  ledgerId?: number | string;
  companyId?: number | string;
  companyName?: string;
  filePath?: string;
  ossId?: number | string;
  fileOssId?: number | string;
  fileId?: number | string;
  status?: string;
  statusName?: string;
  createTime?: string;
  remark?: string;
}

// 运营台-发票上传/绑定管理列表 VO（对应后端 InvoiceManageVO）。
// 金额 amount / 绑定台账号 ledgerOrderNo 派生自绑定台账 ledger；createByName 为上传人昵称。
export interface InvoiceManageVO {
  invoiceId?: number | string;
  invoiceNo?: string;
  ledgerId?: number | string;
  ledgerOrderNo?: string;
  companyId?: number | string;
  filePath?: string;
  ossId?: number | string;
  fileOssId?: number | string;
  fileId?: number | string;
  status?: string;
  amount?: number;
  createBy?: number;
  createByName?: string;
  createTime?: string;
  updateTime?: string;
  remark?: string;
}

// 运营台-发票上传请求体（对应后端 InvoiceUploadRequest）。
// filePath 必填；其余可空，绑定台账时金额与归属企业以台账为准。
export interface InvoiceUploadForm {
  invoiceNo?: string;
  filePath?: string;
  ossId?: number | string;
  fileOssId?: number | string;
  fileId?: number | string;
  ledgerId?: number | string;
  companyId?: number | string;
  amount?: number;
  status?: string;
  remark?: string;
}

// ========== 综合概览 ==========

// 工作台「今日待办 + 风险提醒」VO（对应后端 GET /admin/recruitment/dashboard/worklist）。
// 数据来源：后端 dashboard/worklist 聚合三类待办计数 + 近期高风险操作留痕（取自 rec_audit_log）。
// - pendingCompanies/pendingJobs/pendingInvoices：三张可点待办卡片的角标数字（点击跳对应审核/发票页）。
// - riskAlerts：风险提醒列表项，结构复用审计留痕字段（action 动作 / targetType 对象类型 /
//   targetNo 对象编号 / operName 操作人 / operTime 时间），其余后端附带字段宽松接收。
export interface WorklistRiskAlert {
  action?: string;
  targetType?: string;
  targetNo?: string;
  operName?: string;
  operTime?: string;
  // 后端可能附带的其它留痕字段（detail/remark 等），保持宽松不强约束
  [key: string]: any;
}

export interface DashboardWorklistVO {
  // 待审核企业数（待办卡片）
  pendingCompanies: number;
  // 待审核岗位数（待办卡片）
  pendingJobs: number;
  // 待上传发票数（待办卡片）
  pendingInvoices: number;
  // 风险提醒列表（近期高风险操作留痕）
  riskAlerts: WorklistRiskAlert[];
}

export interface RecruitmentOverview {
  totalCompanies: number;
  pendingCompanies: number;
  approvedCompanies: number;
  activeCompanies: number;
  newCompaniesDelta: number;
  totalJobs: number;
  pendingJobs: number;
  onlineJobs: number;
  newJobsDelta: number;
  totalApplies: number;
  todayApplies: number;
  pendingApplies: number;
  processedApplies: number;
  newAppliesDelta: number;
  totalTasks: number;
  inProgressTasks: number;
  silencedCompanies: number;
  silencedUsers: number;
}

export interface ApplyTrend {
  date: string;
  count: number;
}

export interface JobTypeDistribution {
  jobType: string;
  typeName: string;
  count: number;
}

// ========== 联系方式交换相关 ==========

export interface ExchangeStatistics {
  totalCount: number;
  exchangedCount: number;
  failedCount: number;
  exchangeRate: number;
}

export interface ExchangeRequestVO {
  id?: number;
  deliveryId?: number;
  recruiterId?: number;
  jobSeekerId?: number;
  exchangeType?: string;
  exchangeTypeName?: string;
  status?: string;
  statusName?: string;
  recruiterContact?: string;
  jobSeekerContact?: string;
  createTime?: string;
  jobId?: number;
  jobName?: string;
  companyName?: string;
}

// ========== 热门职位 ==========

export interface HotJobVO {
  jobId?: number;
  jobName?: string;
  companyName?: string;
  applyCount?: number;
  browseCount?: number;
  salary?: string;
  location?: string;
  createTime?: string;
}

// ========== 异常投递记录 ==========

export interface ExceptionApplyVO {
  applyId?: number;
  jobId?: number;
  jobName?: string;
  companyName?: string;
  userId?: number;
  userName?: string;
  applyTime?: string;
  exceptionType?: string;
  exceptionTypeName?: string;
  status?: string;
  statusName?: string;
  createTime?: string;
}

// ========== 查询参数 ==========

export interface CompanyQuery {
  pageNum?: number;
  pageSize?: number;
  companyId?: number | string;
  companyNo?: string;
  companyName?: string;
  description?: string;
  contactPerson?: string;
  contactPhone?: string;
  status?: string;
  // 业务归档状态筛选；后端未传时默认按未删除企业查询。
  deleted?: string;
  userId?: number;
  isSilenced?: string;
  jobCount?: number | string;
  applyCount?: number | string;
  feedbackCount?: number | string;
  noFeedbackCount?: number | string;
  params?: Record<string, any>;
}

export interface JobQuery {
  pageNum?: number;
  pageSize?: number;
  jobName?: string;
  jobId?: number | string;
  jobNo?: string;
  companyId?: number | string;
  companyName?: string;
  status?: string;
  jobType?: string;
  isRecommend?: string;
  isHot?: string;
  workAddress?: string;
  salary?: string;
  applyCount?: number | string;
  params?: Record<string, any>;
}

export interface ApplyQuery {
  pageNum?: number;
  pageSize?: number;
  applyId?: number | string;
  /** 对外展示的投递业务编号，精确匹配 apply.apply_no。 */
  applyNo?: string;
  jobId?: number;
  jobName?: string;
  userId?: number | string;
  userName?: string;
  status?: string;
  companyName?: string;
  /** 对外展示的企业业务编号，精确匹配 company.company_no。 */
  companyNo?: string;
  isRead?: string;
  beginTime?: string;
  endTime?: string;
  // 企业管理「已反馈/未反馈」弹窗用：companyId 精确过滤企业；feedback=0 未反馈 / 1 已反馈
  companyId?: number | string;
  feedback?: string;
}

export interface TaskQuery {
  pageNum?: number;
  pageSize?: number;
  jobId?: number;
  applyId?: number;
  companyId?: number | string;
  userId?: number;
  status?: string;
  // 运营端监控台筛选维度（后端 AdminRecruitmentController#listTask 已支持）
  companyName?: string; // 企业名模糊
  jobName?: string; // 岗位名模糊
  beginTime?: string; // 创建时间起（'yyyy-MM-dd HH:mm:ss'）
  endTime?: string; // 创建时间止
  abnormalType?: string; // 异常类型：pending_timeout/verify_timeout/completed_unsettled；settlement_pending 为待补后端筛选
}

export interface LedgerQuery {
  pageNum?: number;
  pageSize?: number;
  companyId?: number | string;
  jobId?: number;
  applyId?: number;
  taskId?: number;
  userId?: number;
  orderNo?: string;
  status?: string; // 结算状态筛选 0待结算/1已结算/2已取消
}

export interface InvoiceQuery {
  pageNum?: number;
  pageSize?: number;
  companyId?: number | string;
  ledgerId?: number | string;
  ledgerOrderNo?: string;
  orderNo?: string;
  createBy?: number | string;
  createByName?: string;
  beginTime?: string;
  endTime?: string;
  status?: string;
}

export interface DashboardQuery {
  days?: number;
  type?: string;
}

// ========== 审计日志相关 ==========
// 数据来源：后端 AdminAuditLogController(/admin/auditLog)，读取 rec_audit_log 表。
// 字段与 com.ruoyi.project.domain.RecAuditLog 一一对应（operName/operTime/action/targetType/targetNo 等）。

export interface AuditLogVO {
  logId?: number;
  operId?: number;
  operName?: string;
  /** 后端按 operId 回查的当前角色名称，仅用于审计展示，不属于 rec_audit_log 落库字段。 */
  operRole?: string;
  operTime?: string;
  action?: string;
  targetType?: string;
  targetNo?: string;
  beforeStatus?: string;
  afterStatus?: string;
  detail?: string;
  remark?: string;
  createTime?: string;
}

// 审计日志检索条件。beginTime/endTime 基于 oper_time 过滤（后端 ge/le），
// 由前端日期范围控件拆分后下发；operName 模糊匹配，其余精确匹配。
export interface AuditLogQuery {
  pageNum?: number;
  pageSize?: number;
  operName?: string;
  operId?: number;
  action?: string;
  targetType?: string;
  targetNo?: string;
  beginTime?: string;
  endTime?: string;
}

// ========== 企业审核历史相关 ==========
// 数据来源：后端 AdminJobDetailController.getCompanyAuditHistory
//   (GET /admin/recruitment/company/{companyId}/auditHistory) → CompanyAuditHistoryVO。
// 聚合两份原始列表：auditLogs（rec_audit_log 操作留痕，复用 AuditLogVO 形状）
// 与 certHistory（company_cert 历次认证材料与审核结论）。前端按时间渲染时间线 / 历史卡片。

// company_cert 历次认证材料与审核结论，字段与后端 CompanyCert 实体一一对应。
export interface CompanyCertVO {
  certId?: number;
  companyId?: number;
  companyName?: string;
  creditCode?: string;
  legalPersonName?: string;
  legalPersonPhone?: string;
  registeredAddress?: string;
  officeAddress?: string;
  businessLicense?: string;
  legalPersonIdFront?: string;
  legalPersonIdBack?: string;
  bankAccountProof?: string;
  authLetter?: string;
  // 办公场地实景照片，可能为逗号分隔的多图地址
  officePhotos?: string;
  // 认证状态 0:待审核 1:已通过 2:已拒绝
  status?: string;
  auditRemark?: string;
  auditUserId?: number;
  auditTime?: string;
  createTime?: string;
}

export interface CompanyAuditHistoryVO {
  companyId?: number;
  // 操作留痕，后端已按 operTime 倒序
  auditLogs?: AuditLogVO[];
  // 认证历史，后端已按审核/创建时间倒序
  certHistory?: CompanyCertVO[];
}

// ========== API 方法 ==========

const baseUrl = '/admin/recruitment';

// ---------- 推广管理 ----------

export interface PromoterVO {
  promoterId?: string | number;
  ownerUserId?: string | number;
  name?: string;
  phonenumber?: string;
  promotionCode?: string;
  promotionPage?: string;
  promotionLink?: string;
  sourceType?: string;
  identityType?: string;
  roleName?: string;
  companyCount?: number;
  jobSeekerCount?: number;
  status?: string;
  auditStatus?: string;
  auditStatusName?: string;
  auditTime?: string;
  auditRemark?: string;
  remark?: string;
  createTime?: string;
}

export interface PromoterQuery {
  pageNum?: number;
  pageSize?: number;
  name?: string;
  phonenumber?: string;
  identityType?: string;
  sourceType?: string;
  roleName?: string;
  status?: string;
  auditStatus?: string;
  params?: Record<string, any>;
}

export type PromoterForm = PromoterVO;
export type PromoterStatisticsTimeUnit = 'day' | 'month' | 'quarter' | 'halfYear' | 'year';

export interface PromoterStatisticsRow extends PromoterVO {
  authorizedCount?: number;
  resumeCount?: number;
  applyCount?: number;
  totalCount?: number;
  // 协同维护数：作为协作人参与的企业/求职者数（不替代主推广人归因）
  collaborativeCompanyCount?: number;
  collaborativeJobSeekerCount?: number;
}

export interface PromoterStatisticsGroup {
  key?: string;
  label?: string;
  promoterCount?: number;
  companyCount?: number;
  jobSeekerCount?: number;
}

export interface PromoterStatisticsOverview {
  todayCompanyCount?: number;
  todayJobSeekerCount?: number;
  todayAuthorizedCount?: number;
  todayResumeCount?: number;
  todayApplyCount?: number;
  totalCompanyCount?: number;
  totalJobSeekerCount?: number;
  remark?: string;
  periodStats?: PromoterStatisticsPeriod[];
  identityPeriodStats?: PromoterIdentityPeriod[];
}

export interface PromoterStatisticsPeriod {
  key?: string;
  label?: string;
  companyCount?: number;
  jobSeekerCount?: number;
  authorizedCount?: number;
  resumeCount?: number;
  applyCount?: number;
  // 用户侧投递漏斗补充：全职/兼职投递去重人数、参与面试人数、被录用人数（后端 PeriodItem 同名字段）
  fullTimeApplyCount?: number;
  partTimeApplyCount?: number;
  interviewUserCount?: number;
  hiredUserCount?: number;
  enteredCompanyCount?: number;
  certifiedCompanyCount?: number;
  publishedCompanyCount?: number;
  fullTimePublishedCompanyCount?: number;
  partTimePublishedCompanyCount?: number;
  promotedCompanyCount?: number;
  communicatedCompanyCount?: number;
  interviewCompanyCount?: number;
  hiredCompanyCount?: number;
  // 已录用按岗位类型拆分：全职/兼职录用企业数（待后端 PeriodItem 补同名字段）
  fullTimeHiredCompanyCount?: number;
  partTimeHiredCompanyCount?: number;
  settledCompanyCount?: number;
  // 周期同比/环比基数（后端 PeriodItem 同名字段）：新增(B+C 合计) 的「上期同期至今」(环比基数) 与「去年同期至今」(同比基数)。
  // 仅 year/halfYear/quarter/month 周期有值，today 恒为 0；前端据此算卡片环比/同比涨跌。
  chainNewCount?: number;
  yoyNewCount?: number;
}

export interface CompanyOverviewStatisticsPeriod {
  key?: string;
  label?: string;
  enteredCompanyCount?: number;
  certifiedCompanyCount?: number;
  publishedCompanyCount?: number;
  fullTimePublishedCompanyCount?: number;
  partTimePublishedCompanyCount?: number;
  promotedCompanyCount?: number;
  interviewCompanyCount?: number;
  hiredCompanyCount?: number;
}

export interface CompanyOverviewStatisticsVO {
  periodStats?: CompanyOverviewStatisticsPeriod[];
}

export interface PromoterIdentityPeriod {
  key?: string;
  label?: string;
  internalPromoterCount?: number;
  internalCompanyCount?: number;
  internalJobSeekerCount?: number;
  channelPromoterCount?: number;
  channelCompanyCount?: number;
  channelJobSeekerCount?: number;
}

export interface PromoterStatisticsVO {
  totalPromoterCount?: number;
  totalCompanyCount?: number;
  totalJobSeekerCount?: number;
  rows?: PromoterStatisticsRow[];
  identityStats?: PromoterStatisticsGroup[];
  timeStats?: PromoterStatisticsGroup[];
  statusStats?: PromoterStatisticsGroup[];
  overview?: PromoterStatisticsOverview;
}

export interface PromoterWorkbenchVO {
  promoterId?: string | number;
  name?: string;
  phonenumber?: string;
  identityType?: string;
  identityTypeName?: string;
  roleName?: string;
  promotionCode?: string;
  promotionPage?: string;
  cPromotionLink?: string;
  bPromotionLink?: string;
  todayCompanyCount?: number;
  todayJobSeekerCount?: number;
  todayAuthorizedCount?: number;
  todayResumeCount?: number;
  todayApplyCount?: number;
  yesterdayCompanyCount?: number;
  yesterdayJobSeekerCount?: number;
  yesterdayAuthorizedCount?: number;
  yesterdayResumeCount?: number;
  yesterdayApplyCount?: number;
  totalCompanyCount?: number;
  totalJobSeekerCount?: number;
  totalAuthorizedCount?: number;
  totalResumeCount?: number;
  totalApplyCount?: number;
  remark?: string;
}

export interface PromotionAttributionQuery {
  pageNum?: number;
  pageSize?: number;
  promoterId?: string | number;
  promoterKeyword?: string;
  identityType?: string;
  status?: string;
  keyword?: string;
  beginTime?: string;
  endTime?: string;
}

export interface PromotionAttributionDetailVO {
  objectType?: 'company' | 'user' | string;
  objectTypeName?: string;
  objectId?: string | number;
  objectName?: string;
  phone?: string;
  contactPerson?: string;
  promoterId?: string | number;
  promoterName?: string;
  promoterPhone?: string;
  identityType?: string;
  identityTypeName?: string;
  roleName?: string;
  status?: string;
  statusName?: string;
  completed?: string;
  jobCount?: number;
  authorized?: string;
  resumeCompleted?: string;
  applied?: string;
  promotedAt?: string;
  authorizedTime?: string;
  resumeCompletedTime?: string;
  firstApplyTime?: string;
  createTime?: string;
  // 协作人(协同跟进推广人)：不替代主推广人归因，后端 enrichCollaborators 装配
  collaborators?: PromotionCollaboratorBrief[];
  collaboratorNames?: string;
}

export interface PromotionAttributionAdjustForm {
  objectType: 'company' | 'user' | string;
  objectId: string | number;
  promoterId?: string | number;
  // 协作人推广人ID集合（全量覆盖：本次提交即为该对象最终协作人；空表示清空协作人）。协作人仅记录协同参与，不替代主推广人归因。
  collaboratorIds?: Array<string | number>;
  // 转正：把某协作人提升为主推广人（离职交接）。非空时以转正语义为准，promoterId/collaboratorIds 可不传。
  promoteCollaboratorId?: string | number;
}

// 归因明细中的协作人精简信息（后端 enrichCollaborators 装配）
export interface PromotionCollaboratorBrief {
  promoterId?: string | number;
  name?: string;
  phone?: string;
  identityType?: string;
}

// 交接流水记录（GET /promoter/attribution/handover 返回）
export interface PromotionHandoverVO {
  id?: string | number;
  objectType?: string;
  objectId?: string | number;
  action?: string;
  actionName?: string;
  fromPromoterId?: string | number;
  fromPromoterName?: string;
  toPromoterId?: string | number;
  toPromoterName?: string;
  operatorId?: string | number;
  operatorName?: string;
  remark?: string;
  createTime?: string;
}

export function listPromoter(query: PromoterQuery) {
  return request.get<any>(`${baseUrl}/promoter/list`, { params: query });
}

export function getPromoterStatistics(query: PromoterQuery) {
  return request.get<PromoterStatisticsVO>(`${baseUrl}/promoter/statistics`, { params: query });
}

// 推广人分组统计：每个推广人在各周期(今日/昨日/本月/本季度/本半年/本年)的业务维度计数
export interface PromoterGroupStatVO {
  promoterId?: string | number;
  name?: string;
  phonenumber?: string;
  identityType?: string;
  roleName?: string;
  periods?: Array<{
    key: string;
    label: string;
    companyCount: number;
    certifiedCompanyCount: number;
    draftCompanyCount: number;
    rejectedCompanyCount: number;
    publishedCompanyCount: number;
    jobSeekerCount: number;
    authorizedCount: number;
    resumeCount: number;
    applyCount: number;
  }>;
}

export function getPromoterGroupStatistics() {
  return request.get<PromoterGroupStatVO[]>(`${baseUrl}/promoter/group-statistics`);
}

// ---------- 自定义导出·公共模板 ----------
// 对应后端 AdminExportTemplateController（/admin/recruitment/export-template）。
// config 为列配置快照 JSON 字符串（结构见前端 CustomExportDialog 的 snapshot）；scene 对应前端 storageKey。
export interface ExportTemplateVO {
  templateId?: number | string;
  scene?: string;
  name?: string;
  config?: string;
  isPublic?: string;
  remark?: string;
}

// 按场景拉取公共模板列表。silent:true → 后端未部署时 404 不弹全局提示，调用方静默降级。
export function listExportTemplates(scene: string) {
  return request.get<ExportTemplateVO[]>(`${baseUrl}/export-template/list`, { params: { scene }, silent: true } as any);
}

// 新增/更新公共模板（管理员）。silent → 由调用方统一提示成功/失败，避免与全局提示重复。
export function saveExportTemplate(data: ExportTemplateVO) {
  return request.post(`${baseUrl}/export-template`, data, { silent: true } as any);
}

// 删除公共模板
export function delExportTemplate(templateId: number | string) {
  return request.delete(`${baseUrl}/export-template/${templateId}`, { silent: true } as any);
}

// 企业端概览查询已并入 getPromoterStatistics（/promoter/statistics），不再单独提供接口。

export function listPromoterCompanyDetail(query: PromotionAttributionQuery) {
  return request.get<any>(`${baseUrl}/promoter/company-detail/list`, { params: query });
}

export function listPromoterUserDetail(query: PromotionAttributionQuery) {
  return request.get<any>(`${baseUrl}/promoter/user-detail/list`, { params: query });
}

export function adjustPromoterAttribution(data: PromotionAttributionAdjustForm) {
  return request.post(`${baseUrl}/promoter/attribution/adjust`, data);
}

// 某对象(企业/求职者)的归因/协作交接历史，按时间倒序
export function getAttributionHandover(objectType: string, objectId: string | number) {
  return request.get<PromotionHandoverVO[]>(`${baseUrl}/promoter/attribution/handover`, {
    params: { objectType, objectId }
  });
}

// 公海客户：未插入任何推广来源（无推广人、无推广码）的企业 / 面试者，供运营手动分配推广人。
// 复用 PromotionAttributionDetailVO，其中推广人相关字段恒为空。
export function listSeaCustomerCompany(query: PromotionAttributionQuery) {
  return request.get<any>(`${baseUrl}/promoter/sea-customer/company/list`, { params: query });
}

export function listSeaCustomerUser(query: PromotionAttributionQuery) {
  return request.get<any>(`${baseUrl}/promoter/sea-customer/user/list`, { params: query });
}

export function getPromoter(promoterId: string | number) {
  return request.get<PromoterVO>(`${baseUrl}/promoter/${promoterId}`);
}

export function addPromoter(data: PromoterForm) {
  return request.post<PromoterVO>(`${baseUrl}/promoter`, data);
}

export function updatePromoter(data: PromoterForm) {
  return request.put(`${baseUrl}/promoter`, data);
}

export function delPromoter(promoterId: string | number | Array<string | number>) {
  return request.delete(`${baseUrl}/promoter/${promoterId}`);
}

export function changePromoterStatus(data: { promoterId: string | number; status: string }) {
  return request.post(`${baseUrl}/promoter/changeStatus`, data);
}

export function getPromoterWorkbench() {
  return request.get<PromoterWorkbenchVO>(`${baseUrl}/promoter/workbench`);
}

export function getPromoterWorkbenchQrCode(target: 'C' | 'B') {
  // 二进制响应会在全局响应拦截器中直接解包为 Blob，第二个泛型同步声明真实返回类型。
  return request.get<Blob, Blob>(`${baseUrl}/promoter/workbench/qrcode`, {
    params: { target },
    responseType: 'blob'
  });
}

export function listPromoterWorkbenchDetail(query: PromotionAttributionQuery & { metric: string; period: 'today' | 'total' }) {
  return request.get<any>(`${baseUrl}/promoter/workbench/detail/list`, { params: query });
}

// ---------- 推广奖励 ----------

export interface PromotionRewardRuleVO {
  ruleId?: string | number;
  eventType?: string;
  eventName?: string;
  rewardAmount?: number;
  status?: string;
  remark?: string;
  createTime?: string;
  updateTime?: string;
}

export interface PromotionRewardVO {
  rewardId?: string | number;
  promoterId?: string | number;
  promoterName?: string;
  promoterPhone?: string;
  eventType?: string;
  eventName?: string;
  rewardAmount?: number;
  status?: string;
  statusName?: string;
  targetName?: string;
  maskedPhone?: string;
  createTime?: string;
  settleTime?: string;
  settleRemark?: string;
}

export interface PromotionRewardQuery {
  pageNum?: number;
  pageSize?: number;
  promoterId?: string | number;
  keyword?: string;
  eventType?: string;
  status?: string;
  beginTime?: string;
  endTime?: string;
}

export interface PromotionRewardSettleForm {
  rewardIds: Array<string | number>;
  status: '1' | '2';
  remark?: string;
}

export interface PromotionPromoterAuditForm {
  promoterId: string | number;
  auditStatus: '1' | '2';
  auditRemark?: string;
}

export function listPromotionRewardRules() {
  return request.get<PromotionRewardRuleVO[]>(`${baseUrl}/promotion/rule/list`);
}

export function savePromotionRewardRule(data: PromotionRewardRuleVO) {
  return data.ruleId
    ? request.put<PromotionRewardRuleVO>(`${baseUrl}/promotion/rule`, data)
    : request.post<PromotionRewardRuleVO>(`${baseUrl}/promotion/rule`, data);
}

export function listPromotionRewards(query: PromotionRewardQuery) {
  return request.get<any>(`${baseUrl}/promotion/reward/list`, { params: query });
}

export function settlePromotionRewards(data: PromotionRewardSettleForm) {
  return request.post(`${baseUrl}/promotion/reward/settle`, data);
}

export function auditPromotionPromoter(data: PromotionPromoterAuditForm) {
  return request.post(`${baseUrl}/promotion/promoter/audit`, data);
}

// ---------- 企业管理 ----------

export function listCompany(query: CompanyQuery) {
  return request.get<any>(`${baseUrl}/company/list`, { params: query });
}

// companyId 为19位雪花ID：必须按原值(字符串)透传到 URL，禁止 Number() 转换（超出安全整数会丢精度，后端按错误ID查不到→「企业不存在」）
export function getCompany(companyId: number | string) {
  return request.get<any>(`${baseUrl}/company/${companyId}`);
}

// 企业详情/编辑按企业范围解析资质 OSS id，避免依赖系统文件管理权限。
export function listCompanyMaterials(companyId: number | string, ossIds: string) {
  return request.get<any>(`${baseUrl}/company/${companyId}/materials/${ossIds}`);
}

// 企业审核历史（聚合 rec_audit_log 操作留痕 + company_cert 认证历史）。
// 对应后端 AdminJobDetailController.getCompanyAuditHistory，供详情弹窗的「历史审核记录」展示。
export function getCompanyAuditHistory(companyId: number | string) {
  return request.get<CompanyAuditHistoryVO>(`${baseUrl}/company/${companyId}/auditHistory`);
}

export function auditCompany(data: { companyId: number; status: string; remark?: string }) {
  return request.post(`${baseUrl}/company/audit`, data);
}

// 启用/禁用企业。后端将请求体反序列化为 Company 并 updateById，
// 因此可携带可选 remark（驳回场景用作审核意见，随企业状态一并落库）。
export function changeCompanyStatus(data: { companyId: number; status: string; remark?: string }) {
  return request.post(`${baseUrl}/company/changeStatus`, data);
}

// 驳回企业资质认证(方案A：账号/资质分离)。后端置 cert=已驳回+原因，但账号保持「已认证」可登录——
// 让企业能登录看到驳回原因并整改重交；与 changeStatus(禁用账号，会挡登录)区分。remark=驳回原因(必填)。
export function rejectCompanyCert(data: { companyId: number; remark: string }) {
  return request.post(`${baseUrl}/company/rejectCert`, data);
}

export function silenceCompany(data: { companyId: number; silenceReason: string }) {
  return request.post(`${baseUrl}/company/silence`, data);
}

export function unsilenceCompany(data: { companyId: number }) {
  return request.post(`${baseUrl}/company/unsilence`, data);
}

export function getCompanyStatistics() {
  return request.get<any>(`${baseUrl}/company/statistics`);
}

// 删除企业（支持批量）：后端执行业务归档，在线岗位自动下架，历史岗位/投递/履约/财务数据保留。
export function delCompany(companyId: number | number[]) {
  return request.delete(`${baseUrl}/company/${companyId}`);
}

// 恢复已删除企业（支持批量）：只恢复企业主体可见性，不自动恢复岗位上架状态。
export function restoreCompany(companyId: number | number[]) {
  const ids = Array.isArray(companyId) ? companyId : [companyId];
  return request.post(`${baseUrl}/company/restore`, ids);
}

type CompanyArchiveFields = Pick<CompanyVO, 'deleted' | 'deletedTime' | 'deletedBy' | 'deleteReason'>;

// 新增/编辑企业：归档字段由删除/恢复接口维护，普通保存请求不透传，避免误触发恢复或覆盖删除留痕。
export const addOrUpdate = (data: UserForm) => {
  const payload = { ...(data as UserForm & CompanyArchiveFields) };
  delete payload.deleted;
  delete payload.deletedTime;
  delete payload.deletedBy;
  delete payload.deleteReason;
  return request({
    url: `${baseUrl}/company/addOrUpdate`,
    method: 'post',
    data: payload
  });
};

// ---------- 求职者管理 ----------

export interface UserStatistics {
  totalCount: number;
  silencedCount: number;
  normalCount: number;
  appliedCount: number;
  pendingApplyCount: number;
}

export interface RecruitmentUserVO {
  userId: number | string;
  /** 业务编码：来自 serialRule 的 SKR 编码，列表展示优先使用。 */
  jobSeekerNo?: string;
  userName: string;
  nickName: string;
  userType: string;
  /** 后端列表接口当前返回 phone；保留 phonenumber 兼容历史页面字段。 */
  phone: string;
  phonenumber?: string;
  /** 授权登录手机号，来自账号表 sys_user.phonenumber。 */
  accountPhone?: string;
  email: string;
  sex: string;
  sexName: string;
  /** 账号性别原始码：0男 / 1女 / 2未知。 */
  accountSex?: string;
  accountSexName?: string;
  /** 最新简历性别原始码：M男 / F女。 */
  resumeSex?: string;
  resumeSexName?: string;
  avatar: number;
  avatarUrl: string;
  /** 最新简历头像 OSS ID；后端据此返回可访问的 resumeAvatarUrl。 */
  resumeAvatarOssId?: number | string;
  resumeAvatarUrl?: string;
  resumeId?: number | string;
  realName?: string;
  resumePhone?: string;
  /** 简历邮箱，区别于账号邮箱 email。 */
  resumeEmail?: string;
  wechat?: string;
  birthDate?: string;
  age?: number;
  city?: string;
  expectCity?: string;
  expectPosition?: string;
  expectPositionId?: number | string;
  positionId?: number | string;
  positionName?: string;
  expectedDate?: string;
  expectedIndustry?: string;
  jobPreferenceRemark?: string;
  jobStatus?: string;
  jobStatusName?: string;
  availableTimeSlots?: string;
  weeklyHours?: number | string;
  education?: string;
  educationName?: string;
  workYears?: number;
  resumeCompleteness?: number;
  salaryMin?: number;
  salaryMax?: number;
  salaryUnit?: string;
  jobType?: string;
  jobTypeName?: string;
  employmentType?: string;
  employmentTypeName?: string;
  skills?: string;
  summary?: string;
  /** C 端在线简历扩展模块，均为后端原样透传的 JSON 字符串。 */
  educationExperience?: string;
  workExperience?: string;
  projectExperience?: string;
  certificates?: string;
  otherInfo?: string;
  portfolioUrl?: string;
  githubUrl?: string;
  volunteerExperience?: string;
  awards?: string;
  status: string;
  statusName: string;
  isRecruitmentSilenced: string;
  silenceReason: string;
  silenceTime: string;
  totalApplies: number;
  pendingApplies: number;
  interviewApplies: number;
  hiredApplies: number;
  rejectedApplies: number;
  resumeAttachmentUrl?: string;
  resumeAttachmentName?: string;
  loginIp: string;
  loginDate: string;
  createTime: string;
  remark: string;
}

export function statisticsUser() {
  return request.get<UserStatistics>(`${baseUrl}/user/statistics`);
}

export function listUsersWithStats(params?: {
  pageNum?: number;
  pageSize?: number;
  userName?: string;
  phone?: string;
  phonenumber?: string;
  isRecruitmentSilenced?: string;
  applyFilter?: string;
}) {
  return request.get<{ rows: RecruitmentUserVO[]; total: number }>(`${baseUrl}/user/listWithStats`, { params });
}

export function getRecruitmentUserDetail(userId: number | string) {
  return request.get<RecruitmentUserVO>(`${baseUrl}/user/${userId}`);
}

export function silenceUser(data: { userId: number | string; reason: string }) {
  return request.post(`${baseUrl}/user/silence`, data);
}

export function unsilenceUser(data: { userId: number | string }) {
  return request.post(`${baseUrl}/user/unsilence`, data);
}

export function listUsers(params?: { pageNum?: number; pageSize?: number; userName?: string; phonenumber?: string; isRecruitmentSilenced?: string }) {
  return request.get<any>(`${baseUrl}/user/list`, { params });
}

// ---------- 岗位管理 ----------

export function listJob(query: JobQuery) {
  return request.get<any>(`${baseUrl}/job/list`, { params: query });
}

export function getJob(jobId: number) {
  return request.get<any>(`${baseUrl}/job/${jobId}`);
}

// 岗位完整字段详情（运营台审核用，含类目/学历/招聘人数/期望到岗时间/兼职工作时间/福利/团队介绍/附加条件）。
// 对应后端 AdminJobDetailController.getJobFullDetail → GET /admin/recruitment/jobDetail/{jobId}，返回 R<JobFullVO>（数据走 res.data）。
export function getJobFullDetail(jobId: number) {
  return request.get<JobFullVO>(`${baseUrl}/jobDetail/${jobId}`);
}

export function auditJob(data: { jobId: number; status: string; remark?: string }) {
  return request.post(`${baseUrl}/job/audit`, data);
}

export function batchAuditJob(data: { jobIds: number[]; status: string }) {
  return request.post(`${baseUrl}/job/batchAudit`, data);
}

export function changeJobStatus(data: { jobId: number; status: string }) {
  return request.post(`${baseUrl}/job/changeStatus`, data);
}

export function delJob(jobId: number | number[]) {
  return request.delete(`${baseUrl}/job/${jobId}`);
}

export function updateJob(data: any) {
  return request.put(`${baseUrl}/job`, data);
}

export function updateJobSettlementIntent(data: {
  intentId?: number | string;
  jobId?: number | string;
  intentType: string;
  followStatus?: string;
  followRemark?: string;
  settlementCreateTime?: string;
}) {
  return request.post<JobFullVO>(`${baseUrl}/job/settlementIntent`, data);
}

export function markCompanySettlementIntentContacted(data: { intentId: number | string; remark?: string }) {
  return request.post(`${baseUrl}/company/settlementIntent/contacted`, data);
}

// 运营代发岗位：POST /admin/recruitment/job/add，body 为 CreateJobRequest（含 companyId 指定归属企业）。
// status 由调用方决定：'0' 待审核 / '1' 直接上架 / '3' 存草稿（运营有发布权限）。
export function addJob(data: any) {
  return request.post(`${baseUrl}/job/add`, data);
}

// 存草稿语法糖：固定 status='3'，岗位不进入审核、不对外展示。
export function saveJobDraft(data: any) {
  return request.post(`${baseUrl}/job/add`, { ...data, status: '3' });
}

export function refreshJobRecommendCache() {
  return request.delete(`${baseUrl}/job/refreshCache`);
}

export function getJobStatistics() {
  return request.get<any>(`${baseUrl}/job/statistics`);
}

// ---------- 投递管理 ----------

export function listApply(query: ApplyQuery) {
  return request.get<any>(`${baseUrl}/apply/list`, { params: query });
}

export function getApply(applyId: number) {
  return request.get<any>(`${baseUrl}/apply/${applyId}`);
}

export function markApplyRead(data: { applyId: number; isRead: string }) {
  return request.post(`${baseUrl}/apply/markRead`, data);
}

export function getApplyStatistics() {
  return request.get<any>(`${baseUrl}/apply/statistics`);
}

// ---------- 运营台·投递查询增强（AdminApplyQueryController，路由 /admin/recruitment/apply2） ----------
// 责任：在不动既有 /apply/** 的前提下，提供「多条件精确检索」与「单条投递全景详情」。
// 与 /apply/list 区别：apply2/list 返回原始 Apply 实体（不含联表展示名），按编号/时间区间精确过滤。

// 多条件精确检索入参（投递ID/企业ID/时间区间等，均可选）
export interface Apply2Query {
  pageNum?: number;
  pageSize?: number;
  applyId?: number; // 投递ID
  companyId?: number; // 企业ID
  userId?: number;
  jobId?: number;
  status?: string;
  beginTime?: string; // 投递时间起，yyyy-MM-dd（后端按当天 00:00:00 闭区间）
  endTime?: string; // 投递时间止，yyyy-MM-dd（后端按当天 23:59:59 闭区间）
}

// 投递全景详情 VO，结构与后端 ApplyDetailVO 对齐
export interface ApplyDetailJobSeeker {
  userId?: number;
  userName?: string;
  nickName?: string;
  realName?: string;
  avatar?: string;
  avatarUrl?: string;
  resumeAvatarOssId?: number | string;
  resumeAvatarUrl?: string;
  phonenumber?: string;
  email?: string;
  sex?: string;
  age?: number;
  city?: string;
  education?: string;
  workYears?: number;
  expectPosition?: string;
  skills?: string;
  summary?: string;
  isRecruitmentSilenced?: string; // 0正常 1禁言
}

export interface ApplyDetailCompany {
  companyId?: number;
  companyName?: string;
  contactPerson?: string;
  contactPhone?: string;
  status?: string; // 0待审核 1已认证 2已禁用
  isSilenced?: string; // 0正常 1禁言中
}

export interface ApplyDetailJob {
  jobId?: number;
  jobName?: string;
  jobType?: string; // 0全职 1兼职 2临时工 3项目制
  salaryText?: string;
  location?: string;
  status?: string; // 0审核中 1已上架 2已下架
}

export interface ApplyStatusFlowItem {
  node?: string; // applied/interview/result/exchange/notification
  title?: string;
  content?: string;
  source?: string; // apply / notification
  time?: string;
}

export interface ApplyInterviewItem {
  notificationId?: number;
  type?: string; // 2面试邀请 3面试结果
  typeName?: string;
  title?: string;
  content?: string;
  isRead?: string;
  time?: string;
}

export interface ApplyExchangeItem {
  id?: number;
  exchangeType?: string; // phone / wechat
  initiator?: string; // B招聘者发起 / C求职者发起
  status?: string; // pending_request/accepted/rejected/exchanged/failed
  statusName?: string;
  recruiterId?: number;
  jobSeekerId?: number;
  recruiterContact?: string;
  jobSeekerContact?: string;
  isRead?: string;
  createTime?: string;
}

export interface ApplyTaskItem {
  taskId?: number;
  status?: string; // 0进行中 1待核验 2已核验 3已驳回 4已结算
  statusName?: string;
  workTime?: string;
  address?: string;
  remark?: string;
}

export interface ApplySelectionResult {
  selectionType?: string; // 1仅选用自行联系 2确认选用自行结算 3确认选用并签约
  selectionTypeName?: string;
  selected?: boolean;
  tasks?: ApplyTaskItem[];
}

export interface ApplyDetailVO {
  applyId?: number;
  jobId?: number;
  companyId?: number;
  userId?: number;
  applyTime?: string;
  status?: string;
  statusName?: string;
  isRead?: string;
  message?: string;
  selectionType?: string;
  selectionTypeName?: string;
  jobSeeker?: ApplyDetailJobSeeker;
  company?: ApplyDetailCompany;
  job?: ApplyDetailJob;
  statusFlow?: ApplyStatusFlowItem[];
  interviews?: ApplyInterviewItem[];
  exchangeRecords?: ApplyExchangeItem[];
  selection?: ApplySelectionResult;
}

// 多条件精确分页查询（投递ID/企业ID/时间区间）→ TableDataInfo<Apply> 原始实体
export function listApply2(query: Apply2Query) {
  return request.get<any>(`${baseUrl}/apply2/list`, { params: query });
}

// 单条投递全景详情（状态流水/面试/交换/选用结果）→ R<ApplyDetailVO>
export function getApply2Detail(applyId: number) {
  return request.get<ApplyDetailVO>(`${baseUrl}/apply2/detail`, { params: { applyId } });
}

// ---------- 任务管理 ----------

export function listTask(query: TaskQuery) {
  return request.get<any>(`${baseUrl}/task/list`, { params: query });
}

export function getTask(taskId: number) {
  return request.get<any>(`${baseUrl}/task/${taskId}`);
}

// 平台代核验：通过(completed)时需带 workHours/settleAmount；驳回(rejected)时需带 remark。
// 行为对齐企业端 verify（仅可核验待核验任务、台账有则更新无则不创建），后端会写运营审计。
export function verifyTask(data: { taskId: number; status: string; remark?: string; workHours?: number; settleAmount?: number }) {
  return request.post(`${baseUrl}/task/verify`, data);
}

export function getTaskStatistics() {
  return request.get<any>(`${baseUrl}/task/statistics`);
}

// 履约异常统计（只读）：阈值（天）可调，后端默认 待确认2/待核验3/完成未结算7
export function getTaskAbnormalStatistics(params?: { pendingDays?: number; verifyDays?: number; settleDays?: number }) {
  return request.get<TaskAbnormalStat>(`${baseUrl}/task/abnormal-statistics`, { params });
}

// ---------- 台账管理 ----------

export function listLedger(query: LedgerQuery) {
  return request.get<any>(`${baseUrl}/ledger/list`, { params: query });
}

export function getLedger(ledgerId: number | string) {
  return request.get<any>(`${baseUrl}/ledger/${ledgerId}`);
}

export function getLedgerStatistics() {
  return request.get<any>(`${baseUrl}/ledger/statistics`);
}

// 标记台账已结算（单条/批量）：后端仅对「待结算」生效、限财务/超管、写审计
export function settleLedger(data: { ledgerIds: Array<number | string>; remark?: string }) {
  return request.post(`${baseUrl}/ledger/settle`, data);
}

// ---------- 发票管理 ----------

export function listInvoice(query: InvoiceQuery) {
  return request.get<any>(`${baseUrl}/invoice/list`, { params: query });
}

export function getInvoice(invoiceId: number | string) {
  return request.get<any>(`${baseUrl}/invoice/${invoiceId}`);
}

export function updateInvoiceStatus(data: { invoiceId: number | string; status: string }) {
  return request.post(`${baseUrl}/invoice/updateStatus`, data);
}

export function getInvoiceStatistics() {
  return request.get<any>(`${baseUrl}/invoice/statistics`);
}

// ---------- 运营台·发票上传/绑定管理 ----------
// 后端独立控制器 AdminInvoiceManageController，路由 /admin/invoice-manage（与上方 /admin/recruitment/invoice 区分）。
// 责任：上传发票文件并关联台账、绑定/改绑台账、变更开票状态、分页查看（含金额/上传人/绑定台账号）。

const invoiceManageBaseUrl = '/admin/invoice-manage';

// 分页查询发票（含金额/上传人/上传时间/绑定台账号）
export function listInvoiceManage(query: InvoiceQuery) {
  return request.get<any>(`${invoiceManageBaseUrl}/list`, { params: query });
}

// 发票上传/改绑时使用的台账选择列表，权限随发票管理接口走
export function listInvoiceLedgerOptions(query: LedgerQuery) {
  return request.get<any>(`${invoiceManageBaseUrl}/ledger-options`, { params: query });
}

// 上传发票文件并关联台账，返回新发票ID
export function uploadInvoiceManage(data: InvoiceUploadForm) {
  return request.post<any>(`${invoiceManageBaseUrl}/upload`, data);
}

// 绑定（或改绑）发票到台账
export function bindInvoiceManage(data: { invoiceId: number | string; ledgerId: number | string }) {
  return request.post<any>(`${invoiceManageBaseUrl}/bind`, data);
}

// 变更发票开票状态（0未开票/1已开票/2已作废/3红冲）
export function markInvoiceManageStatus(data: { invoiceId: number | string; status: string }) {
  return request.post<any>(`${invoiceManageBaseUrl}/markStatus`, data);
}

// ---------- 仪表盘 ----------

export function getOverview() {
  return request.get<any>(`${baseUrl}/dashboard/overview`);
}

// 工作台「今日待办 + 风险提醒」：GET /admin/recruitment/dashboard/worklist。
// 返回 R<DashboardWorklistVO>（业务载荷在 res.data）：三类待办计数 + riskAlerts 风险留痕列表。
export function getWorklist(config?: any) {
  return request.get<DashboardWorklistVO>(`${baseUrl}/dashboard/worklist`, config);
}

export function getApplyTrend(days: number = 7) {
  return request.get<any>(`${baseUrl}/dashboard/applyTrend`, { params: { days } });
}

export function getJobTypeDistribution() {
  return request.get<any>(`${baseUrl}/dashboard/jobTypeDistribution`);
}

export function getHotJobs(params: { limit?: number; type?: string }) {
  return request.get<any>(`${baseUrl}/dashboard/hotJobs`, { params });
}

export function getExchangeStatistics() {
  return request.get<any>(`${baseUrl}/dashboard/exchangeStatistics`);
}

export function getExceptionApplies(params?: { pageNum?: number; pageSize?: number }) {
  return request.get<any>(`${baseUrl}/dashboard/exceptionApplies`, { params });
}

export function getRecentJobs(params?: { pageNum?: number; pageSize?: number }) {
  return request.get<any>(`${baseUrl}/dashboard/recentJobs`, { params });
}

export function getRecentApplies(params?: { pageNum?: number; pageSize?: number }) {
  return request.get<any>(`${baseUrl}/dashboard/recentApplies`, { params });
}

export function getCompanyTrend(params: { days?: number }) {
  return request.get<any>(`${baseUrl}/dashboard/companyTrend`, { params });
}

export function getUserTrend(params: { days?: number }) {
  return request.get<any>(`${baseUrl}/dashboard/userTrend`, { params });
}

export function getApplyStatusDistribution() {
  return request.get<any>(`${baseUrl}/dashboard/applyStatusDistribution`);
}

// ---------- 审计日志 ----------
// 注意：审计日志接口挂在 /admin/auditLog 之下（不在 /admin/recruitment 下），故单独写绝对路径。

const auditLogBaseUrl = '/admin/auditLog';

// 列表：GET /admin/auditLog/list，返回 TableDataInfo(rows/total)
export function listAuditLog(query: AuditLogQuery) {
  return request.get<any>(`${auditLogBaseUrl}/list`, { params: query });
}

// 对象历史：GET /admin/auditLog/auditHistory，按 目标类型 + 目标编号 回溯
export function getAuditHistory(params: { targetType: string; targetNo: string }) {
  return request.get<any>(`${auditLogBaseUrl}/auditHistory`, { params });
}

// 导出 URL（POST /admin/auditLog/export，配合 utils/request 的 download 使用）
export const auditLogExportUrl = `${auditLogBaseUrl}/export`;

// ========== 运营台·内容配置（单例 / KV 配置中心）==========
// 后端: AdminConfigController @RequestMapping("/admin/config")，@SaCheckRole("admin")。
// 单例配置以 configKey 为唯一锚点 upsert；字典（行业/职位类目/福利标签）透传 sys_dict，不另建表。
// 不在 /admin/recruitment 之下，故单独写绝对路径。

const configBaseUrl = '/admin/config';

// rec_config 表对象（与后端 com.ruoyi.project.domain.RecConfig 字段对齐）
export interface RecConfigVO {
  configId?: number;
  // 业务唯一键，如 nav.c.home / popup.newcomer / msg.remind.early
  configKey?: string;
  // 配置值（纯文本或 JSON 字符串）
  configValue?: string;
  // 分组归类，如 nav / popup / message / template
  configGroup?: string;
  // 值类型提示：text 纯文本 / json JSON 字符串（仅前端渲染用）
  valueType?: string;
  // 配置名称 / 备注说明
  remark?: string;
  tenantId?: string;
  createTime?: string;
  updateTime?: string;
}

// 透传字典项（复用系统模块 sys_dict 的 SysDictDataVo 关键字段）
export interface ConfigDictDataVO {
  dictCode?: number;
  dictSort?: number;
  dictLabel?: string;
  dictValue?: string;
  dictType?: string;
  cssClass?: string;
  listClass?: string;
  remark?: string;
}

// 按 key 读取单条配置：GET /admin/config/get?key=xxx，返回 R<RecConfig>，命中走 res.data（未命中为 null）
export function getRecConfig(key: string) {
  return request.get<RecConfigVO>(`${configBaseUrl}/get`, { params: { key } });
}

// 按 key upsert 写入配置：POST /admin/config/update，body=RecConfig（tenantId/configId 由后端兜底，前端无需传）
export function updateRecConfig(data: RecConfigVO) {
  return request.post<RecConfigVO>(`${configBaseUrl}/update`, data);
}

export interface AuthLetterTemplateFile {
  ossId?: string | number;
  url?: string;
  originalName?: string;
  fileName?: string;
  fileSuffix?: string;
  uploadedAt?: string;
}

export interface AuthLetterTemplateSet {
  legalRepresentative?: AuthLetterTemplateFile;
  operator?: AuthLetterTemplateFile;
}

// 当前招聘授权书模板：运营分别上传法人版/经办人版 PDF 后保存为 rec_config JSON。
export function getAuthLetterTemplate() {
  return request.get<AuthLetterTemplateSet>(`${configBaseUrl}/auth-letter-template`);
}

export function authLetterTemplateUploadUrl(type: keyof AuthLetterTemplateSet) {
  return `${configBaseUrl}/auth-letter-template/upload?type=${type}`;
}

// 运营台模板下载走同源后端流式接口，避免前端 fetch 私有 OSS 预签名地址时受跨域策略影响。
export function downloadAuthLetterTemplateFile(type: keyof AuthLetterTemplateSet) {
  return request.get<Blob>(`${configBaseUrl}/auth-letter-template/download`, {
    params: { type },
    responseType: 'blob'
  });
}

// 配置列表（分页，支持 configKey 模糊 / configGroup 过滤）：GET /admin/config/list，返回 TableDataInfo（rows/total）
export function listRecConfig(query: { pageNum?: number; pageSize?: number; configKey?: string; configGroup?: string }) {
  return request.get<RecConfigVO[]>(`${configBaseUrl}/list`, { params: query });
}

// 透传字典数据（按 dictType 读取：行业/职位类目/福利标签等）：GET /admin/config/dict/{dictType}，返回 R<List<SysDictDataVo>>
export function listConfigDictData(dictType: string) {
  return request.get<ConfigDictDataVO[]>(`${configBaseUrl}/dict/${dictType}`);
}

// ---------- 招聘业务字典项管理（岗位类别 rec_job_category 等，后端白名单限定） ----------
// 对应 AdminConfigController 的 /admin/config/dict 写接口，复用 sys_dict 存储不另建表。

// 新增字典项：POST /admin/config/dict
export function addConfigDictData(data: ConfigDictDataVO) {
  return request.post(`${configBaseUrl}/dict`, data);
}

// 修改字典项：PUT /admin/config/dict（dictCode 必传）
export function updateConfigDictData(data: ConfigDictDataVO) {
  return request.put(`${configBaseUrl}/dict`, data);
}

// 删除字典项（支持批量，逗号拼接）：DELETE /admin/config/dict/{dictCodes}
export function delConfigDictData(dictCodes: number | number[]) {
  return request.delete(`${configBaseUrl}/dict/${dictCodes}`);
}

// ==================== 运营台·数据导出中心 — 各业务域导出端点 ====================
// 说明：以下均为后端 POST 导出接口（blob 下载），供 views/recruitment/export.vue 配合
//       utils/request 的全局 download(url, params, fileName) 使用。审计导出 URL
//       auditLogExportUrl 已在上方审计日志段定义，此处不重复。
//
// 企业：POST /admin/recruitment/company/exportData（AdminRecruitmentController）
export const companyExportUrl = `${baseUrl}/company/exportData`;
// 岗位：POST /admin/recruitment/job/export
export const jobExportUrl = `${baseUrl}/job/export`;
// 投递：POST /admin/recruitment/apply/export
export const applyExportUrl = `${baseUrl}/apply/export`;
// 用户（求职者）：POST /admin/recruitment/user/export
export const userExportUrl = `${baseUrl}/user/export`;
// 任务（履约）：POST /admin/recruitment/export/task（AdminExportController）
export const taskExportUrl = `${baseUrl}/export/task`;
// 台账：POST /admin/recruitment/export/ledger
export const ledgerExportUrl = `${baseUrl}/export/ledger`;
// 发票：POST /admin/recruitment/export/invoice
export const invoiceExportUrl = `${baseUrl}/export/invoice`;
// ========== 运营台 · 运营统计聚合 ==========
// 数据来源：后端 AdminOperationStatsController#statistics
//   GET /admin/recruitment/operation/statistics?windowDays=30
// 返回 R<OperationStatsVO>（项目 request 拦截器已解到响应体，业务载荷在 res.data）。
// 字段口径见后端 OperationStatsVO：复访率 / 30 天留存率为基于 login_date 的活跃近似估算，
// estimated=true 时应向用户提示为近似值，remark 给出口径说明。

export interface OperationStatsVO {
  // 新增主体（近 windowDays 天）
  newJobSeekerCount: number; // 新增求职者数（sys_user user_type=C）
  newCompanyCount: number; // 新增企业数
  windowDays: number; // 新增主体的统计窗口天数（默认 30）
  // 企业 / 岗位审核通过率（通过 / (通过 + 驳回)，百分比；无独立驳回态时以禁用/下架近似）
  companyApprovedCount: number;
  companyRejectedCount: number;
  companyApprovalRate: number; // 百分比，如 66.67
  jobApprovedCount: number;
  jobRejectedCount: number;
  jobApprovalRate: number; // 百分比
  // 业务漏斗计数
  applyCount: number; // 投递数
  interviewInviteCount: number; // 面试邀请数（apply.status=1）
  partTimeSelectionCount: number; // 兼职选用数（apply.selection_type 非空）
  fulfillmentCompletedCount: number; // 履约完成数（task.status in 2,4）
  ledgerGeneratedCount: number; // 台账生成数
  invoiceUploadedCount: number; // 发票上传数（invoice.file_path 非空）
  // 估算指标（非精确，依赖缺失的行为埋点）
  revisitRate: number; // 复访率（估算，百分比）
  retentionRate: number; // 30 天留存率（估算，百分比）
  // 元信息
  estimated: boolean; // 是否包含估算值（revisitRate / retentionRate 估算时为 true）
  remark: string; // 口径与估算说明
}

// 运营统计聚合查询：windowDays 控制「新增主体」统计窗口，后端默认 30。
export function getOperationStatistics(params?: { windowDays?: number }) {
  return request.get<OperationStatsVO>(`${baseUrl}/operation/statistics`, { params });
}
