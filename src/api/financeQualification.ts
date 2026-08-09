import request from '@/utils/request';

const baseUrl = '/admin/finance/qualification';

export interface FinanceQualificationApplication {
  id: number | string;
  version: number;
  status?: string;
  certificationStatus?: string;
  agreementStatus?: string;
  accountStatus?: string;
  settlementStatus?: string;
  settlementMode?: string;
  sourceType?: string;
  sourceReference?: string;
  companyName?: string;
  creditCode?: string;
  legalPersonName?: string;
  legalPersonIdMasked?: string;
  registeredCapital?: number | string;
  establishmentDate?: string;
  registeredAddress?: string;
  contactPhone?: string;
  contactEmail?: string;
  accountScheme?: string;
  bankName?: string;
  cnapsCode?: string;
  accountName?: string;
  bankAccountMasked?: string;
  incomingBankName?: string;
  incomingAccountMasked?: string;
  reviewRemark?: string;
  submittedAt?: string;
  reviewedAt?: string;
}

export interface FinanceQualificationApplicationRow {
  tenantId: string;
  application: FinanceQualificationApplication;
}

export interface FinanceQualificationFile {
  id: number | string;
  fileType?: string;
  fileName?: string;
  required?: boolean;
  reviewStatus?: string;
  rejectReason?: string;
  validTo?: string;
  contentType?: string;
  fileSize?: number;
}

export interface FinanceQualificationDetail {
  application: FinanceQualificationApplication;
  files: FinanceQualificationFile[];
  requiredFileTypes: string[];
}

export interface FinanceQualificationReviewRequest {
  tenantId: string;
  applicationId: number | string;
  applicationVersion: number;
  decision: 'APPROVE' | 'REJECT' | 'SUPPLEMENT';
  remark?: string;
}

export function listFinanceQualificationApplications(status?: string) {
  return request.get<FinanceQualificationApplicationRow[]>(`${baseUrl}/applications`, {
    params: status ? { status } : undefined
  });
}

export function getFinanceQualificationDetail(tenantId: string, applicationId: number | string) {
  return request.get<FinanceQualificationDetail>(`${baseUrl}/applications/${tenantId}/${applicationId}`);
}

export function reviewFinanceQualification(data: FinanceQualificationReviewRequest) {
  return request.post<FinanceQualificationApplication>(`${baseUrl}/review`, data);
}

export function previewFinanceQualificationFile(tenantId: string, fileId: number | string) {
  return request.get<Blob>(`${baseUrl}/files/${tenantId}/${fileId}/preview`, {
    responseType: 'blob'
  } as any);
}
