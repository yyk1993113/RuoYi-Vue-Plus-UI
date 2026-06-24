<template>
  <!-- 页面职责：给推广人员登录后台后查看本人推广二维码、B端链接和本人推广数据。 -->
  <div class="promoter-workbench app-container">
    <div class="page-head">
      <div>
        <div class="title-row">
          <h2>推广工作台</h2>
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
            <div class="qr-box">
              <img v-if="cQrUrl" :src="cQrUrl" alt="C端推广二维码" />
              <el-empty v-else description="二维码待生成" :image-size="80" />
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
            <div class="qr-box">
              <img v-if="bQrUrl" :src="bQrUrl" alt="B端推广二维码" />
              <el-empty v-else description="二维码待生成" :image-size="80" />
            </div>
            <el-button type="primary" :icon="Download" @click="downloadQr('B')">下载二维码</el-button>
          </div>
        </section>

        <el-alert v-if="workbench.remark" class="remark-alert" type="info" :closable="false" show-icon :title="workbench.remark" />
      </template>
    </el-skeleton>

    <el-dialog v-model="detailVisible" :title="detailTitle" width="980px" append-to-body>
      <el-table v-loading="detailLoading" :data="detailRows" border height="460">
        <el-table-column prop="objectTypeName" label="类型" width="110" />
        <el-table-column prop="objectName" label="名称" min-width="170" show-overflow-tooltip />
        <el-table-column prop="phone" label="手机号" width="140" />
        <el-table-column prop="contactPerson" label="联系人" width="120" show-overflow-tooltip />
        <el-table-column prop="statusName" label="状态" width="140" />
        <el-table-column prop="jobCount" label="岗位数" width="90" align="center" />
        <el-table-column prop="authorizedTime" label="授权时间" width="170" />
        <el-table-column prop="resumeCompletedTime" label="简历时间" width="170" />
        <el-table-column prop="firstApplyTime" label="投递时间" width="170" />
        <el-table-column prop="promotedAt" label="进入时间" width="170" />
        <el-table-column prop="createTime" label="创建时间" width="170" />
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
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { DocumentCopy, Download, Link as LinkIcon, Picture, Refresh } from '@element-plus/icons-vue';
import {
  getPromoterWorkbench,
  getPromoterWorkbenchQrCode,
  listPromoterWorkbenchDetail,
  type PromotionAttributionDetailVO,
  type PromoterWorkbenchVO
} from '@/api/recruitment';
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

const loading = ref(false);
const workbench = ref<PromoterWorkbenchVO>({});
const cQrUrl = ref('');
const bQrUrl = ref('');
const detailVisible = ref(false);
const detailLoading = ref(false);
const detailRows = ref<PromotionAttributionDetailVO[]>([]);
const detailTotal = ref(0);
const detailTitle = ref('');
const detailQuery = ref({
  pageNum: 1,
  pageSize: 10,
  metric: 'company' as WorkbenchMetric,
  period: 'today' as WorkbenchPeriod
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

async function loadWorkbench() {
  loading.value = true;
  try {
    workbench.value = unwrapData<PromoterWorkbenchVO>(await getPromoterWorkbench());
    const qrResults = await Promise.allSettled([loadQr('C'), loadQr('B')]);
    const failedResult = qrResults.find((result) => result.status === 'rejected');
    if (failedResult && failedResult.status === 'rejected') {
      throw failedResult.reason;
    }
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
  detailQuery.value = {
    ...detailQuery.value,
    pageNum: 1,
    metric: item.metric,
    period: item.period
  };
  detailVisible.value = true;
  await loadDetail();
}

async function loadDetail() {
  detailLoading.value = true;
  try {
    const res = unwrapData<any>(await listPromoterWorkbenchDetail(detailQuery.value));
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

async function loadQr(target: 'C' | 'B') {
  const blob = unwrapData<Blob>(await getPromoterWorkbenchQrCode(target));
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
  return res?.data ?? res;
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
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;

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
