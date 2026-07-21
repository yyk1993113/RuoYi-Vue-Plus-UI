<!-- 招行异步回单/对账单管理。页面只使用平台回单编号，不展示银行任务号或临时下载地址。 -->
<template>
  <div class="p-4">
    <el-card shadow="hover" class="mb-4">
      <el-form :model="query" inline>
        <el-form-item label="平台回单号">
          <el-input v-model="query.receiptNo" clearable placeholder="请输入平台回单号" @keyup.enter="load" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="query.type" clearable placeholder="全部" style="width: 190px">
            <el-option label="代发回单" value="PAYROLL_RECEIPT" />
            <el-option label="子单元交易对账单" value="SUB_ACCOUNT_STATEMENT" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" clearable placeholder="全部" style="width: 150px">
            <el-option label="待处理" value="PENDING" />
            <el-option label="处理中" value="PROCESSING" />
            <el-option label="已获取" value="FETCHED" />
            <el-option label="失败" value="FAILED" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="load">查询</el-button>
          <el-button icon="Refresh" @click="reset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="hover">
      <template #header>
        <div class="toolbar">
          <div>
            <strong>对账管理</strong>
            <div class="hint">银行文件完成后由后端校验并转存私有 OSS</div>
          </div>
          <div>
            <el-button v-hasPermi="['settlement:receipt:create']" type="primary" plain @click="payrollVisible = true">提交代发回单</el-button>
            <el-button v-hasPermi="['settlement:receipt:create']" type="success" plain @click="statementVisible = true">获取子单元对账单</el-button>
          </div>
        </div>
      </template>
      <el-table v-loading="loading" :data="rows">
        <el-table-column prop="receiptNo" label="平台回单号" min-width="220" />
        <el-table-column label="类型" min-width="170">
          <template #default="{ row }">{{ row.type === 'PAYROLL_RECEIPT' ? '代发回单' : '子单元交易对账单' }}</template>
        </el-table-column>
        <el-table-column label="日期范围" min-width="190">
          <template #default="{ row }">{{ row.startDate ? `${row.startDate} 至 ${row.endDate}` : '-' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="{ row }"><el-tag :type="statusType[row.status]">{{ statusText[row.status] }}</el-tag></template>
        </el-table-column>
        <el-table-column label="操作" width="210" fixed="right">
          <template #default="{ row }">
            <el-button v-hasPermi="['settlement:receipt:query']" link type="primary" :disabled="row.status === 'FETCHED'" @click="refreshResult(row)">查询结果</el-button>
            <el-button v-hasPermi="['settlement:receipt:download']" link type="success" :disabled="row.status !== 'FETCHED'" @click="download(row)">下载</el-button>
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
  downloadReceipt, listReceiptTasks, queryReceiptResult, submitPayrollReceipt, submitSubAccountStatement,
  type ReceiptTask, type ReceiptTaskStatus
} from '@/api/recruitment/settlementReconciliation';

const loading = ref(false);
const submitting = ref(false);
const rows = ref<ReceiptTask[]>([]);
const query = reactive({ receiptNo: '', type: '', status: '' });
const payrollVisible = ref(false);
const statementVisible = ref(false);
const paymentNo = ref('');
const statement = reactive<{ applicationId: string; range: string[] }>({ applicationId: '', range: [] });
const statusText: Record<ReceiptTaskStatus, string> = { PENDING: '待处理', PROCESSING: '处理中', FETCHED: '已获取', FAILED: '失败' };
const statusType: Record<ReceiptTaskStatus, '' | 'success' | 'warning' | 'danger'> = { PENDING: 'warning', PROCESSING: '', FETCHED: 'success', FAILED: 'danger' };

async function load() {
  loading.value = true;
  try { rows.value = (await listReceiptTasks(query)).data || []; } finally { loading.value = false; }
}

function reset() { query.receiptNo = ''; query.type = ''; query.status = ''; load(); }

async function submitPayroll() {
  if (!paymentNo.value.trim()) return ElMessage.warning('请输入付款订单号');
  submitting.value = true;
  try { await submitPayrollReceipt(paymentNo.value.trim()); payrollVisible.value = false; paymentNo.value = ''; ElMessage.success('任务已提交'); await load(); }
  finally { submitting.value = false; }
}

async function submitStatement() {
  if (!statement.applicationId || statement.range.length !== 2) return ElMessage.warning('请填写子单元申请ID和日期范围');
  submitting.value = true;
  try {
    await submitSubAccountStatement({ applicationId: statement.applicationId, startDate: statement.range[0], endDate: statement.range[1] });
    statementVisible.value = false; statement.applicationId = ''; statement.range = []; ElMessage.success('任务已提交'); await load();
  } finally { submitting.value = false; }
}

async function refreshResult(row: ReceiptTask) { await queryReceiptResult(row.receiptNo); ElMessage.success('任务状态已更新'); await load(); }

async function download(row: ReceiptTask) {
  const response: any = await downloadReceipt(row.receiptNo);
  const blob = response instanceof Blob ? response : response.data;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a'); link.href = url; link.download = `${row.receiptNo}.zip`; link.click(); URL.revokeObjectURL(url);
}

const disableToday = (date: Date) => date.getTime() >= new Date(new Date().setHours(0, 0, 0, 0)).getTime();
onMounted(load);
</script>

<style scoped>
.toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.hint { margin-top: 6px; color: var(--el-text-color-secondary); font-size: 13px; font-weight: normal; }
</style>
