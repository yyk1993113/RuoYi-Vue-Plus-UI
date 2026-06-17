<template>
  <div class="p-4">
    <el-card shadow="never" class="query-card">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="88px">
        <el-form-item label="姓名/昵称" prop="name">
          <el-input
            v-model="queryParams.name"
            placeholder="请输入姓名/昵称"
            clearable
            style="width: 200px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="手机号" prop="phonenumber">
          <el-input
            v-model="queryParams.phonenumber"
            placeholder="请输入手机号"
            clearable
            style="width: 200px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="身份类型" prop="identityType">
          <el-select v-model="queryParams.identityType" placeholder="全部" clearable style="width: 150px">
            <el-option label="内部人员" value="0" />
            <el-option label="外部渠道" value="1" />
          </el-select>
        </el-form-item>
        <el-form-item label="岗位/角色" prop="roleName">
          <el-input
            v-model="queryParams.roleName"
            placeholder="请输入岗位/角色"
            clearable
            style="width: 180px"
            @keyup.enter="handleQuery"
          />
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
          <el-button type="danger" plain icon="Delete" :disabled="selectedIds.length === 0" @click="handleDelete()">
            删除
          </el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button plain icon="Refresh" @click="loadData">刷新</el-button>
        </el-col>
      </el-row>

      <el-table v-loading="loading" :data="tableData" border stripe @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column label="姓名/昵称" prop="name" min-width="150" show-overflow-tooltip />
        <el-table-column label="手机号" prop="phonenumber" width="140" align="center" />
        <el-table-column label="身份类型" prop="identityType" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="row.identityType === '0' ? 'primary' : 'warning'" size="small">
              {{ identityTypeText(row.identityType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="岗位/角色" prop="roleName" min-width="160" show-overflow-tooltip />
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
        <el-table-column label="创建时间" prop="createTime" width="170" align="center" />
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" icon="Edit" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" icon="Delete" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination
        v-show="total > 0"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        :total="total"
        @pagination="loadData"
      />
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="560px" append-to-body @closed="resetForm">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="姓名/昵称" prop="name">
          <el-input v-model="form.name" placeholder="请输入推广人员展示名称" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="手机号" prop="phonenumber">
          <el-input v-model="form.phonenumber" placeholder="账号登录手机号，作为唯一标识" maxlength="11" />
        </el-form-item>
        <el-form-item label="身份类型" prop="identityType">
          <el-radio-group v-model="form.identityType">
            <el-radio label="0">内部人员</el-radio>
            <el-radio label="1">外部渠道</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="岗位/角色" prop="roleName">
          <el-select
            v-model="form.roleName"
            placeholder="请选择或输入岗位/角色"
            clearable
            filterable
            allow-create
            default-first-option
            style="width: 100%"
          >
            <el-option label="销售岗" value="销售岗" />
            <el-option label="拓展岗" value="拓展岗" />
            <el-option label="实习生" value="实习生" />
            <el-option label="渠道" value="渠道" />
            <el-option label="合伙人" value="合伙人" />
          </el-select>
        </el-form-item>
        <el-form-item label="账号状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio label="1">启用</el-radio>
            <el-radio label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="form.remark"
            type="textarea"
            :rows="4"
            placeholder="合作说明、地区、来源等"
            maxlength="500"
            show-word-limit
          />
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
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox, type FormRules } from 'element-plus';
import {
  addPromoter,
  changePromoterStatus,
  delPromoter,
  getPromoter,
  listPromoter,
  updatePromoter,
  type PromoterForm,
  type PromoterQuery,
  type PromoterVO
} from '@/api/recruitment';
import { unwrapList } from './helpers';

const loading = ref(false);
const submitting = ref(false);
const tableData = ref<PromoterVO[]>([]);
const total = ref(0);
const selectedIds = ref<number[]>([]);
const dialogVisible = ref(false);
const isEdit = ref(false);
const queryFormRef = ref();
const formRef = ref();

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
  status: '1',
  remark: ''
});

const rules: FormRules = {
  name: [{ required: true, message: '请输入姓名/昵称', trigger: 'blur' }],
  phonenumber: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ],
  identityType: [{ required: true, message: '请选择身份类型', trigger: 'change' }],
  roleName: [{ required: true, message: '请选择或输入岗位/角色', trigger: 'change' }],
  status: [{ required: true, message: '请选择账号状态', trigger: 'change' }]
};

const dialogTitle = computed(() => (isEdit.value ? '编辑推广人员' : '新增推广人员'));

function identityTypeText(value?: string) {
  return value === '1' ? '外部渠道' : '内部人员';
}

function resetFormData() {
  form.promoterId = undefined;
  form.name = '';
  form.phonenumber = '';
  form.identityType = '0';
  form.roleName = '';
  form.status = '1';
  form.remark = '';
}

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

async function submitForm() {
  await formRef.value?.validate();
  submitting.value = true;
  try {
    if (isEdit.value) {
      await updatePromoter({ ...form });
      ElMessage.success('修改成功');
    } else {
      await addPromoter({ ...form });
      ElMessage.success('新增成功');
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
</style>
