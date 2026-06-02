<template>
  <!--
    运营台 · 运营统计
    职责：以卡片 + 图表展示后端运营统计聚合接口
      GET /admin/recruitment/operation/statistics?windowDays=N
    的全部指标（新增主体 / 审核通过率 / 投递·面试·选用·履约·台账·发票 / 复访率 / 30天留存）。
    数据来源：@/api/recruitment#getOperationStatistics -> OperationStatsVO（载荷在 res.data）。
    口径说明：复访率与 30 天留存率为后端基于 login_date 的活跃近似估算（estimated=true），
             页面顶部以 el-alert 显式提示用户，避免误读为精确埋点指标。
    图表：沿用 index.vue 的 echarts.init / setOption / resize / dispose 用法。
  -->
  <div class="dashboard-container">
    <!-- 顶部工具栏：统计窗口（新增主体口径）+ 刷新 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <span class="toolbar-label">新增统计窗口</span>
        <el-radio-group v-model="windowDays" size="default" @change="loadData">
          <el-radio-button :value="7">近7天</el-radio-button>
          <el-radio-button :value="14">近14天</el-radio-button>
          <el-radio-button :value="30">近30天</el-radio-button>
        </el-radio-group>
      </div>
      <div class="toolbar-right">
        <el-button :icon="Refresh" circle :loading="loading" @click="loadData" />
      </div>
    </div>

    <!-- 估算口径提示：仅当后端标记包含估算值时显示 remark -->
    <el-alert
      v-if="stats.estimated"
      class="mb-4"
      type="warning"
      :closable="false"
      show-icon
      title="部分指标为估算值（复访率 / 30 天留存率）"
      :description="stats.remark"
    />

    <!-- ========== 区块一：新增主体 ========== -->
    <el-row :gutter="16" class="mb-4">
      <el-col :xs="24" :sm="12">
        <el-card shadow="hover" class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-label">新增求职者</span>
            <el-tag type="info" size="small" effect="plain">近 {{ stats.windowDays || windowDays }} 天</el-tag>
          </div>
          <div class="kpi-value primary">{{ stats.newJobSeekerCount ?? 0 }}</div>
          <div class="kpi-trend neutral">
            <el-icon><UserFilled /></el-icon>
            sys_user · user_type=C
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12">
        <el-card shadow="hover" class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-label">新增企业</span>
            <el-tag type="info" size="small" effect="plain">近 {{ stats.windowDays || windowDays }} 天</el-tag>
          </div>
          <div class="kpi-value success">{{ stats.newCompanyCount ?? 0 }}</div>
          <div class="kpi-trend neutral">
            <el-icon><OfficeBuilding /></el-icon>
            company 表新增
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- ========== 区块二：业务漏斗计数 ========== -->
    <el-row :gutter="16" class="mb-4">
      <el-col v-for="item in funnelCards" :key="item.key" :xs="12" :sm="8" :md="4">
        <el-card shadow="hover" class="kpi-card mini">
          <div class="kpi-header">
            <span class="kpi-label">{{ item.label }}</span>
          </div>
          <div class="kpi-value" :class="item.color">{{ item.value ?? 0 }}</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- ========== 区块三：审核通过率 + 估算率 ========== -->
    <el-row :gutter="16" class="mb-4">
      <!-- 企业审核通过率 -->
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="rate-card">
          <div class="kpi-label">企业审核通过率</div>
          <el-progress
            type="dashboard"
            :percentage="clampPercent(stats.companyApprovalRate)"
            :color="rateColor(stats.companyApprovalRate)"
            :width="120"
          >
            <template #default="{ percentage }">
              <span class="rate-num">{{ percentage }}%</span>
            </template>
          </el-progress>
          <div class="rate-sub">
            通过 {{ stats.companyApprovedCount ?? 0 }} / 驳回 {{ stats.companyRejectedCount ?? 0 }}
          </div>
        </el-card>
      </el-col>
      <!-- 岗位审核通过率 -->
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="rate-card">
          <div class="kpi-label">岗位审核通过率</div>
          <el-progress
            type="dashboard"
            :percentage="clampPercent(stats.jobApprovalRate)"
            :color="rateColor(stats.jobApprovalRate)"
            :width="120"
          >
            <template #default="{ percentage }">
              <span class="rate-num">{{ percentage }}%</span>
            </template>
          </el-progress>
          <div class="rate-sub">
            通过 {{ stats.jobApprovedCount ?? 0 }} / 驳回 {{ stats.jobRejectedCount ?? 0 }}
          </div>
        </el-card>
      </el-col>
      <!-- 复访率（估算） -->
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="rate-card">
          <div class="kpi-label">
            复访率
            <el-tag type="warning" size="small" effect="plain">估算</el-tag>
          </div>
          <el-progress
            type="dashboard"
            :percentage="clampPercent(stats.revisitRate)"
            :color="'#E6A23C'"
            :width="120"
          >
            <template #default="{ percentage }">
              <span class="rate-num">{{ percentage }}%</span>
            </template>
          </el-progress>
          <div class="rate-sub">曾登录求职者 / 求职者总数</div>
        </el-card>
      </el-col>
      <!-- 30 天留存率（估算） -->
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="rate-card">
          <div class="kpi-label">
            30 天留存率
            <el-tag type="warning" size="small" effect="plain">估算</el-tag>
          </div>
          <el-progress
            type="dashboard"
            :percentage="clampPercent(stats.retentionRate)"
            :color="'#9B59B6'"
            :width="120"
          >
            <template #default="{ percentage }">
              <span class="rate-num">{{ percentage }}%</span>
            </template>
          </el-progress>
          <div class="rate-sub">老用户近 30 天仍登录占比</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- ========== 区块四：图表区 ========== -->
    <el-row :gutter="16" class="mb-4">
      <!-- 业务转化漏斗 -->
      <el-col :xs="24" :lg="14">
        <el-card v-loading="loading" shadow="hover">
          <template #header>
            <div class="card-header"><span>业务转化漏斗</span></div>
          </template>
          <div ref="funnelChartRef" style="height: 340px"></div>
        </el-card>
      </el-col>
      <!-- 审核通过率对比 -->
      <el-col :xs="24" :lg="10">
        <el-card v-loading="loading" shadow="hover">
          <template #header>
            <div class="card-header"><span>审核通过 / 驳回对比</span></div>
          </template>
          <div ref="auditChartRef" style="height: 340px"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue';
import * as echarts from 'echarts';
import { Refresh, UserFilled, OfficeBuilding } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
// 运营统计聚合接口与其 VO 类型（后端 AdminOperationStatsController）。
import { getOperationStatistics, type OperationStatsVO } from '@/api/recruitment';

// 组件名与路由 component 路径 recruitment/statistics 对齐（便于 keep-alive 匹配）。
defineOptions({ name: 'recruitment/statistics' });

// ---------- refs ----------
const funnelChartRef = ref<HTMLElement | null>(null);
const auditChartRef = ref<HTMLElement | null>(null);
let funnelChart: echarts.ECharts | null = null;
let auditChart: echarts.ECharts | null = null;

// ---------- state ----------
const loading = ref(false);
// 新增主体的统计窗口（天）。绑定到接口 windowDays，后端默认 30。
const windowDays = ref<number>(30);
// 运营统计响应体。用 reactive 持有，字段全部来自 OperationStatsVO。
const stats = reactive<Partial<OperationStatsVO>>({});

// 业务漏斗计数卡片配置：label / 取值键 / 主色。数据来源 stats 对应字段。
const funnelCards = computed(() => [
  { key: 'applyCount', label: '投递数', value: stats.applyCount, color: 'primary' },
  { key: 'interviewInviteCount', label: '面试邀请', value: stats.interviewInviteCount, color: 'warning' },
  { key: 'partTimeSelectionCount', label: '兼职选用', value: stats.partTimeSelectionCount, color: 'success' },
  { key: 'fulfillmentCompletedCount', label: '履约完成', value: stats.fulfillmentCompletedCount, color: 'success' },
  { key: 'ledgerGeneratedCount', label: '台账生成', value: stats.ledgerGeneratedCount, color: 'primary' },
  { key: 'invoiceUploadedCount', label: '发票上传', value: stats.invoiceUploadedCount, color: 'danger' },
]);

// ---------- 工具函数 ----------
// 百分比裁剪到 [0,100] 整数，供 el-progress 使用（后端给的是带两位小数的百分比）。
function clampPercent(v?: number): number {
  const n = Number(v) || 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

// 通过率配色：达标绿 / 一般橙 / 偏低红。
function rateColor(v?: number): string {
  const n = Number(v) || 0;
  if (n >= 80) return '#67C23A';
  if (n >= 50) return '#E6A23C';
  return '#F56C6C';
}

// ---------- 图表 ----------
// 业务转化漏斗：投递 -> 面试邀请 -> 兼职选用 -> 履约完成 -> 台账生成 -> 发票上传。
function renderFunnelChart() {
  if (!funnelChartRef.value) return;
  if (!funnelChart) funnelChart = echarts.init(funnelChartRef.value);
  const data = [
    { name: '投递数', value: stats.applyCount ?? 0 },
    { name: '面试邀请', value: stats.interviewInviteCount ?? 0 },
    { name: '兼职选用', value: stats.partTimeSelectionCount ?? 0 },
    { name: '履约完成', value: stats.fulfillmentCompletedCount ?? 0 },
    { name: '台账生成', value: stats.ledgerGeneratedCount ?? 0 },
    { name: '发票上传', value: stats.invoiceUploadedCount ?? 0 },
  ];
  const colors = ['#2b7fff', '#409EFF', '#E6A23C', '#67C23A', '#13C2C2', '#F56C6C'];
  funnelChart.setOption(
    {
      tooltip: { trigger: 'item', formatter: '{b}: {c}' },
      legend: { bottom: 0, textStyle: { fontSize: 11 } },
      color: colors,
      series: [
        {
          name: '业务转化',
          type: 'funnel',
          left: '6%',
          right: '6%',
          top: 16,
          bottom: 36,
          minSize: '14%',
          maxSize: '100%',
          sort: 'descending',
          gap: 2,
          label: { show: true, position: 'inside', formatter: '{b}\n{c}', fontSize: 12 },
          labelLine: { show: false },
          itemStyle: { borderColor: '#fff', borderWidth: 1 },
          emphasis: { label: { fontSize: 14, fontWeight: 'bold' } },
          data,
        },
      ],
    },
    true
  );
}

// 审核通过 / 驳回分组柱状图：企业 vs 岗位。
function renderAuditChart() {
  if (!auditChartRef.value) return;
  if (!auditChart) auditChart = echarts.init(auditChartRef.value);
  auditChart.setOption(
    {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { bottom: 0, textStyle: { fontSize: 11 } },
      grid: { left: '3%', right: '4%', top: 16, bottom: 36, containLabel: true },
      xAxis: { type: 'category', data: ['企业审核', '岗位审核'], axisLabel: { fontSize: 12 } },
      yAxis: { type: 'value', minInterval: 1, axisLabel: { fontSize: 11 } },
      series: [
        {
          name: '通过',
          type: 'bar',
          data: [stats.companyApprovedCount ?? 0, stats.jobApprovedCount ?? 0],
          itemStyle: { color: '#67C23A', borderRadius: [4, 4, 0, 0] },
          barWidth: '28%',
          label: { show: true, position: 'top', fontSize: 11 },
        },
        {
          name: '驳回',
          type: 'bar',
          data: [stats.companyRejectedCount ?? 0, stats.jobRejectedCount ?? 0],
          itemStyle: { color: '#F56C6C', borderRadius: [4, 4, 0, 0] },
          barWidth: '28%',
          label: { show: true, position: 'top', fontSize: 11 },
        },
      ],
    },
    true
  );
}

function renderAllCharts() {
  renderFunnelChart();
  renderAuditChart();
}

function handleResize() {
  funnelChart?.resize();
  auditChart?.resize();
}

// ---------- 数据加载 ----------
async function loadData() {
  loading.value = true;
  try {
    // windowDays 仅影响「新增求职者 / 新增企业」窗口，其余为全量/状态计数。
    const res = await getOperationStatistics({ windowDays: windowDays.value });
    Object.assign(stats, res.data || {});
    // 等 DOM/卡片渲染后再绘图，确保容器尺寸就绪。
    await nextTick();
    renderAllCharts();
  } catch (error) {
    console.error('加载运营统计失败:', error);
    ElMessage.error('加载运营统计失败');
  } finally {
    loading.value = false;
  }
}

// ---------- 生命周期 ----------
onMounted(() => {
  loadData();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  funnelChart?.dispose();
  auditChart?.dispose();
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
.toolbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.toolbar-label {
  font-size: 13px;
  color: #606266;
}
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mb-4 {
  margin-bottom: 16px;
}

/* ---------- KPI 卡片 ---------- */
.kpi-card {
  transition: all 0.3s;
  border: none;
}
.kpi-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1) !important;
}
.kpi-card.mini :deep(.el-card__body) {
  padding: 14px 16px;
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
  display: flex;
  align-items: center;
  gap: 6px;
}
.kpi-value {
  font-size: 30px;
  font-weight: 700;
  line-height: 1.2;
}
.kpi-card.mini .kpi-value {
  font-size: 24px;
}
.kpi-value.primary {
  color: #2b7fff;
}
.kpi-value.success {
  color: #67c23a;
}
.kpi-value.warning {
  color: #e6a23c;
}
.kpi-value.danger {
  color: #f56c6c;
}

.kpi-trend {
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 10px;
  padding-top: 6px;
  border-top: 1px solid #f0f0f0;
  color: #909399;
}
.kpi-trend.neutral {
  color: #909399;
}

/* ---------- 通过率 / 估算率仪表卡 ---------- */
.rate-card {
  text-align: center;
  border: none;
  transition: all 0.3s;
}
.rate-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1) !important;
}
.rate-card .kpi-label {
  justify-content: center;
  margin-bottom: 8px;
}
.rate-num {
  font-size: 20px;
  font-weight: 700;
  color: #303133;
}
.rate-sub {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
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
  .kpi-value {
    font-size: 24px;
  }
  .toolbar {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
