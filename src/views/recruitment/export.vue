<template>
  <div class="p-4">
    <!-- 顶部说明 -->
    <el-card shadow="hover" class="mb-4">
      <div class="intro">
        <div class="intro-title">
          <el-icon class="intro-icon"><Download /></el-icon>
          <span>数据导出中心</span>
        </div>
        <div class="intro-desc">统一导出运营台各业务域数据（Excel）。单次导出上限 1 万条；导出动作会写入审计留痕。</div>
      </div>
    </el-card>

    <!-- 导出项卡片网格 -->
    <el-row :gutter="16">
      <el-col v-for="item in exportItems" :key="item.key" :xs="24" :sm="12" :md="8" :lg="6" class="mb-4">
        <el-card shadow="hover" class="export-card">
          <div class="export-card-body">
            <div class="export-card-top">
              <div class="export-icon" :style="{ background: item.color + '1a', color: item.color }">
                <el-icon :size="22"><component :is="item.icon" /></el-icon>
              </div>
              <div class="export-meta">
                <div class="export-name">{{ item.title }}</div>
                <div class="export-sub">{{ item.desc }}</div>
              </div>
            </div>
            <el-button type="primary" icon="Download" class="export-btn" :loading="loadingKey === item.key" @click="handleExport(item)">
              导出 Excel
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup name="RecruitmentExport" lang="ts">
// 运营台·数据导出中心
// 职责：聚合后端各业务域的 Excel 导出入口，逐项一键导出。
// 数据来源/端点：全部为后端 POST 导出接口（blob 下载），路径与 @/api/recruitment 中的 *ExportUrl 常量保持一致：
//   企业 /admin/recruitment/company/exportData     岗位 /admin/recruitment/job/export
//   投递 /admin/recruitment/apply/export            用户 /admin/recruitment/user/export
//   任务 /admin/recruitment/export/task             台账 /admin/recruitment/export/ledger
//   发票 /admin/recruitment/export/invoice          审计 /admin/auditLog/export
// 副作用：调用 utils/request 的全局 download()（POST + responseType:blob + FileSaver 保存），并触发后端导出留痕。
import { ref, markRaw } from 'vue';
import { download } from '@/utils/request';
import { OfficeBuilding, Briefcase, Document, User, Tickets, Money, Files, List, Download } from '@element-plus/icons-vue';
import {
  companyExportUrl,
  jobExportUrl,
  applyExportUrl,
  userExportUrl,
  taskExportUrl,
  ledgerExportUrl,
  invoiceExportUrl,
  auditLogExportUrl
} from '@/api/recruitment';

// 单个导出项的描述：title 展示名、url 后端端点、icon 图标、color 主题色（贴近后台主色 #2b7fff）。
interface ExportItem {
  key: string;
  title: string;
  desc: string;
  url: string;
  fileLabel: string; // 落地文件名前缀
  icon: any;
  color: string;
}

// markRaw 避免图标组件被 Vue 响应式代理（图标是无状态组件，纯展示）。
const exportItems: ExportItem[] = [
  {
    key: 'company',
    title: '企业数据',
    desc: '入驻企业基础信息',
    url: companyExportUrl,
    fileLabel: '企业数据',
    icon: markRaw(OfficeBuilding),
    color: '#2b7fff'
  },
  { key: 'job', title: '岗位数据', desc: '发布岗位明细', url: jobExportUrl, fileLabel: '岗位数据', icon: markRaw(Briefcase), color: '#2b7fff' },
  { key: 'apply', title: '投递数据', desc: '求职投递记录', url: applyExportUrl, fileLabel: '投递记录', icon: markRaw(Document), color: '#13c2c2' },
  { key: 'user', title: '用户数据', desc: '求职者账号信息', url: userExportUrl, fileLabel: '求职者数据', icon: markRaw(User), color: '#722ed1' },
  { key: 'task', title: '履约数据', desc: '任务履约/核验台账', url: taskExportUrl, fileLabel: '任务数据', icon: markRaw(Tickets), color: '#fa8c16' },
  { key: 'ledger', title: '台账数据', desc: '资金结算台账', url: ledgerExportUrl, fileLabel: '台账数据', icon: markRaw(Money), color: '#52c41a' },
  { key: 'invoice', title: '发票数据', desc: '开票记录', url: invoiceExportUrl, fileLabel: '发票数据', icon: markRaw(Files), color: '#eb2f96' },
  { key: 'audit', title: '审计数据', desc: '后台操作审计日志', url: auditLogExportUrl, fileLabel: '审计日志', icon: markRaw(List), color: '#595959' }
];

// 当前正在导出的项 key，用于按钮 loading 互斥反馈。
const loadingKey = ref<string>('');

// 触发一次导出：复用全局 download()（POST blob 下载）。不带筛选参数 = 导出全量（后端有 1 万条兜底）。
function handleExport(item: ExportItem) {
  loadingKey.value = item.key;
  const fileName = `${item.fileLabel}_${new Date().getTime()}.xlsx`;
  Promise.resolve(download(item.url, {}, fileName)).finally(() => {
    loadingKey.value = '';
  });
}
</script>

<style scoped>
.mb-4 {
  margin-bottom: 16px;
}

.intro {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.intro-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 700;
  color: #303133;
}

.intro-icon {
  color: #2b7fff;
}

.intro-desc {
  font-size: 13px;
  color: #909399;
}

.export-card {
  height: 100%;
}

.export-card-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.export-card-top {
  display: flex;
  align-items: center;
  gap: 12px;
}

.export-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.export-meta {
  min-width: 0;
}

.export-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.export-sub {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.export-btn {
  width: 100%;
}
</style>
