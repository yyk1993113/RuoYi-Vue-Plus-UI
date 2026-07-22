import request from '@/utils/request';

const baseUrl = '/admin/recruitment/ledger-payout';

/** 管理员端单人发放预览；金额只展示后端计算结果，确认接口不接收任何金额字段。 */
export interface AdminLedgerPayoutPreview {
  previewId: string;
  expiresAt: string;
  ledgerId: string | number;
  orderNo?: string;
  companyId?: string | number;
  companyName?: string;
  jobId?: string | number;
  jobNo?: string;
  jobName?: string;
  jobType?: string;
  jobTypeName?: string;
  userId?: string | number;
  userName?: string;
  jobSeekerNo?: string;
  taxCategoryId?: string | number;
  taxCategoryCode?: string;
  taxCategoryName?: string;
  incomeType?: string;
  incomeTypeName?: string;
  grossAmount: number;
  commissionRate: number;
  enterpriseFeeAmount: number;
  enterpriseTotalAmount: number;
  cumulativeGrossBefore: number;
  cumulativeTaxBefore: number;
  cumulativeTaxableIncome: number;
  continuousMonths: number;
  deductionAmount: number;
  taxRate: number;
  quickDeduction: number;
  individualTaxAmount: number;
  workerNetAmount: number;
  availableBalance?: number;
  currency?: string;
  realNameVerified: boolean;
  bankCardVerified: boolean;
  subAccountReady: boolean;
  balanceReady: boolean;
  canConfirm: boolean;
  blockingReason?: string;
  payoutStatus?: string;
  taxFormula?: string;
  taxRuleVersion?: string;
}

export interface TaxBusinessCategory {
  categoryId: string | number;
  categoryCode: string;
  categoryName: string;
  incomeType: string;
  status?: string;
  remark?: string;
}

export interface PayoutTradePasswordSetupRequest {
  encryptedPassword: string;
  encryptedConfirmPassword: string;
  passwordDigest: string;
  confirmPasswordDigest: string;
  code?: string;
  uuid?: string;
}

export interface PayoutTradePasswordVerifyRequest {
  passwordDigest: string;
  ledgerId: string | number;
  previewId: string;
  code?: string;
  uuid?: string;
}

export function getAdminLedgerPayoutPreview(ledgerId: string | number) {
  return request.get<AdminLedgerPayoutPreview>(`${baseUrl}/${ledgerId}/preview`);
}

export function confirmAdminLedgerPayout(data: { ledgerId: string | number; previewId: string; ticket: string; idempotencyKey: string }) {
  return request.post(`${baseUrl}/confirm`, data);
}

export function getPayoutTradePasswordStatus() {
  return request.get<{ configured: boolean }>(`${baseUrl}/trade-password/status`);
}

export function setupPayoutTradePassword(data: PayoutTradePasswordSetupRequest) {
  return request({
    url: `${baseUrl}/trade-password/setup`,
    method: 'post',
    headers: { isEncrypt: true },
    data
  });
}

export function verifyPayoutTradePassword(data: PayoutTradePasswordVerifyRequest) {
  return request<{ verified: boolean; ticket: string }>({
    url: `${baseUrl}/trade-password/verify`,
    method: 'post',
    headers: { isEncrypt: true },
    data
  });
}

export function listTaxBusinessCategories() {
  return request.get<TaxBusinessCategory[]>(`${baseUrl}/tax-categories`);
}

export function createTaxBusinessCategory(data: { categoryCode: string; categoryName: string; remark?: string }) {
  return request.post<string | number>(`${baseUrl}/tax-categories`, data);
}

export function bindJobTaxBusinessCategory(jobId: string | number, categoryId: string | number) {
  return request.put(`${baseUrl}/jobs/${jobId}/tax-category`, { categoryId });
}
