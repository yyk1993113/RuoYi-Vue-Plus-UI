<template>
  <div class="p-4 qualification-review-page">
    <el-card shadow="never" class="mb-4">
      <template #header>
        <div class="page-heading">
          <div>
            <div class="page-title">认证审核</div>
            <div class="page-subtitle">审核企业提交的开户与认证申请，草稿不会进入此列表</div>
          </div>
          <el-button icon="Refresh" :loading="loading" @click="loadApplications">刷新</el-button>
        </div>
      </template>

      <el-form :inline="true" :model="query">
        <el-form-item label="企业名称">
          <el-input v-model="query.companyName" clearable placeholder="请输入企业名称" @keyup.enter="resetPage" />
        </el-form-item>
        <el-form-item label="统一信用代码">
          <el-input v-model="query.creditCode" clearable placeholder="请输入统一信用代码" @keyup.enter="resetPage" />
        </el-form-item>
        <el-form-item label="审核状态">
          <el-select v-model="query.status" style="width: 160px" @change="handleStatusChange">
            <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="resetPage">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <el-table v-loading="loading" :data="pageRows" border stripe>
        <el-table-column label="企业名称" min-width="210" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="company-name">{{ row.application.companyName || '-' }}</div>
            <div class="secondary-text">{{ row.application.creditCode || '-' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="租户编号" prop="tenantId" min-width="130" show-overflow-tooltip />
        <el-table-column label="认证来源" width="130">
          <template #default="{ row }">{{ sourceText(row.application.sourceType) }}</template>
        </el-table-column>
        <el-table-column label="客户模式" width="120">
          <template #default="{ row }">{{ settlementModeText(row.application.settlementMode) }}</template>
        </el-table-column>
        <el-table-column label="审核状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="statusMeta(row.application.status).type">{{ statusMeta(row.application.status).label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="版本" width="80" align="center">
          <template #default="{ row }">V{{ row.application.version }}</template>
        </el-table-column>
        <el-table-column label="提交时间" width="175">
          <template #default="{ row }">{{ formatDateTime(row.application.submittedAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="210" fixed="right" align="center">
          <template #default="{ row }">
            <el-button v-hasPermi="['finance:qualification:query']" link type="primary" icon="View" @click="openDetail(row)">详情</el-button>
            <el-button
              v-if="row.application.status === 'PENDING_REVIEW'"
              v-hasPermi="['finance:qualification:audit']"
              link
              type="warning"
              icon="EditPen"
              @click="openReview(row)"
            >审核</el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination
        v-show="filteredRows.length > 0"
        v-model:page="pageNum"
        v-model:limit="pageSize"
        :total="filteredRows.length"
      />
    </el-card>

    <el-dialog v-model="detailVisible" title="开户与认证申请详情" width="920px" append-to-body destroy-on-close>
      <div v-loading="detailLoading">
        <template v-if="detail">
          <el-descriptions :column="3" border>
            <el-descriptions-item label="企业名称">{{ detail.application.companyName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="统一信用代码">{{ detail.application.creditCode || '-' }}</el-descriptions-item>
            <el-descriptions-item label="法定代表人">{{ detail.application.legalPersonName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="法人身份证号">{{ detail.application.legalPersonIdMasked || '-' }}</el-descriptions-item>
            <el-descriptions-item label="注册资本">{{ formatMoney(detail.application.registeredCapital) }}</el-descriptions-item>
            <el-descriptions-item label="成立日期">{{ detail.application.establishmentDate || '-' }}</el-descriptions-item>
            <el-descriptions-item label="联系电话">{{ detail.application.contactPhone || '-' }}</el-descriptions-item>
            <el-descriptions-item label="企业邮箱">{{ detail.application.contactEmail || '-' }}</el-descriptions-item>
            <el-descriptions-item label="客户模式">{{ settlementModeText(detail.application.settlementMode) }}</el-descriptions-item>
            <el-descriptions-item label="注册地址" :span="3">{{ detail.application.registeredAddress || '-' }}</el-descriptions-item>
            <el-descriptions-item label="开户银行">{{ detail.application.bankName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="银行账户名">{{ detail.application.accountName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="银行账号">{{ detail.application.bankAccountMasked || '-' }}</el-descriptions-item>
            <el-descriptions-item label="联行号">{{ detail.application.cnapsCode || '-' }}</el-descriptions-item>
            <el-descriptions-item label="来款银行">{{ detail.application.incomingBankName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="来款账号">{{ detail.application.incomingAccountMasked || '-' }}</el-descriptions-item>
            <el-descriptions-item label="认证来源">{{ sourceText(detail.application.sourceType) }}</el-descriptions-item>
            <el-descriptions-item label="外部认证引用" :span="2">{{ detail.application.sourceReference || '-' }}</el-descriptions-item>
            <el-descriptions-item label="审核状态">
              <el-tag :type="statusMeta(detail.application.status).type">{{ statusMeta(detail.application.status).label }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="审核意见" :span="2">{{ detail.application.reviewRemark || '-' }}</el-descriptions-item>
          </el-descriptions>

          <div class="section-title">资质文件</div>
          <div v-if="detail.files.length" class="qualification-files">
            <div v-for="file in detail.files" :key="file.id" class="qualification-file-row">
              <div class="file-icon">{{ fileTypeIcon(file.fileType) }}</div>
              <div class="file-info">
                <div class="file-name">{{ fileTypeText(file.fileType) }}</div>
                <div class="secondary-text">
                  {{ file.fileName || '-' }}
                  <span v-if="file.validTo"> · 有效期至 {{ file.validTo }}</span>
                  <span v-if="file.rejectReason"> · {{ file.rejectReason }}</span>
                </div>
              </div>
              <el-tag :type="file.reviewStatus === 'APPROVED' ? 'success' : 'warning'">{{ fileStatusText(file.reviewStatus) }}</el-tag>
              <el-button link type="primary" :loading="previewingFileId === file.id" @click="viewFile(file)">查看</el-button>
            </div>
          </div>
          <el-empty v-else :image-size="72" description="当前申请没有本地资质文件；外部认证材料以认证引用为准" />
        </template>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button
          v-if="detail?.application.status === 'PENDING_REVIEW'"
          v-hasPermi="['finance:qualification:audit']"
          type="primary"
          @click="openReviewFromDetail"
        >审核</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="reviewVisible" title="认证审核" width="520px" append-to-body destroy-on-close>
      <el-form label-width="90px">
        <el-form-item label="企业名称">
          <span>{{ reviewingRow?.application.companyName || '-' }}</span>
        </el-form-item>
        <el-form-item label="审核结果" required>
          <el-radio-group v-model="reviewForm.decision">
            <el-radio value="APPROVE">审核通过</el-radio>
            <el-radio value="SUPPLEMENT">补充资料</el-radio>
            <el-radio value="REJECT">审核驳回</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="reviewForm.decision === 'APPROVE' ? '审核意见' : '原因说明'" :required="reviewForm.decision !== 'APPROVE'">
          <el-input
            v-model="reviewForm.remark"
            type="textarea"
            :rows="4"
            maxlength="500"
            show-word-limit
            :placeholder="reviewRemarkPlaceholder"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reviewVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitReview">确认提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  getQualificationApplication,
  listQualificationApplications,
  previewQualificationFile,
  reviewQualificationApplication,
  type QualificationApplicationRow,
  type QualificationDetail,
  type QualificationFile,
  type QualificationReviewForm
} from '@/api/finance/qualification';

// 此页面是财税管理原生审核页，只通过独立 finance 接口工作，不依赖招聘页面或招聘权限。
const loading = ref(false);
const detailLoading = ref(false);
const submitting = ref(false);
const previewingFileId = ref<number>();
const rows = ref<QualificationApplicationRow[]>([]);
const detail = ref<QualificationDetail>();
const detailTenantId = ref('');
const detailVisible = ref(false);
const reviewVisible = ref(false);
const reviewingRow = ref<QualificationApplicationRow>();
const pageNum = ref(1);
const pageSize = ref(10);

const query = reactive({ companyName: '', creditCode: '', status: 'PENDING_REVIEW' });
const reviewForm = reactive<QualificationReviewForm>({
  tenantId: '',
  applicationId: 0,
  applicationVersion: 0,
  decision: 'APPROVE',
  remark: ''
});

const statusOptions = [
  { value: 'PENDING_REVIEW', label: '待审核' },
  { value: 'SUPPLEMENT_REQUIRED', label: '待补充' },
  { value: 'REJECTED', label: '已驳回' },
  { value: 'APPROVED', label: '已通过' },
  { value: 'ACCOUNT_OPENED', label: '已开户' },
  { value: '', label: '全部状态' }
];

const filteredRows = computed(() => {
  const companyName = query.companyName.trim().toLowerCase();
  const creditCode = query.creditCode.trim().toLowerCase();
  return rows.value.filter((row) => {
    const application = row.application;
    return (!companyName || (application.companyName || '').toLowerCase().includes(companyName))
      && (!creditCode || (application.creditCode || '').toLowerCase().includes(creditCode));
  });
});

const pageRows = computed(() => {
  const start = (pageNum.value - 1) * pageSize.value;
  return filteredRows.value.slice(start, start + pageSize.value);
});

const reviewRemarkPlaceholder = computed(() => {
  if (reviewForm.decision === 'SUPPLEMENT') return '请说明需要企业补充的资料';
  if (reviewForm.decision === 'REJECT') return '请输入驳回原因';
  return '可填写审核通过意见';
});

function statusMeta(status: string) {
  const values: Record<string, { label: string; type: 'success' | 'warning' | 'danger' | 'info' }> = {
    DRAFT: { label: '草稿', type: 'info' },
    PENDING_REVIEW: { label: '待审核', type: 'warning' },
    SUPPLEMENT_REQUIRED: { label: '待补充', type: 'warning' },
    REJECTED: { label: '已驳回', type: 'danger' },
    APPROVED: { label: '已通过', type: 'success' },
    ACCOUNT_OPENED: { label: '已开户', type: 'success' }
  };
  return values[status] || { label: status || '-', type: 'info' as const };
}

function sourceText(sourceType?: string) {
  return sourceType === 'OA_REUSED' ? '外部认证复用' : '本系统认证';
}

function settlementModeText(mode?: string) {
  if (mode === 'SETTLEMENT') return '结算客户';
  if (mode === 'SELF_PAY') return '企业自付';
  return '暂不发放';
}

function formatDateTime(value?: string) {
  return value ? value.replace('T', ' ').slice(0, 19) : '-';
}

function formatMoney(value?: number) {
  return value == null ? '-' : `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fileTypeText(fileType: string) {
  return ({
    BUSINESS_LICENSE: '营业执照',
    BANK_ACCOUNT_CERT: '开户许可证',
    LEGAL_ID_FRONT: '法人身份证（正面）',
    LEGAL_ID_BACK: '法人身份证（反面）',
    AUTHORIZATION_LETTER: '经办人授权委托书',
    COMPANY_SEAL: '企业公章印模'
  } as Record<string, string>)[fileType] || fileType;
}

function fileTypeIcon(fileType: string) {
  return ({ BUSINESS_LICENSE: '执', BANK_ACCOUNT_CERT: '户', LEGAL_ID_FRONT: '证', LEGAL_ID_BACK: '证', AUTHORIZATION_LETTER: '委', COMPANY_SEAL: '印' } as Record<string, string>)[fileType] || '资';
}

function fileStatusText(status: string) {
  return ({ APPROVED: '已验证', PENDING_REVIEW: '待审核', REJECTED: '已驳回', SUPPLEMENT_REQUIRED: '待补充' } as Record<string, string>)[status] || status;
}

async function loadApplications() {
  loading.value = true;
  try {
    rows.value = (await listQualificationApplications(query.status || undefined)).data || [];
    pageNum.value = 1;
  } finally {
    loading.value = false;
  }
}

function resetPage() {
  pageNum.value = 1;
}

function resetQuery() {
  query.companyName = '';
  query.creditCode = '';
  query.status = 'PENDING_REVIEW';
  loadApplications();
}

function handleStatusChange() {
  loadApplications();
}

async function openDetail(row: QualificationApplicationRow) {
  detailVisible.value = true;
  detailLoading.value = true;
  detail.value = undefined;
  detailTenantId.value = row.tenantId;
  try {
    detail.value = (await getQualificationApplication(row.tenantId, row.application.id)).data;
  } finally {
    detailLoading.value = false;
  }
}

function openReview(row: QualificationApplicationRow) {
  reviewingRow.value = row;
  reviewForm.tenantId = row.tenantId;
  reviewForm.applicationId = row.application.id;
  reviewForm.applicationVersion = row.application.version;
  reviewForm.decision = 'APPROVE';
  reviewForm.remark = '';
  reviewVisible.value = true;
}

function openReviewFromDetail() {
  if (!detail.value) return;
  openReview({ tenantId: detailTenantId.value, application: detail.value.application });
  detailVisible.value = false;
}

async function submitReview() {
  if (reviewForm.decision !== 'APPROVE' && !reviewForm.remark?.trim()) {
    ElMessage.warning(reviewForm.decision === 'REJECT' ? '请输入驳回原因' : '请说明需要补充的资料');
    return;
  }
  await ElMessageBox.confirm('确认提交本次认证审核结果吗？', '提交确认', { type: 'warning' });
  submitting.value = true;
  try {
    await reviewQualificationApplication({ ...reviewForm, remark: reviewForm.remark?.trim() });
    ElMessage.success('审核结果已提交');
    reviewVisible.value = false;
    await loadApplications();
  } finally {
    submitting.value = false;
  }
}

async function viewFile(file: QualificationFile) {
  previewingFileId.value = file.id;
  try {
    const response = await previewQualificationFile(detailTenantId.value, file.id);
    const url = URL.createObjectURL(response.data);
    window.open(url, '_blank', 'noopener,noreferrer');
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } finally {
    previewingFileId.value = undefined;
  }
}

onMounted(loadApplications);
</script>

<style scoped>
.page-heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.page-title { color: var(--el-text-color-primary); font-size: 18px; font-weight: 600; }
.page-subtitle, .secondary-text { margin-top: 4px; color: var(--el-text-color-secondary); font-size: 12px; }
.company-name { color: var(--el-text-color-primary); font-weight: 500; }
.section-title { margin: 22px 0 12px; padding-left: 10px; border-left: 3px solid var(--el-color-primary); font-size: 16px; font-weight: 600; }
.qualification-files { overflow: hidden; border: 1px solid var(--el-border-color-lighter); border-radius: 6px; }
.qualification-file-row { display: flex; align-items: center; gap: 12px; min-height: 72px; padding: 10px 16px; border-bottom: 1px solid var(--el-border-color-lighter); }
.qualification-file-row:last-child { border-bottom: 0; }
.file-icon { display: flex; flex: 0 0 42px; align-items: center; justify-content: center; width: 42px; height: 42px; border: 1px solid #c6e2ff; border-radius: 6px; color: var(--el-color-primary); background: #ecf5ff; font-size: 18px; font-weight: 600; }
.file-info { flex: 1; min-width: 0; }
.file-name { color: var(--el-text-color-primary); font-weight: 500; }
</style>
