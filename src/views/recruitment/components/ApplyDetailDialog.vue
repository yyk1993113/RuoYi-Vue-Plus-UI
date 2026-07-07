<!--
  投递全景详情弹窗（可复用组件）
  - 数据来源：GET /admin/recruitment/apply2/detail（getApply2Detail）→ ApplyDetailVO（求职者/岗位/企业 + 状态流水/面试/交换/选用聚合）。
  - 用法：<ApplyDetailDialog ref="xxx" /> 然后 xxx.open(applyId) 打开。
  - 说明：从 apply.vue 的同款详情抽出为独立组件，供「投递管理」与「企业管理-投递人员弹窗」共用，避免重复维护。
-->
<template>
  <el-dialog v-model="visible" title="投递全景详情" width="900px" append-to-body class="custom-detail-dialog">
    <div v-if="detail" v-loading="detailLoading" class="detail-container">
      <!-- 头部概览：求职者 + 岗位 + 当前状态 -->
      <div class="header-section">
        <div class="header-left">
          <el-avatar :size="70" class="user-avatar">
            {{ (seeker.realName || seeker.userName || 'U').charAt(0) }}
          </el-avatar>
          <div class="user-info">
            <div class="top">
              <span class="name">{{ seeker.realName || seeker.nickName || seeker.userName || '未知用户' }}</span>
              <el-tag v-if="seeker.education" size="small" effect="plain" class="edu-tag">{{ seeker.education }}</el-tag>
              <el-tag v-if="seeker.isRecruitmentSilenced === '1'" size="small" type="danger" effect="dark">已禁言</el-tag>
            </div>
            <div class="job-title">{{ job.jobName || job.jobNo || '-' }}</div>
            <div class="company-sub">{{ company.companyName || company.companyNo || '-' }}</div>
          </div>
        </div>
        <div class="header-right">
          <div class="status-badge" :class="'status-' + detail.status">
            <div class="status-dot"></div>
            {{ detail.statusName || applyStatusMeta(detail.status).label }}
          </div>
          <div class="time-label">{{ formatTime(detail.applyTime) }} 投递</div>
        </div>
      </div>

      <el-divider />

      <div class="content-section">
        <el-row :gutter="24">
          <!-- 左侧：求职者背景 + 投递备注 -->
          <el-col :span="15">
            <div class="detail-block">
              <div class="block-title">
                <el-icon><CollectionTag /></el-icon> 个人背景
              </div>
              <div class="grid-info">
                <div class="grid-item">
                  <span class="label">工作年限</span>
                  <span class="value">{{ seeker.workYears != null ? seeker.workYears + ' 年' : '不可知' }}</span>
                </div>
                <div class="grid-item">
                  <span class="label">求职城市</span>
                  <span class="value">{{ seeker.city || '不限' }}</span>
                </div>
                <div class="grid-item">
                  <span class="label">期望职位</span>
                  <span class="value">{{ seeker.expectPosition || '暂无' }}</span>
                </div>
                <div class="grid-item">
                  <span class="label">手机号码</span>
                  <span class="value">{{ displayPhone(seeker) }}</span>
                </div>
                <div class="grid-item">
                  <span class="label">邮箱</span>
                  <span class="value">{{ seeker.email || '-' }}</span>
                </div>
                <div class="grid-item">
                  <span class="label">性别 / 年龄</span>
                  <span class="value">{{ seeker.sex || '-' }} / {{ seeker.age != null ? seeker.age : '-' }}</span>
                </div>
              </div>

              <div class="block-title mt-6">
                <el-icon><View /></el-icon> 技能标签
              </div>
              <div class="skill-tags">
                <el-tag v-for="item in splitToArray(seeker.skills)" :key="item" class="skill-tag" effect="light" round>
                  {{ item }}
                </el-tag>
                <span v-if="!seeker.skills" class="empty-text">暂无技能标签</span>
              </div>

              <div class="block-title mt-6">
                <el-icon><User /></el-icon> 个人简介
              </div>
              <div class="text-content">{{ seeker.summary || '该求职者很神秘，什么都没写~' }}</div>

              <div class="block-title mt-6">
                <el-icon><ChatLineRound /></el-icon> 投递备注
              </div>
              <div class="message-box">{{ detail.message || '无附加备注信息' }}</div>

              <!-- ① 状态流水 -->
              <div class="block-title mt-6">
                <el-icon><Histogram /></el-icon> 状态流水
              </div>
              <el-timeline v-if="detail.statusFlow && detail.statusFlow.length" class="flow-timeline">
                <el-timeline-item
                  v-for="(item, idx) in detail.statusFlow"
                  :key="idx"
                  :timestamp="formatTime(item.time)"
                  :type="flowDotType(item.node)"
                  placement="top"
                >
                  <div class="flow-title">{{ item.title }}</div>
                  <div v-if="item.content" class="flow-content">{{ item.content }}</div>
                  <el-tag size="small" effect="plain" class="flow-source">{{ item.source === 'apply' ? '系统' : '通知' }}</el-tag>
                </el-timeline-item>
              </el-timeline>
              <el-empty v-else description="暂无状态流水" :image-size="60" />

              <!-- ② 面试记录 -->
              <div class="block-title mt-6">
                <el-icon><Calendar /></el-icon> 面试记录
              </div>
              <div v-if="detail.interviews && detail.interviews.length" class="record-list">
                <div v-for="iv in detail.interviews" :key="iv.notificationId" class="record-item">
                  <div class="record-head">
                    <el-tag size="small" :type="iv.type === '2' ? 'primary' : 'success'">{{ iv.typeName || '面试' }}</el-tag>
                    <span class="record-title">{{ iv.title || '-' }}</span>
                    <el-tag size="small" effect="plain" :type="iv.isRead === '1' ? 'info' : 'warning'" class="ml-auto">
                      {{ iv.isRead === '1' ? '已读' : '未读' }}
                    </el-tag>
                  </div>
                  <div v-if="iv.content" class="record-body">{{ iv.content }}</div>
                  <div class="record-time">{{ formatTime(iv.time) }}</div>
                </div>
              </div>
              <el-empty v-else description="暂无面试记录" :image-size="60" />
            </div>
          </el-col>

          <!-- 右侧：岗位/企业信息 + 交换记录 + 选用结果 -->
          <el-col :span="9">
            <div class="sidebar-block">
              <div class="block-title">岗位信息</div>
              <div class="info-card">
                <div class="salary-box">{{ formatSalary(job.salaryMin, job.salaryMax, job.salaryUnit) }}</div>
                <div class="company-detail">
                  <p>
                    <el-icon><Briefcase /></el-icon> {{ job.jobName || '-' }}
                  </p>
                  <p>
                    <el-icon><Location /></el-icon> {{ job.workAddress || [job.city, job.district].filter(Boolean).join(' / ') || '-' }}
                  </p>
                  <p>
                    <el-icon><OfficeBuilding /></el-icon> {{ company.companyName || '-' }}
                  </p>
                  <p>
                    <el-icon><User /></el-icon> {{ company.contactPerson || '-' }}
                  </p>
                  <p>
                    <el-icon><Phone /></el-icon> {{ company.contactPhone || '-' }}
                  </p>
                </div>
              </div>

              <div class="block-title mt-6">流转信息</div>
              <ul class="meta-info">
                <li>
                  <span class="label">投递编号</span>
                  <span class="value">{{ detail.applyNo || '-' }}</span>
                </li>
                <li>
                  <span class="label">企业编号</span>
                  <span class="value">{{ company.companyNo || '-' }}</span>
                </li>
                <li>
                  <span class="label">已读状态</span>
                  <span class="value">
                    <el-tag size="small" :type="detail.isRead === '1' ? 'success' : 'warning'">
                      {{ detail.isRead === '1' ? '已阅' : '未阅' }}
                    </el-tag>
                  </span>
                </li>
                <li>
                  <span class="label">投递时间</span>
                  <span class="value">{{ formatDate(detail.applyTime) }}</span>
                </li>
              </ul>

              <!-- ③ 交换联系方式记录 -->
              <div class="block-title mt-6">交换联系方式记录</div>
              <div v-if="detail.exchangeRecords && detail.exchangeRecords.length" class="exchange-list">
                <div v-for="ex in detail.exchangeRecords" :key="ex.id" class="exchange-item">
                  <div class="exchange-head">
                    <el-tag size="small" effect="plain">{{ ex.exchangeType === 'wechat' ? '微信' : '手机号' }}</el-tag>
                    <el-tag size="small" :type="exchangeTagType(ex.status)">{{ ex.statusName || ex.status }}</el-tag>
                    <span class="exchange-initiator">{{ ex.initiator === 'B' ? '企业发起' : ex.initiator === 'C' ? '求职者发起' : '' }}</span>
                  </div>
                  <div class="exchange-contacts">
                    <div>B端：{{ ex.recruiterContact || '未提供' }}</div>
                    <div>C端：{{ ex.jobSeekerContact || '未提供' }}</div>
                  </div>
                  <div class="record-time">{{ formatTime(ex.createTime) }}</div>
                </div>
              </div>
              <el-empty v-else description="暂无交换记录" :image-size="50" />

              <!-- ④ 履约服务记录 -->
              <div class="block-title mt-6">履约服务记录</div>
              <div class="selection-box">
                <div class="selection-head">
                  <el-tag size="small" :type="detail.fulfillment && detail.fulfillment.selected ? 'success' : 'info'">
                    {{ detail.fulfillment && detail.fulfillment.selected ? '已录用' : '未录用' }}
                  </el-tag>
                  <span v-if="detail.fulfillment && detail.fulfillment.platformServiceName" class="selection-type">
                    {{ detail.fulfillment.platformServiceName }}
                  </span>
                </div>
                <div v-if="detail.fulfillment && detail.fulfillment.tasks && detail.fulfillment.tasks.length" class="task-list">
                  <div v-for="t in detail.fulfillment.tasks" :key="t.taskId" class="task-item">
                    <div class="task-head">
                      <span>{{ t.taskNo || '履约任务' }}</span>
                      <el-tag size="small" :type="taskTagType(t.status)">{{ t.statusName || t.status }}</el-tag>
                    </div>
                    <div class="task-meta">
                      <span v-if="t.workTime"
                        ><el-icon><Clock /></el-icon> {{ formatTime(t.workTime) }}</span
                      >
                      <span v-if="t.address"
                        ><el-icon><Location /></el-icon> {{ t.address }}</span
                      >
                    </div>
                    <div v-if="t.remark" class="task-remark">{{ t.remark }}</div>
                  </div>
                </div>
                <div v-else class="empty-text" style="margin-top: 8px">暂无关联兼职任务</div>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>
    </div>
    <el-empty v-else-if="!detailLoading" description="未获取到投递详情" :image-size="80" />
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">关闭窗口</el-button>
        <el-button type="primary" @click="handlePrint">打印资料</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { getApply2Detail } from '@/api/recruitment';
import type { ApplyDetailVO } from '@/api/recruitment';
import { splitToArray, formatSalary } from '../helpers';
import { applyStatusMeta } from '../constants';

const visible = ref(false);
const detailLoading = ref(false);
const detail = ref<ApplyDetailVO | null>(null);

// 详情 VO 的安全子对象访问（避免模板里到处判空）
const seeker = computed(() => detail.value?.jobSeeker || ({} as NonNullable<ApplyDetailVO['jobSeeker']>));
const company = computed(() => detail.value?.company || ({} as NonNullable<ApplyDetailVO['company']>));
const job = computed(() => detail.value?.job || ({} as NonNullable<ApplyDetailVO['job']>));

function displayPhone(row?: { phone?: string }) {
  return row?.phone || '-';
}

/** 对外暴露：按 applyId 打开并加载详情 */
const open = async (applyId?: number) => {
  if (!applyId) {
    ElMessage.warning('缺少投递信息，无法查看详情');
    return;
  }
  detail.value = null;
  visible.value = true;
  detailLoading.value = true;
  try {
    const res = await getApply2Detail(applyId);
    detail.value = res.data || null;
  } catch (error) {
    ElMessage.error('获取投递详情失败');
  } finally {
    detailLoading.value = false;
  }
};

defineExpose({ open });

// 状态流水节点 → 时间轴圆点配色
function flowDotType(node?: string) {
  switch (node) {
    case 'applied':
      return 'primary';
    case 'interview':
      return 'warning';
    case 'result':
      return 'success';
    case 'exchange':
      return 'info';
    default:
      return 'primary';
  }
}

// 交换状态 → 标签配色
function exchangeTagType(status?: string) {
  switch (status) {
    case 'exchanged':
      return 'success';
    case 'accepted':
      return 'primary';
    case 'rejected':
    case 'failed':
      return 'danger';
    default:
      return 'warning';
  }
}

// 任务状态 → 标签配色
function taskTagType(status?: string) {
  switch (status) {
    case '2':
    case '4':
      return 'success';
    case '3':
      return 'danger';
    case '1':
      return 'warning';
    default:
      return 'primary';
  }
}

// 时间格式化：后端返回 Date（ISO 字符串），统一裁成 yyyy-MM-dd HH:mm:ss
function formatTime(t?: string) {
  if (!t) return '-';
  return String(t).replace('T', ' ').slice(0, 19);
}

function formatDate(t?: string) {
  if (!t) return '-';
  return String(t).replace('T', ' ').slice(0, 10);
}

function handlePrint() {
  window.print();
}
</script>

<style scoped>
.ml-auto {
  margin-left: auto;
}

/* 对话框样式 */
:deep(.custom-detail-dialog) {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
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
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  background: #2b7fff;
  color: #fff;
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
  color: #2b7fff;
}

.user-info .job-title {
  font-size: 16px;
  color: #2b7fff;
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

.status-0 {
  background: #f4f4f5;
  color: #909399;
}
.status-1 {
  background: #ecf5ff;
  color: #2b7fff;
}
.status-2 {
  background: #f0f9eb;
  color: #67c23a;
}
.status-3 {
  background: #fef0f0;
  color: #f56c6c;
}

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
  color: #2b7fff;
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

/* 状态流水时间轴 */
.flow-timeline {
  padding-left: 4px;
}
.flow-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}
.flow-content {
  font-size: 13px;
  color: #606266;
  margin-top: 2px;
}
.flow-source {
  margin-top: 4px;
}

/* 面试记录 / 通用记录列表 */
.record-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.record-item {
  background: #f8f9fb;
  border-radius: 10px;
  padding: 12px 14px;
}
.record-head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.record-title {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
}
.record-body {
  font-size: 13px;
  color: #606266;
  margin-top: 6px;
  line-height: 1.5;
}
.record-time {
  font-size: 12px;
  color: #c0c4cc;
  margin-top: 6px;
}

/* 侧边栏 */
.sidebar-block {
  background: #fff;
}

.info-card {
  background: linear-gradient(135deg, #2b7fff 0%, #1c6cf0 100%);
  padding: 20px;
  border-radius: 14px;
  color: #fff;
  margin-bottom: 8px;
  box-shadow: 0 8px 20px rgba(43, 127, 255, 0.2);
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

.meta-info .label {
  color: #909399;
}
.meta-info .value {
  font-weight: 500;
  color: #303133;
}

/* 交换记录 */
.exchange-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.exchange-item {
  background: #f0f9eb;
  border-radius: 10px;
  padding: 12px 14px;
}
.exchange-head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.exchange-initiator {
  font-size: 12px;
  color: #909399;
}
.exchange-contacts {
  font-size: 13px;
  color: #529b2e;
  margin-top: 8px;
  word-break: break-all;
  line-height: 1.5;
}

/* 选用记录 */
.selection-box {
  background: #f8f9fb;
  border-radius: 10px;
  padding: 12px 14px;
}
.selection-head {
  display: flex;
  align-items: center;
  gap: 10px;
}
.selection-type {
  font-size: 13px;
  color: #606266;
  font-weight: 600;
}
.task-list {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.task-item {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 10px 12px;
}
.task-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 600;
  color: #303133;
}
.task-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 12px;
  color: #909399;
  margin-top: 6px;
}
.task-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}
.task-remark {
  font-size: 12px;
  color: #606266;
  margin-top: 6px;
}

.mt-6 {
  margin-top: 28px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
