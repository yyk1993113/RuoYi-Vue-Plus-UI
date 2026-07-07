<template>
  <div class="job-publish-page">
    <!-- 卡片化容器：与侧栏视觉分割，顶部标题区 + 操作栏，下方分隔线 -->
    <el-card shadow="never" class="publish-card">
      <template #header>
        <div class="publish-header">
          <div class="publish-title">
            <span class="t">{{ isCopy ? '复制发布岗位' : '代发新岗位' }}</span>
            <span class="sub">运营代企业发布岗位，需指定所属企业</span>
          </div>
          <div class="publish-actions">
            <el-button @click="goBack">返回</el-button>
            <el-button @click="handlePreview">预览岗位</el-button>
            <el-button :loading="savingDraft" @click="handleSaveDraft">保存草稿</el-button>
            <el-button type="primary" :loading="submitting" @click="handleSubmit">提交审核</el-button>
          </div>
        </div>
      </template>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" scroll-to-error class="publish-form">
        <!-- 模块1：基础岗位信息 -->
        <el-divider content-position="left">
          <span class="section-title"
            ><el-icon><Document /></el-icon>基础岗位信息</span
          >
        </el-divider>
        <el-row :gutter="24">
          <el-col :span="12">
            <!-- 所属企业：运营不属于任何企业，必须显式指定归属企业（远程搜索企业列表） -->
            <el-form-item label="所属企业" prop="companyId">
              <el-select
                v-model="form.companyId"
                placeholder="输入企业名称搜索"
                filterable
                remote
                clearable
                :remote-method="searchCompany"
                :loading="companyLoading"
                style="width: 100%"
              >
                <el-option v-for="c in companyOptions" :key="c.companyId" :label="c.companyName" :value="c.companyId" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="岗位名称" prop="jobName">
              <!-- 岗位名称是招聘展示标题，可自由填写；职位类目在下方单独选择。 -->
              <el-input v-model="form.jobName" placeholder="请输入岗位名称，如 全职前端开发工程师" maxlength="50" show-word-limit />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="用工性质" prop="jobType">
              <div class="job-type-cards">
                <div
                  v-for="opt in jobTypeOptions"
                  :key="opt.value"
                  class="job-type-card"
                  :class="{ active: form.jobType === opt.value }"
                  role="radio"
                  tabindex="0"
                  :aria-checked="form.jobType === opt.value"
                  @click="selectJobType(opt.value)"
                  @keyup.enter="selectJobType(opt.value)"
                  @keyup.space="selectJobType(opt.value)"
                >
                  {{ opt.label }}
                </div>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="职位类目" prop="category">
              <JobPositionPicker v-model="form.positionName" placeholder="请选择标准职位（来自职位类目库）" @pick="selectStandardPosition" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="省市区" prop="regionPath">
              <el-cascader
                v-model="form.regionPath"
                :options="regionOptions"
                filterable
                clearable
                placeholder="请选择省 / 市 / 区县"
                style="width: 100%"
                @change="syncRegionFromPath"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="工作地点" prop="workAddress">
              <el-input v-model="form.workAddress" placeholder="请输入详细地址（如：张江路 88 号 3 号楼）" maxlength="200">
                <template #prefix
                  ><el-icon><LocationInformation /></el-icon
                ></template>
              </el-input>
              <div class="field-hint">选好省市区后会自动预填地址前缀，补充街道门牌即可，例：合肥市高新区创新产业园 A 栋</div>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 模块2：招聘要求 -->
        <el-divider content-position="left">
          <span class="section-title"
            ><el-icon><Filter /></el-icon>招聘要求</span
          >
        </el-divider>
        <el-form-item label="薪资区间" prop="salaryMin">
          <div class="salary-field">
            <div class="salary-top">
              <!-- 面议开关：开启即清空并禁用薪资输入，提交 salaryMin/Max=null（读取方对空薪资统一渲染面议） -->
              <el-checkbox v-model="form.negotiable" @change="onNegotiableChange">薪资面议</el-checkbox>
              <div v-if="!form.negotiable" class="salary-quick">
                <el-tag
                  v-for="q in salaryQuickOptions"
                  :key="q.label"
                  class="salary-quick-tag"
                  :type="isSalaryQuickActive(q) ? 'primary' : 'info'"
                  :effect="isSalaryQuickActive(q) ? 'dark' : 'plain'"
                  @click="applySalaryQuick(q)"
                  >{{ q.label }}</el-tag
                >
              </div>
            </div>
            <div class="salary-inputs">
              <el-input-number
                v-model="form.salaryMin"
                :disabled="form.negotiable"
                :min="0"
                :max="9999999"
                :precision="0"
                controls-position="right"
                placeholder="最低"
                style="width: 150px"
                @change="revalidateSalary"
              />
              <span>至</span>
              <el-input-number
                v-model="form.salaryMax"
                :disabled="form.negotiable"
                :min="0"
                :max="9999999"
                :precision="0"
                controls-position="right"
                placeholder="最高"
                style="width: 150px"
                @change="revalidateSalary"
              />
              <el-select v-model="form.salaryUnit" :disabled="form.negotiable" style="width: 110px" @change="revalidateSalary">
                <el-option v-for="u in salaryUnitOptions" :key="u.value" :label="u.label" :value="u.value" />
              </el-select>
            </div>
            <div v-if="salaryTooLow" class="salary-tip">
              <el-icon><WarningFilled /></el-icon>
              薪资偏低会大幅降低简历投递量，建议调整到合理范围
            </div>
          </div>
        </el-form-item>
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="经验要求" prop="experience">
              <el-select v-model="form.experience" placeholder="请选择经验要求" clearable filterable style="width: 100%">
                <el-option v-for="opt in experienceOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="学历要求" prop="education">
              <el-select v-model="form.education" placeholder="请选择学历要求" clearable filterable style="width: 100%">
                <el-option v-for="opt in educationOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="招聘人数" prop="recruitNumber">
          <div class="recruit-field">
            <div class="recruit-quick">
              <el-tag
                v-for="n in recruitQuickOptions"
                :key="n"
                class="recruit-quick-tag"
                :type="form.recruitNumber === n ? 'primary' : 'info'"
                :effect="form.recruitNumber === n ? 'dark' : 'plain'"
                @click="applyRecruitQuick(n)"
                >{{ n }} 人</el-tag
              >
            </div>
            <div class="recruit-input">
              <el-input-number
                v-model="form.recruitNumber"
                :min="1"
                :max="9999"
                :precision="0"
                :controls="false"
                style="width: 150px"
                @change="revalidateRecruit"
              />
              <span style="margin-left: 8px; color: #606266">人</span>
            </div>
          </div>
        </el-form-item>

        <!-- 模块3：岗位详情 -->
        <el-divider content-position="left">
          <span class="section-title"
            ><el-icon><Tickets /></el-icon>岗位详情</span
          >
        </el-divider>
        <el-form-item label="岗位描述" prop="description">
          <div class="desc-field">
            <div class="desc-templates">
              <span class="desc-templates-label">模板：</span>
              <el-button v-for="t in descTemplates" :key="t.key" size="small" plain @click="applyDescTemplate(t)">{{ t.label }}</el-button>
            </div>
            <el-input v-model="form.description" type="textarea" :rows="8" :placeholder="descriptionPlaceholder" maxlength="2000" show-word-limit />
          </div>
        </el-form-item>
        <el-form-item label="岗位福利">
          <div class="benefit-field">
            <div class="benefit-quick">
              <el-tag v-for="b in benefitQuickOptions" :key="b" class="benefit-quick-tag" type="success" effect="plain" @click="appendBenefit(b)"
                >+ {{ b }}</el-tag
              >
            </div>
            <el-input
              v-model="form.benefits"
              type="textarea"
              :rows="3"
              placeholder="选填：如五险一金、餐补、年终奖、弹性工作等"
              maxlength="500"
              show-word-limit
            />
          </div>
        </el-form-item>
        <el-form-item label="职位亮点">
          <el-input
            v-model="form.highlights"
            type="textarea"
            :rows="2"
            placeholder="选填：一句话亮点，如「核心团队 / 期权激励 / 0-1 机会」"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="团队介绍">
          <el-input
            v-model="form.teamIntro"
            type="textarea"
            :rows="3"
            placeholder="选填：介绍团队规模、氛围、技术栈等"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="附加条件">
          <el-input
            v-model="form.additionalConditions"
            type="textarea"
            :rows="3"
            placeholder="选填：任职附加条件（如需自带工具、接受出差、持有相关证书等）"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 底部固定悬浮操作栏：滚动始终可见 -->
    <div class="publish-footer-bar">
      <div class="left">
        <span v-if="lastAutoSavedText" class="autosave-tip"
          ><el-icon><CircleCheck /></el-icon>{{ lastAutoSavedText }}</span
        >
      </div>
      <div class="right">
        <el-button @click="handleReset">重置表单</el-button>
        <el-button :loading="savingDraft" @click="handleSaveDraft">保存草稿</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">提交审核</el-button>
      </div>
    </div>

    <!-- 求职者端预览：求职者端仅有小程序、无公网 web 页，无法真跳转，这里用表单数据模拟一张 C 端岗位卡 -->
    <el-drawer v-model="previewVisible" title="求职者端预览（模拟）" size="420px" append-to-body>
      <div class="c-preview">
        <div class="c-job-name">{{ form.jobName || '岗位名称' }}</div>
        <div class="c-salary">{{ previewSalaryText }}</div>
        <div class="c-tags">
          <span class="c-tag">{{ labelOf(jobTypeOptions, form.jobType) || '用工性质' }}</span>
          <span class="c-tag">{{ labelOf(experienceOptions, form.experience) || '经验不限' }}</span>
          <span class="c-tag">{{ labelOf(educationOptions, form.education) || '学历不限' }}</span>
        </div>
        <div class="c-company">{{ selectedCompanyName || '所属企业' }}</div>
        <div class="c-location">
          <el-icon><Location /></el-icon>{{ previewLocation }}
        </div>
        <div v-if="previewBenefits.length" class="c-benefits">
          <span v-for="(b, i) in previewBenefits" :key="i" class="c-benefit">{{ b }}</span>
        </div>
        <div class="c-section-title">岗位描述</div>
        <div class="c-desc">{{ form.description || '暂无描述' }}</div>
        <div class="c-note">* 模拟展示，实际样式以求职者端为准</div>
      </div>
    </el-drawer>

    <el-dialog
      v-model="settlementDialogVisible"
      title="临时用工服务意向选择"
      width="620px"
      :close-on-click-modal="false"
      append-to-body
      @close="cancelSettlementIntent"
    >
      <div class="settlement-dialog">
        <p class="settlement-dialog-desc">
          您当前发布的是{{
            currentJobTypeLabel
          }}岗位，请选择本次用工服务方向。本次选择仅用于需求调研与用工风险提示，不会限制岗位发布、简历查看、人员选用等基础功能。
        </p>
        <el-radio-group v-model="settlementIntentType" class="settlement-options">
          <el-radio v-for="opt in settlementIntentOptions" :key="opt.value" :label="opt.value" border>
            <div class="settlement-option">
              <div class="settlement-option-title">
                {{ opt.title }}
                <el-tag v-if="opt.recommended" size="small" type="success" effect="plain">合规推荐</el-tag>
              </div>
              <div class="settlement-option-desc">{{ opt.desc }}</div>
            </div>
          </el-radio>
        </el-radio-group>
        <p class="settlement-dialog-note">本意向选择仅为前置参考调研，后续录用人员时可重新自由切换平台提供的三类选用履约模式，无需受本次选择限制。</p>
      </div>
      <template #footer>
        <el-button @click="cancelSettlementIntent">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="confirmSettlementIntent">确认选择并发布岗位</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="JobPublish" lang="ts">
/**
 * 运营总后台「代发岗位」整页。
 * 数据流：表单 → addJob/saveJobDraft（POST /admin/recruitment/job/add，body=CreateJobRequest，含 companyId）。
 * 关键约定：
 *  - 岗位必须指定所属企业(company_id NOT NULL)，企业租户由后端按 companyId 回填，不走运营登录态租户。
 *  - 面议=不填薪资(salaryMin/Max=null)，读取方统一渲染「面议」，不引入新薪资单位枚举。
 *  - 描述为纯文本(后端 text 列)，模板只填纯文本三段式，不引入富文本，避免污染小程序/C 端渲染。
 *  - 本地自动草稿(localStorage)用于防误关半成品；「保存草稿」是服务端草稿态(status=3)，与后端口径一致需字段填完整。
 */
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { addJob, saveJobDraft, listCompany, getJobFullDetail } from '@/api/recruitment';
import { unwrapList, formatSalary } from './helpers';
import JobPositionPicker from './components/JobPositionPicker.vue';
import {
  jobTypeOptions,
  experienceOptions,
  educationOptions,
  salaryUnitOptions,
  salaryQuickOptions,
  recruitQuickOptions,
  benefitQuickOptions,
  salaryLowThreshold,
  descriptionPlaceholder,
  descTemplates,
  regionOptions,
  labelOf
} from './job-form-options';

const router = useRouter();
const route = useRoute();
const formRef = ref();
const submitting = ref(false);
const savingDraft = ref(false);
const previewVisible = ref(false);
const settlementDialogVisible = ref(false);
const settlementIntentType = ref<'1' | '2' | '3' | ''>('');

// 复制发布：route query copyFrom=jobId，进入后拉全量详情回填
const isCopy = computed(() => !!route.query.copyFrom);

const LOCAL_DRAFT_KEY = 'recruitment-job-publish-draft';

function emptyForm() {
  return {
    companyId: undefined as number | string | undefined,
    jobName: '',
    positionId: '' as number | string | '',
    positionName: '',
    jobType: '0',
    categoryId: '' as number | string | '',
    category: '',
    regionPath: [] as string[],
    province: '',
    city: '',
    district: '',
    workAddress: '',
    negotiable: false,
    salaryMin: undefined as number | undefined,
    salaryMax: undefined as number | undefined,
    salaryUnit: '1',
    experience: '',
    education: '',
    recruitNumber: undefined as number | undefined,
    description: '',
    benefits: '',
    highlights: '',
    teamIntro: '',
    additionalConditions: ''
  };
}

const form = reactive(emptyForm());
const currentJobTypeLabel = computed(() => labelOf(jobTypeOptions, form.jobType) || '临时用工');

// 对齐 B 端：新发布非全职岗位前采集服务意向，随 CreateJobRequest 透传给后端。
const settlementIntentOptions = [
  {
    value: '1' as const,
    title: '企业全程自主对接，线下自行结算',
    desc: '企业独立对接候选人、线下履约发薪；平台仅提供人员匹配服务，不留存用工履约、薪资结算等台账记录。'
  },
  {
    value: '2' as const,
    title: '自主线下结算，需平台提供合规用工方案参考',
    desc: '薪资仍由企业自主发放，选定后专属客服可提供劳务协议模板、临时用工风控指引等参考方案。'
  },
  {
    value: '3' as const,
    title: '录用后平台线上签约 + 第三方合规结算',
    desc: '录用人员后可线上签署标准化劳务合约，薪资经由平台合作第三方机构代发并保留台账，支持导出留证。',
    recommended: true
  }
];

// ===== 所属企业远程搜索 =====
const companyOptions = ref<any[]>([]);
const companyLoading = ref(false);
const selectedCompanyName = computed(() => companyOptions.value.find((c) => c.companyId === form.companyId)?.companyName || '');

async function searchCompany(keyword: string) {
  companyLoading.value = true;
  try {
    const res = await listCompany({ pageNum: 1, pageSize: 20, companyName: keyword } as any);
    companyOptions.value = unwrapList(res).rows;
  } catch {
    companyOptions.value = [];
  } finally {
    companyLoading.value = false;
  }
}

interface StandardPositionPick {
  positionId?: number | string;
  positionName?: string;
  categoryId?: number | string;
  categoryName?: string;
  name?: string;
  category?: string;
}

// BOSS 式选择器以 positions 叶子为标准职位；选中后同时回填职位和直接所属类目快照。
function selectStandardPosition(position: StandardPositionPick) {
  const previousPositionName = String(form.positionName || '');
  const nextPositionName = String(position?.positionName || position?.name || '');
  form.positionId = position?.positionId != null ? String(position.positionId) : '';
  form.positionName = nextPositionName;
  form.categoryId = position?.categoryId != null ? String(position.categoryId) : '';
  form.category = String(position?.categoryName || position?.category || '');
  if (nextPositionName && (!form.jobName.trim() || form.jobName.trim() === previousPositionName)) {
    form.jobName = nextPositionName;
  }
  formRef.value?.validateField?.('category');
  formRef.value?.validateField?.('jobName');
}

function applyPositionSnapshot(positionId: unknown, positionName: unknown, categoryId: unknown, categoryText: unknown) {
  form.positionId = positionId != null ? String(positionId) : '';
  form.positionName = String(positionName || '');
  form.categoryId = categoryId != null ? String(categoryId) : '';
  form.category = String(categoryText || '');
}

function validateStandardPosition(_rule: unknown, _value: unknown, callback: (error?: Error) => void) {
  if (form.positionId && form.positionName && form.categoryId && form.category) {
    callback();
    return;
  }
  callback(new Error('请选择标准职位'));
}

// ===== 校验规则 =====
const rules = {
  companyId: [{ required: true, message: '请选择所属企业', trigger: 'change' }],
  jobName: [{ required: true, message: '请输入岗位名称', trigger: 'blur' }],
  jobType: [{ required: true, message: '请选择用工性质', trigger: 'change' }],
  category: [{ required: true, validator: validateStandardPosition, trigger: 'change' }],
  regionPath: [{ required: true, type: 'array', min: 3, message: '请选择省市区', trigger: 'change' }],
  workAddress: [{ required: true, message: '请输入工作地点', trigger: 'blur' }],
  experience: [{ required: true, message: '请选择经验要求', trigger: 'change' }],
  education: [{ required: true, message: '请选择学历要求', trigger: 'change' }],
  recruitNumber: [{ required: true, message: '请输入招聘人数', trigger: 'change' }],
  description: [{ required: true, message: '请输入岗位描述', trigger: 'blur' }],
  salaryMin: [
    {
      validator: (_rule: any, _value: any, callback: (err?: Error) => void) => {
        // 面议跳过薪资校验
        if (form.negotiable) return callback();
        if (form.salaryMin == null || form.salaryMax == null) {
          callback(new Error('请填写完整薪资区间，或勾选「薪资面议」'));
        } else if (Number(form.salaryMax) < Number(form.salaryMin)) {
          callback(new Error('最低薪资不能高于最高薪资'));
        } else {
          callback();
        }
      },
      trigger: 'change'
    }
  ]
};

// ===== 各字段交互 =====
function shouldCollectSettlementIntent() {
  return ['1', '2', '3'].includes(String(form.jobType));
}

function openSettlementIntentDialog() {
  settlementIntentType.value = '';
  settlementDialogVisible.value = true;
}

function selectJobType(v: string) {
  form.jobType = v;
  formRef.value?.validateField?.('jobType');
}

function syncRegionFromPath() {
  const [province = '', city = '', district = ''] = form.regionPath || [];
  form.province = province;
  form.city = city;
  form.district = district;
  if (!String(form.workAddress || '').trim() && (province || city)) {
    form.workAddress = `${province}${city}`;
    formRef.value?.validateField?.('workAddress');
  }
}

// 省市区选择深度 → regionScope（后端地区范围字段）
function deriveRegionScope(): string {
  const [p, c, d] = form.regionPath || [];
  if (d) return 'district';
  if (c) return 'city';
  if (p) return 'province';
  return 'nationwide';
}

function onNegotiableChange(val: boolean) {
  if (val) {
    form.salaryMin = undefined;
    form.salaryMax = undefined;
  }
  revalidateSalary();
}

function applySalaryQuick(q: { min: number; max: number }) {
  if (form.negotiable) return;
  form.salaryMin = q.min;
  form.salaryMax = q.max;
  form.salaryUnit = '1';
  revalidateSalary();
}

function isSalaryQuickActive(q: { min: number; max: number }): boolean {
  return !form.negotiable && form.salaryUnit === '1' && form.salaryMin === q.min && form.salaryMax === q.max;
}

function revalidateSalary() {
  formRef.value?.validateField?.('salaryMin');
}

const salaryTooLow = computed<boolean>(() => {
  if (form.negotiable) return false;
  const min = form.salaryMin;
  if (min == null || min <= 0) return false;
  const threshold = salaryLowThreshold[form.salaryUnit] ?? 1000;
  return min < threshold;
});

function applyRecruitQuick(n: number) {
  form.recruitNumber = n;
  revalidateRecruit();
}
function revalidateRecruit() {
  formRef.value?.validateField?.('recruitNumber');
}

async function applyDescTemplate(t: { text: string }) {
  if (form.description && form.description.trim()) {
    try {
      await ElMessageBox.confirm('当前已有岗位描述，套用模板会覆盖现有内容，是否继续？', '提示', {
        confirmButtonText: '覆盖',
        cancelButtonText: '取消',
        type: 'warning'
      });
    } catch {
      return;
    }
  }
  form.description = t.text;
  formRef.value?.validateField?.('description');
}

function appendBenefit(b: string) {
  const cur = (form.benefits || '').trim();
  const exists = cur
    .split(/[、,，]/)
    .map((s) => s.trim())
    .includes(b);
  if (exists) return;
  form.benefits = cur ? `${cur}、${b}` : b;
}

// ===== 预览 =====
const previewSalaryText = computed(() => (form.negotiable ? '薪资面议' : formatSalary(form.salaryMin, form.salaryMax, form.salaryUnit)));
const previewLocation = computed(() => {
  const region = [form.province, form.city, form.district].filter(Boolean).join('');
  return form.workAddress || region || '工作地点';
});
const previewBenefits = computed(() =>
  (form.benefits || '')
    .split(/[、,，\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
);

function handlePreview() {
  previewVisible.value = true;
}

// ===== 提交 / 草稿 =====
// 组装 CreateJobRequest payload。面议时薪资字段不下发（=null）。
function buildPayload(status: string) {
  syncRegionFromPath();
  const payload: any = {
    companyId: form.companyId,
    jobName: form.jobName?.trim(),
    positionId: form.positionId || undefined,
    positionName: form.positionName || undefined,
    jobType: form.jobType,
    categoryId: form.categoryId || undefined,
    categoryName: form.category,
    category: form.category,
    province: form.province,
    city: form.city,
    district: form.district,
    regionScope: deriveRegionScope(),
    workAddress: form.workAddress?.trim(),
    experience: form.experience,
    education: form.education,
    recruitNumber: form.recruitNumber,
    description: form.description,
    benefits: form.benefits || undefined,
    highlights: form.highlights || undefined,
    teamIntro: form.teamIntro || undefined,
    additionalConditions: form.additionalConditions || undefined,
    salaryUnit: form.negotiable ? undefined : form.salaryUnit,
    status
  };
  if (!form.negotiable) {
    payload.salaryMin = form.salaryMin;
    payload.salaryMax = form.salaryMax;
  }
  return payload;
}

function validateForm(): Promise<boolean> {
  return new Promise((resolve) => {
    formRef.value?.validate((valid: boolean) => resolve(valid));
  });
}

async function handleSubmit() {
  if (shouldCollectSettlementIntent()) {
    // 对齐 B 端：非全职岗位点击提交审核先采集服务意向，确认后再执行原表单校验和创建请求。
    openSettlementIntentDialog();
    return;
  }
  await validateAndSubmitJob();
}

async function validateAndSubmitJob(extraPayload?: Record<string, any>) {
  const valid = await validateForm();
  if (!valid) {
    ElMessage.warning('请完善表单中标红的必填项');
    return;
  }
  const payload = {
    ...buildPayload('0'),
    ...(extraPayload || {})
  };
  await submitJobPayload(payload);
}

async function submitJobPayload(payload: Record<string, any>) {
  submitting.value = true;
  try {
    await addJob(payload);
    clearLocalDraft();
    afterSuccess('岗位已提交审核');
  } catch {
    ElMessage.error('提交失败');
  } finally {
    submitting.value = false;
  }
}

async function confirmSettlementIntent() {
  if (!settlementIntentType.value) {
    ElMessage.warning('请选择临时用工服务意向');
    return;
  }
  const selectedIntentType = settlementIntentType.value;
  settlementDialogVisible.value = false;
  await validateAndSubmitJob({ settlementIntentType: selectedIntentType });
}

function cancelSettlementIntent() {
  if (submitting.value) return;
  settlementDialogVisible.value = false;
  settlementIntentType.value = '';
}

// 保存草稿：后端 /add 对草稿同样做完整字段校验（与 B 端一致），故这里也走完整校验，仅 status 不同。
// 半成品防丢失由「本地自动草稿」承担。
async function handleSaveDraft() {
  const valid = await validateForm();
  if (!valid) {
    ElMessage.warning('保存草稿同样需要填写完整必填项（半成品已自动存本地，可放心离开）');
    return;
  }
  savingDraft.value = true;
  try {
    await saveJobDraft(buildPayload('3'));
    clearLocalDraft();
    ElMessage.success('草稿已保存');
  } catch {
    ElMessage.error('草稿保存失败');
  } finally {
    savingDraft.value = false;
  }
}

function afterSuccess(msg: string) {
  ElMessageBox.confirm(`${msg}，下一步？`, '操作成功', {
    confirmButtonText: '查看岗位列表',
    cancelButtonText: '继续发布新岗位',
    type: 'success',
    distinguishCancelAndClose: true
  })
    .then(() => router.push({ name: 'RecruitmentJob' }))
    .catch((action) => {
      if (action === 'cancel') {
        Object.assign(form, emptyForm());
        formRef.value?.clearValidate?.();
      }
    });
}

function handleReset() {
  ElMessageBox.confirm('重置会清空所有已填写内容，是否继续？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      Object.assign(form, emptyForm());
      formRef.value?.clearValidate?.();
      clearLocalDraft();
    })
    .catch(() => {});
}

function goBack() {
  router.back();
}

// ===== 本地自动草稿（防误关半成品，纯前端 localStorage） =====
const lastAutoSavedText = ref('');
let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function scheduleAutoSave() {
  if (autoSaveTimer) clearTimeout(autoSaveTimer);
  // 3 秒无操作落本地
  autoSaveTimer = setTimeout(() => {
    try {
      localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify(form));
      const d = new Date();
      lastAutoSavedText.value = `草稿已自动保存 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      // localStorage 不可用时静默忽略
    }
  }, 3000);
}

function clearLocalDraft() {
  try {
    localStorage.removeItem(LOCAL_DRAFT_KEY);
  } catch {
    /* ignore */
  }
  lastAutoSavedText.value = '';
}

function restoreLocalDraft() {
  try {
    const raw = localStorage.getItem(LOCAL_DRAFT_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    Object.assign(form, saved);
    lastAutoSavedText.value = '已恢复上次未提交的草稿';
    // 恢复企业名以便选择器回显
    if (form.companyId) {
      companyOptions.value = [{ companyId: form.companyId, companyName: saved.__companyName || '已选企业' }];
    }
  } catch {
    /* ignore */
  }
}

// 监听表单变化触发自动存（深监听）
watch(form, () => scheduleAutoSave(), { deep: true });

// Ctrl+S 保存草稿
function onKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
    e.preventDefault();
    handleSaveDraft();
  }
}

// ===== 复制发布回填 =====
async function loadCopyFrom(jobId: string) {
  try {
    const res = await getJobFullDetail(jobId as any);
    const d: any = res.data || {};
    form.companyId = d.companyId ?? undefined;
    if (d.companyId) companyOptions.value = [{ companyId: d.companyId, companyName: d.companyName || '已选企业' }];
    form.jobName = d.jobName || d.positionName || '';
    form.jobType = d.jobType != null ? String(d.jobType) : '0';
    applyPositionSnapshot(d.positionId, d.positionName, d.categoryId, d.categoryName || d.category);
    form.province = d.province ?? '';
    form.city = d.city ?? '';
    form.district = d.district ?? '';
    form.regionPath = [d.province, d.city, d.district].filter(Boolean);
    const noSalary = d.salaryMin == null && d.salaryMax == null;
    form.negotiable = noSalary;
    form.salaryMin = d.salaryMin ?? undefined;
    form.salaryMax = d.salaryMax ?? undefined;
    form.salaryUnit = d.salaryUnit != null ? String(d.salaryUnit) : '1';
    form.workAddress = d.workAddress || '';
    form.experience = d.experience != null ? String(d.experience) : '';
    form.education = d.education != null ? String(d.education) : '';
    form.recruitNumber = d.recruitNumber ?? undefined;
    form.description = d.description ?? '';
    form.benefits = d.benefits ?? '';
    form.highlights = d.highlights ?? '';
    form.teamIntro = d.teamIntro ?? '';
    form.additionalConditions = d.additionalConditions ?? '';
  } catch {
    ElMessage.error('复制源岗位信息获取失败');
  }
}

onMounted(async () => {
  window.addEventListener('keydown', onKeydown);
  if (isCopy.value) {
    await loadCopyFrom(String(route.query.copyFrom));
  } else {
    restoreLocalDraft();
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown);
  if (autoSaveTimer) clearTimeout(autoSaveTimer);
});
</script>

<style scoped>
.job-publish-page {
  padding: 16px;
  padding-bottom: 80px; /* 给底部悬浮栏留空间 */
}

.publish-card {
  border-radius: 12px;
}

.publish-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.publish-title .t {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.publish-title .sub {
  margin-left: 10px;
  font-size: 12px;
  color: #909399;
}

.publish-form :deep(.el-divider) {
  margin: 4px 0 18px;
}

.section-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #2b7fff;
  font-size: 14px;
  font-weight: 600;
}

.publish-form :deep(.el-form-item__label) {
  font-weight: 600;
  color: #333;
}

.field-hint {
  margin-top: 4px;
  font-size: 12px;
  color: #a8abb2;
  line-height: 1.4;
}

/* 用工性质块状卡片 */
.job-type-cards {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.job-type-card {
  min-width: 60px;
  padding: 5px 14px;
  text-align: center;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
  font-size: 13px;
  color: #606266;
  transition: all 0.15s ease;
}

.job-type-card:hover {
  background: #f5f7fa;
  border-color: #c0c4cc;
}

.job-type-card.active {
  background: #2b7fff;
  border-color: #2b7fff;
  color: #fff;
}

/* 薪资 */
.salary-field {
  width: 100%;
}

.salary-top {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.salary-quick {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.salary-quick-tag,
.recruit-quick-tag,
.benefit-quick-tag {
  cursor: pointer;
}

.salary-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.salary-tip {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
  font-size: 12px;
  color: #e6a23c;
}

.recruit-quick,
.benefit-quick {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.desc-templates {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.desc-templates-label {
  font-size: 12px;
  color: #909399;
}

.desc-field,
.benefit-field,
.recruit-field {
  width: 100%;
}

/* 底部悬浮操作栏 */
.publish-footer-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: 60px;
  background: #fff;
  border-top: 1px solid #ebeef5;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.04);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  z-index: 10;
}

.autosave-tip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #67c23a;
}

/* 求职者端模拟预览卡 */
.c-preview {
  padding: 4px 6px;
}

.c-job-name {
  font-size: 18px;
  font-weight: 700;
  color: #303133;
}

.c-salary {
  margin-top: 6px;
  font-size: 16px;
  font-weight: 600;
  color: #f56c6c;
}

.c-tags {
  margin-top: 10px;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.c-tag {
  background: #f0f4ff;
  color: #2b7fff;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}

.c-company {
  margin-top: 12px;
  font-size: 14px;
  color: #303133;
}

.c-location {
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #909399;
}

.c-benefits {
  margin-top: 10px;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.c-benefit {
  background: #f0f9eb;
  color: #67c23a;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}

.c-section-title {
  margin-top: 16px;
  font-weight: 600;
  color: #303133;
  border-left: 3px solid #2b7fff;
  padding-left: 8px;
}

.c-desc {
  margin-top: 8px;
  font-size: 13px;
  color: #606266;
  white-space: pre-wrap;
  line-height: 1.6;
}

.c-note {
  margin-top: 16px;
  font-size: 11px;
  color: #c0c4cc;
}

.settlement-dialog {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.settlement-dialog-desc,
.settlement-dialog-note {
  margin: 0;
  color: #64748b;
  font-size: 13px;
  line-height: 1.7;
}

.settlement-dialog-note {
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f8fafc;
}

.settlement-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.settlement-options :deep(.el-radio.is-bordered) {
  display: flex;
  width: 100%;
  height: auto;
  min-height: 76px;
  margin-right: 0;
  padding: 12px 14px;
  align-items: flex-start;
  border-color: #e2e8f0;
  border-radius: 8px;
  white-space: normal;
  transition: all 0.2s;
}

.settlement-options :deep(.el-radio.is-bordered:hover),
.settlement-options :deep(.el-radio.is-bordered.is-checked) {
  border-color: #2b7fff;
}

.settlement-options :deep(.el-radio.is-bordered.is-checked) {
  background: #eef5ff;
}

.settlement-options :deep(.el-radio__input) {
  flex: 0 0 auto;
  padding-top: 3px;
}

.settlement-options :deep(.el-radio__label) {
  display: block;
  width: 100%;
  min-width: 0;
  padding-left: 10px;
  white-space: normal;
}

.settlement-option {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 5px;
}

.settlement-option-title {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  color: #0f172a;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
  white-space: normal;
}

.settlement-option-title :deep(.el-tag) {
  flex: 0 0 auto;
}

.settlement-option-desc {
  color: #64748b;
  font-size: 12.5px;
  line-height: 1.6;
  white-space: normal;
}
</style>
