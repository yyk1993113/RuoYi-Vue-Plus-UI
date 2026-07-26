<template>
  <!--
    履约管理（运营/平台方视角）。
    定位：全租户履约「鹰眼」——看得全、能预警、可追溯、可导出；并支持「平台代核验」对企业未及时处理的
    待核验任务代企业核验（行为对齐企业端，强制写运营审计）。
    数据来源：AdminRecruitmentController /admin/recruitment/task/{list,abnormal-statistics,statistics,{id},verify}。
  -->
  <div class="task-container">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <span class="page-title">履约管理</span>
        <el-tag size="small" type="warning" effect="plain">平台代核验</el-tag>
      </div>
      <div class="toolbar-right">
        <el-button icon="Download" @click="handleExport">导出</el-button>
        <el-button :icon="Refresh" circle @click="refresh" :loading="loading" />
      </div>
    </div>

    <!-- ========== 异常预警条（点指标按异常类型筛选；阈值默认 待确认2天/待核验3天/完成未结算7天）========== -->
    <el-card shadow="never" class="warn-strip mb-3">
      <div class="warn-strip-inner">
        <span class="warn-strip-title"
          ><el-icon><Warning /></el-icon> 异常预警</span
        >
        <div class="warn-items">
          <span
            v-for="card in abnormalCards"
            :key="card.type"
            class="warn-item"
            :class="[card.cls, { active: queryParams.abnormalType === card.type }]"
            @click="handleWarnCard(card)"
          >
            {{ card.label }}<b>{{ abnormalStat[card.field] || 0 }}</b
            ><i v-if="card.hint">{{ card.hint }}</i>
          </span>
        </div>
        <el-button v-if="queryParams.abnormalType" link type="primary" @click="toggleAbnormal(queryParams.abnormalType)">清除异常筛选</el-button>
      </div>
    </el-card>

    <!-- ========== 状态概览（点卡片按状态筛选；7 项等宽一行，窄屏自动换行，避免 el-col 整除不尽造成错位）========== -->
    <div class="status-cards mb-3">
      <el-card
        v-for="card in statusCards"
        :key="card.key"
        shadow="hover"
        class="stat-card"
        :class="{ active: card.value !== '' ? queryParams.status === card.value : !queryParams.status && !queryParams.abnormalType }"
        @click="filterByStatus(card.value)"
      >
        <div class="stat-value" :class="card.cls">{{ statistics[card.field] || 0 }}</div>
        <div class="stat-label">{{ card.label }}</div>
      </el-card>
    </div>

    <!-- ========== 搜索栏 ========== -->
    <el-card shadow="hover" class="mb-3">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true">
        <el-form-item label="企业" prop="companyName">
          <el-input v-model="queryParams.companyName" placeholder="请输入企业名称" clearable style="width: 160px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="岗位" prop="jobName">
          <el-input v-model="queryParams.jobName" placeholder="请输入岗位名称" clearable style="width: 160px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 130px">
            <el-option v-for="s in statusOptions" :key="s.value" :label="s.label" :value="s.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="创建时间">
          <!-- 传后端 beginTime/endTime（'yyyy-MM-dd HH:mm:ss'），过滤 task.create_time -->
          <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 360px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- ========== 数据表格（只读：仅「详情」）========== -->
    <el-card shadow="hover">
      <el-table v-loading="loading" :data="tableData" border stripe>
        <el-table-column label="履约编号" prop="taskNo" width="190" align="center" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.taskNo || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="求职者信息" min-width="150">
          <template #default="{ row }">
            <div class="user-cell">
              <el-avatar :size="34" :src="row.workerAvatar" style="background: #67c23a; flex-shrink: 0">
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
              <div class="salary">{{ formatSalary(row.salaryMin, row.salaryMax, row.salaryUnit) }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="企业" prop="companyName" min-width="120" show-overflow-tooltip />
        <el-table-column label="工作地点" prop="address" min-width="120" show-overflow-tooltip />
        <el-table-column label="工作时间" width="180" align="center" show-overflow-tooltip>
          <template #default="{ row }">{{ formatTaskWorkTime(row) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="taskStatusMeta(row.status).type" size="small">{{ taskStatusMeta(row.status).label }}</el-tag>
          </template>
        </el-table-column>
        <!-- 异常列：前端按默认阈值给出超时提示（仅展示；权威计数/筛选以服务端为准） -->
        <el-table-column label="异常" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="rowAbnormal(row)" :type="taskAbnormalMeta(rowAbnormal(row)).type" size="small" effect="dark">
              {{ taskAbnormalMeta(rowAbnormal(row)).label }}
            </el-tag>
            <span v-else class="muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" icon="View" @click="handleDetail(row)">详情</el-button>
            <!-- 平台代核验：仅「待核验」可操作（与企业端口径一致） -->
            <el-button v-if="row.status === 'submitted'" link type="warning" icon="EditPen" @click="openVerify(row)">代核验</el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="loadData" />
    </el-card>

    <!-- ========== 任务详情对话框（只读：基础信息 + 状态流水 + 三段照片 + 资金主线）========== -->
    <el-dialog v-model="detailVisible" title="履约任务详情" width="820px" top="6vh" append-to-body>
      <div v-loading="detailLoading">
        <template v-if="currentTask">
          <!-- 基础信息 -->
          <el-descriptions :column="2" border>
            <el-descriptions-item label="履约编号">{{ currentTask.taskNo || currentTask.taskId || '-' }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="taskStatusMeta(currentTask.status).type">{{ taskStatusMeta(currentTask.status).label }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="求职者">{{ currentTask.workerName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="联系电话">{{ currentTask.workerPhone || '-' }}</el-descriptions-item>
            <el-descriptions-item label="岗位名称">{{ currentTask.jobName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="企业名称">{{ currentTask.companyName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="薪资">{{
              formatSalary(currentTask.salaryMin, currentTask.salaryMax, currentTask.salaryUnit)
            }}</el-descriptions-item>
            <el-descriptions-item label="工作地点">{{ currentTask.address || '-' }}</el-descriptions-item>
            <el-descriptions-item label="工作时间">{{ formatTaskWorkTime(currentTask) }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatDateTime(currentTask.createTime) }}</el-descriptions-item>
          </el-descriptions>

          <!-- 退回原因（已退回时高亮） -->
          <el-alert
            v-if="currentTask.status === 'rejected' && currentTask.remark"
            class="mt-3"
            type="error"
            :closable="false"
            title="退回原因"
            :description="currentTask.remark"
          />

          <!-- 状态流水 -->
          <div class="section">
            <div class="section-title">状态流水</div>
            <el-timeline>
              <el-timeline-item
                v-for="(step, i) in statusTimeline"
                :key="i"
                :type="step.type"
                :hollow="!step.done"
                :timestamp="step.time"
                placement="top"
              >
                <span :class="{ 'step-done': step.done }">{{ step.label }}</span>
              </el-timeline-item>
            </el-timeline>
          </div>

          <!-- 履约照片（按到岗/中途/完工三段分组） -->
          <div class="section">
            <div class="section-title">履约照片</div>
            <div v-if="allPhotos.length">
              <div v-for="group in photoGroups" :key="group.title" class="photo-group">
                <div class="photo-group-label">
                  {{ group.title }}<span class="muted">（{{ group.list.length }}）</span>
                </div>
                <div class="photo-list">
                  <el-image
                    v-for="(photo, idx) in group.list"
                    :key="idx"
                    :src="photo"
                    :preview-src-list="allPhotos"
                    :initial-index="allPhotos.indexOf(photo)"
                    fit="cover"
                    class="photo-thumb"
                  />
                  <span v-if="!group.list.length" class="muted">无</span>
                </div>
              </div>
            </div>
            <div v-else class="muted">暂无履约照片</div>
          </div>

          <!-- 工作汇报 -->
          <div class="section">
            <div class="section-title">工作汇报</div>
            <div class="report-content">{{ currentTask.reportContent || '暂无工作汇报' }}</div>
          </div>

          <!-- 资金主线（只读：核验工时/结算金额 → 关联台账 → 发票状态） -->
          <div class="section">
            <div class="section-title">结算信息（资金主线）</div>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="核验工时">{{
                currentTask.workHours != null ? currentTask.workHours + ' 小时' : '-'
              }}</el-descriptions-item>
              <el-descriptions-item label="结算金额">
                <span class="amount">{{ currentTask.settleAmount != null ? '¥' + formatMoney(currentTask.settleAmount) : '-' }}</span>
              </el-descriptions-item>
              <template v-if="currentTask.ledgerId">
                <el-descriptions-item label="台账编号">
                  <el-button link type="primary" @click="goLedger(currentTask.orderNo)">{{ currentTask.orderNo || '查看台账' }}</el-button>
                </el-descriptions-item>
                <el-descriptions-item label="结算状态">
                  <el-tag :type="ledgerStatusMeta(currentTask.ledgerStatus).type">{{ ledgerStatusMeta(currentTask.ledgerStatus).label }}</el-tag>
                  <el-button
                    v-if="String(currentTask.ledgerStatus) === '0'"
                    class="ml-2"
                    link
                    type="success"
                    @click="goPendingLedger(currentTask.orderNo)"
                    >去结算</el-button
                  >
                </el-descriptions-item>
                <el-descriptions-item label="发票状态" :span="2">
                  <el-tag :type="ledgerInvoiceStatusMeta(currentTask.ledgerInvoiceStatus).type">{{
                    ledgerInvoiceStatusMeta(currentTask.ledgerInvoiceStatus).label
                  }}</el-tag>
                  <el-button class="ml-2" link type="primary" @click="goInvoice">查看发票</el-button>
                </el-descriptions-item>
              </template>
              <el-descriptions-item v-else label="台账" :span="2">
                <span class="muted">该任务尚未生成结算台账</span>
                <el-tag v-if="currentTask.status === 'completed'" class="ml-2" type="danger" size="small" effect="plain">完成未结算</el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </template>
      </div>
      <template #footer>
        <el-button v-if="currentTask && currentTask.status === 'submitted'" type="warning" icon="EditPen" @click="openVerify(currentTask)"
          >代核验</el-button
        >
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- ========== 平台代核验对话框（行为对齐企业端：通过录工时+金额，驳回填原因）========== -->
    <el-dialog v-model="verifyVisible" title="平台代核验" width="520px" append-to-body @closed="resetVerifyForm">
      <el-alert
        class="mb-3"
        type="warning"
        :closable="false"
        show-icon
        title="平台代企业核验，操作将记入运营审计；请仅在企业长时间未处理等异常场景使用。"
      />
      <el-form ref="verifyFormRef" :model="verifyForm" :rules="verifyRules" label-width="90px">
        <el-form-item label="核验结果" prop="status">
          <el-radio-group v-model="verifyForm.status">
            <el-radio value="completed">通过</el-radio>
            <el-radio value="rejected">驳回</el-radio>
          </el-radio-group>
        </el-form-item>
        <template v-if="verifyForm.status === 'completed'">
          <el-form-item label="核验工时" prop="workHours">
            <el-input-number v-model="verifyForm.workHours" :min="0.5" :precision="2" :step="0.5" controls-position="right" style="width: 200px" />
            <span class="unit">小时</span>
          </el-form-item>
          <el-form-item label="结算金额" prop="settleAmount">
            <el-input-number v-model="verifyForm.settleAmount" :min="0" :precision="2" :step="10" controls-position="right" style="width: 200px" />
            <span class="unit">元</span>
          </el-form-item>
          <el-form-item label="验收备注">
            <el-input v-model="verifyForm.remark" type="textarea" :rows="2" maxlength="200" show-word-limit placeholder="选填" />
          </el-form-item>
        </template>
        <el-form-item v-else label="驳回原因" prop="remark">
          <el-input v-model="verifyForm.remark" type="textarea" :rows="3" maxlength="200" show-word-limit placeholder="请填写驳回原因（必填）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="verifyVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitVerify">确认代核验</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, type FormRules } from 'element-plus';
import { Refresh, Clock, Warning, Money } from '@element-plus/icons-vue';
import { listTask, getTaskStatistics, getTaskAbnormalStatistics, getTask, verifyTask, taskExportUrl, listLedger } from '@/api/recruitment';
import { listByIds } from '@/api/system/oss';
import { download } from '@/utils/request';
import { unwrapList, splitToArray, formatSalary, formatMoney, formatDateTime } from './helpers';
import { taskStatusMeta, taskAbnormalMeta, ledgerStatusMeta, ledgerInvoiceStatusMeta } from './constants';

const router = useRouter();
const route = useRoute();

const loading = ref(false);
const detailLoading = ref(false);
const total = ref(0);
const tableData = ref<any[]>([]);
const detailVisible = ref(false);
const currentTask = ref<any>(null);
const photoUrlMap = ref<Record<string, string>>({});
const queryFormRef = ref();
// 平台代核验
const verifyVisible = ref(false);
const submitting = ref(false);
const verifyFormRef = ref();
const verifyForm = reactive({
  taskId: 0 as number,
  status: 'completed',
  workHours: undefined as number | undefined,
  settleAmount: undefined as number | undefined,
  remark: ''
});
// 通过时工时/金额必填；驳回时原因必填（与企业端口径一致）
const verifyRules: FormRules = {
  workHours: [{ required: true, message: '请填写核验工时', trigger: 'change' }],
  settleAmount: [{ required: true, message: '请填写结算金额', trigger: 'change' }],
  remark: [
    {
      validator: (_r, val, cb) => (verifyForm.status === 'rejected' && !String(val || '').trim() ? cb(new Error('请填写驳回原因')) : cb()),
      trigger: 'blur'
    }
  ]
};
// 创建时间区间（el-date-picker datetimerange），提交时拆成 beginTime/endTime
const dateRange = ref<[string, string] | []>([]);

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  taskId: undefined as string | number | undefined,
  companyId: undefined as number | undefined,
  jobId: undefined as number | undefined,
  companyName: '',
  jobName: '',
  status: '',
  beginTime: '',
  endTime: '',
  abnormalType: '' // 与 status 互斥：选异常类型时清空 status，反之亦然
});

const statistics = reactive<Record<string, number>>({
  totalCount: 0,
  pendingConfirm: 0,
  inProgress: 0,
  submitted: 0,
  completed: 0,
  rejected: 0,
  cancelled: 0
});

// 异常统计（只读预警），字段对应后端 TaskAbnormalStatVO
const abnormalStat = reactive<Record<string, number>>({
  pendingTimeout: 0,
  verifyTimeout: 0,
  pendingSettlement: 0,
  completedUnsettled: 0
});

// 异常预警卡定义：履约异常走 task abnormalType；待结算提醒来自台账 status=0，并跳到台账页处理。
const abnormalCards = [
  { type: 'pending_timeout', field: 'pendingTimeout', label: '待确认超时', hint: '>2天', icon: Clock, cls: 'warn-orange' },
  { type: 'verify_timeout', field: 'verifyTimeout', label: '待核验超时', hint: '催企业核验', icon: Warning, cls: 'warn-red' },
  { type: 'settlement_pending', field: 'pendingSettlement', label: '待结算提醒', hint: '去结算', icon: Money, cls: 'warn-green' },
  { type: 'completed_unsettled', field: 'completedUnsettled', label: '完成未结算', hint: '>7天', icon: Money, cls: 'warn-red' }
];

// 状态概览卡定义（点选 → status 筛选；value 空串=全部）
const statusCards = [
  { key: 'all', value: '', field: 'totalCount', label: '任务总数', cls: '' },
  { key: 'pending_confirm', value: 'pending_confirm', field: 'pendingConfirm', label: '待确认', cls: 'warning' },
  { key: 'in_progress', value: 'in_progress', field: 'inProgress', label: '进行中', cls: 'primary' },
  { key: 'submitted', value: 'submitted', field: 'submitted', label: '待核验', cls: 'warning' },
  { key: 'completed', value: 'completed', field: 'completed', label: '已完成', cls: 'success' },
  { key: 'rejected', value: 'rejected', field: 'rejected', label: '已退回', cls: 'danger' },
  { key: 'cancelled', value: 'cancelled', field: 'cancelled', label: '已取消', cls: 'info' }
];

const statusOptions = [
  { value: 'pending_confirm', label: '待确认' },
  { value: 'in_progress', label: '进行中' },
  { value: 'submitted', label: '待核验' },
  { value: 'rejected', label: '已退回' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' }
];

function formatWorkTimeItem(item: any): string {
  if (item == null) return '';
  if (typeof item === 'string') return item.trim();
  const day = item.day ?? item.week ?? item.date ?? item.label ?? item.name ?? '';
  const start = item.start ?? item.startTime ?? item.from ?? item.begin ?? '';
  const end = item.end ?? item.endTime ?? item.to ?? '';
  const range = start || end ? `${start}${start && end ? '-' : ''}${end}` : '';
  const text = `${day}${day && range ? ' ' : ''}${range}`.trim();
  return text || JSON.stringify(item);
}

function formatWorkSchedule(value: any): string {
  if (value == null || value === '') return '';
  if (Array.isArray(value)) return value.map(formatWorkTimeItem).filter(Boolean).join('；');
  const text = String(value).trim();
  if (!text) return '';
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed.map(formatWorkTimeItem).filter(Boolean).join('；');
    return formatWorkTimeItem(parsed);
  } catch {
    return text;
  }
}

// 履约详情优先展示任务约定/岗位快照排期；workTime 是 Date 兜底，不再把排期 JSON 当日期吞成空值。
function formatTaskWorkTime(task: any): string {
  const schedule = formatWorkSchedule(task?.agreedWorkSchedule) || formatWorkSchedule(task?.workSchedule) || formatWorkSchedule(task?.workTime);
  const start = task?.agreedStartTime ? formatDateTime(task.agreedStartTime) : '';
  const end = task?.agreedEndTime ? formatDateTime(task.agreedEndTime) : '';
  const agreedRange = start || end ? `${start || '-'} 至 ${end || '-'}` : '';
  if (schedule && agreedRange) return `${schedule}（${agreedRange}）`;
  return schedule || agreedRange || '-';
}

function splitPhotoValues(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => String(item?.url ?? item?.ossId ?? item?.id ?? item).trim()).filter(Boolean);
  }
  const text = String(value).trim();
  if (!text) return [];
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return splitPhotoValues(parsed);
    const single = parsed?.url ?? parsed?.ossId ?? parsed?.id;
    return single ? [String(single).trim()] : [];
  } catch {
    return splitToArray(text);
  }
}

const isOssId = (value: string) => /^\d+$/.test(value);

function normalizePhotoUrl(value: string): string {
  if (!value) return '';
  if (isOssId(value)) return photoUrlMap.value[value] || '';
  if (/^https?:\/\//i.test(value) || /^data:/i.test(value) || /^blob:/i.test(value)) return value;
  if (value.startsWith('//')) return `${window.location.protocol}${value}`;
  const baseUrl = import.meta.env.VITE_APP_BASE_API || '';
  if (baseUrl && value.startsWith(baseUrl)) return value;
  return `${baseUrl}${value.startsWith('/') ? value : `/${value}`}`;
}

function resolvePhotoList(value: any): string[] {
  return splitPhotoValues(value).map(normalizePhotoUrl).filter(Boolean);
}

async function loadTaskPhotoUrls(task: any) {
  photoUrlMap.value = {};
  const idSet = new Set<string>();
  ['arrivalPhotos', 'midPhotos', 'finishPhotos'].forEach((field) => {
    splitPhotoValues(task?.[field]).forEach((token) => {
      if (isOssId(token)) idSet.add(token);
    });
  });
  if (!idSet.size) return;
  try {
    const res = await listByIds(Array.from(idSet).join(','));
    const map: Record<string, string> = {};
    (res.data || []).forEach((file: any) => {
      if (file?.ossId && file?.url) map[String(file.ossId)] = file.url;
    });
    photoUrlMap.value = map;
  } catch (error) {
    console.error('解析履约照片失败:', error);
  }
}

// 详情：三段履约照片分组 + 合并预览列表
const photoGroups = computed(() => {
  const t = currentTask.value || {};
  return [
    { title: '到岗照片', list: resolvePhotoList(t.arrivalPhotos) },
    { title: '中途照片', list: resolvePhotoList(t.midPhotos) },
    { title: '完工照片', list: resolvePhotoList(t.finishPhotos) }
  ];
});
const allPhotos = computed(() => photoGroups.value.flatMap((g) => g.list));

// 详情：状态流水时间线。后端 VO 无逐步时间戳，故按当前 status 推进 done/todo（与企业端一致），以创建/更新时间为锚。
const statusTimeline = computed(() => {
  const t = currentTask.value || {};
  const s = t.status;
  // type 收窄为 el-timeline-item 接受的语义色，避免被推断成宽松 string
  type TlType = 'primary' | 'success' | 'warning' | 'danger' | 'info';
  const steps: { label: string; time?: string; type: TlType; done: boolean }[] = [];
  const nodeTime = (done: boolean, keys: string[], fallbackKeys: string[] = []) => {
    if (!done) return '-';
    for (const key of [...keys, ...fallbackKeys]) {
      if (t[key]) return formatDateTime(t[key]);
    }
    return '-';
  };
  steps.push({ label: '生成任务', time: formatDateTime(t.createTime), type: 'primary', done: true });
  const confirmed = !!s && !['pending_confirm', 'cancelled'].includes(s);
  steps.push({ label: '确认承接', type: confirmed ? 'success' : 'info', done: confirmed });
  const working = ['in_progress', 'submitted', 'rejected', 'completed'].includes(s);
  steps.push({ label: '履约进行中', type: working ? 'success' : 'info', done: working });
  const submitted = ['submitted', 'rejected', 'completed'].includes(s);
  steps.push({ label: '提交核验', type: submitted ? 'success' : 'info', done: submitted });
  if (s === 'completed') steps.push({ label: '已完成', time: formatDateTime(t.updateTime), type: 'success', done: true });
  else if (s === 'rejected') steps.push({ label: '已退回（待求职者补充）', time: formatDateTime(t.updateTime), type: 'danger', done: true });
  else if (s === 'cancelled') steps.push({ label: '已取消', time: formatDateTime(t.updateTime), type: 'info', done: true });
  else steps.push({ label: '待核验 / 完成', type: 'info', done: false });
  steps[0].time = nodeTime(true, ['createTime']);
  if (steps[1]) steps[1].time = nodeTime(steps[1].done, ['confirmedTime', 'confirmTime', 'acceptedTime', 'acceptTime'], ['updateTime', 'createTime']);
  if (steps[2]) {
    steps[2].time = nodeTime(
      steps[2].done,
      ['startTime', 'beginTime', 'workStartTime', 'arrivalTime', 'arriveTime', 'agreedStartTime'],
      ['updateTime', 'createTime']
    );
  }
  if (steps[3])
    steps[3].time = nodeTime(steps[3].done, ['submitTime', 'submittedTime', 'verifySubmitTime', 'reportTime'], ['updateTime', 'createTime']);
  if (steps[4] && (!steps[4].time || steps[4].time === '-')) {
    steps[4].time = nodeTime(
      steps[4].done,
      ['completedTime', 'finishTime', 'rejectedTime', 'rejectTime', 'cancelledTime', 'cancelTime'],
      ['updateTime', 'createTime']
    );
  }
  return steps.map((step) => ({ ...step, time: step.time || '-' }));
});

// 列表「异常」列：前端用与服务端相同的默认阈值给出超时提示（仅展示提示，权威以服务端筛选/计数为准）。
function rowAbnormal(row: any): string {
  const now = Date.now();
  const toMs = (v?: string) => (v ? new Date(String(v).replace(/-/g, '/')).getTime() : 0);
  const days = (ms: number) => (ms ? (now - ms) / 86400000 : 0);
  if (row.status === 'pending_confirm' && days(toMs(row.createTime)) > 2) return 'pending_timeout';
  if (row.status === 'submitted' && days(toMs(row.updateTime)) > 3) return 'verify_timeout';
  // 待结算由最新台账 ledgerStatus=0 派生，直接提示运营去台账页完成结算闭环。
  if (row.status === 'completed' && String(row.ledgerStatus) === '0') return 'settlement_pending';
  if (row.status === 'completed' && !row.ledgerId && days(toMs(row.createTime)) > 7) return 'completed_unsettled';
  return '';
}

async function loadData() {
  loading.value = true;
  try {
    // 时间区间拆分注入查询参数
    queryParams.beginTime = dateRange.value?.[0] || '';
    queryParams.endTime = dateRange.value?.[1] || '';
    const res = await listTask(queryParams);
    const list = unwrapList(res);
    tableData.value = list.rows;
    total.value = list.total;
  } catch (error) {
    console.error('加载履约任务失败:', error);
  } finally {
    loading.value = false;
  }
}

async function loadStatistics() {
  try {
    const res = await getTaskStatistics();
    Object.assign(statistics, res.data || {});
  } catch (error) {
    console.error('加载履约统计失败:', error);
  }
}

async function loadAbnormal() {
  try {
    const [taskRes, pendingLedgerRes] = await Promise.all([
      getTaskAbnormalStatistics(),
      // 后端尚未把待结算数并入 TaskAbnormalStatVO；这里复用台账列表 total 做准确数量提醒。
      listLedger({ pageNum: 1, pageSize: 1, status: '0' } as any)
    ]);
    Object.assign(abnormalStat, taskRes.data || {});
    abnormalStat.pendingSettlement = unwrapList(pendingLedgerRes).total;
  } catch (error) {
    console.error('加载异常统计失败:', error);
  }
}

// 统一刷新：列表 + 状态统计 + 异常统计
function refresh() {
  loadData();
  loadStatistics();
  loadAbnormal();
}

// 打开平台代核验对话框（仅待核验任务）
function openVerify(row: any) {
  verifyForm.taskId = row.taskId;
  verifyForm.status = 'completed';
  verifyForm.workHours = row.workHours ?? undefined;
  verifyForm.settleAmount = row.settleAmount ?? undefined;
  verifyForm.remark = '';
  verifyVisible.value = true;
}

function resetVerifyForm() {
  verifyFormRef.value?.clearValidate();
}

async function submitVerify() {
  // 仅在「通过」时校验工时/金额；「驳回」时校验原因（rules 已按 status 区分）
  const fieldsToCheck = verifyForm.status === 'completed' ? ['workHours', 'settleAmount'] : ['remark'];
  try {
    await verifyFormRef.value?.validateField(fieldsToCheck);
  } catch {
    return;
  }
  submitting.value = true;
  try {
    await verifyTask({
      taskId: verifyForm.taskId,
      status: verifyForm.status,
      remark: verifyForm.remark?.trim() || undefined,
      workHours: verifyForm.status === 'completed' ? verifyForm.workHours : undefined,
      settleAmount: verifyForm.status === 'completed' ? verifyForm.settleAmount : undefined
    });
    ElMessage.success(verifyForm.status === 'completed' ? '已代核验通过' : '已代核验驳回');
    verifyVisible.value = false;
    detailVisible.value = false;
    refresh();
  } catch (error) {
    ElMessage.error('代核验失败');
  } finally {
    submitting.value = false;
  }
}

function handleQuery() {
  queryParams.pageNum = 1;
  loadData();
}

function resetQuery() {
  queryFormRef.value?.resetFields();
  dateRange.value = [];
  Object.assign(queryParams, {
    pageNum: 1,
    taskId: undefined,
    companyId: undefined,
    jobId: undefined,
    companyName: '',
    jobName: '',
    status: '',
    beginTime: '',
    endTime: '',
    abnormalType: ''
  });
  loadData();
}

// 点状态卡：按状态筛选（清空异常筛选，二者互斥）
function filterByStatus(status: string) {
  queryParams.status = status;
  queryParams.abnormalType = '';
  queryParams.pageNum = 1;
  loadData();
}

// 点异常卡：再次点击同一类型则取消筛选；选中时清空 status
function toggleAbnormal(type: string) {
  queryParams.abnormalType = queryParams.abnormalType === type ? '' : type;
  if (queryParams.abnormalType) queryParams.status = '';
  queryParams.pageNum = 1;
  loadData();
}

// 预警条入口分流：待结算是资金台账待办，先跳台账页；其它异常留在履约列表内筛选。
function handleWarnCard(card: any) {
  if (card.type === 'settlement_pending') {
    goPendingLedger();
    return;
  }
  toggleAbnormal(card.type);
}

// 导出：复用全局 download（POST + 当前筛选条件），后端 /export/task 已就绪
function handleExport() {
  queryParams.beginTime = dateRange.value?.[0] || '';
  queryParams.endTime = dateRange.value?.[1] || '';
  download(taskExportUrl, { ...queryParams }, `履约任务_${new Date().getTime()}.xlsx`);
}

async function handleDetail(row: any) {
  detailVisible.value = true;
  detailLoading.value = true;
  currentTask.value = null;
  try {
    const res = await getTask(row.taskId);
    currentTask.value = res.data;
    await loadTaskPhotoUrls(currentTask.value);
  } catch (error) {
    ElMessage.error('获取任务详情失败');
    detailVisible.value = false;
  } finally {
    detailLoading.value = false;
  }
}

// 资金主线跳转：台账页按订单号检索 / 发票页
function goLedger(orderNo?: string) {
  router.push({ path: '/recruitment/ledger', query: orderNo ? { orderNo } : {} });
}
function goPendingLedger(orderNo?: string) {
  router.push({ path: '/recruitment/ledger', query: { status: '0', ...(orderNo ? { orderNo } : {}) } });
}
function goInvoice() {
  router.push('/recruitment/invoice');
}

async function applyRouteFocus() {
  const qTaskId = route.query.taskId;
  if (typeof qTaskId === 'string' && qTaskId) {
    queryParams.taskId = qTaskId;
    await handleDetail({ taskId: qTaskId });
  }
}

function handleBusinessEvent(event: Event) {
  const detail = (event as CustomEvent).detail;
  if (detail?.type !== 'fulfillment_task_verified') return;
  refresh();
}

onMounted(() => {
  window.addEventListener('business-event', handleBusinessEvent);
  applyRouteFocus();
  refresh();
});

onBeforeUnmount(() => {
  window.removeEventListener('business-event', handleBusinessEvent);
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
.toolbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.page-title {
  font-size: 18px;
  font-weight: 700;
  color: #303133;
}
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mb-3 {
  margin-bottom: 14px;
}
.mt-3 {
  margin-top: 14px;
}
.ml-2 {
  margin-left: 8px;
}
.muted {
  color: #909399;
  font-size: 12px;
}

/* 异常预警条（轻量横向，替代原来两排厚卡片） */
.warn-strip {
  background: #fffaf5;
  border: 1px solid #ffe2c2;
  border-radius: 10px;
}
.warn-strip :deep(.el-card__body) {
  padding: 10px 16px;
}
.warn-strip-inner {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.warn-strip-title {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
  color: #e6731c;
  font-size: 14px;
}
.warn-items {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.warn-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  padding: 4px 12px;
  border-radius: 16px;
  background: #fff;
  border: 1px solid #f0d6bb;
  color: #606266;
  font-size: 13px;
  transition: all 0.2s;
}
.warn-item:hover {
  border-color: var(--el-color-primary);
}
.warn-item.active {
  background: var(--el-color-primary);
  border-color: var(--el-color-primary);
  color: #fff;
}
.warn-item b {
  font-size: 15px;
  font-weight: 800;
}
.warn-item i {
  font-style: normal;
  font-size: 11px;
  opacity: 0.7;
}
.warn-orange b {
  color: #e6a23c;
}
.warn-red b {
  color: #f56c6c;
}
.warn-green b {
  color: #67c23a;
}
.warn-item.active b {
  color: #fff;
}
.unit {
  margin-left: 8px;
  color: #909399;
  font-size: 12px;
}

/* 状态概览卡：7 项等宽一行，窄屏换行 */
.status-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.status-cards .stat-card {
  flex: 1 1 0;
  min-width: 110px;
}
.stat-card {
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  border: none;
  border-radius: 10px;
}
.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08) !important;
}
.stat-card.active {
  outline: 2px solid var(--el-color-primary);
}
.stat-value {
  font-size: 26px;
  font-weight: 800;
  color: #303133;
  line-height: 1.2;
}
.stat-value.primary {
  color: #409eff;
}
.stat-value.warning {
  color: #e6a23c;
}
.stat-value.success {
  color: #67c23a;
}
.stat-value.danger {
  color: #f56c6c;
}
.stat-value.info {
  color: #909399;
}
.stat-label {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

/* 表格单元格 */
.user-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}
.user-detail .name {
  font-weight: 600;
  color: #303133;
  font-size: 13px;
}
.user-detail .phone {
  font-size: 11px;
  color: #909399;
  margin-top: 2px;
}
.job-cell {
  padding: 2px 0;
}
.job-cell .job-name {
  font-weight: 600;
  color: #303133;
  font-size: 13px;
}
.job-cell .salary {
  color: #f56c6c;
  font-size: 12px;
  margin-top: 2px;
}

/* 详情 section */
.section {
  margin-top: 18px;
}
.section-title {
  font-size: 14px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 12px;
  padding-left: 8px;
  border-left: 3px solid var(--el-color-primary);
}
.step-done {
  font-weight: 600;
  color: #303133;
}
.photo-group {
  margin-bottom: 10px;
}
.photo-group-label {
  font-size: 13px;
  color: #606266;
  margin-bottom: 6px;
}
.photo-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.photo-thumb {
  width: 110px;
  height: 110px;
  border-radius: 8px;
}
.report-content {
  white-space: pre-wrap;
  line-height: 1.6;
  color: #303133;
  background: #f7f8fa;
  border-radius: 8px;
  padding: 12px;
}
.amount {
  color: #67c23a;
  font-weight: 700;
}

@media (max-width: 768px) {
  .stat-value {
    font-size: 20px;
  }
}
</style>
