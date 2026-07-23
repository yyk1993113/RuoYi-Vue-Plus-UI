import request from '@/utils/request';

const baseUrl = '/admin/settlement/reconciliation';

export type ReceiptTaskStatus = 'PENDING' | 'PROCESSING' | 'FETCHED' | 'FAILED';
export type FundingFlowStatus = 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'UNKNOWN';
export type BankFlowDirection = 'INCOME' | 'EXPENSE' | 'UNKNOWN';

export interface FundingFlowQuery {
  keyword?: string;
  status?: FundingFlowStatus | '';
  startDate?: string;
  endDate?: string;
  pageNum: number;
  pageSize: number;
}

export interface FundingFlow {
  fundingId: string | number;
  requestNo: string;
  bankSerialNo?: string;
  companyId: string | number;
  companyNo?: string;
  companyName?: string;
  ledgerId: string | number;
  orderNo?: string;
  applicationId: string | number;
  subAccountNoMasked?: string;
  ledgerAmount?: string | number;
  commissionRate?: string | number;
  commissionAmount?: string | number;
  transferAmount?: string | number;
  status: FundingFlowStatus;
  bankResponseCode?: string;
  failureCode?: string;
  failureMessage?: string;
  operatorName?: string;
  createTime?: string;
  updateTime?: string;
}

export interface FundingFlowPage {
  rows: FundingFlow[];
  total: number;
}

// 银行流水只接收后端已脱敏的子单元、对方账号和摘要，不在浏览器保留完整金融账号。
export interface BankFundingFlow {
  bankSerialNo?: string;
  bankTime?: string;
  direction: BankFlowDirection;
  amount?: string | number;
  balance?: string | number;
  applicationId?: string | number;
  subAccountNoMasked?: string;
  companyId?: string | number;
  companyNo?: string;
  companyName?: string;
  counterpartyAccountMasked?: string;
  purposeMasked?: string;
}

export interface ReceiptTask {
  receiptNo: string;
  type: 'PAYROLL_RECEIPT' | 'SUB_ACCOUNT_STATEMENT' | string;
  status: ReceiptTaskStatus;
  downloadUrl?: string;
  startDate?: string;
  endDate?: string;
}

export interface SyncFundingResult {
  fetched: number;
  updated: number;
  skipped: number;
  queriedAt?: string;
  flows: BankFundingFlow[];
}

export function listReceiptTasks(params: { receiptNo?: string; type?: string; status?: string }) {
  return request.get<ReceiptTask[]>(baseUrl, { params });
}

// 标准分页接口直接返回 TableDataInfo，rows/total 位于响应根节点。
export function listFundingFlows(params: FundingFlowQuery) {
  return request.get<any, FundingFlowPage>(`${baseUrl}/funding-flows`, { params });
}

export function syncFundingFlows(data: { startDate?: string; endDate?: string }) {
  return request.post<any, SyncFundingResult>(`${baseUrl}/funding-flows/sync`, data);
}

export function submitPayrollReceipt(paymentNo: string) {
  return request.post<ReceiptTask>(`${baseUrl}/payroll`, { paymentNo });
}

export function submitSubAccountStatement(data: { applicationId: string | number; startDate: string; endDate: string }) {
  return request.post<ReceiptTask>(`${baseUrl}/statement`, data);
}

export function queryReceiptResult(receiptNo: string) {
  return request.get<ReceiptTask>(`${baseUrl}/${encodeURIComponent(receiptNo)}/result`);
}

export function downloadReceipt(receiptNo: string) {
  return request.get<Blob>(`${baseUrl}/${encodeURIComponent(receiptNo)}/download`, { responseType: 'blob' });
}
