<template>
  <div class="p-4">
    <el-card shadow="never" class="query-card">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="88px">
        <el-form-item label="姓名/昵称" prop="name">
          <el-input v-model="queryParams.name" placeholder="请输入姓名/昵称" clearable style="width: 200px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="手机号" prop="phonenumber">
          <el-input v-model="queryParams.phonenumber" placeholder="请输入手机号" clearable style="width: 200px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="身份类型" prop="identityType">
          <el-select v-model="queryParams.identityType" placeholder="全部" clearable style="width: 150px">
            <el-option label="内部渠道" value="0" />
            <el-option label="外部渠道" value="1" />
            <el-option label="合伙人" value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="岗位/角色" prop="roleName">
          <el-input v-model="queryParams.roleName" placeholder="请输入岗位/角色" clearable style="width: 180px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="账号状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 130px">
            <el-option label="启用" value="1" />
            <el-option label="禁用" value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="table-card">
      <el-row :gutter="10" class="mb-3">
        <el-col :span="1.5">
          <el-button type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button type="danger" plain icon="Delete" :disabled="selectedIds.length === 0" @click="handleDelete()"> 删除 </el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button plain icon="Refresh" @click="loadData">刷新</el-button>
        </el-col>
        <el-col v-if="isAdminUser" :span="1.5">
          <el-button type="success" plain icon="DataAnalysis" @click="handleOpenStatistics">统计</el-button>
        </el-col>
      </el-row>

      <el-table v-loading="loading" :data="tableData" border stripe @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column label="姓名/昵称" prop="name" min-width="150" show-overflow-tooltip />
        <el-table-column label="手机号" prop="phonenumber" width="140" align="center" />
        <el-table-column label="身份类型" prop="identityType" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="identityTypeTag(row.identityType)" size="small">
              {{ identityTypeText(row.identityType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="岗位/角色" prop="roleName" min-width="160" show-overflow-tooltip />
        <el-table-column label="企业数量" prop="companyCount" width="110" align="center">
          <template #default="{ row }">{{ row.companyCount ?? 0 }}</template>
        </el-table-column>
        <el-table-column label="求职者数量" prop="jobSeekerCount" width="120" align="center">
          <template #default="{ row }">{{ row.jobSeekerCount ?? 0 }}</template>
        </el-table-column>
        <el-table-column label="账号状态" prop="status" width="120" align="center">
          <template #default="{ row }">
            <el-switch
              :model-value="row.status"
              active-value="1"
              inactive-value="0"
              active-text="启用"
              inactive-text="禁用"
              inline-prompt
              @change="(val) => handleStatusChange(row, val as string)"
            />
          </template>
        </el-table-column>
        <el-table-column label="备注" prop="remark" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">{{ row.remark || '-' }}</template>
        </el-table-column>
        <el-table-column label="推广码" prop="promotionCode" min-width="190" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="promotion-cell">
              <span class="promotion-code">{{ row.promotionCode || '-' }}</span>
              <el-button v-if="row.promotionCode" link type="primary" icon="CopyDocument" @click="handleCopyPromotion(row)"> 复制链接 </el-button>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" prop="createTime" width="170" align="center" />
        <el-table-column label="操作" width="260" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" icon="Download" @click="handleDownloadQrCode(row)">下载码</el-button>
            <el-button link type="primary" icon="Edit" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" icon="Delete" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="loadData" />
    </el-card>

    <el-dialog v-model="statisticsVisible" title="渠道推广统计" width="1280px" append-to-body>
      <el-form :model="statisticsQuery" :inline="true" label-width="78px" class="statistics-filter">
        <el-form-item label="推广人">
          <el-input v-model="statisticsQuery.name" placeholder="请输入姓名/昵称" clearable style="width: 180px" @keyup.enter="loadStatistics" />
        </el-form-item>
        <el-form-item label="身份">
          <el-select v-model="statisticsQuery.identityType" placeholder="全部" clearable style="width: 150px">
            <el-option label="内部渠道" value="0" />
            <el-option label="外部渠道" value="1" />
            <el-option label="合伙人" value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间">
          <el-date-picker
            v-model="statisticsDateRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            range-separator="-"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item label="时间维度">
          <el-select v-model="statisticsTimeUnit" placeholder="按天" style="width: 140px">
            <el-option v-for="item in statisticsTimeUnitOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="loadStatistics">搜索</el-button>
          <el-button icon="Refresh" @click="resetStatisticsQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <el-row :gutter="12" class="statistics-overview">
        <el-col :span="8">
          <div class="statistics-card">
            <span>推广人</span>
            <strong>{{ statisticsData.totalPromoterCount || 0 }}</strong>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="statistics-card">
            <span>B端</span>
            <strong>{{ statisticsData.totalCompanyCount || 0 }}</strong>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="statistics-card">
            <span>C端</span>
            <strong>{{ statisticsData.totalJobSeekerCount || 0 }}</strong>
          </div>
        </el-col>
      </el-row>

      <el-table v-loading="statisticsLoading" :data="statisticsData.rows || []" border height="300" class="statistics-table">
        <el-table-column label="推广人" prop="name" min-width="130" show-overflow-tooltip />
        <el-table-column label="身份" prop="identityType" width="110" align="center">
          <template #default="{ row }">{{ identityTypeText(row.identityType) }}</template>
        </el-table-column>
        <el-table-column label="岗位/角色" prop="roleName" min-width="130" show-overflow-tooltip />
        <el-table-column label="B端" prop="companyCount" width="90" align="center">
          <template #default="{ row }">{{ row.companyCount || 0 }}</template>
        </el-table-column>
        <el-table-column label="C端" prop="jobSeekerCount" width="90" align="center">
          <template #default="{ row }">{{ row.jobSeekerCount || 0 }}</template>
        </el-table-column>
        <el-table-column label="创建时间" prop="createTime" width="170" align="center" />
      </el-table>

      <el-row :gutter="12" class="statistics-breakdown">
        <el-col :span="12">
          <div class="breakdown-title">按身份统计</div>
          <el-table :data="statisticsData.identityStats || []" border size="small">
            <el-table-column label="身份" prop="label" />
            <el-table-column label="推广人" prop="promoterCount" align="center" />
            <el-table-column label="B端" prop="companyCount" align="center" />
            <el-table-column label="C端" prop="jobSeekerCount" align="center" />
          </el-table>
        </el-col>
        <el-col :span="12">
          <div class="breakdown-title">按时间统计</div>
          <el-table :data="statisticsData.timeStats || []" border size="small">
            <el-table-column label="时间" prop="label" min-width="96" />
            <el-table-column label="推广人" prop="promoterCount" align="center" />
            <el-table-column label="B端" prop="companyCount" align="center" />
            <el-table-column label="C端" prop="jobSeekerCount" align="center" />
          </el-table>
        </el-col>
      </el-row>
    </el-dialog>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="560px" append-to-body @closed="resetForm">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="姓名/昵称" prop="name">
          <el-input v-model="form.name" placeholder="请输入推广人员展示名称" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="手机号" prop="phonenumber">
          <el-input v-model="form.phonenumber" placeholder="账号登录手机号，作为唯一标识" maxlength="11" />
        </el-form-item>
        <el-form-item label="身份类型" prop="identityType">
          <el-radio-group v-model="form.identityType" @change="handleIdentityTypeChange">
            <el-radio label="0">内部渠道</el-radio>
            <el-radio label="1">外部渠道</el-radio>
            <el-radio label="2">合伙人</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="岗位/角色" prop="roleName">
          <el-select v-model="form.roleName" placeholder="请选择岗位/角色" clearable filterable style="width: 100%">
            <el-option v-for="item in roleOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-row v-if="isEdit" :gutter="12">
          <el-col :span="12">
            <el-form-item label="企业数量" prop="companyCount">
              <el-input-number v-model="form.companyCount" :min="0" :precision="0" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="求职者数量" prop="jobSeekerCount">
              <el-input-number v-model="form.jobSeekerCount" :min="0" :precision="0" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="账号状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio label="1">启用</el-radio>
            <el-radio label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="4" placeholder="合作说明、地区、来源等" maxlength="500" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="RecruitmentPromoter" lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { ElMessage, ElMessageBox, type FormRules } from 'element-plus';
import {
  addPromoter,
  changePromoterStatus,
  delPromoter,
  getPromoter,
  getPromoterStatistics,
  listPromoter,
  updatePromoter,
  type PromoterForm,
  type PromoterQuery,
  type PromoterStatisticsTimeUnit,
  type PromoterStatisticsVO,
  type PromoterVO
} from '@/api/recruitment';
import { download } from '@/utils/request';
import { useUserStore } from '@/store/modules/user';
import { unwrapList } from './helpers';

const loading = ref(false);
const submitting = ref(false);
const tableData = ref<PromoterVO[]>([]);
const total = ref(0);
const selectedIds = ref<Array<string | number>>([]);
const dialogVisible = ref(false);
const isEdit = ref(false);
const queryFormRef = ref();
const formRef = ref();
const userStore = useUserStore();
const isAdminUser = computed(() => userStore.roles.includes('superadmin'));
const statisticsVisible = ref(false);
const statisticsLoading = ref(false);
const statisticsDateRange = ref<[string, string] | []>([]);
const statisticsTimeUnit = ref<PromoterStatisticsTimeUnit>('day');
const statisticsTimeUnitOptions: { label: string; value: PromoterStatisticsTimeUnit }[] = [
  { label: '按天', value: 'day' },
  { label: '按周', value: 'week' },
  { label: '按月', value: 'month' },
  { label: '按季度', value: 'quarter' },
  { label: '按年', value: 'year' }
];

const statisticsQuery = reactive<PromoterQuery>({
  name: '',
  identityType: '',
  roleName: ''
});

const statisticsData = reactive<PromoterStatisticsVO>({
  totalPromoterCount: 0,
  totalCompanyCount: 0,
  totalJobSeekerCount: 0,
  rows: [],
  identityStats: [],
  timeStats: []
});

const queryParams = reactive<PromoterQuery>({
  pageNum: 1,
  pageSize: 10,
  name: '',
  phonenumber: '',
  identityType: '',
  roleName: '',
  status: ''
});

const form = reactive<PromoterForm>({
  promoterId: undefined,
  name: '',
  phonenumber: '',
  identityType: '0',
  roleName: '',
  companyCount: 0,
  jobSeekerCount: 0,
  status: '1',
  remark: ''
});

// 渠道推广人员的数量字段由运营手工维护，后端按 company_count/job_seeker_count 原样落库。
const nonNegativeCountRule = { type: 'number', min: 0, message: '数量不能小于0', trigger: 'change' } as const;
const roleOptionsMap: Record<string, string[]> = {
  // 身份类型为内部渠道时，岗位/角色作为二级分类使用。
  '0': ['实习生', '销售岗', '拓展岗'],
  '1': ['外部渠道'],
  '2': ['合伙人']
};

const rules: FormRules = {
  name: [{ required: true, message: '请输入姓名/昵称', trigger: 'blur' }],
  phonenumber: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ],
  identityType: [{ required: true, message: '请选择身份类型', trigger: 'change' }],
  roleName: [{ required: true, message: '请选择岗位/角色', trigger: 'change' }],
  companyCount: [nonNegativeCountRule],
  jobSeekerCount: [nonNegativeCountRule],
  status: [{ required: true, message: '请选择账号状态', trigger: 'change' }]
};

const dialogTitle = computed(() => (isEdit.value ? '编辑推广人员' : '新增推广人员'));
const roleOptions = computed(() => roleOptionsMap[form.identityType || '0'] || []);

function identityTypeText(value?: string) {
  if (value === '1') return '外部渠道';
  if (value === '2') return '合伙人';
  return '内部渠道';
}

function identityTypeTag(value?: string): 'primary' | 'warning' | 'success' {
  if (value === '1') return 'warning';
  if (value === '2') return 'success';
  return 'primary';
}

function resetFormData() {
  form.promoterId = undefined;
  form.name = '';
  form.phonenumber = '';
  form.identityType = '0';
  form.roleName = '';
  form.companyCount = 0;
  form.jobSeekerCount = 0;
  form.status = '1';
  form.remark = '';
}

function handleIdentityTypeChange(value: string | number | boolean | undefined) {
  const type = String(value ?? '0');
  const options = roleOptionsMap[type] || [];
  form.roleName = options.length === 1 ? options[0] : '';
}

watch(
  () => form.identityType,
  (value) => {
    const options = roleOptionsMap[value || '0'] || [];
    if (form.roleName && !options.includes(form.roleName)) {
      form.roleName = options.length === 1 ? options[0] : '';
    }
  }
);

function buildQuery() {
  return {
    ...queryParams,
    name: queryParams.name || undefined,
    phonenumber: queryParams.phonenumber || undefined,
    identityType: queryParams.identityType || undefined,
    roleName: queryParams.roleName || undefined,
    status: queryParams.status || undefined
  };
}

async function loadData() {
  loading.value = true;
  try {
    const res = await listPromoter(buildQuery());
    const list = unwrapList<PromoterVO>(res);
    tableData.value = list.rows;
    total.value = list.total;
  } finally {
    loading.value = false;
  }
}

function buildStatisticsQuery(): PromoterQuery {
  const [beginDate, endDate] = statisticsDateRange.value;
  return {
    ...statisticsQuery,
    name: statisticsQuery.name || undefined,
    identityType: statisticsQuery.identityType || undefined,
    roleName: statisticsQuery.roleName || undefined,
    params: {
      beginTime: beginDate ? `${beginDate} 00:00:00` : undefined,
      endTime: endDate ? `${endDate} 23:59:59` : undefined,
      timeUnit: statisticsTimeUnit.value
    }
  };
}

async function loadStatistics() {
  statisticsLoading.value = true;
  try {
    const res: any = await getPromoterStatistics(buildStatisticsQuery());
    Object.assign(statisticsData, {
      totalPromoterCount: 0,
      totalCompanyCount: 0,
      totalJobSeekerCount: 0,
      rows: [],
      identityStats: [],
      timeStats: [],
      ...(res?.data || {})
    });
  } finally {
    statisticsLoading.value = false;
  }
}

function handleOpenStatistics() {
  statisticsVisible.value = true;
  loadStatistics();
}

function resetStatisticsQuery() {
  statisticsQuery.name = '';
  statisticsQuery.identityType = '';
  statisticsQuery.roleName = '';
  statisticsDateRange.value = [];
  statisticsTimeUnit.value = 'day';
  loadStatistics();
}

function handleQuery() {
  queryParams.pageNum = 1;
  loadData();
}

function resetQuery() {
  queryFormRef.value?.resetFields?.();
  queryParams.pageNum = 1;
  loadData();
}

function handleSelectionChange(rows: PromoterVO[]) {
  selectedIds.value = rows.map((row) => row.promoterId!).filter(Boolean);
}

function handleAdd() {
  isEdit.value = false;
  resetFormData();
  dialogVisible.value = true;
}

async function handleEdit(row: PromoterVO) {
  isEdit.value = true;
  resetFormData();
  try {
    const res: any = await getPromoter(row.promoterId!);
    Object.assign(form, res?.data || row);
  } catch {
    Object.assign(form, row);
  }
  dialogVisible.value = true;
}

function resetForm() {
  formRef.value?.clearValidate?.();
}

function buildPromotionLink(row: PromoterVO) {
  const page = row.promotionPage || 'pages/login/index';
  if (row.promoterId) {
    return `${page}?promoterId=${encodeURIComponent(String(row.promoterId))}`;
  }
  if (row.promotionLink) {
    return row.promotionLink;
  }
  const code = row.promotionCode || (row.promoterId ? String(row.promoterId) : '');
  if (!code) {
    return '';
  }
  return `${page}?promoterCode=${encodeURIComponent(code)}`;
}

async function handleCopyPromotion(row: PromoterVO) {
  const link = buildPromotionLink(row);
  if (!link) {
    ElMessage.warning('暂无推广链接');
    return;
  }
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(link);
  } else {
    const input = document.createElement('textarea');
    input.value = link;
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
  }
  ElMessage.success('推广链接已复制');
}

function handleDownloadQrCode(row: PromoterVO) {
  if (!row.promoterId) {
    ElMessage.warning('请先保存推广员');
    return;
  }
  const fileName = `推广二维码_${row.name || row.promoterId}.jpg`;
  download(`/admin/recruitment/promoter/${row.promoterId}/qrcode/download`, {}, fileName);
}

async function submitForm() {
  await formRef.value?.validate();
  submitting.value = true;
  try {
    const payload = {
      ...form,
      companyCount: form.companyCount ?? 0,
      jobSeekerCount: form.jobSeekerCount ?? 0
    };
    if (isEdit.value) {
      await updatePromoter(payload);
      ElMessage.success('修改成功');
    } else {
      await addPromoter(payload);
      ElMessage.success('新增成功，已生成专属推广链接');
    }
    dialogVisible.value = false;
    loadData();
  } finally {
    submitting.value = false;
  }
}

async function handleStatusChange(row: PromoterVO, status: string) {
  try {
    await changePromoterStatus({ promoterId: row.promoterId!, status });
    row.status = status;
    ElMessage.success('状态已更新');
  } catch {
    loadData();
  }
}

async function handleDelete(row?: PromoterVO) {
  const ids = row?.promoterId ? [row.promoterId] : selectedIds.value;
  if (!ids.length) return;
  try {
    await ElMessageBox.confirm(`确定删除选中的 ${ids.length} 条推广人员吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    await delPromoter(ids);
    ElMessage.success('删除成功');
    loadData();
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败');
    }
  }
}

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.query-card {
  margin-bottom: 16px;
}

.table-card {
  min-height: 420px;
}

.mb-3 {
  margin-bottom: 16px;
}

.promotion-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.promotion-code {
  font-family: var(--el-font-family);
  color: var(--el-text-color-primary);
}

.statistics-filter {
  padding-bottom: 6px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.statistics-overview {
  margin: 14px 0;
}

.statistics-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 74px;
  padding: 14px 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-light);
}

.statistics-card span {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.statistics-card strong {
  font-size: 24px;
  line-height: 1;
  color: var(--el-text-color-primary);
}

.statistics-table {
  margin-top: 8px;
}

.statistics-breakdown {
  margin-top: 14px;
}

.breakdown-title {
  margin-bottom: 8px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
</style>
