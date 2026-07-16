<template>
  <!--
    运营台·配置项页
    职责：维护站点级单例 / KV 配置（C/B 底部导航名称、新人弹窗、消息提醒前/中/后文案、
          兼职三选一文案、按三级职位配置的岗位描述模板、招聘授权书模板文件），并只读查看复用 sys_dict 的字典
          （行业 / 职位类目 / 福利标签）。
    数据来源：后端 AdminConfigController（/admin/config，@SaCheckRole("admin")）。
      - GET  /admin/config/get?key=xxx           单 key 读取（R<RecConfig>）
      - POST /admin/config/update                 按 key upsert（body=RecConfig）
      - GET  /admin/config/dict/{dictType}        透传 sys_dict 字典项
    写入契约：以 configKey 为唯一锚点，tenantId / configId 由后端兜底，前端只提交
              configKey / configValue / configGroup / valueType / remark。
  -->
  <div class="p-4">
    <el-alert
      class="mb-4"
      type="info"
      :closable="false"
      title="运营内容配置中心"
      description="此处维护 C/B 端展示文案与模板，保存后即时对 App 生效。每个分组独立保存，互不影响。字典项（行业/职位类目/福利标签）来自系统字典 sys_dict，此处仅供查看。"
      show-icon
    />

    <el-row :gutter="16">
      <!-- 左侧：KV 文案配置 -->
      <el-col :lg="16" :md="24">
        <!-- 1) C/B 底部导航名称 -->
        <el-card v-loading="loading" shadow="hover" class="mb-4 cfg-card">
          <template #header>
            <div class="cfg-card-header">
              <span class="cfg-title">底部导航名称（C端 / B端）</span>
              <el-button type="primary" :loading="saving.nav" @click="saveGroup('nav')">保存导航</el-button>
            </div>
          </template>
          <el-form label-width="130px" label-position="right">
            <el-divider content-position="left">C 端（求职者）</el-divider>
            <el-row :gutter="16">
              <el-col v-for="item in navCFields" :key="item.key" :sm="12" :xs="24">
                <el-form-item :label="item.label">
                  <el-input v-model="model[item.key]" :placeholder="item.placeholder" clearable maxlength="20" show-word-limit />
                </el-form-item>
              </el-col>
            </el-row>
            <el-divider content-position="left">B 端（招聘方）</el-divider>
            <el-row :gutter="16">
              <el-col v-for="item in navBFields" :key="item.key" :sm="12" :xs="24">
                <el-form-item :label="item.label">
                  <el-input v-model="model[item.key]" :placeholder="item.placeholder" clearable maxlength="20" show-word-limit />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-card>

        <!-- 2) 新人弹窗 -->
        <el-card v-loading="loading" shadow="hover" class="mb-4 cfg-card">
          <template #header>
            <div class="cfg-card-header">
              <span class="cfg-title">新人弹窗</span>
              <el-button type="primary" :loading="saving.popup" @click="saveGroup('popup')">保存弹窗</el-button>
            </div>
          </template>
          <el-form label-width="130px" label-position="right">
            <el-form-item v-for="item in popupFields" :key="item.key" :label="item.label">
              <el-input
                v-model="model[item.key]"
                :type="item.type === 'textarea' ? 'textarea' : 'text'"
                :rows="item.type === 'textarea' ? 3 : undefined"
                :placeholder="item.placeholder"
                clearable
              />
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 3) 消息提醒（前 / 中 / 后期） -->
        <el-card v-loading="loading" shadow="hover" class="mb-4 cfg-card">
          <template #header>
            <div class="cfg-card-header">
              <span class="cfg-title">消息提醒文案（前 / 中 / 后期）</span>
              <el-button type="primary" :loading="saving.message" @click="saveGroup('message')">保存提醒</el-button>
            </div>
          </template>
          <el-form label-width="130px" label-position="right">
            <el-form-item v-for="item in messageFields" :key="item.key" :label="item.label">
              <el-input
                v-model="model[item.key]"
                type="textarea"
                :rows="2"
                :placeholder="item.placeholder"
                clearable
                maxlength="200"
                show-word-limit
              />
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 4) 兼职三选一文案 -->
        <el-card v-loading="loading" shadow="hover" class="mb-4 cfg-card">
          <template #header>
            <div class="cfg-card-header">
              <span class="cfg-title">兼职三选一弹窗文案</span>
              <el-button type="primary" :loading="saving.parttime" @click="saveGroup('parttime')">保存文案</el-button>
            </div>
          </template>
          <el-form label-width="130px" label-position="right">
            <el-form-item v-for="item in parttimeFields" :key="item.key" :label="item.label">
              <el-input v-model="model[item.key]" :placeholder="item.placeholder" clearable maxlength="50" show-word-limit />
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 5) 按「一级类目 / 二级类目 / 具体职位」配置岗位描述模板 -->
        <el-card v-loading="jobTemplateLoading" shadow="hover" class="mb-4 cfg-card">
          <template #header>
            <div class="cfg-card-header">
              <span class="cfg-title">具体职位岗位描述模板</span>
              <el-button
                type="primary"
                :loading="jobTemplateSaving"
                :disabled="!selectedJobPositionKey"
                @click="saveJobDescriptionTemplate"
              >
                保存模板
              </el-button>
            </div>
          </template>
          <el-alert
            class="mb-3"
            type="info"
            :closable="false"
            description="配置路径与岗位类别管理保持一致：一级类目 → 二级类目 → 具体职位。企业选择具体职位后展示对应模板；未配置时继续使用企业端默认模板。"
          />
          <el-form label-width="100px" label-position="right">
            <el-form-item label="具体职位">
              <el-tree-select
                v-model="selectedJobPositionKey"
                :data="jobTemplateTree"
                :props="{ label: 'label', children: 'children', value: 'value', disabled: 'disabled' }"
                node-key="value"
                value-key="value"
                check-strictly
                filterable
                clearable
                placeholder="请选择一级类目 / 二级类目 / 具体职位"
                style="width: 100%"
                @change="handleJobTemplatePositionChange"
              />
            </el-form-item>
            <el-form-item label="岗位描述">
              <el-input
                v-model="jobDescriptionTemplate"
                type="textarea"
                :rows="10"
                maxlength="2000"
                show-word-limit
                placeholder="请输入该具体职位对应的岗位描述模板；清空后保存可恢复企业端默认模板"
              />
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 6) 招聘授权书模板文件 -->
        <el-card v-loading="loading" shadow="hover" class="mb-4 cfg-card">
          <template #header>
            <div class="cfg-card-header">
              <span class="cfg-title">招聘授权书 PDF 模板</span>
            </div>
          </template>
          <div class="template-upload">
            <div v-for="item in templateTypes" :key="item.type" class="template-file-card">
              <el-icon><Document /></el-icon>
              <div class="template-file-main">
                <div class="template-file-name">
                  {{ authLetterTemplate[item.type]?.url ? item.displayName : item.emptyName }}
                </div>
                <div class="template-file-meta">{{ item.label }}，仅支持 PDF</div>
              </div>
              <el-button
                link
                type="primary"
                :disabled="!authLetterTemplate[item.type]?.url"
                :loading="templateDownloading[item.type]"
                @click="downloadAuthLetterTemplate(item)"
              >
                下载
              </el-button>
              <el-upload
                :action="templateUploadUrl(item.type)"
                :headers="uploadHeaders"
                :show-file-list="false"
                accept=".pdf,application/pdf"
                :before-upload="(file) => beforeTemplateUpload(file, item.type)"
                :on-success="(res) => handleTemplateUploadSuccess(res, item.type)"
                :on-error="() => handleTemplateUploadError(item.type)"
              >
                <el-button type="primary" :loading="templateUploading[item.type]">上传 PDF</el-button>
              </el-upload>
            </div>
            <div class="template-tip">上传后立即作为企业端下载模板生效；企业需选择身份后下载对应 PDF。</div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：字典（只读，透传 sys_dict） -->
      <el-col :lg="8" :md="24">
        <el-card shadow="hover" class="mb-4 cfg-card">
          <template #header>
            <div class="cfg-card-header">
              <span class="cfg-title">系统字典（只读）</span>
              <el-button text type="primary" icon="Refresh" @click="loadAllDicts">刷新</el-button>
            </div>
          </template>
          <el-alert
            class="mb-3"
            type="warning"
            :closable="false"
            description="行业 / 职位类目 / 福利标签均读取 sys_dict 透传。如需增删字典项，请到「系统管理 - 字典管理」维护。dictType 可按实际配置调整后重新加载。"
          />
          <el-collapse v-model="activeDictPanels">
            <el-collapse-item v-for="d in dictBlocks" :key="d.name" :name="d.name">
              <template #title>
                <span class="dict-title">{{ d.title }}</span>
                <el-tag class="ml-2" size="small" type="info">{{ (dictData[d.name] || []).length }} 项</el-tag>
              </template>
              <div class="dict-type-line">
                <el-input v-model="d.dictType" size="small" placeholder="dictType" class="dict-type-input" />
                <el-button size="small" type="primary" :loading="dictLoading[d.name]" @click="loadDict(d)">加载</el-button>
              </div>
              <el-table v-loading="dictLoading[d.name]" :data="dictData[d.name] || []" border size="small" max-height="280">
                <el-table-column label="标签" prop="dictLabel" min-width="120" show-overflow-tooltip />
                <el-table-column label="键值" prop="dictValue" width="100" align="center" show-overflow-tooltip />
                <el-table-column label="排序" prop="dictSort" width="70" align="center" />
                <template #empty>
                  <span class="text-secondary">暂无字典数据（确认 dictType 是否正确）</span>
                </template>
              </el-table>
            </el-collapse-item>
          </el-collapse>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup name="RecruitmentConfig" lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Document } from '@element-plus/icons-vue';
import { globalHeaders } from '@/utils/request';
import { blobValidate } from '@/utils/ruoyi';
import {
  getRecConfig,
  updateRecConfig,
  getAuthLetterTemplate,
  downloadAuthLetterTemplateFile,
  authLetterTemplateUploadUrl,
  listConfigDictData,
  type AuthLetterTemplateSet,
  type RecConfigVO,
  type ConfigDictDataVO
} from '@/api/recruitment';
import { getJobPositionTree, updateJobPosition, type JobPositionVO } from '@/api/recruitment/jobCategory';

// ---------- KV 配置字段定义 ----------
// 每个字段对应一个 configKey；configGroup 用于后端归类，valueType 仅作渲染提示。
// key 命名沿用后端 RecConfig 注释约定：nav.* / popup.* / msg.* / template.* 等。
interface CfgField {
  key: string; // 后端 configKey（唯一锚点）
  label: string; // 表单展示名 / 同步写入 remark
  group: string; // configGroup
  placeholder?: string;
  type?: 'text' | 'textarea';
}

// C 端底部导航
const navCFields: CfgField[] = [
  { key: 'nav.c.home', label: 'C-首页', group: 'nav', placeholder: '如：首页' },
  { key: 'nav.c.message', label: 'C-消息', group: 'nav', placeholder: '如：消息' },
  { key: 'nav.c.job', label: 'C-职位', group: 'nav', placeholder: '如：职位' },
  { key: 'nav.c.mine', label: 'C-我的', group: 'nav', placeholder: '如：我的' }
];
// B 端底部导航
const navBFields: CfgField[] = [
  { key: 'nav.b.home', label: 'B-首页', group: 'nav', placeholder: '如：首页' },
  { key: 'nav.b.message', label: 'B-消息', group: 'nav', placeholder: '如：消息' },
  { key: 'nav.b.manage', label: 'B-管理', group: 'nav', placeholder: '如：职位管理' },
  { key: 'nav.b.mine', label: 'B-我的', group: 'nav', placeholder: '如：我的' }
];
// 新人弹窗（标题 / 正文 / 按钮文案 / 跳转链接）
const popupFields: CfgField[] = [
  { key: 'popup.newcomer.title', label: '弹窗标题', group: 'popup', placeholder: '如：新人专享福利' },
  { key: 'popup.newcomer.content', label: '弹窗正文', group: 'popup', type: 'textarea', placeholder: '弹窗正文内容' },
  { key: 'popup.newcomer.button', label: '按钮文案', group: 'popup', placeholder: '如：立即领取' },
  { key: 'popup.newcomer.link', label: '跳转链接', group: 'popup', placeholder: '点击按钮跳转的 URL（可空）' }
];
// 消息提醒（前 / 中 / 后期）
const messageFields: CfgField[] = [
  { key: 'msg.remind.early', label: '前期提醒', group: 'message', placeholder: '前期阶段提醒文案' },
  { key: 'msg.remind.mid', label: '中期提醒', group: 'message', placeholder: '中期阶段提醒文案' },
  { key: 'msg.remind.late', label: '后期提醒', group: 'message', placeholder: '后期阶段提醒文案' }
];
// 兼职三选一弹窗文案（三个选项）
const parttimeFields: CfgField[] = [
  { key: 'parttime.option1', label: '选项一文案', group: 'parttime', placeholder: '兼职三选一·选项一' },
  { key: 'parttime.option2', label: '选项二文案', group: 'parttime', placeholder: '兼职三选一·选项二' },
  { key: 'parttime.option3', label: '选项三文案', group: 'parttime', placeholder: '兼职三选一·选项三' }
];
// 所有字段汇总（按分组取，便于初始化与保存）
const allFields: CfgField[] = [...navCFields, ...navBFields, ...popupFields, ...messageFields, ...parttimeFields];

// 响应式 KV 值模型：configKey -> configValue（字符串）
const model = reactive<Record<string, string>>({});
allFields.forEach((f) => (model[f.key] = ''));

const loading = ref(false);
// 分组保存按钮的 loading 态
const saving = reactive<Record<string, boolean>>({
  nav: false,
  popup: false,
  message: false,
  parttime: false
});

interface JobTemplateTreeNode {
  value: string;
  label: string;
  disabled?: boolean;
  children?: JobTemplateTreeNode[];
}

// 模板随第三级 job_position 维护；前两级节点只负责分组，不能直接保存模板。
const jobTemplateLoading = ref(false);
const jobTemplateSaving = ref(false);
const jobTemplateTree = ref<JobTemplateTreeNode[]>([]);
const jobTemplatePositions = ref<Record<string, JobPositionVO>>({});
const selectedJobPositionKey = ref<string>('');
const jobDescriptionTemplate = ref('');

function buildJobTemplateNode(node: any, positionMap: Record<string, JobPositionVO>): JobTemplateTreeNode {
  const categoryChildren = (node.children || []).map((child: any) => buildJobTemplateNode(child, positionMap));
  const positionChildren = (node.positions || []).map((position: JobPositionVO) => {
    const key = `position:${String(position.id)}`;
    positionMap[key] = position;
    return { value: key, label: position.name || '未命名职位' };
  });
  return {
    value: `category:${String(node.id)}`,
    label: String(node.name || '未命名类目'),
    disabled: true,
    children: [...categoryChildren, ...positionChildren]
  };
}

function handleJobTemplatePositionChange(positionKey?: string) {
  const selected = jobTemplatePositions.value[String(positionKey || '')];
  jobDescriptionTemplate.value = selected?.descriptionTemplate || '';
}

async function loadJobTemplateTree() {
  jobTemplateLoading.value = true;
  try {
    const res = await getJobPositionTree();
    const positionMap: Record<string, JobPositionVO> = {};
    jobTemplateTree.value = ((res as any)?.data || []).map((node: any) => buildJobTemplateNode(node, positionMap));
    jobTemplatePositions.value = positionMap;
    const firstPositionKey = Object.keys(positionMap)[0] || '';
    if (!jobTemplatePositions.value[selectedJobPositionKey.value]) {
      selectedJobPositionKey.value = firstPositionKey;
    }
    handleJobTemplatePositionChange(selectedJobPositionKey.value);
  } catch (error) {
    jobTemplateTree.value = [];
    jobTemplatePositions.value = {};
    ElMessage.error('加载三级职位目录失败');
  } finally {
    jobTemplateLoading.value = false;
  }
}

async function saveJobDescriptionTemplate() {
  const selected = jobTemplatePositions.value[selectedJobPositionKey.value];
  if (!selected?.id) {
    ElMessage.warning('请先选择第三级具体职位');
    return;
  }
  jobTemplateSaving.value = true;
  try {
    await updateJobPosition({
      id: selected.id,
      descriptionTemplate: jobDescriptionTemplate.value
    });
    selected.descriptionTemplate = jobDescriptionTemplate.value;
    ElMessage.success('岗位描述模板保存成功');
  } catch (error) {
    ElMessage.error('岗位描述模板保存失败，请重试');
  } finally {
    jobTemplateSaving.value = false;
  }
}

type AuthLetterTemplateType = keyof AuthLetterTemplateSet;
type AuthLetterTemplateOption = {
  type: AuthLetterTemplateType;
  label: string;
  displayName: string;
  emptyName: string;
};

const templateTypes: AuthLetterTemplateOption[] = [
  { type: 'legalRepresentative', label: '法人版确认书', displayName: '法人版确认书.pdf', emptyName: '未上传法人版确认书.pdf' },
  { type: 'operator', label: '经办人授权书', displayName: '经办人授权书.pdf', emptyName: '未上传经办人授权书.pdf' }
];

// 招聘授权书模板按操作者身份拆成两个 PDF；运营台展示业务文件名，不暴露 OSS 原始上传名或对象 key。
const authLetterTemplate = ref<AuthLetterTemplateSet>({});
const templateUploading = reactive<Record<AuthLetterTemplateType, boolean>>({
  legalRepresentative: false,
  operator: false
});
const templateDownloading = reactive<Record<AuthLetterTemplateType, boolean>>({
  legalRepresentative: false,
  operator: false
});
const uploadHeaders = ref(globalHeaders());

function templateUploadUrl(type: AuthLetterTemplateType) {
  return `${import.meta.env.VITE_APP_BASE_API}${authLetterTemplateUploadUrl(type)}`;
}

function unwrapBlob(res: unknown): Blob | null {
  if (res instanceof Blob) {
    return res;
  }
  const data = (res as { data?: unknown })?.data;
  return data instanceof Blob ? data : null;
}

// 拉取全部已配置项：逐 key GET /admin/config/get，命中则回填 model
async function loadAllConfigs() {
  loading.value = true;
  try {
    const results = await Promise.all(
      allFields.map((f) =>
        getRecConfig(f.key)
          .then((res) => ({ key: f.key, value: (res.data as RecConfigVO)?.configValue ?? '' }))
          .catch(() => ({ key: f.key, value: '' }))
      )
    );
    results.forEach((r) => (model[r.key] = r.value || ''));
  } finally {
    loading.value = false;
  }
}

// 按分组保存：仅提交该分组字段，逐条 upsert（configKey 锚点）
async function saveGroup(group: string) {
  const fields = allFields.filter((f) => f.group === group);
  saving[group] = true;
  try {
    await Promise.all(
      fields.map((f) => {
        const payload: RecConfigVO = {
          configKey: f.key,
          configValue: model[f.key] ?? '',
          configGroup: f.group,
          valueType: 'text',
          remark: f.label
        };
        return updateRecConfig(payload);
      })
    );
    ElMessage.success('保存成功');
  } catch (e) {
    ElMessage.error('保存失败，请重试');
  } finally {
    saving[group] = false;
  }
}

// 运营台经后端同源接口流式下载，避免前端直接 fetch 私有 OSS 预签名地址触发跨域限制。
async function downloadAuthLetterTemplate(item: AuthLetterTemplateOption) {
  const url = authLetterTemplate.value[item.type]?.url;
  if (!url) {
    ElMessage.warning('请先上传模板');
    return;
  }
  templateDownloading[item.type] = true;
  try {
    const blob = unwrapBlob(await downloadAuthLetterTemplateFile(item.type));
    if (!blob || blob.size <= 0) {
      throw new Error('模板返回内容为空');
    }
    if (!blobValidate(blob)) {
      const text = await blob.text();
      const data = text ? JSON.parse(text) : {};
      throw new Error(data?.msg || data?.message || '模板下载失败');
    }
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = item.displayName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);
  } catch (e) {
    console.error(e);
    ElMessage.error('模板下载失败，请稍后重试');
  } finally {
    templateDownloading[item.type] = false;
  }
}

// 当前模板由后端按 OSS id 重新签名返回，避免私有桶原始 URL 过期或不可访问。
async function loadAuthLetterTemplate() {
  try {
    const res = await getAuthLetterTemplate();
    authLetterTemplate.value = res.data || {};
  } catch (e) {
    authLetterTemplate.value = {};
  }
}

function beforeTemplateUpload(file: File, type: AuthLetterTemplateType) {
  const isPdf = file.name.toLowerCase().endsWith('.pdf');
  const isLt10M = file.size / 1024 / 1024 < 10;
  if (!isPdf) {
    ElMessage.error('招聘授权书模板只支持 PDF 文件');
    return false;
  }
  if (!isLt10M) {
    ElMessage.error('模板文件大小不能超过 10MB');
    return false;
  }
  templateUploading[type] = true;
  return true;
}

function handleTemplateUploadSuccess(res: any, type: AuthLetterTemplateType) {
  templateUploading[type] = false;
  if (res.code === 200) {
    authLetterTemplate.value = res.data || {};
    ElMessage.success('模板已上传并生效');
  } else {
    ElMessage.error(res.msg || '模板上传失败');
  }
}

function handleTemplateUploadError(type: AuthLetterTemplateType) {
  templateUploading[type] = false;
  ElMessage.error('模板上传失败');
}

// ---------- 字典（透传 sys_dict，只读） ----------
// dictType 默认值按 RuoYi snake_case 约定预填，operator 可按实际配置改后重新加载。
interface DictBlock {
  name: string; // 内部标识
  title: string; // 展示名
  dictType: string; // sys_dict 的 dict_type
}
const dictBlocks = reactive<DictBlock[]>([
  { name: 'industry', title: '行业', dictType: 'rec_industry' },
  { name: 'jobCategory', title: '职位类目', dictType: 'rec_job_category' },
  { name: 'welfare', title: '福利标签', dictType: 'rec_welfare_tag' }
]);
const activeDictPanels = ref<string[]>(['industry']);
const dictData = reactive<Record<string, ConfigDictDataVO[]>>({});
const dictLoading = reactive<Record<string, boolean>>({});

// 加载单个字典块：GET /admin/config/dict/{dictType}
async function loadDict(d: DictBlock) {
  if (!d.dictType) {
    ElMessage.warning('请先填写 dictType');
    return;
  }
  dictLoading[d.name] = true;
  try {
    const res = await listConfigDictData(d.dictType);
    dictData[d.name] = (res.data as ConfigDictDataVO[]) || [];
  } catch (e) {
    dictData[d.name] = [];
  } finally {
    dictLoading[d.name] = false;
  }
}

// 一次性加载全部字典块
function loadAllDicts() {
  dictBlocks.forEach((d) => loadDict(d));
}

onMounted(() => {
  loadAllConfigs();
  loadJobTemplateTree();
  loadAuthLetterTemplate();
  loadAllDicts();
});
</script>

<style scoped>
.mb-4 {
  margin-bottom: 16px;
}
.mb-3 {
  margin-bottom: 12px;
}
.ml-2 {
  margin-left: 8px;
}

/* 卡片标题栏：标题 + 右侧保存按钮 */
.cfg-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.cfg-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

/* 主色尽量贴近后台约定 #2b7fff */
.cfg-card :deep(.el-button--primary) {
  --el-button-bg-color: #2b7fff;
  --el-button-border-color: #2b7fff;
  --el-button-hover-bg-color: #5096ff;
  --el-button-hover-border-color: #5096ff;
  --el-button-active-bg-color: #1f6fe5;
  --el-button-active-border-color: #1f6fe5;
}

.cfg-card :deep(.el-divider__text) {
  color: #2b7fff;
  font-weight: 600;
}

.dict-title {
  font-weight: 600;
  color: #303133;
}

.dict-type-line {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.dict-type-input {
  flex: 1;
}

.template-upload {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.template-file-card {
  min-height: 64px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background: #fafafa;
}

.template-file-card .el-icon {
  font-size: 28px;
  color: #2b7fff;
}

.template-file-main {
  min-width: 0;
  flex: 1;
}

.template-file-name {
  overflow: hidden;
  color: #303133;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.template-file-meta,
.template-tip {
  color: #909399;
  font-size: 12px;
  line-height: 20px;
}

.text-secondary {
  font-size: 12px;
  color: #909399;
}
</style>
