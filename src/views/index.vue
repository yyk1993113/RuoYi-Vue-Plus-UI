<template>
  <div class="dashboard-container">
    <!-- 顶部欢迎栏 -->
    <div class="welcome-bar">
      <div class="welcome-left">
        <h2>招聘平台运营概览</h2>
        <span class="welcome-sub">数据统计时间范围：近 {{ timeRangeText }} · 实时更新</span>
      </div>
      <div class="welcome-right">
        <el-radio-group v-model="timeRange" size="default" @change="handleTimeRangeChange">
          <el-radio-button value="7">近7天</el-radio-button>
          <el-radio-button value="14">近14天</el-radio-button>
          <el-radio-button value="30">近30天</el-radio-button>
        </el-radio-group>
        <el-button :icon="Refresh" circle @click="loadAllData" :loading="loading" />
      </div>
    </div>

    <!-- ========== 区块一：核心 KPI 卡片 ========== -->
    <el-row :gutter="16" class="mb-16">
      <!-- 企业 -->
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="kpi-card" @click="navigateTo('/recruitment/company')">
          <div class="kpi-top">
            <div class="kpi-icon-wrap primary">
              <el-icon><OfficeBuilding /></el-icon>
            </div>
            <div class="kpi-meta">
              <span class="kpi-label">入驻企业</span>
              <span class="kpi-value primary">{{ overview.totalCompanies || 0 }}</span>
            </div>
          </div>
          <el-divider class="kpi-divider" />
          <div class="kpi-badges">
            <span class="badge success"><el-icon><CircleCheck /></el-icon> 已认证 {{ overview.approvedCompanies || 0 }}</span>
            <span class="badge warning" v-if="overview.pendingCompanies > 0"><el-icon><Clock /></el-icon> 待审核 {{ overview.pendingCompanies }}</span>
            <span class="badge info"><el-icon><User /></el-icon> 活跃 {{ overview.activeCompanies || 0 }}</span>
            <span class="badge danger" v-if="overview.silencedCompanies > 0"><el-icon><CloseBold /></el-icon> 已禁言 {{ overview.silencedCompanies }}</span>
          </div>
          <div class="kpi-trend up" v-if="overview.newCompaniesDelta > 0">
            <el-icon><Top /></el-icon> 本周期新增 {{ overview.newCompaniesDelta }} 家
          </div>
        </el-card>
      </el-col>

      <!-- 职位 -->
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="kpi-card" @click="navigateTo('/recruitment/job')">
          <div class="kpi-top">
            <div class="kpi-icon-wrap success">
              <el-icon><Briefcase /></el-icon>
            </div>
            <div class="kpi-meta">
              <span class="kpi-label">在线职位</span>
              <span class="kpi-value success">{{ overview.totalJobs || 0 }}</span>
            </div>
          </div>
          <el-divider class="kpi-divider" />
          <div class="kpi-badges">
            <span class="badge success"><el-icon><CircleCheck /></el-icon> 已上线 {{ overview.onlineJobs || 0 }}</span>
            <span class="badge warning" v-if="overview.pendingJobs > 0"><el-icon><Clock /></el-icon> 待审核 {{ overview.pendingJobs }}</span>
            <span class="badge info"><el-icon><Collection /></el-icon> 职位类型 {{ jobTypeDist.length }} 种</span>
          </div>
          <div class="kpi-trend up" v-if="overview.newJobsDelta > 0">
            <el-icon><Top /></el-icon> 本周期新增 {{ overview.newJobsDelta }} 个职位
          </div>
        </el-card>
      </el-col>

      <!-- 投递 -->
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="kpi-card" @click="navigateTo('/recruitment/apply')">
          <div class="kpi-top">
            <div class="kpi-icon-wrap warning">
              <el-icon><DocumentCopy /></el-icon>
            </div>
            <div class="kpi-meta">
              <span class="kpi-label">简历投递</span>
              <span class="kpi-value warning">{{ overview.totalApplies || 0 }}</span>
            </div>
          </div>
          <el-divider class="kpi-divider" />
          <div class="kpi-badges">
            <span class="badge info"><el-icon><Clock /></el-icon> 待处理 {{ overview.pendingApplies || 0 }}</span>
            <span class="badge primary"><el-icon><CircleCheck /></el-icon> 已处理 {{ overview.processedApplies || 0 }}</span>
            <span class="badge success"><el-icon><Calendar /></el-icon> 今日投递 {{ overview.todayApplies || 0 }}</span>
          </div>
          <div class="kpi-trend up" v-if="overview.newAppliesDelta > 0">
            <el-icon><Top /></el-icon> 本周期新增 {{ overview.newAppliesDelta }} 条投递
          </div>
        </el-card>
      </el-col>

      <!-- 任务 -->
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="kpi-card" @click="navigateTo('/recruitment/task')">
          <div class="kpi-top">
            <div class="kpi-icon-wrap danger">
              <el-icon><Tickets /></el-icon>
            </div>
            <div class="kpi-meta">
              <span class="kpi-label">任务完成</span>
              <span class="kpi-value danger">{{ overview.totalTasks || 0 }}</span>
            </div>
          </div>
          <el-divider class="kpi-divider" />
          <div class="kpi-badges">
            <span class="badge warning"><el-icon><Clock /></el-icon> 进行中 {{ overview.inProgressTasks || 0 }}</span>
            <span class="badge danger" v-if="exceptionApplies.length > 0"><el-icon><Warning /></el-icon> 异常 {{ exceptionApplies.length }}</span>
            <span class="badge success"><el-icon><Connection /></el-icon> 联系方式交换 {{ exchangeStat.exchangedCount || 0 }} 次</span>
          </div>
          <div class="kpi-trend neutral">
            <el-icon><InfoFilled /></el-icon> 交换成功率 {{ ((exchangeStat.exchangeRate || 0) * 100).toFixed(1) }}%
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- ========== 区块二：趋势图表 ========== -->
    <el-row :gutter="16" class="mb-16">
      <!-- 投递趋势主图 -->
      <el-col :xs="24" :lg="16">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span>数据趋势</span>
              <el-radio-group v-model="trendType" size="small" @change="handleTrendTypeChange">
                <el-radio-button value="apply">投递量</el-radio-button>
                <el-radio-button value="company">入驻企业</el-radio-button>
                <el-radio-button value="user">求职者</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div ref="trendChartRef" style="height: 300px"></div>
        </el-card>
      </el-col>

      <!-- 投递状态分布 -->
      <el-col :xs="24" :lg="8">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span>投递状态分布</span>
            </div>
          </template>
          <div ref="applyStatusChartRef" style="height: 300px"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- ========== 区块三：类型分布 + 热门职位 ========== -->
    <el-row :gutter="16" class="mb-16">
      <!-- 职位类型分布 -->
      <el-col :xs="24" :lg="10">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span>职位类型分布</span>
            </div>
          </template>
          <div ref="jobTypeChartRef" style="height: 280px"></div>
        </el-card>
      </el-col>

      <!-- 热门职位 TOP10 -->
      <el-col :xs="24" :lg="14">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span>热门职位 TOP10</span>
              <el-radio-group v-model="hotJobType" size="small" @change="loadHotJobs">
                <el-radio-button value="apply">按投递量</el-radio-button>
                <el-radio-button value="browse">按浏览量</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div ref="hotJobChartRef" style="height: 280px"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- ========== 区块四：快捷数据列表 ========== -->
    <el-row :gutter="16">
      <!-- 最新发布职位 -->
      <el-col :xs="24" :lg="8">
        <el-card shadow="hover" class="list-card">
          <template #header>
            <div class="card-header">
              <span>最新发布职位</span>
              <el-button type="primary" link @click="navigateTo('/recruitment/job')">查看更多 →</el-button>
            </div>
          </template>
          <div class="mini-list">
            <div
              v-for="job in recentJobs"
              :key="job.jobId"
              class="mini-item"
              @click="navigateTo('/recruitment/job')"
            >
              <div class="mini-info">
                <span class="mini-title">{{ job.jobName }}</span>
                <span class="mini-sub">{{ job.companyName }} · {{ job.location || '未知' }}</span>
              </div>
              <div class="mini-right">
                <span class="mini-count"><el-icon><User /></el-icon> {{ job.applyCount || 0 }}</span>
                <span class="mini-time">{{ formatDate(job.createTime) }}</span>
              </div>
            </div>
            <el-empty v-if="recentJobs.length === 0" description="暂无数据" :image-size="60" />
          </div>
        </el-card>
      </el-col>

      <!-- 最新投递 -->
      <el-col :xs="24" :lg="8">
        <el-card shadow="hover" class="list-card">
          <template #header>
            <div class="card-header">
              <span>最新投递记录</span>
              <el-button type="primary" link @click="navigateTo('/recruitment/apply')">查看更多 →</el-button>
            </div>
          </template>
          <div class="mini-list">
            <div
              v-for="apply in recentApplies"
              :key="apply.applyId"
              class="mini-item"
              @click="navigateTo('/recruitment/apply')"
            >
              <div class="mini-info">
                <span class="mini-title">{{ apply.userName }}</span>
                <span class="mini-sub">{{ apply.jobName }} · {{ apply.companyName }}</span>
              </div>
              <div class="mini-right">
                <el-tag :type="getApplyStatusTagType(apply.status)" size="small" effect="dark">
                  {{ apply.statusName }}
                </el-tag>
                <span class="mini-time">{{ formatDate(apply.applyTime) }}</span>
              </div>
            </div>
            <el-empty v-if="recentApplies.length === 0" description="暂无数据" :image-size="60" />
          </div>
        </el-card>
      </el-col>

      <!-- 异常投递告警 -->
      <el-col :xs="24" :lg="8">
        <el-card shadow="hover" class="list-card exception-card">
          <template #header>
            <div class="card-header">
              <span>异常投递告警</span>
              <el-badge :value="exceptionApplies.length" type="danger" :hidden="exceptionApplies.length === 0">
                <el-button type="danger" link @click="navigateTo('/recruitment/apply')">查看全部 →</el-button>
              </el-badge>
            </div>
          </template>
          <div class="mini-list">
            <div
              v-for="item in exceptionApplies"
              :key="item.applyId"
              class="mini-item exception-item"
              @click="navigateTo('/recruitment/apply')"
            >
              <div class="mini-info">
                <span class="mini-title">{{ item.jobName }}</span>
                <span class="mini-sub">{{ item.userName }} · {{ item.companyName }}</span>
              </div>
              <div class="mini-right">
                <el-tag type="danger" size="small">{{ item.exceptionTypeName }}</el-tag>
                <span class="mini-time">{{ formatDate(item.applyTime) }}</span>
              </div>
            </div>
            <el-empty v-if="exceptionApplies.length === 0" description="暂无异常数据，一切正常 ✓" :image-size="60" />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import * as echarts from 'echarts';
import {
  Refresh,
  OfficeBuilding,
  Briefcase,
  DocumentCopy,
  Tickets,
  CircleCheck,
  Clock,
  User,
  CloseBold,
  Top,
  Collection,
  Calendar,
  Warning,
  Connection,
  InfoFilled,
} from '@element-plus/icons-vue';
import {
  getOverview,
  getApplyTrend,
  getJobTypeDistribution,
  getHotJobs,
  getExchangeStatistics,
  getExceptionApplies,
  getRecentJobs,
  getRecentApplies,
  getCompanyTrend,
  getUserTrend,
  getApplyStatusDistribution,
} from '@/api/recruitment';
import type {
  RecruitmentOverview,
  ApplyTrend,
  JobTypeDistribution,
  HotJobVO,
  ExceptionApplyVO,
} from '@/api/recruitment';
import { formatDate as formatDateUtil } from '@/utils';

const router = useRouter();
const route = useRoute();

function navigateTo(path: string) {
  if (route.path === path) return;
  router.push(path);
}

// ---------- refs ----------
const trendChartRef = ref<HTMLElement | null>(null);
const jobTypeChartRef = ref<HTMLElement | null>(null);
const applyStatusChartRef = ref<HTMLElement | null>(null);
const hotJobChartRef = ref<HTMLElement | null>(null);

let trendChart: echarts.ECharts | null = null;
let jobTypeChart: echarts.ECharts | null = null;
let applyStatusChart: echarts.ECharts | null = null;
let hotJobChart: echarts.ECharts | null = null;

// ---------- state ----------
const loading = ref(false);
const timeRange = ref('7');
const trendType = ref('apply');
const hotJobType = ref('apply');

const timeRangeText = computed(() => {
  const map: Record<string, string> = { '7': '7天', '14': '14天', '30': '30天' };
  return map[timeRange.value] || '7天';
});

// ---------- 数据 ----------
const overview = reactive<RecruitmentOverview>({} as RecruitmentOverview);
const applyTrendData = ref<ApplyTrend[]>([]);
const companyTrendData = ref<ApplyTrend[]>([]);
const userTrendData = ref<ApplyTrend[]>([]);
const jobTypeDist = ref<JobTypeDistribution[]>([]);
const applyStatusDist = ref<{ name: string; value: number }[]>([]);
const hotJobs = ref<HotJobVO[]>([]);
const recentJobs = ref<any[]>([]);
const recentApplies = ref<any[]>([]);
const exceptionApplies = ref<ExceptionApplyVO[]>([]);
const exchangeStat = reactive({ totalCount: 0, exchangedCount: 0, failedCount: 0, exchangeRate: 0 });

let refreshTimer: ReturnType<typeof setInterval> | null = null;

// ---------- 工具函数 ----------
function formatDate(val: string) {
  if (!val) return '-';
  return formatDateUtil(val);
}

function getApplyStatusTagType(status: string) {
  const map: Record<string, string> = {
    '0': 'info',
    '1': 'warning',
    '2': 'success',
    '3': 'danger',
  };
  return map[status] || 'info';
}

// ---------- 图表初始化 ----------
function initTrendChart(data: ApplyTrend[], label: string, color: string) {
  if (!trendChartRef.value) return;
  if (!trendChart) trendChart = echarts.init(trendChartRef.value);
  trendChart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'line' } },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: data.map(d => d.date),
      axisLabel: { fontSize: 11, color: '#606266' },
      axisLine: { lineStyle: { color: '#E4E7ED' } },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLabel: { fontSize: 11, color: '#606266' },
      splitLine: { lineStyle: { color: '#F0F2F5' } },
    },
    series: [{
      name: label,
      type: 'line',
      data: data.map(d => d.count),
      smooth: true,
      lineStyle: { color, width: 2.5 },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: color + '55' },
          { offset: 1, color: color + '05' },
        ]),
      },
      itemStyle: { color, borderRadius: [4, 4, 0, 0] },
    }],
  }, true);
}

function initJobTypeChart() {
  if (!jobTypeChartRef.value) return;
  if (!jobTypeChart) jobTypeChart = echarts.init(jobTypeChartRef.value);
  const colors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#9B59B6', '#1ABC9C', '#E74C3C'];
  jobTypeChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', right: '2%', top: 'center', textStyle: { fontSize: 11 }, itemWidth: 10, itemHeight: 10 },
    color: colors,
    series: [{
      name: '职位类型',
      type: 'pie',
      radius: ['38%', '65%'],
      center: ['38%', '50%'],
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 13, fontWeight: 'bold' } },
      labelLine: { show: false },
      data: jobTypeDist.value.map((d, i) => ({ name: d.typeName, value: d.count, itemStyle: { color: colors[i % colors.length] } })),
    }],
  }, true);
}

function initApplyStatusChart() {
  if (!applyStatusChartRef.value) return;
  if (!applyStatusChart) applyStatusChart = echarts.init(applyStatusChartRef.value);
  const statusColors: Record<string, string> = {
    '已投递': '#409EFF',
    '面试邀请': '#E6A23C',
    '已录用': '#67C23A',
    '已拒绝': '#F56C6C',
  };
  const total = applyStatusDist.value.reduce((sum, d) => sum + d.value, 0);
  applyStatusChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', right: '2%', top: 'center', textStyle: { fontSize: 11 }, itemWidth: 10, itemHeight: 10 },
    series: [{
      name: '投递状态',
      type: 'pie',
      radius: ['42%', '68%'],
      center: ['38%', '50%'],
      itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 13, fontWeight: 'bold' } },
      labelLine: { show: false },
      data: applyStatusDist.value.map(d => ({
        name: d.name,
        value: d.value,
        itemStyle: { color: statusColors[d.name] || '#909399' },
      })),
    }],
  }, true);
}

function initHotJobChart() {
  if (!hotJobChartRef.value) return;
  if (!hotJobChart) hotJobChart = echarts.init(hotJobChartRef.value);
  const sorted = [...hotJobs.value]
    .sort((a, b) => (b.applyCount || 0) - (a.applyCount || 0))
    .slice(0, 10);
  const colors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#9B59B6', '#1ABC9C', '#E74C3C', '#34495E', '#2C3E50'];
  hotJobChart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '1%', right: '4%', bottom: '3%', top: '3%', containLabel: true },
    xAxis: { type: 'value', axisLabel: { fontSize: 10, color: '#606266' }, splitLine: { lineStyle: { color: '#F0F2F5' } } },
    yAxis: {
      type: 'category',
      data: sorted.map(d => d.jobName).reverse(),
      axisLabel: { fontSize: 10, color: '#606266', width: 90, overflow: 'truncate' },
      axisLine: { lineStyle: { color: '#E4E7ED' } },
    },
    series: [{
      name: hotJobType.value === 'apply' ? '投递量' : '浏览量',
      type: 'bar',
      data: sorted.map(d => (hotJobType.value === 'apply' ? d.applyCount : d.browseCount) || 0).reverse(),
      itemStyle: { color: (params: any) => colors[params.dataIndex % colors.length], borderRadius: [0, 4, 4, 0] },
      barWidth: '55%',
      label: { show: true, position: 'right', fontSize: 10, color: '#606266' },
    }],
  }, true);
}

function handleResize() {
  trendChart?.resize();
  jobTypeChart?.resize();
  applyStatusChart?.resize();
  hotJobChart?.resize();
}

// ---------- 数据加载 ----------
async function loadAllData() {
  loading.value = true;
  try {
    const days = Number(timeRange.value);
    const [
      overviewRes,
      applyTrendRes,
      jobTypeRes,
      hotJobsRes,
      exchangeRes,
      exceptionRes,
      recentJobsRes,
      recentAppliesRes,
      companyTrendRes,
      userTrendRes,
      applyStatusRes,
    ] = await Promise.all([
      getOverview(),
      getApplyTrend(days),
      getJobTypeDistribution(),
      getHotJobs({ limit: 10, type: hotJobType.value }),
      getExchangeStatistics(),
      getExceptionApplies({ pageNum: 1, pageSize: 10 }),
      getRecentJobs({ pageNum: 1, pageSize: 6 }),
      getRecentApplies({ pageNum: 1, pageSize: 6 }),
      getCompanyTrend({ days }),
      getUserTrend({ days }),
      getApplyStatusDistribution(),
    ]);

    Object.assign(overview, overviewRes.data || {});
    applyTrendData.value = applyTrendRes.data || [];
    companyTrendData.value = companyTrendRes.data || [];
    userTrendData.value = userTrendRes.data || [];
    jobTypeDist.value = jobTypeRes.data || [];
    hotJobs.value = hotJobsRes.data || [];
    Object.assign(exchangeStat, exchangeRes.data || {});
    exceptionApplies.value = exceptionRes.data?.rows || exceptionRes.data || [];
    recentJobs.value = recentJobsRes.data?.rows || recentJobsRes.data || [];
    recentApplies.value = recentAppliesRes.data?.rows || recentAppliesRes.data || [];
    applyStatusDist.value = applyStatusRes.data || [];

    renderAllCharts();
  } catch (error) {
    console.error('加载数据失败:', error);
  } finally {
    loading.value = false;
  }
}

function renderAllCharts() {
  const trendMap: Record<string, { data: ApplyTrend[]; label: string; color: string }> = {
    apply: { data: applyTrendData.value, label: '投递量', color: '#409EFF' },
    company: { data: companyTrendData.value, label: '入驻企业', color: '#67C23A' },
    user: { data: userTrendData.value, label: '新增求职者', color: '#E6A23C' },
  };
  const t = trendMap[trendType.value];
  if (t.data.length > 0) initTrendChart(t.data, t.label, t.color);
  if (jobTypeDist.value.length > 0) initJobTypeChart();
  if (applyStatusDist.value.length > 0) initApplyStatusChart();
  if (hotJobs.value.length > 0) initHotJobChart();
}

// ---------- 事件处理 ----------
function handleTimeRangeChange() {
  loadAllData();
}

function handleTrendTypeChange() {
  const trendMap: Record<string, { data: ApplyTrend[]; label: string; color: string }> = {
    apply: { data: applyTrendData.value, label: '投递量', color: '#409EFF' },
    company: { data: companyTrendData.value, label: '入驻企业', color: '#67C23A' },
    user: { data: userTrendData.value, label: '新增求职者', color: '#E6A23C' },
  };
  const t = trendMap[trendType.value];
  if (t.data.length > 0) initTrendChart(t.data, t.label, t.color);
}

function loadHotJobs() {
  getHotJobs({ limit: 10, type: hotJobType.value }).then(res => {
    hotJobs.value = res.data || [];
    initHotJobChart();
  });
}

// ---------- 生命周期 ----------
onMounted(() => {
  loadAllData();
  window.addEventListener('resize', handleResize);
  refreshTimer = setInterval(() => {
    loadAllData();
  }, 5 * 60 * 1000);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  if (refreshTimer) clearInterval(refreshTimer);
  trendChart?.dispose();
  jobTypeChart?.dispose();
  applyStatusChart?.dispose();
  hotJobChart?.dispose();
});
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
  background: #F5F7FA;
  min-height: calc(100vh - 84px);
}

/* ---------- 欢迎栏 ---------- */
.welcome-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 0 4px;
}

.welcome-left h2 {
  margin: 0 0 4px;
  font-size: 20px;
  font-weight: 700;
  color: #303133;
}

.welcome-sub {
  font-size: 12px;
  color: #909399;
}

.welcome-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* ---------- 通用间距 ---------- */
.mb-16 { margin-bottom: 16px; }

/* ---------- KPI 卡片 ---------- */
.kpi-card {
  cursor: pointer;
  transition: all 0.3s;
  border: none;
  border-radius: 12px;
}
.kpi-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1) !important;
}

.kpi-top {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 12px;
}

.kpi-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}
.kpi-icon-wrap.primary { background: #ECF5FF; color: #409EFF; }
.kpi-icon-wrap.success { background: #F0F9EB; color: #67C23A; }
.kpi-icon-wrap.warning { background: #FDF6EC; color: #E6A23C; }
.kpi-icon-wrap.danger  { background: #FEF0F0; color: #F56C6C; }

.kpi-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.kpi-label {
  font-size: 13px;
  color: #909399;
  font-weight: 500;
}

.kpi-value {
  font-size: 30px;
  font-weight: 800;
  line-height: 1.1;
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
}
.kpi-value.primary { color: #409EFF; }
.kpi-value.success { color: #67C23A; }
.kpi-value.warning { color: #E6A23C; }
.kpi-value.danger  { color: #F56C6C; }

.kpi-divider {
  margin: 0 0 10px;
  border-color: #F0F2F5;
}

.kpi-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
}
.badge .el-icon { font-size: 11px; }
.badge.primary { background: #ECF5FF; color: #409EFF; }
.badge.success { background: #F0F9EB; color: #67C23A; }
.badge.warning { background: #FDF6EC; color: #E6A23C; }
.badge.danger  { background: #FEF0F0; color: #F56C6C; }
.badge.info    { background: #F4F4F5; color: #909399; }

.kpi-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  padding-top: 6px;
  border-top: 1px dashed #F0F2F5;
}
.kpi-trend .el-icon { font-size: 12px; }
.kpi-trend.up      { color: #67C23A; }
.kpi-trend.down    { color: #F56C6C; }
.kpi-trend.neutral { color: #909399; }

/* ---------- 图表卡片 ---------- */
.chart-card {
  border: none;
  border-radius: 12px;
  height: 100%;
}

/* ---------- 列表卡片 ---------- */
.list-card {
  border: none;
  border-radius: 12px;
  height: 100%;
}

.exception-card :deep(.el-card__header) {
  background: #FEF0F0;
  border-radius: 12px 12px 0 0;
}

.mini-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.mini-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 4px;
  border-bottom: 1px solid #F5F7FA;
  cursor: pointer;
  transition: background 0.2s;
  border-radius: 6px;
  margin-bottom: 2px;
}
.mini-item:hover {
  background: #F5F7FA;
  padding-left: 8px;
}
.mini-item:last-child {
  border-bottom: none;
}

.mini-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.mini-title {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 160px;
}

.mini-sub {
  font-size: 11px;
  color: #909399;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 160px;
}

.mini-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 3px;
  flex-shrink: 0;
  margin-left: 8px;
}

.mini-count {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 11px;
  color: #409EFF;
  font-weight: 600;
}
.mini-count .el-icon { font-size: 11px; }

.mini-time {
  font-size: 10px;
  color: #C0C4CC;
}

.exception-item .mini-title {
  color: #C00000;
}

/* ---------- 卡片头部 ---------- */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 14px;
  color: #303133;
}

/* ---------- 响应式 ---------- */
@media (max-width: 768px) {
  .welcome-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  .kpi-value { font-size: 24px; }
  .kpi-badges { flex-direction: column; gap: 4px; }
}
</style>
