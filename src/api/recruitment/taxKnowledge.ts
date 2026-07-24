import request from '@/utils/request';

const taxKnowledgeBaseUrl = '/admin/recruitment/tax-knowledge';

export interface TaxKnowledgeImportVO {
  documentId?: number;
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

// 税务知识库导入入口：后端会同步完成 Word 解析、分块、向量化和 ES 索引写入，耗时可能明显长于普通表单提交。
export function importTaxKnowledgeDocument(data: FormData) {
  return request.post<any>(`${taxKnowledgeBaseUrl}/documents/import`, data, {
    timeout: 300000,
    headers: { repeatSubmit: false }
  });
}
