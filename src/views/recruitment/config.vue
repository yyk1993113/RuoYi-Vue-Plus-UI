<template>
  <!--
    运营台·配置项页
    职责：维护站点级单例 / KV 配置（C/B 底部导航名称、新人弹窗、消息提醒前/中/后文案、
          兼职三选一文案、招聘授权书模板 URL），并只读查看复用 sys_dict 的字典
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

        <!-- 5) 招聘授权书模板 URL -->
        <el-card v-loading="loading" shadow="hover" class="mb-4 cfg-card">
          <template #header>
            <div class="cfg-card-header">
              <span class="cfg-title">招聘授权书模板</span>
              <el-button type="primary" :loading="saving.template" @click="saveGroup('template')">保存模板</el-button>
            </div>
          </template>
          <el-form label-width="130px" label-position="right">
            <el-form-item v-for="item in templateFields" :key="item.key" :label="item.label">
              <el-input v-model="model[item.key]" :placeholder="item.placeholder" clearable>
                <template v-if="model[item.key]" #append>
                  <el-button @click="openUrl(model[item.key])">预览</el-button>
                </template>
              </el-input>
            </el-form-item>
          </el-form>
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
import {
  getRecConfig,
  updateRecConfig,
  listConfigDictData,
  type RecConfigVO,
  type ConfigDictDataVO
} from '@/api/recruitment';

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
// 招聘授权书模板 URL
const templateFields: CfgField[] = [
  { key: 'template.authLetter.url', label: '授权书模板URL', group: 'template', placeholder: '招聘授权书模板文件 URL' }
];

// 所有字段汇总（按分组取，便于初始化与保存）
const allFields: CfgField[] = [
  ...navCFields,
  ...navBFields,
  ...popupFields,
  ...messageFields,
  ...parttimeFields,
  ...templateFields
];

// 响应式 KV 值模型：configKey -> configValue（字符串）
const model = reactive<Record<string, string>>({});
allFields.forEach((f) => (model[f.key] = ''));

const loading = ref(false);
// 分组保存按钮的 loading 态
const saving = reactive<Record<string, boolean>>({
  nav: false,
  popup: false,
  message: false,
  parttime: false,
  template: false
});

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

// 预览/打开授权书模板等 URL
function openUrl(url: string) {
  if (!url) return;
  window.open(url, '_blank');
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

.text-secondary {
  font-size: 12px;
  color: #909399;
}
</style>
