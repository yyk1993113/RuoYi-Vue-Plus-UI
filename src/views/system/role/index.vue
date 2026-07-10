<template>
  <div class="p-2">
    <el-card shadow="hover" class="mb-[10px] role-segment-card">
      <el-tabs v-model="activeRoleSegment" class="role-segment-tabs" @tab-change="handleRoleSegmentChange">
        <el-tab-pane v-for="segment in roleSegments" :key="segment.value" :label="segment.label" :name="segment.value" />
      </el-tabs>
    </el-card>
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="角色名称" prop="roleName">
              <el-input v-model="queryParams.roleName" placeholder="请输入角色名称" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="权限字符" prop="roleKey">
              <el-input v-model="queryParams.roleKey" placeholder="请输入权限字符" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-select v-model="queryParams.status" placeholder="角色状态" clearable>
                <el-option v-for="dict in sys_normal_disable" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="创建时间" style="width: 308px">
              <el-date-picker
                v-model="dateRange"
                value-format="YYYY-MM-DD HH:mm:ss"
                type="daterange"
                range-separator="-"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                :default-time="[new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)]"
              ></el-date-picker>
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
            <el-button v-hasPermi="['system:role:add']" type="primary" plain icon="Plus" @click="handleAdd()">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['system:role:edit']" type="success" plain :disabled="single" icon="Edit" @click="handleUpdate()">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['system:role:remove']" type="danger" plain :disabled="ids.length === 0" @click="handleDelete()">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['system:role:export']" type="warning" plain icon="Download" @click="handleExport">导出</el-button>
          </el-col>
          <right-toolbar v-model:show-search="showSearch" @query-table="getList"></right-toolbar>
        </el-row>
      </template>

      <div class="role-segment-summary mb-[10px]">
        <el-alert :title="activeRoleSegmentMeta.desc" type="info" :closable="false" show-icon />
      </div>

      <el-table ref="roleTableRef" border v-loading="loading" :data="roleList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" :selectable="isSelectableRole" />
        <el-table-column v-if="false" label="角色编号" prop="roleId" width="120" />
        <el-table-column label="角色名称" prop="roleName" :show-overflow-tooltip="true" width="170">
          <template #default="scope">
            <span>{{ scope.row.roleName }}</span>
            <el-tag v-if="scope.row.templateMissing" type="warning" size="small" class="ml-1">未配置</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="权限字符" prop="roleKey" :show-overflow-tooltip="true" width="200" />
        <el-table-column label="角色定位" prop="roleDesc" :show-overflow-tooltip="true" min-width="220" />
        <el-table-column label="显示顺序" prop="roleSort" width="100" />
        <el-table-column label="状态" align="center" width="100">
          <template #default="scope">
            <el-tag v-if="scope.row.templateMissing" type="warning" size="small">待创建</el-tag>
            <el-switch v-else v-model="scope.row.status" active-value="0" inactive-value="1" @change="handleStatusChange(scope.row)"></el-switch>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" prop="createTime">
          <template #default="scope">
            <span>{{ proxy.parseTime(scope.row.createTime) }}</span>
          </template>
        </el-table-column>

        <el-table-column fixed="right" label="操作" width="180">
          <template #default="scope">
            <el-tooltip v-if="scope.row.templateMissing" content="按该模板新增角色" placement="top">
              <el-button v-hasPermi="['system:role:add']" link type="primary" icon="Plus" @click="handleAddTemplate(scope.row)">去新增</el-button>
            </el-tooltip>
            <el-tooltip v-if="scope.row.roleId !== 1 && !scope.row.templateMissing" content="修改" placement="top">
              <el-button
                v-hasPermi="['system:role:edit']"
                link
                type="primary"
                icon="Edit"
                @click="handleUpdate(scope.row)"
              ></el-button>
            </el-tooltip>
            <el-tooltip v-if="scope.row.roleId !== 1 && !scope.row.templateMissing" content="删除" placement="top">
              <el-button
                v-hasPermi="['system:role:remove']"
                link
                type="primary"
                icon="Delete"
                @click="handleDelete(scope.row)"
              ></el-button>
            </el-tooltip>
            <el-tooltip v-if="scope.row.roleId !== 1 && !scope.row.templateMissing" content="数据权限" placement="top">
              <el-button
                v-hasPermi="['system:role:edit']"
                link
                type="primary"
                icon="CircleCheck"
                @click="handleDataScope(scope.row)"
              ></el-button>
            </el-tooltip>
            <el-tooltip v-if="scope.row.roleId !== 1 && !scope.row.templateMissing" content="分配用户" placement="top">
              <el-button
                v-hasPermi="['system:role:edit']"
                link
                type="primary"
                icon="User"
                @click="handleAuthUser(scope.row)"
              ></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination
        v-if="total > 0"
        v-model:total="total"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        @pagination="getList"
      />
    </el-card>

    <el-dialog v-model="dialog.visible" :title="dialog.title" width="500px" append-to-body>
      <el-form ref="roleFormRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model="form.roleName" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item prop="roleKey">
          <template #label>
            <span>
              <el-tooltip content="控制器中定义的权限字符，如：@SaCheckRole('admin')" placement="top">
                <el-icon><question-filled /></el-icon>
              </el-tooltip>
              权限字符
            </span>
          </template>
          <el-input v-model="form.roleKey" placeholder="请输入权限字符" />
        </el-form-item>
        <el-form-item label="角色顺序" prop="roleSort">
          <el-input-number v-model="form.roleSort" controls-position="right" :min="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio v-for="dict in sys_normal_disable" :key="dict.value" :value="dict.value">{{ dict.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="菜单权限">
          <el-checkbox v-model="menuExpand" @change="handleCheckedTreeExpand($event, 'menu')">展开/折叠</el-checkbox>
          <el-checkbox v-model="menuNodeAll" @change="handleCheckedTreeNodeAll($event, 'menu')">全选/全不选</el-checkbox>
          <el-checkbox v-model="form.menuCheckStrictly" @change="handleCheckedTreeConnect($event, 'menu')">父子联动</el-checkbox>
          <el-tree
            ref="menuRef"
            class="tree-border"
            :data="menuOptions"
            show-checkbox
            node-key="id"
            :check-strictly="!form.menuCheckStrictly"
            empty-text="加载中，请稍候"
            :props="{ label: 'label', children: 'children' } as any"
          ></el-tree>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入内容"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 分配角色数据权限对话框 -->
    <el-dialog v-model="openDataScope" :title="dialog.title" width="500px" append-to-body>
      <el-form ref="dataScopeRef" :model="form" label-width="80px">
        <el-form-item label="角色名称">
          <el-input v-model="form.roleName" :disabled="true" />
        </el-form-item>
        <el-form-item label="权限字符">
          <el-input v-model="form.roleKey" :disabled="true" />
        </el-form-item>
        <el-form-item label="权限范围">
          <el-select v-model="form.dataScope" @change="dataScopeSelectChange">
            <el-option v-for="item in dataScopeOptions" :key="item.value" :label="item.label" :value="item.value"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item v-show="form.dataScope === '2'" label="数据权限">
          <el-checkbox v-model="deptExpand" @change="handleCheckedTreeExpand($event, 'dept')">展开/折叠</el-checkbox>
          <el-checkbox v-model="deptNodeAll" @change="handleCheckedTreeNodeAll($event, 'dept')">全选/全不选</el-checkbox>
          <el-checkbox v-model="form.deptCheckStrictly" @change="handleCheckedTreeConnect($event, 'dept')">父子联动</el-checkbox>
          <el-tree
            ref="deptRef"
            class="tree-border"
            :data="deptOptions"
            show-checkbox
            default-expand-all
            node-key="id"
            :check-strictly="!form.deptCheckStrictly"
            empty-text="加载中，请稍候"
            :props="{ label: 'label', children: 'children' } as any"
          ></el-tree>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitDataScope">确 定</el-button>
          <el-button @click="cancelDataScope">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Role" lang="ts">
import { addRole, changeRoleStatus, dataScope, delRole, getRole, listRole, updateRole, deptTreeSelect } from '@/api/system/role';
import { roleMenuTreeselect, treeselect as menuTreeselect } from '@/api/system/menu/index';
import { RoleVO, RoleForm, RoleQuery, DeptTreeOption } from '@/api/system/role/types';
import { MenuTreeOption, RoleMenuTree } from '@/api/system/menu/types';

const router = useRouter();
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { sys_normal_disable } = toRefs<any>(proxy?.useDict('sys_normal_disable'));

type RoleSegment = 'admin' | 'business' | 'jobSeeker';
type RoleDisplayRow = RoleVO & {
  roleSegment?: RoleSegment;
  roleDesc?: string;
  templateMissing?: boolean;
};

const roleList = ref<RoleDisplayRow[]>();
const allRoleList = ref<RoleDisplayRow[]>([]);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const dateRange = ref<[DateModelType, DateModelType]>(['', '']);
const menuOptions = ref<MenuTreeOption[]>([]);
const menuExpand = ref(false);
const menuNodeAll = ref(false);
const deptExpand = ref(true);
const deptNodeAll = ref(false);
const deptOptions = ref<DeptTreeOption[]>([]);
const openDataScope = ref(false);
const COMPANY_RECRUITER_ROLE_KEY = 'B';
const GENERAL_MANAGER_ROLE_NAME = '总经理';
const GENERAL_MANAGER_ROLE_KEY = 'general_manager';

const roleSegments: Array<{ value: RoleSegment; label: string; desc: string }> = [
  {
    value: 'admin',
    label: '管理端角色',
    desc: '平台内部运营后台角色，用于超管、运营、客服、审核、推广、开发等内部账号授权。'
  },
  {
    value: 'business',
    label: 'B端角色',
    desc: '企业端组织内角色模板，用于入驻企业内部的企业超管、总经理、HR主管、招聘专员权限分层。'
  },
  {
    value: 'jobSeeker',
    label: 'C端角色',
    desc: '求职者侧标签型角色，用于普通求职者、VIP、应届生等人群运营分层。'
  }
];
const activeRoleSegment = ref<RoleSegment>('admin');
const activeRoleSegmentMeta = computed(() => roleSegments.find((item) => item.value === activeRoleSegment.value) || roleSegments[0]);

const roleSegmentTemplates: Record<RoleSegment, Array<{ roleName: string; roleKey: string; roleSort: number; roleDesc: string; matchKeys: string[] }>> = {
  admin: [
    { roleName: '超级管理员', roleKey: 'superadmin', roleSort: 1, roleDesc: '平台最高权限，负责系统配置、角色授权和全局数据管理。', matchKeys: ['superadmin', 'admin'] },
    { roleName: '运营主管', roleKey: 'operation_manager', roleSort: 2, roleDesc: '管理运营团队和关键业务数据，负责跨模块运营决策。', matchKeys: ['operation_manager', 'operator_manager'] },
    { roleName: '普通运营', roleKey: 'operator', roleSort: 3, roleDesc: '处理日常企业、岗位、投递、求职者运营工作。', matchKeys: ['operator'] },
    { roleName: '客服', roleKey: 'customer_service', roleSort: 4, roleDesc: '负责企业和求职者咨询、投诉和售后处理。', matchKeys: ['customer_service', 'service'] },
    { roleName: '审核员', roleKey: 'auditor', roleSort: 5, roleDesc: '负责企业资质、岗位内容、风险内容审核。', matchKeys: ['auditor', 'audit'] },
    { roleName: '内部推广人员', roleKey: 'internal_promoter', roleSort: 6, roleDesc: '负责渠道推广、企业/求职者归因跟进。', matchKeys: ['internal_promoter', 'promoter'] },
    { roleName: '开发人员', roleKey: 'developer', roleSort: 7, roleDesc: '用于开发调试、技术运维和问题排查授权。', matchKeys: ['developer', 'dev'] }
  ],
  business: [
    { roleName: '企业超管', roleKey: 'B', roleSort: 1, roleDesc: '企业端最高权限，负责企业资料、成员、岗位、投递和套餐管理。', matchKeys: ['B', 'company_admin', 'enterprise_admin'] },
    { roleName: '总经理', roleKey: 'general_manager', roleSort: 2, roleDesc: '查看企业招聘全局数据和关键岗位/投递效果。', matchKeys: ['general_manager'] },
    { roleName: 'HR主管', roleKey: 'hr_manager', roleSort: 3, roleDesc: '管理招聘团队、岗位发布、简历筛选和面试流程。', matchKeys: ['hr_manager', 'hr_leader'] },
    { roleName: '招聘专员', roleKey: 'recruiter', roleSort: 4, roleDesc: '负责岗位维护、候选人沟通、面试邀约等执行动作。', matchKeys: ['recruiter', 'hr_specialist'] }
  ],
  jobSeeker: [
    { roleName: '普通求职者', roleKey: 'C', roleSort: 1, roleDesc: '小程序注册求职者基础身份，可浏览岗位并投递简历。', matchKeys: ['C', 'job_seeker', 'jobseeker'] },
    { roleName: 'VIP', roleKey: 'vip_job_seeker', roleSort: 2, roleDesc: '购买会员或权益包的求职者，用于优先匹配和重点维护。', matchKeys: ['vip_job_seeker', 'vip'] },
    { roleName: '应届生', roleKey: 'graduate_job_seeker', roleSort: 3, roleDesc: '应届毕业生标签角色，用于校园招聘、实习岗位等运营分层。', matchKeys: ['graduate_job_seeker', 'graduate'] },
    { roleName: '高意向求职者', roleKey: 'high_intent_job_seeker', roleSort: 4, roleDesc: '投递和面试活跃度较高的人群，用于高薪岗位推荐和专属运营。', matchKeys: ['high_intent_job_seeker', 'high_intent'] }
  ]
};

/** 数据范围选项*/
const dataScopeOptions = ref([
  { value: '1', label: '全部数据权限' },
  { value: '2', label: '自定数据权限' },
  { value: '3', label: '本部门数据权限' },
  { value: '4', label: '本部门及以下数据权限' },
  { value: '5', label: '仅本人数据权限' },
  { value: '6', label: '部门及以下或本人数据权限' }
]);

const queryFormRef = ref<ElFormInstance>();
const roleFormRef = ref<ElFormInstance>();
const dataScopeRef = ref<ElFormInstance>();
const menuRef = ref<ElTreeInstance>();
const deptRef = ref<ElTreeInstance>();

const initForm: RoleForm = {
  roleId: undefined,
  roleSort: 1,
  status: '0',
  roleName: '',
  roleKey: '',
  menuCheckStrictly: true,
  deptCheckStrictly: true,
  remark: '',
  dataScope: '1',
  menuIds: [],
  deptIds: []
};

const data = reactive<PageData<RoleForm, RoleQuery>>({
  form: { ...initForm },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    roleName: '',
    roleKey: '',
    status: ''
  },
  rules: {
    roleName: [{ required: true, message: '角色名称不能为空', trigger: 'blur' }],
    roleKey: [{ required: true, message: '权限字符不能为空', trigger: 'blur' }],
    roleSort: [{ required: true, message: '角色顺序不能为空', trigger: 'blur' }]
  }
});
const { form, queryParams, rules } = toRefs(data);

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

/**
 * 查询角色列表
 */
const getList = () => {
  loading.value = true;
  const pageNum = queryParams.value.pageNum || 1;
  const pageSize = queryParams.value.pageSize || 10;
  const query = proxy?.addDateRange({ ...queryParams.value, pageNum: 1, pageSize: 10000 }, dateRange.value);
  listRole(query).then((res) => {
    allRoleList.value = (res.rows || []).map((row) => enrichRoleRow(row));
    const segmentedRows = buildSegmentRoleRows(activeRoleSegment.value, allRoleList.value);
    total.value = segmentedRows.length;
    roleList.value = segmentedRows.slice((pageNum - 1) * pageSize, pageNum * pageSize);
    loading.value = false;
  });
};

const normalizeRoleKey = (value?: string) => String(value || '').trim().toLowerCase();

const findRoleTemplate = (row: RoleVO, segment?: RoleSegment) => {
  const groups = segment ? [segment] : (Object.keys(roleSegmentTemplates) as RoleSegment[]);
  const rowKey = normalizeRoleKey(row.roleKey);
  const rowName = String(row.roleName || '').trim();
  for (const group of groups) {
    const template = roleSegmentTemplates[group].find(
      (item) => item.matchKeys.map((key) => normalizeRoleKey(key)).includes(rowKey) || item.roleName === rowName
    );
    if (template) return { group, template };
  }
  return undefined;
};

const inferRoleSegment = (row: RoleVO): RoleSegment => {
  const matched = findRoleTemplate(row);
  return matched?.group || 'admin';
};

const enrichRoleRow = (row: RoleVO): RoleDisplayRow => {
  const roleSegment = inferRoleSegment(row);
  const matched = findRoleTemplate(row, roleSegment);
  return {
    ...row,
    roleSegment,
    roleDesc: matched?.template.roleDesc || '未命中预置模板，按管理端自定义角色展示。'
  };
};

const buildMissingRoleTemplate = (template: (typeof roleSegmentTemplates)[RoleSegment][number], segment: RoleSegment): RoleDisplayRow => ({
  roleId: `template-${segment}-${template.roleKey}`,
  roleName: template.roleName,
  roleKey: template.roleKey,
  roleSort: template.roleSort,
  dataScope: '1',
  menuCheckStrictly: true,
  deptCheckStrictly: true,
  status: '1',
  delFlag: '0',
  flag: false,
  admin: false,
  createTime: '',
  roleSegment: segment,
  roleDesc: template.roleDesc,
  templateMissing: true
});

const buildSegmentRoleRows = (segment: RoleSegment, rows: RoleDisplayRow[]) => {
  const segmentRows = rows.filter((row) => row.roleSegment === segment && !row.templateMissing);
  if (segment === 'admin') {
    return segmentRows.sort((a, b) => Number(a.roleSort || 0) - Number(b.roleSort || 0));
  }
  const templateRows = roleSegmentTemplates[segment].map((template) => {
    const matched = segmentRows.find((row) => findRoleTemplate(row, segment)?.template.roleKey === template.roleKey);
    return matched || buildMissingRoleTemplate(template, segment);
  });
  const customRows = segmentRows.filter((row) => !roleSegmentTemplates[segment].some((template) => template.roleKey === findRoleTemplate(row, segment)?.template.roleKey));
  return [...templateRows, ...customRows].filter(matchesCurrentRoleQuery).sort((a, b) => Number(a.roleSort || 0) - Number(b.roleSort || 0));
};

const matchesCurrentRoleQuery = (row: RoleDisplayRow) => {
  const roleName = queryParams.value.roleName?.trim();
  const roleKey = queryParams.value.roleKey?.trim();
  const status = queryParams.value.status;
  if (roleName && !String(row.roleName || '').includes(roleName)) return false;
  if (roleKey && !String(row.roleKey || '').includes(roleKey)) return false;
  if (status && row.status !== status) return false;
  if ((dateRange.value[0] || dateRange.value[1]) && row.templateMissing) return false;
  return true;
};

const handleRoleSegmentChange = (value: string | number) => {
  activeRoleSegment.value = value as RoleSegment;
  queryParams.value.pageNum = 1;
  getList();
};

const isSelectableRole = (row: RoleDisplayRow) => !row.templateMissing;

/**
 * 搜索按钮操作
 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

/** 重置 */
const resetQuery = () => {
  dateRange.value = ['', ''];
  queryFormRef.value?.resetFields();
  handleQuery();
};
/**删除按钮操作 */
const handleDelete = async (row?: RoleVO) => {
  const roleids = row?.roleId || ids.value;
  await proxy?.$modal.confirm('是否确认删除角色编号为' + roleids + '数据项目');
  await delRole(roleids);
  getList();
  proxy?.$modal.msgSuccess('删除成功');
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'system/role/export',
    {
      ...queryParams.value
    },
    `role_${new Date().getTime()}.xlsx`
  );
};
/** 多选框选中数据 */
const handleSelectionChange = (selection: RoleDisplayRow[]) => {
  ids.value = selection.map((item: RoleVO) => item.roleId);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 角色状态修改 */
const handleStatusChange = async (row: RoleVO) => {
  const text = row.status === '0' ? '启用' : '停用';
  try {
    await proxy?.$modal.confirm('确认要"' + text + '""' + row.roleName + '"角色吗?');
    await changeRoleStatus(row.roleId, row.status);
    proxy?.$modal.msgSuccess(text + '成功');
  } catch {
    row.status = row.status === '0' ? '1' : '0';
  }
};

/** 分配用户 */
const handleAuthUser = (row: RoleVO) => {
  router.push('/organization/role-auth/user/' + row.roleId);
};

/** 查询菜单树结构 */
const getMenuTreeselect = async () => {
  const res = await menuTreeselect();
  menuOptions.value = res.data;
};
/** 所有部门节点数据 */
const getDeptAllCheckedKeys = (): any => {
  // 目前被选中的部门节点
  const checkedKeys = deptRef.value?.getCheckedKeys();
  // 半选中的部门节点
  const halfCheckedKeys = deptRef.value?.getHalfCheckedKeys();
  if (halfCheckedKeys) {
    checkedKeys?.unshift(...halfCheckedKeys);
  }
  return checkedKeys;
};
/** 重置新增的表单以及其他数据  */
const reset = () => {
  menuRef.value?.setCheckedKeys([]);
  menuExpand.value = false;
  menuNodeAll.value = false;
  deptExpand.value = true;
  deptNodeAll.value = false;
  form.value = { ...initForm };
  roleFormRef.value?.resetFields();
};

/** 添加角色 */
const handleAdd = () => {
  reset();
  getMenuTreeselect();
  dialog.visible = true;
  dialog.title = '添加角色';
};

const handleAddTemplate = (row: RoleDisplayRow) => {
  reset();
  getMenuTreeselect();
  form.value.roleName = row.roleName;
  form.value.roleKey = row.roleKey;
  form.value.roleSort = Number(row.roleSort || 1);
  form.value.remark = row.roleDesc || '';
  dialog.visible = true;
  dialog.title = `添加${activeRoleSegmentMeta.value.label}`;
};

/** 修改角色 */
const handleUpdate = async (row?: RoleVO) => {
  reset();
  const roleId = row?.roleId || ids.value[0];
  const { data } = await getRole(roleId);
  Object.assign(form.value, data);
  form.value.roleSort = Number(form.value.roleSort);
  const res = await getRoleMenuTreeselect(roleId);
  dialog.title = '修改角色';
  dialog.visible = true;
  res.checkedKeys.forEach((v) => {
    nextTick(() => {
      menuRef.value?.setChecked(v, true, false);
    });
  });
};
/** 根据角色ID查询菜单树结构 */
const getRoleMenuTreeselect = (roleId: string | number) => {
  return roleMenuTreeselect(roleId).then((res): RoleMenuTree => {
    menuOptions.value = res.data.menus;
    return res.data;
  });
};
/** 根据角色ID查询部门树结构 */
const getRoleDeptTreeSelect = async (roleId: string | number) => {
  const res = await deptTreeSelect(roleId);
  deptOptions.value = res.data.depts;
  return res.data;
};
/** 树权限（展开/折叠）*/
const handleCheckedTreeExpand = (value: boolean, type: string) => {
  if (type == 'menu') {
    const treeList = menuOptions.value;
    for (let i = 0; i < treeList.length; i++) {
      if (menuRef.value) {
        menuRef.value.store.nodesMap[treeList[i].id].expanded = value;
      }
    }
  } else if (type == 'dept') {
    const treeList = deptOptions.value;
    for (let i = 0; i < treeList.length; i++) {
      if (deptRef.value) {
        deptRef.value.store.nodesMap[treeList[i].id].expanded = value;
      }
    }
  }
};
/** 树权限（全选/全不选） */
const handleCheckedTreeNodeAll = (value: any, type: string) => {
  if (type == 'menu') {
    menuRef.value?.setCheckedNodes(value ? (menuOptions.value as any) : []);
  } else if (type == 'dept') {
    deptRef.value?.setCheckedNodes(value ? (deptOptions.value as any) : []);
  }
};
/** 树权限（父子联动） */
const handleCheckedTreeConnect = (value: any, type: string) => {
  if (type == 'menu') {
    form.value.menuCheckStrictly = value;
  } else if (type == 'dept') {
    form.value.deptCheckStrictly = value;
  }
};
/** 所有菜单节点数据 */
const getMenuAllCheckedKeys = (): any => {
  // 目前被选中的菜单节点
  const checkedKeys = menuRef.value?.getCheckedKeys();
  // 半选中的菜单节点
  const halfCheckedKeys = menuRef.value?.getHalfCheckedKeys();
  if (halfCheckedKeys) {
    checkedKeys?.unshift(...halfCheckedKeys);
  }
  return checkedKeys;
};
const normalizeRecruitmentRoleKey = () => {
  const roleName = form.value.roleName?.trim() || '';
  const roleKey = form.value.roleKey?.trim() || '';
  form.value.roleName = roleName;
  // B 是企业端招聘者身份角色；企业内“总经理”用 general_manager，避免 sys_role.role_key 全局冲突。
  form.value.roleKey = roleName === GENERAL_MANAGER_ROLE_NAME && roleKey.toUpperCase() === COMPANY_RECRUITER_ROLE_KEY ? GENERAL_MANAGER_ROLE_KEY : roleKey;
};
/** 提交按钮 */
const submitForm = () => {
  roleFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      normalizeRecruitmentRoleKey();
      form.value.menuIds = getMenuAllCheckedKeys();
      form.value.roleId ? await updateRole(form.value) : await addRole(form.value);
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      getList();
    }
  });
};
/** 取消按钮 */
const cancel = () => {
  reset();
  dialog.visible = false;
};
/** 选择角色权限范围触发 */
const dataScopeSelectChange = (value: string) => {
  if (value !== '2') {
    deptRef.value?.setCheckedKeys([]);
  }
};
/** 分配数据权限操作 */
const handleDataScope = async (row: RoleVO) => {
  const response = await getRole(row.roleId);
  Object.assign(form.value, response.data);
  const res = await getRoleDeptTreeSelect(row.roleId);
  openDataScope.value = true;
  dialog.title = '分配数据权限';
  await nextTick(() => {
    deptRef.value?.setCheckedKeys(res.checkedKeys);
  });
};
/** 提交按钮（数据权限） */
const submitDataScope = async () => {
  if (form.value.roleId) {
    form.value.deptIds = getDeptAllCheckedKeys();
    await dataScope(form.value);
    proxy?.$modal.msgSuccess('修改成功');
    openDataScope.value = false;
    getList();
  }
};
/** 取消按钮（数据权限）*/
const cancelDataScope = () => {
  dataScopeRef.value?.resetFields();
  form.value = { ...initForm };
  openDataScope.value = false;
};

onMounted(() => {
  getList();
});
</script>

<style scoped lang="scss">
.role-segment-card :deep(.el-card__body) {
  padding: 0 16px;
}

.role-segment-tabs :deep(.el-tabs__header) {
  margin: 0;
}

.role-segment-tabs :deep(.el-tabs__nav-wrap::after) {
  height: 0;
}

.role-segment-summary {
  display: grid;
  gap: 8px;
}

</style>
