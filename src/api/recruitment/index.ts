import request from '@/utils/request';

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
  companyName?: string;
  description?: string;
  contactPerson?: string;
  contactPhone?: string;
  logoUrl?: string;
  businessLicense?: string;
  status?: string;
  userId?: number;
  createTime?: string;
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
  companyId?: number;
  companyName?: string;
  jobName?: string;
  salary?: string;
  location?: string;
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
  jobId?: number;
  jobName?: string;
  salary?: string;
  companyName?: string;
  userId?: number;
  userName?: string;
  phonenumber?: string;
  applyTime?: string;
  status?: string;
  statusName?: string;
  isRead?: string;
  message?: string;
  createTime?: string;
  avatar?: string;
  avatarUrl?: string;
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
}

// ========== 台账相关 ==========

export interface LedgerStatistics {
  totalCount: number;
  totalAmount: number;
  todayAmount: number;
}

export interface LedgerVO {
  ledgerId?: number;
  taskId?: number;
  companyId?: number;
  companyName?: string;
  userId?: number;
  userName?: string;
  orderNo?: string;
  timestamp?: string;
  amount?: number;
  createTime?: string;
}

// ========== 发票相关 ==========

export interface InvoiceStatistics {
  totalCount: number;
  pendingCount: number;
  issuedCount: number;
  cancelledCount: number;
}

export interface InvoiceVO {
  invoiceId?: number;
  ledgerId?: number;
  companyId?: number;
  companyName?: string;
  filePath?: string;
  status?: string;
  statusName?: string;
  createTime?: string;
  remark?: string;
}

// ========== 综合概览 ==========

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
  companyName?: string;
  status?: string;
  userId?: number;
  isSilenced?: string;
}

export interface JobQuery {
  pageNum?: number;
  pageSize?: number;
  jobName?: string;
  companyId?: number;
  status?: string;
  jobType?: string;
  isRecommend?: string;
  isHot?: string;
}

export interface ApplyQuery {
  pageNum?: number;
  pageSize?: number;
  jobId?: number;
  jobName?: string;
  userId?: number;
  userName?: string;
  status?: string;
  companyName?: string;
  isRead?: string;
}

export interface TaskQuery {
  pageNum?: number;
  pageSize?: number;
  jobId?: number;
  companyId?: number;
  userId?: number;
  status?: string;
}

export interface LedgerQuery {
  pageNum?: number;
  pageSize?: number;
  companyId?: number;
  userId?: number;
  orderNo?: string;
}

export interface InvoiceQuery {
  pageNum?: number;
  pageSize?: number;
  companyId?: number;
  ledgerId?: number;
  status?: string;
}

export interface DashboardQuery {
  days?: number;
  type?: string;
}

// ========== API 方法 ==========

const baseUrl = '/admin/recruitment';

// ---------- 企业管理 ----------

export function listCompany(query: CompanyQuery) {
  return request.get<any>(`${baseUrl}/company/list`, { params: query });
}

export function getCompany(companyId: number) {
  return request.get<any>(`${baseUrl}/company/${companyId}`);
}

export function auditCompany(data: { companyId: number; status: string; remark?: string }) {
  return request.post(`${baseUrl}/company/audit`, data);
}

export function changeCompanyStatus(data: { companyId: number; status: string }) {
  return request.post(`${baseUrl}/company/changeStatus`, data);
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

// ---------- 求职者管理 ----------

export interface UserStatistics {
  totalCount: number;
  silencedCount: number;
  normalCount: number;
  appliedCount: number;
  pendingApplyCount: number;
}

export interface RecruitmentUserVO {
  userId: number;
  userName: string;
  nickName: string;
  userType: string;
  phonenumber: string;
  email: string;
  sex: string;
  sexName: string;
  avatar: number;
  avatarUrl: string;
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
  phonenumber?: string;
  isRecruitmentSilenced?: string;
}) {
  return request.get<{ rows: RecruitmentUserVO[]; total: number }>(`${baseUrl}/user/listWithStats`, { params });
}

export function silenceUser(data: { userId: number; reason: string }) {
  return request.post(`${baseUrl}/user/silence`, data);
}

export function unsilenceUser(data: { userId: number }) {
  return request.post(`${baseUrl}/user/unsilence`, data);
}

export function listUsers(params?: {
  pageNum?: number;
  pageSize?: number;
  userName?: string;
  phonenumber?: string;
  isRecruitmentSilenced?: string;
}) {
  return request.get<any>(`${baseUrl}/user/list`, { params });
}

// ---------- 岗位管理 ----------

export function listJob(query: JobQuery) {
  return request.get<any>(`${baseUrl}/job/list`, { params: query });
}

export function getJob(jobId: number) {
  return request.get<any>(`${baseUrl}/job/${jobId}`);
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

// ---------- 任务管理 ----------

export function listTask(query: TaskQuery) {
  return request.get<any>(`${baseUrl}/task/list`, { params: query });
}

export function getTask(taskId: number) {
  return request.get<any>(`${baseUrl}/task/${taskId}`);
}

export function verifyTask(data: { taskId: number; status: string; remark?: string }) {
  return request.post(`${baseUrl}/task/verify`, data);
}

export function getTaskStatistics() {
  return request.get<any>(`${baseUrl}/task/statistics`);
}

// ---------- 台账管理 ----------

export function listLedger(query: LedgerQuery) {
  return request.get<any>(`${baseUrl}/ledger/list`, { params: query });
}

export function getLedger(ledgerId: number) {
  return request.get<any>(`${baseUrl}/ledger/${ledgerId}`);
}

export function getLedgerStatistics() {
  return request.get<any>(`${baseUrl}/ledger/statistics`);
}

// ---------- 发票管理 ----------

export function listInvoice(query: InvoiceQuery) {
  return request.get<any>(`${baseUrl}/invoice/list`, { params: query });
}

export function getInvoice(invoiceId: number) {
  return request.get<any>(`${baseUrl}/invoice/${invoiceId}`);
}

export function updateInvoiceStatus(data: { invoiceId: number; status: string }) {
  return request.post(`${baseUrl}/invoice/updateStatus`, data);
}

export function getInvoiceStatistics() {
  return request.get<any>(`${baseUrl}/invoice/statistics`);
}

// ---------- 仪表盘 ----------

export function getOverview() {
  return request.get<any>(`${baseUrl}/dashboard/overview`);
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
