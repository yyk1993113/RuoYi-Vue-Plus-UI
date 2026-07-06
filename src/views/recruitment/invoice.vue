<template>
  <div class="p-4">
    <!-- 统计卡片：数据来源 getInvoiceStatistics(/admin/recruitment/invoice/statistics) -->
    <el-row :gutter="20" class="mb-4">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-mini-card">
          <div class="stat-mini">
            <span class="label">发票总数</span>
            <span class="value">{{ statistics.totalCount || 0 }}</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-mini-card warning">
          <div class="stat-mini">
            <span class="label">未开票</span>
            <span class="value warning">{{ statistics.pendingCount || 0 }}</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-mini-card success">
          <div class="stat-mini">
            <span class="label">已开票</span>
            <span class="value success">{{ statistics.issuedCount || 0 }}</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-mini-card danger">
          <div class="stat-mini">
            <span class="label">已作废</span>
            <span class="value danger">{{ statistics.cancelledCount || 0 }}</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 搜索栏 -->
    <el-card shadow="hover" class="mb-4">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true">
        <el-form-item label="企业" prop="companyId">
          <el-input v-model="queryParams.companyId" placeholder="企业ID" clearable @keyup.enter="handleQuery" style="width: 120px" />
        </el-form-item>
        <el-form-item label="台账" prop="ledgerId">
          <el-input v-model="queryParams.ledgerId" placeholder="台账ID" clearable @keyup.enter="handleQuery" style="width: 120px" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="未开票" value="0" />
            <el-option label="已开票" value="1" />
            <el-option label="已作废" value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据表格：列表数据来源 listInvoiceManage(/admin/invoice-manage/list)，含金额/上传人/绑定台账号 -->
    <el-card shadow="hover">
      <template #header>
        <el-row :gutter="10">
          <el-col :span="1.5">
            <el-button type="primary" icon="Upload" @click="handleUploadOpen">上传发票</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="primary" plain icon="Refresh" @click="loadData">刷新</el-button>
          </el-col>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="tableData" border stripe>
        <el-table-column label="发票编号" width="190" align="center">
          <template #default="{ row }">
            <span>{{ row.invoiceNo || row.invoiceId }}</span>
          </template>
        </el-table-column>
        <el-table-column label="企业ID" prop="companyId" width="100" align="center" />
        <el-table-column label="金额(元)" width="120" align="right">
          <template #default="{ row }">
            <span v-if="row.amount != null" class="amount-text">{{ formatMoney(row.amount) }}</span>
            <span v-else class="text-secondary">-</span>
          </template>
        </el-table-column>
        <el-table-column label="绑定台账" min-width="150" align="center">
          <template #default="{ row }">
            <div v-if="row.ledgerId">
              <div>{{ row.ledgerOrderNo || '台账#' + row.ledgerId }}</div>
              <el-button link type="primary" size="small" @click="handleBindOpen(row)">改绑</el-button>
            </div>
            <el-button v-else link type="primary" @click="handleBindOpen(row)">绑定台账</el-button>
          </template>
        </el-table-column>
        <el-table-column label="上传人" prop="createByName" width="120" align="center">
          <template #default="{ row }">
            <span>{{ row.createByName || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="invoiceStatusMeta(row.status).type">{{ invoiceStatusMeta(row.status).label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="发票文件" min-width="120" align="center">
          <template #default="{ row }">
            <el-button v-if="row.filePath" link type="primary" @click="previewFile(row.filePath)">查看文件</el-button>
            <span v-else class="text-secondary">暂无文件</span>
          </template>
        </el-table-column>
        <el-table-column label="上传时间" prop="createTime" width="160" align="center" />
        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <div style="display: flex; align-items: center; justify-content: center; gap: 8px">
              <el-button link type="primary" icon="View" @click="handleDetail(row)">详情</el-button>
              <el-dropdown v-if="row.status === '0'" trigger="click">
                <span class="el-dropdown-link">
                  <el-button link type="primary"
                    >更多<el-icon class="el-icon--right"><arrow-down /></el-icon
                  ></el-button>
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item icon="Tickets" @click="handleStatusChange(row, '1')">标记已开票</el-dropdown-item>
                    <el-dropdown-item icon="Delete" @click="handleStatusChange(row, '2')">标记已作废</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="loadData" />
    </el-card>

    <!-- 发票详情对话框：详情走 getInvoice(/admin/recruitment/invoice/{id})，含企业名/备注等 -->
    <el-dialog v-model="detailVisible" title="发票详情" width="600px" append-to-body>
      <el-descriptions :column="2" border v-if="currentInvoice">
        <el-descriptions-item label="发票编号">{{ currentInvoice.invoiceNo || currentInvoice.invoiceId }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="invoiceStatusMeta(currentInvoice.status).type">{{ invoiceStatusMeta(currentInvoice.status).label }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="企业">{{ currentInvoice.companyName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="台账编号">
          <el-button v-if="currentInvoice.ledgerOrderNo" link type="primary" @click="openRelatedLedger(currentInvoice)">
            {{ currentInvoice.ledgerOrderNo }}
          </el-button>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="金额(元)">{{ currentInvoice.amount != null ? formatMoney(currentInvoice.amount) : '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ currentInvoice.createTime }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ currentInvoice.updateTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentInvoice.remark || '暂无' }}</el-descriptions-item>
      </el-descriptions>
      <div v-if="currentInvoice?.filePath" class="mt-4">
        <div class="mb-2">发票文件</div>
        <el-image :src="currentInvoice.filePath" :preview-src-list="[currentInvoice.filePath]" style="max-width: 100%" fit="contain" />
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 上传发票对话框：提交 uploadInvoiceManage(/admin/invoice-manage/upload)。
         发票文件先传 OSS(/resource/oss/upload) 拿到 url 作为 filePath；
         若填台账ID，后端会以台账金额/归属企业为准（amount/companyId 仅作展示与留痕）。 -->
    <el-dialog v-model="uploadVisible" title="上传发票" width="560px" append-to-body @closed="resetUploadForm">
      <el-form ref="uploadFormRef" :model="uploadForm" :rules="uploadRules" label-width="100px">
        <el-form-item label="发票文件" prop="filePath">
          <el-upload
            ref="invoiceUploadRef"
            :action="ossUploadUrl"
            :headers="uploadHeaders"
            :limit="1"
            :accept="invoiceAccept"
            :show-file-list="true"
            :file-list="uploadFileList"
            :before-upload="beforeInvoiceUpload"
            :on-success="onInvoiceUploadSuccess"
            :on-error="onInvoiceUploadError"
            :on-remove="onInvoiceFileRemove"
            :on-exceed="onInvoiceFileExceed"
          >
            <el-button type="primary" icon="Upload">选取文件</el-button>
            <template #tip>
              <div class="el-upload__tip">支持 pdf/jpg/png/jpeg，单个不超过 10MB</div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item label="关联台账" prop="ledgerId">
          <el-select
            v-model="uploadForm.ledgerId"
            filterable
            remote
            clearable
            reserve-keyword
            :remote-method="loadLedgerOptions"
            :loading="ledgerLoading"
            placeholder="请选择台账"
            style="width: 100%"
            @visible-change="handleLedgerVisibleChange"
            @change="handleUploadLedgerChange"
          >
            <el-option v-for="item in ledgerOptions" :key="item.ledgerId" :label="formatLedgerLabel(item)" :value="item.ledgerId">
              <div class="ledger-option">
                <span>{{ item.orderNo || '台账#' + item.ledgerId }}</span>
                <span class="ledger-option-meta">企业ID {{ item.companyId || '-' }} / {{ item.amount != null ? formatMoney(item.amount) : '-' }} 元</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="企业ID" prop="companyId">
          <el-input v-model="uploadForm.companyId" placeholder="选择台账后自动带出" disabled style="width: 100%" />
        </el-form-item>
        <el-form-item label="金额(元)" prop="amount">
          <el-input-number v-model="uploadForm.amount" :min="0" :precision="2" :controls="false" placeholder="选择台账后自动带出" disabled style="width: 100%" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="uploadForm.status" placeholder="默认未开票" style="width: 100%">
            <el-option label="未开票" value="0" />
            <el-option label="已开票" value="1" />
            <el-option label="已作废" value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="uploadForm.remark" type="textarea" :rows="2" placeholder="可空，写入操作审计明细" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="uploadVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitUpload">确定</el-button>
      </template>
    </el-dialog>

    <!-- 绑定/改绑台账对话框：提交 bindInvoiceManage(/admin/invoice-manage/bind)，后端同步发票归属企业为台账企业 -->
    <el-dialog v-model="bindVisible" title="绑定台账" width="460px" append-to-body @closed="resetBindForm">
      <el-form ref="bindFormRef" :model="bindForm" :rules="bindRules" label-width="100px">
        <el-form-item label="发票ID">
          <span>{{ bindForm.invoiceId }}</span>
        </el-form-item>
        <el-form-item label="台账" prop="ledgerId">
          <el-select
            v-model="bindForm.ledgerId"
            filterable
            remote
            clearable
            reserve-keyword
            :remote-method="loadLedgerOptions"
            :loading="ledgerLoading"
            placeholder="请选择要绑定的台账"
            style="width: 100%"
            @visible-change="handleLedgerVisibleChange"
          >
            <el-option v-for="item in ledgerOptions" :key="item.ledgerId" :label="formatLedgerLabel(item)" :value="item.ledgerId">
              <div class="ledger-option">
                <span>{{ item.orderNo || '台账#' + item.ledgerId }}</span>
                <span class="ledger-option-meta">企业ID {{ item.companyId || '-' }} / {{ item.amount != null ? formatMoney(item.amount) : '-' }} 元</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="bindVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitBind">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="InvoiceManagement" lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, UploadInstance, UploadProps, UploadUserFile } from 'element-plus';
import { globalHeaders } from '@/utils/request';
import {
  getInvoiceStatistics,
  listInvoiceLedgerOptions,
  listInvoiceManage,
  uploadInvoiceManage,
  bindInvoiceManage,
  markInvoiceManageStatus
} from '@/api/recruitment';
import type { InvoiceManageVO, InvoiceUploadForm, LedgerVO } from '@/api/recruitment';
import { unwrapList, formatMoney } from './helpers';
import { invoiceStatusMeta } from './constants';

const loading = ref(false);
const router = useRouter();
const submitting = ref(false);
const total = ref(0);
const tableData = ref<InvoiceManageVO[]>([]);
const detailVisible = ref(false);
const currentInvoice = ref<any>(null);
const queryFormRef = ref<FormInstance>();
const ledgerOptions = ref<LedgerVO[]>([]);
const ledgerLoading = ref(false);

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  companyId: undefined as string | undefined,
  ledgerId: undefined as string | undefined,
  status: ''
});

const statistics = reactive({
  totalCount: 0,
  pendingCount: 0,
  issuedCount: 0,
  cancelledCount: 0
});

// ===== OSS 上传配置（发票文件先传 OSS 拿到 url 作为 filePath）=====
const ossUploadUrl = import.meta.env.VITE_APP_BASE_API + '/resource/oss/upload';
const uploadHeaders = ref(globalHeaders());
const invoiceAccept = '.pdf,.jpg,.jpeg,.png';

// ===== 上传发票对话框 =====
const uploadVisible = ref(false);
const uploadFormRef = ref<FormInstance>();
const invoiceUploadRef = ref<UploadInstance>();
const uploadFileList = ref<UploadUserFile[]>([]);
const uploadForm = reactive<InvoiceUploadForm>({
  filePath: '',
  ledgerId: undefined,
  companyId: undefined,
  amount: undefined,
  status: '0',
  remark: ''
});
const uploadRules = {
  filePath: [{ required: true, message: '请先上传发票文件', trigger: 'change' }]
};

// ===== 绑定台账对话框 =====
const bindVisible = ref(false);
const bindFormRef = ref<FormInstance>();
const bindForm = reactive<{ invoiceId?: number; ledgerId?: number }>({
  invoiceId: undefined,
  ledgerId: undefined
});
const bindRules = {
  ledgerId: [{ required: true, message: '请选择台账', trigger: 'change' }]
};

async function loadLedgerOptions(keyword = '') {
  ledgerLoading.value = true;
  try {
    const res = await listInvoiceLedgerOptions({
      pageNum: 1,
      pageSize: 20,
      orderNo: keyword || undefined
    });
    const list = unwrapList<LedgerVO>(res);
    ledgerOptions.value = mergeLedgerOptions(ledgerOptions.value.filter(isSelectedLedger), list.rows);
  } catch (error) {
    console.error('加载台账列表失败:', error);
  } finally {
    ledgerLoading.value = false;
  }
}

function handleLedgerVisibleChange(visible: boolean) {
  if (visible) {
    loadLedgerOptions();
  }
}

function mergeLedgerOptions(left: LedgerVO[], right: LedgerVO[]) {
  const map = new Map<number, LedgerVO>();
  [...left, ...right].forEach((item) => {
    if (item.ledgerId != null) {
      map.set(Number(item.ledgerId), item);
    }
  });
  return Array.from(map.values());
}

function isSelectedLedger(item: LedgerVO) {
  return item.ledgerId === uploadForm.ledgerId || item.ledgerId === bindForm.ledgerId;
}

function formatLedgerLabel(item: LedgerVO) {
  const orderNo = item.orderNo || `台账#${item.ledgerId}`;
  const company = item.companyName || (item.companyId ? `企业ID ${item.companyId}` : '企业-');
  const amount = item.amount != null ? `${formatMoney(item.amount)}元` : '金额-';
  return `${orderNo} / ${company} / ${amount}`;
}

function findLedgerOption(ledgerId?: number | string) {
  if (ledgerId == null || ledgerId === '') return undefined;
  return ledgerOptions.value.find((item) => Number(item.ledgerId) === Number(ledgerId));
}

function handleUploadLedgerChange(ledgerId?: number | string) {
  if (ledgerId == null || ledgerId === '') {
    uploadForm.companyId = undefined;
    uploadForm.amount = undefined;
    return;
  }
  const ledger = findLedgerOption(ledgerId);
  if (!ledger) return;
  uploadForm.companyId = ledger.companyId;
  uploadForm.amount = ledger.amount;
}

async function loadData() {
  loading.value = true;
  try {
    // 仅提交有值的查询条件，避免空字符串污染后端 LambdaQueryWrapper
    const params: any = {
      pageNum: queryParams.pageNum,
      pageSize: queryParams.pageSize
    };
    if (queryParams.companyId) params.companyId = queryParams.companyId;
    if (queryParams.ledgerId) params.ledgerId = queryParams.ledgerId;
    if (queryParams.status) params.status = queryParams.status;
    const res = await listInvoiceManage(params);
    const list = unwrapList<InvoiceManageVO>(res);
    tableData.value = list.rows;
    total.value = list.total;
  } catch (error) {
    console.error('加载数据失败:', error);
  } finally {
    loading.value = false;
  }
}

async function loadStatistics() {
  try {
    const res = await getInvoiceStatistics();
    Object.assign(statistics, res.data || {});
  } catch (error) {
    console.error('加载统计失败:', error);
  }
}

function handleQuery() {
  queryParams.pageNum = 1;
  loadData();
}

function resetQuery() {
  queryFormRef.value?.resetFields();
  queryParams.pageNum = 1;
  queryParams.status = '';
  queryParams.companyId = undefined;
  queryParams.ledgerId = undefined;
  loadData();
}

async function handleDetail(row: InvoiceManageVO) {
  currentInvoice.value = { ...row };
  detailVisible.value = true;
}

function openRelatedLedger(row: InvoiceManageVO) {
  if (!row?.ledgerOrderNo) return;
  detailVisible.value = false;
  router.push({ name: 'RecruitmentLedger', query: { orderNo: row.ledgerOrderNo } });
}

function previewFile(filePath: string) {
  window.open(filePath, '_blank');
}

// ===== 上传发票流程 =====
function handleUploadOpen() {
  uploadVisible.value = true;
  loadLedgerOptions();
}

function resetUploadForm() {
  uploadFormRef.value?.resetFields();
  uploadForm.filePath = '';
  uploadForm.ledgerId = undefined;
  uploadForm.companyId = undefined;
  uploadForm.amount = undefined;
  uploadForm.status = '0';
  uploadForm.remark = '';
  uploadFileList.value = [];
}

// OSS 上传前校验：类型 + 大小（<10MB）
const beforeInvoiceUpload: UploadProps['beforeUpload'] = (file) => {
  const ext = file.name.slice(file.name.lastIndexOf('.') + 1).toLowerCase();
  const okType = ['pdf', 'jpg', 'jpeg', 'png'].includes(ext);
  if (!okType) {
    ElMessage.error('文件格式不正确，仅支持 pdf/jpg/png/jpeg');
    return false;
  }
  const isLt = file.size / 1024 / 1024 < 10;
  if (!isLt) {
    ElMessage.error('上传文件大小不能超过 10MB');
    return false;
  }
  return true;
};

// OSS 上传成功：取返回 url 作为发票 filePath（与列表/详情的 filePath 直链语义一致）
const onInvoiceUploadSuccess: UploadProps['onSuccess'] = (res: any) => {
  if (res.code === 200) {
    uploadForm.filePath = res.data.url;
    // 触发表单校验，清掉「请先上传发票文件」提示
    uploadFormRef.value?.validateField('filePath');
    ElMessage.success('文件上传成功');
  } else {
    ElMessage.error(res.msg || '文件上传失败');
  }
};

const onInvoiceUploadError: UploadProps['onError'] = () => {
  ElMessage.error('文件上传失败');
};

function onInvoiceFileRemove() {
  uploadForm.filePath = '';
}

function onInvoiceFileExceed() {
  ElMessage.warning('仅允许上传 1 个发票文件，请先移除已选文件');
}

async function submitUpload() {
  if (!uploadFormRef.value) return;
  await uploadFormRef.value.validate(async (valid) => {
    if (!valid) return;
    submitting.value = true;
    try {
      // 组装请求体：仅提交有值字段，数值型字段做转换，避免空串传给后端
      const payload: InvoiceUploadForm = {
        filePath: uploadForm.filePath,
        status: uploadForm.status
      };
      if (uploadForm.ledgerId) payload.ledgerId = Number(uploadForm.ledgerId);
      if (uploadForm.companyId) payload.companyId = Number(uploadForm.companyId);
      if (uploadForm.amount != null) payload.amount = Number(uploadForm.amount);
      if (uploadForm.remark) payload.remark = uploadForm.remark;
      await uploadInvoiceManage(payload);
      ElMessage.success('上传成功');
      uploadVisible.value = false;
      loadData();
      loadStatistics();
    } catch (error) {
      console.error('上传发票失败:', error);
    } finally {
      submitting.value = false;
    }
  });
}

// ===== 绑定/改绑台账流程 =====
function handleBindOpen(row: InvoiceManageVO) {
  bindForm.invoiceId = row.invoiceId;
  bindForm.ledgerId = row.ledgerId;
  if (row.ledgerId != null && !findLedgerOption(row.ledgerId)) {
    ledgerOptions.value.unshift({
      ledgerId: row.ledgerId,
      orderNo: row.ledgerOrderNo,
      companyId: row.companyId,
      amount: row.amount
    });
  }
  bindVisible.value = true;
  loadLedgerOptions();
}

function resetBindForm() {
  bindFormRef.value?.resetFields();
  bindForm.invoiceId = undefined;
  bindForm.ledgerId = undefined;
}

async function submitBind() {
  if (!bindFormRef.value) return;
  await bindFormRef.value.validate(async (valid) => {
    if (!valid) return;
    submitting.value = true;
    try {
      await bindInvoiceManage({
        invoiceId: bindForm.invoiceId as number,
        ledgerId: bindForm.ledgerId as number
      });
      ElMessage.success('绑定成功');
      bindVisible.value = false;
      loadData();
    } catch (error) {
      console.error('绑定台账失败:', error);
    } finally {
      submitting.value = false;
    }
  });
}

// ===== 标记开票状态：走 markInvoiceManageStatus(/admin/invoice-manage/markStatus) =====
async function handleStatusChange(row: InvoiceManageVO, status: string) {
  const statusText = invoiceStatusMeta(status).label;
  try {
    await ElMessageBox.confirm(`确认要将该发票标记为"${statusText}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    await markInvoiceManageStatus({ invoiceId: row.invoiceId as number, status });
    ElMessage.success('更新成功');
    loadData();
    loadStatistics();
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('更新失败');
    }
  }
}

onMounted(() => {
  loadData();
  loadStatistics();
});
</script>

<style scoped>
.mb-4 {
  margin-bottom: 16px;
}

.mt-4 {
  margin-top: 16px;
}

.mb-2 {
  margin-bottom: 8px;
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

.stat-mini .value.danger {
  color: #f56c6c;
}

.stat-mini .value.warning {
  color: #e6a23c;
}

.amount-text {
  color: #2b7fff;
  font-weight: 600;
}

.text-secondary {
  color: #909399;
  font-size: 12px;
}

.ledger-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.ledger-option-meta {
  color: #909399;
  font-size: 12px;
}
</style>
