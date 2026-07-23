<!-- 归集资金流水读取本地 NTDMATRX 持久化记录；对账文件任务继续独立展示，避免把银行文件任务与资金状态混为一类。 -->
<template>
  <div class="p-4">
    <el-card shadow="hover" class="mb-4 filter-card">
      <el-tabs v-model="activeTab" @tab-change="loadActiveTab">
        <el-tab-pane label="归集资金流水" name="funding">
          <el-form :model="fundingQuery" inline>
            <el-form-item label="流水检索">
              <el-input
                v-model="fundingQuery.keyword"
                clearable
                placeholder="平台请求号 / 银行流水号"
                style="width: 260px"
                @keyup.enter="handleFundingSearch"
              />
            </el-form-item>
            <el-form-item label="归集状态">
              <el-select v-model="fundingQuery.status" clearable placeholder="全部" style="width: 150px">
                <el-option label="处理中" value="PROCESSING" />
                <el-option label="成功" value="SUCCESS" />
                <el-option label="失败" value="FAILED" />
                <el-option label="待确认" value="UNKNOWN" />
              </el-select>
            </el-form-item>
            <el-form-item label="归集日期">
              <el-date-picker
                v-model="fundingDateRange"
                type="daterange"
                value-format="YYYY-MM-DD"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                style="width: 260px"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleFundingSearch">查询</el-button>
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
            <strong>归集资金流水</strong>
            <div class="hint">展示企业子单元通过 NTDMATRX 归集至主账号的本地资金记录</div>
          </div>
          <el-button icon="Refresh" @click="loadFunding">刷新</el-button>
        </div>
      </template>

      <el-table v-loading="fundingLoading" :data="fundingRows" stripe>
        <el-table-column prop="createTime" label="归集时间" width="170">
          <template #default="{ row }">{{ formatDateTime(row.createTime) }}</template>
        </el-table-column>
        <el-table-column label="企业" min-width="190" show-overflow-tooltip>
          <template #default="{ row }">
            <div>{{ row.companyName || '-' }}</div>
            <div class="cell-subtext">{{ row.companyNo || row.companyId }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="subAccountNoMasked" label="子单元账号" min-width="150">
          <template #default="{ row }">{{ row.subAccountNoMasked || '-' }}</template>
        </el-table-column>
        <el-table-column prop="requestNo" label="平台请求号" min-width="190" show-overflow-tooltip />
        <el-table-column prop="bankSerialNo" label="银行流水号" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">{{ row.bankSerialNo || '-' }}</template>
        </el-table-column>
        <el-table-column prop="orderNo" label="台账号" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">{{ row.orderNo || '-' }}</template>
        </el-table-column>
        <el-table-column label="台账金额" width="130" align="right">
          <template #default="{ row }">¥{{ formatMoney(row.ledgerAmount) }}</template>
        </el-table-column>
        <el-table-column label="抽佣" width="145" align="right">
          <template #default="{ row }">
            <div>¥{{ formatMoney(row.commissionAmount) }}</div>
            <div class="cell-subtext">{{ formatPercent(row.commissionRate) }}</div>
          </template>
        </el-table-column>
        <el-table-column label="归集金额" width="135" align="right">
          <template #default="{ row }"><strong>¥{{ formatMoney(row.transferAmount) }}</strong></template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="fundingStatusType[row.status]">{{ fundingStatusText[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="银行结果" min-width="165" show-overflow-tooltip>
          <template #default="{ row }">
            <div>{{ row.bankResponseCode || row.failureCode || '-' }}</div>
            <div v-if="row.failureMessage" class="cell-error">{{ row.failureMessage }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="operatorName" label="操作人" width="120">
          <template #default="{ row }">{{ row.operatorName || '-' }}</template>
        </el-table-column>
      </el-table>

      <pagination
        v-show="fundingTotal > 0"
        v-model:page="fundingQuery.pageNum"
        v-model:limit="fundingQuery.pageSize"
        :total="fundingTotal"
        @pagination="loadFunding"
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
  listFundingFlows,
  listReceiptTasks,
  queryReceiptResult,
  submitPayrollReceipt,
  submitSubAccountStatement,
  type FundingFlow,
  type FundingFlowQuery,
  type FundingFlowStatus,
  type ReceiptTask,
  type ReceiptTaskStatus
} from '@/api/recruitment/settlementReconciliation';

type ActiveTab = 'funding' | 'receipt';

const activeTab = ref<ActiveTab>('funding');
const fundingLoading = ref(false);
const fundingRows = ref<FundingFlow[]>([]);
const fundingTotal = ref(0);
const fundingDateRange = ref<string[]>([]);
const fundingQuery = reactive<FundingFlowQuery>({ keyword: '', status: '', pageNum: 1, pageSize: 10 });

const receiptLoading = ref(false);
const receiptRows = ref<ReceiptTask[]>([]);
const receiptQuery = reactive({ receiptNo: '', type: '', status: '' });
const submitting = ref(false);
const payrollVisible = ref(false);
const statementVisible = ref(false);
const paymentNo = ref('');
const statement = reactive<{ applicationId: string; range: string[] }>({ applicationId: '', range: [] });

const fundingStatusText: Record<FundingFlowStatus, string> = {
  PROCESSING: '处理中',
  SUCCESS: '成功',
  FAILED: '失败',
  UNKNOWN: '待确认'
};
const fundingStatusType: Record<FundingFlowStatus, '' | 'success' | 'warning' | 'danger'> = {
  PROCESSING: '',
  SUCCESS: 'success',
  FAILED: 'danger',
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

async function loadFunding() {
  fundingLoading.value = true;
  try {
    // 日期只按自然日传给后端，分页与固定倒序由服务端统一控制。
    const response = await listFundingFlows({
      ...fundingQuery,
      keyword: fundingQuery.keyword?.trim() || undefined,
      status: fundingQuery.status || undefined,
      startDate: fundingDateRange.value[0] || undefined,
      endDate: fundingDateRange.value[1] || undefined
    });
    fundingRows.value = Array.isArray(response?.rows) ? response.rows : [];
    fundingTotal.value = Number(response?.total || 0);
  } finally {
    fundingLoading.value = false;
  }
}

function handleFundingSearch() {
  fundingQuery.pageNum = 1;
  loadFunding();
}

function resetFunding() {
  fundingQuery.keyword = '';
  fundingQuery.status = '';
  fundingQuery.pageNum = 1;
  fundingQuery.pageSize = 10;
  fundingDateRange.value = [];
  loadFunding();
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
  if (activeTab.value === 'funding') loadFunding();
  else loadReceipts();
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

function formatPercent(value?: string | number) {
  const rate = Number(value);
  return Number.isFinite(rate) ? `${rate.toFixed(1)}%` : '-';
}

function formatDateTime(value?: string) {
  return value || '-';
}

const disableToday = (date: Date) => date.getTime() >= new Date(new Date().setHours(0, 0, 0, 0)).getTime();
onMounted(loadFunding);
</script>

<style scoped>
.filter-card :deep(.el-tabs__content) { padding-top: 6px; }
.filter-card :deep(.el-tabs__header) { margin-bottom: 18px; }
.toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.hint { margin-top: 6px; color: var(--el-text-color-secondary); font-size: 13px; font-weight: normal; }
.cell-subtext { margin-top: 3px; color: var(--el-text-color-secondary); font-size: 12px; }
.cell-error { margin-top: 3px; color: var(--el-color-danger); font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

@media (max-width: 768px) {
  .toolbar { align-items: flex-start; flex-direction: column; }
}
</style>
