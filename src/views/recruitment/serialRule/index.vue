<template>
  <div class="p-4">
    <el-card shadow="hover">
      <el-form :model="queryParams" ref="queryFormRef" :inline="true" label-width="92px" class="mb-3">
        <el-form-item label="业务编码" prop="businessCode">
          <el-input v-model="queryParams.businessCode" placeholder="如 JOB / APPLY" clearable style="width: 200px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="业务名称" prop="businessName">
          <el-input v-model="queryParams.businessName" placeholder="请输入业务名称" clearable style="width: 200px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="启用" value="0" />
            <el-option label="停用" value="1" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <el-row :gutter="10" class="mb-3">
        <el-col :span="1.5">
          <el-button v-hasPermi="['recruitment:serialRule:add']" type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button v-hasPermi="['recruitment:serialRule:edit']" type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()">修改</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button v-hasPermi="['recruitment:serialRule:remove']" type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()">删除</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button type="primary" plain icon="Refresh" @click="getList">刷新</el-button>
        </el-col>
      </el-row>

      <el-table v-loading="loading" :data="ruleList" border stripe @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="业务编码" prop="businessCode" min-width="120" show-overflow-tooltip />
        <el-table-column label="业务名称" prop="businessName" min-width="140" show-overflow-tooltip />
        <el-table-column label="编号前缀" prop="prefix" width="110" align="center" />
        <el-table-column label="日期格式" prop="datePattern" width="120" align="center" />
        <el-table-column label="流水位数" prop="seqLength" width="100" align="center" />
        <el-table-column label="分隔符" prop="separator" width="90" align="center" />
        <el-table-column label="校验位" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.checksumEnabled === '0' ? 'success' : 'info'" size="small">{{ row.checksumEnabled === '0' ? '开启' : '关闭' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="每日重置" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.dailyReset === '0' ? 'success' : 'info'" size="small">{{ row.dailyReset === '0' ? '是' : '否' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="样例编号" prop="previewNo" min-width="180" show-overflow-tooltip />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch
              v-hasPermi="['recruitment:serialRule:edit']"
              v-model="row.status"
              active-value="0"
              inactive-value="1"
              active-text="启用"
              inactive-text="停用"
              inline-prompt
              @change="handleStatusChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="创建时间" prop="createTime" width="170" align="center" />
        <el-table-column label="操作" width="250" align="center" fixed="right">
          <template #default="{ row }">
            <el-button v-hasPermi="['recruitment:serialRule:query']" link type="primary" icon="View" @click="handlePreview(row)">预览</el-button>
            <el-button v-hasPermi="['recruitment:serialRule:next']" link type="warning" icon="MagicStick" @click="handleNext(row)">生成</el-button>
            <el-button v-hasPermi="['recruitment:serialRule:edit']" link type="primary" icon="Edit" @click="handleUpdate(row)">修改</el-button>
            <el-button v-hasPermi="['recruitment:serialRule:remove']" link type="danger" icon="Delete" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <el-dialog v-model="dialog.visible" :title="dialog.title" width="720px" append-to-body>
      <el-form ref="ruleFormRef" :model="form" :rules="rules" label-width="110px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="业务编码" prop="businessCode">
              <el-input v-model="form.businessCode" placeholder="大写字母/数字/下划线" maxlength="32" :disabled="!!form.ruleId" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="业务名称" prop="businessName">
              <el-input v-model="form.businessName" placeholder="请输入业务名称" maxlength="50" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="编号前缀" prop="prefix">
              <el-input v-model="form.prefix" placeholder="2-8 位大写字母/数字" maxlength="8" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="日期格式" prop="datePattern">
              <el-select v-model="form.datePattern" style="width: 100%">
                <el-option label="yyyyMMdd" value="yyyyMMdd" />
                <el-option label="yyyyMM" value="yyyyMM" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="流水位数" prop="seqLength">
              <el-input-number v-model="form.seqLength" :min="3" :max="12" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="分隔符" prop="separator">
              <el-input v-model="form.separator" maxlength="4" placeholder="默认 -" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="校验位" prop="checksumEnabled">
              <el-radio-group v-model="form.checksumEnabled">
                <el-radio label="0">开启</el-radio>
                <el-radio label="1">关闭</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="每日重置" prop="dailyReset">
              <el-radio-group v-model="form.dailyReset">
                <el-radio label="0">是</el-radio>
                <el-radio label="1">否</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio label="0">启用</el-radio>
                <el-radio label="1">停用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注" prop="remark">
              <el-input v-model="form.remark" type="textarea" :rows="3" maxlength="200" show-word-limit placeholder="请输入备注" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialog.visible = false">取消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="submitForm">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import {
  addSerialRule,
  changeSerialRuleStatus,
  delSerialRule,
  getSerialRule,
  listSerialRule,
  nextSerialNo,
  previewSerialRule,
  updateSerialRule,
  type SerialNoRuleQuery,
  type SerialNoRuleVO
} from '@/api/recruitment/serialRule';

// 后端菜单 component 为 recruitment/serialRule/index；文件路径必须严格匹配动态路由扫描结果。
defineOptions({ name: 'recruitment/serialRule/index' });

type DialogState = {
  visible: boolean;
  title: string;
};

const loading = ref(false);
const submitLoading = ref(false);
const total = ref(0);
const ruleList = ref<SerialNoRuleVO[]>([]);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);

const queryFormRef = ref<FormInstance>();
const ruleFormRef = ref<FormInstance>();

const dialog = reactive<DialogState>({
  visible: false,
  title: ''
});

const defaultQuery: SerialNoRuleQuery = {
  pageNum: 1,
  pageSize: 10,
  businessCode: '',
  businessName: '',
  status: ''
};

const queryParams = reactive<SerialNoRuleQuery>({ ...defaultQuery });

const form = reactive<SerialNoRuleVO>({
  ruleId: undefined,
  businessCode: '',
  businessName: '',
  prefix: '',
  datePattern: 'yyyyMMdd',
  seqLength: 4,
  separator: '-',
  checksumEnabled: '0',
  dailyReset: '0',
  status: '0',
  remark: ''
});

const rules: FormRules = {
  businessCode: [
    { required: true, message: '业务编码不能为空', trigger: 'blur' },
    { pattern: /^[A-Z0-9_]{2,32}$/, message: '仅支持 2-32 位大写字母、数字、下划线', trigger: 'blur' }
  ],
  businessName: [{ required: true, message: '业务名称不能为空', trigger: 'blur' }],
  prefix: [
    { required: true, message: '编号前缀不能为空', trigger: 'blur' },
    { pattern: /^[A-Z0-9]{2,8}$/, message: '仅支持 2-8 位大写字母和数字', trigger: 'blur' }
  ],
  datePattern: [{ required: true, message: '请选择日期格式', trigger: 'change' }],
  seqLength: [{ required: true, message: '请输入流水位数', trigger: 'change' }],
  checksumEnabled: [{ required: true, message: '请选择是否启用校验位', trigger: 'change' }],
  dailyReset: [{ required: true, message: '请选择是否每日重置', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
};

const normalizeFormCodes = () => {
  form.businessCode = form.businessCode?.trim().toUpperCase();
  form.prefix = form.prefix?.trim().toUpperCase();
  form.separator = form.separator?.trim() || '-';
};

const resetForm = () => {
  Object.assign(form, {
    ruleId: undefined,
    businessCode: '',
    businessName: '',
    prefix: '',
    datePattern: 'yyyyMMdd',
    seqLength: 4,
    separator: '-',
    checksumEnabled: '0',
    dailyReset: '0',
    status: '0',
    remark: ''
  });
  ruleFormRef.value?.clearValidate();
};

const getList = async () => {
  loading.value = true;
  try {
    const res = await listSerialRule(queryParams);
    ruleList.value = res.rows || [];
    total.value = Number(res.total || 0);
  } finally {
    loading.value = false;
  }
};

const handleQuery = () => {
  queryParams.pageNum = 1;
  getList();
};

const resetQuery = () => {
  Object.assign(queryParams, { ...defaultQuery });
  queryFormRef.value?.resetFields();
  handleQuery();
};

const handleSelectionChange = (selection: SerialNoRuleVO[]) => {
  ids.value = selection.map((item) => item.ruleId).filter((id): id is string | number => id !== undefined && id !== null);
  single.value = selection.length !== 1;
  multiple.value = selection.length === 0;
};

const handleAdd = () => {
  resetForm();
  dialog.title = '新增流水编号规则';
  dialog.visible = true;
};

const handleUpdate = async (row?: SerialNoRuleVO) => {
  resetForm();
  const ruleId = row?.ruleId ?? ids.value[0];
  if (!ruleId) return;
  const res = await getSerialRule(ruleId);
  Object.assign(form, res.data || res);
  dialog.title = '修改流水编号规则';
  dialog.visible = true;
};

const submitForm = async () => {
  normalizeFormCodes();
  await ruleFormRef.value?.validate();
  submitLoading.value = true;
  try {
    if (form.ruleId) {
      await updateSerialRule(form);
      ElMessage.success('修改成功');
    } else {
      await addSerialRule(form);
      ElMessage.success('新增成功');
    }
    dialog.visible = false;
    getList();
  } finally {
    submitLoading.value = false;
  }
};

const handleDelete = async (row?: SerialNoRuleVO) => {
  const removeIds = row?.ruleId ?? ids.value;
  await ElMessageBox.confirm('确认删除选中的流水编号规则吗？', '提示', { type: 'warning' });
  await delSerialRule(removeIds);
  ElMessage.success('删除成功');
  getList();
};

const handleStatusChange = async (row: SerialNoRuleVO) => {
  const text = row.status === '0' ? '启用' : '停用';
  try {
    await ElMessageBox.confirm(`确认${text}业务「${row.businessName || row.businessCode}」的流水编号规则吗？`, '提示', { type: 'warning' });
    await changeSerialRuleStatus(row.ruleId!, row.status || '0');
    ElMessage.success(`${text}成功`);
  } catch (error) {
    row.status = row.status === '0' ? '1' : '0';
  }
};

const readSerialNo = (payload: any) => payload?.data?.serialNo || payload?.serialNo || '';

const handlePreview = async (row: SerialNoRuleVO) => {
  const res = await previewSerialRule(row);
  ElMessageBox.alert(readSerialNo(res) || row.previewNo || '-', '样例编号', { confirmButtonText: '知道了' });
};

const handleNext = async (row: SerialNoRuleVO) => {
  if (!row.businessCode) return;
  const res = await nextSerialNo(row.businessCode);
  ElMessageBox.alert(readSerialNo(res) || '-', '已生成编号', { confirmButtonText: '知道了' });
  getList();
};

onMounted(() => {
  getList();
});
</script>
