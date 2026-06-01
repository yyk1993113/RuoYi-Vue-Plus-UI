<template>
  <div class="task-container">
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
          <div class="stat-label">任务总数</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="8" :md="4">
        <el-card shadow="hover" class="stat-card primary">
          <div class="stat-value primary">{{ statistics.inProgressCount || 0 }}</div>
          <div class="stat-label">进行中</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="8" :md="4">
        <el-card shadow="hover" class="stat-card warning">
          <div class="stat-value warning">{{ statistics.pendingVerifyCount || 0 }}</div>
          <div class="stat-label">待核验</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="8" :md="4">
        <el-card shadow="hover" class="stat-card success">
          <div class="stat-value success">{{ statistics.verifiedCount || 0 }}</div>
          <div class="stat-label">已核验通过</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="8" :md="4">
        <el-card shadow="hover" class="stat-card danger">
          <div class="stat-value danger">{{ statistics.rejectedCount || 0 }}</div>
          <div class="stat-label">已核验拒绝</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="8" :md="4">
        <el-card shadow="hover" class="stat-card info">
          <div class="stat-value info">{{ statistics.settledCount || 0 }}</div>
          <div class="stat-label">已结算</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- ========== 搜索栏 ========== -->
    <el-card shadow="hover" class="mb-4">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true">
        <el-form-item label="企业" prop="companyName">
          <el-input v-model="queryParams.companyName" placeholder="请输入企业名称" clearable style="width: 160px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="岗位" prop="jobName">
          <el-input v-model="queryParams.jobName" placeholder="请输入岗位名称" clearable style="width: 160px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 140px">
            <el-option label="进行中" value="0" />
            <el-option label="待核验" value="1" />
            <el-option label="已通过" value="2" />
            <el-option label="已拒绝" value="3" />
            <el-option label="已结算" value="4" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- ========== 数据表格 ========== -->
    <el-card shadow="hover">
      <el-table v-loading="loading" :data="tableData" border stripe>
        <el-table-column label="任务ID" prop="taskId" width="200" align="center" />
        <el-table-column label="求职者信息" min-width="150">
          <template #default="{ row }">
            <div class="user-cell">
              <el-avatar :size="34" :src="row.workerAvatar" style="background: #67C23A; flex-shrink: 0">
                {{ (row.workerName || 'W').charAt(0) }}
              </el-avatar>
              <div class="user-detail">
                <div class="name">{{ row.workerName || '未知' }}</div>
                <div class="phone">{{ row.workerPhone || '-' }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="岗位信息" min-width="160">
          <template #default="{ row }">
            <div class="job-cell">
              <div class="job-name">{{ row.jobName || '-' }}</div>
              <div class="salary">{{ row.salary || '' }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="企业" prop="companyName" min-width="120" show-overflow-tooltip />
        <el-table-column label="工作地点" prop="address" min-width="130" show-overflow-tooltip />
        <el-table-column label="工作时间" prop="workTime" width="160" align="center" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.status === '0'" type="primary" size="small">进行中</el-tag>
            <el-tag v-else-if="row.status === '1'" type="warning" size="small">待核验</el-tag>
            <el-tag v-else-if="row.status === '2'" type="success" size="small">已通过</el-tag>
            <el-tag v-else-if="row.status === '3'" type="danger" size="small">已拒绝</el-tag>
            <el-tag v-else type="info" size="small">已结算</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right" align="center">
          <template #default="{ row }">
            <div style="display: flex; align-items: center; justify-content: center; gap: 4px; flex-wrap: wrap;">
              <el-button link type="primary" icon="View" @click="handleDetail(row)">详情</el-button>
              <el-button v-if="row.status === '1'" link type="success" icon="CircleCheck" @click="handleVerify(row, '2')">通过</el-button>
              <el-button v-if="row.status === '1'" link type="danger" icon="Close" @click="handleVerify(row, '3')">拒绝</el-button>
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

    <!-- ========== 任务详情对话框 ========== -->
    <el-dialog v-model="detailVisible" title="任务详情" width="720px" append-to-body>
      <el-descriptions :column="2" border v-if="currentTask">
        <el-descriptions-item label="任务ID">{{ currentTask.taskId }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag v-if="currentTask.status === '0'" type="primary">进行中</el-tag>
          <el-tag v-else-if="currentTask.status === '1'" type="warning">待核验</el-tag>
          <el-tag v-else-if="currentTask.status === '2'" type="success">已通过</el-tag>
          <el-tag v-else-if="currentTask.status === '3'" type="danger">已拒绝</el-tag>
          <el-tag v-else type="info">已结算</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="求职者">{{ currentTask.workerName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ currentTask.workerPhone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="岗位名称">{{ currentTask.jobName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="企业名称">{{ currentTask.companyName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="薪资">{{ currentTask.salary || '-' }}</el-descriptions-item>
        <el-descriptions-item label="工作地点">{{ currentTask.address || '-' }}</el-descriptions-item>
        <el-descriptions-item label="工作时间">{{ currentTask.workTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ currentTask.createTime }}</el-descriptions-item>
        <el-descriptions-item label="汇报内容" :span="2">
          <div style="white-space: pre-wrap">{{ currentTask.reportContent || '暂无' }}</div>
        </el-descriptions-item>
        <el-descriptions-item label="核验备注" :span="2">{{ currentTask.remark || '暂无' }}</el-descriptions-item>
      </el-descriptions>
      <!-- 工作照片 -->
      <div v-if="currentTask?.photoPath" class="photo-section">
        <div class="photo-title">工作照片</div>
        <div class="photo-list">
          <el-image
            v-for="(photo, index) in currentTask.photoPath.split(',')"
            :key="index"
            :src="photo"
            :preview-src-list="currentTask.photoPath.split(',')"
            style="width: 120px; height: 120px; border-radius: 8px; margin-right: 8px"
            fit="cover"
          />
        </div>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- ========== 核验对话框 ========== -->
    <el-dialog v-model="verifyVisible" title="任务核验" width="500px" append-to-body>
      <el-form ref="verifyFormRef" :model="verifyForm" label-width="80px">
        <el-form-item label="核验结果">
          <el-radio-group v-model="verifyForm.status">
            <el-radio label="2">核验通过</el-radio>
            <el-radio label="3">核验拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="verifyForm.remark" type="textarea" :rows="3" placeholder="请输入核验备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="verifyVisible = false">取消</el-button>
        <el-button type="primary" @click="submitVerify">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Refresh } from '@element-plus/icons-vue';
import { listTask, getTaskStatistics, getTask, verifyTask } from '@/api/recruitment';

const loading = ref(false);
const total = ref(0);
const tableData = ref<any[]>([]);
const detailVisible = ref(false);
const verifyVisible = ref(false);
const currentTask = ref<any>(null);
const queryFormRef = ref();
const verifyFormRef = ref();
const timeRange = ref('7');

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  companyId: undefined as number | undefined,
  jobId: undefined as number | undefined,
  companyName: '',
  jobName: '',
  status: '',
});

const statistics = reactive({
  totalCount: 0,
  inProgressCount: 0,
  pendingVerifyCount: 0,
  verifiedCount: 0,
  rejectedCount: 0,
  settledCount: 0,
});

const verifyForm = reactive({
  taskId: 0 as number,
  status: '2',
  remark: '',
});

async function loadData() {
  loading.value = true;
  try {
    const res = await listTask(queryParams);
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
    const res = await getTaskStatistics();
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
  queryParams.companyId = undefined;
  queryParams.jobId = undefined;
  loadData();
}

function handleTimeRangeChange() {
  queryParams.pageNum = 1;
  loadData();
}

async function handleDetail(row: any) {
  try {
    const res = await getTask(row.taskId);
    currentTask.value = res.data;
    detailVisible.value = true;
  } catch (error) {
    ElMessage.error('获取任务详情失败');
  }
}

function handleVerify(row: any, status: string) {
  verifyForm.taskId = row.taskId;
  verifyForm.status = status;
  verifyForm.remark = '';
  verifyVisible.value = true;
}

async function submitVerify() {
  try {
    await verifyTask(verifyForm);
    ElMessage.success('核验成功');
    verifyVisible.value = false;
    loadData();
    loadStatistics();
  } catch (error) {
    ElMessage.error('核验失败');
  }
}

onMounted(() => {
  loadData();
  loadStatistics();
});
</script>

<style scoped>
.task-container {
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

/* 照片 */
.photo-section { margin-top: 16px; }
.photo-title { font-size: 14px; font-weight: 600; color: #303133; margin-bottom: 10px; }
.photo-list { display: flex; flex-wrap: wrap; gap: 8px; }

@media (max-width: 768px) {
  .stat-value { font-size: 20px; }
}
</style>
