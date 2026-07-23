<!--
  推荐链路诊断页：只读查看当前租户的 Outbox 与独立推荐服务状态，并受控执行单条 KNN 查询。
  页面只调用管理后端；ES/MQ 地址及内部令牌不会暴露给浏览器，也不会自动轮询或重发事件。
-->
<template>
  <div class="diagnostics-page p-4">
    <el-card shadow="never" class="hero-card mb-4">
      <div class="hero-content">
        <div>
          <div class="hero-title">推荐链路诊断</div>
          <div class="hero-subtitle">观察“业务变更 → Outbox → 独立 MQ → 推荐服务 → 向量检索”的运行状态</div>
        </div>
        <el-button icon="Refresh" :loading="overviewLoading || tableLoading" @click="refreshAll">刷新状态</el-button>
      </div>
    </el-card>

    <el-alert v-if="overview" :title="overview.summary" :type="summaryType" :closable="false" show-icon class="mb-4" />

    <el-row :gutter="16" class="mb-4">
      <el-col v-for="card in statusCards" :key="card.key" :xs="24" :sm="12" :lg="6">
        <el-card v-loading="overviewLoading" shadow="hover" class="status-card">
          <div class="status-label">{{ card.label }}</div>
          <div class="status-main">
            <span class="status-value">{{ card.value }}</span>
            <el-tag :type="card.tagType" effect="light">{{ card.tag }}</el-tag>
          </div>
          <div class="status-note">{{ card.note }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-alert
      v-if="overview && !overview.diagnosticsEnabled"
      title="诊断功能默认关闭"
      description="开启诊断配置并重启管理后端后，本页才会读取 Outbox 和检查独立推荐服务。关闭状态不会增加数据库或网络压力。"
      type="info"
      :closable="false"
      show-icon
      class="mb-4"
    />

    <el-card shadow="hover" class="mb-4">
      <template #header>
        <div class="card-header">
          <div>
            <div class="section-title">单条向量检索测试</div>
            <div class="section-note">只查询已经生成的向量，不修改岗位、简历、Outbox 或 ES 文档</div>
          </div>
          <el-tag v-if="overview?.testEnabled" type="success">已开放</el-tag>
          <el-tag v-else type="info">默认关闭</el-tag>
        </div>
      </template>

      <el-form ref="testFormRef" :model="testForm" :rules="testRules" label-width="112px">
        <el-row :gutter="18">
          <el-col :xs="24" :lg="10">
            <el-form-item label="检索方向" prop="direction">
              <el-radio-group v-model="testForm.direction">
                <el-radio-button value="CANDIDATE_TO_JOB">求职者找岗位</el-radio-button>
                <el-radio-button value="JOB_TO_CANDIDATE">岗位找候选人</el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :lg="7">
            <el-form-item :label="sourceCodeLabel" prop="sourceCode">
              <el-input v-model="testForm.sourceCode" clearable maxlength="32" :placeholder="sourceCodePlaceholder" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :lg="7">
            <el-form-item label="返回数量" prop="k">
              <el-input-number v-model="testForm.k" :min="1" :max="overview?.maxTestK || 20" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-collapse class="filter-collapse">
          <el-collapse-item title="可选业务过滤条件" name="filters">
            <el-row :gutter="18">
              <el-col :xs="24" :sm="12" :lg="6">
                <el-form-item label="省份">
                  <el-input v-model="testForm.filters.province" clearable maxlength="64" placeholder="如 江苏省" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :lg="6">
                <el-form-item label="城市">
                  <el-input v-model="testForm.filters.city" clearable maxlength="64" placeholder="如 南京市" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :lg="6">
                <el-form-item label="岗位类型">
                  <el-input v-model="testForm.filters.jobType" clearable maxlength="32" placeholder="业务字典值" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :lg="6">
                <el-form-item label="职位 ID">
                  <el-input-number v-model="testForm.filters.positionId" :min="1" controls-position="right" style="width: 100%" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-collapse-item>
        </el-collapse>

        <div class="test-actions">
          <el-button type="primary" icon="Search" :loading="testLoading" :disabled="!canRunTest" @click="runTest">开始检索</el-button>
          <span class="test-hint">{{ testHint }}</span>
        </div>
      </el-form>

      <div v-if="testResult" class="test-result">
        <el-alert :title="testResult.message" :type="testResult.success ? 'success' : 'warning'" :closable="false" show-icon />
        <el-descriptions :column="4" border class="mt-3">
          <el-descriptions-item label="结果状态">{{ resultStatusLabel(testResult.status) }}</el-descriptions-item>
          <el-descriptions-item label="模型版本">{{ testResult.modelVersion || '-' }}</el-descriptions-item>
          <el-descriptions-item label="推荐耗时">{{ testResult.recommendationTookMillis }} ms</el-descriptions-item>
          <el-descriptions-item label="端到端耗时">{{ testResult.gatewayTookMillis }} ms</el-descriptions-item>
        </el-descriptions>
        <el-table v-if="testResult.hits.length" :data="testResult.hits" border stripe class="mt-3">
          <el-table-column type="index" label="排名" width="80" align="center" />
          <el-table-column :label="targetIdLabel" prop="entityId" min-width="160" align="center" />
          <el-table-column label="相似度分数" min-width="160" align="center">
            <template #default="{ row }">{{ Number(row.score).toFixed(6) }}</template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <div>
            <div class="section-title">Outbox 事件</div>
            <div class="section-note">只显示当前登录租户，不包含手机号、简历正文等个人信息</div>
          </div>
          <div class="count-tags">
            <el-tag type="warning">待发布 {{ outboxCount('PENDING') }}</el-tag>
            <el-tag type="success">已发布 {{ outboxCount('PUBLISHED') }}</el-tag>
            <el-tag type="danger">死信 {{ outboxCount('DEAD') }}</el-tag>
          </div>
        </div>
      </template>

      <el-form ref="queryFormRef" :model="query" :inline="true" class="mb-3">
        <el-form-item label="处理状态" prop="status">
          <el-select v-model="query.status" clearable placeholder="全部" style="width: 130px">
            <el-option label="待发布" value="PENDING" />
            <el-option label="发布中" value="PUBLISHING" />
            <el-option label="已发布" value="PUBLISHED" />
            <el-option label="死信" value="DEAD" />
          </el-select>
        </el-form-item>
        <el-form-item label="对象类型" prop="entityType">
          <el-select v-model="query.entityType" clearable placeholder="全部" style="width: 140px">
            <el-option label="求职者" value="CANDIDATE" />
            <el-option label="岗位" value="JOB" />
          </el-select>
        </el-form-item>
        <el-form-item label="事件类型" prop="eventType">
          <el-select v-model="query.eventType" clearable placeholder="全部" style="width: 150px">
            <el-option label="新增或更新" value="VECTOR_UPSERT" />
            <el-option label="删除" value="VECTOR_DELETE" />
          </el-select>
        </el-form-item>
        <el-form-item label="对象 ID" prop="entityId">
          <el-input-number v-model="query.entityId" :min="1" controls-position="right" style="width: 160px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" :disabled="!overview?.diagnosticsEnabled" @click="handleQuery">查询</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="tableLoading" :data="outboxRows" border stripe>
        <el-table-column label="事件序号" prop="outboxId" width="120" align="center" />
        <el-table-column label="对象" min-width="150">
          <template #default="{ row }">
            <div class="object-cell">
              <el-tag size="small" effect="plain">{{ entityTypeLabel(row.entityType) }}</el-tag>
              <span>#{{ row.entityId }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="变更类型" min-width="130" align="center">
          <template #default="{ row }">{{ eventTypeLabel(row.eventType) }}</template>
        </el-table-column>
        <el-table-column label="处理状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="outboxStatusType(row.status)">{{ outboxStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="尝试次数" prop="attemptCount" width="100" align="center" />
        <el-table-column label="创建时间" prop="createTime" width="170" align="center" />
        <el-table-column label="发布时间" prop="publishedAt" width="170" align="center">
          <template #default="{ row }">{{ row.publishedAt || '-' }}</template>
        </el-table-column>
        <el-table-column label="错误摘要" prop="lastError" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">{{ row.lastError || '-' }}</template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="query.pageNum" v-model:limit="query.pageSize" :total="total" @pagination="loadOutbox" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import type { FormInstance, FormRules, TagProps } from 'element-plus';
import { ElMessage } from 'element-plus';
import {
  getRecommendationDiagnosticsOverview,
  listRecommendationOutbox,
  runRecommendationSearchTest,
  type OutboxStatus,
  type RecommendationDirection,
  type RecommendationDiagnosticsOverview,
  type RecommendationOutboxQuery,
  type RecommendationOutboxRow,
  type RecommendationSearchTestRequest,
  type RecommendationSearchTestResult
} from '@/api/recruitment/recommendationDiagnostics';

type TagType = TagProps['type'];

const overviewLoading = ref(false);
const tableLoading = ref(false);
const testLoading = ref(false);
const overview = ref<RecommendationDiagnosticsOverview>();
const outboxRows = ref<RecommendationOutboxRow[]>([]);
const total = ref(0);
const testResult = ref<RecommendationSearchTestResult>();
const testFormRef = ref<FormInstance>();
const queryFormRef = ref<FormInstance>();

const query = reactive<RecommendationOutboxQuery>({
  pageNum: 1,
  pageSize: 10,
  status: '',
  entityType: '',
  eventType: '',
  entityId: undefined
});

const testForm = reactive<RecommendationSearchTestRequest>({
  direction: 'CANDIDATE_TO_JOB',
  sourceCode: '',
  k: 10,
  filters: {
    province: '',
    city: '',
    jobType: '',
    positionId: undefined
  }
});

const testRules: FormRules = {
  direction: [{ required: true, message: '请选择检索方向', trigger: 'change' }],
  sourceCode: [{ required: true, message: '请输入业务编号', trigger: 'blur' }],
  k: [{ required: true, message: '请输入返回数量', trigger: 'blur' }]
};

const sourceCodeLabel = computed(() => (testForm.direction === 'CANDIDATE_TO_JOB' ? '求职者编号' : '岗位编号'));
const sourceCodePlaceholder = computed(() => (testForm.direction === 'CANDIDATE_TO_JOB' ? '如 SKR-...' : '如 JOB-...'));
const targetIdLabel = computed(() => (testForm.direction === 'CANDIDATE_TO_JOB' ? '岗位 ID' : '求职者用户 ID'));
const canRunTest = computed(
  () => Boolean(overview.value?.diagnosticsEnabled && overview.value?.testEnabled && overview.value?.recommendationReachable) && !testLoading.value
);
const testHint = computed(() => {
  if (!overview.value?.diagnosticsEnabled) return '请先开启诊断功能';
  if (!overview.value?.testEnabled) return '当前仅开放只读监控，手动测试尚未开启';
  if (!overview.value?.recommendationReachable) return '独立推荐服务不可达，请先检查服务状态';
  return '最多同时执行少量测试，请勿用于压测';
});
const summaryType = computed<'success' | 'warning' | 'error' | 'info'>(() => {
  if (!overview.value?.diagnosticsEnabled) return 'info';
  if (!overview.value?.recommendationReachable || outboxCount('DEAD') > 0) return 'error';
  if (outboxCount('PENDING') + outboxCount('PUBLISHING') > 0) return 'warning';
  return 'success';
});

// 卡片值只反映后端配置和健康检查，不在前端推断 ES/MQ 的真实连接信息。
const statusCards = computed(() => [
  {
    key: 'writer',
    label: '业务事件写入',
    value: overview.value?.outboxWriteEnabled ? '运行中' : '未开启',
    tag: overview.value?.outboxWriteEnabled ? 'ON' : 'OFF',
    tagType: (overview.value?.outboxWriteEnabled ? 'success' : 'info') as TagType,
    note: `待发布 ${outboxCount('PENDING')} 条`
  },
  {
    key: 'publisher',
    label: '独立 MQ 发布',
    value: overview.value?.outboxPublisherEnabled ? '运行中' : '未开启',
    tag: overview.value?.outboxPublisherEnabled ? 'ON' : 'OFF',
    tagType: (overview.value?.outboxPublisherEnabled ? 'success' : 'info') as TagType,
    note: `发布中 ${outboxCount('PUBLISHING')} 条`
  },
  {
    key: 'service',
    label: '独立推荐服务',
    value: overview.value?.recommendationReachable ? '可访问' : '不可访问',
    tag: overview.value?.recommendationStatus || '-',
    tagType: (overview.value?.recommendationReachable ? 'success' : 'danger') as TagType,
    note: `健康检查 ${overview.value?.healthTookMillis || 0} ms`
  },
  {
    key: 'outbox',
    label: '已完成事件',
    value: `${outboxCount('PUBLISHED')} 条`,
    tag: outboxCount('DEAD') > 0 ? `死信 ${outboxCount('DEAD')}` : '无死信',
    tagType: (outboxCount('DEAD') > 0 ? 'danger' : 'success') as TagType,
    note: overview.value?.latestPublishedAt ? `最近 ${overview.value.latestPublishedAt}` : '暂无发布记录'
  }
]);

function outboxCount(status: OutboxStatus) {
  return Number(overview.value?.outboxCounts?.[status] || 0);
}

async function loadOverview() {
  overviewLoading.value = true;
  try {
    const response: any = await getRecommendationDiagnosticsOverview();
    overview.value = response.data;
  } finally {
    overviewLoading.value = false;
  }
}

async function loadOutbox() {
  if (!overview.value?.diagnosticsEnabled) {
    outboxRows.value = [];
    total.value = 0;
    return;
  }
  tableLoading.value = true;
  try {
    const response: any = await listRecommendationOutbox(query);
    outboxRows.value = response.rows || [];
    total.value = Number(response.total || 0);
  } finally {
    tableLoading.value = false;
  }
}

async function refreshAll() {
  await loadOverview();
  await loadOutbox();
}

function handleQuery() {
  query.pageNum = 1;
  loadOutbox();
}

function resetQuery() {
  queryFormRef.value?.resetFields();
  query.status = '';
  query.entityType = '';
  query.eventType = '';
  query.entityId = undefined;
  query.pageNum = 1;
  loadOutbox();
}

async function runTest() {
  const valid = await testFormRef.value?.validate().catch(() => false);
  if (!valid || !canRunTest.value) return;
  testLoading.value = true;
  testResult.value = undefined;
  try {
    const response: any = await runRecommendationSearchTest(testForm);
    testResult.value = response.data;
    if (testResult.value?.success) {
      ElMessage.success('向量检索完成');
    }
  } finally {
    testLoading.value = false;
  }
}

function entityTypeLabel(value: string) {
  return value === 'CANDIDATE' ? '求职者' : value === 'JOB' ? '岗位' : value || '-';
}

function eventTypeLabel(value: string) {
  return value === 'VECTOR_UPSERT' ? '新增或更新' : value === 'VECTOR_DELETE' ? '删除' : value || '-';
}

function outboxStatusLabel(value: string) {
  return ({ PENDING: '待发布', PUBLISHING: '发布中', PUBLISHED: '已发布', DEAD: '死信' } as Record<string, string>)[value] || value || '-';
}

function outboxStatusType(value: string): TagType {
  return ({ PENDING: 'warning', PUBLISHING: 'primary', PUBLISHED: 'success', DEAD: 'danger' } as Record<string, TagType>)[value] || 'info';
}

function resultStatusLabel(value: string) {
  const labels: Record<string, string> = {
    SUCCESS: '成功',
    VECTOR_NOT_READY: '源向量未就绪',
    DEPENDENCY_UNAVAILABLE: '依赖不可用',
    AUTH_ERROR: '内部认证失败',
    UNREACHABLE: '服务不可达',
    TEST_DISABLED: '测试未开启',
    SOURCE_NOT_FOUND: '业务编号不存在',
    BUSY: '测试繁忙'
  };
  return labels[value] || value || '-';
}

onMounted(refreshAll);
</script>

<style scoped>
.diagnostics-page {
  min-height: calc(100vh - 84px);
  background: #f5f7fa;
}

.hero-card {
  border: 0;
  background: linear-gradient(120deg, #173b6c 0%, #2563a9 58%, #2f7fc1 100%);
  color: #fff;
}

.hero-content,
.card-header,
.status-main,
.object-cell,
.test-actions,
.count-tags {
  display: flex;
  align-items: center;
}

.hero-content,
.card-header {
  justify-content: space-between;
  gap: 16px;
}

.hero-title {
  font-size: 22px;
  font-weight: 600;
  letter-spacing: 1px;
}

.hero-subtitle {
  margin-top: 8px;
  color: rgb(255 255 255 / 78%);
}

.status-card {
  min-height: 142px;
  margin-bottom: 16px;
}

.status-label,
.section-note,
.status-note,
.test-hint {
  color: #909399;
}

.status-main {
  justify-content: space-between;
  margin: 14px 0 12px;
}

.status-value {
  color: #303133;
  font-size: 24px;
  font-weight: 600;
}

.status-note,
.section-note,
.test-hint {
  font-size: 13px;
}

.section-title {
  color: #303133;
  font-size: 17px;
  font-weight: 600;
}

.section-note {
  margin-top: 5px;
}

.filter-collapse {
  margin: 0 0 18px 112px;
}

.test-actions {
  margin-left: 112px;
  gap: 14px;
}

.test-result {
  margin-top: 22px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.count-tags,
.object-cell {
  gap: 8px;
}

@media (max-width: 768px) {
  .hero-content,
  .card-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .filter-collapse,
  .test-actions {
    margin-left: 0;
  }
}
</style>
