<template>
  <div class="dashboard-container">
    <!-- 顶部工具栏：时间筛选 + 刷新 + 导出 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-radio-group v-model="timeRange" size="default" @change="handleTimeRangeChange">
          <el-radio-button value="7">近7天</el-radio-button>
          <el-radio-button value="14">近14天</el-radio-button>
          <el-radio-button value="30">近30天</el-radio-button>
        </el-radio-group>
      </div>
      <div class="toolbar-right">
        <el-button :icon="Refresh" circle @click="loadAllData" :loading="loading" />
        <el-button :icon="Download" @click="handleExport">导出 Excel</el-button>
      </div>
    </div>

    <!-- ========== 区块一：KPI 概览卡片 ========== -->
    <el-row :gutter="16" class="mb-4">
      <!-- 企业维度 -->
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="kpi-card" @click="navigateTo('/recruitment/company')">
          <div class="kpi-header">
            <span class="kpi-label">企业总数</span>
            <el-tag type="warning" size="small" effect="plain" v-if="overview.pendingCompanies > 0">
              {{ overview.pendingCompanies }} 待审核
            </el-tag>
          </div>
          <div class="kpi-value primary">{{ overview.totalCompanies || 0 }}</div>
          <div class="kpi-footer">
            <span class="kpi-sub"><el-icon><CircleCheckFilled /></el-icon> 已认证 {{ overview.approvedCompanies || 0 }}</span>
            <span class="kpi-sub"><el-icon><UserFilled /></el-icon> 活跃 {{ overview.activeCompanies || 0 }}</span>
          </div>
          <div class="kpi-trend up">
            <el-icon><TrendCharts /></el-icon>
            较上周期 +{{ overview.newCompaniesDelta || 0 }}
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="kpi-card" @click="navigateTo('/recruitment/job')">
          <div class="kpi-header">
            <span class="kpi-label">职位总数</span>
            <el-tag type="warning" size="small" effect="plain" v-if="overview.pendingJobs > 0">
              {{ overview.pendingJobs }} 待审核
            </el-tag>
          </div>
          <div class="kpi-value success">{{ overview.totalJobs || 0 }}</div>
          <div class="kpi-footer">
            <span class="kpi-sub"><el-icon><CircleCheckFilled /></el-icon> 已上线 {{ overview.onlineJobs || 0 }}</span>
            <span class="kpi-sub"><el-icon><Top /></el-icon> 新增 {{ overview.newJobsDelta || 0 }}</span>
          </div>
          <div class="kpi-trend neutral">
            <el-icon><DataLine /></el-icon>
            职位类型 {{ jobTypeDist.length }} 种
          </div>
        </el-card>
      </el-col>

      <!-- 求职者维度 -->
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="kpi-card" @click="navigateTo('/recruitment/apply')">
          <div class="kpi-header">
            <span class="kpi-label">投递总数</span>
          </div>
          <div class="kpi-value warning">{{ overview.totalApplies || 0 }}</div>
          <div class="kpi-footer">
            <span class="kpi-sub"><el-icon><Clock /></el-icon> 待处理 {{ overview.pendingApplies || 0 }}</span>
            <span class="kpi-sub"><el-icon><CircleCheckFilled /></el-icon> 已处理 {{ overview.processedApplies || 0 }}</span>
          </div>
          <div class="kpi-trend up">
            <el-icon><TrendCharts /></el-icon>
            今日 +{{ overview.todayApplies || 0 }}
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="kpi-card" @click="navigateTo('/recruitment/task')">
          <div class="kpi-header">
            <span class="kpi-label">任务总数</span>
          </div>
          <div class="kpi-value danger">{{ overview.totalTasks || 0 }}</div>
          <div class="kpi-footer">
            <span class="kpi-sub"><el-icon><Clock /></el-icon> 进行中 {{ overview.inProgressTasks || 0 }}</span>
            <span class="kpi-sub"><el-icon><Warning /></el-icon> 异常 {{ exceptionCount || 0 }}</span>
          </div>
          <div class="kpi-trend neutral">
            <el-icon><InfoFilled /></el-icon>
            {{ exchangeStat.exchangedCount || 0 }} 次联系方式交换
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 禁言统计小卡片 -->
    <el-row :gutter="16" class="mb-4">
      <el-col :xs="12" :sm="6">
        <el-card shadow="hover" class="kpi-card" @click="navigateTo('/recruitment/company?isSilenced=1')">
          <div class="kpi-header">
            <span class="kpi-label">被禁言企业</span>
            <el-tag type="danger" size="small" v-if="overview.silencedCompanies > 0">
              {{ overview.silencedCompanies }}
            </el-tag>
          </div>
          <div class="kpi-value danger">{{ overview.silencedCompanies || 0 }}</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="hover" class="kpi-card" @click="navigateTo('/recruitment/user')">
          <div class="kpi-header">
            <span class="kpi-label">被禁言求职者</span>
            <el-tag type="danger" size="small" v-if="overview.silencedUsers > 0">
              {{ overview.silencedUsers }}
            </el-tag>
          </div>
          <div class="kpi-value danger">{{ overview.silencedUsers || 0 }}</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- ========== 区块二：图表区 ========== -->
    <el-row :gutter="16" class="mb-4">
      <!-- 投递趋势折线图 -->
      <el-col :xs="24" :lg="14">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>投递趋势</span>
              <el-radio-group v-model="trendType" size="small" @change="handleTrendTypeChange">
                <el-radio-button value="apply">投递量</el-radio-button>
                <el-radio-button value="company">企业</el-radio-button>
                <el-radio-button value="user">求职者</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div ref="trendChartRef" style="height: 300px"></div>
        </el-card>
      </el-col>

      <!-- 投递状态分布环形图 -->
      <el-col :xs="24" :lg="10">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>投递状态分布</span>
            </div>
          </template>
          <div ref="applyStatusChartRef" style="height: 300px"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="mb-4">
      <!-- 职位类型分布饼图 -->
      <el-col :xs="24" :lg="10">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>职位类型分布</span>
            </div>
          </template>
          <div ref="jobTypeChartRef" style="height: 300px"></div>
        </el-card>
      </el-col>

      <!-- 热门职位 TOP10 柱状图 -->
      <el-col :xs="24" :lg="14">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>热门职位 TOP10</span>
              <el-radio-group v-model="hotJobType" size="small" @change="loadHotJobs">
                <el-radio-button value="apply">按投递量</el-radio-button>
                <el-radio-button value="browse">按浏览量</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div ref="hotJobChartRef" style="height: 300px"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- ========== 区块三：列表区 ========== -->
    <el-row :gutter="16">
      <!-- 最近发布职位 -->
      <el-col :xs="24" :lg="8">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>最近发布职位</span>
              <el-button type="primary" link @click="navigateTo('/recruitment/job')">查看更多</el-button>
            </div>
          </template>
          <el-table :data="recentJobs" stripe size="small" :show-header="true">
            <el-table-column prop="jobName" label="职位名称" min-width="120" show-overflow-tooltip />
            <el-table-column prop="companyName" label="企业" min-width="100" show-overflow-tooltip />
            <el-table-column prop="applyCount" label="投递" width="60" align="center" />
            <el-table-column prop="createTime" label="发布时间" width="100">
              <template #default="{ row }">
                {{ formatDate(row.createTime) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <!-- 最新投递记录 -->
      <el-col :xs="24" :lg="8">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>最新投递</span>
              <el-button type="primary" link @click="navigateTo('/recruitment/apply')">查看更多</el-button>
            </div>
          </template>
          <el-table :data="recentApplies" stripe size="small">
            <el-table-column prop="userName" label="求职者" width="80" show-overflow-tooltip />
            <el-table-column prop="jobName" label="职位" min-width="100" show-overflow-tooltip />
            <el-table-column prop="statusName" label="状态" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="getApplyStatusTagType(row.status)" size="small">
                  {{ row.statusName }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="时间" width="90">
              <template #default="{ row }">
                {{ formatDate(row.createTime) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <!-- 异常数据列表 -->
      <el-col :xs="24" :lg="8">
        <el-card shadow="hover" class="exception-card">
          <template #header>
            <div class="card-header">
              <span>异常投递</span>
              <el-badge :value="exceptionApplies.length" type="danger" :hidden="exceptionApplies.length === 0">
                <el-button type="primary" link @click="navigateTo('/recruitment/apply?exception=1')">查看更多</el-button>
              </el-badge>
            </div>
          </template>
          <el-table
            v-if="exceptionApplies.length > 0"
            :data="exceptionApplies"
            stripe
            size="small"
            :row-class-name="tableRowClassName"
          >
            <el-table-column prop="jobName" label="职位" min-width="100" show-overflow-tooltip />
            <el-table-column prop="exceptionTypeName" label="异常类型" width="80" align="center">
              <template #default="{ row }">
                <el-tag type="danger" size="small">{{ row.exceptionTypeName }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="userName" label="求职者" width="80" show-overflow-tooltip />
            <el-table-column prop="createTime" label="时间" width="90">
              <template #default="{ row }">
                {{ formatDate(row.createTime) }}
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="暂无异常数据" :image-size="60" />
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
  Download,
  CircleCheckFilled,
  UserFilled,
  TrendCharts,
  DataLine,
  Clock,
  Warning,
  Top,
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
  getUserSilenceStatistics,
} from '@/api/recruitment';
import type { RecruitmentOverview, ApplyTrend, JobTypeDistribution, HotJobVO, ExceptionApplyVO } from '@/api/recruitment';
import { ElMessage } from 'element-plus';
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

// 数据
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

const exceptionCount = computed(() => exceptionApplies.value.length);

let refreshTimer: ReturnType<typeof setInterval> | null = null;

// ---------- 工具函数 ----------
function formatDate(val: string) {
  if (!val) return '-';
  return formatDateUtil(val);
}

function getApplyStatusTagType(status: string) {
  const map: Record<string, string> = {
    '0': 'info',    // 已投递
    '1': 'primary', // 面试邀请
    '2': 'success', // 已录用
    '3': 'danger',  // 已拒绝
  };
  return map[status] || 'info';
}

function tableRowClassName({ row }: { row: ExceptionApplyVO }) {
  return 'exception-row';
}

// ---------- 图表初始化 ----------
function initTrendChart(data: ApplyTrend[], label: string, color: string) {
  if (!trendChartRef.value) return;
  if (!trendChart) trendChart = echarts.init(trendChartRef.value);
  trendChart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'line' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: data.map(d => d.date),
      axisLabel: { fontSize: 11 },
    },
    yAxis: { type: 'value', minInterval: 1, axisLabel: { fontSize: 11 } },
    series: [{
      name: label,
      type: 'line',
      data: data.map(d => d.count),
      smooth: true,
      lineStyle: { color, width: 2 },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: color + '99' },
          { offset: 1, color: color + '11' },
        ]),
      },
      itemStyle: { color, borderRadius: [4, 4, 0, 0] },
      barWidth: '40%',
    }],
  }, true);
}

function initJobTypeChart() {
  if (!jobTypeChartRef.value) return;
  if (!jobTypeChart) jobTypeChart = echarts.init(jobTypeChartRef.value);
  const colors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#9B59B6', '#1ABC9C', '#E74C3C'];
  jobTypeChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', right: '5%', top: 'center', textStyle: { fontSize: 11 } },
    color: colors,
    series: [{
      name: '职位类型',
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['35%', '50%'],
      itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
      label: { show: false, position: 'center' },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
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
  applyStatusChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', right: '5%', top: 'center', textStyle: { fontSize: 11 } },
    series: [{
      name: '投递状态',
      type: 'pie',
      radius: ['45%', '72%'],
      center: ['35%', '50%'],
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
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
  const sorted = [...hotJobs.value].sort((a, b) => (b.applyCount || 0) - (a.applyCount || 0)).slice(0, 10);
  const colors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#9B59B6', '#1ABC9C', '#E74C3C', '#34495E', '#2C3E50'];
  hotJobChart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '3%', containLabel: true },
    xAxis: { type: 'value', axisLabel: { fontSize: 10 } },
    yAxis: {
      type: 'category',
      data: sorted.map(d => d.jobName).reverse(),
      axisLabel: { fontSize: 10, width: 80, overflow: 'truncate' },
    },
    series: [{
      name: '投递量',
      type: 'bar',
      data: sorted.map(d => d.applyCount || 0).reverse(),
      itemStyle: {
        color: (params: any) => colors[params.dataIndex % colors.length],
        borderRadius: [0, 4, 4, 0],
      },
      barWidth: '60%',
      label: { show: true, position: 'right', fontSize: 10 },
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
    const [overviewRes, applyTrendRes, jobTypeRes, hotJobsRes,
           exchangeRes, exceptionRes, recentJobsRes, recentAppliesRes,
           companyTrendRes, userTrendRes, applyStatusRes] = await Promise.all([
      getOverview(),
      getApplyTrend(days),
      getJobTypeDistribution(),
      getHotJobs({ limit: 10, type: hotJobType.value }),
      getExchangeStatistics(),
      getExceptionApplies({ pageNum: 1, pageSize: 10 }),
      getRecentJobs({ pageNum: 1, pageSize: 5 }),
      getRecentApplies({ pageNum: 1, pageSize: 5 }),
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
    // 解包修正：拦截器已返回响应体，标准 RuoYi 列表 rows 在顶层(res.rows)，
    // 原 res.data?.rows 取不到、再 || res.data 会把整个对象误当列表。统一 res.rows ?? res.data?.rows。
    exceptionApplies.value = exceptionRes.rows ?? exceptionRes.data?.rows ?? [];
    recentJobs.value = recentJobsRes.rows ?? recentJobsRes.data?.rows ?? [];
    recentApplies.value = recentAppliesRes.rows ?? recentAppliesRes.data?.rows ?? [];
    applyStatusDist.value = applyStatusRes.data || [];

    renderAllCharts();
  } catch (error) {
    console.error('加载数据失败:', error);
    ElMessage.error('加载数据失败');
  } finally {
    loading.value = false;
  }
}

function renderAllCharts() {
  const trendMap: Record<string, { data: ApplyTrend[]; label: string; color: string }> = {
    apply: { data: applyTrendData.value, label: '投递量', color: '#409EFF' },
    company: { data: companyTrendData.value, label: '新增企业', color: '#67C23A' },
    user: { data: userTrendData.value, label: '新增求职者', color: '#E6A23C' },
  };
  const t = trendMap[trendType.value];
  if (t.data.length > 0) {
    initTrendChart(t.data, t.label, t.color);
  }
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
    company: { data: companyTrendData.value, label: '新增企业', color: '#67C23A' },
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

async function handleExport() {
  try {
    const rows = exceptionApplies.value.map((item: ExceptionApplyVO, idx: number) => ({
      序号: idx + 1,
      职位: item.jobName || '-',
      企业: item.companyName || '-',
      求职者: item.userName || '-',
      异常类型: item.exceptionTypeName || '-',
      状态: item.statusName || '-',
      投递时间: formatDate(item.createTime || ''),
    }));

    ElMessage.info('正在生成 Excel 文件...');

    const XLSX = await import('xlsx');
    const { saveAs } = await import('file-saver');

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '异常投递数据');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });

    saveAs(blob, `recruitment_exception_${new Date().toISOString().slice(0, 10)}.xlsx`);
    ElMessage.success('导出成功');
  } catch (e) {
    console.error('导出失败:', e);
    ElMessage.error('导出失败，请重试');
  }
}

// ---------- 生命周期 ----------
onMounted(() => {
  loadAllData();
  window.addEventListener('resize', handleResize);
  refreshTimer = setInterval(() => {
    loadAllData();
  }, 5 * 60 * 1000); // 每5分钟自动刷新
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
  padding: 16px;
}

/* ---------- 工具栏 ---------- */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 0 4px;
}

.toolbar-left { display: flex; align-items: center; gap: 8px; }
.toolbar-right { display: flex; align-items: center; gap: 8px; }

/* ---------- KPI 卡片 ---------- */
.mb-4 { margin-bottom: 16px; }

.kpi-card {
  cursor: pointer;
  transition: all 0.3s;
  border: none;
}
.kpi-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1) !important;
}

.kpi-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.kpi-label {
  font-size: 13px;
  color: #909399;
  font-weight: 500;
}

.kpi-value {
  font-size: 32px;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 10px;
}

.kpi-value.primary { color: #409EFF; }
.kpi-value.success { color: #67C23A; }
.kpi-value.warning { color: #E6A23C; }
.kpi-value.danger  { color: #F56C6C; }

.kpi-footer {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 8px;
}

.kpi-sub {
  font-size: 11px;
  color: #606266;
  display: flex;
  align-items: center;
  gap: 3px;
}

.kpi-sub .el-icon { font-size: 12px; }

.kpi-trend {
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 3px;
  padding-top: 6px;
  border-top: 1px solid #f0f0f0;
}

.kpi-trend.up    { color: #67C23A; }
.kpi-trend.down { color: #F56C6C; }
.kpi-trend.neutral { color: #909399; }

/* ---------- 卡片头部 ---------- */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 14px;
  color: #303133;
}

/* ---------- 异常行高亮 ---------- */
:deep(.el-table .exception-row) {
  background-color: #fef0f0 !important;
}

:deep(.el-table .exception-row:hover > td) {
  background-color: #fee !important;
}

/* ---------- 响应式调整 ---------- */
@media (max-width: 768px) {
  .kpi-value { font-size: 24px; }
  .kpi-footer { flex-direction: column; gap: 2px; }
  .toolbar { flex-direction: column; align-items: flex-start; gap: 8px; }
}
</style>
