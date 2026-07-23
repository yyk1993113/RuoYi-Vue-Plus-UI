import request from '@/utils/request';

const baseUrl = '/admin/recommendation/diagnostics';

export type RecommendationDirection = 'CANDIDATE_TO_JOB' | 'JOB_TO_CANDIDATE';
export type OutboxStatus = 'PENDING' | 'PUBLISHING' | 'PUBLISHED' | 'DEAD';

export interface RecommendationDiagnosticsOverview {
  diagnosticsEnabled: boolean;
  testEnabled: boolean;
  maxTestK: number;
  outboxWriteEnabled: boolean;
  outboxPublisherEnabled: boolean;
  recommendationReachable: boolean;
  recommendationStatus: string;
  healthTookMillis: number;
  outboxCounts: Record<OutboxStatus, number>;
  oldestOutstandingAt?: string;
  latestPublishedAt?: string;
  summary: string;
}

export interface RecommendationOutboxRow {
  outboxId: number;
  eventId: string;
  eventType: 'VECTOR_UPSERT' | 'VECTOR_DELETE';
  entityType: 'CANDIDATE' | 'JOB';
  entityId: number;
  status: OutboxStatus;
  attemptCount: number;
  nextAttemptTime?: string;
  publishedAt?: string;
  lastError?: string;
  createTime?: string;
  updateTime?: string;
}

export interface RecommendationOutboxQuery {
  pageNum: number;
  pageSize: number;
  status?: OutboxStatus | '';
  entityType?: 'CANDIDATE' | 'JOB' | '';
  eventType?: 'VECTOR_UPSERT' | 'VECTOR_DELETE' | '';
  entityId?: number;
}

export interface RecommendationSearchTestRequest {
  direction: RecommendationDirection;
  sourceCode: string;
  k: number;
  filters?: {
    province?: string;
    city?: string;
    district?: string;
    jobType?: string;
    positionId?: number;
    education?: string;
    experience?: string;
  };
}

export interface RecommendationSearchHit {
  entityId: number;
  score: number;
}

export interface RecommendationSearchTestResult {
  success: boolean;
  status: string;
  direction: RecommendationDirection;
  sourceCode: string;
  strategy?: string;
  modelVersion?: string;
  schemaVersion?: string;
  recommendationTookMillis: number;
  gatewayTookMillis: number;
  hits: RecommendationSearchHit[];
  message: string;
}

// 页面仅访问现有管理后端；内部令牌和推荐服务地址不会下发到浏览器。
export function getRecommendationDiagnosticsOverview() {
  return request.get<RecommendationDiagnosticsOverview>(`${baseUrl}/overview`);
}

export function listRecommendationOutbox(query: RecommendationOutboxQuery) {
  return request.get<RecommendationOutboxRow[]>(`${baseUrl}/outbox/list`, { params: query });
}

export function runRecommendationSearchTest(data: RecommendationSearchTestRequest) {
  return request.post<RecommendationSearchTestResult>(`${baseUrl}/search-test`, data);
}
