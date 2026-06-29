<template>
  <!--
    结算台账管理（运营/平台方）。
    资金主线出口：核验通过自动生成「待结算」台账 → 运营在此「标记已结算」(单条/批量) → 绑定发票/开票。
    数据来源：AdminRecruitmentController /admin/recruitment/ledger/{list,{id},statistics,settle}。
  -->
  <div class="p-4">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="mb-4">
      <el-col :span="8">
        <el-card shadow="hover" class="stat-mini-card">
          <div class="stat-mini">
            <span class="label">台账总数</span>
            <span class="value">{{ statistics.totalCount || 0 }}</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-mini-card success">
          <div class="stat-mini">
            <span class="label">累计金额</span>
            <span class="value success">¥{{ formatMoney(statistics.totalAmount) }}</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
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
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
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
        <el-descriptions-item label="岗位编号">{{ currentLedger.jobId ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="投递编号">{{ currentLedger.applyId ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="企业">{{ currentLedger.companyName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="用户">{{ currentLedger.userName || '-' }}</el-descriptions-item>
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
        <el-descriptions-item label="任务ID">{{ currentLedger.taskId }}</el-descriptions-item>
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
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { listLedger, getLedgerStatistics, getLedger, settleLedger } from '@/api/recruitment';
import { unwrapList, formatMoney } from './helpers';
// 台账结算状态(0待结算/1已结算/2已取消) 与 发票绑定状态(0未绑定/1已绑定) → el-tag 文案/颜色，映射集中在 constants.ts
import { ledgerStatusMeta, ledgerInvoiceStatusMeta } from './constants';

const loading = ref(false);
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
  todayAmount: 0
});

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
    Object.assign(statistics, res.data || {});
  } catch (error) {
    console.error('加载台账统计失败:', error);
  }
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
  }
  loadData();
  loadStatistics();
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

.stat-mini-card {
  text-align: center;
}
.stat-mini {
  display: flex;
  flex-direction: column;
  align-items: center;
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
