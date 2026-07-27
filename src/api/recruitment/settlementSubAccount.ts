import request from '@/utils/request';

const baseUrl = '/admin/settlement/sub-account';
// 运营台统一使用现行抽佣命名，避免继续依赖后端仅为历史版本保留的 interest-rate 别名。
const commissionRateUrl = `${baseUrl}/commission-rate`;

const normalizeCommissionRate = (value: unknown) => {
  const rate = Number(value);
  return Number.isFinite(rate) && rate >= 3 && rate <= 100 ? Math.round(rate * 10) / 10 : 5;
};

// 兼容前端先发布、后端尚未重启的短暂窗口；仅对明确的“路由不存在”执行旧接口降级。
const isMissingEndpoint = (error: any) => {
  const message = [error?.message, error?.response?.data?.msg, error?.response?.data?.message, String(error || '')]
    .filter(Boolean)
    .join(' ');
  return error?.response?.status === 404 || /No endpoint|访问资源不存在/.test(message);
};

export type SubAccountAuditStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'BLACKLISTED';

export interface SettlementSubAccountVO {
  applicationId: string | number;
  companyId: string | number;
  companyName: string;
  unifiedSocialCreditCode?: string;
  subAccountName: string;
  /** 招商开户成功后由后端解密并即时生成的脱敏子单元编号。 */
  subAccountNoMasked?: string;
  accountType: 'CORPORATE' | 'INDIVIDUAL' | string;
  bankBranch: string;
  bankAccountMasked: string;
  contactName: string;
  contactPhoneMasked?: string;
  version: number;
  /** 抽佣百分比；企业单独值优先，否则由后端回填全局值。 */
  individualCommissionRate?: number | null;
  effectiveCommissionRate?: number;
  commissionRateSource?: 'INDIVIDUAL' | 'GLOBAL';
  authorizationLetterUploaded?: boolean;
  createTime: string;
  status: SubAccountAuditStatus;
  rejectReason?: string;
  auditUserName?: string;
  auditTime?: string;
  openingStatus?: 'PROCESSING' | 'SUCCESS' | 'RETRY_WAIT' | 'FAILED_MANUAL' | 'UNKNOWN' | string;
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

export interface SettlementSubAccountUpdateRequest {
  subAccountName: string;
  accountType: 'CORPORATE' | 'INDIVIDUAL';
  bankBranch: string;
  encryptedBankAccount?: string;
  contactName: string;
  encryptedContactPhone?: string;
  commissionRateMode?: 'GLOBAL' | 'INDIVIDUAL';
  commissionRate?: number;
  reason: string;
  version: number;
}

export interface SettlementCommissionRateConfig {
  globalCommissionRate: number;
}

export interface SettlementGlobalSettings {
  globalCommissionRate: number;
  globalMainAccountNoMasked?: string;
  globalMainAccountConfigured: boolean;
  allowMultipleMainAccounts: boolean;
}

export interface SettlementGlobalSettingsRequest {
  commissionRate: number;
  /** 留空表示保留后端已加密保存的全局主账号。 */
  mainAccountNo?: string;
  allowMultipleMainAccounts: boolean;
}

export interface SettlementMainAccountSettings {
  allowMultipleMainAccounts: boolean;
  settingSource: 'GLOBAL' | 'INDIVIDUAL';
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

export interface SettlementPaymentAccount {
  accountId: string | number;
  accountName: string;
  accountNoMasked: string;
  subjectCompanyName?: string;
  contactName?: string;
  contactPhoneMasked?: string;
  assigned: boolean;
  defaultAccount: boolean;
  /** 开户成功子账号记录确认的所属主账号状态：SUCCESS/UNASSIGNED/ERROR。 */
  syncStatus: 'SUCCESS' | 'UNASSIGNED' | 'ERROR' | string;
  syncCode?: string;
  syncMessage?: string;
}

export interface SettlementPaymentAccountCreateRequest {
  accountName: string;
  accountNo: string;
  subjectCompanyName: string;
  contactName: string;
  contactPhone: string;
}

export interface SettlementQualificationUpdateRequest {
  businessLicense: string;
  legalPersonIdFront: string;
  legalPersonIdBack: string;
  bankAccountProof: string;
  authLetter: string;
  taxRecords: string;
  socialSecurityProofs: string;
  officePhotos: string;
}

export interface SettlementPaymentAccountProfileRequest {
  accountName: string;
  subjectCompanyName: string;
  contactName: string;
  /** 留空表示保留该主账号已经加密保存的联系方式。 */
  contactPhone?: string;
}

export function listSettlementSubAccount(params: SettlementSubAccountQuery) {
  return request.get<any>(`${baseUrl}/list`, { params }).then((response: any) => {
    if (!Array.isArray(response?.rows)) return response;
    response.rows = response.rows.map((row: any) => {
      const individual = row.individualCommissionRate ?? row.individualAnnualRate;
      return {
        ...row,
        individualCommissionRate: individual == null ? null : normalizeCommissionRate(individual),
        effectiveCommissionRate: normalizeCommissionRate(row.effectiveCommissionRate ?? row.effectiveAnnualRate),
        commissionRateSource: row.commissionRateSource ?? row.interestRateSource ?? (individual == null ? 'GLOBAL' : 'INDIVIDUAL')
      };
    });
    return response;
  });
}

export function getSettlementSubAccountStatistics() {
  return request.get<SettlementSubAccountStatistics>(`${baseUrl}/statistics`);
}

/** 敏感字段为空表示保留原值；请求体同时经过全局 API 加密层保护。 */
export function updateSettlementSubAccount(applicationId: string | number, data: SettlementSubAccountUpdateRequest) {
  return request({
    url: `${baseUrl}/${applicationId}`,
    method: 'put',
    headers: { isEncrypt: true },
    data
  });
}

export function getSettlementCommissionRate() {
  return request.get<any>(commissionRateUrl).then((response: any) => {
    const data = response?.data || {};
    return {
      ...response,
      data: {
        ...data,
        globalCommissionRate: normalizeCommissionRate(data.globalCommissionRate ?? data.globalAnnualRate)
      }
    };
  });
}

export function updateSettlementCommissionRate(commissionRate: number) {
  return request.put(commissionRateUrl, { commissionRate });
}

/** 全局主账号仅返回掩码；完整账号只在加密保存请求中提交。 */
export function getSettlementGlobalSettings() {
  return request({ url: `${baseUrl}/global-settings`, method: 'get', silent: true } as any)
    .then((response: any) => ({
      ...response,
      data: {
        ...(response?.data || {}),
        globalCommissionRate: normalizeCommissionRate(response?.data?.globalCommissionRate),
        allowMultipleMainAccounts: response?.data?.allowMultipleMainAccounts === true
      }
    }))
    .catch(async (error: any) => {
      if (!isMissingEndpoint(error)) throw error;
      const [rateResponse, cmbResponse]: any[] = await Promise.all([
        getSettlementCommissionRate(),
        getSettlementCmbConfig()
      ]);
      return {
        data: {
          globalCommissionRate: normalizeCommissionRate(rateResponse?.data?.globalCommissionRate),
          globalMainAccountNoMasked: cmbResponse?.data?.parentAccountNoMasked || '',
          globalMainAccountConfigured: cmbResponse?.data?.parentAccountConfigured === true,
          allowMultipleMainAccounts: false
        }
      };
    });
}

export function updateSettlementGlobalSettings(data: SettlementGlobalSettingsRequest) {
  return request({
    url: `${baseUrl}/global-settings`,
    method: 'put',
    headers: { isEncrypt: true },
    silent: true,
    data
  } as any).catch((error: any) => {
    if (!isMissingEndpoint(error)) throw error;
    // 旧后端只能更新抽佣；主账号仍读取既有招行测试配置，重启新后端后即可保存完整全局规则。
    return updateSettlementCommissionRate(data.commissionRate);
  });
}

export function updateCompanySettlementCommissionRate(applicationId: string | number, commissionRate: number) {
  return request.put(`${baseUrl}/${applicationId}/commission-rate`, { commissionRate });
}

export function resetCompanySettlementCommissionRate(applicationId: string | number) {
  return request.delete(`${baseUrl}/${applicationId}/commission-rate`);
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

/** 完整招商子单元编号只通过加密响应按需读取，列表始终使用脱敏值。 */
export function getSettlementSubAccountNo(applicationId: string | number) {
  return request.get<{ subAccountNo: string }>(`${baseUrl}/${applicationId}/sub-account-no`);
}

export function getSettlementSubAccountContactPhone(applicationId: string | number) {
  return request.get<{ contactPhone: string }>(`${baseUrl}/${applicationId}/contact-phone`);
}

/** 审核材料地址按权限临时获取，列表只返回是否已上传，避免长期暴露 OSS 签名 URL。 */
export function getSettlementSubAccountAuthorizationLetter(applicationId: string | number) {
  return request.get<{ url: string; fileName: string }>(`${baseUrl}/${applicationId}/authorization-letter`);
}

/** 付款账户列表只返回掩码，完整账号由有权限的管理员按需读取。 */
export function getSettlementPaymentAccounts(applicationId: string | number) {
  return request.get<SettlementPaymentAccount[]>(`${baseUrl}/${applicationId}/payment-accounts`);
}

/** 完整主账号卡号使用加密响应，前端仅在当前弹窗内短暂展示。 */
export function getSettlementPaymentAccountNo(applicationId: string | number, accountId: string | number) {
  return request.get<{ accountNo: string }>(`${baseUrl}/${applicationId}/payment-accounts/${accountId}/account-no`);
}

export function getSettlementMainAccountSettings(applicationId: string | number) {
  return request({
    url: `${baseUrl}/${applicationId}/main-account-settings`,
    method: 'get',
    silent: true
  } as any).catch((error: any) => {
    if (!isMissingEndpoint(error)) throw error;
    return { data: { allowMultipleMainAccounts: false, settingSource: 'GLOBAL' } };
  });
}

export function addSettlementPaymentAccount(applicationId: string | number, data: SettlementPaymentAccountCreateRequest) {
  return request<SettlementPaymentAccount>({
    url: `${baseUrl}/${applicationId}/payment-accounts`,
    method: 'post',
    headers: { isEncrypt: true },
    data
  });
}

/** 审核通过前保存管理端补充或更换的企业资质附件，字段值均为稳定 OSS ID。 */
export function updateSettlementQualification(
  applicationId: string | number,
  data: SettlementQualificationUpdateRequest
) {
  return request.put(`${baseUrl}/${applicationId}/qualification`, data);
}

export function uploadSettlementQualification(file: File) {
  const data = new FormData();
  data.append('file', file);
  return request.post<any>('/resource/oss/upload', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}

export function updateSettlementPaymentAccountProfile(
  applicationId: string | number,
  accountId: string | number,
  data: SettlementPaymentAccountProfileRequest
) {
  return request<SettlementPaymentAccount>({
    url: `${baseUrl}/${applicationId}/payment-accounts/${accountId}/profile`,
    method: 'put',
    headers: { isEncrypt: true },
    data
  });
}

export function deleteSettlementPaymentAccount(applicationId: string | number, accountId: string | number) {
  return request({
    url: `${baseUrl}/${applicationId}/payment-accounts/${accountId}`,
    method: 'delete'
  });
}

export function assignSettlementPaymentAccounts(
  applicationId: string | number,
  data: {
    accountIds: Array<string | number>;
    defaultAccountId: string | number;
    allowMultipleMainAccounts: boolean;
  }
) {
  return request({
    url: `${baseUrl}/${applicationId}/payment-account-bindings`,
    method: 'put',
    headers: { isEncrypt: true },
    data
  });
}
