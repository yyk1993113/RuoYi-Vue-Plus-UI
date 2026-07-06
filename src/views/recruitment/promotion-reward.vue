<template>
  <div class="p-4 promotion-reward-page">
    <el-card shadow="hover" class="mb-4">
      <template #header>
        <div class="card-head">
          <span>奖励规则</span>
          <el-button v-hasPermi="['recruitment:promotionReward:rule']" type="primary" plain icon="Refresh" @click="loadRules">刷新</el-button>
        </div>
      </template>

      <el-table v-loading="ruleLoading" :data="ruleList" border stripe>
        <el-table-column label="事件类型" prop="eventType" width="190" />
        <el-table-column label="事件名称" prop="eventName" min-width="180" />
        <el-table-column label="奖励金额" prop="rewardAmount" width="130" align="right">
          <template #default="{ row }">¥{{ money(row.rewardAmount) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === '1' ? 'success' : 'info'" size="small">{{ row.status === '1' ? '启用' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="备注" prop="remark" min-width="220" show-overflow-tooltip />
        <el-table-column label="操作" width="120" align="center" fixed="right">
          <template #default="{ row }">
            <el-button v-hasPermi="['recruitment:promotionReward:rule']" link type="primary" icon="Edit" @click="openRuleDialog(row)">配置</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card shadow="hover">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="C端推广人审核" name="audit">
          <el-form :model="auditQuery" :inline="true" label-width="84px" class="mb-3">
            <el-form-item label="关键词">
              <el-input v-model="auditQuery.name" placeholder="推广人姓名" clearable style="width: 170px" @keyup.enter="handleAuditQuery" />
            </el-form-item>
            <el-form-item label="手机号">
              <el-input v-model="auditQuery.phonenumber" placeholder="推广人手机号" clearable style="width: 170px" @keyup.enter="handleAuditQuery" />
            </el-form-item>
            <el-form-item label="审核状态">
              <el-select v-model="auditQuery.auditStatus" placeholder="全部" clearable style="width: 130px" @change="handleAuditQuery">
                <el-option label="待审核" value="0" />
                <el-option label="已通过" value="1" />
                <el-option label="已拒绝" value="2" />
              </el-select>
            </el-form-item>
            <el-form-item label="账号状态">
              <el-select v-model="auditQuery.status" placeholder="全部" clearable style="width: 130px" @change="handleAuditQuery">
                <el-option label="启用" value="1" />
                <el-option label="停用" value="0" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleAuditQuery">搜索</el-button>
              <el-button icon="Refresh" @click="resetAuditQuery">重置</el-button>
            </el-form-item>
          </el-form>

          <el-table v-loading="auditLoading" :data="auditRows" border stripe>
            <el-table-column label="推广人" min-width="180" show-overflow-tooltip>
              <template #default="{ row }">
                <div class="primary-text">{{ row.name || '-' }}</div>
                <div class="sub-text">{{ row.phonenumber || '-' }}</div>
              </template>
            </el-table-column>
            <el-table-column label="推广码" prop="promotionCode" min-width="150" show-overflow-tooltip />
            <el-table-column label="审核状态" width="110" align="center">
              <template #default="{ row }">
                <el-tag :type="auditTag(row.auditStatus)" size="small">{{ auditText(row.auditStatus) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="账号状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === '1' ? 'success' : 'info'" size="small">{{ row.status === '1' ? '启用' : '停用' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="申请时间" prop="createTime" width="170" align="center" />
            <el-table-column label="审核时间" prop="auditTime" width="170" align="center" />
            <el-table-column label="审核备注" prop="auditRemark" min-width="220" show-overflow-tooltip />
            <el-table-column label="操作" width="170" align="center" fixed="right">
              <template #default="{ row }">
                <el-button v-hasPermi="['recruitment:promotionReward:audit']" link type="success" icon="Check" @click="openAuditDialog(row, '1')"
                  >通过</el-button
                >
                <el-button v-hasPermi="['recruitment:promotionReward:audit']" link type="danger" icon="Close" @click="openAuditDialog(row, '2')"
                  >拒绝</el-button
                >
              </template>
            </el-table-column>
          </el-table>

          <pagination
            v-show="auditTotal > 0"
            v-model:page="auditQuery.pageNum"
            v-model:limit="auditQuery.pageSize"
            :total="auditTotal"
            @pagination="loadAuditPromoters"
          />
        </el-tab-pane>

        <el-tab-pane label="奖励流水" name="reward">
          <el-form :model="rewardQuery" :inline="true" label-width="84px" class="mb-3">
            <el-form-item label="关键词">
              <el-input
                v-model="rewardQuery.keyword"
                placeholder="推广人/求职者/手机号"
                clearable
                style="width: 220px"
                @keyup.enter="handleRewardQuery"
              />
            </el-form-item>
            <el-form-item label="事件">
              <el-select v-model="rewardQuery.eventType" placeholder="全部" clearable style="width: 170px" @change="handleRewardQuery">
                <el-option v-for="item in eventOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="rewardQuery.status" placeholder="全部" clearable style="width: 130px" @change="handleRewardQuery">
                <el-option label="待结算" value="0" />
                <el-option label="已结算" value="1" />
                <el-option label="已驳回" value="2" />
                <el-option label="已取消" value="3" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleRewardQuery">搜索</el-button>
              <el-button icon="Refresh" @click="resetRewardQuery">重置</el-button>
            </el-form-item>
          </el-form>

          <el-row :gutter="10" class="mb-3">
            <el-col :span="1.5">
              <el-button
                v-hasPermi="['recruitment:promotionReward:settle']"
                type="success"
                plain
                icon="Money"
                :disabled="selectedRewardIds.length === 0"
                @click="openSettleDialog('1')"
                >批量结算</el-button
              >
            </el-col>
            <el-col :span="1.5">
              <el-button
                v-hasPermi="['recruitment:promotionReward:settle']"
                type="danger"
                plain
                icon="CircleClose"
                :disabled="selectedRewardIds.length === 0"
                @click="openSettleDialog('2')"
                >批量驳回</el-button
              >
            </el-col>
          </el-row>

          <el-table v-loading="rewardLoading" :data="rewardRows" border stripe @selection-change="handleRewardSelection">
            <el-table-column type="selection" width="50" align="center" />
            <el-table-column label="推广人" min-width="180" show-overflow-tooltip>
              <template #default="{ row }">
                <div class="primary-text">{{ row.promoterName || '-' }}</div>
                <div class="sub-text">{{ row.promoterPhone || '-' }}</div>
              </template>
            </el-table-column>
            <el-table-column label="事件" prop="eventName" min-width="160" show-overflow-tooltip />
            <el-table-column label="求职者" min-width="170" show-overflow-tooltip>
              <template #default="{ row }">
                <div class="primary-text">{{ row.targetName || '-' }}</div>
                <div class="sub-text">{{ row.maskedPhone || '-' }}</div>
              </template>
            </el-table-column>
            <el-table-column label="奖励金额" width="120" align="right">
              <template #default="{ row }">¥{{ money(row.rewardAmount) }}</template>
            </el-table-column>
            <el-table-column label="状态" width="110" align="center">
              <template #default="{ row }">
                <el-tag :type="rewardTag(row.status)" size="small">{{ row.statusName || rewardText(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="创建时间" prop="createTime" width="170" align="center" />
            <el-table-column label="结算时间" prop="settleTime" width="170" align="center" />
            <el-table-column label="结算备注" prop="settleRemark" min-width="220" show-overflow-tooltip />
            <el-table-column label="操作" width="150" align="center" fixed="right">
              <template #default="{ row }">
                <el-button
                  v-if="row.status === '0'"
                  v-hasPermi="['recruitment:promotionReward:settle']"
                  link
                  type="success"
                  icon="Check"
                  @click="openSettleDialog('1', row)"
                  >结算</el-button
                >
                <el-button
                  v-if="row.status === '0'"
                  v-hasPermi="['recruitment:promotionReward:settle']"
                  link
                  type="danger"
                  icon="Close"
                  @click="openSettleDialog('2', row)"
                  >驳回</el-button
                >
              </template>
            </el-table-column>
          </el-table>

          <pagination
            v-show="rewardTotal > 0"
            v-model:page="rewardQuery.pageNum"
            v-model:limit="rewardQuery.pageSize"
            :total="rewardTotal"
            @pagination="loadRewards"
          />
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-dialog v-model="ruleDialog.visible" title="配置奖励规则" width="520px" append-to-body>
      <el-form :model="ruleForm" label-width="96px">
        <el-form-item label="事件类型">
          <el-select v-model="ruleForm.eventType" style="width: 100%" disabled>
            <el-option v-for="item in eventOptions" :key="item.value" :label="item.value" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="事件名称">
          <el-input v-model="ruleForm.eventName" maxlength="80" />
        </el-form-item>
        <el-form-item label="奖励金额">
          <el-input-number v-model="ruleForm.rewardAmount" :min="0" :precision="2" :step="1" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="ruleForm.status">
            <el-radio label="1">启用</el-radio>
            <el-radio label="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="ruleForm.remark" type="textarea" :rows="3" maxlength="200" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="ruleDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="submitRule">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="auditDialog.visible"
      :title="auditForm.auditStatus === '1' ? '通过推广人申请' : '拒绝推广人申请'"
      width="520px"
      append-to-body
    >
      <el-form :model="auditForm" label-width="96px">
        <el-form-item label="处理备注">
          <el-input v-model="auditForm.auditRemark" type="textarea" :rows="4" maxlength="300" show-word-limit placeholder="请输入审核备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditDialog.visible = false">取消</el-button>
        <el-button :type="auditForm.auditStatus === '1' ? 'success' : 'danger'" @click="submitAudit">确认</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="settleDialog.visible" :title="settleForm.status === '1' ? '结算推广奖励' : '驳回推广奖励'" width="520px" append-to-body>
      <el-form :model="settleForm" label-width="96px">
        <el-form-item label="处理备注">
          <el-input v-model="settleForm.remark" type="textarea" :rows="4" maxlength="300" show-word-limit placeholder="请输入处理备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="settleDialog.visible = false">取消</el-button>
        <el-button :type="settleForm.status === '1' ? 'success' : 'danger'" @click="submitSettle">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  auditPromotionPromoter,
  listPromoter,
  listPromotionRewards,
  listPromotionRewardRules,
  savePromotionRewardRule,
  settlePromotionRewards,
  type PromoterVO,
  type PromotionPromoterAuditForm,
  type PromotionRewardQuery,
  type PromotionRewardRuleVO,
  type PromotionRewardSettleForm,
  type PromotionRewardVO
} from '@/api/recruitment';

const eventOptions = [
  { label: '求职者手机号授权', value: 'C_PHONE_AUTH' },
  { label: '求职者完善简历', value: 'C_RESUME_COMPLETE' },
  { label: '求职者首次投递', value: 'C_FIRST_APPLY' }
];

const activeTab = ref('audit');
const ruleLoading = ref(false);
const auditLoading = ref(false);
const rewardLoading = ref(false);
const ruleList = ref<PromotionRewardRuleVO[]>([]);
const auditRows = ref<PromoterVO[]>([]);
const rewardRows = ref<PromotionRewardVO[]>([]);
const auditTotal = ref(0);
const rewardTotal = ref(0);
const selectedRewardIds = ref<Array<string | number>>([]);

// 推广人审核只查询 C 端申请人(identityType=3)，避免混入既有内部/渠道推广账号。
const auditQuery = reactive({
  pageNum: 1,
  pageSize: 10,
  identityType: '3',
  name: '',
  phonenumber: '',
  auditStatus: '0',
  status: ''
});

const rewardQuery = reactive<PromotionRewardQuery>({
  pageNum: 1,
  pageSize: 10,
  keyword: '',
  eventType: '',
  status: '0'
});

const ruleDialog = reactive({ visible: false });
const ruleForm = reactive<PromotionRewardRuleVO>({
  ruleId: undefined,
  eventType: '',
  eventName: '',
  rewardAmount: 0,
  status: '0',
  remark: ''
});

const auditDialog = reactive({ visible: false });
const auditForm = reactive<PromotionPromoterAuditForm>({
  promoterId: '',
  auditStatus: '1',
  auditRemark: ''
});

const settleDialog = reactive({ visible: false });
const settleForm = reactive<PromotionRewardSettleForm>({
  rewardIds: [],
  status: '1',
  remark: ''
});

const eventNameMap = computed(() => Object.fromEntries(eventOptions.map((item) => [item.value, item.label])));

const money = (value?: number) => Number(value || 0).toFixed(2);

const auditText = (status?: string) => {
  if (status === '0') return '待审核';
  if (status === '1') return '已通过';
  if (status === '2') return '已拒绝';
  return '未开通';
};

const auditTag = (status?: string) => {
  if (status === '1') return 'success';
  if (status === '2') return 'danger';
  if (status === '0') return 'warning';
  return 'info';
};

const rewardText = (status?: string) => {
  if (status === '0') return '待结算';
  if (status === '1') return '已结算';
  if (status === '2') return '已驳回';
  if (status === '3') return '已取消';
  return '未知';
};

const rewardTag = (status?: string) => {
  if (status === '1') return 'success';
  if (status === '2') return 'danger';
  if (status === '0') return 'warning';
  return 'info';
};

const readRows = <T,>(res: any): T[] => (Array.isArray(res?.rows) ? res.rows : []);
const readTotal = (res: any) => Number(res?.total || 0);

async function loadRules() {
  ruleLoading.value = true;
  try {
    const res: any = await listPromotionRewardRules();
    ruleList.value = Array.isArray(res?.data) ? res.data : [];
  } finally {
    ruleLoading.value = false;
  }
}

async function loadAuditPromoters() {
  auditLoading.value = true;
  try {
    const res: any = await listPromoter(auditQuery as any);
    auditRows.value = readRows<PromoterVO>(res);
    auditTotal.value = readTotal(res);
  } finally {
    auditLoading.value = false;
  }
}

async function loadRewards() {
  rewardLoading.value = true;
  try {
    const res: any = await listPromotionRewards(rewardQuery);
    rewardRows.value = readRows<PromotionRewardVO>(res);
    rewardTotal.value = readTotal(res);
  } finally {
    rewardLoading.value = false;
  }
}

function handleTabChange() {
  if (activeTab.value === 'audit') {
    loadAuditPromoters();
  } else {
    loadRewards();
  }
}

function handleAuditQuery() {
  auditQuery.pageNum = 1;
  loadAuditPromoters();
}

function resetAuditQuery() {
  auditQuery.pageNum = 1;
  auditQuery.pageSize = 10;
  auditQuery.identityType = '3';
  auditQuery.name = '';
  auditQuery.phonenumber = '';
  auditQuery.auditStatus = '0';
  auditQuery.status = '';
  loadAuditPromoters();
}

function handleRewardQuery() {
  rewardQuery.pageNum = 1;
  loadRewards();
}

function resetRewardQuery() {
  rewardQuery.pageNum = 1;
  rewardQuery.pageSize = 10;
  rewardQuery.keyword = '';
  rewardQuery.eventType = '';
  rewardQuery.status = '0';
  loadRewards();
}

function openRuleDialog(row: PromotionRewardRuleVO) {
  ruleForm.ruleId = row.ruleId;
  ruleForm.eventType = row.eventType;
  ruleForm.eventName = row.eventName || eventNameMap.value[row.eventType || ''] || '';
  ruleForm.rewardAmount = Number(row.rewardAmount || 0);
  ruleForm.status = row.status || '0';
  ruleForm.remark = row.remark || '';
  ruleDialog.visible = true;
}

async function submitRule() {
  if (!ruleForm.eventType || !ruleForm.eventName) {
    ElMessage.warning('请填写奖励事件名称');
    return;
  }
  await savePromotionRewardRule({ ...ruleForm });
  ElMessage.success('保存成功');
  ruleDialog.visible = false;
  loadRules();
}

function openAuditDialog(row: PromoterVO, auditStatus: '1' | '2') {
  auditForm.promoterId = row.promoterId || '';
  auditForm.auditStatus = auditStatus;
  auditForm.auditRemark = auditStatus === '1' ? '审核通过' : '';
  auditDialog.visible = true;
}

async function submitAudit() {
  if (!auditForm.promoterId) {
    ElMessage.warning('缺少推广人ID');
    return;
  }
  if (auditForm.auditStatus === '2' && !auditForm.auditRemark) {
    ElMessage.warning('拒绝时请填写审核备注');
    return;
  }
  await auditPromotionPromoter({ ...auditForm });
  ElMessage.success('处理成功');
  auditDialog.visible = false;
  loadAuditPromoters();
}

function handleRewardSelection(rows: PromotionRewardVO[]) {
  selectedRewardIds.value = rows.filter((row) => row.status === '0' && row.rewardId).map((row) => row.rewardId!);
}

function openSettleDialog(status: '1' | '2', row?: PromotionRewardVO) {
  settleForm.rewardIds = row?.rewardId ? [row.rewardId] : [...selectedRewardIds.value];
  if (!settleForm.rewardIds.length) {
    ElMessage.warning('请选择待结算奖励');
    return;
  }
  settleForm.status = status;
  settleForm.remark = status === '1' ? '人工结算完成' : '';
  settleDialog.visible = true;
}

async function submitSettle() {
  if (settleForm.status === '2' && !settleForm.remark) {
    ElMessage.warning('驳回时请填写处理备注');
    return;
  }
  const actionText = settleForm.status === '1' ? '结算' : '驳回';
  await ElMessageBox.confirm(`确认${actionText}选中的推广奖励吗？`, '提示', { type: 'warning' });
  await settlePromotionRewards({ ...settleForm });
  ElMessage.success(`${actionText}成功`);
  settleDialog.visible = false;
  selectedRewardIds.value = [];
  loadRewards();
}

onMounted(() => {
  loadRules();
  loadAuditPromoters();
});
</script>

<style scoped>
.promotion-reward-page {
  min-width: 980px;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
}

.primary-text {
  color: #303133;
  font-weight: 600;
  line-height: 20px;
}

.sub-text {
  color: #909399;
  font-size: 12px;
  line-height: 18px;
}
</style>
