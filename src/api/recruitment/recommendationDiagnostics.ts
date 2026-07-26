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
  offlineRefreshEnabled: boolean;
  offlineScheduleEnabled: boolean;
  offlineReadinessReachable: boolean;
  offlineConfigurationReady: boolean;
  offlineRolloutReady: boolean;
  offlineConsumerEnabled: boolean;
  offlineTopicIsolated: boolean;
  offlineBatchSize: number;
  offlineThreadMaxSize: number;
  offlineBlockers: string[];
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
  entityCode?: string;
  entityName?: string;
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

export interface RecommendationMemoryStatusRequest {
  direction: RecommendationDirection;
  sourceCode: string;
}

export interface RecommendationMemoryStatusResult {
  success: boolean;
  status: string;
  sourceCode: string;
  memoryEnabled: boolean;
  present: boolean;
  eventCount: number;
  confidence: number;
  entityVersion: number;
  observedAt?: string;
  modelVersion?: string;
  schemaVersion?: string;
  message: string;
}

export type RecommendationRefreshTaskStatus = 'PENDING' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface RecommendationRefreshTaskRequest {
  entityType: 'CANDIDATE' | 'JOB';
  refreshMode: 'FULL' | 'INCREMENTAL';
  changedAfter?: string;
  batchSize: number;
}

export interface RecommendationRefreshTaskRow {
  taskId: number;
  entityType: 'CANDIDATE' | 'JOB';
  refreshMode: 'FULL' | 'INCREMENTAL';
  changedAfter?: string;
  status: RecommendationRefreshTaskStatus;
  cursorId: number;
  scannedCount: number;
  enqueuedCount: number;
  batchSize: number;
  attemptCount: number;
  nextAttemptTime?: string;
  lastError?: string;
  startedAt?: string;
  finishedAt?: string;
  createTime?: string;
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

export function getRecommendationMemoryStatus(data: RecommendationMemoryStatusRequest) {
  return request.post<RecommendationMemoryStatusResult>(`${baseUrl}/memory-status`, data);
}

const offlineRefreshUrl = '/admin/recommendation/offline-refresh/tasks';

export function createRecommendationRefreshTask(data: RecommendationRefreshTaskRequest) {
  return request.post<RecommendationRefreshTaskRow>(offlineRefreshUrl, data);
}

export function listRecommendationRefreshTasks(params: { pageNum: number; pageSize: number }) {
  return request.get<RecommendationRefreshTaskRow[]>(offlineRefreshUrl, { params });
}

export function pauseRecommendationRefreshTask(taskId: number) {
  return request.post<void>(`${offlineRefreshUrl}/${taskId}/pause`);
}

export function resumeRecommendationRefreshTask(taskId: number) {
  return request.post<void>(`${offlineRefreshUrl}/${taskId}/resume`);
}

export function cancelRecommendationRefreshTask(taskId: number) {
  return request.post<void>(`${offlineRefreshUrl}/${taskId}/cancel`);
}
