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
  /** 岗位方向返回岗位名称，候选人方向返回求职者姓名。 */
  entityName?: string;
  /** 仅岗位推荐结果返回岗位所属公司名称。 */
  companyName?: string;
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

export interface RecommendationRerankWeightConfig {
  strategyCode: RecommendationCrowdStrategy;
  vectorWeight: number;
  localWeight: number;
  industryWeight: number;
  salaryWeight: number;
  version: number;
  mode: 'OFF' | 'SHADOW' | 'ON';
}

export type RecommendationCrowdStrategy = 'GENERAL' | 'WHITE_COLLAR' | 'BLUE_COLLAR';
export type RecommendationCrowdMatchField = 'JOB_NAME' | 'CATEGORY' | 'JOB_TYPE' | 'SALARY_UNIT';

export interface RecommendationCrowdRule {
  ruleId?: number | string;
  strategyCode: Exclude<RecommendationCrowdStrategy, 'GENERAL'>;
  matchField: RecommendationCrowdMatchField;
  matchValues: string;
  priority: number;
  status: '0' | '1';
  description?: string;
}

export type RecommendationRerankWeightRequest = Pick<
  RecommendationRerankWeightConfig,
  'vectorWeight' | 'localWeight' | 'industryWeight' | 'salaryWeight'
> & { strategyCode?: RecommendationCrowdStrategy };

export type IndustryGraphNodeType = 'TRACK' | 'CHAIN_STAGE' | 'SUPPORT_SERVICE' | 'POSITION_FAMILY' | 'CAPABILITY';
export type IndustryGraphRelationType =
  | 'UPSTREAM'
  | 'DOWNSTREAM'
  | 'ADJACENT_STAGE'
  | 'SUPPORT_SERVICE'
  | 'SKILL_TRANSFER'
  | 'CROSS_TRACK';

export interface IndustryGraphNode {
  nodeId?: number | string;
  nodeCode: string;
  nodeName: string;
  nodeType: IndustryGraphNodeType;
  parentId?: number | string;
  trackCode?: string;
  matchKeywords?: string;
  description?: string;
  sortOrder: number;
  status: '0' | '1';
  dataVersion?: number;
}

export interface IndustryGraphEdge {
  edgeId?: number | string;
  sourceNodeId: number | string;
  sourceNodeName?: string;
  targetNodeId: number | string;
  targetNodeName?: string;
  relationType: IndustryGraphRelationType;
  relationWeight: number;
  bidirectional: '0' | '1';
  maxHops: number;
  reason?: string;
  status: '0' | '1';
  dataVersion?: number;
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

const rerankWeightUrl = '/admin/recommendation/rerank/weights';

export function getRecommendationRerankWeights(strategyCode: RecommendationCrowdStrategy = 'GENERAL') {
  return request.get<RecommendationRerankWeightConfig>(rerankWeightUrl, { params: { strategyCode } });
}

const industryGraphUrl = '/admin/recommendation/industry-graph';
const crowdRuleUrl = '/admin/recommendation/crowd-rules';

export function listRecommendationCrowdRules() {
  return request.get<RecommendationCrowdRule[]>(crowdRuleUrl);
}

export function createRecommendationCrowdRule(data: RecommendationCrowdRule) {
  return request.post<void>(crowdRuleUrl, data);
}

export function updateRecommendationCrowdRule(ruleId: number | string, data: RecommendationCrowdRule) {
  return request.put<void>(`${crowdRuleUrl}/${ruleId}`, data);
}

export function listIndustryGraphNodes(params?: { nodeType?: IndustryGraphNodeType | ''; keyword?: string }) {
  return request.get<IndustryGraphNode[]>(`${industryGraphUrl}/nodes`, { params });
}

export function createIndustryGraphNode(data: IndustryGraphNode) {
  return request.post<IndustryGraphNode>(`${industryGraphUrl}/nodes`, data);
}

export function updateIndustryGraphNode(nodeId: number | string, data: IndustryGraphNode) {
  return request.put<IndustryGraphNode>(`${industryGraphUrl}/nodes/${nodeId}`, data);
}

export function listIndustryGraphEdges() {
  return request.get<IndustryGraphEdge[]>(`${industryGraphUrl}/edges`);
}

export function createIndustryGraphEdge(data: IndustryGraphEdge) {
  return request.post<void>(`${industryGraphUrl}/edges`, data);
}

export function updateIndustryGraphEdge(edgeId: number | string, data: IndustryGraphEdge) {
  return request.put<void>(`${industryGraphUrl}/edges/${edgeId}`, data);
}

export function updateRecommendationRerankWeights(data: RecommendationRerankWeightRequest) {
  return request.put<RecommendationRerankWeightConfig>(rerankWeightUrl, data);
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
