<template>
  <div class="p-4 finance-qualification-page">
    <el-alert
      v-if="loadError"
      class="mb-4"
      type="error"
      :title="loadError"
      show-icon
      :closable="false"
    >
      <el-button link type="danger" @click="loadApplications">重新加载</el-button>
    </el-alert>

    <el-card shadow="never" class="mb-4">
      <el-form :inline="true" @submit.prevent>
        <el-form-item label="申请状态">
          <el-select v-model="query.status" clearable placeholder="全部状态" style="width: 170px" @change="loadApplications">
            <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="企业/来源">
          <el-input v-model="query.keyword" clearable placeholder="企业名称、统一信用代码或来源单号" style="width: 300px" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleSearch">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="table-header">
          <span>财税中心开户与认证申请</span>
          <el-button type="primary" plain icon="Refresh" :loading="loading" @click="loadApplications">刷新</el-button>
        </div>
      </template>

      <el-table v-loading="loading" :data="filteredRows" border stripe row-key="application.id">
        <el-table-column label="企业名称" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">{{ row.application.companyName || '-' }}</template>
        </el-table-column>
        <el-table-column label="统一社会信用代码" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">{{ row.application.creditCode || '-' }}</template>
        </el-table-column>
        <el-table-column label="开户银行" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">{{ row.application.bankName || row.application.incomingBankName || '-' }}</template>
        </el-table-column>
        <el-table-column label="银行账号" min-width="150">
          <template #default="{ row }">{{ row.application.bankAccountMasked || row.application.incomingAccountMasked || '-' }}</template>
        </el-table-column>
        <el-table-column label="认证状态" width="130" align="center">
          <template #default="{ row }">
            <el-tag :type="statusMeta(row.application.status).type">{{ statusMeta(row.application.status).label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="提交时间" width="180">
          <template #default="{ row }">{{ formatDate(row.application.submittedAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" icon="View" @click="openDetail(row)">详情</el-button>
            <el-button
              v-if="row.application.status === 'PENDING_REVIEW'"
              v-hasPermi="['finance:qualification:audit']"
              link
              type="warning"
              icon="EditPen"
              @click="openAudit(row)"
            >审核</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无财税中心开户认证申请" />
        </template>
      </el-table>
    </el-card>

    <el-dialog v-model="detailVisible" title="开户与认证申请详情" width="900px" append-to-body>
      <div v-if="detailData" v-loading="detailLoading">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="企业名称" :span="2">{{ detailData.application.companyName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="统一社会信用代码">{{ detailData.application.creditCode || '-' }}</el-descriptions-item>
          <el-descriptions-item label="法定代表人">{{ detailData.application.legalPersonName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="法人证件">{{ detailData.application.legalPersonIdMasked || '-' }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ maskPhone(detailData.application.contactPhone) }}</el-descriptions-item>
          <el-descriptions-item label="注册地址" :span="2">{{ detailData.application.registeredAddress || '-' }}</el-descriptions-item>
          <el-descriptions-item label="开户银行">{{ detailData.application.bankName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="开户名称">{{ detailData.application.accountName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="银行账号">{{ detailData.application.bankAccountMasked || '-' }}</el-descriptions-item>
          <el-descriptions-item label="联行号">{{ detailData.application.cnapsCode || '-' }}</el-descriptions-item>
          <el-descriptions-item label="申请状态">
            <el-tag :type="statusMeta(detailData.application.status).type">{{ statusMeta(detailData.application.status).label }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="提交时间">{{ formatDate(detailData.application.submittedAt) }}</el-descriptions-item>
          <el-descriptions-item label="审核意见" :span="2">{{ detailData.application.reviewRemark || '-' }}</el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">认证材料</el-divider>
        <el-table :data="detailData.files" border>
          <el-table-column label="材料类型" prop="fileType" width="190" />
          <el-table-column label="文件名称" prop="fileName" min-width="220" show-overflow-tooltip />
          <el-table-column label="材料状态" width="120" align="center">
            <template #default="{ row }">{{ fileStatusLabel(row.reviewStatus) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="100" align="center">
            <template #default="{ row }">
              <el-button link type="primary" :disabled="!row.id" @click="previewFile(row)">预览</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <el-empty v-else-if="!detailLoading" description="暂无详情数据" />
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button
          v-if="detailData?.application.status === 'PENDING_REVIEW'"
          v-hasPermi="['finance:qualification:audit']"
          type="primary"
          @click="detailData && openAudit({ tenantId: detailTenantId, application: detailData.application })"
        >去审核</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="auditVisible" title="审核财税开户与认证申请" width="520px" append-to-body>
      <el-form label-width="100px">
        <el-form-item label="审核结果">
          <el-radio-group v-model="auditForm.decision">
            <el-radio label="APPROVE">通过</el-radio>
            <el-radio label="REJECT">驳回</el-radio>
            <el-radio label="SUPPLEMENT">补充材料</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审核意见" :required="auditForm.decision !== 'APPROVE'">
          <el-input v-model="auditForm.remark" type="textarea" :rows="4" maxlength="500" show-word-limit placeholder="驳回或补充材料时请填写原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitAudit">提交审核</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import {
  getFinanceQualificationDetail,
  listFinanceQualificationApplications,
  previewFinanceQualificationFile,
  reviewFinanceQualification,
  type FinanceQualificationApplication,
  type FinanceQualificationApplicationRow,
  type FinanceQualificationDetail,
  type FinanceQualificationFile
} from '@/api/financeQualification';

const statusOptions = [
  { value: 'PENDING_REVIEW', label: '待审核' },
  { value: 'APPROVED', label: '已通过' },
  { value: 'REJECTED', label: '已驳回' },
  { value: 'SUPPLEMENT', label: '待补充材料' }
];

const query = reactive({ status: 'PENDING_REVIEW', keyword: '' });
const rows = ref<FinanceQualificationApplicationRow[]>([]);
const loading = ref(false);
const loadError = ref('');
const detailVisible = ref(false);
const detailLoading = ref(false);
const detailTenantId = ref('');
const detailData = ref<FinanceQualificationDetail>();
const auditVisible = ref(false);
const submitting = ref(false);
const auditTarget = ref<FinanceQualificationApplicationRow>();
const auditForm = reactive<{ decision: 'APPROVE' | 'REJECT' | 'SUPPLEMENT'; remark: string }>({
  decision: 'APPROVE',
  remark: ''
});

const filteredRows = computed(() => {
  const keyword = query.keyword.trim().toLowerCase();
  if (!keyword) return rows.value;
  return rows.value.filter(({ application }) =>
    [application.companyName, application.creditCode, application.sourceReference, application.bankName]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(keyword))
  );
});

async function loadApplications() {
  loading.value = true;
  loadError.value = '';
  try {
    const response: any = await listFinanceQualificationApplications(query.status);
    rows.value = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
  } catch (error: any) {
    rows.value = [];
    loadError.value = error?.message || '财税中心开户认证申请加载失败';
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  loadApplications();
}

function resetQuery() {
  query.status = 'PENDING_REVIEW';
  query.keyword = '';
  loadApplications();
}

async function openDetail(row: FinanceQualificationApplicationRow) {
  detailTenantId.value = row.tenantId;
  detailVisible.value = true;
  detailLoading.value = true;
  detailData.value = undefined;
  try {
    const response: any = await getFinanceQualificationDetail(row.tenantId, row.application.id);
    detailData.value = response?.data || response;
  } finally {
    detailLoading.value = false;
  }
}

function openAudit(row: FinanceQualificationApplicationRow) {
  auditTarget.value = row;
  auditForm.decision = 'APPROVE';
  auditForm.remark = '';
  auditVisible.value = true;
}

async function submitAudit() {
  const target = auditTarget.value;
  const remark = auditForm.remark.trim();
  if (!target) return;
  if (auditForm.decision !== 'APPROVE' && !remark) {
    ElMessage.warning('驳回或补充材料时必须填写审核意见');
    return;
  }
  submitting.value = true;
  try {
    await reviewFinanceQualification({
      tenantId: target.tenantId,
      applicationId: target.application.id,
      applicationVersion: target.application.version,
      decision: auditForm.decision,
      remark
    });
    ElMessage.success('审核提交成功');
    auditVisible.value = false;
    detailVisible.value = false;
    await loadApplications();
  } finally {
    submitting.value = false;
  }
}

async function previewFile(file: FinanceQualificationFile) {
  if (!file.id || !detailTenantId.value) return;
  try {
    const response: any = await previewFinanceQualificationFile(detailTenantId.value, file.id);
    const blob = response?.data instanceof Blob ? response.data : response;
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch {
    ElMessage.error('材料预览失败');
  }
}

function statusMeta(status?: string) {
  const meta: Record<string, { label: string; type: 'warning' | 'success' | 'danger' | 'info' }> = {
    PENDING_REVIEW: { label: '待审核', type: 'warning' },
    APPROVED: { label: '已通过', type: 'success' },
    REJECTED: { label: '已驳回', type: 'danger' },
    SUPPLEMENT: { label: '待补充材料', type: 'info' }
  };
  return meta[status || ''] || { label: status || '-', type: 'info' as const };
}

function fileStatusLabel(status?: string) {
  return status === 'APPROVED' ? '已通过' : status === 'REJECTED' ? '已驳回' : '待核验';
}

function formatDate(value?: string) {
  return value ? value.replace('T', ' ') : '-';
}

function maskPhone(value?: string) {
  if (!value) return '-';
  if (/\*+/.test(value)) return value;
  return value.length >= 7 ? `${value.slice(0, 3)}****${value.slice(-4)}` : '****';
}

onMounted(loadApplications);
</script>

<style scoped>
.table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
