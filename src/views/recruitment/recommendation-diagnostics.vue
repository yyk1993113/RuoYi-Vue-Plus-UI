<!--
  推荐链路诊断页：只读查看当前租户的 Outbox、行为记忆与独立推荐服务状态，并受控执行单条 KNN 查询。
  页面只调用管理后端；ES/MQ 地址及内部令牌不会暴露给浏览器，也不会自动轮询或重发事件。
-->
<template>
  <div class="diagnostics-page p-4">
    <el-card shadow="never" class="hero-card mb-4">
      <div class="hero-content">
        <div>
          <div class="hero-title">推荐链路诊断</div>
          <div class="hero-subtitle">观察“业务变更/用户行为 → Outbox → 独立 MQ → 推荐服务 → 记忆与向量检索”的运行状态</div>
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
          <el-table-column :label="targetCodeLabel" prop="entityCode" min-width="190" align="center">
            <template #default="{ row }">{{ row.entityCode || '-' }}</template>
          </el-table-column>
          <el-table-column v-if="testResult.direction === 'CANDIDATE_TO_JOB'" label="岗位名称" prop="entityName" min-width="180">
            <template #default="{ row }">{{ row.entityName || '-' }}</template>
          </el-table-column>
          <el-table-column :label="targetIdLabel" prop="entityId" min-width="160" align="center" />
          <el-table-column label="相似度分数" min-width="160" align="center">
            <template #default="{ row }">{{ Number(row.score).toFixed(6) }}</template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <el-card shadow="hover" class="mb-4">
      <template #header>
        <div class="card-header">
          <div>
            <div class="section-title">行为记忆检查</div>
            <div class="section-note">输入业务编号查看记忆是否生成；只读元数据，不展示或修改向量内容</div>
          </div>
          <el-tag type="info" effect="plain">只读检查</el-tag>
        </div>
      </template>

      <el-form ref="memoryFormRef" :model="memoryForm" :rules="memoryRules" label-width="112px">
        <el-row :gutter="18">
          <el-col :xs="24" :lg="10">
            <el-form-item label="检查对象" prop="direction">
              <el-radio-group v-model="memoryForm.direction">
                <el-radio-button value="CANDIDATE_TO_JOB">求职者记忆</el-radio-button>
                <el-radio-button value="JOB_TO_CANDIDATE">岗位记忆</el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :lg="7">
            <el-form-item :label="memoryCodeLabel" prop="sourceCode">
              <el-input v-model="memoryForm.sourceCode" clearable maxlength="32" :placeholder="memoryCodePlaceholder" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :lg="7">
            <div class="memory-action">
              <el-button type="primary" icon="Search" :loading="memoryLoading" :disabled="!canCheckMemory" @click="checkMemory">
                查看记忆状态
              </el-button>
              <span class="test-hint">{{ memoryHint }}</span>
            </div>
          </el-col>
        </el-row>
      </el-form>

      <div v-if="memoryResult" class="test-result">
        <el-alert :title="memoryResult.message" :type="memoryResultType" :closable="false" show-icon />
        <el-descriptions :column="4" border class="mt-3">
          <el-descriptions-item label="记忆功能">
            <el-tag :type="memoryResult.memoryEnabled ? 'success' : 'info'">
              {{ memoryResult.memoryEnabled ? '已开启' : '未开启' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="记忆状态">
            <el-tag :type="memoryResult.present ? 'success' : 'warning'">
              {{ memoryResult.present ? '已生成' : '暂无记忆' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="有效行为次数">{{ memoryResult.eventCount || 0 }}</el-descriptions-item>
          <el-descriptions-item label="记忆可信度">{{ formatConfidence(memoryResult.confidence) }}</el-descriptions-item>
          <el-descriptions-item label="最近行为时间">{{ memoryResult.observedAt || '-' }}</el-descriptions-item>
          <el-descriptions-item label="记忆版本">{{ memoryResult.entityVersion || '-' }}</el-descriptions-item>
          <el-descriptions-item label="模型版本">{{ memoryResult.modelVersion || '-' }}</el-descriptions-item>
          <el-descriptions-item label="结构版本">{{ memoryResult.schemaVersion || '-' }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-card>

    <el-card v-if="canManageOffline" shadow="hover" class="mb-4">
      <template #header>
        <div class="card-header">
          <div>
            <div class="section-title">离线批量刷新</div>
            <div class="section-note">小批量刷新存量向量，支持暂停、恢复和断点续跑</div>
          </div>
          <el-button icon="Refresh" :loading="taskLoading" @click="loadRefreshTasks">刷新任务</el-button>
        </div>
      </template>
      <el-alert
        :title="overview?.offlineRolloutReady ? '离线链路配置已就绪，可以创建小批量灰度任务。' : '离线链路尚未就绪，请先处理下方阻断项。'"
        :type="overview?.offlineRolloutReady ? 'success' : 'warning'"
        :closable="false"
        show-icon
        class="mb-3"
      />
      <el-descriptions :column="3" border class="mb-3">
        <el-descriptions-item v-for="item in offlineReadinessItems" :key="item.key" :label="item.label">
          <el-tag :type="item.ready ? 'success' : 'info'">{{ item.ready ? '已就绪' : '未就绪' }}</el-tag>
          <span v-if="item.note" class="readiness-note">{{ item.note }}</span>
        </el-descriptions-item>
      </el-descriptions>
      <div v-if="offlineBlockerLabels.length" class="blocker-list mb-3">
        <span class="section-note">当前阻断：</span>
        <el-tag v-for="label in offlineBlockerLabels" :key="label" type="warning" effect="plain">{{ label }}</el-tag>
      </div>
      <el-alert
        title="这里检查的是安全配置是否齐全；真实 MQ、模型和 ES 吞吐仍需通过小批量灰度任务验收。"
        type="info"
        :closable="false"
        show-icon
        class="mb-3"
      />
      <el-form ref="refreshFormRef" :model="refreshForm" :rules="refreshRules" :inline="true">
        <el-form-item label="刷新对象" prop="entityType">
          <el-select v-model="refreshForm.entityType" style="width: 120px">
            <el-option label="求职者" value="CANDIDATE" />
            <el-option label="岗位" value="JOB" />
          </el-select>
        </el-form-item>
        <el-form-item label="刷新方式" prop="refreshMode">
          <el-select v-model="refreshForm.refreshMode" style="width: 120px">
            <el-option label="增量刷新" value="INCREMENTAL" />
            <el-option label="全量刷新" value="FULL" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="refreshForm.refreshMode === 'INCREMENTAL'" label="变更时间" prop="changedAfter">
          <el-date-picker v-model="refreshForm.changedAfter" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" placeholder="从何时开始" />
        </el-form-item>
        <el-form-item label="单批数量" prop="batchSize">
          <el-input-number v-model="refreshForm.batchSize" :min="1" :max="200" controls-position="right" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="taskCreating" :disabled="!canCreateRefreshTask" @click="createRefreshTask">创建任务</el-button>
        </el-form-item>
      </el-form>
      <el-table v-loading="taskLoading" :data="refreshTasks" border stripe>
        <el-table-column label="任务" prop="taskId" width="100" align="center" />
        <el-table-column label="对象" width="90" align="center"
          ><template #default="{ row }">{{ entityTypeLabel(row.entityType) }}</template></el-table-column
        >
        <el-table-column label="方式" width="90" align="center"
          ><template #default="{ row }">{{ row.refreshMode === 'FULL' ? '全量' : '增量' }}</template></el-table-column
        >
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }"
            ><el-tag :type="refreshTaskStatusType(row.status)">{{ refreshTaskStatusLabel(row.status) }}</el-tag></template
          >
        </el-table-column>
        <el-table-column label="已入队" prop="enqueuedCount" width="100" align="center" />
        <el-table-column label="当前游标" prop="cursorId" min-width="150" align="center" />
        <el-table-column label="失败次数" prop="attemptCount" width="100" align="center" />
        <el-table-column label="创建时间" prop="createTime" width="170" align="center" />
        <el-table-column label="错误摘要" min-width="180" show-overflow-tooltip
          ><template #default="{ row }">{{ row.lastError || '-' }}</template></el-table-column
        >
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="{ row }">
            <el-button v-if="['PENDING', 'RUNNING'].includes(row.status)" link type="warning" @click="changeRefreshTask(row, 'pause')"
              >暂停</el-button
            >
            <el-button v-if="row.status === 'PAUSED'" link type="primary" @click="changeRefreshTask(row, 'resume')">恢复</el-button>
            <el-button v-if="['PENDING', 'RUNNING', 'PAUSED'].includes(row.status)" link type="danger" @click="changeRefreshTask(row, 'cancel')"
              >取消</el-button
            >
          </template>
        </el-table-column>
      </el-table>
      <pagination
        v-show="refreshTaskTotal > 0"
        v-model:page="refreshTaskQuery.pageNum"
        v-model:limit="refreshTaskQuery.pageSize"
        :total="refreshTaskTotal"
        @pagination="loadRefreshTasks"
      />
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
import { ElMessage, ElMessageBox } from 'element-plus';
import { useUserStore } from '@/store/modules/user';
import {
  cancelRecommendationRefreshTask,
  createRecommendationRefreshTask,
  getRecommendationMemoryStatus,
  getRecommendationDiagnosticsOverview,
  listRecommendationOutbox,
  listRecommendationRefreshTasks,
  pauseRecommendationRefreshTask,
  resumeRecommendationRefreshTask,
  runRecommendationSearchTest,
  type OutboxStatus,
  type RecommendationDirection,
  type RecommendationDiagnosticsOverview,
  type RecommendationMemoryStatusRequest,
  type RecommendationMemoryStatusResult,
  type RecommendationRefreshTaskRequest,
  type RecommendationRefreshTaskRow,
  type RecommendationRefreshTaskStatus,
  type RecommendationOutboxQuery,
  type RecommendationOutboxRow,
  type RecommendationSearchTestRequest,
  type RecommendationSearchTestResult
} from '@/api/recruitment/recommendationDiagnostics';

type TagType = TagProps['type'];

const overviewLoading = ref(false);
const tableLoading = ref(false);
const testLoading = ref(false);
const memoryLoading = ref(false);
const taskLoading = ref(false);
const taskCreating = ref(false);
const overview = ref<RecommendationDiagnosticsOverview>();
const outboxRows = ref<RecommendationOutboxRow[]>([]);
const total = ref(0);
const testResult = ref<RecommendationSearchTestResult>();
const memoryResult = ref<RecommendationMemoryStatusResult>();
const testFormRef = ref<FormInstance>();
const memoryFormRef = ref<FormInstance>();
const refreshFormRef = ref<FormInstance>();
const queryFormRef = ref<FormInstance>();
const userStore = useUserStore();

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

const memoryForm = reactive<RecommendationMemoryStatusRequest>({
  direction: 'CANDIDATE_TO_JOB',
  sourceCode: ''
});

const refreshForm = reactive<RecommendationRefreshTaskRequest>({
  entityType: 'CANDIDATE',
  refreshMode: 'INCREMENTAL',
  changedAfter: '',
  batchSize: 50
});
const refreshTasks = ref<RecommendationRefreshTaskRow[]>([]);
const refreshTaskTotal = ref(0);
const refreshTaskQuery = reactive({ pageNum: 1, pageSize: 10 });

const testRules: FormRules = {
  direction: [{ required: true, message: '请选择检索方向', trigger: 'change' }],
  sourceCode: [{ required: true, message: '请输入业务编号', trigger: 'blur' }],
  k: [{ required: true, message: '请输入返回数量', trigger: 'blur' }]
};

const memoryRules: FormRules = {
  direction: [{ required: true, message: '请选择检查对象', trigger: 'change' }],
  sourceCode: [{ required: true, message: '请输入业务编号', trigger: 'blur' }]
};

const refreshRules: FormRules = {
  changedAfter: [
    {
      validator: (_rule, value, callback) => {
        if (refreshForm.refreshMode === 'INCREMENTAL' && !value) callback(new Error('请选择增量起始时间'));
        else callback();
      },
      trigger: 'change'
    }
  ]
};

const sourceCodeLabel = computed(() => (testForm.direction === 'CANDIDATE_TO_JOB' ? '求职者编号' : '岗位编号'));
const sourceCodePlaceholder = computed(() => (testForm.direction === 'CANDIDATE_TO_JOB' ? '如 SKR-...' : '如 JOB-...'));
// 结果列以实际返回方向为准，避免检索完成后切换单选项导致旧结果标题错位。
const resultDirection = computed(() => testResult.value?.direction || testForm.direction);
const targetCodeLabel = computed(() => (resultDirection.value === 'CANDIDATE_TO_JOB' ? '岗位编号' : '求职者编号'));
const targetIdLabel = computed(() => (resultDirection.value === 'CANDIDATE_TO_JOB' ? '岗位 ID' : '求职者用户 ID'));
const memoryCodeLabel = computed(() => (memoryForm.direction === 'CANDIDATE_TO_JOB' ? '求职者编号' : '岗位编号'));
const memoryCodePlaceholder = computed(() => (memoryForm.direction === 'CANDIDATE_TO_JOB' ? '如 SKR-...' : '如 JOB-...'));
const canRunTest = computed(
  () => Boolean(overview.value?.diagnosticsEnabled && overview.value?.testEnabled && overview.value?.recommendationReachable) && !testLoading.value
);
const canCheckMemory = computed(() => Boolean(overview.value?.diagnosticsEnabled && overview.value?.recommendationReachable) && !memoryLoading.value);
const canManageOffline = computed(
  () => userStore.permissions.includes('*:*:*') || userStore.permissions.includes('recruitment:recommendation:offline-refresh')
);
const canCreateRefreshTask = computed(() => Boolean(overview.value?.offlineRolloutReady) && !taskCreating.value);

// 灰度检查完全使用后端返回的非敏感状态，浏览器不推断也不接触 MQ、ES 或内部令牌配置。
const offlineReadinessItems = computed(() => [
  { key: 'writer', label: '业务事件写入', ready: Boolean(overview.value?.outboxWriteEnabled), note: '' },
  { key: 'publisher', label: '独立 MQ 发布', ready: Boolean(overview.value?.outboxPublisherEnabled), note: '' },
  { key: 'refresh', label: '离线任务执行', ready: Boolean(overview.value?.offlineRefreshEnabled), note: '' },
  {
    key: 'consumer',
    label: '离线消费者',
    ready: Boolean(overview.value?.offlineConsumerEnabled),
    note: overview.value?.offlineBatchSize ? `每批 ${overview.value.offlineBatchSize} 条` : ''
  },
  {
    key: 'topic',
    label: 'Topic 隔离',
    ready: Boolean(overview.value?.offlineTopicIsolated),
    note: ''
  },
  {
    key: 'service',
    label: '推荐服务检查',
    ready: Boolean(overview.value?.offlineReadinessReachable && overview.value?.offlineConfigurationReady),
    note: overview.value?.offlineThreadMaxSize ? `最多 ${overview.value.offlineThreadMaxSize} 个离线线程` : ''
  }
]);

const blockerText: Record<string, string> = {
  DIAGNOSTICS_DISABLED: '诊断功能未开启',
  READINESS_UNREACHABLE: '推荐服务检查接口不可达',
  READINESS_HTTP_401: '内部令牌不一致',
  READINESS_HTTP_403: '内部账号无权执行就绪检查',
  READINESS_HTTP_404: '推荐服务版本尚未提供就绪检查',
  READINESS_HTTP_503: '推荐服务就绪检查暂不可用',
  MODEL_DISABLED: '模型推理未开启',
  OFFLINE_CONSUMER_DISABLED: '离线消费者未开启',
  BUSINESS_SNAPSHOT_AUTH_MISSING: '业务快照令牌未配置',
  OFFLINE_TOPIC_NOT_ISOLATED: '离线 Topic 未隔离',
  OUTBOX_WRITER_DISABLED: '业务事件写入未开启',
  OUTBOX_PUBLISHER_DISABLED: 'Outbox 发布器未开启',
  OFFLINE_REFRESH_DISABLED: '离线刷新任务未开启'
};
const offlineBlockerLabels = computed(() => (overview.value?.offlineBlockers || []).map((code) => blockerText[code] || code));
const testHint = computed(() => {
  if (!overview.value?.diagnosticsEnabled) return '请先开启诊断功能';
  if (!overview.value?.testEnabled) return '当前仅开放只读监控，手动测试尚未开启';
  if (!overview.value?.recommendationReachable) return '独立推荐服务不可达，请先检查服务状态';
  return '最多同时执行少量测试，请勿用于压测';
});
const memoryHint = computed(() => {
  if (!overview.value?.diagnosticsEnabled) return '请先开启诊断功能';
  if (!overview.value?.recommendationReachable) return '独立推荐服务不可达';
  return '完成一次浏览、收藏或投递后再检查';
});
const memoryResultType = computed<'success' | 'warning' | 'error' | 'info'>(() => {
  if (!memoryResult.value?.success) return 'error';
  if (!memoryResult.value.memoryEnabled) return 'info';
  return memoryResult.value.present ? 'success' : 'warning';
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
  await Promise.all([loadOutbox(), canManageOffline.value ? loadRefreshTasks() : Promise.resolve()]);
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

// 诊断只查询当前租户的记忆元数据，业务编号解析和租户隔离均由管理后端完成。
async function checkMemory() {
  const valid = await memoryFormRef.value?.validate().catch(() => false);
  if (!valid || !canCheckMemory.value) return;
  memoryLoading.value = true;
  memoryResult.value = undefined;
  try {
    const response: any = await getRecommendationMemoryStatus(memoryForm);
    memoryResult.value = response.data;
    if (memoryResult.value?.success && memoryResult.value.present) {
      ElMessage.success('已查询到行为记忆');
    }
  } finally {
    memoryLoading.value = false;
  }
}

// 离线任务只通过受权限保护的管理接口控制，页面不自动轮询，避免产生额外后台压力。
async function loadRefreshTasks() {
  if (!canManageOffline.value) return;
  taskLoading.value = true;
  try {
    const response: any = await listRecommendationRefreshTasks(refreshTaskQuery);
    refreshTasks.value = response.rows || [];
    refreshTaskTotal.value = Number(response.total || 0);
  } finally {
    taskLoading.value = false;
  }
}

async function createRefreshTask() {
  const valid = await refreshFormRef.value?.validate().catch(() => false);
  if (!valid || !canCreateRefreshTask.value) return;
  taskCreating.value = true;
  try {
    const payload: RecommendationRefreshTaskRequest = { ...refreshForm };
    if (payload.refreshMode === 'FULL') payload.changedAfter = undefined;
    await createRecommendationRefreshTask(payload);
    ElMessage.success('离线刷新任务已创建');
    refreshTaskQuery.pageNum = 1;
    await loadRefreshTasks();
  } finally {
    taskCreating.value = false;
  }
}

async function changeRefreshTask(row: RecommendationRefreshTaskRow, action: 'pause' | 'resume' | 'cancel') {
  if (action === 'cancel') {
    await ElMessageBox.confirm('取消后不能恢复；已经进入 Outbox 的数据仍会安全处理。确定取消吗？', '取消离线刷新', { type: 'warning' });
  }
  const actions = {
    pause: pauseRecommendationRefreshTask,
    resume: resumeRecommendationRefreshTask,
    cancel: cancelRecommendationRefreshTask
  };
  await actions[action](row.taskId);
  ElMessage.success(action === 'pause' ? '任务已暂停' : action === 'resume' ? '任务已恢复' : '任务已取消');
  await loadRefreshTasks();
}

function formatConfidence(value: number) {
  const safeValue = Number.isFinite(Number(value)) ? Math.min(1, Math.max(0, Number(value))) : 0;
  return `${(safeValue * 100).toFixed(0)}%`;
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

function refreshTaskStatusLabel(value: RecommendationRefreshTaskStatus) {
  const labels: Record<RecommendationRefreshTaskStatus, string> = {
    PENDING: '等待中',
    RUNNING: '运行中',
    PAUSED: '已暂停',
    COMPLETED: '入队完成',
    FAILED: '失败',
    CANCELLED: '已取消'
  };
  return labels[value];
}

function refreshTaskStatusType(value: RecommendationRefreshTaskStatus): TagType {
  const types: Record<RecommendationRefreshTaskStatus, TagType> = {
    PENDING: 'info',
    RUNNING: 'primary',
    PAUSED: 'warning',
    COMPLETED: 'success',
    FAILED: 'danger',
    CANCELLED: 'info'
  };
  return types[value];
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

.memory-action {
  display: flex;
  min-height: 32px;
  align-items: center;
  gap: 12px;
}

.test-result {
  margin-top: 22px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.count-tags,
.object-cell,
.blocker-list {
  gap: 8px;
}

.blocker-list {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.readiness-note {
  margin-left: 8px;
  color: #909399;
  font-size: 12px;
}

@media (max-width: 768px) {
  .hero-content,
  .card-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .filter-collapse,
  .test-actions,
  .memory-action {
    margin-left: 0;
  }

  .memory-action {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
