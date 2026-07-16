<template>
  <!-- 页面职责：推广人员登录后台后，在同一页面完成推广概览、二维码查看、明细检索与岗位穿透。 -->
  <div class="promoter-workbench app-container">
    <div class="page-head">
      <div>
        <div class="title-row">
          <h2>个人工作台</h2>
          <el-tag v-if="workbench.identityTypeName" type="success" effect="light">{{ workbench.identityTypeName }}</el-tag>
        </div>
        <p>生成专属推广链接和二维码，查看本人今日与累计推广数据</p>
      </div>
      <el-button :icon="Refresh" :loading="loading" @click="loadWorkbench">刷新</el-button>
    </div>

    <el-skeleton :loading="loading" animated>
      <template #default>
        <section class="profile-band">
          <div>
            <span class="label">推广人员</span>
            <strong>{{ workbench.name || '-' }}</strong>
          </div>
          <div>
            <span class="label">手机号</span>
            <strong>{{ workbench.phonenumber || '-' }}</strong>
          </div>
          <div>
            <span class="label">岗位/角色</span>
            <strong>{{ workbench.roleName || '-' }}</strong>
          </div>
          <div>
            <span class="label">推广码</span>
            <strong>{{ workbench.promotionCode || '-' }}</strong>
          </div>
        </section>

        <section class="metrics-section">
          <div class="section-title">
            <h3>今日数据</h3>
            <span>当日新增企业、求职者、授权、简历与投递</span>
          </div>
          <div class="metric-grid">
            <button v-for="item in todayMetrics" :key="item.label" class="metric-card" type="button" @click="openDetail(item)">
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
              <em :class="['metric-compare', compareClass(item.compareValue)]">较昨日 {{ formatCompare(item.compareValue) }}</em>
            </button>
          </div>
        </section>

        <section class="metrics-section">
          <div class="section-title">
            <h3>累计数据</h3>
            <span>当前推广人员累计贡献统计</span>
          </div>
          <div class="metric-grid">
            <button v-for="item in totalMetrics" :key="item.label" class="metric-card" type="button" @click="openDetail(item)">
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
            </button>
          </div>
        </section>

        <section class="tools-section">
          <div class="tool-panel">
            <div class="tool-title">
              <el-icon><Picture /></el-icon>
              <div>
                <h3>我的C端推广二维码</h3>
                <p>分享给求职者，扫码进入小程序</p>
              </div>
            </div>
            <div v-loading="cQrLoading" class="qr-box">
              <img v-if="cQrUrl" :src="cQrUrl" alt="C端推广二维码" />
              <el-empty v-else :description="cQrError || '二维码待生成'" :image-size="80">
                <el-button v-if="cQrError" type="primary" link @click="loadQr('C')">重新生成</el-button>
              </el-empty>
            </div>
            <div class="button-row">
              <el-button :icon="DocumentCopy" @click="copyText(workbench.cPromotionLink || '')">复制路径</el-button>
              <el-button type="primary" :icon="Download" @click="downloadQr('C')">下载二维码</el-button>
            </div>
          </div>

          <div class="tool-panel link-panel">
            <div class="tool-title">
              <el-icon><LinkIcon /></el-icon>
              <div>
                <h3>我的B端推广链接</h3>
                <p>分享给企业，企业可通过电脑打开</p>
              </div>
            </div>
            <div class="code-box">
              <span>推广码</span>
              <strong>{{ promotionCodeText }}</strong>
              <el-button link type="primary" :icon="DocumentCopy" @click="copyText(promotionCodeText)">复制推广码</el-button>
            </div>
            <el-input v-model="bPromotionLink" readonly type="textarea" :rows="5" />
            <el-button type="primary" :icon="DocumentCopy" @click="copyText(bPromotionCopyText)">复制链接和推广码</el-button>
          </div>

          <div class="tool-panel">
            <div class="tool-title">
              <el-icon><Picture /></el-icon>
              <div>
                <h3>我的B端推广二维码</h3>
                <p>用于企业手机扫码进入</p>
              </div>
            </div>
            <div v-loading="bQrLoading" class="qr-box">
              <img v-if="bQrUrl" :src="bQrUrl" alt="B端推广二维码" />
              <el-empty v-else :description="bQrError || '二维码待生成'" :image-size="80">
                <el-button v-if="bQrError" type="primary" link @click="loadQr('B')">重新生成</el-button>
              </el-empty>
            </div>
            <el-button type="primary" :icon="Download" @click="downloadQr('B')">下载二维码</el-button>
          </div>
        </section>

        <el-alert v-if="workbench.remark" class="remark-alert" type="info" :closable="false" show-icon :title="workbench.remark" />
      </template>
    </el-skeleton>

    <el-dialog v-model="detailVisible" :title="detailTitle" width="1280px" append-to-body destroy-on-close>
      <el-card shadow="never" class="dialog-card">
        <!-- 查询项只保留工作台视角真正有效的对象筛选，避免把推广人本人维度误暴露到前端。 -->
        <el-form :model="detailQuery" :inline="true" class="detail-query-form">
          <el-form-item label="关键词">
            <el-input
              v-model="detailQuery.keyword"
              :placeholder="detailKeywordPlaceholder"
              clearable
              style="width: 240px"
              @keyup.enter="handleDetailQuery"
            />
          </el-form-item>
          <el-form-item v-if="showDetailStatusFilter" label="状态">
            <el-select v-model="detailQuery.status" placeholder="全部" clearable style="width: 180px">
              <el-option v-for="item in detailStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="时间范围">
            <el-date-picker
              v-model="detailDateRange"
              type="daterange"
              value-format="YYYY-MM-DD"
              range-separator="-"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              style="width: 260px"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleDetailQuery">查询</el-button>
            <el-button @click="resetDetailQuery">重置</el-button>
            <el-button type="success" plain @click="handleDetailExport">导出</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <el-table v-loading="detailLoading" :data="detailRows" border stripe height="460">
        <el-table-column prop="objectTypeName" label="类型" width="110" align="center" />
        <el-table-column label="主体信息" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="object-info">
              <div class="name">{{ row.objectName || '-' }}</div>
              <div class="sub">
                <span v-if="row.contactPerson">联系人：{{ row.contactPerson }}</span>
                <span v-else-if="row.phone">手机号：{{ row.phone }}</span>
                <span v-else>暂无补充信息</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" width="150" align="center">
          <template #default="{ row }">{{ row.phone || '-' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="140" align="center">
          <template #default="{ row }">
            <el-tag :type="resolveTagType(detailStatusMeta(row).type)">{{ detailStatusMeta(row).label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="岗位数" width="100" align="center">
          <template #default="{ row }">
            <el-button v-if="row.objectType === 'company'" link type="primary" class="count-link" @click="openJobDialog(row)">
              {{ row.jobCount || 0 }}
            </el-button>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column :label="detailTimeLabel" width="180" align="center">
          <template #default="{ row }">{{ resolveDetailMetricTime(row) || '-' }}</template>
        </el-table-column>
        <el-table-column prop="promotedAt" label="推广进入时间" width="180" align="center">
          <template #default="{ row }">{{ row.promotedAt || row.createTime || '-' }}</template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" align="center">
          <template #default="{ row }">{{ row.createTime || '-' }}</template>
        </el-table-column>
      </el-table>

      <div class="detail-pager">
        <el-pagination
          v-model:current-page="detailQuery.pageNum"
          v-model:page-size="detailQuery.pageSize"
          background
          layout="total, sizes, prev, pager, next, jumper"
          :page-sizes="[10, 20, 50, 100]"
          :total="detailTotal"
          @size-change="loadDetail"
          @current-change="loadDetail"
        />
      </div>
    </el-dialog>

    <el-dialog v-model="jobVisible" :title="jobTitle" width="980px" append-to-body destroy-on-close>
      <el-table v-loading="jobLoading" :data="jobList" border stripe>
        <el-table-column label="岗位名称" prop="jobName" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">{{ row.jobName || '-' }}</template>
        </el-table-column>
        <el-table-column label="用工性质" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="resolveTagType(jobTypeMeta(row.jobType).type)">{{ row.jobTypeName || jobTypeMeta(row.jobType).label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="薪资" prop="salary" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">{{ row.salary || '-' }}</template>
        </el-table-column>
        <el-table-column label="工作地点" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">{{ row.location || '-' }}</template>
        </el-table-column>
        <el-table-column label="投递数" prop="applyCount" width="90" align="center">
          <template #default="{ row }">{{ row.applyCount || 0 }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="resolveTagType(jobStatusMeta(row.status).type)">{{ row.statusName || jobStatusMeta(row.status).label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="发布时间" prop="publishTime" width="170" align="center">
          <template #default="{ row }">{{ row.publishTime || row.createTime || '-' }}</template>
        </el-table-column>
      </el-table>

      <pagination
        v-show="jobTotal > 0"
        v-model:page="jobQuery.pageNum"
        v-model:limit="jobQuery.pageSize"
        :total="jobTotal"
        @pagination="loadJobList"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { DocumentCopy, Download, Link as LinkIcon, Picture, Refresh } from '@element-plus/icons-vue';
import {
  getPromoterWorkbench,
  getPromoterWorkbenchQrCode,
  listJob,
  listPromoterWorkbenchDetail,
  type JobQuery,
  type JobVO,
  type PromotionAttributionDetailVO,
  type PromotionAttributionQuery,
  type PromoterWorkbenchVO
} from '@/api/recruitment';
import { companyStatusMeta, jobStatusMeta, jobTypeMeta, type StatusMeta } from '@/views/recruitment/constants';
import { download } from '@/utils/request';

type WorkbenchMetric = 'company' | 'jobSeeker' | 'authorized' | 'resume' | 'apply';
type WorkbenchPeriod = 'today' | 'total';

interface MetricCardItem {
  label: string;
  value: number;
  metric: WorkbenchMetric;
  period: WorkbenchPeriod;
  compareValue?: number;
}

interface WorkbenchDetailQuery extends PromotionAttributionQuery {
  pageNum: number;
  pageSize: number;
  metric: WorkbenchMetric;
  period: WorkbenchPeriod;
}

const USER_STATUS_META: Record<string, StatusMeta> = {
  entered: { label: '已进入', type: 'info' },
  authorized: { label: '已授权手机号', type: 'warning' },
  resume: { label: '已完善简历', type: 'success' },
  apply: { label: '已投递', type: 'primary' }
};

const loading = ref(false);
const workbench = ref<PromoterWorkbenchVO>({});
const cQrUrl = ref('');
const bQrUrl = ref('');
const cQrLoading = ref(false);
const bQrLoading = ref(false);
const cQrError = ref('');
const bQrError = ref('');

const detailVisible = ref(false);
const detailLoading = ref(false);
const detailRows = ref<PromotionAttributionDetailVO[]>([]);
const detailTotal = ref(0);
const detailTitle = ref('');
const detailDateRange = ref<string[]>([]);
const detailQuery = reactive<WorkbenchDetailQuery>({
  pageNum: 1,
  pageSize: 10,
  metric: 'company',
  period: 'today',
  keyword: undefined,
  status: undefined,
  beginTime: undefined,
  endTime: undefined
});

const jobVisible = ref(false);
const jobTitle = ref('');
const jobLoading = ref(false);
const jobList = ref<JobVO[]>([]);
const jobTotal = ref(0);
const jobQuery = reactive<JobQuery>({
  pageNum: 1,
  pageSize: 10,
  companyId: undefined
});

const promotionCodeText = computed(() => workbench.value.promotionCode || '');
const bPromotionLink = computed(() => {
  const code = promotionCodeText.value;
  const link = workbench.value.bPromotionLink || '';
  if (!code) return link;
  if (!link) {
    // 企业端当前使用 hash 路由，推广链接必须落到 /#/register，避免 promoterCode 在前端路由解析前丢失。
    return `https://recruiter.zgypzp.com/#/register?userType=B&source=promoter&promoterCode=${encodeURIComponent(code)}`;
  }
  if (link.includes('promoterCode=')) return link;
  const separator = link.includes('?') ? '&' : '?';
  return `${link}${separator}promoterCode=${encodeURIComponent(code)}`;
});
const bPromotionCopyText = computed(() => {
  const lines = [`B端推广链接：${bPromotionLink.value}`];
  if (promotionCodeText.value) {
    lines.push(`推广码：${promotionCodeText.value}`);
  }
  return lines.join('\n');
});

const todayMetrics = computed<MetricCardItem[]>(() => [
  {
    label: '新增企业',
    value: workbench.value.todayCompanyCount ?? 0,
    metric: 'company',
    period: 'today',
    compareValue: compareToday(workbench.value.todayCompanyCount, workbench.value.yesterdayCompanyCount)
  },
  {
    label: '新增求职者',
    value: workbench.value.todayJobSeekerCount ?? 0,
    metric: 'jobSeeker',
    period: 'today',
    compareValue: compareToday(workbench.value.todayJobSeekerCount, workbench.value.yesterdayJobSeekerCount)
  },
  {
    label: '授权手机号',
    value: workbench.value.todayAuthorizedCount ?? 0,
    metric: 'authorized',
    period: 'today',
    compareValue: compareToday(workbench.value.todayAuthorizedCount, workbench.value.yesterdayAuthorizedCount)
  },
  {
    label: '填简历',
    value: workbench.value.todayResumeCount ?? 0,
    metric: 'resume',
    period: 'today',
    compareValue: compareToday(workbench.value.todayResumeCount, workbench.value.yesterdayResumeCount)
  },
  {
    label: '投递',
    value: workbench.value.todayApplyCount ?? 0,
    metric: 'apply',
    period: 'today',
    compareValue: compareToday(workbench.value.todayApplyCount, workbench.value.yesterdayApplyCount)
  }
]);

const totalMetrics = computed<MetricCardItem[]>(() => [
  { label: '累计企业', value: workbench.value.totalCompanyCount ?? 0, metric: 'company', period: 'total' },
  { label: '累计求职者', value: workbench.value.totalJobSeekerCount ?? 0, metric: 'jobSeeker', period: 'total' },
  { label: '授权手机号', value: workbench.value.totalAuthorizedCount ?? 0, metric: 'authorized', period: 'total' },
  { label: '填简历', value: workbench.value.totalResumeCount ?? 0, metric: 'resume', period: 'total' },
  { label: '投递', value: workbench.value.totalApplyCount ?? 0, metric: 'apply', period: 'total' }
]);

const showDetailStatusFilter = computed(() => detailQuery.metric === 'company' || detailQuery.metric === 'jobSeeker');
const detailKeywordPlaceholder = computed(() => (detailQuery.metric === 'company' ? '请输入企业名称/联系人/手机号' : '请输入姓名/昵称/手机号'));
const detailStatusOptions = computed(() => {
  if (detailQuery.metric === 'company') {
    return [
      { label: '待审核', value: '0' },
      { label: '已认证', value: '1' },
      { label: '已禁用', value: '2' },
      { label: '资料完整', value: 'completed' },
      { label: '资料不完整', value: 'incomplete' },
      { label: '已发布岗位', value: 'published' }
    ];
  }
  if (detailQuery.metric === 'jobSeeker') {
    return [
      { label: '已授权手机号', value: 'authorized' },
      { label: '已完善简历', value: 'resume' },
      { label: '已投递', value: 'apply' },
      { label: '未完善简历', value: 'unresume' },
      { label: '未投递', value: 'unapply' }
    ];
  }
  return [];
});
const detailTimeLabel = computed(() => {
  switch (detailQuery.metric) {
    case 'authorized':
      return '授权时间';
    case 'resume':
      return '简历完成时间';
    case 'apply':
      return '首次投递时间';
    default:
      return '关键时间';
  }
});

async function loadWorkbench() {
  loading.value = true;
  try {
    workbench.value = unwrapData<PromoterWorkbenchVO>(await getPromoterWorkbench());
    // C/B 二维码各自维护失败态，任一端生成失败时保留另一端已成功生成的推广材料。
    await Promise.all([loadQr('C'), loadQr('B')]);
  } catch (error: unknown) {
    ElMessage.error(formatErrorMessage(error));
    revokeUrl(cQrUrl.value);
    revokeUrl(bQrUrl.value);
    cQrUrl.value = '';
    bQrUrl.value = '';
  } finally {
    loading.value = false;
  }
}

function compareToday(today?: number, yesterday?: number) {
  return Number(today || 0) - Number(yesterday || 0);
}

function formatCompare(value?: number) {
  const num = Number(value || 0);
  return num > 0 ? `+${num}` : `${num}`;
}

function compareClass(value?: number) {
  const num = Number(value || 0);
  if (num > 0) return 'is-up';
  if (num < 0) return 'is-down';
  return 'is-flat';
}

async function openDetail(item: MetricCardItem) {
  detailTitle.value = `${item.period === 'today' ? '今日' : '累计'}${item.label}明细`;
  detailQuery.metric = item.metric;
  detailQuery.period = item.period;
  resetDetailQuery();
  detailVisible.value = true;
  await loadDetail();
}

function handleDetailQuery() {
  detailQuery.pageNum = 1;
  loadDetail();
}

function resetDetailQuery() {
  detailQuery.pageNum = 1;
  detailQuery.pageSize = 10;
  detailQuery.keyword = undefined;
  detailQuery.status = undefined;
  detailDateRange.value = [];
}

async function loadDetail() {
  detailLoading.value = true;
  try {
    const res = unwrapData<any>(await listPromoterWorkbenchDetail(buildDetailParams()));
    detailRows.value = res?.rows || [];
    detailTotal.value = Number(res?.total || 0);
  } catch (error: unknown) {
    detailRows.value = [];
    detailTotal.value = 0;
    ElMessage.error(formatErrorMessage(error));
  } finally {
    detailLoading.value = false;
  }
}

function handleDetailExport() {
  // 导出与列表复用同一套筛选条件，避免前端看到的数据和导出的数据口径不一致。
  download('/admin/recruitment/promoter/workbench/detail/export', buildDetailParams(false), `${detailTitle.value || '推广明细'}.xlsx`);
}

function buildDetailParams(): WorkbenchDetailQuery;
function buildDetailParams(includePage: false): Record<string, any>;
function buildDetailParams(includePage = true) {
  const params: WorkbenchDetailQuery = {
    metric: detailQuery.metric,
    period: detailQuery.period,
    pageNum: detailQuery.pageNum,
    pageSize: detailQuery.pageSize,
    keyword: detailQuery.keyword?.trim() || undefined,
    status: showDetailStatusFilter.value ? detailQuery.status || undefined : undefined,
    beginTime: detailDateRange.value[0] ? `${detailDateRange.value[0]} 00:00:00` : undefined,
    endTime: detailDateRange.value[1] ? `${detailDateRange.value[1]} 23:59:59` : undefined
  };
  if (!includePage) {
    return {
      ...params,
      pageNum: undefined,
      pageSize: undefined
    };
  }
  return params;
}

function detailStatusMeta(row: PromotionAttributionDetailVO): StatusMeta {
  if (row.objectType === 'company') {
    return companyStatusMeta(row.status);
  }
  return USER_STATUS_META[row.status || ''] || { label: row.statusName || '未知', type: 'info' };
}

function resolveDetailMetricTime(row: PromotionAttributionDetailVO) {
  switch (detailQuery.metric) {
    case 'authorized':
      return row.authorizedTime || row.promotedAt || row.createTime;
    case 'resume':
      return row.resumeCompletedTime || row.promotedAt || row.createTime;
    case 'apply':
      return row.firstApplyTime || row.promotedAt || row.createTime;
    default:
      return row.promotedAt || row.createTime;
  }
}

function resolveTagType(type?: StatusMeta['type']) {
  return type || 'info';
}

async function openJobDialog(row: PromotionAttributionDetailVO) {
  if (row.objectType !== 'company') {
    return;
  }
  jobTitle.value = `${row.objectName || '企业'}岗位列表`;
  jobQuery.companyId = Number(row.objectId);
  jobQuery.pageNum = 1;
  jobVisible.value = true;
  await loadJobList();
}

async function loadJobList() {
  if (!jobQuery.companyId) {
    jobList.value = [];
    jobTotal.value = 0;
    return;
  }
  jobLoading.value = true;
  try {
    const res = unwrapData<any>(await listJob(jobQuery));
    jobList.value = res?.rows || [];
    jobTotal.value = Number(res?.total || 0);
  } catch (error: unknown) {
    jobList.value = [];
    jobTotal.value = 0;
    ElMessage.error(formatErrorMessage(error));
  } finally {
    jobLoading.value = false;
  }
}

async function loadQr(target: 'C' | 'B') {
  setQrLoading(target, true);
  setQrError(target, '');
  try {
    // 全局响应拦截器对 responseType=blob 直接返回 res.data，此处不能再按普通 R<T> 取 .data。
    const blob = await getPromoterWorkbenchQrCode(target);
    if (!blob || blob.size <= 0) {
      throw new Error('二维码返回内容为空');
    }
    if (blob.type && !blob.type.startsWith('image/')) {
      const text = await blob.text();
      let msg = '二维码接口返回非图片内容，请稍后重试';
      try {
        const data = JSON.parse(text);
        msg = data?.msg || data?.message || msg;
      } catch {
        if (text?.trim()) {
          msg = text;
        }
      }
      throw new Error(msg);
    }
    if (!blob.type && blob.size > 0) {
      const text = (await blob.text()).trim();
      if (text.startsWith('{') || text.startsWith('[')) {
        let msg = '二维码接口返回非图片内容，请稍后重试';
        try {
          const data = JSON.parse(text);
          msg = data?.msg || data?.message || msg;
        } catch {
          msg = text || msg;
        }
        throw new Error(msg);
      }
    }
    const url = URL.createObjectURL(blob);
    if (target === 'C') {
      revokeUrl(cQrUrl.value);
      cQrUrl.value = url;
    } else {
      revokeUrl(bQrUrl.value);
      bQrUrl.value = url;
    }
  } catch (error: unknown) {
    clearQrUrl(target);
    setQrError(target, formatErrorMessage(error));
  } finally {
    setQrLoading(target, false);
  }
}

function clearQrUrl(target: 'C' | 'B') {
  const currentUrl = target === 'C' ? cQrUrl.value : bQrUrl.value;
  revokeUrl(currentUrl);
  if (target === 'C') {
    cQrUrl.value = '';
  } else {
    bQrUrl.value = '';
  }
}

function setQrLoading(target: 'C' | 'B', value: boolean) {
  if (target === 'C') {
    cQrLoading.value = value;
  } else {
    bQrLoading.value = value;
  }
}

function setQrError(target: 'C' | 'B', message: string) {
  if (target === 'C') {
    cQrError.value = message;
  } else {
    bQrError.value = message;
  }
}

async function copyText(text: string) {
  if (!text) {
    ElMessage.warning('暂无可复制内容');
    return;
  }
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text);
  } else {
    const input = document.createElement('textarea');
    input.value = text;
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
  }
  ElMessage.success('已复制');
}

function downloadQr(target: 'C' | 'B') {
  const label = target === 'C' ? 'C端' : 'B端';
  download('/admin/recruitment/promoter/workbench/qrcode/download', { target }, `${label}推广二维码_${Date.now()}.jpg`);
}

function revokeUrl(url: string) {
  if (url) {
    URL.revokeObjectURL(url);
  }
}

function unwrapData<T>(res: any): T {
  return res?.data;
}

function formatErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'object' && error !== null) {
    const errObj: any = error;
    if (typeof errObj.message === 'string') {
      return errObj.message;
    }
    if (typeof errObj.msg === 'string') {
      return errObj.msg;
    }
    if (typeof errObj.response?.data?.msg === 'string') {
      return errObj.response.data.msg;
    }
  }
  return '加载工作台数据失败，请稍后重试';
}

onMounted(loadWorkbench);

onBeforeUnmount(() => {
  revokeUrl(cQrUrl.value);
  revokeUrl(bQrUrl.value);
});
</script>

<style scoped lang="scss">
.promoter-workbench {
  background: #f5f7fb;
  min-height: calc(100vh - 84px);
}

.page-head,
.profile-band,
.metrics-section,
.tool-panel {
  background: #fff;
  border: 1px solid #e6ebf5;
  border-radius: 8px;
}

.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  margin-bottom: 14px;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 10px;

  h2 {
    margin: 0;
    color: #1f2a3d;
    font-size: 22px;
    font-weight: 700;
  }
}

.page-head p,
.section-title span,
.tool-title p {
  margin: 6px 0 0;
  color: #7b8494;
  font-size: 13px;
}

.profile-band {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  padding: 18px 24px;
  margin-bottom: 14px;

  .label {
    display: block;
    margin-bottom: 8px;
    color: #8b95a6;
    font-size: 13px;
  }

  strong {
    color: #1f2a3d;
    font-size: 18px;
  }
}

.metrics-section {
  padding: 18px 20px;
  margin-bottom: 14px;
}

.section-title {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 14px;

  h3 {
    margin: 0;
    color: #1f2a3d;
    font-size: 18px;
  }
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

.metric-card {
  width: 100%;
  padding: 16px;
  text-align: left;
  background: #f8fbff;
  border: 1px solid #e4edf8;
  border-radius: 8px;
  cursor: pointer;
  transition:
    border-color 0.2s,
    box-shadow 0.2s,
    transform 0.2s;

  &:hover {
    border-color: #9fc4ff;
    box-shadow: 0 8px 18px rgba(29, 99, 217, 0.12);
    transform: translateY(-1px);
  }

  span {
    display: block;
    color: #768196;
    font-size: 13px;
  }

  strong {
    display: block;
    margin-top: 10px;
    color: #1d63d9;
    font-size: 28px;
    line-height: 1;
  }
}

.metric-compare {
  display: inline-flex;
  align-items: center;
  margin-top: 10px;
  font-style: normal;
  color: #7b8494;
  font-size: 12px;
  line-height: 1;

  &.is-up {
    color: #16a34a;
  }

  &.is-down {
    color: #dc2626;
  }

  &.is-flat {
    color: #7b8494;
  }
}

.dialog-card {
  margin-bottom: 14px;
  border: 1px solid #ebeef5;
}

.detail-query-form {
  margin-bottom: -18px;
}

.object-info {
  .name {
    color: #1f2a3d;
    font-weight: 600;
  }

  .sub {
    margin-top: 6px;
    color: #7b8494;
    font-size: 12px;
  }
}

.count-link {
  padding: 0;
  font-weight: 600;
}

.detail-pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}

.tools-section {
  display: grid;
  grid-template-columns: 1fr 1.1fr 1fr;
  gap: 14px;
}

.tool-panel {
  padding: 18px;
}

.tool-title {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-height: 58px;

  .el-icon {
    width: 36px;
    height: 36px;
    color: #1d63d9;
    background: #eef5ff;
    border-radius: 8px;
  }

  h3 {
    margin: 0;
    color: #1f2a3d;
    font-size: 16px;
  }
}

.qr-box {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 220px;
  margin: 12px 0;
  background: #f8fbff;
  border: 1px dashed #cdd9ea;
  border-radius: 8px;

  img {
    width: 180px;
    height: 180px;
    object-fit: contain;
  }
}

.button-row {
  display: flex;
  gap: 10px;
}

.link-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.code-box {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: #f8fbff;
  border: 1px solid #d9e6f8;
  border-radius: 8px;

  span {
    color: #768196;
    font-size: 13px;
  }

  strong {
    color: #1d63d9;
    font-size: 18px;
    word-break: break-all;
  }
}

.remark-alert {
  margin-top: 14px;
}

@media (max-width: 1200px) {
  .profile-band,
  .metric-grid,
  .tools-section {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .page-head,
  .section-title {
    align-items: flex-start;
    flex-direction: column;
  }

  .profile-band,
  .metric-grid,
  .tools-section {
    grid-template-columns: 1fr;
  }

  .code-box {
    grid-template-columns: 1fr;
    align-items: flex-start;
  }
}
</style>
