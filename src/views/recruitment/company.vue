<template>
  <div class="p-4">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="mb-4">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-mini-card">
          <div class="stat-mini">
            <span class="label">企业总数</span>
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
            <span class="label">已认证</span>
            <span class="value success">{{ statistics.approvedCount || 0 }}</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-mini-card danger">
          <div class="stat-mini">
            <span class="label">已禁用</span>
            <span class="value danger">{{ statistics.disabledCount || 0 }}</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 禁言统计（独立一行） -->
    <el-row :gutter="20" class="mb-4">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-mini-card danger">
          <div class="stat-mini">
            <span class="label">被禁言企业</span>
            <span class="value danger">{{ statistics.silencedCount || 0 }}</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 查询表单 -->
    <el-card shadow="hover" class="mb-4">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true">
        <el-form-item label="企业名称" prop="companyName">
          <el-input v-model="queryParams.companyName" placeholder="请输入企业名称" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 150px">
            <el-option label="待审核" value="0" />
            <el-option label="已认证" value="1" />
            <el-option label="已禁用" value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="禁言状态" prop="isSilenced">
          <el-select v-model="queryParams.isSilenced" placeholder="全部" clearable style="width: 150px">
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
        <el-table-column label="企业ID" prop="companyId" width="200" align="center" />
        <el-table-column label="企业信息" min-width="200">
          <template #default="{ row }">
            <div class="company-info">
              <el-avatar v-if="row.logoUrl" :src="row.logoUrl" :size="40" />
              <el-avatar v-else :size="40" style="background: #409EFF">
                {{ row.companyName?.charAt(0) }}
              </el-avatar>
              <div class="company-detail">
                <div class="name">{{ row.companyName }}</div>
                <div class="desc text-secondary">{{ row.description || '暂无描述' }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="联系人" width="150">
          <template #default="{ row }">
            <div>{{ row.contactPerson || '-' }}</div>
            <div class="text-secondary">{{ row.contactPhone || '' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="职位数" prop="jobCount" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="info">{{ row.jobCount || 0 }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="投递数" prop="applyCount" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="success">{{ row.applyCount || 0 }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="认证状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="companyStatusMeta(row.status).type">{{ companyStatusMeta(row.status).label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="禁言状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.isSilenced === '1'" type="danger">
              <el-icon><WarnTriangleFilled /></el-icon> 已禁言
            </el-tag>
            <el-tag v-else type="info">正常</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="注册时间" prop="createTime" width="160" align="center" />
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
              <el-button link type="primary" icon="View" @click="handleDetail(row)">详情</el-button>
              <el-dropdown trigger="click">
                <span class="el-dropdown-link">
                  <el-button link type="primary">管理<el-icon class="el-icon--right"><arrow-down /></el-icon></el-button>
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item v-if="row.status === '0'" icon="CircleCheck" @click="handleAudit(row, '1')">审核通过</el-dropdown-item>
                    <el-dropdown-item v-if="row.status === '0'" icon="Close" @click="handleAudit(row, '2')">审核拒绝</el-dropdown-item>
                    <el-dropdown-item v-if="row.status === '1'" icon="Lock" @click="handleStatusChange(row, '2')">禁用企业</el-dropdown-item>
                    <el-dropdown-item v-if="row.status === '2'" icon="Unlock" @click="handleStatusChange(row, '1')">启用企业</el-dropdown-item>
                    <el-dropdown-item divided icon="MuteNotification" @click="handleSilence(row)" v-if="row.isSilenced !== '1'">
                      禁言企业
                    </el-dropdown-item>
                    <el-dropdown-item icon="MuteNotification" @click="handleUnsilence(row)" v-if="row.isSilenced === '1'">
                      取消禁言
                    </el-dropdown-item>
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

    <!-- 企业详情对话框：主体信息 + 资质图片 + 历史审核记录 -->
    <el-dialog v-model="detailVisible" title="企业详情" width="820px" append-to-body>
      <div v-if="currentCompany">
        <!-- 主体信息 -->
        <el-descriptions title="主体信息" :column="2" border>
          <el-descriptions-item label="企业ID">{{ currentCompany.companyId }}</el-descriptions-item>
          <el-descriptions-item label="企业状态">
            <el-tag :type="companyStatusMeta(currentCompany.status).type">{{ companyStatusMeta(currentCompany.status).label }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="企业名称" :span="2">{{ currentCompany.companyName }}</el-descriptions-item>
          <el-descriptions-item label="企业描述" :span="2">{{ currentCompany.description || '无' }}</el-descriptions-item>
          <el-descriptions-item label="联系人">{{ currentCompany.contactPerson || '-' }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ currentCompany.contactPhone || '-' }}</el-descriptions-item>
          <el-descriptions-item label="联系微信">{{ currentCompany.contactWechat || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建人ID">{{ currentCompany.userId || '-' }}</el-descriptions-item>
          <el-descriptions-item label="职位数量">{{ currentCompany.jobCount || 0 }}</el-descriptions-item>
          <el-descriptions-item label="投递总数">{{ currentCompany.applyCount || 0 }}</el-descriptions-item>
          <el-descriptions-item label="禁言状态">
            <el-tag v-if="currentCompany.isSilenced === '1'" type="danger">已禁言</el-tag>
            <el-tag v-else type="info">正常</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="禁言时间" v-if="currentCompany.isSilenced === '1'">
            {{ currentCompany.silenceTime || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="禁言原因" :span="2" v-if="currentCompany.isSilenced === '1'">
            {{ currentCompany.silenceReason || '无' }}
          </el-descriptions-item>
          <el-descriptions-item label="注册时间">{{ currentCompany.createTime }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ currentCompany.updateTime }}</el-descriptions-item>
          <el-descriptions-item label="备注/审核意见" :span="2">{{ currentCompany.remark || '无' }}</el-descriptions-item>
        </el-descriptions>

        <!-- 资质图片：企业 Logo 与营业执照（来自 company 表，点击可放大预览） -->
        <div class="section-title">资质图片</div>
        <div class="cert-images">
          <div class="cert-item">
            <div class="cert-label">企业 Logo</div>
            <el-image
              v-if="currentCompany.logoUrl"
              :src="currentCompany.logoUrl"
              :preview-src-list="[currentCompany.logoUrl]"
              :preview-teleported="true"
              fit="cover"
              class="cert-img"
            />
            <div v-else class="cert-empty">未上传</div>
          </div>
          <div class="cert-item">
            <div class="cert-label">营业执照</div>
            <el-image
              v-if="currentCompany.businessLicense"
              :src="currentCompany.businessLicense"
              :preview-src-list="[currentCompany.businessLicense]"
              :preview-teleported="true"
              fit="cover"
              class="cert-img"
            />
            <div v-else class="cert-empty">未上传</div>
          </div>
        </div>

        <!-- 历史审核记录：聚合 rec_audit_log 操作留痕 + company_cert 认证历史 -->
        <div class="section-title">历史审核记录</div>
        <el-tabs v-model="historyTab" v-loading="historyLoading">
          <!-- 操作留痕时间线（运营端审核/状态变更/禁言等关键操作） -->
          <el-tab-pane label="操作留痕" name="logs">
            <el-empty v-if="!auditHistory.auditLogs || auditHistory.auditLogs.length === 0" description="暂无操作留痕" :image-size="80" />
            <el-timeline v-else>
              <el-timeline-item
                v-for="log in auditHistory.auditLogs"
                :key="log.logId"
                :timestamp="log.operTime"
                placement="top"
                :type="auditLogDotType(log.action)"
              >
                <div class="log-line">
                  <el-tag size="small" :type="auditLogDotType(log.action)">{{ log.action || '操作' }}</el-tag>
                  <span class="log-oper">{{ log.operName || '系统' }}</span>
                  <span v-if="log.beforeStatus || log.afterStatus" class="log-status">
                    {{ log.beforeStatus || '-' }} → {{ log.afterStatus || '-' }}
                  </span>
                </div>
                <div v-if="log.detail" class="log-detail">{{ log.detail }}</div>
                <div v-if="log.remark" class="log-detail">备注：{{ log.remark }}</div>
              </el-timeline-item>
            </el-timeline>
          </el-tab-pane>

          <!-- 认证历史：历次提交的认证材料与审核结论 -->
          <el-tab-pane label="认证历史" name="certs">
            <el-empty v-if="!auditHistory.certHistory || auditHistory.certHistory.length === 0" description="暂无认证记录" :image-size="80" />
            <el-card v-for="cert in auditHistory.certHistory" :key="cert.certId" shadow="never" class="cert-card">
              <div class="cert-card-header">
                <span class="cert-card-title">认证 #{{ cert.certId }}</span>
                <el-tag :type="certStatusMeta(cert.status).type" size="small">{{ certStatusMeta(cert.status).label }}</el-tag>
                <span class="cert-card-time">{{ cert.auditTime || cert.createTime || '' }}</span>
              </div>
              <el-descriptions :column="2" border size="small">
                <el-descriptions-item label="企业全称">{{ cert.companyName || '-' }}</el-descriptions-item>
                <el-descriptions-item label="统一社会信用代码">{{ cert.creditCode || '-' }}</el-descriptions-item>
                <el-descriptions-item label="法定代表人">{{ cert.legalPersonName || '-' }}</el-descriptions-item>
                <el-descriptions-item label="法人手机号">{{ cert.legalPersonPhone || '-' }}</el-descriptions-item>
                <el-descriptions-item label="注册地址" :span="2">{{ cert.registeredAddress || '-' }}</el-descriptions-item>
                <el-descriptions-item label="办公地址" :span="2">{{ cert.officeAddress || '-' }}</el-descriptions-item>
                <el-descriptions-item label="审核意见" :span="2">{{ cert.auditRemark || '-' }}</el-descriptions-item>
              </el-descriptions>
              <!-- 认证材料图片：营业执照 / 法人身份证正反面 / 对公账户凭证 / 授权书 / 办公实景（可多图） -->
              <div class="cert-images cert-images-wrap">
                <div v-for="img in certImageList(cert)" :key="img.label + img.url" class="cert-item">
                  <div class="cert-label">{{ img.label }}</div>
                  <el-image
                    :src="img.url"
                    :preview-src-list="certPreviewList(cert)"
                    :initial-index="img.index"
                    :preview-teleported="true"
                    fit="cover"
                    class="cert-img cert-img-sm"
                  />
                </div>
                <div v-if="certImageList(cert).length === 0" class="cert-empty">未上传认证材料</div>
              </div>
            </el-card>
          </el-tab-pane>
        </el-tabs>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 审核对话框：通过走 /company/audit（后端固定置为已认证并生成企业编号）；驳回走 /company/changeStatus（status=2，原因写入 remark） -->
    <el-dialog v-model="auditVisible" title="企业审核" width="500px" append-to-body>
      <el-form ref="auditFormRef" :model="auditForm" :rules="auditRules" label-width="80px">
        <el-form-item label="企业名称">
          <el-input :model-value="auditForm.companyName" disabled />
        </el-form-item>
        <el-form-item label="审核结果" prop="status">
          <el-radio-group v-model="auditForm.status">
            <el-radio label="1">审核通过</el-radio>
            <el-radio label="2">审核拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
        <!-- 通过提示：认证通过后系统将为该企业生成正式企业编号 -->
        <el-alert
          v-if="auditForm.status === '1'"
          type="success"
          :closable="false"
          show-icon
          title="审核通过后，系统将自动为该企业生成企业编号并标记为已认证。"
          style="margin-bottom: 16px"
        />
        <!-- 驳回必填原因：原因将作为审核意见记录到企业备注，便于企业端查看整改 -->
        <el-form-item v-if="auditForm.status === '2'" label="驳回原因" prop="remark">
          <el-input
            v-model="auditForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请填写驳回原因，将同步告知企业用于整改"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        <!-- 通过时备注选填 -->
        <el-form-item v-else label="备注">
          <el-input v-model="auditForm.remark" type="textarea" :rows="3" placeholder="可填写审核备注（选填）" maxlength="200" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditVisible = false">取消</el-button>
        <el-button :type="auditForm.status === '2' ? 'danger' : 'primary'" :loading="auditSubmitting" @click="submitAudit">
          {{ auditForm.status === '2' ? '确认驳回' : '确认通过' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 禁言对话框 -->
    <el-dialog v-model="silenceVisible" title="禁言企业" width="500px" append-to-body>
      <el-form ref="silenceFormRef" :model="silenceForm" label-width="100px">
        <el-alert type="warning" :closable="false" style="margin-bottom: 16px">
          禁言后该企业将无法发布新职位，之前发布的职位可正常被查看和投递
        </el-alert>
        <el-form-item label="企业名称">
          <el-input :model-value="silenceForm.companyName" disabled />
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

<script setup name="CompanyManagement" lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox, type FormRules } from 'element-plus';
import {
  listCompany,
  getCompanyStatistics,
  getCompany,
  getCompanyAuditHistory,
  auditCompany,
  changeCompanyStatus,
  silenceCompany,
  unsilenceCompany,
  type CompanyAuditHistoryVO,
  type CompanyCertVO,
} from '@/api/recruitment';
import { download } from '@/utils/request';
import { unwrapList, splitToArray } from './helpers';
import { companyStatusMeta, certStatusMeta } from './constants';

const loading = ref(false);
const total = ref(0);
const tableData = ref<any[]>([]);
const detailVisible = ref(false);
const auditVisible = ref(false);
const silenceVisible = ref(false);
const currentCompany = ref<any>(null);
const queryFormRef = ref();
const auditFormRef = ref();
const silenceFormRef = ref();

// 审核提交中标志，防止重复提交（通过/驳回均复用）
const auditSubmitting = ref(false);

// ===== 历史审核记录（详情弹窗）=====
// 数据来源：getCompanyAuditHistory → CompanyAuditHistoryVO，聚合 rec_audit_log 与 company_cert。
const historyTab = ref('logs');
const historyLoading = ref(false);
const auditHistory = ref<CompanyAuditHistoryVO>({ auditLogs: [], certHistory: [] });

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  companyName: '',
  status: '',
  isSilenced: '',
});

const statistics = reactive({
  totalCount: 0,
  pendingCount: 0,
  approvedCount: 0,
  disabledCount: 0,
  silencedCount: 0,
});

const auditForm = reactive({
  companyId: 0,
  companyName: '',
  status: '1',
  remark: '',
});

// 审核校验：驳回时原因必填（status==='2' 才校验 remark），通过时备注选填。
const auditRules = reactive<FormRules>({
  status: [{ required: true, message: '请选择审核结果', trigger: 'change' }],
  remark: [
    {
      validator: (_rule, value, callback) => {
        if (auditForm.status === '2' && !String(value || '').trim()) {
          callback(new Error('驳回时必须填写驳回原因'));
        } else {
          callback();
        }
      },
      trigger: 'blur',
    },
  ],
});

const silenceForm = reactive({
  companyId: 0,
  companyName: '',
  reason: '',
});

async function loadData() {
  loading.value = true;
  try {
    const res = await listCompany(queryParams);
    const list = unwrapList(res);
    tableData.value = list.rows;
    total.value = list.total;
  } catch (error) {
    ElMessage.error('加载数据失败');
  } finally {
    loading.value = false;
  }
}

async function loadStatistics() {
  try {
    const res = await getCompanyStatistics();
    Object.assign(statistics, res.data || {});
  } catch (error) {
    console.error('统计加载失败:', error);
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
  queryParams.isSilenced = '';
  loadData();
}

async function handleDetail(row: any) {
  try {
    const res = await getCompany(row.companyId);
    currentCompany.value = res.data;
    historyTab.value = 'logs';
    detailVisible.value = true;
    // 并行加载历史审核记录（操作留痕 + 认证历史），失败不阻断详情展示
    loadAuditHistory(row.companyId);
  } catch (error) {
    ElMessage.error('获取企业详情失败');
  }
}

// 加载企业审核历史；后端已分别按时间倒序，前端直接渲染。
async function loadAuditHistory(companyId: number) {
  historyLoading.value = true;
  auditHistory.value = { auditLogs: [], certHistory: [] };
  try {
    const res = await getCompanyAuditHistory(companyId);
    auditHistory.value = res.data || { auditLogs: [], certHistory: [] };
  } catch (error) {
    console.error('审核历史加载失败:', error);
  } finally {
    historyLoading.value = false;
  }
}

// 按操作动作给时间线节点上色：审核/通过=绿，驳回/拒绝/禁言/禁用=红，其余=主色蓝。
function auditLogDotType(action?: string): 'primary' | 'success' | 'warning' | 'danger' | 'info' {
  const a = action || '';
  if (/拒绝|驳回|禁言|禁用|删除/.test(a)) return 'danger';
  if (/通过|认证|启用|解禁/.test(a)) return 'success';
  if (/导出|状态/.test(a)) return 'warning';
  return 'primary';
}

// 认证材料图片清单（带标签 + 在合并预览列表中的索引）。officePhotos 可能为逗号分隔多图。
function certImageList(cert: CompanyCertVO): { label: string; url: string; index: number }[] {
  const list: { label: string; url: string }[] = [];
  const push = (label: string, url?: string) => {
    if (url && String(url).trim()) list.push({ label, url: String(url).trim() });
  };
  push('营业执照', cert.businessLicense);
  push('法人身份证(正)', cert.legalPersonIdFront);
  push('法人身份证(反)', cert.legalPersonIdBack);
  push('对公账户凭证', cert.bankAccountProof);
  push('招聘授权书', cert.authLetter);
  // officePhotos 为逗号分隔多图地址，统一切割（含中文逗号兼容）
  splitToArray(cert.officePhotos).forEach((url, i) => push(`办公实景${i + 1}`, url));
  return list.map((item, index) => ({ ...item, index }));
}

// 单条认证记录的预览图地址列表（与 certImageList 顺序一致，供 el-image 放大轮播）。
function certPreviewList(cert: CompanyCertVO): string[] {
  return certImageList(cert).map((i) => i.url);
}

function handleAudit(row: any, status: string) {
  auditForm.companyId = row.companyId;
  auditForm.companyName = row.companyName;
  auditForm.status = status;
  auditForm.remark = '';
  auditVisible.value = true;
  // 清除上一次的校验态，避免残留红框
  auditFormRef.value?.clearValidate?.();
}

async function submitAudit() {
  // 通过/驳回均先过表单校验（驳回原因必填由 auditRules 兜底）
  try {
    await auditFormRef.value?.validate?.();
  } catch {
    return;
  }
  auditSubmitting.value = true;
  try {
    if (auditForm.status === '2') {
      // 驳回：/company/audit 后端固定置为已认证，不能用于驳回；改走 changeStatus 置为已禁用(2)，原因写入 remark。
      await changeCompanyStatus({ companyId: auditForm.companyId, status: '2', remark: auditForm.remark });
      ElMessage.success('已驳回该企业认证');
    } else {
      // 通过：/company/audit 后端置为已认证并生成企业编号
      await auditCompany({ companyId: auditForm.companyId, status: '1', remark: auditForm.remark });
      ElMessage.success('审核通过，已生成企业编号');
    }
    auditVisible.value = false;
    loadData();
    loadStatistics();
  } catch (error) {
    ElMessage.error('审核提交失败');
  } finally {
    auditSubmitting.value = false;
  }
}

async function handleStatusChange(row: any, status: string) {
  const action = status === '1' ? '启用' : '禁用';
  try {
    await ElMessageBox.confirm(`确定要${action}该企业吗？`, '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning',
    });
    await changeCompanyStatus({ companyId: row.companyId, status });
    ElMessage.success(`${action}成功`);
    loadData();
    loadStatistics();
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(`${action}失败`);
    }
  }
}

function handleSilence(row: any) {
  silenceForm.companyId = row.companyId;
  silenceForm.companyName = row.companyName;
  silenceForm.reason = '';
  silenceVisible.value = true;
}

async function submitSilence() {
  if (!silenceForm.reason.trim()) {
    ElMessage.warning('请填写禁言原因');
    return;
  }
  try {
    await silenceCompany({ companyId: silenceForm.companyId, silenceReason: silenceForm.reason });
    ElMessage.success('禁言成功');
    silenceVisible.value = false;
    loadData();
    loadStatistics();
  } catch (error) {
    ElMessage.error('禁言失败');
  }
}

async function handleUnsilence(row: any) {
  try {
    await ElMessageBox.confirm('确定要取消该企业的禁言状态吗？取消后该企业可正常发布职位。', '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning',
    });
    await unsilenceCompany({ companyId: row.companyId });
    ElMessage.success('已取消禁言');
    loadData();
    loadStatistics();
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败');
    }
  }
}

onMounted(() => {
  loadData();
  loadStatistics();
});

function handleExport() {
  download('/admin/recruitment/company/exportData', queryParams, `企业数据_${new Date().getTime()}.xlsx`);
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
  gap: 4px;
}

.stat-mini .label {
  font-size: 13px;
  color: #909399;
}

.stat-mini .value {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
}

.stat-mini .value.warning { color: #E6A23C; }
.stat-mini .value.success { color: #67C23A; }
.stat-mini .value.danger  { color: #F56C6C; }

.text-secondary {
  font-size: 12px;
  color: #909399;
}

.company-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.company-detail .name {
  font-weight: 600;
  color: #303133;
}

.company-detail .desc {
  font-size: 12px;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.el-dropdown-link {
  cursor: pointer;
  color: var(--el-color-primary);
  display: flex;
  align-items: center;
}

/* 详情弹窗：分区标题，主色贴近 #2b7fff */
.section-title {
  margin: 20px 0 12px;
  padding-left: 10px;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  border-left: 4px solid #2b7fff;
}

/* 资质图片网格（企业 Logo / 营业执照 / 认证材料） */
.cert-images {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.cert-images-wrap {
  margin-top: 12px;
}

.cert-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cert-label {
  font-size: 12px;
  color: #909399;
}

.cert-img {
  width: 140px;
  height: 100px;
  border-radius: 6px;
  border: 1px solid #ebeef5;
  background: #f5f7fa;
}

.cert-img-sm {
  width: 110px;
  height: 80px;
}

.cert-empty {
  width: 140px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #c0c4cc;
  border: 1px dashed #dcdfe6;
  border-radius: 6px;
  background: #fafafa;
}

/* 认证历史卡片 */
.cert-card {
  margin-bottom: 12px;
  border: 1px solid #ebeef5;
}

.cert-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.cert-card-title {
  font-weight: 600;
  color: #303133;
}

.cert-card-time {
  margin-left: auto;
  font-size: 12px;
  color: #909399;
}

/* 操作留痕时间线 */
.log-line {
  display: flex;
  align-items: center;
  gap: 8px;
}

.log-oper {
  font-weight: 600;
  color: #303133;
}

.log-status {
  font-size: 12px;
  color: #909399;
}

.log-detail {
  margin-top: 4px;
  font-size: 12px;
  color: #606266;
  line-height: 1.5;
}
</style>
