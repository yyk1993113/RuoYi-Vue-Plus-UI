<template>
  <div class="p-4">

    <!-- ========== 区块一：统计概览 ========== -->
    <el-row :gutter="16" class="mb-4">
      <el-col :xs="24" :sm="12" :md="4">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-inner">
            <div class="stat-icon primary"><el-icon><User /></el-icon></div>
            <div class="stat-body">
              <span class="stat-label">求职者总数</span>
              <span class="stat-value primary">{{ stats.totalCount || 0 }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="4">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-inner">
            <div class="stat-icon success"><el-icon><CircleCheck /></el-icon></div>
            <div class="stat-body">
              <span class="stat-label">正常用户</span>
              <span class="stat-value success">{{ stats.normalCount || 0 }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="4">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-inner">
            <div class="stat-icon warning"><el-icon><Document /></el-icon></div>
            <div class="stat-body">
              <span class="stat-label">有投递记录</span>
              <span class="stat-value warning">{{ stats.appliedCount || 0 }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="4">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-inner">
            <div class="stat-icon info"><el-icon><Clock /></el-icon></div>
            <div class="stat-body">
              <span class="stat-label">待处理投递</span>
              <span class="stat-value info">{{ stats.pendingApplyCount || 0 }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="4">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-inner">
            <div class="stat-icon danger"><el-icon><WarnTriangleFilled /></el-icon></div>
            <div class="stat-body">
              <span class="stat-label">已禁言</span>
              <span class="stat-value danger">{{ stats.silencedCount || 0 }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="4">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-inner">
            <div class="stat-icon purple"><el-icon><TrendCharts /></el-icon></div>
            <div class="stat-body">
              <span class="stat-label">累计面试</span>
              <span class="stat-value purple">{{ totalInterviews || 0 }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- ========== 区块二：搜索栏 ========== -->
    <el-card shadow="hover" class="mb-4">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true">
        <el-form-item label="用户昵称" prop="userName">
          <el-input v-model="queryParams.userName" placeholder="昵称 / 账号" clearable style="width: 160px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="手机号" prop="phonenumber">
          <el-input v-model="queryParams.phonenumber" placeholder="请输入手机号" clearable style="width: 140px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="用户状态" prop="isSilenced">
          <el-select v-model="queryParams.isSilenced" placeholder="全部" clearable style="width: 130px">
            <el-option label="正常" value="0" />
            <el-option label="已禁言" value="1" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- ========== 区块三：数据表格 ========== -->
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="header-title">求职者列表</span>
          <div style="display: flex; gap: 8px;">
            <el-button type="success" plain icon="Download" @click="handleExport">导出</el-button>
            <el-button type="primary" plain icon="Refresh" @click="loadData" :loading="loading">刷新</el-button>
          </div>
        </div>
      </template>

      <el-table v-loading="loading" :data="tableData" border stripe>
        <!-- 用户ID：19位雪花ID需 ~170px 才能单行展示，避免折行成多行 -->
        <el-table-column label="用户ID" prop="userId" width="180" align="center" />

        <el-table-column label="用户信息" min-width="190">
          <template #default="{ row }">
            <div class="user-info">
              <el-avatar :src="row.avatarUrl" :size="40" fit="cover">
                {{ (row.nickName || row.userName || '?').charAt(0) }}
              </el-avatar>
              <div class="user-detail">
                <div class="name">
                  {{ row.nickName || row.userName || '-' }}
                  <el-tag v-if="row.status === '1'" type="danger" size="small" style="margin-left: 4px">停用</el-tag>
                </div>
                <div class="sub">账号: {{ row.userName || '-' }}</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- 联系方式 -->
        <el-table-column label="联系方式" width="150">
          <template #default="{ row }">
            <div class="contact-info">
              <div class="contact-item">
                <el-icon><Phone /></el-icon>
                <span>{{ row.phonenumber || '-' }}</span>
              </div>
              <div class="contact-item" v-if="row.email">
                <el-icon><Message /></el-icon>
                <span class="email-text">{{ row.email }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- 性别（本列表按求职者口径查询，类型恒为求职者，不再展示类型标签；
             双重身份用户的 userType 可在详情弹窗查看） -->
        <el-table-column label="性别" width="70" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.sex === '0'" type="" size="small" plain>男</el-tag>
            <el-tag v-else-if="row.sex === '1'" type="" size="small" plain>女</el-tag>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>

        <!-- 投递统计 -->
        <el-table-column label="投递统计" align="center" width="280">
          <template #default="{ row }">
            <div class="apply-stats">
              <el-tooltip content="总投递数" placement="top">
                <div class="stat-chip total" @click="handleViewApplies(row)">
                  <span class="chip-num">{{ row.totalApplies || 0 }}</span>
                  <span class="chip-label">投递</span>
                </div>
              </el-tooltip>
              <el-tooltip content="待处理" placement="top">
                <div class="stat-chip pending" @click="handleViewApplies(row, '0')">
                  <span class="chip-num">{{ row.pendingApplies || 0 }}</span>
                  <span class="chip-label">待处理</span>
                </div>
              </el-tooltip>
              <el-tooltip content="面试邀请" placement="top">
                <div class="stat-chip interview" @click="handleViewApplies(row, '1')">
                  <span class="chip-num">{{ row.interviewApplies || 0 }}</span>
                  <span class="chip-label">面试</span>
                </div>
              </el-tooltip>
              <el-tooltip content="已录用" placement="top">
                <div class="stat-chip hired" @click="handleViewApplies(row, '2')">
                  <span class="chip-num">{{ row.hiredApplies || 0 }}</span>
                  <span class="chip-label">录用</span>
                </div>
              </el-tooltip>
              <el-tooltip content="已拒绝" placement="top">
                <div class="stat-chip rejected" @click="handleViewApplies(row, '3')">
                  <span class="chip-num">{{ row.rejectedApplies || 0 }}</span>
                  <span class="chip-label">拒绝</span>
                </div>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>

        <!-- 禁言状态 -->
        <el-table-column label="禁言状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.isRecruitmentSilenced === '1'" type="danger" size="small">
              <el-icon><WarnTriangleFilled /></el-icon> 已禁言
            </el-tag>
            <el-tag v-else type="success" size="small">正常</el-tag>
          </template>
        </el-table-column>

        <!-- 注册/最后登录合并双行展示，压缩横向占宽避免出现横向滚动条 -->
        <el-table-column label="注册 / 最后登录" width="170" align="center">
          <template #default="{ row }">
            <div class="time-cell">
              <div>{{ row.createTime || '-' }}</div>
              <div class="sub">{{ row.loginDate || '未登录' }}</div>
            </div>
          </template>
        </el-table-column>

        <!-- 操作 -->
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="{ row }">
            <div style="display: flex; align-items: center; justify-content: center; gap: 4px; flex-wrap: wrap;">
              <el-button link type="primary" icon="View" @click="handleDetail(row)">详情</el-button>
              <el-button link type="danger" @click="handleSilence(row)" v-if="row.isRecruitmentSilenced !== '1'">
                禁言
              </el-button>
              <el-button link type="success" @click="handleUnsilence(row)" v-else>
                解禁
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <pagination
        v-show="total > 0"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        :total="total"
        @pagination="loadData"
      />
    </el-card>

    <!-- ========== 区块四：详情对话框 ========== -->
    <el-dialog v-model="detailVisible" title="求职者详情" width="720px" append-to-body>
      <el-descriptions :column="2" border v-if="currentUser">
        <el-descriptions-item label="用户ID">{{ currentUser.userId }}</el-descriptions-item>
        <el-descriptions-item label="用户类型">
          <el-tag v-if="currentUser.userType === 'C'" type="success">求职者</el-tag>
          <el-tag v-else-if="currentUser.userType === 'B'" type="warning">企业</el-tag>
          <el-tag v-else>{{ currentUser.userType }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="昵称">{{ currentUser.nickName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="账号">{{ currentUser.userName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="性别">
          <span v-if="currentUser.sex === '0'">男</span>
          <span v-else-if="currentUser.sex === '1'">女</span>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="账号状态">
          <el-tag v-if="currentUser.status === '0'" type="success">正常</el-tag>
          <el-tag v-else type="danger">停用</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="手机号" :span="2">{{ currentUser.phonenumber || '-' }}</el-descriptions-item>
        <el-descriptions-item label="邮箱" :span="2">{{ currentUser.email || '-' }}</el-descriptions-item>
        <el-descriptions-item label="登录IP">{{ currentUser.loginIp || '-' }}</el-descriptions-item>
        <el-descriptions-item label="最后登录">{{ currentUser.loginDate || '-' }}</el-descriptions-item>
        <el-descriptions-item label="注册时间" :span="2">{{ currentUser.createTime || '-' }}</el-descriptions-item>

        <!-- 投递统计（汇总行） -->
        <el-descriptions-item label="投递统计" :span="2">
          <div class="detail-stats">
            <span class="detail-stat-chip total">投递 {{ currentUser.totalApplies || 0 }}</span>
            <span class="detail-stat-chip pending">待处理 {{ currentUser.pendingApplies || 0 }}</span>
            <span class="detail-stat-chip interview">面试 {{ currentUser.interviewApplies || 0 }}</span>
            <span class="detail-stat-chip hired">录用 {{ currentUser.hiredApplies || 0 }}</span>
            <span class="detail-stat-chip rejected">拒绝 {{ currentUser.rejectedApplies || 0 }}</span>
          </div>
        </el-descriptions-item>

        <el-descriptions-item label="禁言状态">
          <el-tag v-if="currentUser.isRecruitmentSilenced === '1'" type="danger">已禁言</el-tag>
          <el-tag v-else type="success">正常</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="禁言原因">{{ currentUser.silenceReason || '-' }}</el-descriptions-item>
        <el-descriptions-item label="禁言时间">{{ currentUser.silenceTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentUser.remark || '暂无' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button type="danger" @click="openSilence(currentUser)" v-if="currentUser?.isRecruitmentSilenced !== '1'">
          禁言该用户
        </el-button>
        <el-button type="success" @click="handleUnsilence(currentUser)" v-else>
          解除禁言
        </el-button>
      </template>
    </el-dialog>

    <!-- ========== 区块五：禁言对话框 ========== -->
    <el-dialog v-model="silenceVisible" title="禁言求职者" width="500px" append-to-body>
      <el-form ref="silenceFormRef" :model="silenceForm" label-width="100px">
        <el-alert type="warning" :closable="false" style="margin-bottom: 16px">
          禁言后该求职者将无法查看招聘信息、投递职位、联系企业
        </el-alert>
        <el-form-item label="用户">
          <el-input :model-value="silenceForm.nickName || silenceForm.userName" disabled />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input :model-value="silenceForm.phonenumber" disabled />
        </el-form-item>
        <el-form-item label="禁言原因" prop="reason" required>
          <el-input
            v-model="silenceForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入禁言原因，便于后续管理记录"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="silenceVisible = false">取消</el-button>
        <el-button type="danger" @click="submitSilence">确认禁言</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  statisticsUser,
  listUsersWithStats,
  silenceUser,
  unsilenceUser,
  type RecruitmentUserVO,
} from '@/api/recruitment';
import { download } from '@/utils/request';
import { unwrapList } from './helpers';

const loading = ref(false);
const total = ref(0);
const tableData = ref<RecruitmentUserVO[]>([]);
const detailVisible = ref(false);
const silenceVisible = ref(false);
const currentUser = ref<RecruitmentUserVO | null>(null);
const queryFormRef = ref();
const silenceFormRef = ref();

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  userName: '',
  phonenumber: '',
  isSilenced: '',
});

const stats = reactive({
  totalCount: 0,
  silencedCount: 0,
  normalCount: 0,
  appliedCount: 0,
  pendingApplyCount: 0,
});

// 全局累计面试数（来自表格数据）
const totalInterviews = computed(() =>
  tableData.value.reduce((sum, u) => sum + (u.interviewApplies || 0), 0)
);

const silenceForm = reactive<RecruitmentUserVO & { reason: string }>({
  userId: 0,
  userName: '',
  nickName: '',
  userType: '',
  phonenumber: '',
  email: '',
  sex: '',
  sexName: '',
  avatar: 0,
  avatarUrl: '',
  status: '0',
  statusName: '',
  isRecruitmentSilenced: '0',
  silenceReason: '',
  silenceTime: '',
  totalApplies: 0,
  pendingApplies: 0,
  interviewApplies: 0,
  hiredApplies: 0,
  rejectedApplies: 0,
  loginIp: '',
  loginDate: '',
  createTime: '',
  remark: '',
  reason: '',
});

async function loadData() {
  loading.value = true;
  try {
    const res = await listUsersWithStats({
      pageNum: queryParams.pageNum,
      pageSize: queryParams.pageSize,
      userName: queryParams.userName || undefined,
      phonenumber: queryParams.phonenumber || undefined,
      isRecruitmentSilenced: queryParams.isSilenced || undefined,
    });
    // 列表拆包统一走 unwrapList（顶层 rows/total 优先，兼容历史 data.rows 形状）
    // 安全：不要打印整包响应，避免把求职者手机号/邮箱/登录IP 等 PII 暴露到浏览器控制台
    const list = unwrapList<RecruitmentUserVO>(res);
    tableData.value = list.rows;
    total.value = list.total;
  } catch (e) {
    tableData.value = [];
    total.value = 0;
    console.error('[求职者管理] loadData 异常:', e);
  } finally {
    loading.value = false;
  }
}

async function loadStatistics() {
  try {
    const res = await statisticsUser();
    // res = R.data: UserStatisticsVO { totalCount, normalCount, ... }
    Object.assign(stats, res.data || {});
  } catch {
    // silent
  }
}

function handleQuery() {
  queryParams.pageNum = 1;
  loadData();
}

function resetQuery() {
  queryFormRef.value?.resetFields();
  queryParams.pageNum = 1;
  queryParams.userName = '';
  queryParams.phonenumber = '';
  queryParams.isSilenced = '';
  loadData();
}

function handleDetail(row: RecruitmentUserVO) {
  currentUser.value = { ...row };
  detailVisible.value = true;
}

function openSilence(row: RecruitmentUserVO) {
  detailVisible.value = false;
  setTimeout(() => handleSilence(row), 50);
}

function handleSilence(row: RecruitmentUserVO) {
  Object.assign(silenceForm, row);
  silenceForm.reason = '';
  silenceVisible.value = true;
}

async function submitSilence() {
  if (!silenceForm.reason.trim()) {
    ElMessage.warning('请填写禁言原因');
    return;
  }
  try {
    await silenceUser({ userId: silenceForm.userId, reason: silenceForm.reason });
    ElMessage.success('禁言成功');
    silenceVisible.value = false;
    loadData();
    loadStatistics();
  } catch {
    ElMessage.error('禁言失败');
  }
}

async function handleUnsilence(row: RecruitmentUserVO | null) {
  if (!row) return;
  try {
    await ElMessageBox.confirm(
      '确定要取消该求职者的禁言状态吗？取消后用户可以正常查看职位信息。',
      '提示',
      { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' }
    );
    await unsilenceUser({ userId: row.userId });
    ElMessage.success('已解除禁言');
    detailVisible.value = false;
    loadData();
    loadStatistics();
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error('操作失败');
    }
  }
}

function handleViewApplies(row: RecruitmentUserVO, status?: string) {
  ElMessage.info(`查看 ${row.nickName || row.userName} 的投递记录（功能开发中）`);
}

onMounted(() => {
  loadData();
  loadStatistics();
});

function handleExport() {
  download('/admin/recruitment/user/export', {
    userName: queryParams.userName || undefined,
    phonenumber: queryParams.phonenumber || undefined,
    isRecruitmentSilenced: queryParams.isSilenced || undefined,
  }, `求职者数据_${new Date().getTime()}.xlsx`);
}
</script>

<style scoped>
.mb-4 { margin-bottom: 16px; }

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.header-title {
  font-weight: 600;
  font-size: 15px;
  color: #303133;
}

/* ---------- 统计卡片 ---------- */
.stat-card {
  border-radius: 10px;
  transition: all 0.3s;
}
.stat-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1) !important;
}
.stat-inner {
  display: flex;
  align-items: center;
  gap: 14px;
}
.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}
.stat-icon.primary { background: #ECF5FF; color: #409EFF; }
.stat-icon.success { background: #F0F9EB; color: #67C23A; }
.stat-icon.warning { background: #FDF6EC; color: #E6A23C; }
.stat-icon.info { background: #F4F4F5; color: #909399; }
.stat-icon.danger { background: #FEF0F0; color: #F56C6C; }
.stat-icon.purple { background: #F0EEFF; color: #7C6FFF; }

.stat-body { display: flex; flex-direction: column; gap: 4px; }
.stat-label { font-size: 13px; color: #909399; }
.stat-value { font-size: 26px; font-weight: 800; line-height: 1; }
.stat-value.primary { color: #409EFF; }
.stat-value.success { color: #67C23A; }
.stat-value.warning { color: #E6A23C; }
.stat-value.info { color: #909399; }
.stat-value.danger { color: #F56C6C; }
.stat-value.purple { color: #7C6FFF; }

/* ---------- 表格内用户信息 ---------- */
.user-info { display: flex; align-items: center; gap: 10px; }
.user-detail .name { font-weight: 600; color: #303133; line-height: 1.3; }
.user-detail .sub { font-size: 12px; color: #909399; margin-top: 2px; }

/* ---------- 联系方式 ---------- */
.contact-info { display: flex; flex-direction: column; gap: 4px; }
.contact-item { display: flex; align-items: center; gap: 5px; font-size: 13px; color: #606266; }
.email-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 150px; }

/* ---------- 投递统计芯片 ---------- */
.apply-stats { display: flex; align-items: center; gap: 4px; justify-content: center; }
.stat-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3px 6px;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s;
  min-width: 44px;
}
.stat-chip:hover { transform: scale(1.08); }
.chip-num { font-size: 16px; font-weight: 800; line-height: 1.2; }
.chip-label { font-size: 10px; margin-top: 2px; }
.stat-chip.total { background: #F0F9EB; color: #67C23A; }
.stat-chip.pending { background: #FDF6EC; color: #E6A23C; }
.stat-chip.interview { background: #ECF5FF; color: #409EFF; }
.stat-chip.hired { background: #E8F8EE; color: #22C55E; }
.stat-chip.rejected { background: #FEF0F0; color: #F56C6C; }

/* ---------- 详情统计 ---------- */
.detail-stats { display: flex; gap: 8px; flex-wrap: wrap; }
.detail-stat-chip {
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
}
.detail-stat-chip.total { background: #F0F9EB; color: #67C23A; }
.detail-stat-chip.pending { background: #FDF6EC; color: #E6A23C; }
.detail-stat-chip.interview { background: #ECF5FF; color: #409EFF; }
.detail-stat-chip.hired { background: #E8F8EE; color: #22C55E; }
.detail-stat-chip.rejected { background: #FEF0F0; color: #F56C6C; }

.text-muted { color: #C0C4CC; }

/* 注册/最后登录合并列：上行注册时间、下行最近登录（灰色小字） */
.time-cell { font-size: 12px; line-height: 1.6; }
.time-cell .sub { color: #909399; font-size: 11px; }
</style>
