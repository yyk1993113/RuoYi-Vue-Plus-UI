<!-- 银行收支流水通过只读银行接口定时查询；对账文件任务继续独立展示，避免把银行文件任务与资金流水混为一类。 -->
<template>
  <div class="p-4">
    <el-card shadow="hover" class="mb-4 filter-card">
      <el-tabs v-model="activeTab" @tab-change="loadActiveTab">
        <el-tab-pane label="银行收支流水" name="funding">
          <el-form :model="fundingQuery" inline>
            <el-form-item label="流水检索">
              <el-input
                v-model="fundingQuery.keyword"
                clearable
                placeholder="银行流水号 / 企业 / 摘要"
                style="width: 260px"
                @input="applyFundingFilters"
                @keyup.enter="applyFundingFilters"
              />
            </el-form-item>
            <el-form-item label="收支类型">
              <el-select v-model="fundingQuery.direction" clearable placeholder="全部" style="width: 150px" @change="applyFundingFilters">
                <el-option label="收入" value="INCOME" />
                <el-option label="支出" value="EXPENSE" />
                <el-option label="待识别" value="UNKNOWN" />
              </el-select>
            </el-form-item>
            <el-form-item label="交易日期">
              <el-date-picker
                v-model="fundingDateRange"
                type="daterange"
                value-format="YYYY-MM-DD"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                :disabled-date="disableFutureFundingDate"
                style="width: 260px"
              />
            </el-form-item>
            <el-form-item>
              <el-button
                v-hasPermi="['settlement:reconciliation:list']"
                type="primary"
                icon="Search"
                :loading="syncing"
                :disabled="manualCooldown > 0"
                @click="queryBankFlows(true)"
              >{{ queryButtonText }}</el-button>
              <el-button icon="Refresh" @click="resetFunding">重置</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="对账文件任务" name="receipt">
          <el-form :model="receiptQuery" inline>
            <el-form-item label="平台回单号">
              <el-input v-model="receiptQuery.receiptNo" clearable placeholder="请输入平台回单号" @keyup.enter="loadReceipts" />
            </el-form-item>
            <el-form-item label="类型">
              <el-select v-model="receiptQuery.type" clearable placeholder="全部" style="width: 190px">
                <el-option label="代发回单" value="PAYROLL_RECEIPT" />
                <el-option label="子单元交易对账单" value="SUB_ACCOUNT_STATEMENT" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="receiptQuery.status" clearable placeholder="全部" style="width: 150px">
                <el-option label="待处理" value="PENDING" />
                <el-option label="处理中" value="PROCESSING" />
                <el-option label="已获取" value="FETCHED" />
                <el-option label="失败" value="FAILED" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="loadReceipts">查询</el-button>
              <el-button icon="Refresh" @click="resetReceipts">重置</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-card v-if="activeTab === 'funding'" shadow="hover">
      <template #header>
        <div class="toolbar">
          <div>
            <strong>银行收支流水</strong>
            <div class="hint">数据来自银行子单元交易接口；页面停留期间每 5 分钟自动更新</div>
          </div>
          <div class="refresh-meta">
            <el-tag type="success" effect="plain">自动查询：5 分钟</el-tag>
            <span>最近查询：{{ formatDateTime(lastQueriedAt) }}</span>
          </div>
        </div>
      </template>

      <div class="flow-summary">
        <div class="summary-item income-summary">
          <span>收入合计</span>
          <strong>+ ¥{{ formatMoney(incomeTotal) }}</strong>
        </div>
        <div class="summary-item expense-summary">
          <span>支出合计</span>
          <strong>- ¥{{ formatMoney(expenseTotal) }}</strong>
        </div>
        <div class="summary-item">
          <span>收支净额</span>
          <strong :class="netAmount >= 0 ? 'amount-income' : 'amount-expense'">{{ netAmount >= 0 ? '+' : '-' }} ¥{{ formatMoney(Math.abs(netAmount)) }}</strong>
        </div>
        <div class="summary-item">
          <span>当前结果</span>
          <strong>{{ filteredFundingRows.length }} 笔</strong>
        </div>
      </div>

      <el-table v-loading="syncing" :data="pagedFundingRows" stripe :row-key="bankFlowRowKey">
        <el-table-column prop="bankTime" label="交易时间" width="175">
          <template #default="{ row }">{{ formatDateTime(row.bankTime) }}</template>
        </el-table-column>
        <el-table-column label="收支" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="bankDirectionType[row.direction]" effect="light">{{ bankDirectionText[row.direction] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="企业" min-width="190" show-overflow-tooltip>
          <template #default="{ row }">
            <div>{{ row.companyName || '-' }}</div>
            <div class="cell-subtext">{{ row.companyNo || row.companyId || '-' }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="subAccountNoMasked" label="子单元账号" min-width="150">
          <template #default="{ row }">{{ row.subAccountNoMasked || '-' }}</template>
        </el-table-column>
        <el-table-column prop="bankSerialNo" label="银行流水号" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">{{ row.bankSerialNo || '-' }}</template>
        </el-table-column>
        <el-table-column prop="counterpartyAccountMasked" label="对方账号" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">{{ row.counterpartyAccountMasked || '-' }}</template>
        </el-table-column>
        <el-table-column prop="purposeMasked" label="交易摘要" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">{{ row.purposeMasked || '-' }}</template>
        </el-table-column>
        <el-table-column label="收入" width="135" align="right">
          <template #default="{ row }">
            <strong v-if="row.direction === 'INCOME' && row.amount != null" class="amount-income">+ ¥{{ formatMoney(row.amount) }}</strong>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="支出" width="135" align="right">
          <template #default="{ row }">
            <strong v-if="row.direction === 'EXPENSE' && row.amount != null" class="amount-expense">- ¥{{ formatMoney(row.amount) }}</strong>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="余额" width="135" align="right">
          <template #default="{ row }">{{ row.balance == null ? '-' : `¥${formatMoney(row.balance)}` }}</template>
        </el-table-column>
        <template #empty>
          <el-empty description="当前查询范围暂无银行收支流水" />
        </template>
      </el-table>

      <pagination
        v-show="filteredFundingRows.length > 0"
        v-model:page="fundingQuery.pageNum"
        v-model:limit="fundingQuery.pageSize"
        :total="filteredFundingRows.length"
      />
    </el-card>

    <el-card v-else shadow="hover">
      <template #header>
        <div class="toolbar">
          <div>
            <strong>对账文件任务</strong>
            <div class="hint">银行文件完成后由后端校验并转存私有 OSS</div>
          </div>
          <div>
            <el-button v-hasPermi="['settlement:receipt:create']" type="primary" plain @click="payrollVisible = true">提交代发回单</el-button>
            <el-button v-hasPermi="['settlement:receipt:create']" type="success" plain @click="statementVisible = true">获取子单元对账单</el-button>
          </div>
        </div>
      </template>
      <el-table v-loading="receiptLoading" :data="receiptRows">
        <el-table-column prop="receiptNo" label="平台回单号" min-width="220" />
        <el-table-column label="类型" min-width="170">
          <template #default="{ row }">{{ row.type === 'PAYROLL_RECEIPT' ? '代发回单' : '子单元交易对账单' }}</template>
        </el-table-column>
        <el-table-column label="日期范围" min-width="190">
          <template #default="{ row }">{{ row.startDate ? `${row.startDate} 至 ${row.endDate}` : '-' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="{ row }"><el-tag :type="receiptStatusType[row.status]">{{ receiptStatusText[row.status] }}</el-tag></template>
        </el-table-column>
        <el-table-column label="操作" width="210" fixed="right">
          <template #default="{ row }">
            <el-button v-hasPermi="['settlement:receipt:query']" link type="primary" :disabled="row.status === 'FETCHED'" @click="refreshResult(row)">查询结果</el-button>
            <el-button v-hasPermi="['settlement:receipt:download']" link type="success" :disabled="row.status !== 'FETCHED'" @click="downloadTask(row)">下载</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="payrollVisible" title="提交代发回单任务" width="480px">
      <el-form label-width="100px"><el-form-item label="付款订单号" required><el-input v-model="paymentNo" maxlength="64" /></el-form-item></el-form>
      <template #footer><el-button @click="payrollVisible = false">取消</el-button><el-button type="primary" :loading="submitting" @click="submitPayroll">提交</el-button></template>
    </el-dialog>

    <el-dialog v-model="statementVisible" title="获取子单元交易对账单" width="520px">
      <el-form label-width="110px">
        <el-form-item label="子单元申请ID" required><el-input v-model="statement.applicationId" /></el-form-item>
        <el-form-item label="交易日期" required><el-date-picker v-model="statement.range" type="daterange" value-format="YYYY-MM-DD" :disabled-date="disableToday" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="statementVisible = false">取消</el-button><el-button type="primary" :loading="submitting" @click="submitStatement">提交</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import {
  downloadReceipt,
  listReceiptTasks,
  queryReceiptResult,
  submitPayrollReceipt,
  submitSubAccountStatement,
  syncFundingFlows,
  type BankFlowDirection,
  type BankFundingFlow,
  type ReceiptTask,
  type ReceiptTaskStatus,
  type SyncFundingResult
} from '@/api/recruitment/settlementReconciliation';

type ActiveTab = 'funding' | 'receipt';
type FundingQueryState = { keyword: string; direction: BankFlowDirection | ''; pageNum: number; pageSize: number };

const AUTO_QUERY_INTERVAL = 5 * 60 * 1000;
const MANUAL_QUERY_INTERVAL = 60 * 1000;
const COOLDOWN_STORAGE_KEY = 'settlement-bank-flow-query-available-at';

const activeTab = ref<ActiveTab>('funding');
const fundingRows = ref<BankFundingFlow[]>([]);
const fundingDateRange = ref<string[]>([todayText(), todayText()]);
const fundingQuery = reactive<FundingQueryState>({ keyword: '', direction: '', pageNum: 1, pageSize: 10 });
const syncing = ref(false);
const manualCooldown = ref(0);
const lastQueriedAt = ref('');
let lastSuccessfulQueryAt = 0;
let autoQueryTimer: number | undefined;
let cooldownTimer: number | undefined;
let delayedInitialQueryTimer: number | undefined;

const receiptLoading = ref(false);
const receiptRows = ref<ReceiptTask[]>([]);
const receiptQuery = reactive({ receiptNo: '', type: '', status: '' });
const submitting = ref(false);
const payrollVisible = ref(false);
const statementVisible = ref(false);
const paymentNo = ref('');
const statement = reactive<{ applicationId: string; range: string[] }>({ applicationId: '', range: [] });

const bankDirectionText: Record<BankFlowDirection, string> = {
  INCOME: '收入',
  EXPENSE: '支出',
  UNKNOWN: '待识别'
};
const bankDirectionType: Record<BankFlowDirection, 'success' | 'warning' | 'danger'> = {
  INCOME: 'success',
  EXPENSE: 'danger',
  UNKNOWN: 'warning'
};
const receiptStatusText: Record<ReceiptTaskStatus, string> = {
  PENDING: '待处理',
  PROCESSING: '处理中',
  FETCHED: '已获取',
  FAILED: '失败'
};
const receiptStatusType: Record<ReceiptTaskStatus, '' | 'success' | 'warning' | 'danger'> = {
  PENDING: 'warning',
  PROCESSING: '',
  FETCHED: 'success',
  FAILED: 'danger'
};

const filteredFundingRows = computed(() => {
  const keyword = fundingQuery.keyword.trim().toLowerCase();
  return fundingRows.value.filter((row) => {
    if (fundingQuery.direction && row.direction !== fundingQuery.direction) return false;
    if (!keyword) return true;
    return [row.bankSerialNo, row.companyName, row.companyNo, row.subAccountNoMasked, row.counterpartyAccountMasked, row.purposeMasked]
      .some((value) => String(value || '').toLowerCase().includes(keyword));
  });
});
const pagedFundingRows = computed(() => {
  const start = (fundingQuery.pageNum - 1) * fundingQuery.pageSize;
  return filteredFundingRows.value.slice(start, start + fundingQuery.pageSize);
});
const incomeTotal = computed(() => sumByDirection('INCOME'));
const expenseTotal = computed(() => sumByDirection('EXPENSE'));
const netAmount = computed(() => incomeTotal.value - expenseTotal.value);
const queryButtonText = computed(() => manualCooldown.value > 0 ? `查询（${manualCooldown.value}秒）` : '查询银行流水');

function applyFundingFilters() {
  fundingQuery.pageNum = 1;
}

function resetFunding() {
  fundingQuery.keyword = '';
  fundingQuery.direction = '';
  fundingQuery.pageNum = 1;
  fundingQuery.pageSize = 10;
  fundingDateRange.value = [todayText(), todayText()];
  fundingRows.value = [];
  lastQueriedAt.value = '';
  if (manualCooldown.value === 0) queryBankFlows(true);
  else scheduleDelayedBankQuery();
}

async function queryBankFlows(manual = false) {
  if (syncing.value || manualCooldown.value > 0) return;
  if (!isFundingDateRangeValid()) return;
  syncing.value = true;
  // 与后端的租户级限流保持一致，避免刷新页面或连点按钮重复消耗银行查询额度。
  startManualCooldown();
  try {
    const result: SyncFundingResult = await syncFundingFlows({
      startDate: fundingDateRange.value[0] || undefined,
      endDate: fundingDateRange.value[1] || undefined
    });
    fundingRows.value = Array.isArray(result?.flows) ? result.flows : [];
    lastQueriedAt.value = result?.queriedAt || new Date().toISOString();
    lastSuccessfulQueryAt = Date.now();
    fundingQuery.pageNum = 1;
    if (manual) ElMessage.success(`查询完成，共获取 ${result.fetched || 0} 笔银行流水`);
  } finally {
    syncing.value = false;
  }
}

function sumByDirection(direction: BankFlowDirection) {
  return filteredFundingRows.value.reduce((total, row) => {
    if (row.direction !== direction) return total;
    const amount = Number(row.amount);
    return Number.isFinite(amount) ? total + amount : total;
  }, 0);
}

function startManualCooldown() {
  localStorage.setItem(COOLDOWN_STORAGE_KEY, String(Date.now() + MANUAL_QUERY_INTERVAL));
  updateManualCooldown();
}

function updateManualCooldown() {
  const availableAt = Number(localStorage.getItem(COOLDOWN_STORAGE_KEY) || 0);
  manualCooldown.value = Math.max(0, Math.ceil((availableAt - Date.now()) / 1000));
  if (manualCooldown.value === 0 && availableAt) localStorage.removeItem(COOLDOWN_STORAGE_KEY);
}

function scheduleInitialBankQuery() {
  updateManualCooldown();
  if (manualCooldown.value === 0) {
    queryBankFlows(false);
    return;
  }
  scheduleDelayedBankQuery();
}

function scheduleDelayedBankQuery() {
  if (delayedInitialQueryTimer) window.clearTimeout(delayedInitialQueryTimer);
  delayedInitialQueryTimer = window.setTimeout(() => queryBankFlows(false), manualCooldown.value * 1000 + 300);
}

function isFundingDateRangeValid() {
  if (fundingDateRange.value.length !== 2) {
    ElMessage.warning('请选择完整的交易日期范围');
    return false;
  }
  const start = new Date(`${fundingDateRange.value[0]}T00:00:00`);
  const end = new Date(`${fundingDateRange.value[1]}T00:00:00`);
  const days = Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  if (!Number.isFinite(days) || days < 0 || days > 30) {
    ElMessage.warning('单次最多查询 31 天银行流水');
    return false;
  }
  return true;
}

function bankFlowRowKey(row: BankFundingFlow) {
  return [row.applicationId, row.bankSerialNo, row.bankTime, row.direction, row.counterpartyAccountMasked, row.amount].join('-');
}

async function loadReceipts() {
  receiptLoading.value = true;
  try {
    receiptRows.value = (await listReceiptTasks(receiptQuery)).data || [];
  } finally {
    receiptLoading.value = false;
  }
}

function resetReceipts() {
  receiptQuery.receiptNo = '';
  receiptQuery.type = '';
  receiptQuery.status = '';
  loadReceipts();
}

function loadActiveTab() {
  if (activeTab.value === 'receipt') {
    loadReceipts();
  } else if (!fundingRows.value.length && manualCooldown.value === 0) {
    queryBankFlows(false);
  }
}

async function submitPayroll() {
  if (!paymentNo.value.trim()) return ElMessage.warning('请输入付款订单号');
  submitting.value = true;
  try {
    await submitPayrollReceipt(paymentNo.value.trim());
    payrollVisible.value = false;
    paymentNo.value = '';
    ElMessage.success('任务已提交');
    await loadReceipts();
  } finally {
    submitting.value = false;
  }
}

async function submitStatement() {
  if (!statement.applicationId || statement.range.length !== 2) return ElMessage.warning('请填写子单元申请ID和日期范围');
  submitting.value = true;
  try {
    await submitSubAccountStatement({ applicationId: statement.applicationId, startDate: statement.range[0], endDate: statement.range[1] });
    statementVisible.value = false;
    statement.applicationId = '';
    statement.range = [];
    ElMessage.success('任务已提交');
    await loadReceipts();
  } finally {
    submitting.value = false;
  }
}

async function refreshResult(row: ReceiptTask) {
  await queryReceiptResult(row.receiptNo);
  ElMessage.success('任务状态已更新');
  await loadReceipts();
}

async function downloadTask(row: ReceiptTask) {
  const response: any = await downloadReceipt(row.receiptNo);
  const blob = response instanceof Blob ? response : response.data;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${row.receiptNo}.zip`;
  link.click();
  URL.revokeObjectURL(url);
}

function formatMoney(value?: string | number) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '0.00';
  return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDateTime(value?: string) {
  return value ? value.replace('T', ' ').replace(/\.\d+$/, '') : '-';
}

function todayText() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

function handleVisibilityChange() {
  if (document.visibilityState === 'visible' && Date.now() - lastSuccessfulQueryAt >= AUTO_QUERY_INTERVAL) {
    queryBankFlows(false);
  }
}

const disableToday = (date: Date) => date.getTime() >= new Date(new Date().setHours(0, 0, 0, 0)).getTime();
const disableFutureFundingDate = (date: Date) => date.getTime() > new Date(new Date().setHours(23, 59, 59, 999)).getTime();
onMounted(() => {
  scheduleInitialBankQuery();
  cooldownTimer = window.setInterval(updateManualCooldown, 1000);
  autoQueryTimer = window.setInterval(() => {
    if (activeTab.value === 'funding' && document.visibilityState === 'visible') queryBankFlows(false);
  }, AUTO_QUERY_INTERVAL);
  document.addEventListener('visibilitychange', handleVisibilityChange);
});
onBeforeUnmount(() => {
  if (autoQueryTimer) window.clearInterval(autoQueryTimer);
  if (cooldownTimer) window.clearInterval(cooldownTimer);
  if (delayedInitialQueryTimer) window.clearTimeout(delayedInitialQueryTimer);
  document.removeEventListener('visibilitychange', handleVisibilityChange);
});
</script>

<style scoped>
.filter-card :deep(.el-tabs__content) { padding-top: 6px; }
.filter-card :deep(.el-tabs__header) { margin-bottom: 18px; }
.toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.hint { margin-top: 6px; color: var(--el-text-color-secondary); font-size: 13px; font-weight: normal; }
.refresh-meta { display: flex; align-items: center; gap: 12px; color: var(--el-text-color-secondary); font-size: 13px; }
.flow-summary { display: grid; grid-template-columns: repeat(4, minmax(160px, 1fr)); gap: 12px; margin-bottom: 16px; }
.summary-item { display: flex; flex-direction: column; gap: 8px; padding: 14px 16px; border: 1px solid var(--el-border-color-lighter); border-radius: 10px; background: var(--el-fill-color-lighter); }
.summary-item span { color: var(--el-text-color-secondary); font-size: 13px; }
.summary-item strong { color: var(--el-text-color-primary); font-size: 20px; }
.income-summary { background: var(--el-color-success-light-9); }
.expense-summary { background: var(--el-color-danger-light-9); }
.amount-income { color: var(--el-color-success) !important; }
.amount-expense { color: var(--el-color-danger) !important; }
.cell-subtext { margin-top: 3px; color: var(--el-text-color-secondary); font-size: 12px; }

@media (max-width: 768px) {
  .toolbar { align-items: flex-start; flex-direction: column; }
  .refresh-meta { align-items: flex-start; flex-direction: column; }
  .flow-summary { grid-template-columns: repeat(2, minmax(140px, 1fr)); }
}
</style>
