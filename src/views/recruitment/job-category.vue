<template>
  <div class="p-4">
    <el-row :gutter="16">
      <!-- ========== 左侧：类别树（job_category） ========== -->
      <el-col :span="6">
        <el-card shadow="hover" class="tree-card">
          <template #header>
            <div class="tree-header">
              <span>岗位类别</span>
              <el-button type="primary" link icon="Plus" @click="handleAddCategory()">新增</el-button>
            </div>
          </template>
          <el-input v-model="categoryFilter" placeholder="输入名称过滤" clearable prefix-icon="Search" class="mb-2" />
          <el-tree
            ref="treeRef"
            v-loading="treeLoading"
            :data="categoryTree"
            :props="{ label: 'name', children: 'children' }"
            node-key="id"
            highlight-current
            default-expand-all
            :expand-on-click-node="false"
            :filter-node-method="filterNode"
            @node-click="handleNodeClick"
          >
            <template #default="{ data }">
              <div class="tree-node">
                <span class="tree-label">
                  {{ data.name }}
                  <el-tag v-if="String(data.status) === '1'" type="info" size="small">停用</el-tag>
                </span>
                <!-- hover 显示节点操作：加子类别 / 编辑 / 删除 -->
                <span class="tree-actions" @click.stop>
                  <el-button link type="primary" icon="Plus" @click="handleAddCategory(data)" />
                  <el-button link type="primary" icon="Edit" @click="handleEditCategory(data)" />
                  <el-button link type="danger" icon="Delete" @click="handleDelCategory(data)" />
                </span>
              </div>
            </template>
          </el-tree>
        </el-card>
      </el-col>

      <!-- ========== 右侧：职位列表（job_position，按选中类别过滤） ========== -->
      <el-col :span="18">
        <el-card shadow="hover">
          <template #header>
            <el-row :gutter="10" align="middle">
              <el-col :span="1.5">
                <el-button type="primary" plain icon="Plus" @click="handleAddPosition">新增职位</el-button>
              </el-col>
              <el-col :span="1.5">
                <el-button type="primary" plain icon="Refresh" @click="loadPositions">刷新</el-button>
              </el-col>
              <el-col :span="12" class="toolbar-tip">
                <template v-if="currentCategory">
                  当前类别：<el-tag size="small">{{ currentCategory.name }}</el-tag>
                  <el-button link type="primary" @click="clearCategoryFilterAndReload">查看全部</el-button>
                </template>
                <template v-else>点击左侧类别可筛选该类别下的职位</template>
              </el-col>
            </el-row>
          </template>

          <!-- 查询条件 -->
          <el-form :inline="true" class="mb-2">
            <el-form-item label="职位名称">
              <el-input v-model="positionQuery.name" placeholder="请输入职位名称" clearable @keyup.enter="handleSearch" style="width: 200px" />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="positionQuery.status" placeholder="全部" clearable style="width: 120px">
                <el-option label="正常" :value="0" />
                <el-option label="停用" :value="1" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleSearch">搜索</el-button>
              <el-button icon="Refresh" @click="resetSearch">重置</el-button>
            </el-form-item>
          </el-form>

          <el-table v-loading="positionLoading" :data="positionList" border stripe>
            <el-table-column label="排序" prop="sort" width="70" align="center" />
            <el-table-column label="职位名称" prop="name" min-width="180" />
            <el-table-column label="所属类别" prop="categoryName" min-width="140">
              <template #default="{ row }">
                <el-tag type="info" size="small">{{ row.categoryName || '-' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="90" align="center">
              <template #default="{ row }">
                <el-tag :type="String(row.status) === '0' ? 'success' : 'info'" size="small">
                  {{ String(row.status) === '0' ? '正常' : '停用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="创建时间" prop="createTime" width="170" align="center" />
            <el-table-column label="操作" width="150" fixed="right" align="center">
              <template #default="{ row }">
                <el-button link type="primary" icon="Edit" @click="handleEditPosition(row)">编辑</el-button>
                <el-button link type="danger" icon="Delete" @click="handleDelPosition(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <pagination
            v-show="positionTotal > 0"
            v-model:page="positionQuery.pageNum"
            v-model:limit="positionQuery.pageSize"
            :total="positionTotal"
            @pagination="loadPositions"
          />
        </el-card>
      </el-col>
    </el-row>

    <!-- ========== 类别 新增/编辑 弹窗 ========== -->
    <el-dialog v-model="categoryDialogVisible" :title="categoryForm.id ? '编辑类别' : '新增类别'" width="480px" append-to-body>
      <el-form ref="categoryFormRef" :model="categoryForm" :rules="categoryRules" label-width="90px">
        <el-form-item label="父级类别">
          <!-- 顶级类别不选父级；check-strictly 允许选任意层级节点作为父级 -->
          <el-tree-select
            v-model="categoryForm.parentId"
            :data="parentTreeOptions"
            :props="{ label: 'name', children: 'children', value: 'id' }"
            value-key="id"
            check-strictly
            clearable
            placeholder="不选则为顶级类别"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="类别名称" prop="name">
          <el-input v-model="categoryForm.name" placeholder="如：技术研发" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="显示排序">
          <el-input-number v-model="categoryForm.sort" :min="0" :max="999" controls-position="right" style="width: 150px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="categoryForm.status">
            <el-radio :label="0">正常</el-radio>
            <el-radio :label="1">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="categoryDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="categorySubmitting" @click="submitCategory">保存</el-button>
      </template>
    </el-dialog>

    <!-- ========== 职位 新增/编辑 弹窗 ========== -->
    <el-dialog v-model="positionDialogVisible" :title="positionForm.id ? '编辑职位' : '新增职位'" width="480px" append-to-body>
      <el-form ref="positionFormRef" :model="positionForm" :rules="positionRules" label-width="90px">
        <el-form-item label="所属类别" prop="categoryId">
          <el-tree-select
            v-model="positionForm.categoryId"
            :data="categoryTree"
            :props="{ label: 'name', children: 'children', value: 'id' }"
            value-key="id"
            check-strictly
            placeholder="请选择所属类别"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="职位名称" prop="name">
          <el-input v-model="positionForm.name" placeholder="如：Java开发工程师" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="显示排序">
          <el-input-number v-model="positionForm.sort" :min="0" :max="999" controls-position="right" style="width: 150px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="positionForm.status">
            <el-radio :label="0">正常</el-radio>
            <el-radio :label="1">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="positionDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="positionSubmitting" @click="submitPosition">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="JobCategoryManagement" lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  listJobCategory,
  addJobCategory,
  updateJobCategory,
  delJobCategory,
  listJobPosition,
  addJobPosition,
  updateJobPosition,
  delJobPosition,
  getJobCategoryTableInfo,
  type JobCategoryVO,
  type JobPositionVO
} from '@/api/recruitment/jobCategory';

// 诊断：存量表列名与实体映射不一致（Unknown column 报错）时，拉取两张表真实列结构弹窗展示，
// 供截图比对后一次性对齐实体映射。只弹一次避免反复打扰。
let tableInfoShown = false;
async function showTableDiagnostic() {
  if (tableInfoShown) return;
  tableInfoShown = true;
  try {
    const res = await getJobCategoryTableInfo();
    const rows = res.data || [];
    const group: Record<string, string[]> = {};
    rows.forEach((r: any) => {
      const t = r.tableName || r.TABLE_NAME;
      const c = `${r.columnName || r.COLUMN_NAME} ${r.columnType || r.COLUMN_TYPE}${(r.columnKey || r.COLUMN_KEY) === 'PRI' ? ' [主键]' : ''}`;
      (group[t] = group[t] || []).push(c);
    });
    const text = Object.entries(group)
      .map(([t, cols]) => `【${t}】\n${cols.join('\n')}`)
      .join('\n\n');
    ElMessageBox.alert(`检测到数据表与页面字段不一致，请将本窗口截图反馈。\n\n${text}`, '表结构诊断', {
      confirmButtonText: '知道了',
      customStyle: { whiteSpace: 'pre-wrap', maxWidth: '560px' } as any
    });
  } catch {
    // 诊断接口不可用时静默（后端未重启等），不影响主流程报错提示
  }
}

// ===== 左侧类别树 =====
const treeRef = ref();
const treeLoading = ref(false);
const categoryFilter = ref('');
const categoryFlat = ref<JobCategoryVO[]>([]); // 后端返回的扁平列表
const currentCategory = ref<JobCategoryVO | null>(null); // 当前选中节点（驱动右表过滤）

// 扁平列表 → 树（parentId=0/空 为顶级）。bigint ID 统一 String 比较，严禁 Number()
const categoryTree = computed<JobCategoryVO[]>(() => buildTree(categoryFlat.value));

function buildTree(list: JobCategoryVO[]): JobCategoryVO[] {
  const nodes = list.map((it) => ({ ...it, children: [] as JobCategoryVO[] }));
  const map = new Map<string, JobCategoryVO>();
  nodes.forEach((n) => map.set(String(n.id), n));
  const roots: JobCategoryVO[] = [];
  nodes.forEach((n) => {
    const pid = String(n.parentId ?? '0');
    const parent = pid !== '0' ? map.get(pid) : undefined;
    if (parent) {
      parent.children!.push(n);
    } else {
      roots.push(n);
    }
  });
  return roots;
}

// 编辑类别时父级下拉不能包含自己（防止把父级设成自己/子孙形成环；子孙环由后端兜底校验）
const parentTreeOptions = computed<JobCategoryVO[]>(() => {
  const selfId = categoryForm.id ? String(categoryForm.id) : '';
  if (!selfId) return categoryTree.value;
  const prune = (list: JobCategoryVO[]): JobCategoryVO[] =>
    list.filter((n) => String(n.id) !== selfId).map((n) => ({ ...n, children: prune(n.children || []) }));
  return prune(categoryTree.value);
});

watch(categoryFilter, (val) => {
  treeRef.value?.filter(val);
});

function filterNode(value: string, data: any) {
  if (!value) return true;
  return String(data.name || '').includes(value);
}

async function loadCategories() {
  treeLoading.value = true;
  try {
    const res = await listJobCategory();
    categoryFlat.value = res.data || [];
  } catch (error) {
    ElMessage.error('加载岗位类别失败');
    showTableDiagnostic();
  } finally {
    treeLoading.value = false;
  }
}

// 点击树节点：右表按该类别过滤并回到第一页
function handleNodeClick(data: JobCategoryVO) {
  currentCategory.value = data;
  positionQuery.categoryId = data.id;
  positionQuery.pageNum = 1;
  loadPositions();
}

function clearCategoryFilterAndReload() {
  currentCategory.value = null;
  positionQuery.categoryId = undefined;
  positionQuery.pageNum = 1;
  treeRef.value?.setCurrentKey?.(null);
  loadPositions();
}

// ===== 类别弹窗 =====
const categoryDialogVisible = ref(false);
const categorySubmitting = ref(false);
const categoryFormRef = ref();

const categoryForm = reactive<JobCategoryVO>({
  id: undefined,
  parentId: undefined,
  name: '',
  sort: 0,
  status: 0
});

const categoryRules = {
  name: [{ required: true, message: '请输入类别名称', trigger: 'blur' }]
};

// 新增默认排序 = 同级（同父节点下）已有类别数 + 1，追加到末尾
function nextCategorySort(parentId?: string | number): number {
  const pid = String(parentId ?? '0');
  return categoryFlat.value.filter((c) => String(c.parentId ?? '0') === pid).length + 1;
}

// 新增类别：传入 parent 时默认挂其下（树节点行内"+"），否则父级为当前选中节点/顶级
function handleAddCategory(parent?: JobCategoryVO) {
  categoryForm.id = undefined;
  categoryForm.parentId = parent?.id ?? currentCategory.value?.id ?? undefined;
  categoryForm.name = '';
  categoryForm.sort = nextCategorySort(categoryForm.parentId);
  categoryForm.status = 0;
  categoryDialogVisible.value = true;
  categoryFormRef.value?.clearValidate?.();
}

// 新增模式下切换父级时，排序联动重算为目标父级下的"数量+1"（编辑模式不动用户已有排序）
watch(
  () => categoryForm.parentId,
  (val) => {
    if (categoryDialogVisible.value && !categoryForm.id) {
      categoryForm.sort = nextCategorySort(val);
    }
  }
);

function handleEditCategory(data: JobCategoryVO) {
  categoryForm.id = data.id;
  // parentId=0（顶级）时置空，让树选择器显示空白而非匹配不到的 "0"
  categoryForm.parentId = String(data.parentId ?? '0') === '0' ? undefined : data.parentId;
  categoryForm.name = data.name || '';
  categoryForm.sort = data.sort ?? 0;
  categoryForm.status = Number(data.status ?? 0);
  categoryDialogVisible.value = true;
  categoryFormRef.value?.clearValidate?.();
}

function submitCategory() {
  categoryFormRef.value?.validate(async (valid: boolean) => {
    if (!valid) return;
    categorySubmitting.value = true;
    try {
      // 未选父级 → 顶级（后端约定 parentId=0）
      const payload = { ...categoryForm, parentId: categoryForm.parentId ?? 0 };
      if (categoryForm.id) {
        await updateJobCategory(payload);
        ElMessage.success('修改成功');
      } else {
        await addJobCategory(payload);
        ElMessage.success('新增成功');
      }
      categoryDialogVisible.value = false;
      loadCategories();
    } catch (error) {
      ElMessage.error(categoryForm.id ? '修改失败' : '新增失败');
    } finally {
      categorySubmitting.value = false;
    }
  });
}

async function handleDelCategory(data: JobCategoryVO) {
  try {
    await ElMessageBox.confirm(
      `确定要删除类别「${data.name}」吗？存在子类别或职位时将无法删除。`,
      '提示',
      { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' }
    );
    await delJobCategory(data.id!);
    ElMessage.success('删除成功');
    if (currentCategory.value && String(currentCategory.value.id) === String(data.id)) {
      clearCategoryFilterAndReload();
    }
    loadCategories();
  } catch (error: any) {
    if (error !== 'cancel') {
      // 后端业务校验信息（有子类别/有职位）由全局拦截器 toast，这里不再重复报错
    }
  }
}

// ===== 右侧职位列表 =====
const positionLoading = ref(false);
const positionList = ref<JobPositionVO[]>([]);
const positionTotal = ref(0);

const positionQuery = reactive({
  pageNum: 1,
  pageSize: 10,
  categoryId: undefined as string | number | undefined,
  name: '',
  status: undefined as number | undefined
});

async function loadPositions() {
  positionLoading.value = true;
  try {
    const res: any = await listJobPosition(positionQuery);
    // TableDataInfo 兼容：rows/total 可能在顶层或 data 内
    const body = res?.rows !== undefined ? res : res?.data || {};
    positionList.value = body.rows || [];
    positionTotal.value = body.total || 0;
  } catch (error) {
    ElMessage.error('加载职位列表失败');
    showTableDiagnostic();
  } finally {
    positionLoading.value = false;
  }
}

function handleSearch() {
  positionQuery.pageNum = 1;
  loadPositions();
}

function resetSearch() {
  positionQuery.name = '';
  positionQuery.status = undefined;
  positionQuery.pageNum = 1;
  loadPositions();
}

// ===== 职位弹窗 =====
const positionDialogVisible = ref(false);
const positionSubmitting = ref(false);
const positionFormRef = ref();

const positionForm = reactive<JobPositionVO>({
  id: undefined,
  categoryId: undefined,
  name: '',
  sort: 0,
  status: 0
});

const positionRules = {
  categoryId: [{ required: true, message: '请选择所属类别', trigger: 'change' }],
  name: [{ required: true, message: '请输入职位名称', trigger: 'blur' }]
};

// 新增默认排序 = 所属类别下已有职位数 + 1（轻量查询仅取 total），追加到末尾；查询失败兜底为 1
async function applyNextPositionSort(categoryId?: string | number) {
  if (!categoryId) {
    positionForm.sort = 1;
    return;
  }
  try {
    const res: any = await listJobPosition({ categoryId, pageNum: 1, pageSize: 1 });
    const body = res?.total !== undefined ? res : res?.data || {};
    positionForm.sort = (Number(body.total) || 0) + 1;
  } catch {
    positionForm.sort = 1;
  }
}

function handleAddPosition() {
  positionForm.id = undefined;
  // 默认挂当前选中类别，未选中时留空强制用户选择
  positionForm.categoryId = currentCategory.value?.id ?? undefined;
  positionForm.name = '';
  positionForm.sort = 1;
  positionForm.status = 0;
  positionDialogVisible.value = true;
  positionFormRef.value?.clearValidate?.();
  applyNextPositionSort(positionForm.categoryId);
}

// 新增模式下切换所属类别时，排序联动重算为目标类别下的"数量+1"（编辑模式不动用户已有排序）
watch(
  () => positionForm.categoryId,
  (val) => {
    if (positionDialogVisible.value && !positionForm.id) {
      applyNextPositionSort(val);
    }
  }
);

function handleEditPosition(row: JobPositionVO) {
  positionForm.id = row.id;
  positionForm.categoryId = row.categoryId;
  positionForm.name = row.name || '';
  positionForm.sort = row.sort ?? 0;
  positionForm.status = Number(row.status ?? 0);
  positionDialogVisible.value = true;
  positionFormRef.value?.clearValidate?.();
}

function submitPosition() {
  positionFormRef.value?.validate(async (valid: boolean) => {
    if (!valid) return;
    positionSubmitting.value = true;
    try {
      if (positionForm.id) {
        await updateJobPosition({ ...positionForm });
        ElMessage.success('修改成功');
      } else {
        await addJobPosition({ ...positionForm });
        ElMessage.success('新增成功');
      }
      positionDialogVisible.value = false;
      loadPositions();
    } catch (error) {
      ElMessage.error(positionForm.id ? '修改失败' : '新增失败');
    } finally {
      positionSubmitting.value = false;
    }
  });
}

async function handleDelPosition(row: JobPositionVO) {
  try {
    await ElMessageBox.confirm(`确定要删除职位「${row.name}」吗？`, '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    });
    await delJobPosition(row.id!);
    ElMessage.success('删除成功');
    loadPositions();
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败');
    }
  }
}

onMounted(() => {
  loadCategories();
  loadPositions();
});
</script>

<style scoped>
.mb-2 {
  margin-bottom: 12px;
}

.tree-card {
  min-height: 500px;
}

.tree-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 树节点：标题占满、操作按钮 hover 才显示，避免视觉噪音 */
.tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 4px;
  overflow: hidden;
}

.tree-label {
  display: flex;
  align-items: center;
  gap: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tree-actions {
  display: none;
  flex-shrink: 0;
}

.tree-node:hover .tree-actions {
  display: inline-flex;
}

.tree-actions .el-button {
  margin-left: 2px;
}

.toolbar-tip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #909399;
}
</style>
