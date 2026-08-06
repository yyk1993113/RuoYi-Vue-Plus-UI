import request from '@/utils/request';

export interface QualificationApplication {
  id: number;
  version: number;
  status: string;
  certificationStatus?: string;
  agreementStatus?: string;
  accountStatus?: string;
  settlementMode: string;
  sourceType: string;
  sourceReference?: string;
  companyName?: string;
  creditCode?: string;
  legalPersonName?: string;
  legalPersonIdMasked?: string;
  registeredCapital?: number;
  establishmentDate?: string;
  registeredAddress?: string;
  contactPhone?: string;
  contactEmail?: string;
  bankName?: string;
  accountName?: string;
  bankAccountMasked?: string;
  cnapsCode?: string;
  incomingBankName?: string;
  incomingAccountMasked?: string;
  reviewRemark?: string;
  submittedAt?: string;
  reviewedAt?: string;
}

export interface QualificationApplicationRow {
  tenantId: string;
  application: QualificationApplication;
}

export interface QualificationFile {
  id: number;
  fileType: string;
  fileName: string;
  required: boolean;
  reviewStatus: string;
  rejectReason?: string;
  validTo?: string;
  contentType?: string;
  fileSize?: number;
}

export interface QualificationDetail {
  application: QualificationApplication;
  files: QualificationFile[];
  requiredFileTypes: string[];
}

export interface QualificationReviewForm {
  tenantId: string;
  applicationId: number;
  applicationVersion: number;
  decision: 'APPROVE' | 'REJECT' | 'SUPPLEMENT';
  remark?: string;
}

export const listQualificationApplications = (status?: string) =>
  request<QualificationApplicationRow[]>({
    url: '/admin/finance/qualification/applications',
    method: 'get',
    params: { status }
  });

export const getQualificationApplication = (tenantId: string, applicationId: number) =>
  request<QualificationDetail>({
    url: `/admin/finance/qualification/applications/${encodeURIComponent(tenantId)}/${applicationId}`,
    method: 'get'
  });

export const reviewQualificationApplication = (data: QualificationReviewForm) =>
  request<QualificationApplication>({
    url: '/admin/finance/qualification/review',
    method: 'post',
    data
  });

export const previewQualificationFile = (tenantId: string, fileId: number) =>
  request<Blob>({
    url: `/admin/finance/qualification/files/${encodeURIComponent(tenantId)}/${fileId}/preview`,
    method: 'get',
    responseType: 'blob'
  });
