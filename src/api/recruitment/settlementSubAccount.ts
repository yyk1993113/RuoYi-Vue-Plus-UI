import request from '@/utils/request';

const baseUrl = '/admin/settlement/sub-account';

export type SubAccountAuditStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'BLACKLISTED';

export interface SettlementSubAccountVO {
  applicationId: string | number;
  companyId: string | number;
  companyName: string;
  unifiedSocialCreditCode?: string;
  subAccountName: string;
  accountType: 'CORPORATE' | 'INDIVIDUAL' | string;
  bankBranch: string;
  bankAccountMasked: string;
  contactName: string;
  contactPhoneMasked?: string;
  authorizationLetterUploaded?: boolean;
  createTime: string;
  status: SubAccountAuditStatus;
  rejectReason?: string;
  auditUserName?: string;
  auditTime?: string;
}

export interface SettlementSubAccountQuery {
  pageNum: number;
  pageSize: number;
  keyword?: string;
  companyName?: string;
  status?: SubAccountAuditStatus | '';
  subAccountName?: string;
  bankBranch?: string;
  beginTime?: string;
  endTime?: string;
}

export interface SettlementSubAccountStatistics {
  totalCount: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  blacklistedCount: number;
  overduePendingCount: number;
}

export interface SettlementCmbConfig {
  enabled: boolean;
  prodUrl: string;
  uidMasked?: string;
  parentAccountNoMasked?: string;
  businessMode: string;
  approvalRequired: boolean;
  overdraftControl: 'Y' | 'N' | 'X';
  refundType: 'Y' | 'N' | 'X';
  closeType: 'Y' | 'N' | 'X';
  connectTimeoutSeconds: number;
  readTimeoutSeconds: number;
  maxResponseBytes: number;
  uidConfigured: boolean;
  privateKeyConfigured: boolean;
  bankPublicKeyConfigured: boolean;
  symmetricKeyConfigured: boolean;
  parentAccountConfigured: boolean;
  ready: boolean;
  missingFields: string[];
}

export interface SettlementCmbConfigRequest {
  enabled: boolean;
  prodUrl: string;
  uid?: string;
  privateKeyBase64?: string;
  bankPublicKeyBase64?: string;
  symmetricKey?: string;
  parentAccountNo?: string;
  businessMode: string;
  approvalRequired: boolean;
  overdraftControl: 'Y' | 'N' | 'X';
  refundType: 'Y' | 'N' | 'X';
  closeType: 'Y' | 'N' | 'X';
  connectTimeoutSeconds: number;
  readTimeoutSeconds: number;
  maxResponseBytes: number;
}

export function listSettlementSubAccount(params: SettlementSubAccountQuery) {
  return request.get<any>(`${baseUrl}/list`, { params });
}

export function getSettlementSubAccountStatistics() {
  return request.get<SettlementSubAccountStatistics>(`${baseUrl}/statistics`);
}

/** 银行密钥永不回显明文，响应只包含掩码、配置状态和非敏感运行参数。 */
export function getSettlementCmbConfig() {
  return request.get<SettlementCmbConfig>(`${baseUrl}/cmb-config`);
}

/** 敏感字段留空表示保留后端原值，请求体由全局 API 加密层保护。 */
export function updateSettlementCmbConfig(data: SettlementCmbConfigRequest) {
  return request.put(`${baseUrl}/cmb-config`, data);
}

export function approveSettlementSubAccount(applicationId: string | number, opinion: string) {
  // 审核页统一汇总银行开户结果，关闭全局错误弹窗以避免同一失败重复提示。
  return request.post(`${baseUrl}/${applicationId}/approve`, { opinion }, { silent: true } as any);
}

export function rejectSettlementSubAccount(applicationId: string | number, reason: string) {
  return request.post(`${baseUrl}/${applicationId}/reject`, { reason });
}

/** 高风险操作：仅主管权限可将已通过企业移出结算白名单，后端保留 active_flag 阻止重复申请。 */
export function blacklistSettlementSubAccount(applicationId: string | number, reason: string) {
  return request.post(`${baseUrl}/${applicationId}/blacklist`, { reason });
}

export function getSettlementSubAccountBankAccount(applicationId: string | number) {
  return request.get<{ bankAccount: string }>(`${baseUrl}/${applicationId}/bank-account`);
}

export function getSettlementSubAccountContactPhone(applicationId: string | number) {
  return request.get<{ contactPhone: string }>(`${baseUrl}/${applicationId}/contact-phone`);
}

/** 审核材料地址按权限临时获取，列表只返回是否已上传，避免长期暴露 OSS 签名 URL。 */
export function getSettlementSubAccountAuthorizationLetter(applicationId: string | number) {
  return request.get<{ url: string; fileName: string }>(`${baseUrl}/${applicationId}/authorization-letter`);
}
