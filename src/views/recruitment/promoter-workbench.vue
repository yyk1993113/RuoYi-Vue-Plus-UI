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
            <div v-for="item in todayMetrics" :key="item.label" class="metric-card">
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
            </div>
          </div>
        </section>

        <section class="metrics-section">
          <div class="section-title">
            <h3>累计数据</h3>
            <span>当前推广人员累计贡献统计</span>
          </div>
          <div class="metric-grid">
            <div v-for="item in totalMetrics" :key="item.label" class="metric-card">
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
            </div>
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
            <el-input v-model="bPromotionLink" readonly type="textarea" :rows="5" />
            <el-button type="primary" :icon="DocumentCopy" @click="copyText(bPromotionLink)">复制链接</el-button>
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
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { DocumentCopy, Download, Link as LinkIcon, Picture, Refresh } from '@element-plus/icons-vue';
import { getPromoterWorkbench, getPromoterWorkbenchQrCode, type PromoterWorkbenchVO } from '@/api/recruitment';
import { download } from '@/utils/request';

const loading = ref(false);
const workbench = ref<PromoterWorkbenchVO>({});
const cQrUrl = ref('');
const bQrUrl = ref('');

const bPromotionLink = computed(() => workbench.value.bPromotionLink || '');

const todayMetrics = computed(() => [
  { label: '新增企业', value: workbench.value.todayCompanyCount ?? 0 },
  { label: '新增求职者', value: workbench.value.todayJobSeekerCount ?? 0 },
  { label: '授权手机号', value: workbench.value.todayAuthorizedCount ?? 0 },
  { label: '填简历', value: workbench.value.todayResumeCount ?? 0 },
  { label: '投递', value: workbench.value.todayApplyCount ?? 0 }
]);

const totalMetrics = computed(() => [
  { label: '累计企业', value: workbench.value.totalCompanyCount ?? 0 },
  { label: '累计求职者', value: workbench.value.totalJobSeekerCount ?? 0 },
  { label: '授权手机号', value: workbench.value.totalAuthorizedCount ?? 0 },
  { label: '填简历', value: workbench.value.totalResumeCount ?? 0 },
  { label: '投递', value: workbench.value.totalApplyCount ?? 0 }
]);

async function loadWorkbench() {
  loading.value = true;
  try {
    workbench.value = unwrapData<PromoterWorkbenchVO>(await getPromoterWorkbench());
    await Promise.all([loadQr('C'), loadQr('B')]);
  } finally {
    loading.value = false;
  }
}

async function loadQr(target: 'C' | 'B') {
  const blob = unwrapData<Blob>(await getPromoterWorkbenchQrCode(target));
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
  return res?.data;
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
  padding: 16px;
  background: #f8fbff;
  border: 1px solid #e4edf8;
  border-radius: 8px;

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
}
</style>
