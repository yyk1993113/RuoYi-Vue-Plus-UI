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

    <el-dialog v-model="detailVisible" title="财税任务详情" width="900px" append-to-body>
      <div v-loading="detailLoading">
        <template v-if="currentTask">
          <el-tabs v-model="detailTab" class="finance-task-detail-tabs">
            <el-tab-pane label="任务描述" name="info">
              <el-descriptions :column="3" border>
                <el-descriptions-item label="任务编号">{{ currentTask.sourceTaskNo || '-' }}</el-descriptions-item>
                <el-descriptions-item label="任务类型">{{ taskTypeLabel(currentTask.taskType) }}</el-descriptions-item>
                <el-descriptions-item label="任务状态">
                  <el-tag :type="taskStatusMeta(currentTask.taskStatus, currentTask.reviewStatus).type">{{ taskStatusMeta(currentTask.taskStatus, currentTask.reviewStatus).label }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="开始时间">{{ formatTaskDateTime(currentTask.workStartAt) }}</el-descriptions-item>
                <el-descriptions-item label="结束时间">{{ formatTaskDateTime(currentTask.workEndAt) }}</el-descriptions-item>
                <el-descriptions-item label="关联甲方">{{ currentTask.tenantId || '-' }}</el-descriptions-item>
                <el-descriptions-item label="招聘人数">{{ currentTask.recruitRequired ?? '-' }}</el-descriptions-item>
                <el-descriptions-item label="是否开启招聘">{{ currentTask.recruitmentEnabled == null ? '-' : currentTask.recruitmentEnabled ? '是' : '否' }}</el-descriptions-item>
                <el-descriptions-item label="工作地点" :span="3">{{ currentTask.workAddress || '-' }}</el-descriptions-item>
              </el-descriptions>

              <el-divider content-position="left">任务描述</el-divider>
              <el-descriptions :column="1" border>
                <el-descriptions-item label="任务概述">{{ currentDescriptionSections.overview }}</el-descriptions-item>
                <el-descriptions-item label="工作内容">{{ currentDescriptionSections.content }}</el-descriptions-item>
                <el-descriptions-item label="工作要求">{{ currentDescriptionSections.requirements }}</el-descriptions-item>
                <el-descriptions-item label="交付标准">{{ currentDescriptionSections.deliveryStandard }}</el-descriptions-item>
              </el-descriptions>
            </el-tab-pane>

            <el-tab-pane label="结算规则" name="settlement">
              <el-descriptions :column="3" border>
                <el-descriptions-item label="计费方式">{{ currentSettlementRule.pricingMode }}</el-descriptions-item>
                <el-descriptions-item label="计费单价 / 阶梯">{{ currentSettlementRule.priceRule }}</el-descriptions-item>
                <el-descriptions-item label="薪资单位">{{ currentSettlementRule.salaryUnit }}</el-descriptions-item>
                <el-descriptions-item label="结算周期">{{ currentSettlementRule.settlementCycle }}</el-descriptions-item>
                <el-descriptions-item label="任务预算">{{ formatAmount(currentTask.budgetAmount, currentTask.currency) }}</el-descriptions-item>
                <el-descriptions-item label="已验收金额">{{ formatAmount(currentTask.acceptedAmount, currentTask.currency) }}</el-descriptions-item>
                <el-descriptions-item label="薪资下限">{{ formatAmount(currentTask.salaryMin, currentTask.currency) }}</el-descriptions-item>
                <el-descriptions-item label="薪资上限">{{ formatAmount(currentTask.salaryMax, currentTask.currency) }}</el-descriptions-item>
              </el-descriptions>
              <el-divider content-position="left">结算条件说明</el-divider>
              <el-card shadow="never">{{ currentSettlementRule.settlementCondition }}</el-card>
            </el-tab-pane>

            <el-tab-pane label="同步与审核" name="audit">
              <el-descriptions :column="3" border>
                <el-descriptions-item label="创建人">{{ currentTask.syncUserName || currentTask.sourceCreatedBy || currentTask.syncUserId || '-' }}</el-descriptions-item>
                <el-descriptions-item label="创建时间">{{ formatTaskDateTime(currentTask.sourceCreatedAt || currentTask.createTime) }}</el-descriptions-item>
                <el-descriptions-item label="来源版本">{{ currentTask.sourceRevision || '-' }}</el-descriptions-item>
                <el-descriptions-item label="财税推送人">{{ currentTask.syncUserName || currentTask.syncUserId || '-' }}</el-descriptions-item>
                <el-descriptions-item label="接收时间">{{ formatTaskDateTime(currentTask.createTime) }}</el-descriptions-item>
                <el-descriptions-item label="审核状态">
                  <el-tag :type="statusMeta(currentTask.reviewStatus).type">{{ statusMeta(currentTask.reviewStatus).label }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="审核人">{{ currentTask.reviewUserName || '-' }}</el-descriptions-item>
                <el-descriptions-item label="审核时间">{{ formatTaskDateTime(currentTask.reviewTime) }}</el-descriptions-item>
                <el-descriptions-item label="审核意见" :span="3">{{ currentTask.reviewRemark || '-' }}</el-descriptions-item>
              </el-descriptions>
            </el-tab-pane>

            <el-tab-pane label="原始规则" name="raw">
              <el-descriptions :column="1" border>
                <el-descriptions-item label="验收规则">{{ currentTask.acceptanceRuleJson || '-' }}</el-descriptions-item>
                <el-descriptions-item label="计价规则">{{ currentTask.pricingRuleJson || '-' }}</el-descriptions-item>
              </el-descriptions>
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
import { auditFinanceTaskReview, getFinanceTaskReview, listFinanceTaskReview, type FinanceTaskAuditForm, type FinanceTaskReviewVO } from '@/api/recruitment';
import { unwrapList } from './helpers';

const loading = ref(false);
const detailLoading = ref(false);
const submitting = ref(false);
const total = ref(0);
const tableData = ref<FinanceTaskReviewVO[]>([]);
const currentTask = ref<FinanceTaskReviewVO | null>(null);
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
  detailLoading.value = true;
  try {
    const res = await getFinanceTaskReview(row.id);
    currentTask.value = (res as any).data || res;
  } finally {
    detailLoading.value = false;
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
