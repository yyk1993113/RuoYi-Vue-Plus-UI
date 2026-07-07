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
        <el-table-column label="操作" width="330" align="center" fixed="right">
          <template #default="{ row }">
            <el-button v-hasPermi="['recruitment:serialRule:query']" link type="primary" icon="Tickets" @click="openRecordDialog(row)">数据</el-button>
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
          <el-col v-if="form.ruleId" :span="12">
            <el-form-item label="更新历史编码">
              <el-switch v-model="syncHistoryOnSave" active-text="是" inactive-text="否" />
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

    <el-dialog v-model="recordDialog.visible" :title="recordDialog.title" width="1080px" append-to-body>
      <el-form :model="recordQuery" :inline="true" label-width="86px" class="mb-3">
        <el-form-item label="关键字">
          <el-input v-model="recordQuery.keyword" placeholder="编号 / 名称" clearable style="width: 220px" @keyup.enter="handleRecordQuery" />
        </el-form-item>
        <el-form-item label="编号范围">
          <el-select v-model="recordQuery.codeScope" style="width: 150px">
            <el-option label="全部" value="all" />
            <el-option label="最新规则" value="current" />
            <el-option label="历史编码" value="history" />
            <el-option label="未编号" value="empty" />
          </el-select>
        </el-form-item>
        <el-form-item label="创建时间">
          <el-date-picker
            v-model="recordDateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 360px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleRecordQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetRecordQuery">重置</el-button>
        </el-form-item>
      </el-form>
      <el-row :gutter="10" class="mb-3">
        <el-col :span="1.5">
          <el-button v-hasPermi="['recruitment:serialRule:edit']" type="primary" plain icon="Refresh" @click="refreshRecordCodes(false)">补齐空编号</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button v-hasPermi="['recruitment:serialRule:edit']" type="warning" plain icon="RefreshRight" @click="refreshRecordCodes(true)">更新历史编码</el-button>
        </el-col>
      </el-row>
      <el-table v-loading="recordLoading" :data="recordList" border stripe max-height="460">
        <el-table-column label="数据类型" width="110" align="center">
          <template #default="{ row }">{{ recordTypeLabel(row.recordType) }}</template>
        </el-table-column>
        <el-table-column label="业务编号" prop="serialNo" min-width="190" show-overflow-tooltip>
          <template #default="{ row }">{{ row.serialNo || '-' }}</template>
        </el-table-column>
        <el-table-column label="编号状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="codeStatusType(row.codeStatus)" size="small">{{ codeStatusLabel(row.codeStatus) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="名称/摘要" prop="title" min-width="180" show-overflow-tooltip />
        <el-table-column label="关联信息" prop="relatedInfo" min-width="170" show-overflow-tooltip />
        <el-table-column label="创建时间" prop="createTime" width="170" align="center" />
        <el-table-column label="更新时间" prop="updateTime" width="170" align="center" />
        <el-table-column label="操作" width="110" align="center" fixed="right">
          <template #default="{ row }">
            <el-button v-hasPermi="['recruitment:serialRule:edit']" link type="primary" icon="Edit" @click="handleEditRecordCode(row)">改编号</el-button>
          </template>
        </el-table-column>
      </el-table>
      <pagination
        v-show="recordTotal > 0"
        v-model:page="recordQuery.pageNum"
        v-model:limit="recordQuery.pageSize"
        :total="recordTotal"
        @pagination="getRecordList"
      />
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="recordDialog.visible = false">关闭</el-button>
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
  listSerialRecords,
  nextSerialNo,
  previewSerialRule,
  refreshSerialRecordCode,
  updateSerialRecordCode,
  updateSerialRule,
  type SerialNoRecordQuery,
  type SerialNoRecordVO,
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
const recordLoading = ref(false);
const total = ref(0);
const recordTotal = ref(0);
const ruleList = ref<SerialNoRuleVO[]>([]);
const recordList = ref<SerialNoRecordVO[]>([]);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const syncHistoryOnSave = ref(false);
const recordDateRange = ref<string[]>([]);
const currentRecordRule = ref<SerialNoRuleVO>();

const queryFormRef = ref<FormInstance>();
const ruleFormRef = ref<FormInstance>();

const dialog = reactive<DialogState>({
  visible: false,
  title: ''
});

const recordDialog = reactive<DialogState>({
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

const defaultRecordQuery: SerialNoRecordQuery = {
  pageNum: 1,
  pageSize: 10,
  businessCode: '',
  keyword: '',
  codeScope: 'all'
};

const recordQuery = reactive<SerialNoRecordQuery>({ ...defaultRecordQuery });

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
  syncHistoryOnSave.value = false;
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
  syncHistoryOnSave.value = false;
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
      if (syncHistoryOnSave.value && form.businessCode) {
        const refreshRes = await refreshSerialRecordCode({ businessCode: form.businessCode, updateExisting: true });
        ElMessage.success(`修改成功，已更新 ${readCount(refreshRes)} 条历史数据`);
      } else {
        ElMessage.success('修改成功');
      }
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
const readCount = (payload: any) => Number(payload?.data?.count ?? payload?.count ?? 0);

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

const openRecordDialog = async (row: SerialNoRuleVO) => {
  currentRecordRule.value = row;
  recordDateRange.value = [];
  Object.assign(recordQuery, {
    ...defaultRecordQuery,
    businessCode: row.businessCode || ''
  });
  recordDialog.title = `${row.businessName || row.businessCode || ''} 编号数据`;
  recordDialog.visible = true;
  await getRecordList();
};

const applyRecordDateRange = () => {
  recordQuery.createTimeBegin = recordDateRange.value?.[0] || undefined;
  recordQuery.createTimeEnd = recordDateRange.value?.[1] || undefined;
};

const getRecordList = async () => {
  if (!recordQuery.businessCode) return;
  applyRecordDateRange();
  recordLoading.value = true;
  try {
    const res = await listSerialRecords(recordQuery);
    recordList.value = res.rows || [];
    recordTotal.value = Number(res.total || 0);
  } finally {
    recordLoading.value = false;
  }
};

const handleRecordQuery = () => {
  recordQuery.pageNum = 1;
  getRecordList();
};

const resetRecordQuery = () => {
  const businessCode = recordQuery.businessCode;
  recordDateRange.value = [];
  Object.assign(recordQuery, {
    ...defaultRecordQuery,
    businessCode
  });
  handleRecordQuery();
};

const refreshRecordCodes = async (updateExisting: boolean) => {
  if (!recordQuery.businessCode) return;
  const name = currentRecordRule.value?.businessName || currentRecordRule.value?.businessCode || recordQuery.businessCode;
  const message = updateExisting
    ? `确认按最新规则更新「${name}」的空编号和历史编码吗？`
    : `确认按最新规则补齐「${name}」未编号的数据吗？`;
  await ElMessageBox.confirm(message, '提示', { type: 'warning' });
  const res = await refreshSerialRecordCode({ businessCode: recordQuery.businessCode, updateExisting });
  ElMessage.success(`已处理 ${readCount(res)} 条数据`);
  await getRecordList();
  getList();
};

const handleEditRecordCode = async (row: SerialNoRecordVO) => {
  const result = await ElMessageBox.prompt('请输入新的业务编号', '自定义修改编号', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputValue: row.serialNo || '',
    inputValidator: (value) => {
      const nextValue = value?.trim() || '';
      return (!!nextValue && nextValue.length <= 64) || '请输入 1-64 位编号';
    }
  });
  await updateSerialRecordCode({
    businessCode: recordQuery.businessCode,
    recordId: row.recordId,
    serialNo: result.value.trim()
  });
  ElMessage.success('修改成功');
  getRecordList();
};

const recordTypeLabel = (value?: string) => {
  const map: Record<string, string> = {
    COMPANY: '企业',
    JOB: '岗位',
    JOB_SEEKER: '求职人',
    APPLY: '投递',
    TASK: '履约任务',
    ORDER: '台账订单',
    INVOICE: '发票'
  };
  return value ? map[value] || value : '-';
};

const codeStatusLabel = (value?: string) => {
  const map: Record<string, string> = {
    current: '最新规则',
    history: '历史编码',
    empty: '未编号'
  };
  return value ? map[value] || value : '-';
};

const codeStatusType = (value?: string) => {
  if (value === 'current') return 'success';
  if (value === 'history') return 'warning';
  return 'info';
};

onMounted(() => {
  getList();
});
</script>
