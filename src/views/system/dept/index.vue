<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="部门名称" prop="deptName">
              <el-input v-model="queryParams.deptName" placeholder="请输入部门名称" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="类别编码" prop="deptCategory">
              <el-input v-model="queryParams.deptCategory" placeholder="请输入类别编码" clearable style="width: 240px" @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-select v-model="queryParams.status" placeholder="部门状态" clearable>
                <el-option v-for="dict in sys_normal_disable" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
              <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </transition>

    <el-card shadow="hover">
      <template #header>
        <el-row :gutter="10">
          <el-col :span="1.5">
            <el-button v-hasPermi="['system:dept:add']" type="primary" plain icon="Plus" @click="handleAdd()">新增 </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="info" plain icon="Sort" @click="handleToggleExpandAll">展开/折叠</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['system:dept:add']" type="success" plain icon="Connection" @click="openOrgTemplateDialog">B端组织模板</el-button>
          </el-col>
          <right-toolbar v-model:show-search="showSearch" @query-table="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table
        ref="deptTableRef"
        v-loading="loading"
        :data="deptList"
        row-key="deptId"
        border
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        :default-expand-all="isExpandAll"
      >
        <el-table-column prop="deptName" label="部门名称" width="260"></el-table-column>
        <el-table-column prop="deptCategory" align="center" label="类别编码" width="200"></el-table-column>
        <el-table-column prop="orderNum" align="center" label="排序" width="200"></el-table-column>
        <el-table-column prop="status" align="center" label="状态" width="100">
          <template #default="scope">
            <dict-tag :options="sys_normal_disable" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" prop="createTime" width="200">
          <template #default="scope">
            <span>{{ proxy.parseTime(scope.row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column fixed="right" align="center" label="操作">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button v-hasPermi="['system:dept:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)" />
            </el-tooltip>
            <el-tooltip content="新增" placement="top">
              <el-button v-hasPermi="['system:dept:add']" link type="primary" icon="Plus" @click="handleAdd(scope.row)" />
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button v-hasPermi="['system:dept:remove']" link type="primary" icon="Delete" @click="handleDelete(scope.row)" />
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialog.visible" :title="dialog.title" destroy-on-close append-to-body width="600px">
      <el-form ref="deptFormRef" :model="form" :rules="rules" label-width="80px">
        <el-row>
          <el-col v-if="form.parentId !== 0" :span="24">
            <el-form-item label="上级部门" prop="parentId">
              <el-tree-select
                v-model="form.parentId"
                :data="deptOptions"
                :props="{ value: 'deptId', label: 'deptName', children: 'children' } as any"
                value-key="deptId"
                placeholder="选择上级部门"
                check-strictly
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="部门名称" prop="deptName">
              <el-input v-model="form.deptName" placeholder="请输入部门名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="类别编码" prop="deptCategory">
              <el-input v-model="form.deptCategory" placeholder="请输入类别编码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="显示排序" prop="orderNum">
              <el-input-number v-model="form.orderNum" controls-position="right" :min="0" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="负责人" prop="leader">
              <el-select v-model="form.leader" placeholder="请选择负责人">
                <el-option v-for="item in deptUserList" :key="item.userId" :label="item.userName" :value="item.userId" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="phone">
              <el-input v-model="form.phone" placeholder="请输入联系电话" maxlength="11" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="form.email" placeholder="请输入邮箱" maxlength="50" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="部门状态">
              <el-radio-group v-model="form.status">
                <el-radio v-for="dict in sys_normal_disable" :key="dict.value" :value="dict.value">{{ dict.label }}</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="orgTemplateDialog.visible" title="B端企业组织架构初始化模板" append-to-body width="760px">
      <el-alert
        title="模板仅作为企业初始化组织架构参考；点击节点后会打开原有新增部门弹窗，仍需选择上级部门并手动确认保存。"
        type="info"
        :closable="false"
        show-icon
        class="mb-3"
      />
      <el-tabs v-model="activeOrgTemplateKey">
        <el-tab-pane v-for="template in orgTemplates" :key="template.key" :label="template.name" :name="template.key">
          <div class="org-template-layout">
            <div class="org-template-desc">
              <div class="org-template-title">{{ template.name }}</div>
              <div class="org-template-text">{{ template.desc }}</div>
            </div>
            <el-tree
              :data="template.nodes"
              node-key="id"
              default-expand-all
              :props="{ label: 'deptName', children: 'children' }"
              @node-click="handleOrgTemplateNodeClick"
            >
              <template #default="{ data }">
                <span class="org-template-node">
                  <span>{{ data.deptName }}</span>
                  <el-tag size="small" effect="plain">{{ data.deptCategory }}</el-tag>
                </span>
              </template>
            </el-tree>
          </div>
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" :disabled="!selectedOrgTemplateNode" @click="handleAddFromOrgTemplate">按选中节点新增</el-button>
          <el-button @click="handleCustomOrgBuild">自定义搭建</el-button>
          <el-button @click="orgTemplateDialog.visible = false">关 闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Dept" lang="ts">
import { listDept, getDept, delDept, addDept, updateDept, listDeptExcludeChild } from '@/api/system/dept';
import { DeptForm, DeptQuery, DeptVO } from '@/api/system/dept/types';
import { UserVO } from '@/api/system/user/types';
import { listUserByDeptId } from '@/api/system/user';

interface DeptOptionsType {
  deptId: number | string;
  deptName: string;
  children: DeptOptionsType[];
}

interface OrgTemplateNode {
  id: string;
  deptName: string;
  deptCategory: string;
  orderNum: number;
  children?: OrgTemplateNode[];
}

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { sys_normal_disable } = toRefs<any>(proxy?.useDict('sys_normal_disable'));

const deptList = ref<DeptVO[]>([]);
const loading = ref(true);
const showSearch = ref(true);
const deptOptions = ref<DeptOptionsType[]>([]);
const isExpandAll = ref(true);
const deptUserList = ref<UserVO[]>([]);
const activeOrgTemplateKey = ref('standard');
const selectedOrgTemplateNode = ref<OrgTemplateNode>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});
const orgTemplateDialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const orgTemplates: Array<{ key: string; name: string; desc: string; nodes: OrgTemplateNode[] }> = [
  {
    key: 'standard',
    name: '标准企业模板',
    desc: '适合多数中小企业：总经办、人事行政、招聘、财务、业务部门分层清晰，方便快速初始化。',
    nodes: [
      {
        id: 'standard-root',
        deptName: '企业总部',
        deptCategory: 'company',
        orderNum: 1,
        children: [
          { id: 'standard-office', deptName: '总经办', deptCategory: 'company_office', orderNum: 1 },
          { id: 'standard-hr', deptName: '人事行政部', deptCategory: 'company_hr_admin', orderNum: 2 },
          { id: 'standard-recruit', deptName: '招聘部', deptCategory: 'company_recruit', orderNum: 3 },
          { id: 'standard-finance', deptName: '财务部', deptCategory: 'company_finance', orderNum: 4 },
          { id: 'standard-business', deptName: '业务部', deptCategory: 'company_business', orderNum: 5 }
        ]
      }
    ]
  },
  {
    key: 'recruitment',
    name: '招聘型企业模板',
    desc: '适合招聘需求较重的企业：突出招聘管理、候选人运营、面试协同和用工交付。',
    nodes: [
      {
        id: 'recruitment-root',
        deptName: '招聘中心',
        deptCategory: 'company_recruit_center',
        orderNum: 1,
        children: [
          { id: 'recruitment-manager', deptName: '招聘管理组', deptCategory: 'company_recruit_manager', orderNum: 1 },
          { id: 'recruitment-specialist', deptName: '招聘专员组', deptCategory: 'company_recruit_specialist', orderNum: 2 },
          { id: 'recruitment-interview', deptName: '面试协同组', deptCategory: 'company_interview', orderNum: 3 },
          { id: 'recruitment-delivery', deptName: '入职交付组', deptCategory: 'company_delivery', orderNum: 4 }
        ]
      }
    ]
  },
  {
    key: 'simple',
    name: '小微企业模板',
    desc: '适合组织较轻的小微企业：保留核心管理、招聘、人事财务三个基础单元。',
    nodes: [
      {
        id: 'simple-root',
        deptName: '企业组织',
        deptCategory: 'company',
        orderNum: 1,
        children: [
          { id: 'simple-management', deptName: '管理组', deptCategory: 'company_management', orderNum: 1 },
          { id: 'simple-recruit', deptName: '招聘组', deptCategory: 'company_recruit', orderNum: 2 },
          { id: 'simple-admin', deptName: '人事财务组', deptCategory: 'company_admin_finance', orderNum: 3 }
        ]
      }
    ]
  }
];

const deptTableRef = ref<ElTableInstance>();
const queryFormRef = ref<ElFormInstance>();
const deptFormRef = ref<ElFormInstance>();

const initFormData: DeptForm = {
  deptId: undefined,
  parentId: undefined,
  deptName: undefined,
  deptCategory: undefined,
  orderNum: 0,
  leader: undefined,
  phone: undefined,
  email: undefined,
  status: '0'
};
const initData: PageData<DeptForm, DeptQuery> = {
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    deptName: undefined,
    deptCategory: undefined,
    status: undefined
  },
  rules: {
    parentId: [{ required: true, message: '上级部门不能为空', trigger: 'blur' }],
    deptName: [{ required: true, message: '部门名称不能为空', trigger: 'blur' }],
    orderNum: [{ required: true, message: '显示排序不能为空', trigger: 'blur' }],
    email: [{ type: 'email', message: '请输入正确的邮箱地址', trigger: ['blur', 'change'] }],
    phone: [{ pattern: /^1[3456789][0-9]\d{8}$/, message: '请输入正确的手机号码', trigger: 'blur' }]
  }
};
const data = reactive<PageData<DeptForm, DeptQuery>>(initData);

const { queryParams, form, rules } = toRefs<PageData<DeptForm, DeptQuery>>(data);

/** 查询菜单列表 */
const getList = async () => {
  loading.value = true;
  const res = await listDept(queryParams.value);
  const data = proxy?.handleTree<DeptVO>(res.data, 'deptId');
  if (data) {
    deptList.value = data;
  }
  loading.value = false;
};

/** 查询当前部门的所有用户 */
async function getDeptAllUser(deptId: any) {
  if (deptId !== null && deptId !== '' && deptId !== undefined) {
    const res = await listUserByDeptId(deptId);
    deptUserList.value = res.data;
  }
}

/** 取消按钮 */
const cancel = () => {
  reset();
  dialog.visible = false;
};
/** 表单重置 */
const reset = () => {
  form.value = { ...initFormData };
  deptFormRef.value?.resetFields();
};

/** 搜索按钮操作 */
const handleQuery = () => {
  getList();
};
/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};

/** 展开/折叠操作 */
const handleToggleExpandAll = () => {
  isExpandAll.value = !isExpandAll.value;
  toggleExpandAll(deptList.value, isExpandAll.value);
};
/** 展开/折叠所有 */
const toggleExpandAll = (data: DeptVO[], status: boolean) => {
  data.forEach((item) => {
    deptTableRef.value?.toggleRowExpansion(item, status);
    if (item.children && item.children.length > 0) toggleExpandAll(item.children, status);
  });
};

const openOrgTemplateDialog = () => {
  selectedOrgTemplateNode.value = undefined;
  activeOrgTemplateKey.value = 'standard';
  orgTemplateDialog.visible = true;
};

const handleOrgTemplateNodeClick = (data: OrgTemplateNode) => {
  selectedOrgTemplateNode.value = data;
};

const fillTemplateDeptForm = (node: OrgTemplateNode) => {
  form.value.deptName = node.deptName;
  form.value.deptCategory = node.deptCategory;
  form.value.orderNum = node.orderNum;
  form.value.status = '0';
};

const handleAddFromOrgTemplate = async () => {
  if (!selectedOrgTemplateNode.value) return;
  await handleAdd();
  fillTemplateDeptForm(selectedOrgTemplateNode.value);
  dialog.title = '按模板添加部门';
  orgTemplateDialog.visible = false;
};

const handleCustomOrgBuild = async () => {
  await handleAdd();
  dialog.title = '自定义添加部门';
  orgTemplateDialog.visible = false;
};

/** 新增按钮操作 */
const handleAdd = async (row?: DeptVO) => {
  reset();
  const res = await listDept();
  const data = proxy?.handleTree<DeptOptionsType>(res.data, 'deptId');
  if (data) {
    deptOptions.value = data;
    if (row && row.deptId) {
      form.value.parentId = row?.deptId;
    }
    dialog.visible = true;
    dialog.title = '添加部门';
  }
};

/** 修改按钮操作 */
const handleUpdate = async (row: DeptVO) => {
  reset();
  //查询当前部门所有用户
  getDeptAllUser(row.deptId);
  const res = await getDept(row.deptId);
  form.value = res.data;
  const response = await listDeptExcludeChild(row.deptId);
  const data = proxy?.handleTree<DeptOptionsType>(response.data, 'deptId');
  if (data) {
    deptOptions.value = data;
    if (data.length === 0) {
      const noResultsOptions: DeptOptionsType = {
        deptId: res.data.parentId,
        deptName: res.data.parentName,
        children: []
      };
      deptOptions.value.push(noResultsOptions);
    }
  }
  dialog.visible = true;
  dialog.title = '修改部门';
};
/** 提交按钮 */
const submitForm = () => {
  deptFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      form.value.deptId ? await updateDept(form.value) : await addDept(form.value);
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};
/** 删除按钮操作 */
const handleDelete = async (row: DeptVO) => {
  await proxy?.$modal.confirm('是否确认删除名称为"' + row.deptName + '"的数据项?');
  await delDept(row.deptId);
  await getList();
  proxy?.$modal.msgSuccess('删除成功');
};

onMounted(() => {
  getList();
});
</script>

<style scoped lang="scss">
.org-template-layout {
  display: grid;
  gap: 12px;
}

.org-template-desc {
  padding: 10px 12px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
}

.org-template-title {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.org-template-text {
  margin-top: 4px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.org-template-node {
  display: inline-flex;
  gap: 8px;
  align-items: center;
}
</style>
