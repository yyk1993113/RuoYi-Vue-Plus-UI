import request from '@/utils/request';

const baseUrl = '/admin/settlement/reconciliation';

export type ReceiptTaskStatus = 'PENDING' | 'PROCESSING' | 'FETCHED' | 'FAILED';

export interface ReceiptTask {
  receiptNo: string;
  type: 'PAYROLL_RECEIPT' | 'SUB_ACCOUNT_STATEMENT' | string;
  status: ReceiptTaskStatus;
  downloadUrl?: string;
  startDate?: string;
  endDate?: string;
}

export function listReceiptTasks(params: { receiptNo?: string; type?: string; status?: string }) {
  return request.get<ReceiptTask[]>(baseUrl, { params });
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
