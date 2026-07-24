import request from '@/utils/request';

const taxKnowledgeBaseUrl = '/admin/recruitment/tax-knowledge';

export interface TaxKnowledgeImportVO {
  documentId?: number | string;
  documentName?: string;
  documentVersion?: string;
  actualFormat?: string;
  sourceUrl?: string;
  status?: 'PROCESSING' | 'REVIEW' | 'PUBLISHED' | 'FAILED' | 'ARCHIVED' | string;
  chunkCount?: number;
  embeddingProvider?: string;
  embeddingModel?: string;
  embeddingDimension?: number;
  esIndexName?: string;
}

export interface TaxKnowledgeDocumentVO extends TaxKnowledgeImportVO {
  originalFileName?: string;
  fileSize?: number;
  errorMessage?: string;
  createTime?: string;
  updateTime?: string;
}

export interface TaxKnowledgeDocumentQuery {
  pageNum?: number;
  pageSize?: number;
  documentName?: string;
  status?: string;
}

export interface TaxKnowledgeDocumentUpdate {
  documentName: string;
  documentVersion: string;
  sourceUrl?: string;
}

export interface TaxKnowledgeStatsVO {
  chatterCount?: number;
  questionCount?: number;
  lastChatTime?: string;
}

// 税务知识库导入入口：后端会同步完成 Word 解析、分块、向量化和 ES 索引写入，耗时可能明显长于普通表单提交。
export function importTaxKnowledgeDocument(data: FormData) {
  return request.post<any>(`${taxKnowledgeBaseUrl}/documents/import`, data, {
    timeout: 300000,
    headers: { repeatSubmit: false }
  });
}

// 管理列表只读取文档元数据；知识正文仍保存在 ES，不在运营台接口中返回。
export function listTaxKnowledgeDocuments(query: TaxKnowledgeDocumentQuery) {
  return request.get<any>(`${taxKnowledgeBaseUrl}/documents`, { params: query });
}

export function getTaxKnowledgeStats() {
  return request.get<any>(`${taxKnowledgeBaseUrl}/stats`);
}

export function updateTaxKnowledgeDocument(documentId: number | string, data: TaxKnowledgeDocumentUpdate) {
  return request.put<any>(`${taxKnowledgeBaseUrl}/documents/${documentId}`, data);
}

export function deleteTaxKnowledgeDocument(documentId: number | string) {
  return request.delete(`${taxKnowledgeBaseUrl}/documents/${documentId}`);
}
