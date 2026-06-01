<template>
  <div class="apply-container">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-radio-group v-model="timeRange" size="default" @change="handleTimeRangeChange">
          <el-radio-button value="7">近7天</el-radio-button>
          <el-radio-button value="14">近14天</el-radio-button>
          <el-radio-button value="30">近30天</el-radio-button>
        </el-radio-group>
      </div>
      <div class="toolbar-right">
        <el-button :icon="Refresh" circle @click="loadData" :loading="loading" />
      </div>
    </div>

    <!-- ========== 统计卡片 ========== -->
    <el-row :gutter="12" class="mb-4">
      <el-col :xs="12" :sm="8" :md="4">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value">{{ statistics.totalCount || 0 }}</div>
          <div class="stat-label">投递总数</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="8" :md="4">
        <el-card shadow="hover" class="stat-card primary">
          <div class="stat-value primary">{{ statistics.appliedCount || 0 }}</div>
          <div class="stat-label">已投递</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="8" :md="4">
        <el-card shadow="hover" class="stat-card warning">
          <div class="stat-value warning">{{ statistics.interviewCount || 0 }}</div>
          <div class="stat-label">面试邀请</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="8" :md="4">
        <el-card shadow="hover" class="stat-card success">
          <div class="stat-value success">{{ statistics.hiredCount || 0 }}</div>
          <div class="stat-label">已录用</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="8" :md="4">
        <el-card shadow="hover" class="stat-card danger">
          <div class="stat-value danger">{{ statistics.rejectedCount || 0 }}</div>
          <div class="stat-label">已拒绝</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="8" :md="4">
        <el-card shadow="hover" class="stat-card info">
          <div class="stat-value info">{{ statistics.unreadCount || 0 }}</div>
          <div class="stat-label">未读</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- ========== 搜索栏 ========== -->
    <el-card shadow="hover" class="mb-4">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true">
        <el-form-item label="岗位名称" prop="jobName">
          <el-input v-model="queryParams.jobName" placeholder="请输入岗位名称" clearable style="width: 180px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="求职者" prop="userName">
          <el-input v-model="queryParams.userName" placeholder="请输入求职者" clearable style="width: 140px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="企业" prop="companyName">
          <el-input v-model="queryParams.companyName" placeholder="请输入企业" clearable style="width: 140px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="已投递" value="0" />
            <el-option label="面试邀请" value="1" />
            <el-option label="已录用" value="2" />
            <el-option label="已拒绝" value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="已读状态" prop="isRead">
          <el-select v-model="queryParams.isRead" placeholder="全部" clearable style="width: 100px">
            <el-option label="未读" value="0" />
            <el-option label="已读" value="1" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
          <el-button type="success" plain icon="Download" @click="handleExport">导出</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- ========== 数据表格 ========== -->
    <el-card shadow="hover">
      <el-table v-loading="loading" :data="tableData" border stripe>
        <el-table-column label="投递ID" prop="applyId" width="200" align="center" />
        <el-table-column label="求职者信息" min-width="160">
          <template #default="{ row }">
            <div class="user-cell">
              <el-avatar :size="34" :src="row.avatarUrl || row.avatar" style="background: #409EFF; flex-shrink: 0">
                {{ (row.userName || 'U').charAt(0) }}
              </el-avatar>
              <div class="user-detail">
                <div class="name">{{ row.userName || '未知用户' }}</div>
                <div class="phone">{{ row.phonenumber || '-' }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="岗位信息" min-width="180">
          <template #default="{ row }">
            <div class="job-cell">
              <div class="job-name">{{ row.jobName || '-' }}</div>
              <div class="salary">{{ row.salary || '' }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="企业" prop="companyName" min-width="120" show-overflow-tooltip />
        <el-table-column label="投递时间" prop="applyTime" width="160" align="center" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.status === '0'" :type="row.isRead === '0' ? 'warning' : 'info'" size="small">
              {{ row.isRead === '0' ? '新投递' : '已投递' }}
            </el-tag>
            <el-tag v-else-if="row.status === '1'" type="primary" size="small">面试邀请</el-tag>
            <el-tag v-else-if="row.status === '2'" type="success" size="small">已录用</el-tag>
            <el-tag v-else type="danger" size="small">已拒绝</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="已读" width="70" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.isRead === '1'" type="success" size="small">已读</el-tag>
            <el-tag v-else type="warning" size="small">未读</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="联系方式" width="80" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.exchanged === true || row.exchanged === '1'" type="success" size="small">已交换</el-tag>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" fixed="right" align="center">
          <template #default="{ row }">
            <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
              <el-button link type="primary" icon="View" @click="handleDetail(row)">详情</el-button>
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

    <!-- ========== 投递详情对话框 (重新设计版) ========== -->
    <el-dialog 
      v-model="detailVisible" 
      title="投递申请详情" 
      width="820px" 
      append-to-body 
      class="custom-detail-dialog"
    >
      <div v-if="currentApply" class="detail-container">
        <!-- 头部概览 -->
        <div class="header-section">
          <div class="header-left">
            <el-avatar :size="70" :src="currentApply.avatarUrl || currentApply.avatar" class="user-avatar">
              {{ (currentApply.userName || 'U').charAt(0) }}
            </el-avatar>
            <div class="user-info">
              <div class="top">
                <span class="name">{{ currentApply.realName || currentApply.userName }}</span>
                <el-tag v-if="currentApply.education" size="small" effect="plain" class="edu-tag">
                  {{ currentApply.education }}
                </el-tag>
              </div>
              <div class="job-title">{{ currentApply.jobName }}</div>
              <div class="company-sub">{{ currentApply.companyName }}</div>
            </div>
          </div>
          <div class="header-right">
            <div class="status-badge" :class="'status-' + currentApply.status">
               <div class="status-dot"></div>
               {{ getStatusLabel(currentApply.status) }}
            </div>
            <div class="time-label">{{ currentApply.applyTime }} 投递</div>
          </div>
        </div>

        <el-divider />

        <!-- 内容区域 -->
        <div class="content-section">
          <el-row :gutter="24">
            <!-- 左侧：核心履历 -->
            <el-col :span="16">
              <div class="detail-block">
                <div class="block-title"><el-icon><CollectionTag /></el-icon> 个人背景</div>
                <div class="grid-info">
                  <div class="grid-item">
                    <span class="label">工作年限</span>
                    <span class="value">{{ currentApply.workYears ? currentApply.workYears + ' 年' : '不可知' }}</span>
                  </div>
                  <div class="grid-item">
                    <span class="label">求职城市</span>
                    <span class="value">{{ currentApply.city || '不限' }}</span>
                  </div>
                  <div class="grid-item">
                    <span class="label">期望职位</span>
                    <span class="value">{{ currentApply.expectPosition || '暂无' }}</span>
                  </div>
                  <div class="grid-item">
                    <span class="label">手机号码</span>
                    <span class="value">{{ currentApply.phonenumber || '-' }}</span>
                  </div>
                </div>

                <div class="block-title mt-6"><el-icon><View /></el-icon> 技能评价</div>
                <div class="skill-tags">
                  <el-tag 
                    v-for="item in (currentApply.skills || '').split(',').filter(s => s)" 
                    :key="item" 
                    class="skill-tag"
                    effect="light"
                    round
                  >
                    {{ item }}
                  </el-tag>
                  <span v-if="!(currentApply.skills)" class="empty-text">暂无技能标签</span>
                </div>

                <div class="block-title mt-6"><el-icon><User /></el-icon> 个人简介</div>
                <div class="text-content">
                  {{ currentApply.summary || '该求职者很神秘，什么都没写~' }}
                </div>

                <div class="block-title mt-6"><el-icon><ChatLineRound /></el-icon> 投递备注</div>
                <div class="message-box">
                  {{ currentApply.message || '无附加备注信息' }}
                </div>
              </div>
            </el-col>

            <!-- 右侧：岗位与流程 -->
            <el-col :span="8">
              <div class="sidebar-block">
                <div class="block-title">岗位信息</div>
                <div class="info-card">
                  <div class="salary-box">{{ currentApply.salary || '薪资面议' }}</div>
                  <div class="company-detail">
                    <p><el-icon><OfficeBuilding /></el-icon> {{ currentApply.companyName }}</p>
                    <p><el-icon><User /></el-icon> {{ currentApply.contactPerson || '-' }}</p>
                    <p><el-icon><Phone /></el-icon> {{ currentApply.contactPhone || '-' }}</p>
                  </div>
                </div>

                <div class="block-title mt-6">流转信息</div>
                <ul class="meta-info">
                  <li>
                    <span class="label">投递ID</span>
                    <span class="value">#{{ currentApply.applyId }}</span>
                  </li>
                  <li>
                    <span class="label">已读状态</span>
                    <span class="value">
                      <el-tag size="small" :type="currentApply.isRead === '1' ? 'success' : 'warning'">
                         {{ currentApply.isRead === '1' ? '已阅' : '未阅' }}
                      </el-tag>
                    </span>
                  </li>
                  <li>
                    <span class="label">投递时间</span>
                    <span class="value">{{ currentApply.createTime ? currentApply.createTime.split(' ')[0] : '-' }}</span>
                  </li>
                </ul>

                <div v-if="currentApply.recruiterContact || currentApply.jobSeekerContact" class="contact-memo mt-6">
                  <div class="memo-title">联系凭证</div>
                  <div v-if="currentApply.recruiterContact" class="memo-content">
                    B端: {{ currentApply.recruiterContact }}
                  </div>
                  <div v-if="currentApply.jobSeekerContact" class="memo-content" style="margin-top: 4px">
                    C端: {{ currentApply.jobSeekerContact }}
                  </div>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="detailVisible = false">关闭窗口</el-button>
          <el-button type="primary" @click="handlePrint">打印资料</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Refresh, User, Phone, View, CollectionTag, OfficeBuilding, ChatLineRound } from '@element-plus/icons-vue';
import { listApply, getApplyStatistics, getApply } from '@/api/recruitment';
import { download } from '@/utils/request';

const loading = ref(false);
const total = ref(0);
const tableData = ref<any[]>([]);
const detailVisible = ref(false);
const currentApply = ref<any>(null);
const queryFormRef = ref();
const timeRange = ref('7');

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  jobName: '',
  userName: '',
  companyName: '',
  status: '',
  isRead: '',
});

const statistics = reactive({
  totalCount: 0,
  appliedCount: 0,
  interviewCount: 0,
  hiredCount: 0,
  rejectedCount: 0,
  unreadCount: 0,
});

async function loadData() {
  loading.value = true;
  try {
    const res = await listApply(queryParams);
    tableData.value = res.data?.rows || res.rows || [];
    total.value = res.data?.total || res.total || 0;
  } catch (error) {
    console.error('加载数据失败:', error);
  } finally {
    loading.value = false;
  }
}

async function loadStatistics() {
  try {
    const res = await getApplyStatistics();
    Object.assign(statistics, res.data || {});
  } catch (error) {
    console.error('加载统计失败:', error);
  }
}

function handleQuery() {
  queryParams.pageNum = 1;
  loadData();
}

function resetQuery() {
  queryFormRef.value?.resetFields();
  queryParams.pageNum = 1;
  queryParams.status = '';
  queryParams.isRead = '';
  loadData();
}

function handleTimeRangeChange() {
  queryParams.pageNum = 1;
  loadData();
}

async function handleDetail(row: any) {
  try {
    const res = await getApply(row.applyId);
    currentApply.value = res.data;
    detailVisible.value = true;
  } catch (error) {
    ElMessage.error('获取投递详情失败');
  }
}

onMounted(() => {
  loadData();
  loadStatistics();
});

function handleExport() {
  download('/admin/recruitment/apply/export', queryParams, `投递记录_${new Date().getTime()}.xlsx`);
}

function getStatusLabel(status: string) {
  const map: any = {
    '0': '已投递',
    '1': '面试邀请',
    '2': '已录用',
    '3': '已拒绝'
  };
  return map[status] || '未知';
}

function handlePrint() {
  window.print();
}
</script>

<style scoped>
.apply-container {
  padding: 16px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.toolbar-right { display: flex; align-items: center; gap: 8px; }

.mb-4 { margin-bottom: 14px; }

/* 统计卡片 */
.stat-card {
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  border: none;
  border-radius: 10px;
}
.stat-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08) !important; }
.stat-value {
  font-size: 26px;
  font-weight: 800;
  color: #303133;
  line-height: 1.2;
}
.stat-value.primary { color: #409EFF; }
.stat-value.warning { color: #E6A23C; }
.stat-value.success { color: #67C23A; }
.stat-value.danger  { color: #F56C6C; }
.stat-value.info    { color: #909399; }
.stat-label {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

/* 单元格 */
.user-cell { display: flex; align-items: center; gap: 10px; }
.user-detail .name { font-weight: 600; color: #303133; font-size: 13px; }
.user-detail .phone { font-size: 11px; color: #909399; margin-top: 2px; }

.job-cell { padding: 2px 0; }
.job-cell .job-name { font-weight: 600; color: #303133; font-size: 13px; }
.job-cell .salary { color: #F56C6C; font-size: 12px; margin-top: 2px; }

.text-muted { color: #C0C4CC; font-size: 12px; }

@media (max-width: 768px) {
  .stat-value { font-size: 20px; }
}

/* 对话框重构样式 */
:deep(.custom-detail-dialog) {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0,0,0,0.15);
}

:deep(.custom-detail-dialog .el-dialog__header) {
  margin-right: 0;
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
}

:deep(.custom-detail-dialog .el-dialog__body) {
  padding: 24px;
}

.detail-container {
  padding: 0;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 10px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-avatar {
  border: 4px solid #fff;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
  background: #f0f2f5;
  color: #409eff;
  font-weight: bold;
}

.user-info .top {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}

.user-info .name {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
}

.user-info .edu-tag {
  background: #f0f7ff;
  border-color: #d1e9ff;
  color: #409eff;
}

.user-info .job-title {
  font-size: 16px;
  color: #409eff;
  font-weight: 600;
  margin-bottom: 2px;
}

.user-info .company-sub {
  font-size: 13px;
  color: #909399;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 14px;
}

.status-0 { background: #f4f4f5; color: #909399; }
.status-1 { background: #ecf5ff; color: #409eff; }
.status-2 { background: #f0f9eb; color: #67c23a; }
.status-3 { background: #fef0f0; color: #f56c6c; }

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}

.time-label {
  text-align: right;
  font-size: 12px;
  color: #c0c4cc;
  margin-top: 6px;
}

.block-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 16px;
}

.block-title .el-icon {
  color: #409eff;
}

/* 网格信息 */
.grid-info {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  background: #f8f9fb;
  padding: 16px;
  border-radius: 12px;
}

.grid-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.grid-item .label {
  font-size: 12px;
  color: #909399;
}

.grid-item .value {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

/* 技能与文本 */
.skill-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.skill-tag {
  border: none;
  background: #f0f2f5;
  color: #606266;
}

.text-content {
  font-size: 14px;
  line-height: 1.6;
  color: #606266;
  background: #fff;
  padding: 16px;
  border: 1px dashed #dcdfe6;
  border-radius: 8px;
  white-space: pre-wrap;
}

.message-box {
  background: #fff8eb;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 13px;
  color: #e6a23c;
  line-height: 1.5;
}

.empty-text {
  font-size: 13px;
  color: #c0c4cc;
  font-style: italic;
}

/* 侧边栏 */
.sidebar-block {
  background: #fff;
}

.info-card {
  background: linear-gradient(135deg, #409eff 0%, #3a8ee6 100%);
  padding: 20px;
  border-radius: 14px;
  color: #fff;
  margin-bottom: 24px;
  box-shadow: 0 8px 20px rgba(64, 158, 255, 0.2);
}

.salary-box {
  font-size: 24px;
  font-weight: 800;
  margin-bottom: 16px;
}

.company-detail p {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  margin: 10px 0;
  opacity: 0.95;
}

.meta-info {
  list-style: none;
  padding: 0;
  margin: 0;
}

.meta-info li {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f2f6fc;
  font-size: 13px;
}

.meta-info .label { color: #909399; }
.meta-info .value { font-weight: 500; color: #303133; }

.contact-memo {
  background: #f0f9eb;
  padding: 14px;
  border-radius: 10px;
}

.memo-title {
  font-size: 12px;
  font-weight: 700;
  color: #67c23a;
  margin-bottom: 6px;
  text-transform: uppercase;
}

.memo-content {
  font-size: 13px;
  color: #529b2e;
  word-break: break-all;
  line-height: 1.4;
}

.mt-6 { margin-top: 28px; }

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
