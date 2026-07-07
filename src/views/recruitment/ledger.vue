<template>
  <!--
    结算台账管理（运营/平台方）。
    资金主线出口：核验通过自动生成「待结算」台账 → 运营在此「标记已结算」(单条/批量) → 绑定发票/开票。
    数据来源：AdminRecruitmentController /admin/recruitment/ledger/{list,{id},statistics,settle}。
  -->
  <div class="p-4">
    <!-- 统计卡片 -->
    <el-row :gutter="16" class="mb-4">
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-mini-card">
          <div class="stat-mini">
            <span class="label">台账总数</span>
            <span class="value">{{ statistics.totalCount || 0 }}</span>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-mini-card warning clickable" @click="filterBySettleStatus('0')">
          <div class="stat-mini">
            <span class="label">待结算金额</span>
            <span class="value warning">{{ pendingAmountText }}</span>
            <span class="hint">
              {{ statistics.pendingCount || 0 }} 笔待结算
              <template v-if="pendingAmountPartial">，金额为估算</template>
            </span>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-mini-card success">
          <div class="stat-mini">
            <span class="label">累计金额</span>
            <span class="value success">¥{{ formatMoney(statistics.totalAmount) }}</span>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-mini-card primary">
          <div class="stat-mini">
            <span class="label">今日金额</span>
            <span class="value primary">¥{{ formatMoney(statistics.todayAmount) }}</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 搜索栏 -->
    <el-card shadow="hover" class="mb-4">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true">
        <el-form-item label="业务编号">
          <el-input v-model="chainNo" placeholder="ENT/JOB/SKR/APL/FUL/ORD/QY..." clearable style="width: 260px" @keyup.enter="handleChainQuery()" />
        </el-form-item>
        <el-form-item label="订单号" prop="orderNo">
          <el-input v-model="queryParams.orderNo" placeholder="请输入订单号" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="企业" prop="companyId">
          <el-input v-model="queryParams.companyId" placeholder="企业ID" clearable @keyup.enter="handleQuery" style="width: 120px" />
        </el-form-item>
        <el-form-item label="结算状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 130px">
            <el-option label="待结算" value="0" />
            <el-option label="已结算" value="1" />
            <el-option label="已取消" value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button type="success" plain icon="Search" :loading="chainLoading" @click="handleChainQuery()">链路查询</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-if="chainResult || chainLoading" shadow="hover" class="mb-4 chain-card">
      <template #header>
        <div class="chain-header">
          <div>
            <span class="chain-title">全链路查询</span>
            <span v-if="chainResult?.sourceNo" class="chain-subtitle">
              {{ sourceTypeLabel(chainResult.sourceType) }} / {{ chainResult.sourceNo }}
            </span>
          </div>
          <el-button link type="primary" @click="clearChain">清空链路</el-button>
        </div>
      </template>
      <el-skeleton v-if="chainLoading" :rows="2" animated />
      <el-tabs v-else v-model="chainActiveTab" class="chain-tabs">
        <el-tab-pane label="链路总览" name="overview">
          <el-empty v-if="!chainSteps.length" description="未查询到链路节点" />
          <div v-else class="chain-flow">
            <template v-for="(step, index) in chainSteps" :key="step.kind">
              <button type="button" class="chain-node" @click="handleChainStepClick(step)">
                <span class="chain-label">{{ step.label }}</span>
                <span class="chain-code">{{ step.code }}</span>
                <span v-if="step.desc" class="chain-desc">{{ step.desc }}</span>
              </button>
              <span v-if="index < chainSteps.length - 1" class="chain-arrow">&gt;</span>
            </template>
          </div>
        </el-tab-pane>
        <el-tab-pane v-if="chainResult?.companyId" label="企业" name="company">
          <el-skeleton v-if="chainDetailLoading && !chainDetails.company" :rows="4" animated />
          <el-descriptions v-else-if="chainDetails.company" :column="3" border>
            <el-descriptions-item label="企业ID">{{ chainDetails.company.companyId || '-' }}</el-descriptions-item>
            <el-descriptions-item label="企业编码">{{ chainDetails.company.companyNo || chainResult?.companyNo || '-' }}</el-descriptions-item>
            <el-descriptions-item label="企业名称">{{ chainDetails.company.companyName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="联系人">{{ chainDetails.company.contactPerson || '-' }}</el-descriptions-item>
            <el-descriptions-item label="联系电话">{{ chainDetails.company.contactPhone || '-' }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ chainDetails.company.createTime || '-' }}</el-descriptions-item>
            <el-descriptions-item label="备注" :span="3">{{ chainDetails.company.remark || '-' }}</el-descriptions-item>
          </el-descriptions>
          <el-empty v-else description="企业详情未加载" />
        </el-tab-pane>
        <el-tab-pane v-if="chainResult?.jobId" label="岗位" name="job">
          <el-skeleton v-if="chainDetailLoading && !chainDetails.job" :rows="4" animated />
          <el-descriptions v-else-if="chainDetails.job" :column="3" border>
            <el-descriptions-item label="岗位ID">{{ chainDetails.job.jobId || '-' }}</el-descriptions-item>
            <el-descriptions-item label="岗位编码">{{ chainDetails.job.jobNo || chainResult?.jobNo || '-' }}</el-descriptions-item>
            <el-descriptions-item label="岗位名称">{{ chainDetails.job.jobName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="企业">{{ chainDetails.job.companyName || chainResult?.companyName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="薪资">{{ formatSalaryText(chainDetails.job) }}</el-descriptions-item>
            <el-descriptions-item label="工作地点">{{ chainDetails.job.workAddress || chainDetails.job.location || '-' }}</el-descriptions-item>
            <el-descriptions-item label="状态">{{ chainDetails.job.statusName || chainDetails.job.status || '-' }}</el-descriptions-item>
            <el-descriptions-item label="发布时间">{{ chainDetails.job.publishTime || '-' }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ chainDetails.job.createTime || '-' }}</el-descriptions-item>
          </el-descriptions>
          <el-empty v-else description="岗位详情未加载" />
        </el-tab-pane>
        <el-tab-pane v-if="chainResult?.applyId" label="投递" name="apply">
          <el-skeleton v-if="chainDetailLoading && !chainDetails.apply" :rows="4" animated />
          <el-descriptions v-else-if="chainDetails.apply" :column="3" border>
            <el-descriptions-item label="投递ID">{{ chainDetails.apply.applyId || '-' }}</el-descriptions-item>
            <el-descriptions-item label="投递编号">{{ chainDetails.apply.applyNo || chainResult?.applyNo || '-' }}</el-descriptions-item>
            <el-descriptions-item label="投递状态">{{ chainDetails.apply.statusName || chainDetails.apply.status || '-' }}</el-descriptions-item>
            <el-descriptions-item label="求职者">{{
              chainDetails.apply.jobSeeker?.realName || chainDetails.apply.jobSeeker?.nickName || chainResult?.jobSeekerName || '-'
            }}</el-descriptions-item>
            <el-descriptions-item label="企业">{{ chainDetails.apply.company?.companyName || chainResult?.companyName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="岗位">{{ chainDetails.apply.job?.jobName || chainResult?.jobName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="投递时间">{{ chainDetails.apply.applyTime || '-' }}</el-descriptions-item>
            <el-descriptions-item label="是否已读">{{ chainDetails.apply.isRead === '1' ? '已读' : '未读' }}</el-descriptions-item>
            <el-descriptions-item label="留言">{{ chainDetails.apply.message || '-' }}</el-descriptions-item>
          </el-descriptions>
          <el-empty v-else description="投递详情未加载" />
        </el-tab-pane>
        <el-tab-pane v-if="chainResult?.taskId" label="履约" name="task">
          <el-skeleton v-if="chainDetailLoading && !chainDetails.task" :rows="4" animated />
          <el-descriptions v-else-if="chainDetails.task" :column="3" border>
            <el-descriptions-item label="任务ID">{{ chainDetails.task.taskId || '-' }}</el-descriptions-item>
            <el-descriptions-item label="履约编号">{{ chainDetails.task.taskNo || chainResult?.taskNo || '-' }}</el-descriptions-item>
            <el-descriptions-item label="状态">{{ chainDetails.task.statusName || chainDetails.task.status || '-' }}</el-descriptions-item>
            <el-descriptions-item label="企业">{{ chainDetails.task.companyName || chainResult?.companyName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="岗位">{{ chainDetails.task.jobName || chainResult?.jobName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="求职者">{{
              chainDetails.task.workerName || chainDetails.task.userName || chainResult?.jobSeekerName || '-'
            }}</el-descriptions-item>
            <el-descriptions-item label="工作时间">{{ chainDetails.task.workTime || '-' }}</el-descriptions-item>
            <el-descriptions-item label="结算金额">{{
              chainDetails.task.settleAmount != null ? `¥${formatMoney(chainDetails.task.settleAmount)}` : '-'
            }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ chainDetails.task.createTime || '-' }}</el-descriptions-item>
          </el-descriptions>
          <el-empty v-else description="履约详情未加载" />
        </el-tab-pane>
        <el-tab-pane v-if="chainResult?.ledgerId" label="台账" name="ledger">
          <el-skeleton v-if="chainDetailLoading && !chainDetails.ledger" :rows="4" animated />
          <el-descriptions v-else-if="chainDetails.ledger" :column="3" border>
            <el-descriptions-item label="台账ID">{{ chainDetails.ledger.ledgerId || '-' }}</el-descriptions-item>
            <el-descriptions-item label="台账编号">{{ chainDetails.ledger.orderNo || chainResult?.orderNo || '-' }}</el-descriptions-item>
            <el-descriptions-item label="结算金额">¥{{ formatMoney(chainDetails.ledger.amount) }}</el-descriptions-item>
            <el-descriptions-item label="企业">{{ chainDetails.ledger.companyName || chainResult?.companyName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="用户">{{ chainDetails.ledger.userName || chainResult?.jobSeekerName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="结算状态">{{ ledgerStatusMeta(chainDetails.ledger.status).label }}</el-descriptions-item>
            <el-descriptions-item label="发票状态">{{ ledgerInvoiceStatusMeta(chainDetails.ledger.invoiceStatus).label }}</el-descriptions-item>
            <el-descriptions-item label="结算时间">{{ chainDetails.ledger.settleTime || '-' }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ chainDetails.ledger.createTime || '-' }}</el-descriptions-item>
          </el-descriptions>
          <el-empty v-else description="台账详情未加载" />
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 数据表格 -->
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <el-button type="primary" plain icon="Refresh" @click="loadData">刷新</el-button>
          <!-- 批量结算：仅当勾选了「待结算」台账时可用 -->
          <el-button type="success" icon="Money" :disabled="!settleableSelection.length" @click="openSettle(settleableSelection)">
            批量标记已结算{{ settleableSelection.length ? `(${settleableSelection.length})` : '' }}
          </el-button>
        </div>
      </template>

      <el-table v-loading="loading" :data="tableData" border stripe row-key="ledgerId" @selection-change="onSelectionChange">
        <el-table-column type="selection" width="46" :selectable="isSelectable" />
        <!-- 台账编号：后端 Ledger.orderNo -->
        <el-table-column label="台账编号" prop="orderNo" min-width="190" show-overflow-tooltip />
        <el-table-column label="企业" prop="companyName" min-width="140">
          <template #default="{ row }">{{ row.companyName || '-' }}</template>
        </el-table-column>
        <el-table-column label="用户" min-width="110">
          <template #default="{ row }">{{ row.userName || '-' }}</template>
        </el-table-column>
        <el-table-column label="结算金额" width="120" align="right">
          <template #default="{ row }">
            <span class="amount">¥{{ formatMoney(row.amount) }}</span>
          </template>
        </el-table-column>
        <!-- 结算状态：后端 Ledger.status 0待结算/1已结算/2已取消 -->
        <el-table-column label="结算状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="ledgerStatusMeta(row.status).type">{{ ledgerStatusMeta(row.status).label }}</el-tag>
          </template>
        </el-table-column>
        <!-- 发票绑定状态：后端 Ledger.invoiceStatus 0未绑定/1已绑定 -->
        <el-table-column label="发票状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="ledgerInvoiceStatusMeta(row.invoiceStatus).type">{{ ledgerInvoiceStatusMeta(row.invoiceStatus).label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="结算时间" prop="settleTime" width="160" align="center">
          <template #default="{ row }">{{ row.settleTime || '-' }}</template>
        </el-table-column>
        <el-table-column label="创建时间" prop="createTime" width="160" align="center" />
        <el-table-column label="操作" width="140" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" icon="View" @click="handleDetail(row)">详情</el-button>
            <!-- 标记已结算：仅「待结算」可操作 -->
            <el-button v-if="row.status === '0'" link type="success" icon="Money" @click="openSettle([row])">结算</el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="loadData" />
    </el-card>

    <!-- 台账详情对话框 -->
    <el-dialog v-model="detailVisible" title="台账详情" width="600px" append-to-body>
      <el-descriptions :column="2" border v-if="currentLedger">
        <el-descriptions-item label="台账编号" :span="2">{{ currentLedger.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="岗位">
          <el-button v-if="currentLedger.jobId" link type="primary" @click="openRelatedJob(currentLedger)">查看岗位详情</el-button>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="投递编号">{{ currentLedger.applyNo || currentLedger.applyId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="企业">{{ currentLedger.companyName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="求职者编号">{{ currentLedger.jobSeekerNo || currentLedger.userId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="结算金额">
          <span class="amount-lg">¥{{ formatMoney(currentLedger.amount) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="结算状态">
          <el-tag :type="ledgerStatusMeta(currentLedger.status).type">{{ ledgerStatusMeta(currentLedger.status).label }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="发票状态">
          <el-tag :type="ledgerInvoiceStatusMeta(currentLedger.invoiceStatus).type">{{
            ledgerInvoiceStatusMeta(currentLedger.invoiceStatus).label
          }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="履约编号">{{ currentLedger.taskNo || currentLedger.taskId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="结算时间">{{ currentLedger.settleTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="结算备注" :span="2">{{ currentLedger.settleRemark || '-' }}</el-descriptions-item>
        <el-descriptions-item label="不可篡改时间" :span="2">{{ currentLedger.timestamp }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ currentLedger.createTime }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ currentLedger.updateTime }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button v-if="currentLedger && currentLedger.status === '0'" type="success" icon="Money" @click="openSettle([currentLedger])"
          >标记已结算</el-button
        >
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 结算确认对话框（单条/批量共用） -->
    <el-dialog v-model="settleVisible" title="标记已结算" width="480px" append-to-body>
      <el-alert
        class="mb-3"
        type="warning"
        :closable="false"
        show-icon
        :title="`确认将 ${settleTargets.length} 笔台账标记为已结算？此操作记入审计，请在完成打款后操作。`"
      />
      <el-form label-width="80px">
        <el-form-item label="结算备注">
          <el-input v-model="settleRemark" type="textarea" :rows="3" maxlength="200" show-word-limit placeholder="选填：打款流水号/凭证等" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="settleVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitSettle">确认结算</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="LedgerManagement" lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import {
  listLedger,
  getLedgerStatistics,
  getLedger,
  settleLedger,
  getCompany,
  getJobFullDetail,
  getApply2Detail,
  getTask,
  type LedgerVO
} from '@/api/recruitment';
import { getBizNoChain, type BizNoChainVO } from '@/api/recruitment/serialRule';
import { unwrapList, formatMoney } from './helpers';
// 台账结算状态(0待结算/1已结算/2已取消) 与 发票绑定状态(0未绑定/1已绑定) → el-tag 文案/颜色，映射集中在 constants.ts
import { ledgerStatusMeta, ledgerInvoiceStatusMeta } from './constants';

const loading = ref(false);
const router = useRouter();
const submitting = ref(false);
const total = ref(0);
const tableData = ref<any[]>([]);
const detailVisible = ref(false);
const currentLedger = ref<any>(null);
const queryFormRef = ref();

// 多选：仅「待结算」可被选中（表格 selectable 已限制），这里再过滤一层兜底
const selectedRows = ref<any[]>([]);
const settleableSelection = computed(() => selectedRows.value.filter((r) => r.status === '0'));

// 结算对话框
const settleVisible = ref(false);
const settleTargets = ref<any[]>([]);
const settleRemark = ref('');
const pendingAmountLoading = ref(false);
const pendingAmountPartial = ref(false);
const chainNo = ref('');
const chainLoading = ref(false);
const chainResult = ref<BizNoChainVO | null>(null);
const chainActiveTab = ref('overview');
const chainDetailLoading = ref(false);
const chainDetails = reactive<Record<'company' | 'job' | 'apply' | 'task' | 'ledger', any>>({
  company: null,
  job: null,
  apply: null,
  task: null,
  ledger: null
});

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  orderNo: '',
  companyId: undefined,
  userId: undefined,
  status: ''
});

const statistics = reactive({
  totalCount: 0,
  totalAmount: 0,
  todayAmount: 0,
  pendingCount: 0,
  pendingAmount: undefined as number | undefined
});

const pendingAmountText = computed(() => {
  if (pendingAmountLoading.value && statistics.pendingAmount == null) return '加载中';
  return statistics.pendingAmount == null ? '--' : `¥${formatMoney(statistics.pendingAmount)}`;
});

interface ChainStep {
  kind: 'company' | 'job' | 'user' | 'apply' | 'task' | 'order';
  label: string;
  code: string;
  desc?: string;
}

const chainSteps = computed<ChainStep[]>(() => {
  const chain = chainResult.value;
  if (!chain) return [];
  return [
    { kind: 'company', label: '企业', code: chain.companyNo, desc: chain.companyName },
    { kind: 'job', label: '岗位', code: chain.jobNo, desc: chain.jobName },
    { kind: 'user', label: '求职者', code: chain.jobSeekerNo, desc: chain.jobSeekerName },
    { kind: 'apply', label: '投递', code: chain.applyNo },
    { kind: 'task', label: '履约', code: chain.taskNo },
    { kind: 'order', label: '台账', code: chain.orderNo, desc: chain.orderAmount != null ? `¥${formatMoney(chain.orderAmount)}` : '' }
  ].filter((step): step is ChainStep => !!step.code);
});

function sourceTypeLabel(type?: string) {
  const map: Record<string, string> = {
    COMPANY: '企业',
    JOB: '岗位',
    JOB_SEEKER: '求职者',
    APPLY: '投递',
    TASK: '履约',
    ORDER: '台账'
  };
  return map[String(type || '')] || '业务编号';
}

function resetChainDetails() {
  chainActiveTab.value = 'overview';
  chainDetails.company = null;
  chainDetails.job = null;
  chainDetails.apply = null;
  chainDetails.task = null;
  chainDetails.ledger = null;
}

function formatSalaryText(job: any) {
  if (!job) return '-';
  if (job.salary) return job.salary;
  if (job.salaryMin != null || job.salaryMax != null) {
    const unit = job.salaryUnitName || (job.salaryUnit === '0' ? '元/天' : job.salaryUnit === '3' ? '元/小时' : '元/月');
    return `${job.salaryMin ?? '-'}-${job.salaryMax ?? '-'}${unit}`;
  }
  return '-';
}

async function loadChainDetails(chain: BizNoChainVO) {
  resetChainDetails();
  chainDetailLoading.value = true;
  try {
    await Promise.all([
      chain.companyId
        ? getCompany(chain.companyId as any)
            .then((res) => (chainDetails.company = res.data || null))
            .catch(() => null)
        : Promise.resolve(),
      chain.jobId
        ? getJobFullDetail(chain.jobId as any)
            .then((res) => (chainDetails.job = res.data || null))
            .catch(() => null)
        : Promise.resolve(),
      chain.applyId
        ? getApply2Detail(chain.applyId as any)
            .then((res) => (chainDetails.apply = res.data || null))
            .catch(() => null)
        : Promise.resolve(),
      chain.taskId
        ? getTask(chain.taskId as any)
            .then((res) => (chainDetails.task = res.data || null))
            .catch(() => null)
        : Promise.resolve(),
      chain.ledgerId
        ? getLedger(chain.ledgerId as any)
            .then((res) => (chainDetails.ledger = res.data || null))
            .catch(() => null)
        : Promise.resolve()
    ]);
  } finally {
    chainDetailLoading.value = false;
  }
}

async function loadData() {
  loading.value = true;
  try {
    const res = await listLedger(queryParams);
    const list = unwrapList(res);
    tableData.value = list.rows;
    total.value = list.total;
  } catch (error) {
    console.error('加载台账失败:', error);
  } finally {
    loading.value = false;
  }
}

async function loadStatistics() {
  try {
    const res = await getLedgerStatistics();
    const data = res.data || {};
    Object.assign(statistics, data);
    // 待结算金额/笔数是新增统计契约；后端未补前，前端用待结算列表做临时兜底，避免卡片空白。
    if (data.pendingAmount == null || data.pendingCount == null) {
      await loadPendingLedgerFallback();
    } else {
      pendingAmountPartial.value = false;
    }
  } catch (error) {
    console.error('加载台账统计失败:', error);
  }
}

async function loadPendingLedgerFallback() {
  pendingAmountLoading.value = true;
  try {
    const fallbackPageSize = 500;
    const res = await listLedger({ pageNum: 1, pageSize: fallbackPageSize, status: '0' } as any);
    const list = unwrapList<LedgerVO>(res);
    statistics.pendingCount = list.total;
    statistics.pendingAmount = list.rows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
    pendingAmountPartial.value = list.total > list.rows.length;
  } catch (error) {
    pendingAmountPartial.value = false;
    console.error('加载待结算台账兜底统计失败:', error);
  } finally {
    pendingAmountLoading.value = false;
  }
}

async function handleChainQuery(no?: string) {
  const bizNo = String(no ?? chainNo.value).trim();
  if (!bizNo) {
    ElMessage.warning('请输入业务编号');
    return;
  }
  chainNo.value = bizNo;
  chainLoading.value = true;
  resetChainDetails();
  try {
    const res = await getBizNoChain(bizNo);
    chainResult.value = res.data || null;
    if (chainResult.value?.orderNo) {
      queryParams.orderNo = chainResult.value.orderNo;
      queryParams.pageNum = 1;
      await loadData();
    }
    if (chainResult.value) {
      await loadChainDetails(chainResult.value);
    }
  } catch (error) {
    chainResult.value = null;
    resetChainDetails();
    ElMessage.error('未找到该业务编号的链路');
  } finally {
    chainLoading.value = false;
  }
}

function clearChain() {
  chainNo.value = '';
  chainResult.value = null;
  resetChainDetails();
}

function handleChainStepClick(step: ChainStep) {
  if (step.kind === 'user') {
    ElMessage.info('求职者节点暂展示编号与姓名');
    return;
  }
  chainActiveTab.value = step.kind === 'order' ? 'ledger' : step.kind;
}

function handleQuery() {
  queryParams.pageNum = 1;
  loadData();
}

function resetQuery() {
  queryFormRef.value?.resetFields();
  queryParams.pageNum = 1;
  queryParams.orderNo = '';
  queryParams.companyId = undefined;
  queryParams.userId = undefined;
  queryParams.status = '';
  clearChain();
  loadData();
}

// 统计卡联动筛选：待结算金额卡对应 ledger.status=0，点击后直接看待结算明细。
function filterBySettleStatus(status: string) {
  queryParams.status = status;
  queryParams.pageNum = 1;
  loadData();
}

function onSelectionChange(rows: any[]) {
  selectedRows.value = rows;
}

// 仅「待结算」可勾选（用于结算）；提取为方法，避免模板内联箭头在选择表里的边界问题
function isSelectable(row: any) {
  return row.status === '0';
}

async function handleDetail(row: any) {
  try {
    const res = await getLedger(row.ledgerId);
    currentLedger.value = res.data;
    detailVisible.value = true;
  } catch (error) {
    ElMessage.error('获取台账详情失败');
  }
}

function openRelatedJob(row: any) {
  if (!row?.jobId) return;
  detailVisible.value = false;
  router.push({ name: 'RecruitmentJob', query: { jobId: String(row.jobId) } });
}

// 打开结算确认（单条传 [row]，批量传选中列表）
function openSettle(targets: any[]) {
  settleTargets.value = (targets || []).filter((t) => t.status === '0');
  if (!settleTargets.value.length) {
    ElMessage.warning('没有可结算的「待结算」台账');
    return;
  }
  settleRemark.value = '';
  settleVisible.value = true;
}

async function submitSettle() {
  const ledgerIds = settleTargets.value.map((t) => t.ledgerId).filter(Boolean);
  if (!ledgerIds.length) return;
  submitting.value = true;
  try {
    await settleLedger({ ledgerIds, remark: settleRemark.value?.trim() || undefined });
    ElMessage.success('已标记结算');
    settleVisible.value = false;
    detailVisible.value = false;
    loadData();
    loadStatistics();
  } catch (error) {
    ElMessage.error('结算失败');
  } finally {
    submitting.value = false;
  }
}

// 支持从任务详情「台账编号」跳转携带 ?orderNo= 预填检索条件，
// 否则跳过来看到的是未过滤的全量台账（按订单号检索的意图落空）。
const route = useRoute();
onMounted(() => {
  const qOrderNo = route.query.orderNo;
  if (typeof qOrderNo === 'string' && qOrderNo) {
    queryParams.orderNo = qOrderNo;
    chainNo.value = qOrderNo;
  }
  const qBizNo = route.query.bizNo;
  if (typeof qBizNo === 'string' && qBizNo) {
    chainNo.value = qBizNo;
  }
  // 支持从履约页「待结算提醒」跳转携带 ?status=0，落地即筛待结算台账。
  const qStatus = route.query.status;
  if (typeof qStatus === 'string' && ['0', '1', '2'].includes(qStatus)) {
    queryParams.status = qStatus;
  }
  loadData();
  loadStatistics();
  if (chainNo.value) {
    handleChainQuery(chainNo.value);
  }
});
</script>

<style scoped>
.mb-4 {
  margin-bottom: 16px;
}
.mb-3 {
  margin-bottom: 14px;
}

.card-header {
  display: flex;
  gap: 10px;
  align-items: center;
}

.chain-card {
  border-left: 3px solid var(--el-color-primary);
}
.chain-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.chain-title {
  font-weight: 700;
  color: #303133;
}
.chain-subtitle {
  margin-left: 10px;
  color: #909399;
  font-size: 13px;
}
.chain-flow {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  gap: 8px;
}
.chain-node {
  min-width: 150px;
  max-width: 240px;
  padding: 10px 12px;
  text-align: left;
  cursor: pointer;
  background: #f7fbff;
  border: 1px solid #c6e2ff;
  border-radius: 6px;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}
.chain-node:hover {
  border-color: var(--el-color-primary);
  box-shadow: 0 2px 8px rgb(64 158 255 / 14%);
}
.chain-label,
.chain-code,
.chain-desc {
  display: block;
}
.chain-label {
  color: #606266;
  font-size: 12px;
}
.chain-code {
  margin-top: 4px;
  color: var(--el-color-primary);
  font-weight: 700;
  word-break: break-all;
}
.chain-desc {
  margin-top: 3px;
  color: #909399;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.chain-arrow {
  display: inline-flex;
  align-items: center;
  color: #a8abb2;
  font-weight: 700;
}

.stat-mini-card {
  text-align: center;
}
.stat-mini-card.clickable {
  cursor: pointer;
}
.stat-mini-card.clickable:hover {
  border-color: var(--el-color-warning);
}
.stat-mini {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 92px;
  padding: 10px 0;
}
.stat-mini .label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}
.stat-mini .value {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
}
.stat-mini .value.success {
  color: #67c23a;
}
.stat-mini .value.primary {
  color: #409eff;
}
.stat-mini .value.warning {
  color: #e6a23c;
}
.stat-mini .hint {
  min-height: 18px;
  margin-top: 6px;
  color: #909399;
  font-size: 12px;
}

.amount {
  color: #67c23a;
  font-weight: 600;
}
.amount-lg {
  color: #67c23a;
  font-weight: 700;
  font-size: 18px;
}
</style>
