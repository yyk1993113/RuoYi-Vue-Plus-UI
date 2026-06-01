<template>
  <div class="p-4">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="mb-4">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-mini-card">
          <div class="stat-mini">
            <span class="label">岗位总数</span>
            <span class="value">{{ statistics.totalCount || 0 }}</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-mini-card warning">
          <div class="stat-mini">
            <span class="label">待审核</span>
            <span class="value warning">{{ statistics.pendingCount || 0 }}</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-mini-card success">
          <div class="stat-mini">
            <span class="label">已上架</span>
            <span class="value success">{{ statistics.onlineCount || 0 }}</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-mini-card info">
          <div class="stat-mini">
            <span class="label">已下架</span>
            <span class="value info">{{ statistics.offlineCount || 0 }}</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 搜索栏 -->
    <el-card shadow="hover" class="mb-4">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true">
        <el-form-item label="岗位名称" prop="jobName">
          <el-input v-model="queryParams.jobName" placeholder="请输入岗位名称" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="所属企业" prop="companyName">
          <el-input v-model="queryParams.companyName" placeholder="请输入企业名称" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="岗位类型" prop="jobType">
          <el-select v-model="queryParams.jobType" placeholder="全部" clearable style="width: 120px">
            <el-option label="全职" value="0" />
            <el-option label="兼职" value="1" />
            <el-option label="临时工" value="2" />
            <el-option label="项目制" value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="推荐" prop="isRecommend">
          <el-select v-model="queryParams.isRecommend" placeholder="全部" clearable style="width: 100px">
            <el-option label="是" value="1" />
            <el-option label="否" value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="热门" prop="isHot">
          <el-select v-model="queryParams.isHot" placeholder="全部" clearable style="width: 100px">
            <el-option label="是" value="1" />
            <el-option label="否" value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="待审核" value="0" />
            <el-option label="已上架" value="1" />
            <el-option label="已下架" value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据表格 -->
    <el-card shadow="hover">
      <template #header>
        <el-row :gutter="10">
          <el-col :span="1.5">
            <el-button type="primary" plain icon="Refresh" @click="loadData">刷新</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Download" @click="handleExport">导出</el-button>
          </el-col>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="tableData" border stripe>
        <el-table-column label="岗位ID" prop="jobId" width="200" align="center" />
        <el-table-column label="岗位信息" min-width="250">
          <template #default="{ row }">
            <div class="job-info">
              <div class="job-header">
                <span class="job-name">{{ row.jobName }}</span>
                <el-tag v-if="row.jobType === '0'" type="success" size="small">全职</el-tag>
                <el-tag v-else-if="row.jobType === '1'" type="warning" size="small">兼职</el-tag>
                <el-tag v-else-if="row.jobType === '2'" type="danger" size="small">临时工</el-tag>
                <el-tag v-else size="small">项目制</el-tag>
              </div>
              <div class="job-salary">{{ row.salary }}</div>
              <div class="job-location">
                <el-icon><Location /></el-icon>
                {{ row.location || '未知地点' }}
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="所属企业" min-width="150">
          <template #default="{ row }">
            <div>{{ row.companyName || '-' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="投递人数" prop="applyCount" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="primary">{{ row.applyCount || 0 }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="推荐" width="80" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.isRecommend"
              active-value="1"
              inactive-value="0"
              @change="handleRecommendChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="热门" width="80" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.isHot"
              active-value="1"
              inactive-value="0"
              @change="handleHotChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.status === '0'" type="warning">待审核</el-tag>
            <el-tag v-else-if="row.status === '1'" type="success">已上架</el-tag>
            <el-tag v-else type="info">已下架</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="发布时间" prop="publishTime" width="160" align="center" />
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <div style="display: flex; align-items: center; justify-content: center; gap: 4px; flex-wrap: wrap;">
              <el-button link type="primary" icon="View" @click="handleDetail(row)">详情</el-button>
              <el-dropdown trigger="click">
                <span class="el-dropdown-link">
                  <el-button link type="primary">更多<el-icon class="el-icon--right"><arrow-down /></el-icon></el-button>
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item v-if="row.status === '0'" icon="CircleCheck" @click="handleAudit(row, '1')">审核通过</el-dropdown-item>
                    <el-dropdown-item v-if="row.status === '0'" icon="Close" @click="handleAudit(row, '2')">审核拒绝</el-dropdown-item>
                    <el-dropdown-item v-if="row.status === '1'" icon="Bottom" @click="handleStatusChange(row, '2')">下架</el-dropdown-item>
                    <el-dropdown-item v-if="row.status === '2'" icon="Top" @click="handleStatusChange(row, '1')">上架</el-dropdown-item>
                    <el-dropdown-item icon="Delete" @click="handleDelete(row)">删除</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
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

    <!-- 岗位详情对话框 -->
    <el-dialog v-model="detailVisible" title="岗位详情" width="700px" append-to-body>
      <el-descriptions :column="2" border v-if="currentJob">
        <el-descriptions-item label="岗位ID">{{ currentJob.jobId }}</el-descriptions-item>
        <el-descriptions-item label="岗位状态">
          <el-tag v-if="currentJob.status === '0'" type="warning">待审核</el-tag>
          <el-tag v-else-if="currentJob.status === '1'" type="success">已上架</el-tag>
          <el-tag v-else type="info">已下架</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="岗位名称" :span="2">{{ currentJob.jobName }}</el-descriptions-item>
        <el-descriptions-item label="岗位类型">
          <el-tag v-if="currentJob.jobType === '0'" type="success">全职</el-tag>
          <el-tag v-else-if="currentJob.jobType === '1'" type="warning">兼职</el-tag>
          <el-tag v-else-if="currentJob.jobType === '2'" type="danger">临时工</el-tag>
          <el-tag v-else>项目制</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="薪资范围">{{ currentJob.salary }}</el-descriptions-item>
        <el-descriptions-item label="工作地点" :span="2">{{ currentJob.location || '未知' }}</el-descriptions-item>
        <el-descriptions-item label="经验要求">
          <span v-if="currentJob.experience === '0'">经验不限</span>
          <span v-else-if="currentJob.experience === '1'">1年以下</span>
          <span v-else-if="currentJob.experience === '2'">1-3年</span>
          <span v-else-if="currentJob.experience === '3'">3-5年</span>
          <span v-else-if="currentJob.experience === '4'">5年以上</span>
        </el-descriptions-item>
        <el-descriptions-item label="投递人数">{{ currentJob.applyCount || 0 }}</el-descriptions-item>
        <el-descriptions-item label="企业名称">{{ currentJob.companyName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="发布时间">{{ currentJob.publishTime }}</el-descriptions-item>
        <el-descriptions-item label="岗位描述" :span="2">
          <div style="white-space: pre-wrap">{{ currentJob.description || '暂无描述' }}</div>
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentJob.remark || '暂无' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 审核对话框 -->
    <el-dialog v-model="auditVisible" title="岗位审核" width="500px" append-to-body>
      <el-form ref="auditFormRef" :model="auditForm" label-width="80px">
        <el-form-item label="审核结果">
          <el-radio-group v-model="auditForm.status">
            <el-radio label="1">审核通过（上架）</el-radio>
            <el-radio label="2">审核拒绝（下架）</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="auditForm.remark" type="textarea" :rows="3" placeholder="请输入审核备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAudit">确定</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup name="JobManagement" lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { listJob, getJobStatistics, getJob, auditJob, changeJobStatus, delJob, updateJob } from '@/api/recruitment';
import { download } from '@/utils/request';

const loading = ref(false);
const total = ref(0);
const tableData = ref<any[]>([]);
const detailVisible = ref(false);
const auditVisible = ref(false);
const currentJob = ref<any>(null);
const queryFormRef = ref();
const auditFormRef = ref();

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  jobName: '',
  jobType: '',
  status: '',
  companyName: '',
  isRecommend: '',
  isHot: ''
});

const statistics = reactive({
  totalCount: 0,
  pendingCount: 0,
  onlineCount: 0,
  offlineCount: 0
});

const auditForm = reactive({
  jobId: 0,
  status: '1',
  remark: ''
});

async function loadData() {
  loading.value = true;
  try {
    const res = await listJob(queryParams);
    tableData.value = res.rows || [];
    total.value = res.total || 0;
  } catch (error) {
    console.error('加载数据失败:', error);
  } finally {
    loading.value = false;
  }
}

async function loadStatistics() {
  try {
    const res = await getJobStatistics();
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
  queryParams.jobName = '';
  queryParams.jobType = '';
  queryParams.status = '';
  queryParams.companyName = '';
  queryParams.isRecommend = '';
  queryParams.isHot = '';
  loadData();
}

async function handleRecommendChange(row: any) {
  const text = row.isRecommend === '1' ? '推荐' : '取消推荐';
  try {
    await updateJob({ jobId: row.jobId, isRecommend: row.isRecommend });
    ElMessage.success(`${text}成功`);
  } catch (err) {
    row.isRecommend = row.isRecommend === '1' ? '0' : '1';
    ElMessage.error(`${text}失败`);
  }
}

async function handleHotChange(row: any) {
  const text = row.isHot === '1' ? '设为热门' : '取消热门';
  try {
    await updateJob({ jobId: row.jobId, isHot: row.isHot });
    ElMessage.success(`${text}成功`);
  } catch (err) {
    row.isHot = row.isHot === '1' ? '0' : '1';
    ElMessage.error(`${text}失败`);
  }
}

async function handleDetail(row: any) {
  try {
    const res = await getJob(row.jobId);
    currentJob.value = res.data;
    detailVisible.value = true;
  } catch (error) {
    ElMessage.error('获取岗位详情失败');
  }
}

function handleAudit(row: any, status: string) {
  auditForm.jobId = row.jobId;
  auditForm.status = status;
  auditForm.remark = '';
  auditVisible.value = true;
}

async function submitAudit() {
  try {
    await auditJob(auditForm);
    ElMessage.success('审核成功');
    auditVisible.value = false;
    loadData();
    loadStatistics();
  } catch (error) {
    ElMessage.error('审核失败');
  }
}

async function handleStatusChange(row: any, status: string) {
  const action = status === '1' ? '上架' : '下架';
  try {
    await ElMessageBox.confirm(`确认要${action}该岗位吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    await changeJobStatus({ jobId: row.jobId, status });
    ElMessage.success(`${action}成功`);
    loadData();
    loadStatistics();
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(`${action}失败`);
    }
  }
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm('确认要删除该岗位吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    await delJob(row.jobId);
    ElMessage.success('删除成功');
    loadData();
    loadStatistics();
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败');
    }
  }
}

onMounted(() => {
  loadData();
  loadStatistics();
});

function handleExport() {
  download('/admin/recruitment/job/export', queryParams, `岗位数据_${new Date().getTime()}.xlsx`);
}
</script>

<style scoped>
.mb-4 {
  margin-bottom: 16px;
}

.stat-mini-card {
  text-align: center;
}

.stat-mini {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 0;
}

.stat-mini .label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-mini .value {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
}

.stat-mini .value.warning {
  color: #E6A23C;
}

.stat-mini .value.success {
  color: #67C23A;
}

.stat-mini .value.info {
  color: #909399;
}

.job-info {
  padding: 4px 0;
}

.job-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.job-name {
  font-weight: 600;
  color: #303133;
}

.job-salary {
  color: #F56C6C;
  font-weight: 600;
  margin-top: 4px;
}

.job-location {
  color: #909399;
  font-size: 12px;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
