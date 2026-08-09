<template>
  <div class="p-4">
    <!-- 财税中心只负责同步；本页面负责招聘后台的本地查看与审核。 -->
    <el-card shadow="never" class="mb-4">
      <el-form :model="queryParams" :inline="true">
        <el-form-item label="来源任务号">
          <el-input v-model="queryParams.sourceTaskNo" clearable placeholder="请输入来源任务号" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="任务名称">
          <el-input v-model="queryParams.taskName" clearable placeholder="请输入任务名称" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="任务类型">
          <el-input v-model="queryParams.taskType" clearable placeholder="请输入任务类型" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="审核状态">
          <el-select v-model="queryParams.reviewStatus" clearable placeholder="全部" style="width: 150px">
            <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <el-table v-loading="loading" :data="tableData" border stripe>
        <el-table-column label="来源任务号" prop="sourceTaskNo" min-width="180" show-overflow-tooltip />
        <el-table-column label="任务名称" prop="taskName" min-width="180" show-overflow-tooltip />
        <el-table-column label="任务类型" width="130">
          <template #default="{ row }">{{ taskTypeLabel(row.taskType) }}</template>
        </el-table-column>
        <el-table-column label="工作地点" prop="workAddress" min-width="160" show-overflow-tooltip />
        <el-table-column label="招聘人数" prop="recruitRequired" width="90" align="center" />
        <el-table-column label="预算" width="130" align="right">
          <template #default="{ row }">{{ formatAmount(row.budgetAmount, row.currency) }}</template>
        </el-table-column>
        <el-table-column label="审核状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="statusMeta(row.reviewStatus).type">{{ statusMeta(row.reviewStatus).label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="任务状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="taskStatusMeta(row.taskStatus, row.reviewStatus).type">{{ taskStatusMeta(row.taskStatus, row.reviewStatus).label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="同步时间" prop="createTime" width="180" />
        <el-table-column label="操作" width="190" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" icon="View" @click="handleDetail(row)">详情</el-button>
            <el-button
              v-if="row.reviewStatus === 'PENDING_REVIEW'"
              v-hasPermi="['recruitment:financeTask:audit']"
              link
              type="warning"
              icon="EditPen"
              @click="openAudit(row)"
              >审核</el-button
            >
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="loadData" />
    </el-card>

    <el-dialog v-model="detailVisible" title="财税任务详情" width="1120px" class="finance-task-detail-dialog" append-to-body>
      <div v-loading="detailLoading">
        <template v-if="currentTask">
          <el-tabs v-model="detailTab" class="finance-task-detail-tabs">
            <el-tab-pane label="任务描述" name="info">
              <div class="detail-tab-pane task-detail-info-pane">
                <div class="task-detail-summary">
                  <div class="task-detail-summary-item"><div class="il">任务编号</div><div class="iv num">{{ currentTask.sourceTaskNo || '-' }}</div></div>
                  <div class="task-detail-summary-item"><div class="il">任务类型</div><div class="iv">{{ taskTypeLabel(currentTask.taskType) }}</div></div>
                  <div class="task-detail-summary-item"><div class="il">任务状态</div><div class="iv">
                  <el-tag :type="taskStatusMeta(currentTask.taskStatus, currentTask.reviewStatus).type">{{ taskStatusMeta(currentTask.taskStatus, currentTask.reviewStatus).label }}</el-tag>
                  </div></div>
                  <div class="task-detail-summary-item"><div class="il">开始时间</div><div class="iv">{{ formatTaskDateTime(currentTask.workStartAt) }}</div></div>
                  <div class="task-detail-summary-item"><div class="il">结束时间</div><div class="iv">{{ formatTaskDateTime(currentTask.workEndAt) }}</div></div>
                  <div class="task-detail-summary-item"><div class="il">关联甲方</div><div class="iv">{{ sourceDetail.tenantName || currentTask.tenantId || '-' }}</div></div>
                </div>
                <div class="task-detail-description-section">
                  <div class="task-detail-section-head"><strong>任务描述</strong></div>
                  <div class="task-detail-description task-description-section-list">
                    <div><strong>任务概述：</strong>{{ currentDescriptionSections.overview }}</div>
                    <div><strong>工作内容：</strong><span>{{ currentDescriptionSections.content }}</span></div>
                    <div><strong>工作要求：</strong><span>{{ currentDescriptionSections.requirements }}</span></div>
                    <div><strong>交付标准：</strong><span>{{ currentDescriptionSections.deliveryStandard }}</span></div>
                  </div>
                </div>
              </div>
            </el-tab-pane>

            <el-tab-pane label="结算规则" name="settlement">
              <div class="detail-tab-pane">
                <div class="settlement-detail-panel">
                  <div class="settlement-detail-title">结算规则</div>
                  <div class="settlement-detail-grid">
                    <div class="settlement-detail-item"><div class="il">计费方式</div><div class="iv">{{ currentSettlementRule.pricingMode }}</div></div>
                    <div class="settlement-detail-item"><div class="il">计费单价 / 阶梯</div><div class="iv settlement-rule-value">{{ currentSettlementRule.priceRule }}</div></div>
                    <div class="settlement-detail-item"><div class="il">薪资单位</div><div class="iv">{{ currentSettlementRule.salaryUnit }}</div></div>
                    <div class="settlement-detail-item"><div class="il">结算周期</div><div class="iv">{{ currentSettlementRule.settlementCycle }}</div></div>
                  </div>
                </div>
                <div class="settlement-condition-card">
                  <div class="il">结算条件说明</div>
                  <div class="settlement-condition-text">{{ currentSettlementRule.settlementCondition }}</div>
                </div>
              </div>
            </el-tab-pane>

            <el-tab-pane name="participants">
              <template #label>
                <span class="detail-tab-label">参与人员<em>{{ detailParticipants.length }}</em></span>
              </template>
              <div class="detail-tab-pane" v-loading="sourceDetailLoading">
                <div class="participant-head">
                  <div>
                    <div class="detail-section-title">参与人员</div>
                    <div class="participant-sub">已关联 {{ detailParticipants.length }} / {{ currentTask.recruitRequired ?? 0 }} 人；零工状态来自财税中心员工 / 零工管理</div>
                  </div>
                </div>
                <div v-if="detailParticipants.length" class="participant-grid">
                  <div v-for="worker in detailParticipants" :key="worker.id" class="participant-card">
                    <div class="worker-avatar">{{ worker.name?.slice(0, 1) || '人' }}</div>
                    <div class="participant-main">
                      <div class="participant-name">{{ worker.name || '-' }}<span class="participant-current">当前任务</span></div>
                      <div class="participant-meta">{{ worker.gigWorkerNo || '-' }} · {{ worker.phone || '-' }}</div>
                      <div class="participant-tags">
                        <el-tag size="small" :type="signStatusMeta(worker.signStatus).type">{{ signStatusMeta(worker.signStatus).label }}</el-tag>
                        <el-tag size="small" :type="realNameStatusMeta(worker.realNameStatus).type">{{ realNameStatusMeta(worker.realNameStatus).label }}</el-tag>
                        <el-tag size="small" :type="accountStatusMeta(worker.accountStatus).type">{{ accountStatusMeta(worker.accountStatus).label }}</el-tag>
                      </div>
                    </div>
                  </div>
                </div>
                <el-empty v-else description="当前没有已关联的零工人员" />
              </div>
            </el-tab-pane>

            <el-tab-pane name="deliverables">
              <template #label>
                <span class="detail-tab-label">交付物证明<em v-if="missingDeliverables.length" class="is-warning">待补</em></span>
              </template>
              <div class="detail-tab-pane" v-loading="sourceDetailLoading">
                <div class="deliverable-head">
                  <div>
                    <div class="detail-section-title">已上传交付物（{{ detailDeliverables.length }} 份）</div>
                    <div class="deliverable-support">支持图片 / 表格 / PDF，每类均可上传多个附件</div>
                  </div>
                  <el-tag :type="missingDeliverables.length ? 'warning' : 'success'">
                    {{ missingDeliverables.length ? `待补 ${missingDeliverables.length} 类` : '必传材料已齐全' }}
                  </el-tag>
                </div>
                <div class="deliverable-grid">
                  <section
                    v-for="group in deliverableGroups"
                    :key="group.key"
                    class="deliverable-card"
                    :class="{ 'is-missing': group.required && !filesForCategory(group.key).length }"
                  >
                    <div class="deliverable-card-head">
                      <div class="deliverable-title"><span>{{ group.icon }}</span>{{ group.label }}<em v-if="group.required">必传</em></div>
                      <el-tag size="small" :type="filesForCategory(group.key).length ? 'success' : group.required ? 'warning' : 'info'">
                        {{ filesForCategory(group.key).length ? `已上传 ${filesForCategory(group.key).length} 份` : group.required ? '待上传' : '可选' }}
                      </el-tag>
                    </div>
                    <ul v-if="filesForCategory(group.key).length" class="deliverable-files">
                      <li v-for="file in filesForCategory(group.key)" :key="file.id">
                        <el-button link type="primary" @click="handleDownloadDeliverable(file)">· {{ file.fileName }}</el-button>
                      </li>
                    </ul>
                    <div v-else class="deliverable-empty">暂无附件</div>
                  </section>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </template>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button
          v-if="currentTask?.reviewStatus === 'PENDING_REVIEW'"
          v-hasPermi="['recruitment:financeTask:audit']"
          type="primary"
          @click="currentTask && openAudit(currentTask)"
          >去审核</el-button
        >
      </template>
    </el-dialog>

    <el-dialog v-model="auditVisible" title="审核财税任务" width="500px" append-to-body>
      <el-form ref="auditFormRef" :model="auditForm" :rules="auditRules" label-width="90px">
        <el-form-item label="审核结果" prop="status">
          <el-radio-group v-model="auditForm.status">
            <el-radio label="APPROVED">通过</el-radio>
            <el-radio label="REJECTED">驳回</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审核意见" prop="remark">
          <el-input v-model="auditForm.remark" type="textarea" :rows="4" maxlength="500" show-word-limit placeholder="驳回时必填" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitAudit">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import {
  auditFinanceTaskReview,
  downloadFinanceTaskDeliverable,
  getFinanceTaskReview,
  getFinanceTaskSourceDetail,
  listFinanceTaskReview,
  type FinanceTaskAuditForm,
  type FinanceTaskDeliverableCategory,
  type FinanceTaskDeliverableVO,
  type FinanceTaskReviewVO,
  type FinanceTaskSourceDetailVO
} from '@/api/recruitment';
import { unwrapList } from './helpers';

const loading = ref(false);
const detailLoading = ref(false);
const sourceDetailLoading = ref(false);
const submitting = ref(false);
const total = ref(0);
const tableData = ref<FinanceTaskReviewVO[]>([]);
const currentTask = ref<FinanceTaskReviewVO | null>(null);
const sourceDetail = ref<FinanceTaskSourceDetailVO>({ tenantName: '', participants: [], deliverables: [] });
const detailVisible = ref(false);
const auditVisible = ref(false);
const detailTab = ref('info');
const auditFormRef = ref<FormInstance>();

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  sourceTaskNo: '',
  taskName: '',
  taskType: '',
  reviewStatus: ''
});

const auditForm = reactive<FinanceTaskAuditForm>({
  id: 0,
  expectedVersion: 0,
  status: 'APPROVED',
  remark: ''
});

const statusOptions = [
  { value: 'PENDING_REVIEW', label: '待审核' },
  { value: 'APPROVED', label: '已通过' },
  { value: 'REJECTED', label: '已驳回' },
  { value: 'SUPERSEDED', label: '已被新版本替代' }
];

const taskTypeLabels: Record<string, string> = {
  ACTIVITY: '活动执行',
  COMMISSION: '销售佣金',
  OUTSOURCING: '项目外包',
  DELIVERY: '配送骑手',
  CUSTOMER_SERVICE: '客服外包',
  TECH_PROMOTION: '技术推广'
};

const pricingModeLabels: Record<string, string> = {
  HOURLY: '按工时',
  PIECE: '按计件',
  FIXED: '固定金额',
  MONTHLY: '按月结算',
  COMMISSION: '底薪 + 提成',
  CUSTOM: '自定义'
};

const salaryUnitLabels: Record<string, string> = {
  HOUR: '元/小时',
  DAY: '元/天',
  PIECE: '元/件',
  MONTH: '元/月',
  PROJECT: '元/项目'
};

const settlementCycleLabels: Record<string, string> = {
  DAILY: '每日结算',
  WEEKLY: '每周结算',
  MONTHLY: '按月结算（次月5日前发放）',
  ON_COMPLETION: '完成后结算'
};

const deliverableGroups: Array<{ key: FinanceTaskDeliverableCategory; label: string; icon: string; required: boolean }> = [
  { key: 'ATTENDANCE', label: '考勤记录', icon: '▧', required: true },
  { key: 'RESULT', label: '工作成果', icon: '◉', required: true },
  { key: 'ACCEPTANCE', label: '验收单据', icon: '▣', required: true },
  { key: 'SUPPLEMENT', label: '待补充', icon: '▤', required: false }
];

const auditRules = computed<FormRules>(() => ({
  status: [{ required: true, message: '请选择审核结果', trigger: 'change' }],
  remark: [
    {
      validator: (_rule, value, callback) => {
        if (auditForm.status === 'REJECTED' && !String(value || '').trim()) {
          callback(new Error('驳回时必须填写审核意见'));
          return;
        }
        callback();
      },
      trigger: 'blur'
    }
  ]
}));

const currentDescriptionSections = computed(() => {
  const task = currentTask.value;
  return {
    overview: task?.taskOverview || task?.description || '-',
    content: task?.workContent || '-',
    requirements: task?.workRequirements || '-',
    deliveryStandard: task?.deliveryStandard || '-'
  };
});

const currentSettlementRule = computed(() => {
  const task = currentTask.value;
  const fallback = {
    pricingMode: pricingModeLabel(task?.pricingMode),
    priceRule: task?.pricingRuleJson || '-',
    salaryUnit: salaryUnitLabel(task?.salaryUnit),
    settlementCycle: '-',
    settlementCondition: '-'
  };
  if (!task?.pricingRuleJson) return fallback;

  try {
    const parsed = JSON.parse(task.pricingRuleJson) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object') return fallback;
    const priceRule = parsed.priceRule ?? parsed.pricingRule;
    return {
      pricingMode: typeof parsed.pricingMode === 'string' ? pricingModeLabel(parsed.pricingMode) : fallback.pricingMode,
      priceRule: priceRule == null ? fallback.priceRule : String(priceRule),
      salaryUnit: typeof parsed.salaryUnit === 'string' ? salaryUnitLabel(parsed.salaryUnit) : fallback.salaryUnit,
      settlementCycle: typeof parsed.settlementCycle === 'string' ? settlementCycleLabel(parsed.settlementCycle) : fallback.settlementCycle,
      settlementCondition: parsed.settlementCondition == null ? fallback.settlementCondition : String(parsed.settlementCondition)
    };
  } catch {
    return fallback;
  }
});

const detailParticipants = computed(() => sourceDetail.value.participants || []);
const detailDeliverables = computed(() => sourceDetail.value.deliverables || []);
const missingDeliverables = computed(() => deliverableGroups.filter(group => group.required && !filesForCategory(group.key).length));

function statusMeta(status?: string) {
  const meta: Record<string, { label: string; type: 'warning' | 'success' | 'danger' | 'info' }> = {
    PENDING_REVIEW: { label: '待审核', type: 'warning' },
    APPROVED: { label: '已通过', type: 'success' },
    REJECTED: { label: '已驳回', type: 'danger' },
    SUPERSEDED: { label: '已被替代', type: 'info' }
  };
  return meta[status || ''] || { label: status || '-', type: 'info' as const };
}

function taskStatusMeta(taskStatus?: string, reviewStatus?: string) {
  const inferred = taskStatus || (reviewStatus === 'APPROVED'
    ? 'IN_PROGRESS'
    : reviewStatus === 'REJECTED' ? 'DRAFT' : reviewStatus);
  const meta: Record<string, { label: string; type: 'warning' | 'success' | 'danger' | 'info' }> = {
    DRAFT: { label: '草稿', type: 'info' },
    PENDING_REVIEW: { label: '待审核', type: 'warning' },
    IN_PROGRESS: { label: '进行中', type: 'success' },
    PAUSED: { label: '已暂停', type: 'warning' },
    ENDED: { label: '已结束', type: 'info' }
  };
  return meta[inferred || ''] || { label: inferred || '-', type: 'info' as const };
}

function taskTypeLabel(taskType?: string) {
  if (!taskType) return '-';
  return taskTypeLabels[taskType] || taskType;
}

function pricingModeLabel(pricingMode?: string) {
  if (!pricingMode) return '-';
  return pricingModeLabels[pricingMode] || pricingMode;
}

function salaryUnitLabel(salaryUnit?: string) {
  if (!salaryUnit) return '-';
  return salaryUnitLabels[salaryUnit] || salaryUnit;
}

function settlementCycleLabel(settlementCycle?: string) {
  if (!settlementCycle) return '-';
  return settlementCycleLabels[settlementCycle] || settlementCycle;
}

function filesForCategory(category: FinanceTaskDeliverableCategory) {
  return detailDeliverables.value.filter(file => file.category === category);
}

function signStatusMeta(status?: string) {
  if (status === 'SIGNED') return { label: '已签约', type: 'success' as const };
  return { label: status === 'SIGNING' ? '签约中' : '待签约', type: 'warning' as const };
}

function realNameStatusMeta(status?: string) {
  if (status === 'VERIFIED') return { label: '已实名', type: 'success' as const };
  return { label: status === 'REJECTED' ? '实名失败' : '待实名', type: status === 'REJECTED' ? 'danger' as const : 'warning' as const };
}

function accountStatusMeta(status?: string) {
  if (status === 'ACTIVE') return { label: '正常', type: 'success' as const };
  return { label: status || '未知', type: 'info' as const };
}

function formatTaskDateTime(value?: string) {
  return value ? value.replace('T', ' ').slice(0, 19) : '-';
}

function formatAmount(value?: number | string, currency?: string) {
  if (value === null || value === undefined || value === '') return '-';
  const amount = Number(value);
  if (!Number.isFinite(amount)) return String(value);
  return currency === 'CNY' || !currency ? `¥${amount.toFixed(2)}` : `${currency} ${amount.toFixed(2)}`;
}

async function loadData() {
  loading.value = true;
  try {
    const res = await listFinanceTaskReview(queryParams);
    const list = unwrapList(res);
    tableData.value = list.rows;
    total.value = list.total;
  } finally {
    loading.value = false;
  }
}

function handleQuery() {
  queryParams.pageNum = 1;
  loadData();
}

function resetQuery() {
  queryParams.sourceTaskNo = '';
  queryParams.taskName = '';
  queryParams.taskType = '';
  queryParams.reviewStatus = '';
  handleQuery();
}

async function handleDetail(row: FinanceTaskReviewVO) {
  if (!row.id) return;
  detailVisible.value = true;
  detailTab.value = 'info';
  sourceDetail.value = { tenantName: '', participants: [], deliverables: [] };
  detailLoading.value = true;
  try {
    const res = await getFinanceTaskReview(row.id);
    currentTask.value = (res as any).data || res;
  } finally {
    detailLoading.value = false;
  }

  sourceDetailLoading.value = true;
  try {
    const res = await getFinanceTaskSourceDetail(row.id);
    const data = (res as any).data || res;
    sourceDetail.value = {
      tenantName: data?.tenantName || '',
      participants: Array.isArray(data?.participants) ? data.participants : [],
      deliverables: Array.isArray(data?.deliverables) ? data.deliverables : []
    };
  } catch {
    ElMessage.warning('参与人员和交付物读取失败');
  } finally {
    sourceDetailLoading.value = false;
  }
}

async function handleDownloadDeliverable(file: FinanceTaskDeliverableVO) {
  if (!currentTask.value?.id) return;
  try {
    const response = await downloadFinanceTaskDeliverable(currentTask.value.id, file.id);
    const blob = response instanceof Blob ? response : new Blob([response]);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.fileName;
    link.click();
    URL.revokeObjectURL(url);
  } catch {
    ElMessage.error('交付物下载失败');
  }
}

function openAudit(row: FinanceTaskReviewVO) {
  if (!row.id || row.version === undefined) return;
  auditForm.id = row.id;
  auditForm.expectedVersion = row.version;
  auditForm.status = 'APPROVED';
  auditForm.remark = '';
  auditVisible.value = true;
  detailVisible.value = false;
}

async function submitAudit() {
  if (!(await auditFormRef.value?.validate())) return;
  await ElMessageBox.confirm(`确认${auditForm.status === 'APPROVED' ? '通过' : '驳回'}该财税任务吗？`, '审核确认');
  submitting.value = true;
  try {
    await auditFinanceTaskReview(auditForm);
    ElMessage.success('审核成功');
    auditVisible.value = false;
    await loadData();
  } finally {
    submitting.value = false;
  }
}

loadData();
</script>

<style scoped>
.finance-task-detail-tabs :deep(.el-tabs__header) {
  margin: 0 0 20px;
  border-bottom: 1px solid #dce3ee;
}

.finance-task-detail-tabs :deep(.el-tabs__nav-wrap::after) {
  display: none;
}

.finance-task-detail-tabs :deep(.el-tabs__nav) {
  width: 100%;
}

.finance-task-detail-tabs :deep(.el-tabs__item) {
  flex: 1;
  height: 66px;
  justify-content: center;
  color: #2a3443;
  font-size: 14px;
  font-weight: 600;
}

.finance-task-detail-tabs :deep(.el-tabs__item.is-active) {
  color: #2468f2;
  background: #eef3ff;
}

.finance-task-detail-tabs :deep(.el-tabs__active-bar) {
  height: 3px;
  background: #2468f2;
}

.detail-tab-label {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.detail-tab-label em {
  min-width: 28px;
  padding: 1px 6px;
  border-radius: 8px;
  color: #7d35c3;
  background: #f5edff;
  font-size: 10px;
  font-style: normal;
  line-height: 1.4;
}

.detail-tab-label em.is-warning {
  color: #c76d00;
  background: #fff2dc;
}

.detail-tab-pane {
  min-height: 390px;
  padding: 4px 8px 20px;
}

.task-detail-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 25px 40px;
  padding: 27px 25px 25px;
  border-radius: 14px;
  background: #f7f8fa;
}

.task-detail-summary-item {
  min-width: 0;
}

.task-detail-summary-item .il,
.settlement-detail-item .il,
.settlement-condition-card .il {
  margin-bottom: 5px;
  color: #8793a4;
  font-size: 12px;
}

.task-detail-summary-item .iv {
  overflow: hidden;
  color: #0b1220;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.55;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-detail-description-section {
  margin-top: 24px;
}

.task-detail-section-head {
  margin-bottom: 8px;
  color: #0b1220;
  font-size: 13px;
}

.task-detail-description {
  min-height: 100px;
  padding: 16px;
  border: 1px solid #dce3ee;
  border-radius: 8px;
  color: #4e5969;
  font-size: 13px;
  line-height: 1.8;
}

.task-description-section-list {
  display: grid;
  gap: 16px;
}

.task-description-section-list > div {
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.task-description-section-list strong {
  color: #303b4d;
}

.task-description-section-list span {
  display: block;
  margin-top: 4px;
}

.settlement-detail-panel {
  padding: 20px 22px;
  border: 1px solid #e0e7f1;
  border-radius: 12px;
  background: linear-gradient(180deg, #f9fbff, #fff);
}

.settlement-detail-title,
.detail-section-title {
  margin-bottom: 18px;
  color: #0b1220;
  font-size: 14px;
  font-weight: 700;
}

.settlement-detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 22px 32px;
}

.settlement-detail-item .iv {
  overflow: hidden;
  color: #0b1220;
  font-size: 13px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.settlement-rule-value {
  color: #2468f2 !important;
}

.settlement-condition-card {
  margin-top: 18px;
  padding: 16px 18px;
  border: 1px solid #dce3ee;
  border-radius: 10px;
}

.settlement-condition-text {
  color: #4e5969;
  font-size: 13px;
  line-height: 1.8;
  white-space: pre-wrap;
}

.participant-head,
.deliverable-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.participant-head .detail-section-title {
  margin-bottom: 0;
}

.participant-sub,
.deliverable-support {
  margin-top: 5px;
  color: #8793a4;
  font-size: 12px;
}

.participant-grid,
.deliverable-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.participant-card {
  display: flex;
  align-items: center;
  gap: 11px;
  min-width: 0;
  padding: 14px;
  border: 1px solid #a9ddbf;
  border-radius: 10px;
  background: linear-gradient(180deg, #f8fffb, #fff);
}

.worker-avatar {
  display: flex;
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #fff;
  background: #2468f2;
  font-weight: 700;
}

.participant-main {
  min-width: 0;
  flex: 1;
}

.participant-name {
  overflow: hidden;
  color: #0b1220;
  font-size: 13px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.participant-current {
  margin-left: 5px;
  padding: 2px 5px;
  border-radius: 4px;
  color: #0a8a4a;
  background: #e6f7ee;
  font-size: 10px;
}

.participant-meta {
  margin-top: 4px;
  overflow: hidden;
  color: #8793a4;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.participant-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}

.deliverable-card {
  min-height: 176px;
  padding: 18px 20px;
  border: 1px solid transparent;
  border-radius: 12px;
  background: #f7f9fc;
}

.deliverable-card.is-missing {
  border-style: dashed;
  border-color: #f6c453;
  background: #fff9ed;
}

.deliverable-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.deliverable-title {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #0b1220;
  font-size: 14px;
  font-weight: 700;
}

.deliverable-title em {
  padding: 2px 5px;
  border-radius: 4px;
  color: #d46b08;
  background: #fff0e6;
  font-size: 10px;
  font-style: normal;
}

.deliverable-files {
  display: grid;
  gap: 7px;
  margin-top: 14px;
  padding: 0;
  list-style: none;
}

.deliverable-files :deep(.el-button) {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.deliverable-empty {
  margin-top: 22px;
  color: #8793a4;
  font-size: 12px;
}

@media (max-width: 900px) {
  .task-detail-summary,
  .settlement-detail-grid,
  .participant-grid,
  .deliverable-grid {
    grid-template-columns: 1fr;
  }
}
</style>
