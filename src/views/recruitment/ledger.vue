<template>
  <!--
    结算台账管理（运营/平台方）。
    资金主线出口：核验通过自动生成「待结算」台账 → 运营在此「标记已结算」(单条/批量) → 绑定发票/开票。
    数据来源：AdminRecruitmentController /admin/recruitment/ledger/{list,{id},statistics,settle}。
  -->
  <div class="p-4">
    <!-- 统计卡片 -->
    <el-row :gutter="16" class="mb-4">
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-mini-card">
          <div class="stat-mini">
            <span class="label">台账总数</span>
            <span class="value">{{ statistics.totalCount || 0 }}</span>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-mini-card warning clickable" @click="filterBySettleStatus('0')">
          <div class="stat-mini">
            <span class="label">待结算金额</span>
            <span class="value warning">{{ pendingAmountText }}</span>
            <span class="hint">
              {{ statistics.pendingCount || 0 }} 笔待结算
              <template v-if="pendingAmountPartial">，金额为估算</template>
            </span>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-mini-card success">
          <div class="stat-mini">
            <span class="label">累计金额</span>
            <span class="value success">¥{{ formatMoney(statistics.totalAmount) }}</span>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-mini-card primary">
          <div class="stat-mini">
            <span class="label">今日金额</span>
            <span class="value primary">¥{{ formatMoney(statistics.todayAmount) }}</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 搜索栏 -->
    <el-card shadow="hover" class="mb-4">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true">
        <el-form-item label="业务编号">
          <el-input v-model="chainNo" placeholder="ENT/JOB/SKR/APL/FUL/ORD/QY..." clearable style="width: 260px" @keyup.enter="handleChainQuery()" />
        </el-form-item>
        <el-form-item label="订单号" prop="orderNo">
          <el-input v-model="queryParams.orderNo" placeholder="请输入订单号" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="结算状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 130px">
            <el-option label="待结算" value="0" />
            <el-option label="已结算" value="1" />
            <el-option label="已取消" value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button type="success" plain icon="Search" :loading="chainLoading" @click="handleChainQuery()">链路查询</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-if="chainResult || chainLoading" shadow="hover" class="mb-4 chain-card">
      <template #header>
        <div class="chain-header">
          <div>
            <span class="chain-title">全链路查询</span>
            <span v-if="chainResult?.sourceNo" class="chain-subtitle">
              {{ sourceTypeLabel(chainResult.sourceType) }} / {{ chainResult.sourceNo }}
            </span>
          </div>
          <el-button link type="primary" @click="clearChain">清空链路</el-button>
        </div>
      </template>
      <el-skeleton v-if="chainLoading" :rows="2" animated />
      <el-tabs v-else v-model="chainActiveTab" class="chain-tabs">
        <el-tab-pane label="链路总览" name="overview">
          <el-empty v-if="!chainSteps.length" description="未查询到链路节点" />
          <div v-else class="chain-flow">
            <template v-for="(step, index) in chainSteps" :key="step.kind">
              <button type="button" class="chain-node" @click="handleChainStepClick(step)">
                <span class="chain-label">{{ step.label }}</span>
                <span class="chain-code">{{ step.code }}</span>
                <span v-if="step.desc" class="chain-desc">{{ step.desc }}</span>
              </button>
              <span v-if="index < chainSteps.length - 1" class="chain-arrow">&gt;</span>
            </template>
          </div>
        </el-tab-pane>
        <el-tab-pane v-if="chainResult?.companyId" label="企业" name="company">
          <el-skeleton v-if="chainDetailLoading && !chainDetails.company" :rows="4" animated />
          <el-descriptions v-else-if="chainDetails.company" :column="3" border>
            <el-descriptions-item label="企业编码">{{ chainDetails.company.companyNo || chainResult?.companyNo || '-' }}</el-descriptions-item>
            <el-descriptions-item label="企业名称">{{ chainDetails.company.companyName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="联系人">{{ chainDetails.company.contactPerson || '-' }}</el-descriptions-item>
            <el-descriptions-item label="联系电话">{{ chainDetails.company.contactPhone || '-' }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ chainDetails.company.createTime || '-' }}</el-descriptions-item>
            <el-descriptions-item label="备注" :span="3">{{ chainDetails.company.remark || '-' }}</el-descriptions-item>
          </el-descriptions>
          <el-empty v-else description="企业详情未加载" />
        </el-tab-pane>
        <el-tab-pane v-if="chainResult?.jobId" label="岗位" name="job">
          <el-skeleton v-if="chainDetailLoading && !chainDetails.job" :rows="4" animated />
          <el-descriptions v-else-if="chainDetails.job" :column="3" border>
            <el-descriptions-item label="岗位编码">{{ chainDetails.job.jobNo || chainResult?.jobNo || '-' }}</el-descriptions-item>
            <el-descriptions-item label="岗位名称">{{ chainDetails.job.jobName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="企业">{{ chainDetails.job.companyName || chainResult?.companyName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="薪资">{{ formatSalaryText(chainDetails.job) }}</el-descriptions-item>
            <el-descriptions-item label="工作地点">{{ chainDetails.job.workAddress || chainDetails.job.location || '-' }}</el-descriptions-item>
            <el-descriptions-item label="状态">{{ chainDetails.job.statusName || chainDetails.job.status || '-' }}</el-descriptions-item>
            <el-descriptions-item label="发布时间">{{ chainDetails.job.publishTime || '-' }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ chainDetails.job.createTime || '-' }}</el-descriptions-item>
          </el-descriptions>
          <el-empty v-else description="岗位详情未加载" />
        </el-tab-pane>
        <el-tab-pane v-if="chainResult?.applyId" label="投递" name="apply">
          <el-skeleton v-if="chainDetailLoading && !chainDetails.apply" :rows="4" animated />
          <el-descriptions v-else-if="chainDetails.apply" :column="3" border>
            <el-descriptions-item label="投递编号">{{ chainDetails.apply.applyNo || chainResult?.applyNo || '-' }}</el-descriptions-item>
            <el-descriptions-item label="投递状态">{{ chainDetails.apply.statusName || chainDetails.apply.status || '-' }}</el-descriptions-item>
            <el-descriptions-item label="求职者">{{
              chainDetails.apply.jobSeeker?.realName || chainDetails.apply.jobSeeker?.nickName || chainResult?.jobSeekerName || '-'
            }}</el-descriptions-item>
            <el-descriptions-item label="企业">{{ chainDetails.apply.company?.companyName || chainResult?.companyName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="岗位">{{ chainDetails.apply.job?.jobName || chainResult?.jobName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="投递时间">{{ chainDetails.apply.applyTime || '-' }}</el-descriptions-item>
            <el-descriptions-item label="是否已读">{{ chainDetails.apply.isRead === '1' ? '已读' : '未读' }}</el-descriptions-item>
            <el-descriptions-item label="留言">{{ chainDetails.apply.message || '-' }}</el-descriptions-item>
          </el-descriptions>
          <el-empty v-else description="投递详情未加载" />
        </el-tab-pane>
        <el-tab-pane v-if="chainResult?.taskId" label="履约" name="task">
          <el-skeleton v-if="chainDetailLoading && !chainDetails.task" :rows="4" animated />
          <el-descriptions v-else-if="chainDetails.task" :column="3" border>
            <el-descriptions-item label="履约编号">{{ chainDetails.task.taskNo || chainResult?.taskNo || '-' }}</el-descriptions-item>
            <el-descriptions-item label="状态">{{ chainDetails.task.statusName || chainDetails.task.status || '-' }}</el-descriptions-item>
            <el-descriptions-item label="企业">{{ chainDetails.task.companyName || chainResult?.companyName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="岗位">{{ chainDetails.task.jobName || chainResult?.jobName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="求职者">{{
              chainDetails.task.workerName || chainDetails.task.userName || chainResult?.jobSeekerName || '-'
            }}</el-descriptions-item>
            <el-descriptions-item label="工作时间">{{ chainDetails.task.workTime || '-' }}</el-descriptions-item>
            <el-descriptions-item label="结算金额">{{
              chainDetails.task.settleAmount != null ? `¥${formatMoney(chainDetails.task.settleAmount)}` : '-'
            }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ chainDetails.task.createTime || '-' }}</el-descriptions-item>
          </el-descriptions>
          <el-empty v-else description="履约详情未加载" />
        </el-tab-pane>
        <el-tab-pane v-if="chainResult?.ledgerId" label="台账" name="ledger">
          <el-skeleton v-if="chainDetailLoading && !chainDetails.ledger" :rows="4" animated />
          <el-descriptions v-else-if="chainDetails.ledger" :column="3" border>
            <el-descriptions-item label="台账编号">{{ chainDetails.ledger.orderNo || chainResult?.orderNo || '-' }}</el-descriptions-item>
            <el-descriptions-item label="结算金额">¥{{ formatMoney(chainDetails.ledger.amount) }}</el-descriptions-item>
            <el-descriptions-item label="企业">{{ chainDetails.ledger.companyName || chainResult?.companyName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="用户">{{ chainDetails.ledger.userName || chainResult?.jobSeekerName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="结算状态">{{ ledgerStatusMeta(chainDetails.ledger.status).label }}</el-descriptions-item>
            <el-descriptions-item label="发票状态">{{ ledgerInvoiceStatusMeta(chainDetails.ledger.invoiceStatus).label }}</el-descriptions-item>
            <el-descriptions-item label="结算时间">{{ chainDetails.ledger.settleTime || '-' }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ chainDetails.ledger.createTime || '-' }}</el-descriptions-item>
          </el-descriptions>
          <el-empty v-else description="台账详情未加载" />
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 数据表格 -->
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <el-button type="primary" plain icon="Refresh" @click="loadData">刷新</el-button>
          <!-- 批量结算：仅当勾选了「待结算」台账时可用 -->
          <el-button type="success" icon="Money" :disabled="!settleableSelection.length" @click="openSettle(settleableSelection)">
            批量标记已结算{{ settleableSelection.length ? `(${settleableSelection.length})` : '' }}
          </el-button>
        </div>
      </template>

      <el-table v-loading="loading" :data="tableData" border stripe row-key="ledgerId" @selection-change="onSelectionChange">
        <el-table-column type="selection" width="46" :selectable="isSelectable" />
        <!-- 台账编号：后端 Ledger.orderNo -->
        <el-table-column label="台账编号" prop="orderNo" min-width="190" show-overflow-tooltip />
        <el-table-column label="企业" prop="companyName" min-width="140">
          <template #default="{ row }">{{ row.companyName || '-' }}</template>
        </el-table-column>
        <el-table-column label="用户" min-width="110">
          <template #default="{ row }">{{ row.userName || '-' }}</template>
        </el-table-column>
        <el-table-column label="结算金额" width="120" align="right">
          <template #default="{ row }">
            <span class="amount">¥{{ formatMoney(row.amount) }}</span>
          </template>
        </el-table-column>
        <!-- 结算状态：后端 Ledger.status 0待结算/1已结算/2已取消 -->
        <el-table-column label="结算状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="ledgerStatusMeta(row.status).type">{{ ledgerStatusMeta(row.status).label }}</el-tag>
          </template>
        </el-table-column>
        <!-- 意向结算：字段来自 job_settlement_intent，运营在台账维度查看临时用工服务意向和线索跟进状态 -->
        <el-table-column label="意向结算" width="190" align="center">
          <template #default="{ row }">
            <div v-if="canShowSettlementIntent(row)" class="job-settlement-cell">
              <el-button link type="primary" @click="handleSettlementIntent(row)">意向结算</el-button>
              <div class="job-settlement-tags">
                <el-tag :type="settlementIntentMeta(row.settlementIntentType).type" size="small" effect="plain">
                  {{ settlementIntentShortLabel(row.settlementIntentType) }}
                </el-tag>
              </div>
              <el-button link type="success" icon="Search" @click.stop="handleSettlementLead(row)">线索</el-button>
            </div>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <!-- 发票绑定状态：后端 Ledger.invoiceStatus 0未绑定/1已绑定 -->
        <el-table-column label="发票状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="ledgerInvoiceStatusMeta(row.invoiceStatus).type">{{ ledgerInvoiceStatusMeta(row.invoiceStatus).label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="结算时间" prop="settleTime" width="160" align="center">
          <template #default="{ row }">{{ row.settleTime || '-' }}</template>
        </el-table-column>
        <el-table-column label="创建时间" prop="createTime" width="160" align="center" />
        <el-table-column label="操作" width="140" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" icon="View" @click="handleDetail(row)">详情</el-button>
            <!-- 标记已结算：仅「待结算」可操作 -->
            <el-button v-if="row.status === '0'" link type="success" icon="Money" @click="openSettle([row])">结算</el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="loadData" />
    </el-card>

    <!-- 台账详情对话框 -->
    <el-dialog v-model="detailVisible" title="台账详情" width="600px" append-to-body>
      <el-descriptions :column="2" border v-if="currentLedger">
        <el-descriptions-item label="台账编号" :span="2">{{ currentLedger.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="岗位">
          <el-button v-if="currentLedger.jobId" link type="primary" @click="openRelatedJob(currentLedger)">查看岗位详情</el-button>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="投递编号">{{ currentLedger.applyNo || currentLedger.applyId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="企业">{{ currentLedger.companyName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="求职者编号">{{ currentLedger.jobSeekerNo || currentLedger.userId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="结算金额">
          <span class="amount-lg">¥{{ formatMoney(currentLedger.amount) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="结算状态">
          <el-tag :type="ledgerStatusMeta(currentLedger.status).type">{{ ledgerStatusMeta(currentLedger.status).label }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="发票状态">
          <el-tag :type="ledgerInvoiceStatusMeta(currentLedger.invoiceStatus).type">{{
            ledgerInvoiceStatusMeta(currentLedger.invoiceStatus).label
          }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="履约编号">{{ currentLedger.taskNo || currentLedger.taskId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="结算时间">{{ currentLedger.settleTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="结算备注" :span="2">{{ currentLedger.settleRemark || '-' }}</el-descriptions-item>
        <el-descriptions-item label="不可篡改时间" :span="2">{{ currentLedger.timestamp }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ currentLedger.createTime }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ currentLedger.updateTime }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button v-if="currentLedger && currentLedger.status === '0'" type="success" icon="Money" @click="openSettle([currentLedger])"
          >标记已结算</el-button
        >
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 结算确认对话框（单条/批量共用） -->
    <el-dialog v-model="settleVisible" title="标记已结算" width="480px" append-to-body>
      <el-alert
        class="mb-3"
        type="warning"
        :closable="false"
        show-icon
        :title="`确认将 ${settleTargets.length} 笔台账标记为已结算？此操作记入审计，请在完成打款后操作。`"
      />
      <el-form label-width="80px">
        <el-form-item label="结算备注">
          <el-input v-model="settleRemark" type="textarea" :rows="3" maxlength="200" show-word-limit placeholder="选填：打款流水号/凭证等" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="settleVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitSettle">确认结算</el-button>
      </template>
    </el-dialog>

    <!-- 意向结算：字段来自 job_settlement_intent，运营在台账维度维护临时用工服务意向和线索跟进状态。 -->
    <el-dialog
      v-model="settlementIntentVisible"
      title="意向结算（临时用工服务意向）"
      width="820px"
      class="settlement-intent-dialog"
      append-to-body
    >
      <div v-loading="settlementIntentLoading" class="settlement-intent-body">
        <el-form v-if="settlementIntentJob" label-width="96px" class="settlement-intent-form">
          <el-form-item label="岗位名称">{{ settlementIntentJob.jobName || '-' }}</el-form-item>
          <el-form-item label="所属企业">{{ settlementIntentJob.companyName || '-' }}</el-form-item>
          <el-form-item label="用工性质">{{ jobTypeMeta(settlementIntentJob.jobType).label }}</el-form-item>
          <el-form-item label="服务意向" required>
            <el-radio-group v-model="settlementIntentForm.intentType" class="settlement-intent-radio">
              <el-radio v-for="item in settlementIntentOptions" :key="item.value" :label="item.value" border>
                <div class="settlement-radio-text">
                  <span>{{ item.label }}</span>
                  <small>{{ item.desc }}</small>
                </div>
              </el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="线索状态">
            <el-select v-model="settlementIntentForm.followStatus" style="width: 180px">
              <el-option label="待联系" value="0" />
              <el-option label="已联系" value="1" />
              <el-option label="已关闭" value="2" />
            </el-select>
          </el-form-item>
          <el-form-item label="跟进备注">
            <el-input
              v-model="settlementIntentForm.followRemark"
              type="textarea"
              :rows="3"
              maxlength="500"
              show-word-limit
              placeholder="例如：已电话沟通，后续发送合规结算方案"
            />
          </el-form-item>
          <el-form-item label="选择时间">
            <el-date-picker
              v-model="settlementIntentForm.settlementCreateTime"
              type="datetime"
              value-format="YYYY-MM-DD HH:mm:ss"
              placeholder="请选择意向选择时间"
              style="width: 220px"
            />
          </el-form-item>
        </el-form>
        <el-empty v-else-if="!settlementIntentLoading" description="暂无服务意向记录" />
      </div>
      <template #footer>
        <el-button @click="settlementIntentVisible = false">关闭</el-button>
        <el-button plain type="success" icon="Search" @click="handleSettlementLead(settlementIntentJob)"> 线索 </el-button>
        <el-button type="primary" :loading="settlementIntentSubmitting" @click="submitSettlementIntent">保存</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="settlementLeadVisible" title="意向结算线索" size="860px" append-to-body>
      <div v-loading="settlementLeadLoading" class="settlement-lead-drawer">
        <template v-if="settlementLead">
          <div class="settlement-chain">
            <div
              v-for="(step, index) in settlementLeadSteps"
              :key="step.key"
              class="settlement-chain-node"
              :class="{ 'is-done': step.done, 'is-empty': !step.done, 'is-active': settlementLeadActiveKey === step.key }"
              role="button"
              tabindex="0"
              @click="selectSettlementLeadStep(step.key)"
              @keyup.enter="selectSettlementLeadStep(step.key)"
              @keyup.space="selectSettlementLeadStep(step.key)"
            >
              <div class="settlement-chain-marker">{{ index + 1 }}</div>
              <div class="settlement-chain-card">
                <div class="settlement-chain-title">
                  <span>{{ step.title }}</span>
                  <el-tag size="small" :type="step.done ? 'success' : 'info'" effect="plain">{{ step.done ? '已关联' : '暂无' }}</el-tag>
                </div>
                <div class="settlement-chain-code">{{ step.code || step.emptyText }}</div>
                <div v-if="step.desc" class="settlement-chain-desc">{{ step.desc }}</div>
              </div>
            </div>
          </div>
          <el-descriptions class="settlement-chain-detail mt-4" :title="settlementLeadActiveStep?.title || '链路详情'" :column="2" border>
            <el-descriptions-item v-for="item in settlementLeadActiveDetails" :key="item.label" :label="item.label">
              {{ settlementLeadValueText(item.value) }}
            </el-descriptions-item>
          </el-descriptions>
        </template>
        <el-empty v-else-if="!settlementLeadLoading" description="暂无线索链路" />
      </div>
      <template #footer>
        <el-button v-if="settlementLead?.jobId" type="primary" plain @click="openSettlementLeadJob">查看岗位</el-button>
        <el-button v-if="settlementLead?.orderNo" type="success" plain @click="openSettlementLeadLedger">查看台账</el-button>
        <el-button @click="settlementLeadVisible = false">关闭</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script setup name="LedgerManagement" lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import {
  listLedger,
  getLedgerStatistics,
  getLedger,
  settleLedger,
  getCompany,
  getJobFullDetail,
  getApply2Detail,
  getTask,
  updateJobSettlementIntent,
  type LedgerVO
} from '@/api/recruitment';
import { getBizNoChain, getBizNoChainByCompanyId, type BizNoChainVO } from '@/api/recruitment/serialRule';
import { unwrapList, formatMoney } from './helpers';
// 台账结算状态(0待结算/1已结算/2已取消) 与 发票绑定状态(0未绑定/1已绑定) → el-tag 文案/颜色，映射集中在 constants.ts
import { ledgerStatusMeta, ledgerInvoiceStatusMeta, jobTypeMeta } from './constants';

const loading = ref(false);
const router = useRouter();
const submitting = ref(false);
const total = ref(0);
const tableData = ref<any[]>([]);
const detailVisible = ref(false);
const currentLedger = ref<any>(null);
const queryFormRef = ref();

// 多选：仅「待结算」可被选中（表格 selectable 已限制），这里再过滤一层兜底
const selectedRows = ref<any[]>([]);
const settleableSelection = computed(() => selectedRows.value.filter((r) => r.status === '0'));

// 结算对话框
const settleVisible = ref(false);
const settleTargets = ref<any[]>([]);
const settleRemark = ref('');
const pendingAmountLoading = ref(false);
const pendingAmountPartial = ref(false);
const chainNo = ref('');
const chainLoading = ref(false);
const chainResult = ref<BizNoChainVO | null>(null);
const chainActiveTab = ref('overview');
const chainDetailLoading = ref(false);
const chainDetails = reactive<Record<'company' | 'job' | 'apply' | 'task' | 'ledger', any>>({
  company: null,
  job: null,
  apply: null,
  task: null,
  ledger: null
});

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  orderNo: '',
  companyId: undefined,
  userId: undefined,
  status: ''
});

// ===== 意向结算相关状态 =====
const settlementIntentVisible = ref(false);
const settlementIntentLoading = ref(false);
const settlementIntentSubmitting = ref(false);
const settlementIntentJob = ref<any | null>(null);
const settlementIntentForm = reactive({
  intentId: '' as string | number,
  jobId: '' as string | number,
  intentType: '',
  followStatus: '0',
  followRemark: '',
  settlementCreateTime: ''
});

const settlementLeadVisible = ref(false);
const settlementLeadLoading = ref(false);
const settlementLead = ref<BizNoChainVO | null>(null);
const settlementLeadContext = ref<any>(null);
const settlementLeadActiveKey = ref('company');

const settlementIntentMap: Record<string, { label: string; type: 'info' | 'primary' | 'success' | 'warning'; desc: string }> = {
  '1': {
    label: '企业全程自主对接，线下自行结算',
    type: 'info',
    desc: '企业独立对接候选人、线下履约发薪；平台仅提供人员匹配服务。'
  },
  '2': {
    label: '自主线下结算，需平台提供合规用工方案参考',
    type: 'warning',
    desc: '薪资仍由企业自主发放，平台可提供劳务协议模板、临时用工风控指引等参考方案。'
  },
  '3': {
    label: '录用后平台线上签约 + 第三方合规结算',
    type: 'success',
    desc: '录用人员后可线上签署标准化劳务合约，薪资经由平台合作第三方机构代发并保留台账。'
  }
};

const settlementIntentOptions = Object.entries(settlementIntentMap).map(([value, meta]) => ({ value, ...meta }));

function settlementIntentMeta(type?: string) {
  return settlementIntentMap[String(type || '')] || { label: '暂无服务意向记录', type: 'info' as const, desc: '当前岗位未返回服务意向字段。' };
}

function settlementIntentShortLabel(type?: string) {
  const map: Record<string, string> = {
    '1': '自主结算',
    '2': '方案参考',
    '3': '合规结算'
  };
  return map[String(type || '')] || '未选择';
}

function hasSettlementIntentValue(value: unknown) {
  return value !== undefined && value !== null && String(value) !== '';
}

function canShowSettlementIntent(row: any) {
  return [
    row?.settlementIntentId,
    row?.settlementIntentType,
    row?.settlementNeedFollowUp,
    row?.settlementFollowStatus,
    row?.settlementFollowRemark,
    row?.settlementCreateTime
  ].some(hasSettlementIntentValue);
}

function settlementLeadFollowStatusText(row: any) {
  const map: Record<string, string> = {
    '0': '待联系',
    '1': '已联系',
    '2': '已关闭'
  };
  return map[String(row?.settlementFollowStatus ?? '')] || '';
}

function settlementLeadNeedFollowText(row: any) {
  const value = String(row?.settlementNeedFollowUp ?? '');
  if (value === '1') return '需要跟进';
  if (value === '0') return '无需跟进';
  return '';
}

function settlementLeadValueText(value: unknown) {
  if (value === 0) return '0';
  if (value == null) return '-';
  const text = String(value).trim();
  return text || '-';
}

function settlementLeadMoneyText(value?: number | string | null) {
  if (value == null || value === '') return '';
  return `¥${formatMoney(value)}`;
}

function settlementLeadStageText(chain?: BizNoChainVO | null) {
  if (!chain) return '';
  if (chain.orderNo || chain.ledgerId) return '已形成台账';
  if (chain.taskNo || chain.taskId) return '已进入履约';
  if (chain.applyNo || chain.applyId) return '已形成投递';
  if (chain.jobNo || chain.jobId) return '岗位待转化';
  return '企业线索';
}

function settlementLeadApplyNextText(chain?: BizNoChainVO | null) {
  if (!chain?.applyNo && !chain?.applyId) return '等待候选人投递或企业录用';
  if (chain.taskNo || chain.taskId) return '已进入履约节点，可继续查看履约进度';
  return '已投递，等待录用后生成履约';
}

function settlementLeadTaskProgressText(chain?: BizNoChainVO | null) {
  if (!chain?.taskNo && !chain?.taskId) return '暂无履约记录';
  if (chain.orderNo || chain.ledgerId) return '履约已关联台账';
  return '已生成履约，等待核验或结算';
}

function settlementLeadTaskSettleText(chain?: BizNoChainVO | null) {
  if (!chain?.taskNo && !chain?.taskId) return '投递录用后先生成履约';
  if (chain.orderNo || chain.ledgerId) return '已进入台账结算';
  return '待核验通过后生成台账';
}

function settlementLeadLedgerProgressText(chain?: BizNoChainVO | null) {
  if (!chain?.orderNo && !chain?.ledgerId) return '暂无台账记录';
  return '台账已生成，进入结算/开票跟进';
}

function normalizeDateTimeText(value?: string | null) {
  if (!value) return '';
  return value.replace('T', ' ');
}

const settlementLeadSteps = computed(() => {
  const chain = settlementLead.value;
  const context = settlementLeadContext.value || {};
  if (!chain) return [];
  const settlementLabel = settlementIntentMeta(context?.settlementIntentType).label;
  const settlementShortLabel = settlementIntentShortLabel(context?.settlementIntentType);
  const leadStatus = settlementLeadFollowStatusText(context);
  const needFollow = settlementLeadNeedFollowText(context);
  const chainStage = settlementLeadStageText(chain);
  return [
    {
      key: 'company',
      title: '企业',
      code: chain.companyNo || chain.companyName,
      desc: chain.companyName,
      done: !!(chain.companyNo || chain.companyId || chain.companyName),
      emptyText: '未关联企业',
      details: [
        { label: '企业名称', value: chain.companyName },
        { label: '企业编号', value: chain.companyNo },
        { label: '服务意向', value: settlementIntentShortLabel(context?.settlementIntentType) },
        { label: '线索状态', value: settlementLeadFollowStatusText(context) },
        { label: '跟进要求', value: settlementLeadNeedFollowText(context) },
        { label: '选择时间', value: normalizeDateTimeText(context?.settlementCreateTime) },
        { label: '跟进备注', value: context?.settlementFollowRemark }
      ]
    },
    {
      key: 'job',
      title: '岗位',
      code: chain.jobNo || chain.jobName,
      desc: chain.jobName,
      done: !!(chain.jobNo || chain.jobId || chain.jobName),
      emptyText: '未关联岗位',
      details: [
        { label: '岗位名称', value: chain.jobName },
        { label: '岗位编号', value: chain.jobNo },
        { label: '所属企业', value: context?.companyName || chain.companyName },
        { label: '用工性质', value: context?.jobTypeName || jobTypeMeta(context?.jobType).label },
        { label: '服务意向', value: settlementIntentMeta(context?.settlementIntentType).label },
        { label: '线索状态', value: settlementLeadFollowStatusText(context) },
        { label: '薪资范围', value: context?.salary || '-' },
        { label: '工作地点', value: context?.workAddress || context?.location || '-' },
        { label: '选择时间', value: normalizeDateTimeText(context?.settlementCreateTime) },
        { label: '跟进备注', value: context?.settlementFollowRemark }
      ]
    },
    {
      key: 'apply',
      title: '投递',
      code: chain.applyNo || (chain.applyId ? '已形成投递' : ''),
      desc: chain.jobSeekerName,
      done: !!(chain.applyNo || chain.applyId),
      emptyText: '暂无投递',
      details: [
        { label: '投递编号', value: chain.applyNo },
        { label: '当前阶段', value: chainStage },
        { label: '求职者', value: chain.jobSeekerName },
        { label: '求职者编号', value: chain.jobSeekerNo },
        { label: '关联岗位', value: chain.jobName },
        { label: '所属企业', value: chain.companyName },
        { label: '服务意向', value: settlementShortLabel },
        { label: '线索状态', value: leadStatus },
        { label: '跟进要求', value: needFollow },
        { label: '选择时间', value: normalizeDateTimeText(context?.settlementCreateTime) },
        { label: '下一步', value: settlementLeadApplyNextText(chain) }
      ]
    },
    {
      key: 'task',
      title: '履约',
      code: chain.taskNo || (chain.taskId ? '已生成履约' : ''),
      desc: chain.jobSeekerName || chain.jobName || '',
      done: !!(chain.taskNo || chain.taskId),
      emptyText: '暂无履约',
      details: [
        { label: '履约编号', value: chain.taskNo },
        { label: '履约进度', value: settlementLeadTaskProgressText(chain) },
        { label: '求职者', value: chain.jobSeekerName },
        { label: '关联投递', value: chain.applyNo },
        { label: '关联岗位', value: chain.jobName },
        { label: '关联企业', value: chain.companyName },
        { label: '服务意向', value: settlementLabel },
        { label: '结算准备', value: settlementLeadTaskSettleText(chain) },
        { label: '线索状态', value: leadStatus },
        { label: '跟进备注', value: context?.settlementFollowRemark }
      ]
    },
    {
      key: 'ledger',
      title: '台账',
      code: chain.orderNo || (chain.ledgerId ? '已生成台账' : ''),
      desc: chain.orderAmount != null ? `¥${formatMoney(chain.orderAmount)}` : '',
      done: !!(chain.orderNo || chain.ledgerId),
      emptyText: '暂无台账',
      details: [
        { label: '台账编号', value: chain.orderNo },
        { label: '台账进度', value: settlementLeadLedgerProgressText(chain) },
        { label: '结算金额', value: settlementLeadMoneyText(chain.orderAmount) },
        { label: '关联履约', value: chain.taskNo },
        { label: '关联投递', value: chain.applyNo },
        { label: '求职者', value: chain.jobSeekerName },
        { label: '关联岗位', value: chain.jobName },
        { label: '关联企业', value: chain.companyName },
        { label: '服务意向', value: settlementLabel }
      ]
    }
  ].map((step) => ({ ...step, done: step.done ?? !!step.code }));
});

const settlementLeadActiveStep = computed(() => {
  return settlementLeadSteps.value.find((step) => step.key === settlementLeadActiveKey.value) || settlementLeadSteps.value[0];
});

const settlementLeadActiveDetails = computed(() => {
  const details = [...(settlementLeadActiveStep.value?.details || [])];
  if (settlementLeadActiveStep.value?.key === 'company') {
    details.push(
      { label: '联系人', value: settlementLeadContext.value?.contactPerson || settlementLeadContext.value?.operatorName },
      { label: '联系电话', value: settlementLeadContext.value?.contactPhone || settlementLeadContext.value?.operatorPhone }
    );
  }
  if (settlementLeadActiveStep.value?.key === 'job') {
    details.push({ label: '岗位备注', value: settlementLeadContext.value?.remark });
  }
  return details;
});

function selectSettlementLeadStep(key: string) {
  settlementLeadActiveKey.value = key;
}

const statistics = reactive({
  totalCount: 0,
  totalAmount: 0,
  todayAmount: 0,
  pendingCount: 0,
  pendingAmount: undefined as number | undefined
});

const pendingAmountText = computed(() => {
  if (pendingAmountLoading.value && statistics.pendingAmount == null) return '加载中';
  return statistics.pendingAmount == null ? '--' : `¥${formatMoney(statistics.pendingAmount)}`;
});

interface ChainStep {
  kind: 'company' | 'job' | 'user' | 'apply' | 'task' | 'order';
  label: string;
  code: string;
  desc?: string;
}

const chainSteps = computed<ChainStep[]>(() => {
  const chain = chainResult.value;
  if (!chain) return [];
  return [
    { kind: 'company', label: '企业', code: chain.companyNo, desc: chain.companyName },
    { kind: 'job', label: '岗位', code: chain.jobNo, desc: chain.jobName },
    { kind: 'user', label: '求职者', code: chain.jobSeekerNo, desc: chain.jobSeekerName },
    { kind: 'apply', label: '投递', code: chain.applyNo },
    { kind: 'task', label: '履约', code: chain.taskNo },
    { kind: 'order', label: '台账', code: chain.orderNo, desc: chain.orderAmount != null ? `¥${formatMoney(chain.orderAmount)}` : '' }
  ].filter((step): step is ChainStep => !!step.code);
});

function sourceTypeLabel(type?: string) {
  const map: Record<string, string> = {
    COMPANY: '企业',
    JOB: '岗位',
    JOB_SEEKER: '求职者',
    APPLY: '投递',
    TASK: '履约',
    ORDER: '台账'
  };
  return map[String(type || '')] || '业务编号';
}

function resetChainDetails() {
  chainActiveTab.value = 'overview';
  chainDetails.company = null;
  chainDetails.job = null;
  chainDetails.apply = null;
  chainDetails.task = null;
  chainDetails.ledger = null;
}

function formatSalaryText(job: any) {
  if (!job) return '-';
  if (job.salary) return job.salary;
  if (job.salaryMin != null || job.salaryMax != null) {
    const unit = job.salaryUnitName || (job.salaryUnit === '0' ? '元/天' : job.salaryUnit === '3' ? '元/小时' : '元/月');
    return `${job.salaryMin ?? '-'}-${job.salaryMax ?? '-'}${unit}`;
  }
  return '-';
}

async function loadChainDetails(chain: BizNoChainVO) {
  resetChainDetails();
  chainDetailLoading.value = true;
  try {
    await Promise.all([
      chain.companyId
        ? getCompany(chain.companyId as any)
            .then((res) => (chainDetails.company = res.data || null))
            .catch(() => null)
        : Promise.resolve(),
      chain.jobId
        ? getJobFullDetail(chain.jobId as any)
            .then((res) => (chainDetails.job = res.data || null))
            .catch(() => null)
        : Promise.resolve(),
      chain.applyId
        ? getApply2Detail(chain.applyId as any)
            .then((res) => (chainDetails.apply = res.data || null))
            .catch(() => null)
        : Promise.resolve(),
      chain.taskId
        ? getTask(chain.taskId as any)
            .then((res) => (chainDetails.task = res.data || null))
            .catch(() => null)
        : Promise.resolve(),
      chain.ledgerId
        ? getLedger(chain.ledgerId as any)
            .then((res) => (chainDetails.ledger = res.data || null))
            .catch(() => null)
        : Promise.resolve()
    ]);
  } finally {
    chainDetailLoading.value = false;
  }
}

async function loadData() {
  loading.value = true;
  try {
    const res = await listLedger(queryParams);
    const list = unwrapList(res);
    tableData.value = list.rows;
    total.value = list.total;
  } catch (error) {
    console.error('加载台账失败:', error);
  } finally {
    loading.value = false;
  }
}

async function loadStatistics() {
  try {
    const res = await getLedgerStatistics();
    const data = res.data || {};
    Object.assign(statistics, data);
    // 待结算金额/笔数是新增统计契约；后端未补前，前端用待结算列表做临时兜底，避免卡片空白。
    if (data.pendingAmount == null || data.pendingCount == null) {
      await loadPendingLedgerFallback();
    } else {
      pendingAmountPartial.value = false;
    }
  } catch (error) {
    console.error('加载台账统计失败:', error);
  }
}

async function loadPendingLedgerFallback() {
  pendingAmountLoading.value = true;
  try {
    const fallbackPageSize = 500;
    const res = await listLedger({ pageNum: 1, pageSize: fallbackPageSize, status: '0' } as any);
    const list = unwrapList<LedgerVO>(res);
    statistics.pendingCount = list.total;
    statistics.pendingAmount = list.rows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
    pendingAmountPartial.value = list.total > list.rows.length;
  } catch (error) {
    pendingAmountPartial.value = false;
    console.error('加载待结算台账兜底统计失败:', error);
  } finally {
    pendingAmountLoading.value = false;
  }
}

async function handleChainQuery(no?: string) {
  const bizNo = String(no ?? chainNo.value).trim();
  if (!bizNo) {
    ElMessage.warning('请输入业务编号');
    return;
  }
  chainNo.value = bizNo;
  chainLoading.value = true;
  resetChainDetails();
  try {
    const res = await getBizNoChain(bizNo);
    chainResult.value = res.data || null;
    if (chainResult.value?.orderNo) {
      queryParams.orderNo = chainResult.value.orderNo;
      queryParams.pageNum = 1;
      await loadData();
    }
    if (chainResult.value) {
      await loadChainDetails(chainResult.value);
    }
  } catch (error) {
    chainResult.value = null;
    resetChainDetails();
    ElMessage.error('未找到该业务编号的链路');
  } finally {
    chainLoading.value = false;
  }
}

function clearChain() {
  chainNo.value = '';
  chainResult.value = null;
  resetChainDetails();
}

function handleChainStepClick(step: ChainStep) {
  if (step.kind === 'user') {
    ElMessage.info('求职者节点暂展示编号与姓名');
    return;
  }
  chainActiveTab.value = step.kind === 'order' ? 'ledger' : step.kind;
}

function handleQuery() {
  queryParams.pageNum = 1;
  loadData();
}

function resetQuery() {
  queryFormRef.value?.resetFields();
  queryParams.pageNum = 1;
  queryParams.orderNo = '';
  queryParams.companyId = undefined;
  queryParams.userId = undefined;
  queryParams.status = '';
  clearChain();
  loadData();
}

// 统计卡联动筛选：待结算金额卡对应 ledger.status=0，点击后直接看待结算明细。
function filterBySettleStatus(status: string) {
  queryParams.status = status;
  queryParams.pageNum = 1;
  loadData();
}

function onSelectionChange(rows: any[]) {
  selectedRows.value = rows;
}

// 仅「待结算」可勾选（用于结算）；提取为方法，避免模板内联箭头在选择表里的边界问题
function isSelectable(row: any) {
  return row.status === '0';
}

async function handleDetail(row: any) {
  try {
    const res = await getLedger(row.ledgerId);
    currentLedger.value = res.data;
    detailVisible.value = true;
  } catch (error) {
    ElMessage.error('获取台账详情失败');
  }
}

function openRelatedJob(row: any) {
  if (!row?.jobId) return;
  detailVisible.value = false;
  router.push({ name: 'RecruitmentJob', query: { jobId: String(row.jobId) } });
}

// 打开结算确认（单条传 [row]，批量传选中列表）
function openSettle(targets: any[]) {
  settleTargets.value = (targets || []).filter((t) => t.status === '0');
  if (!settleTargets.value.length) {
    ElMessage.warning('没有可结算的「待结算」台账');
    return;
  }
  settleRemark.value = '';
  settleVisible.value = true;
}

async function submitSettle() {
  const ledgerIds = settleTargets.value.map((t) => t.ledgerId).filter(Boolean);
  if (!ledgerIds.length) return;
  submitting.value = true;
  try {
    await settleLedger({ ledgerIds, remark: settleRemark.value?.trim() || undefined });
    ElMessage.success('已标记结算');
    settleVisible.value = false;
    detailVisible.value = false;
    loadData();
    loadStatistics();
  } catch (error) {
    ElMessage.error('结算失败');
  } finally {
    submitting.value = false;
  }
}

// ===== 意向结算相关方法 =====
async function handleSettlementIntent(row: any) {
  settlementIntentVisible.value = true;
  settlementIntentLoading.value = true;
  settlementIntentJob.value = null;
  settlementIntentJob.value = { ...row };
  try {
    if (row?.jobId && !row?.settlementIntentId) {
      const res = await getJobFullDetail(row.jobId);
      settlementIntentJob.value = { ...row, ...(res.data || {}) };
    }
    fillSettlementIntentForm(settlementIntentJob.value);
  } catch {
    ElMessage.error('获取服务意向失败');
  } finally {
    settlementIntentLoading.value = false;
  }
}

function fillSettlementIntentForm(row: any) {
  settlementIntentForm.intentId = row?.settlementIntentId || '';
  settlementIntentForm.jobId = row?.jobId || '';
  settlementIntentForm.intentType = String(row?.settlementIntentType || '');
  settlementIntentForm.followStatus = String(row?.settlementFollowStatus || (row?.settlementIntentType === '3' ? '0' : '2'));
  settlementIntentForm.followRemark = String(row?.settlementFollowRemark || '');
  settlementIntentForm.settlementCreateTime = String(row?.settlementCreateTime || '');
}

async function submitSettlementIntent() {
  if (!settlementIntentForm.intentId && !settlementIntentForm.jobId) {
    ElMessage.warning('当前岗位信息缺失，无法保存意向结算');
    return;
  }
  if (!settlementIntentForm.intentType) {
    ElMessage.warning('请选择临时用工服务意向');
    return;
  }
  settlementIntentSubmitting.value = true;
  try {
    const res = await updateJobSettlementIntent({
      intentId: settlementIntentForm.intentId || undefined,
      jobId: settlementIntentForm.jobId || undefined,
      intentType: settlementIntentForm.intentType,
      followStatus: settlementIntentForm.followStatus,
      followRemark: settlementIntentForm.followRemark,
      settlementCreateTime: settlementIntentForm.settlementCreateTime || undefined
    });
    ElMessage.success('意向结算已保存');
    if (res.data) {
      settlementIntentJob.value = { ...(settlementIntentJob.value || {}), ...res.data };
      fillSettlementIntentForm(settlementIntentJob.value);
    } else if (settlementIntentForm.jobId) {
      const res = await getJobFullDetail(settlementIntentForm.jobId as number);
      settlementIntentJob.value = { ...(settlementIntentJob.value || {}), ...(res.data || {}) };
      fillSettlementIntentForm(settlementIntentJob.value);
    }
    await loadData();
  } catch {
    ElMessage.error('意向结算保存失败');
  } finally {
    settlementIntentSubmitting.value = false;
  }
}

async function handleSettlementLead(row: any) {
  let leadRow = row;
  if (!leadRow?.settlementIntentId && leadRow?.jobId) {
    const res = await getJobFullDetail(leadRow.jobId);
    leadRow = { ...leadRow, ...(res.data || {}) };
    settlementIntentJob.value = { ...(settlementIntentJob.value || {}), ...leadRow };
    fillSettlementIntentForm(settlementIntentJob.value);
  }
  if (!leadRow?.settlementIntentId) {
    ElMessage.warning('当前岗位暂无意向结算记录');
    return;
  }
  settlementLeadVisible.value = true;
  settlementLeadLoading.value = true;
  settlementLead.value = null;
  settlementLeadContext.value = { ...leadRow };
  settlementLeadActiveKey.value = 'company';
  try {
    if (!leadRow.companyId) {
      throw new Error('missing companyId');
    }
    const res = await getBizNoChainByCompanyId(leadRow.companyId, leadRow.settlementIntentId);
    settlementLead.value = res.data || null;
    settlementLeadActiveKey.value = settlementLeadSteps.value.find((step) => step.done)?.key || 'company';
  } catch {
    settlementLeadContext.value = null;
    ElMessage.error('线索链路加载失败');
  } finally {
    settlementLeadLoading.value = false;
  }
}

function openSettlementLeadJob() {
  if (!settlementLead.value?.jobId) return;
  settlementLeadVisible.value = false;
  router.push({ name: 'RecruitmentJob', query: { jobId: String(settlementLead.value.jobId) } });
}

function openSettlementLeadLedger() {
  if (!settlementLead.value?.orderNo) return;
  settlementLeadVisible.value = false;
  router.push({ name: 'RecruitmentLedger', query: { orderNo: settlementLead.value.orderNo } });
}

// 支持从任务详情「台账编号」跳转携带 ?orderNo= 预填检索条件，
// 否则跳过来看到的是未过滤的全量台账（按订单号检索的意图落空）。
const route = useRoute();
onMounted(() => {
  const qOrderNo = route.query.orderNo;
  if (typeof qOrderNo === 'string' && qOrderNo) {
    queryParams.orderNo = qOrderNo;
    chainNo.value = qOrderNo;
  }
  const qBizNo = route.query.bizNo;
  if (typeof qBizNo === 'string' && qBizNo) {
    chainNo.value = qBizNo;
  }
  // 支持从履约页「待结算提醒」跳转携带 ?status=0，落地即筛待结算台账。
  const qStatus = route.query.status;
  if (typeof qStatus === 'string' && ['0', '1', '2'].includes(qStatus)) {
    queryParams.status = qStatus;
  }
  loadData();
  loadStatistics();
  if (chainNo.value) {
    handleChainQuery(chainNo.value);
  }
});
</script>

<style scoped>
.mb-4 {
  margin-bottom: 16px;
}
.mb-3 {
  margin-bottom: 14px;
}

.card-header {
  display: flex;
  gap: 10px;
  align-items: center;
}

.chain-card {
  border-left: 3px solid var(--el-color-primary);
}
.chain-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.chain-title {
  font-weight: 700;
  color: #303133;
}
.chain-subtitle {
  margin-left: 10px;
  color: #909399;
  font-size: 13px;
}
.chain-flow {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  gap: 8px;
}
.chain-node {
  min-width: 150px;
  max-width: 240px;
  padding: 10px 12px;
  text-align: left;
  cursor: pointer;
  background: #f7fbff;
  border: 1px solid #c6e2ff;
  border-radius: 6px;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}
.chain-node:hover {
  border-color: var(--el-color-primary);
  box-shadow: 0 2px 8px rgb(64 158 255 / 14%);
}
.chain-label,
.chain-code,
.chain-desc {
  display: block;
}
.chain-label {
  color: #606266;
  font-size: 12px;
}
.chain-code {
  margin-top: 4px;
  color: var(--el-color-primary);
  font-weight: 700;
  word-break: break-all;
}
.chain-desc {
  margin-top: 3px;
  color: #909399;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.chain-arrow {
  display: inline-flex;
  align-items: center;
  color: #a8abb2;
  font-weight: 700;
}

.stat-mini-card {
  text-align: center;
}
.stat-mini-card.clickable {
  cursor: pointer;
}
.stat-mini-card.clickable:hover {
  border-color: var(--el-color-warning);
}
.stat-mini {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 92px;
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
.stat-mini .value.success {
  color: #67c23a;
}
.stat-mini .value.primary {
  color: #409eff;
}
.stat-mini .value.warning {
  color: #e6a23c;
}
.stat-mini .hint {
  min-height: 18px;
  margin-top: 6px;
  color: #909399;
  font-size: 12px;
}

.amount {
  color: #67c23a;
  font-weight: 600;
}
.amount-lg {
  color: #67c23a;
  font-weight: 700;
  font-size: 18px;
}

.job-settlement-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}

.job-settlement-tags {
  display: flex;
  gap: 4px;
}

.settlement-intent-dialog :deep(.el-dialog__body) {
  padding-top: 14px;
  max-height: 72vh;
  overflow-y: auto;
}

.settlement-intent-body {
  min-height: 560px;
  overflow: visible;
  padding-right: 4px;
}

.settlement-intent-form {
  padding-right: 4px;
}

.settlement-intent-form :deep(.el-form-item) {
  margin-bottom: 20px;
}

.settlement-intent-radio {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
  width: 100%;
}

.settlement-intent-radio :deep(.el-radio) {
  margin-right: 0;
  white-space: normal;
}

.settlement-intent-radio :deep(.el-radio.is-bordered) {
  display: flex;
  align-items: flex-start;
  width: 100%;
  height: auto;
  min-height: 74px;
  margin-right: 0;
  padding: 12px 14px;
  border-radius: 8px;
}

.settlement-intent-radio :deep(.el-radio__input) {
  flex: 0 0 auto;
  padding-top: 3px;
}

.settlement-intent-radio :deep(.el-radio__label) {
  display: block;
  width: 100%;
  min-width: 0;
  padding-left: 10px;
  line-height: 1.4;
}

.settlement-radio-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  width: 100%;
  min-width: 0;
  white-space: normal;
  line-height: 1.45;
}

.settlement-radio-text span {
  color: #303133;
  font-weight: 600;
  word-break: break-word;
}

.settlement-radio-text small {
  color: #909399;
  font-size: 12px;
  line-height: 1.5;
  word-break: break-word;
}

.settlement-lead-drawer {
  height: calc(100% - 80px);
  overflow-y: auto;
}

.settlement-chain {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.settlement-chain-node {
  flex: 0 0 calc(50% - 6px);
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.settlement-chain-node:hover {
  background: #f0f5ff;
}

.settlement-chain-node.is-active {
  border-color: var(--el-color-primary);
  background: #f0f5ff;
}

.settlement-chain-node.is-done {
  background: #f0fdf4;
}

.settlement-chain-node.is-done:hover {
  background: #dcfce7;
}

.settlement-chain-marker {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--el-color-primary);
  color: #fff;
  font-weight: 700;
  flex-shrink: 0;
}

.settlement-chain-node.is-empty .settlement-chain-marker {
  background: #d9d9d9;
}

.settlement-chain-card {
  flex: 1;
  min-width: 0;
}

.settlement-chain-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  font-weight: 600;
  color: #303133;
}

.settlement-chain-code {
  font-family: monospace;
  font-size: 13px;
  color: var(--el-color-primary);
  margin-bottom: 4px;
  word-break: break-all;
}

.settlement-chain-desc {
  font-size: 12px;
  color: #909399;
}

.settlement-chain-detail {
  margin-top: 16px;
}
</style>
