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
        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="未开票" value="0" />
            <el-option label="已开票" value="1" />
            <el-option label="已作废" value="2" />
            <el-option label="红冲" value="3" />
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
            <span>{{ row.invoiceNo || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="金额(元)" width="120" align="right">
          <template #default="{ row }">
            <span v-if="row.amount != null" class="amount-text">{{ formatMoney(row.amount) }}</span>
            <span v-else class="text-secondary">-</span>
          </template>
        </el-table-column>
        <el-table-column label="绑定台账" min-width="150" align="center">
          <template #default="{ row }">
            <div v-if="row.ledgerId">
              <div>{{ row.ledgerOrderNo || '-' }}</div>
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
                    <el-dropdown-item icon="RefreshLeft" @click="handleStatusChange(row, '3')">标记红冲</el-dropdown-item>
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
        <el-descriptions-item label="发票编号">{{ currentInvoice.invoiceNo || '-' }}</el-descriptions-item>
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
    <el-dialog
      v-model="uploadVisible"
      title="上传发票"
      width="640px"
      append-to-body
      :close-on-click-modal="true"
      :close-on-press-escape="true"
      @closed="resetUploadForm"
    >
      <el-form ref="uploadFormRef" :model="uploadForm" :rules="uploadRules" label-width="104px" status-icon>
        <el-form-item label="发票文件" prop="filePath">
          <el-upload
            ref="invoiceUploadRef"
            class="invoice-upload"
            :action="ossUploadUrl"
            :headers="uploadHeaders"
            :limit="1"
            :accept="invoiceAccept"
            drag
            :show-file-list="false"
            :before-upload="beforeInvoiceUpload"
            :on-progress="onInvoiceUploadProgress"
            :on-success="onInvoiceUploadSuccess"
            :on-error="onInvoiceUploadError"
            :on-remove="onInvoiceFileRemove"
            :on-exceed="onInvoiceFileExceed"
          >
            <div class="invoice-upload-drop">
              <el-icon class="invoice-upload-icon"><upload-filled /></el-icon>
              <div class="invoice-upload-title">点击或拖拽发票文件至此上传</div>
              <div class="invoice-upload-formats">
                <span class="format-badge">PDF</span>
                <span class="format-badge">JPG</span>
                <span class="format-badge">PNG</span>
              </div>
              <div class="invoice-upload-tip">选择时会校验格式与大小，单个文件不超过 10MB</div>
            </div>
          </el-upload>
          <div v-if="hasInvoiceFile" class="invoice-file-card">
            <div class="invoice-file-preview">
              <el-image
                v-if="isImageInvoiceFile && invoiceFileMeta.url"
                :src="invoiceFileMeta.url"
                :preview-src-list="[invoiceFileMeta.url]"
                fit="cover"
                class="invoice-file-thumb"
              />
              <span v-else>{{ invoiceFileExtLabel }}</span>
            </div>
            <div class="invoice-file-main">
              <el-tooltip :content="invoiceFileMeta.name" placement="top" :disabled="invoiceFileMeta.name.length < 28">
                <div class="invoice-file-name">{{ invoiceFileMeta.name }}</div>
              </el-tooltip>
              <div class="invoice-file-meta">
                <span>{{ invoiceFileSizeText }}</span>
                <span v-if="invoiceUploading">上传中...</span>
                <span v-else class="invoice-file-done">已上传</span>
              </div>
            </div>
            <el-button link type="danger" icon="Delete" @click.stop="clearInvoiceFile">删除重传</el-button>
          </div>
        </el-form-item>
        <el-form-item label="关联台账" prop="ledgerId">
          <div class="ledger-select-wrap">
            <el-tooltip :content="formatLedgerTooltip(selectedUploadLedger)" placement="top" :disabled="!selectedUploadLedger">
              <el-select
                v-model="uploadForm.ledgerId"
                filterable
                remote
                clearable
                reserve-keyword
                :remote-method="loadLedgerOptions"
                :loading="ledgerLoading"
                placeholder="输入台账编号搜索"
                style="width: 100%"
                @visible-change="handleLedgerVisibleChange"
                @change="handleUploadLedgerChange"
              >
                <el-option v-for="item in ledgerOptions" :key="item.ledgerId" :label="formatLedgerShortLabel(item)" :value="item.ledgerId">
                  <div class="ledger-option">
                    <span>{{ item.orderNo || '未编号台账' }}</span>
                    <span class="ledger-option-meta">{{ item.companyName || '企业-' }} / {{ item.amount != null ? formatMoney(item.amount) : '-' }} 元</span>
                  </div>
                </el-option>
              </el-select>
            </el-tooltip>
            <div v-if="selectedUploadLedger" class="selected-ledger-meta">
              已选 {{ formatLedgerShortLabel(selectedUploadLedger) }}，台账金额
              {{ selectedUploadLedger.amount != null ? formatMoney(selectedUploadLedger.amount) : '-' }} 元
            </div>
          </div>
        </el-form-item>
        <el-form-item label="金额(元)" prop="amount">
          <el-input
            v-model="uploadForm.amount"
            placeholder="请输入发票金额"
            clearable
            style="width: 100%"
            @input="handleAmountInput"
            @blur="normalizeAmountInput"
          >
            <template #prefix>￥</template>
          </el-input>
          <div v-if="isAmountOverLedger" class="amount-warning">
            当前金额已超出台账金额 {{ formatMoney(selectedUploadLedger?.amount) }} 元，提交前需再次确认。
          </div>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="uploadForm.status" placeholder="默认已开票" style="width: 100%">
            <el-option label="已开票" value="1" />
            <el-option label="作废" value="2" />
            <el-option label="红冲" value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="uploadForm.remark"
            type="textarea"
            :rows="3"
            maxlength="200"
            show-word-limit
            placeholder="填写发票备注、操作说明，内容将同步至审计日志"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="invoice-dialog-footer">
          <div class="required-tip"><span>*</span> 为必填项</div>
          <div>
            <el-button @click="uploadVisible = false">取消</el-button>
            <el-button type="primary" :loading="submitting" :disabled="!canSubmitUpload" @click="submitUpload">确定</el-button>
          </div>
        </div>
      </template>
    </el-dialog>

    <!-- 绑定/改绑台账对话框：提交 bindInvoiceManage(/admin/invoice-manage/bind)，后端同步发票归属企业为台账企业 -->
    <el-dialog v-model="bindVisible" title="绑定台账" width="460px" append-to-body @closed="resetBindForm">
      <el-form ref="bindFormRef" :model="bindForm" :rules="bindRules" label-width="100px">
        <el-form-item label="台账" prop="ledgerId">
          <el-select
            v-model="bindForm.ledgerId"
            filterable
            remote
            clearable
            reserve-keyword
            :remote-method="loadLedgerOptions"
            :loading="ledgerLoading"
            placeholder="输入台账编号搜索"
            style="width: 100%"
            @visible-change="handleLedgerVisibleChange"
          >
            <el-option v-for="item in ledgerOptions" :key="item.ledgerId" :label="formatLedgerShortLabel(item)" :value="item.ledgerId">
              <div class="ledger-option">
                <span>{{ item.orderNo || '未编号台账' }}</span>
                <span class="ledger-option-meta">{{ item.companyName || '企业-' }} / {{ item.amount != null ? formatMoney(item.amount) : '-' }} 元</span>
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
import { computed, ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules, UploadInstance, UploadProps } from 'element-plus';
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

interface InvoiceFileMeta {
  name: string;
  size: number;
  type: string;
  url: string;
}

type InvoiceUploadDialogForm = Omit<InvoiceUploadForm, 'filePath' | 'companyId' | 'amount' | 'status' | 'remark'> & {
  filePath: string;
  companyId?: number | string;
  amount: string;
  status: string;
  remark: string;
};

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
const invoiceUploading = ref(false);
const invoiceFileMeta = reactive<InvoiceFileMeta>({
  name: '',
  size: 0,
  type: '',
  url: ''
});
const uploadForm = reactive<InvoiceUploadDialogForm>({
  filePath: '',
  ledgerId: undefined,
  companyId: undefined,
  amount: '',
  status: '1',
  remark: ''
});
const uploadRules: FormRules<InvoiceUploadDialogForm> = {
  filePath: [{ required: true, message: '请先上传发票文件', trigger: 'change' }],
  amount: [
    { required: true, message: '请输入发票金额', trigger: 'blur' },
    { validator: validateInvoiceAmount, trigger: ['blur', 'change'] }
  ]
};
const selectedUploadLedger = computed(() => findLedgerOption(uploadForm.ledgerId));
const hasInvoiceFile = computed(() => Boolean(invoiceFileMeta.name));
const invoiceFileExtLabel = computed(() => getFileExt(invoiceFileMeta.name).toUpperCase() || 'FILE');
const invoiceFileSizeText = computed(() => formatFileSize(invoiceFileMeta.size));
const isImageInvoiceFile = computed(() => ['jpg', 'jpeg', 'png'].includes(getFileExt(invoiceFileMeta.name)));
const isAmountOverLedger = computed(() => {
  const ledgerAmount = Number(selectedUploadLedger.value?.amount);
  const invoiceAmount = Number(uploadForm.amount);
  return Number.isFinite(ledgerAmount) && Number.isFinite(invoiceAmount) && invoiceAmount > ledgerAmount;
});
const canSubmitUpload = computed(() => Boolean(uploadForm.filePath && isValidInvoiceAmount(uploadForm.amount) && !invoiceUploading.value && !submitting.value));

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

function validateInvoiceAmount(_: unknown, value: string, callback: (error?: Error) => void) {
  if (!value) {
    callback(new Error('请输入发票金额'));
    return;
  }
  if (!isValidInvoiceAmount(value)) {
    callback(new Error('金额仅支持正数，最多两位小数'));
    return;
  }
  callback();
}

function isValidInvoiceAmount(value?: string) {
  if (!value) return false;
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return false;
  return Number(value) > 0;
}

function toAmountText(amount?: number | string | null) {
  if (amount == null || amount === '' || isNaN(Number(amount))) return '';
  return Number(amount).toFixed(2);
}

function sanitizeAmountInput(value: string | number) {
  let next = String(value ?? '').replace(/[^\d.]/g, '');
  const firstDotIndex = next.indexOf('.');
  if (firstDotIndex >= 0) {
    next = next.slice(0, firstDotIndex + 1) + next.slice(firstDotIndex + 1).replace(/\./g, '');
  }
  const [integer = '', decimal = ''] = next.split('.');
  const normalizedInteger = integer.replace(/^0+(?=\d)/, '') || (next.startsWith('.') ? '0' : integer);
  return next.includes('.') ? `${normalizedInteger || '0'}.${decimal.slice(0, 2)}` : normalizedInteger;
}

function handleAmountInput(value: string) {
  const sanitizedValue = sanitizeAmountInput(value);
  if (uploadForm.amount !== sanitizedValue) {
    uploadForm.amount = sanitizedValue;
  }
  uploadFormRef.value?.validateField('amount');
}

function normalizeAmountInput() {
  if (isValidInvoiceAmount(uploadForm.amount)) {
    uploadForm.amount = Number(uploadForm.amount).toFixed(2);
  }
  uploadFormRef.value?.validateField('amount');
}

function getFileExt(fileName?: string) {
  const name = fileName || '';
  const dotIndex = name.lastIndexOf('.');
  return dotIndex >= 0 ? name.slice(dotIndex + 1).toLowerCase() : '';
}

function formatFileSize(size?: number) {
  if (!size) return '0 KB';
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

async function loadLedgerOptions(keyword = '') {
  ledgerLoading.value = true;
  try {
    const trimmedKeyword = keyword.trim();
    const orderNoQuery = listInvoiceLedgerOptions({
      pageNum: 1,
      pageSize: 20,
      orderNo: trimmedKeyword || undefined
    });
    // 台账选择同时承担“按台账号”和“按企业ID”找台账，避免运营复制长台账号。
    const companyIdQuery =
      trimmedKeyword && /^\d+$/.test(trimmedKeyword)
        ? listInvoiceLedgerOptions({
            pageNum: 1,
            pageSize: 20,
            companyId: trimmedKeyword
          })
        : null;
    const responses = await Promise.all(companyIdQuery ? [orderNoQuery, companyIdQuery] : [orderNoQuery]);
    const rows = responses.flatMap((res) => unwrapList<LedgerVO>(res).rows);
    ledgerOptions.value = mergeLedgerOptions(ledgerOptions.value.filter(isSelectedLedger), rows);
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

function formatLedgerShortLabel(item?: LedgerVO | null) {
  if (!item) return '';
  return item.orderNo || '未编号台账';
}

function formatLedgerLabel(item: LedgerVO) {
  const orderNo = formatLedgerShortLabel(item);
  const company = item.companyName || '企业-';
  const amount = item.amount != null ? `${formatMoney(item.amount)}元` : '金额-';
  return `${orderNo} / ${company} / ${amount}`;
}

function formatLedgerTooltip(item?: LedgerVO | null) {
  return item ? formatLedgerLabel(item) : '';
}

function findLedgerOption(ledgerId?: number | string) {
  if (ledgerId == null || ledgerId === '') return undefined;
  return ledgerOptions.value.find((item) => Number(item.ledgerId) === Number(ledgerId));
}

function handleUploadLedgerChange(ledgerId?: number | string) {
  if (ledgerId == null || ledgerId === '') {
    uploadForm.companyId = undefined;
    uploadForm.amount = '';
    return;
  }
  const ledger = findLedgerOption(ledgerId);
  if (!ledger) return;
  uploadForm.companyId = ledger.companyId;
  uploadForm.amount = ledger.amount != null ? toAmountText(ledger.amount) : '';
  uploadFormRef.value?.validateField('amount');
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
  invoiceUploadRef.value?.clearFiles();
  uploadForm.filePath = '';
  uploadForm.ledgerId = undefined;
  uploadForm.companyId = undefined;
  uploadForm.amount = '';
  uploadForm.status = '1';
  uploadForm.remark = '';
  clearInvoiceFileMeta();
}

function clearInvoiceFileMeta() {
  invoiceUploading.value = false;
  invoiceFileMeta.name = '';
  invoiceFileMeta.size = 0;
  invoiceFileMeta.type = '';
  invoiceFileMeta.url = '';
}

function clearInvoiceFile() {
  invoiceUploadRef.value?.clearFiles();
  uploadForm.filePath = '';
  clearInvoiceFileMeta();
  uploadFormRef.value?.validateField('filePath');
}

function resolveUploadFailureMessage(error?: any) {
  const message = error?.message || error?.msg || error?.response?.data?.msg || '';
  if (/格式|类型|type|format/i.test(message)) return '文件格式不支持，请上传 PDF、JPG、PNG 或 JPEG 格式发票。';
  if (/大小|过大|10MB|size/i.test(message)) return '文件超过 10MB，请压缩或重新选择后上传。';
  if (/损坏|无法读取|解析失败|corrupt|broken/i.test(message)) return '文件损坏或无法读取，请重新导出发票原件后上传。';
  return message || '文件上传失败，请检查文件是否损坏后重试。';
}

function resolveSubmitFailureMessage(error?: any) {
  const message = error?.message || error?.msg || error?.response?.data?.msg || '';
  if (/大小|过大|10MB|size/i.test(message)) return '文件过大：请上传 10MB 以内的发票文件。';
  if (/金额|amount|不匹配|超出/i.test(message)) return '金额不匹配：请核对发票金额与所选台账应收金额。';
  if (/台账|ledger|不存在|not found/i.test(message)) return '台账不存在或无权限：请重新选择有效台账后再提交。';
  return message || '上传失败，请稍后重试或联系管理员查看接口错误。';
}

// OSS 上传前校验：文件格式、大小与展示元信息分层处理，避免模糊的“上传失败”。
const beforeInvoiceUpload: UploadProps['beforeUpload'] = (file) => {
  const ext = getFileExt(file.name);
  const okType = ['pdf', 'jpg', 'jpeg', 'png'].includes(ext);
  if (!okType) {
    ElMessageBox.alert('文件格式不支持，请上传 PDF、JPG、PNG 或 JPEG 格式发票。', '格式不支持', { type: 'error' });
    return false;
  }
  const isLtOrEq = file.size <= 10 * 1024 * 1024;
  if (!isLtOrEq) {
    ElMessageBox.alert('当前文件超过 10MB，请压缩或重新选择后上传。', '文件过大', { type: 'warning' });
    return false;
  }
  invoiceUploading.value = true;
  invoiceFileMeta.name = file.name;
  invoiceFileMeta.size = file.size;
  invoiceFileMeta.type = file.type || ext;
  invoiceFileMeta.url = '';
  return true;
};

const onInvoiceUploadProgress: UploadProps['onProgress'] = () => {
  invoiceUploading.value = true;
};

// OSS 上传成功：取返回 url 作为发票 filePath（与列表/详情的 filePath 直链语义一致）
const onInvoiceUploadSuccess: UploadProps['onSuccess'] = (res: any, uploadFile) => {
  invoiceUploading.value = false;
  if (res.code === 200 && res.data?.url) {
    uploadForm.filePath = res.data.url;
    invoiceFileMeta.name = uploadFile.name || invoiceFileMeta.name;
    invoiceFileMeta.size = uploadFile.size || invoiceFileMeta.size;
    invoiceFileMeta.type = uploadFile.raw?.type || invoiceFileMeta.type;
    invoiceFileMeta.url = res.data.url;
    // 触发表单校验，清掉「请先上传发票文件」提示
    uploadFormRef.value?.validateField('filePath');
    ElMessage.success('文件上传成功');
  } else {
    clearInvoiceFile();
    ElMessageBox.alert(resolveUploadFailureMessage(res), /损坏|无法读取|解析失败/.test(res?.msg || '') ? '文件损坏' : '上传失败', { type: 'error' });
  }
};

const onInvoiceUploadError: UploadProps['onError'] = (error) => {
  clearInvoiceFile();
  const message = resolveUploadFailureMessage(error);
  ElMessageBox.alert(message, /损坏|无法读取|解析失败/.test(message) ? '文件损坏' : '上传失败', { type: 'error' });
};

function onInvoiceFileRemove() {
  uploadForm.filePath = '';
  clearInvoiceFileMeta();
}

function onInvoiceFileExceed() {
  ElMessageBox.alert('仅允许上传 1 个发票文件，请先删除当前文件后重新上传。', '请先删除当前文件', { type: 'warning' });
}

function buildUploadConfirmMessage() {
  const ledger = selectedUploadLedger.value;
  if (ledger) {
    return `确认上传该企业发票文件并绑定台账「${formatLedgerShortLabel(ledger)}」？`;
  }
  return '确认上传该发票文件？当前未绑定台账，后续需在列表中补绑定。';
}

async function submitUpload() {
  if (!uploadFormRef.value) return;
  try {
    await uploadFormRef.value.validate();
  } catch {
    return;
  }
  try {
    if (isAmountOverLedger.value) {
      await ElMessageBox.confirm(
        `当前发票金额 ${formatMoney(uploadForm.amount)} 元已超出台账金额 ${formatMoney(selectedUploadLedger.value?.amount)} 元，确认继续上传？`,
        '金额超出台账',
        {
          confirmButtonText: '继续上传',
          cancelButtonText: '返回修改',
          type: 'warning'
        }
      );
    }
    await ElMessageBox.confirm(buildUploadConfirmMessage(), '确认上传发票', {
      confirmButtonText: '确定上传',
      cancelButtonText: '取消',
      type: 'warning'
    });
  } catch {
    return;
  }

  submitting.value = true;
  try {
    // 组装请求体：文件 URL 来自 OSS；台账/企业/金额按当前表单快照提交，便于后端写审计。
    const payload: InvoiceUploadForm = {
      filePath: uploadForm.filePath,
      status: uploadForm.status
    };
    if (uploadForm.ledgerId) payload.ledgerId = Number(uploadForm.ledgerId);
    if (uploadForm.companyId) payload.companyId = Number(uploadForm.companyId);
    if (uploadForm.amount) payload.amount = Number(uploadForm.amount);
    if (uploadForm.remark) payload.remark = uploadForm.remark.trim();
    await uploadInvoiceManage(payload);
    ElMessage.success('上传成功');
    uploadVisible.value = false;
    loadData();
    loadStatistics();
  } catch (error) {
    console.error('上传发票失败:', error);
    ElMessageBox.alert(resolveSubmitFailureMessage(error), '上传失败', { type: 'error' });
  } finally {
    submitting.value = false;
  }
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

.invoice-upload {
  width: 100%;
}

.invoice-upload :deep(.el-upload) {
  width: 100%;
}

.invoice-upload :deep(.el-upload-dragger) {
  width: 100%;
  padding: 22px 16px;
  border-color: #8bb8ff;
  background: #f7fbff;
}

.invoice-upload-drop {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.invoice-upload-icon {
  font-size: 30px;
  color: #409eff;
}

.invoice-upload-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.invoice-upload-formats {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.format-badge {
  min-width: 44px;
  padding: 3px 8px;
  border: 1px solid #d9ecff;
  border-radius: 4px;
  background: #ffffff;
  color: #2b7fff;
  font-size: 12px;
  font-weight: 600;
  line-height: 18px;
}

.invoice-upload-tip,
.selected-ledger-meta,
.invoice-file-meta {
  color: #909399;
  font-size: 12px;
}

.invoice-file-card {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  margin-top: 10px;
  padding: 10px 12px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background: #ffffff;
}

.invoice-file-preview {
  display: flex;
  flex: 0 0 48px;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 6px;
  background: #eef5ff;
  color: #2b7fff;
  font-size: 12px;
  font-weight: 700;
}

.invoice-file-thumb {
  width: 48px;
  height: 48px;
  border-radius: 6px;
}

.invoice-file-main {
  min-width: 0;
  flex: 1;
}

.invoice-file-name {
  overflow: hidden;
  color: #303133;
  font-weight: 600;
  line-height: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.invoice-file-meta {
  display: flex;
  gap: 10px;
  margin-top: 4px;
}

.invoice-file-done {
  color: #67c23a;
}

.ledger-select-wrap {
  width: 100%;
}

.selected-ledger-meta {
  margin-top: 6px;
  line-height: 18px;
}

.amount-warning {
  margin-top: 6px;
  color: #e6a23c;
  font-size: 12px;
  line-height: 18px;
}

.invoice-dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.required-tip {
  color: #909399;
  font-size: 12px;
}

.required-tip span {
  color: #f56c6c;
  font-weight: 700;
}
</style>
