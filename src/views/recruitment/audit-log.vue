<!--
  运营台 · 审计日志页
  ----------------------------------------------------------------------------
  组件职责：以列表形式呈现平台运营端的关键操作留痕（谁 / 何时 / 做了什么 / 针对哪个对象），
            支持按 操作人 / 时间范围 / 动作 / 目标类型 / 业务编号 检索，并导出为 Excel。
  数据来源：后端 AdminAuditLogController(/admin/auditLog)，对应 rec_audit_log 表；
            字段映射见 @/api/recruitment 的 AuditLogVO（operName/operTime/action/targetType/targetNo …）。
  注意事项：
    - 列表为 GET /admin/auditLog/list，返回 TableDataInfo(rows/total)。
    - 时间范围使用 datetimerange 控件，拆分为 beginTime/endTime（基于 oper_time 过滤）。
    - 导出走 utils/request 的 download(POST + form-urlencoded)，与后端 @PostMapping("/export") 对齐。
    - action / targetType 在后端为精确匹配(eq)，故下拉项的 value 必须与各业务模块写入的中文字典值一致。
-->
<template>
  <div class="audit-log-container">
    <!-- ========== 搜索栏 ========== -->
    <el-card shadow="hover" class="mb-4">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true">
        <el-form-item label="操作人" prop="operName">
          <el-input v-model="queryParams.operName" placeholder="操作人名称" clearable style="width: 150px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="操作人ID" prop="operId">
          <el-input v-model="queryParams.operId" placeholder="操作人ID" clearable style="width: 130px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="操作动作" prop="action">
          <el-select v-model="queryParams.action" placeholder="全部" clearable filterable allow-create style="width: 140px">
            <el-option v-for="item in actionOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="目标类型" prop="targetType">
          <el-select v-model="queryParams.targetType" placeholder="全部" clearable filterable allow-create style="width: 130px">
            <el-option v-for="item in targetTypeOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="业务编号" prop="targetNo">
          <el-input v-model="queryParams.targetNo" placeholder="目标业务编号" clearable style="width: 150px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="操作时间" prop="dateRange">
          <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            value-format="YYYY-MM-DD HH:mm:ss"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            style="width: 360px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
          <el-button type="success" plain icon="Download" @click="handleExport">导出</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- ========== 数据表格 ========== -->
    <el-card shadow="hover">
      <el-table v-loading="loading" :data="tableData" border stripe>
        <el-table-column label="日志ID" prop="logId" width="180" align="center" show-overflow-tooltip />
        <el-table-column label="操作人" min-width="140">
          <template #default="{ row }">
            <div class="oper-cell">
              <div class="name">{{ row.operName || '未知' }}</div>
              <div class="oper-id">ID: {{ row.operId ?? '-' }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作时间" prop="operTime" width="170" align="center" />
        <el-table-column label="操作动作" width="110" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="actionTagType(row.action)">{{ row.action || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="目标类型" prop="targetType" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" effect="plain" type="info">{{ row.targetType || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="业务编号" prop="targetNo" width="140" align="center" show-overflow-tooltip />
        <el-table-column label="状态变更" width="160" align="center">
          <template #default="{ row }">
            <span v-if="row.beforeStatus || row.afterStatus" class="status-change">
              <span class="before">{{ row.beforeStatus || '·' }}</span>
              <span class="arrow"> → </span>
              <span class="after">{{ row.afterStatus || '·' }}</span>
            </span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作明细" prop="detail" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">
            <span>{{ row.detail || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right" align="center">
          <template #default="{ row }">
            <div style="display: flex; align-items: center; justify-content: center; gap: 8px">
              <el-button link type="primary" icon="View" @click="handleDetail(row)">详情</el-button>
              <el-button link type="primary" icon="Tickets" @click="handleHistory(row)">历史</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="loadData" />
    </el-card>

    <!-- ========== 日志详情对话框 ========== -->
    <el-dialog v-model="detailVisible" title="审计日志详情" width="640px" append-to-body>
      <el-descriptions v-if="currentLog" :column="1" border>
        <el-descriptions-item label="日志ID">{{ currentLog.logId }}</el-descriptions-item>
        <el-descriptions-item label="操作人">{{ currentLog.operName || '-' }}（ID: {{ currentLog.operId ?? '-' }}）</el-descriptions-item>
        <el-descriptions-item label="操作时间">{{ currentLog.operTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="操作动作">
          <el-tag size="small" :type="actionTagType(currentLog.action)">{{ currentLog.action || '-' }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="目标类型">{{ currentLog.targetType || '-' }}</el-descriptions-item>
        <el-descriptions-item label="业务编号">{{ currentLog.targetNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="操作前状态">{{ currentLog.beforeStatus || '-' }}</el-descriptions-item>
        <el-descriptions-item label="操作后状态">{{ currentLog.afterStatus || '-' }}</el-descriptions-item>
        <el-descriptions-item label="操作明细">
          <div class="detail-text">{{ currentLog.detail || '无' }}</div>
        </el-descriptions-item>
        <el-descriptions-item label="备注">{{ currentLog.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- ========== 对象历史对话框（按 目标类型 + 业务编号 回溯该对象全部留痕） ========== -->
    <el-dialog v-model="historyVisible" title="对象操作历史" width="780px" append-to-body>
      <div v-if="historyTarget" class="history-head">
        目标：<el-tag size="small" effect="plain" type="info">{{ historyTarget.targetType }}</el-tag>
        <span class="history-no">#{{ historyTarget.targetNo }}</span>
      </div>
      <el-table v-loading="historyLoading" :data="historyData" border stripe max-height="420">
        <el-table-column label="操作时间" prop="operTime" width="170" align="center" />
        <el-table-column label="操作人" prop="operName" width="120" align="center" />
        <el-table-column label="动作" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="actionTagType(row.action)">{{ row.action || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态变更" width="150" align="center">
          <template #default="{ row }">
            <span v-if="row.beforeStatus || row.afterStatus">{{ row.beforeStatus || '·' }} → {{ row.afterStatus || '·' }}</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="明细" prop="detail" min-width="200" show-overflow-tooltip />
      </el-table>
      <template #footer>
        <el-button @click="historyVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { listAuditLog, getAuditHistory, auditLogExportUrl, type AuditLogVO } from '@/api/recruitment';
import { download } from '@/utils/request';
import { unwrapList } from './helpers';

const loading = ref(false);
const total = ref(0);
const tableData = ref<AuditLogVO[]>([]);
const queryFormRef = ref();

// 时间范围控件值（[开始, 结束]），提交前拆分为 queryParams.beginTime/endTime
const dateRange = ref<[string, string] | []>([]);

const detailVisible = ref(false);
const currentLog = ref<AuditLogVO | null>(null);

const historyVisible = ref(false);
const historyLoading = ref(false);
const historyData = ref<AuditLogVO[]>([]);
const historyTarget = ref<{ targetType: string; targetNo: string } | null>(null);

// 下拉候选：与各业务模块写入 rec_audit_log 的中文字典值一致；后端为精确匹配。
// 允许 allow-create，遇到新值也可手动检索，避免硬编码遗漏。
const actionOptions = ['审核', '导出', '状态变更', '禁言', '解禁', '发票', '删除'];
const targetTypeOptions = ['企业', '岗位', '投递', '台账', '发票', '求职者'];

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  operName: '',
  operId: undefined as number | undefined,
  action: '',
  targetType: '',
  targetNo: '',
  beginTime: '',
  endTime: ''
});

// 将日期范围控件值同步进 queryParams（后端按 oper_time 做 ge/le 过滤）
function syncDateRange() {
  if (dateRange.value && dateRange.value.length === 2) {
    queryParams.beginTime = dateRange.value[0];
    queryParams.endTime = dateRange.value[1];
  } else {
    queryParams.beginTime = '';
    queryParams.endTime = '';
  }
}

async function loadData() {
  loading.value = true;
  try {
    syncDateRange();
    const res = await listAuditLog(queryParams);
    const list = unwrapList<AuditLogVO>(res);
    tableData.value = list.rows;
    total.value = list.total;
  } catch (error) {
    console.error('加载审计日志失败:', error);
  } finally {
    loading.value = false;
  }
}

function handleQuery() {
  queryParams.pageNum = 1;
  loadData();
}

function resetQuery() {
  queryFormRef.value?.resetFields();
  dateRange.value = [];
  queryParams.operId = undefined;
  queryParams.action = '';
  queryParams.targetType = '';
  queryParams.beginTime = '';
  queryParams.endTime = '';
  queryParams.pageNum = 1;
  loadData();
}

function handleDetail(row: AuditLogVO) {
  currentLog.value = row;
  detailVisible.value = true;
}

// 按当前行的 目标类型 + 业务编号 拉取该对象的全部历史留痕
async function handleHistory(row: AuditLogVO) {
  if (!row.targetType || !row.targetNo) {
    ElMessage.warning('该记录缺少目标类型或业务编号，无法回溯历史');
    return;
  }
  historyTarget.value = { targetType: row.targetType, targetNo: row.targetNo };
  historyVisible.value = true;
  historyLoading.value = true;
  try {
    const res = await getAuditHistory({ targetType: row.targetType, targetNo: row.targetNo });
    historyData.value = res.data || [];
  } catch (error) {
    ElMessage.error('获取对象历史失败');
    historyData.value = [];
  } finally {
    historyLoading.value = false;
  }
}

// 导出：复用 download(POST + form-urlencoded)，参数同列表检索条件
function handleExport() {
  syncDateRange();
  download(auditLogExportUrl, { ...queryParams }, `审计日志_${new Date().getTime()}.xlsx`);
}

// 动作 → tag 颜色映射，仅用于视觉区分，不影响检索
function actionTagType(action?: string) {
  switch (action) {
    case '审核':
      return 'primary';
    case '状态变更':
      return 'warning';
    case '禁言':
    case '删除':
      return 'danger';
    case '解禁':
      return 'success';
    case '导出':
      return 'info';
    default:
      return 'info';
  }
}

loadData();
</script>

<style scoped>
.audit-log-container {
  padding: 16px;
}

.mb-4 {
  margin-bottom: 14px;
}

/* 操作人单元格 */
.oper-cell .name {
  font-weight: 600;
  color: #303133;
  font-size: 13px;
}
.oper-cell .oper-id {
  font-size: 11px;
  color: #909399;
  margin-top: 2px;
}

/* 状态变更展示 */
.status-change {
  font-size: 12px;
}
.status-change .before {
  color: #909399;
}
.status-change .arrow {
  color: #2b7fff;
  font-weight: 600;
}
.status-change .after {
  color: #303133;
  font-weight: 600;
}

.text-muted {
  color: #c0c4cc;
  font-size: 12px;
}

.detail-text {
  white-space: pre-wrap;
  line-height: 1.6;
  color: #606266;
}

/* 历史对话框头部 */
.history-head {
  margin-bottom: 12px;
  font-size: 13px;
  color: #606266;
}
.history-head .history-no {
  margin-left: 8px;
  font-weight: 600;
  color: #2b7fff;
}
</style>
