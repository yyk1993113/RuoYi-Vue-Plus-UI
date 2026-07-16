<!--
  交易管家·企业白名单（记账子单元申请）工作台。
  列表、统计与高风险写操作均来自 /admin/settlement/sub-account/*；银行账号和手机号默认只展示后端脱敏快照。
  拉黑是独立高危权限，后端将 APPROVED 流转为 BLACKLISTED 并保留活动占位，防止企业重新申请绕过风控。
-->
<template>
  <div class="p-4 sub-account-page">
    <el-row :gutter="16" class="mb-4 stat-row">
      <el-col :xs="12" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-mini-card clickable" :class="{ active: !query.status }" @click="applyStatusFilter('')">
          <div class="stat-mini">
            <span class="stat-label">申请总数</span>
            <strong class="stat-value">{{ statistics.totalCount }}</strong>
            <span class="stat-caption">全部记账子单元准入工单</span>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-mini-card warning clickable" :class="{ active: query.status === 'PENDING' }" @click="applyStatusFilter('PENDING')">
          <div class="stat-mini">
            <span class="stat-label">待审核</span>
            <strong class="stat-value warning">{{ statistics.pendingCount }}</strong>
            <span class="stat-caption">其中 {{ statistics.overduePendingCount }} 条已积压超 7 天</span>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-mini-card success clickable" :class="{ active: query.status === 'APPROVED' }" @click="applyStatusFilter('APPROVED')">
          <div class="stat-mini">
            <span class="stat-label">白名单企业</span>
            <strong class="stat-value success">{{ statistics.approvedCount }}</strong>
            <span class="stat-caption">已具备子单元准入资格</span>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-mini-card danger clickable" :class="{ active: query.status === 'BLACKLISTED' }" @click="applyStatusFilter('BLACKLISTED')">
          <div class="stat-mini">
            <span class="stat-label">已拉黑</span>
            <strong class="stat-value danger">{{ statistics.blacklistedCount }}</strong>
            <span class="stat-caption">已阻断白名单资格与重复申请</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-alert
      v-if="statistics.overduePendingCount > 0"
      class="risk-alert mb-4"
      type="warning"
      show-icon
      :closable="false"
      @click="applyStatusFilter('PENDING')"
    >
      <template #title>
        <span>有 {{ statistics.overduePendingCount }} 条待审核工单积压超过 7 天，请优先处理</span>
        <el-button type="warning" link>立即查看</el-button>
      </template>
    </el-alert>

    <el-card shadow="hover" class="mb-4 search-card">
      <el-form :model="query" inline class="query-form">
        <el-form-item label="联合检索">
          <el-input
            v-model="query.keyword"
            clearable
            maxlength="100"
            placeholder="企业名 / 子单元 / 账号 / 联系人"
            style="width: 260px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="审核状态">
          <el-select v-model="query.status" clearable placeholder="全部状态" style="width: 150px">
            <el-option label="待审核" value="PENDING" />
            <el-option label="已通过" value="APPROVED" />
            <el-option label="已驳回" value="REJECTED" />
            <el-option label="已拉黑" value="BLACKLISTED" />
          </el-select>
        </el-form-item>
        <el-form-item label="提交时间">
          <el-date-picker
            v-model="timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 340px"
          />
        </el-form-item>
        <el-form-item label="子单元名称">
          <el-input v-model="query.subAccountName" clearable maxlength="100" placeholder="请输入子单元名称" style="width: 200px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="开户行">
          <el-input v-model="query.bankBranch" clearable maxlength="120" placeholder="开户行 / 支行" style="width: 200px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item class="query-actions">
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button plain icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
      <div class="quick-filter-row">
        <span class="quick-label">快捷筛选</span>
        <el-button-group>
          <el-button :type="quickRange === 'today' ? 'primary' : 'default'" plain @click="applyQuickRange('today')">今日</el-button>
          <el-button :type="quickRange === '7d' ? 'primary' : 'default'" plain @click="applyQuickRange('7d')">近 7 天</el-button>
          <el-button :type="quickRange === '30d' ? 'primary' : 'default'" plain @click="applyQuickRange('30d')">近 30 天</el-button>
        </el-button-group>
        <el-button type="warning" plain icon="UserFilled" @click="applyStatusFilter('PENDING')">待审核工单</el-button>
        <span class="memory-hint"><el-icon><InfoFilled /></el-icon> 筛选条件会自动记忆</span>
      </div>
    </el-card>

    <el-card shadow="hover" class="table-card">
      <template #header>
        <div class="table-toolbar">
          <div class="toolbar-left">
            <div>
              <span class="table-title">企业白名单（记账子单元申请）</span>
              <span class="table-subtitle">共 {{ total }} 条</span>
            </div>
            <el-tag v-if="selectedRows.length" type="primary" effect="plain">已选 {{ selectedRows.length }} 条</el-tag>
          </div>
          <div class="toolbar-right">
            <el-button
              v-hasPermi="['settlement:subAccount:config']"
              type="warning"
              plain
              icon="Setting"
              @click="openCmbConfig"
            >
              招行配置
            </el-button>
            <el-button
              v-hasPermi="['settlement:subAccount:audit']"
              type="success"
              plain
              icon="CircleCheck"
              :disabled="!pendingSelections.length"
              @click="openAudit(pendingSelections)"
            >
              批量通过
            </el-button>
            <el-button
              v-hasPermi="['settlement:subAccount:audit']"
              type="danger"
              plain
              icon="CircleClose"
              :disabled="!pendingSelections.length"
              @click="openReject(pendingSelections)"
            >
              批量驳回
            </el-button>
            <el-tooltip content="全量 Excel 导出需后端提供独立导出接口后启用" placement="top">
              <span><el-button plain icon="Download" disabled>导出风控台账</el-button></span>
            </el-tooltip>
            <el-popover placement="bottom-end" :width="220" trigger="click">
              <template #reference><el-button plain icon="Setting">列设置</el-button></template>
              <div class="column-setting-title">选择展示字段</div>
              <el-checkbox-group v-model="visibleColumns" class="column-setting-list" @change="saveColumnSettings">
                <el-checkbox v-for="column in columnOptions" :key="column.key" :label="column.key" :disabled="column.required">{{ column.label }}</el-checkbox>
              </el-checkbox-group>
            </el-popover>
            <el-button type="primary" plain icon="Refresh" @click="refreshAll">刷新</el-button>
          </div>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="rows"
        border
        stripe
        row-key="applicationId"
        :row-class-name="tableRowClassName"
        @selection-change="onSelectionChange"
      >
        <el-table-column type="selection" width="46" align="center" :selectable="isRowSelectable" />
        <el-table-column label="企业名称" min-width="220" fixed="left">
          <template #default="{ row }">
            <div class="company-cell">
              <el-button link type="primary" class="company-name" @click="openDetail(row)">{{ row.companyName || '-' }}</el-button>
              <span class="company-code">{{ row.unifiedSocialCreditCode || '信用代码待补充' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column v-if="isColumnVisible('subAccount')" label="记账子单元" min-width="180">
          <template #default="{ row }">
            <div class="two-line-cell">
              <span>{{ row.subAccountName || '-' }}</span>
              <span class="secondary-text">{{ accountTypeText(row.accountType) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column v-if="isColumnVisible('bankAccount')" label="开户行 / 账号" min-width="230">
          <template #default="{ row }">
            <div class="two-line-cell">
              <el-tooltip :content="row.bankBranch || '未填写开户行'" placement="top">
                <span class="ellipsis-text">{{ row.bankBranch || '-' }}</span>
              </el-tooltip>
              <div class="sensitive-value-row masked-account">
                <span>{{ bankAccountText(row) }}</span>
                <el-tooltip :content="isBankAccountRevealed(row) ? '隐藏完整账号' : '查看完整账号'" placement="top">
                  <el-button
                    v-hasPermi="['settlement:subAccount:decrypt']"
                    class="sensitive-eye-button"
                    link
                    type="primary"
                    :icon="isBankAccountRevealed(row) ? 'Hide' : 'View'"
                    :loading="isSensitiveLoading(row, 'bank')"
                    :aria-label="isBankAccountRevealed(row) ? '隐藏完整银行卡号' : '查看完整银行卡号'"
                    @click.stop="toggleBankAccount(row)"
                  />
                </el-tooltip>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column v-if="isColumnVisible('contact')" label="联系人" min-width="150">
          <template #default="{ row }">
            <div class="two-line-cell">
              <span>{{ row.contactName || '-' }}</span>
              <div class="secondary-text contact-phone sensitive-value-row">
                <span>{{ contactPhoneText(row) }}</span>
                <el-tooltip :content="isContactPhoneRevealed(row) ? '隐藏完整手机号' : '查看完整手机号'" placement="top">
                  <el-button
                    v-hasPermi="['settlement:subAccount:decrypt']"
                    class="sensitive-eye-button"
                    link
                    type="primary"
                    :icon="isContactPhoneRevealed(row) ? 'Hide' : 'View'"
                    :loading="isSensitiveLoading(row, 'phone')"
                    :aria-label="isContactPhoneRevealed(row) ? '隐藏完整手机号' : '查看完整手机号'"
                    @click.stop="toggleContactPhone(row)"
                  />
                </el-tooltip>
                <el-tooltip content="复制当前显示号码" placement="top">
                  <el-button v-if="row.contactPhoneMasked" class="sensitive-eye-button" link type="primary" icon="CopyDocument" @click.stop="copyText(contactPhoneText(row))" />
                </el-tooltip>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column v-if="isColumnVisible('createTime')" label="申请提交时间" width="175" align="center">
          <template #default="{ row }">
            <div class="two-line-cell align-center">
              <span>{{ formatMinute(row.createTime) }}</span>
              <span :class="['waiting-time', { overdue: row.status === 'PENDING' && waitingDays(row) >= 7 }]">
                {{ waitingText(row) }}
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column v-if="isColumnVisible('auditNode')" label="当前审核节点" width="135" align="center">
          <template #default="{ row }">
            <el-tooltip v-if="statusReason(row)" :content="statusReason(row)" placement="top">
              <el-tag :type="statusMeta(row.status).type" :effect="row.status === 'BLACKLISTED' ? 'dark' : 'light'">
                {{ statusMeta(row.status).label }}
              </el-tag>
            </el-tooltip>
            <el-tag v-else :type="statusMeta(row.status).type">{{ statusMeta(row.status).label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column v-if="isColumnVisible('outflow')" label="出金状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="outflowMeta(row).type" effect="plain">{{ outflowMeta(row).label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column v-if="isColumnVisible('auditor')" label="审核信息" min-width="150" align="center">
          <template #default="{ row }">
            <div class="two-line-cell align-center">
              <span>{{ row.auditUserName || '待分配' }}</span>
              <span class="secondary-text">{{ formatMinute(row.auditTime) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="230" fixed="right" align="center">
          <template #default="{ row }">
            <div class="row-actions">
              <el-button link type="primary" icon="View" @click="openDetail(row)">详情</el-button>
              <el-button
                v-if="row.status === 'PENDING'"
                v-hasPermi="['settlement:subAccount:audit']"
                link
                type="success"
                icon="CircleCheck"
                :disabled="isSubmitting(row)"
                @click="openAudit([row])"
              >
                审核
              </el-button>
              <el-button
                v-if="row.status === 'PENDING'"
                v-hasPermi="['settlement:subAccount:audit']"
                link
                type="danger"
                icon="CircleClose"
                :disabled="isSubmitting(row)"
                @click="openReject(row)"
              >
                驳回
              </el-button>
              <el-button
                v-if="row.status === 'APPROVED'"
                v-hasPermi="['settlement:subAccount:blacklist']"
                link
                type="danger"
                icon="Lock"
                :disabled="isSubmitting(row)"
                @click="openBlacklist(row)"
              >
                拉黑
              </el-button>
              <el-dropdown trigger="click" @command="(command) => handleRowCommand(command, row)">
                <el-button link type="primary">更多<el-icon class="el-icon--right"><ArrowDown /></el-icon></el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="materials" icon="FolderOpened">查看材料</el-dropdown-item>
                    <el-dropdown-item command="logs" icon="Document">审计日志</el-dropdown-item>
                    <el-dropdown-item v-hasPermi="['settlement:subAccount:decrypt']" command="account" icon="View">查看完整账号</el-dropdown-item>
                    <el-dropdown-item command="freeze" icon="Warning" disabled divided>临时冻结（待接入）</el-dropdown-item>
                    <el-dropdown-item command="export" icon="Download" disabled>导出凭证（待接入）</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty :description="hasActiveFilter ? '当前筛选条件下无匹配工单' : '暂无记账子单元申请'">
            <template #description>
              <p v-if="hasActiveFilter">当前筛选条件下无匹配工单</p>
              <p v-else>B 端企业提交子单元开通申请后，工单将在这里展示</p>
            </template>
            <el-button v-if="hasActiveFilter" type="primary" plain @click="resetQuery">重置筛选</el-button>
            <el-button v-else type="primary" plain @click="goCompanyManagement">前往企业管理</el-button>
          </el-empty>
        </template>
      </el-table>

      <pagination v-show="total > 0" v-model:page="query.pageNum" v-model:limit="query.pageSize" :page-sizes="[10, 20, 50, 100]" :total="total" @pagination="loadData" />
    </el-card>

    <el-dialog v-model="detailVisible" :title="`${detailTarget?.companyName || ''} · 白名单详情`" width="920px" append-to-body destroy-on-close>
      <div v-loading="detailLoading" class="detail-dialog-body">
        <el-tabs v-model="detailTab">
          <el-tab-pane label="申请信息" name="application">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="企业名称" :span="2">{{ detailTarget?.companyName || '-' }}</el-descriptions-item>
              <el-descriptions-item label="统一社会信用代码">{{ detailTarget?.unifiedSocialCreditCode || currentCompany?.socialCreditCode || currentCompany?.creditCode || '-' }}</el-descriptions-item>
              <el-descriptions-item label="审核状态">
                <el-tag v-if="detailTarget" :type="statusMeta(detailTarget.status).type">{{ statusMeta(detailTarget.status).label }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="记账子单元">{{ detailTarget?.subAccountName || '-' }}</el-descriptions-item>
              <el-descriptions-item label="账户类型">{{ accountTypeText(detailTarget?.accountType) }}</el-descriptions-item>
              <el-descriptions-item label="开户行" :span="2">{{ detailTarget?.bankBranch || '-' }}</el-descriptions-item>
              <el-descriptions-item label="银行账号">
                <div v-if="detailTarget" class="sensitive-value-row masked-account">
                  <span>{{ bankAccountText(detailTarget) }}</span>
                  <el-button
                    v-hasPermi="['settlement:subAccount:decrypt']"
                    class="sensitive-eye-button"
                    link
                    type="primary"
                    :icon="isBankAccountRevealed(detailTarget) ? 'Hide' : 'View'"
                    :loading="isSensitiveLoading(detailTarget, 'bank')"
                    @click="toggleBankAccount(detailTarget)"
                  />
                </div>
              </el-descriptions-item>
              <el-descriptions-item label="出金状态">{{ detailTarget ? outflowMeta(detailTarget).label : '-' }}</el-descriptions-item>
              <el-descriptions-item label="联系人">{{ detailTarget?.contactName || '-' }}</el-descriptions-item>
              <el-descriptions-item label="联系电话">
                <div v-if="detailTarget" class="sensitive-value-row">
                  <span>{{ contactPhoneText(detailTarget) }}</span>
                  <el-button
                    v-hasPermi="['settlement:subAccount:decrypt']"
                    class="sensitive-eye-button"
                    link
                    type="primary"
                    :icon="isContactPhoneRevealed(detailTarget) ? 'Hide' : 'View'"
                    :loading="isSensitiveLoading(detailTarget, 'phone')"
                    @click="toggleContactPhone(detailTarget)"
                  />
                </div>
              </el-descriptions-item>
              <el-descriptions-item label="代发授权委托书" :span="2">
                <el-button
                  v-if="detailTarget?.authorizationLetterUploaded"
                  v-hasPermi="['settlement:subAccount:audit']"
                  link
                  type="primary"
                  icon="Document"
                  :loading="authorizationLetterLoading"
                  @click="openAuthorizationLetter(detailTarget)"
                >查看委托书</el-button>
                <span v-else class="muted-text">历史申请未上传</span>
              </el-descriptions-item>
              <el-descriptions-item label="提交时间">{{ detailTarget?.createTime || '-' }}</el-descriptions-item>
              <el-descriptions-item label="审核时间">{{ detailTarget?.auditTime || '-' }}</el-descriptions-item>
              <el-descriptions-item label="审核人">{{ detailTarget?.auditUserName || '-' }}</el-descriptions-item>
              <el-descriptions-item v-if="statusReason(detailTarget)" label="处理原因" :span="2">{{ statusReason(detailTarget) }}</el-descriptions-item>
            </el-descriptions>
            <el-alert class="detail-tip" type="info" :closable="false" show-icon title="主结算户、CMB UID、委托有效期与代发限额尚未进入当前接口契约，页面不展示推测数据。" />
          </el-tab-pane>
          <el-tab-pane label="企业资质详情" name="materials">
            <div class="qualification-section-title">主体资质信息</div>
            <el-descriptions :column="2" border class="qualification-descriptions">
              <el-descriptions-item label="企业全称" :span="2">{{ qualificationInfo.companyName }}</el-descriptions-item>
              <el-descriptions-item label="统一社会信用代码">{{ qualificationInfo.creditCode }}</el-descriptions-item>
              <el-descriptions-item label="认证状态">
                <el-tag :type="certStatusMeta(qualificationInfo.status).type">{{ certStatusMeta(qualificationInfo.status).label }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="法定代表人">{{ qualificationInfo.legalPersonName }}</el-descriptions-item>
              <el-descriptions-item label="法人联系电话">{{ maskPhone(qualificationInfo.legalPersonPhone) }}</el-descriptions-item>
              <el-descriptions-item label="注册地址" :span="2">{{ qualificationInfo.registeredAddress }}</el-descriptions-item>
              <el-descriptions-item label="实际办公地址" :span="2">{{ qualificationInfo.officeAddress }}</el-descriptions-item>
              <el-descriptions-item label="认证提交时间">{{ qualificationInfo.createTime }}</el-descriptions-item>
              <el-descriptions-item label="认证审核时间">{{ qualificationInfo.auditTime }}</el-descriptions-item>
              <el-descriptions-item label="认证审核意见" :span="2">{{ qualificationInfo.auditRemark }}</el-descriptions-item>
            </el-descriptions>
            <div class="qualification-section-title material-section-title">资质材料</div>
            <div v-if="materialFiles.length" class="material-grid">
              <div v-for="file in materialFiles" :key="`${file.label}-${file.url}`" class="material-card">
                <div class="material-label">{{ file.label }}</div>
                <el-image
                  v-if="file.kind === 'image'"
                  :src="file.url"
                  :preview-src-list="imagePreviewList"
                  :initial-index="imagePreviewIndex(file)"
                  fit="cover"
                  class="material-image"
                  preview-teleported
                >
                  <template #error>
                    <div class="material-image-error"><el-icon><Picture /></el-icon><span>图片加载失败</span></div>
                  </template>
                </el-image>
                <div v-else class="material-document">
                  <el-icon class="material-document-icon"><Document /></el-icon>
                  <span>{{ file.name || file.label }}</span>
                  <el-button link type="primary" @click="openExternal(file.url)">打开</el-button>
                </div>
              </div>
            </div>
            <el-empty v-else description="未获取到可预览的企业资质材料" />
          </el-tab-pane>
          <el-tab-pane label="审计记录" name="logs">
            <el-timeline v-if="auditLogs.length">
              <el-timeline-item v-for="log in auditLogs" :key="String(log.logId || `${log.operTime}-${log.action}`)" :timestamp="log.operTime || log.createTime" placement="top">
                <div class="audit-log-card">
                  <strong>{{ log.action || '操作记录' }}</strong>
                  <span class="audit-operator">{{ auditOperatorName(log) }}</span>
                  <el-tag size="small" effect="plain">{{ auditOperatorRole(log) }}</el-tag>
                  <p>{{ auditDetailText(log) }}</p>
                </div>
              </el-timeline-item>
            </el-timeline>
            <el-empty v-else description="暂无审计记录" />
          </el-tab-pane>
        </el-tabs>
      </div>
      <template #footer><el-button @click="detailVisible = false">关闭</el-button></template>
    </el-dialog>

    <el-dialog v-model="auditVisible" :title="auditTargets.length > 1 ? `批量审核通过（${auditTargets.length} 家）` : '审核记账子单元申请'" width="680px" append-to-body>
      <el-alert title="请逐项核验原件。当前后端为单级审核接口，主管双人复核需后续状态机升级后才能强制落地。" type="warning" :closable="false" show-icon />
      <el-form ref="auditFormRef" :model="auditForm" :rules="auditRules" label-width="104px" class="dialog-form">
        <el-form-item label="审核企业">
          <div class="target-list">
            <el-tag v-for="row in auditTargets" :key="String(row.applicationId)" effect="plain">{{ row.companyName }}</el-tag>
            <el-button v-if="auditTargets.length === 1" link type="primary" icon="View" @click="openDetail(auditTargets[0], 'materials')">查看企业资质详情</el-button>
          </div>
        </el-form-item>
        <el-form-item label="材料清单" prop="checks">
          <el-checkbox-group v-model="auditForm.checks" class="audit-checklist">
            <el-checkbox v-for="item in auditCheckOptions" :key="item.value" :label="item.value">{{ item.label }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="审核意见" prop="opinion">
          <el-input v-model="auditForm.opinion" type="textarea" :rows="3" maxlength="300" show-word-limit placeholder="记录材料核验、委托范围与风险判断" />
        </el-form-item>
        <el-form-item label="风险确认" prop="riskConfirmed">
          <el-checkbox v-model="auditForm.riskConfirmed">已确认委托授权有效，企业不在风险黑名单且申请资料与主体一致</el-checkbox>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button :disabled="auditSubmitting" @click="auditVisible = false">取消</el-button>
        <el-button type="primary" :loading="auditSubmitting" @click="submitApprove">确认通过</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="rejectVisible" :title="rejectTargets.length > 1 ? `批量驳回（${rejectTargets.length} 家）` : '驳回记账子单元申请'" width="620px" append-to-body>
      <el-form ref="rejectFormRef" :model="rejectForm" :rules="reasonRules" label-width="92px">
        <el-form-item label="驳回企业">
          <div class="target-list"><el-tag v-for="row in rejectTargets" :key="String(row.applicationId)" type="danger" effect="plain">{{ row.companyName }}</el-tag></div>
        </el-form-item>
        <el-form-item label="常用模板">
          <el-select v-model="rejectTemplate" clearable placeholder="选择模板自动填充" style="width: 100%" @change="applyRejectTemplate">
            <el-option v-for="item in rejectTemplates" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="驳回原因" prop="reason">
          <el-input v-model="rejectForm.reason" type="textarea" :rows="4" minlength="5" maxlength="500" show-word-limit placeholder="请明确指出需补充或整改的材料" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button :disabled="rejectSubmitting" @click="rejectVisible = false">取消</el-button>
        <el-button type="danger" :loading="rejectSubmitting" @click="submitReject">确认驳回</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="blacklistVisible" title="企业移出结算白名单" width="620px" append-to-body>
      <el-alert title="拉黑后该企业立即失去子单元白名单资格，并无法重新提交申请。该操作会写入不可删除的审计日志。" type="error" :closable="false" show-icon />
      <el-form ref="blacklistFormRef" :model="blacklistForm" :rules="blacklistRules" label-width="112px" class="dialog-form">
        <el-form-item label="企业名称">{{ blacklistTarget?.companyName || '-' }}</el-form-item>
        <el-form-item label="风险原因" prop="reasonCode">
          <el-select v-model="blacklistForm.reasonCode" placeholder="请选择风险原因" style="width: 100%">
            <el-option label="涉嫌异常资金交易" value="异常资金交易" />
            <el-option label="委托授权失效或造假" value="委托授权失效或造假" />
            <el-option label="企业主体或受益人风险" value="企业主体或受益人风险" />
            <el-option label="监管 / 银行要求关停" value="监管或银行要求关停" />
            <el-option label="其他重大风险" value="其他重大风险" />
          </el-select>
        </el-form-item>
        <el-form-item label="详细说明" prop="reason">
          <el-input v-model="blacklistForm.reason" type="textarea" :rows="4" minlength="5" maxlength="400" show-word-limit placeholder="请填写风险事实、依据和后续处置建议" />
        </el-form-item>
        <el-form-item label="确认企业名称" prop="confirmation">
          <el-input v-model="blacklistForm.confirmation" autocomplete="off" placeholder="输入完整企业名称确认高风险操作" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button :disabled="blacklistSubmitting" @click="blacklistVisible = false">取消</el-button>
        <el-button type="danger" :loading="blacklistSubmitting" @click="submitBlacklist">确认拉黑</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="cmbConfigVisible" title="招行子单元开户配置" width="780px" append-to-body destroy-on-close>
      <el-alert
        class="mb-4"
        :type="cmbConfigStatus.ready ? 'success' : 'warning'"
        :title="cmbConfigStatus.ready ? '招行生产参数已完整配置' : `尚缺少：${cmbConfigStatus.missingFields.join('、') || '必要配置'}`"
        :closable="false"
        show-icon
      />
      <el-alert
        class="mb-4"
        title="密钥和主账号不会回显明文；已配置的敏感项留空即可保留原值。启用后，审核通过会异步调用招行生产 NTDMAADD。"
        type="info"
        :closable="false"
        show-icon
      />
      <el-form v-loading="cmbConfigLoading" ref="cmbConfigFormRef" :model="cmbConfigForm" :rules="cmbConfigRules" label-width="150px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="真实银行接口" prop="enabled">
              <el-switch v-model="cmbConfigForm.enabled" active-text="启用" inactive-text="停用" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="申请审核" prop="approvalRequired">
              <el-switch v-model="cmbConfigForm.approvalRequired" active-text="需要审核" inactive-text="免审核" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="生产地址" prop="prodUrl">
          <el-input v-model="cmbConfigForm.prodUrl" maxlength="200" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="企业网银 UID" prop="uid">
              <el-input
                v-model="cmbConfigForm.uid"
                maxlength="16"
                :placeholder="cmbConfigStatus.uidConfigured ? `已配置 ${cmbConfigStatus.uidMasked}` : '请输入 UID'"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="主结算账号" prop="parentAccountNo">
              <el-input
                v-model="cmbConfigForm.parentAccountNo"
                maxlength="35"
                :placeholder="cmbConfigStatus.parentAccountConfigured ? `已配置 ${cmbConfigStatus.parentAccountNoMasked}` : '请输入6至35位账号'"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="用户 SM2 私钥" prop="privateKeyBase64">
          <el-input
            v-model="cmbConfigForm.privateKeyBase64"
            type="textarea"
            :rows="2"
            maxlength="500"
            :placeholder="cmbConfigStatus.privateKeyConfigured ? '已配置，留空不修改' : '请输入Base64私钥（解码后32字节）'"
          />
        </el-form-item>
        <el-form-item label="招行 SM2 公钥" prop="bankPublicKeyBase64">
          <el-input
            v-model="cmbConfigForm.bankPublicKeyBase64"
            type="textarea"
            :rows="2"
            maxlength="500"
            :placeholder="cmbConfigStatus.bankPublicKeyConfigured ? '已配置，留空不修改' : '请输入Base64公钥（解码后65字节）'"
          />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="SM4 对称密钥" prop="symmetricKey">
              <el-input
                v-model="cmbConfigForm.symmetricKey"
                type="password"
                maxlength="100"
                show-password
                :placeholder="cmbConfigStatus.symmetricKeyConfigured ? '已配置，留空不修改' : '请输入16字节密钥'"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="业务模式" prop="businessMode">
              <el-input v-model="cmbConfigForm.businessMode" maxlength="5" placeholder="busmod，最长5位" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="透支控制" prop="overdraftControl" label-width="100px">
              <el-select v-model="cmbConfigForm.overdraftControl">
                <el-option label="Y" value="Y" /><el-option label="N" value="N" /><el-option label="X" value="X" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="退款类型" prop="refundType" label-width="100px">
              <el-select v-model="cmbConfigForm.refundType">
                <el-option label="Y" value="Y" /><el-option label="N" value="N" /><el-option label="X" value="X" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="关闭类型" prop="closeType" label-width="100px">
              <el-select v-model="cmbConfigForm.closeType">
                <el-option label="Y" value="Y" /><el-option label="N" value="N" /><el-option label="X" value="X" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="连接超时(秒)" prop="connectTimeoutSeconds" label-width="110px">
              <el-input-number v-model="cmbConfigForm.connectTimeoutSeconds" :min="1" :max="10" controls-position="right" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="读取超时(秒)" prop="readTimeoutSeconds" label-width="110px">
              <el-input-number v-model="cmbConfigForm.readTimeoutSeconds" :min="1" :max="60" controls-position="right" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="响应上限" prop="maxResponseBytes" label-width="90px">
              <el-input-number v-model="cmbConfigForm.maxResponseBytes" :min="1024" :max="2097152" :step="1024" controls-position="right" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button :disabled="cmbConfigSubmitting" @click="cmbConfigVisible = false">取消</el-button>
        <el-button type="primary" :loading="cmbConfigSubmitting" @click="submitCmbConfig">保存并立即生效</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { getAuditHistory, getCompany, getCompanyAuditHistory, type AuditLogVO } from '@/api/recruitment';
import { listByIds } from '@/api/system/oss';
import { useUserStore } from '@/store/modules/user';
import {
  approveSettlementSubAccount,
  blacklistSettlementSubAccount,
  getSettlementSubAccountBankAccount,
  getSettlementSubAccountContactPhone,
  getSettlementSubAccountAuthorizationLetter,
  getSettlementSubAccountStatistics,
  getSettlementCmbConfig,
  listSettlementSubAccount,
  rejectSettlementSubAccount,
  updateSettlementCmbConfig,
  type SettlementCmbConfig,
  type SettlementCmbConfigRequest,
  type SettlementSubAccountQuery,
  type SettlementSubAccountStatistics,
  type SettlementSubAccountVO,
  type SubAccountAuditStatus
} from '@/api/recruitment/settlementSubAccount';

type QuickRange = '' | 'today' | '7d' | '30d';
type DetailTab = 'application' | 'materials' | 'logs';

interface MaterialFile {
  label: string;
  url: string;
  kind: 'image' | 'document';
  name?: string;
}

const FILTER_STORAGE_KEY = 'admin:sub-account:filters:v2';
const COLUMN_STORAGE_KEY = 'admin:sub-account:columns:v1';
const router = useRouter();
const userStore = useUserStore();
const loading = ref(false);
const rows = ref<SettlementSubAccountVO[]>([]);
const selectedRows = ref<SettlementSubAccountVO[]>([]);
const total = ref(0);
const submittingIds = ref<string[]>([]);
const timeRange = ref<[string, string] | []>([]);
const quickRange = ref<QuickRange>('');
const statistics = reactive<SettlementSubAccountStatistics>({
  totalCount: 0,
  pendingCount: 0,
  approvedCount: 0,
  rejectedCount: 0,
  blacklistedCount: 0,
  overduePendingCount: 0
});

const query = reactive<SettlementSubAccountQuery>({
  pageNum: 1,
  pageSize: 10,
  keyword: '',
  status: '',
  subAccountName: '',
  bankBranch: ''
});

const columnOptions = [
  { key: 'company', label: '企业名称', required: true },
  { key: 'subAccount', label: '记账子单元' },
  { key: 'bankAccount', label: '开户行 / 账号' },
  { key: 'contact', label: '联系人' },
  { key: 'createTime', label: '申请提交时间' },
  { key: 'auditNode', label: '当前审核节点' },
  { key: 'outflow', label: '出金状态' },
  { key: 'auditor', label: '审核信息' }
];
const visibleColumns = ref(columnOptions.map((item) => item.key));

const detailVisible = ref(false);
const detailLoading = ref(false);
const authorizationLetterLoading = ref(false);
const detailTarget = ref<SettlementSubAccountVO>();
const detailTab = ref<DetailTab>('application');
const currentCompany = ref<Record<string, any>>();
const currentCert = ref<Record<string, any>>();
const materialFiles = ref<MaterialFile[]>([]);
const auditLogs = ref<AuditLogVO[]>([]);

// 资质详情以最新 company_cert 为主、企业主体表为兜底，避免只带出附件而缺少认证字段。
const qualificationInfo = computed(() => {
  const company = currentCompany.value || {};
  const cert = currentCert.value || {};
  return {
    companyName: cert.companyName || company.companyName || detailTarget.value?.companyName || '-',
    creditCode: cert.creditCode || company.socialCreditCode || company.creditCode || detailTarget.value?.unifiedSocialCreditCode || '-',
    status: cert.status || company.certStatus || '',
    legalPersonName: cert.legalPersonName || company.legalPersonName || '-',
    legalPersonPhone: cert.legalPersonPhone || company.legalPersonPhone || '',
    registeredAddress: cert.registeredAddress || company.registeredAddress || '-',
    officeAddress: cert.officeAddress || company.companyAddress || company.officeAddress || '-',
    createTime: formatMinute(cert.createTime || company.createTime),
    auditTime: formatMinute(cert.auditTime || company.auditTime),
    auditRemark: cert.auditRemark || company.auditRemark || company.remark || '无'
  };
});

const auditVisible = ref(false);
const auditSubmitting = ref(false);
const auditTargets = ref<SettlementSubAccountVO[]>([]);
const auditFormRef = ref<FormInstance>();
const auditForm = reactive({ checks: [] as string[], opinion: '', riskConfirmed: false });
const auditCheckOptions = [
  { value: 'license', label: '营业执照真实有效' },
  { value: 'legalPerson', label: '法人身份证材料完整' },
  { value: 'beneficiary', label: '受益所有人信息已核验' },
  { value: 'delegate', label: '代发授权委托书已盖章且在有效期' },
  { value: 'bankForm', label: '银企申请表与对公账户信息一致' }
];
const auditRules: FormRules = {
  checks: [{ type: 'array', required: true, min: auditCheckOptions.length, message: '请完成全部材料校验项', trigger: 'change' }],
  opinion: [{ required: true, message: '请输入审核意见', trigger: 'blur' }, { min: 5, max: 300, message: '审核意见需为5到300个字符', trigger: 'blur' }],
  riskConfirmed: [{ validator: (_rule, value, callback) => (value ? callback() : callback(new Error('请确认风险校验结果'))), trigger: 'change' }]
};

const rejectVisible = ref(false);
const rejectSubmitting = ref(false);
const rejectTargets = ref<SettlementSubAccountVO[]>([]);
const rejectFormRef = ref<FormInstance>();
const rejectTemplate = ref('');
const rejectForm = reactive({ reason: '' });
const reasonRules: FormRules = {
  reason: [{ required: true, message: '请输入驳回原因', trigger: 'blur' }, { min: 5, max: 500, message: '原因需为5到500个字符', trigger: 'blur' }]
};
const rejectTemplates = [
  '缺少加盖公章的资金代发授权委托书，请补充后重新提交',
  '企业预估代发金额超出申请限额，请调整委托额度并重新盖章上传',
  '受益所有人材料不全，需补充持股 25% 以上人员身份证及股权结构图'
];

const blacklistVisible = ref(false);
const blacklistSubmitting = ref(false);
const blacklistTarget = ref<SettlementSubAccountVO>();
const blacklistFormRef = ref<FormInstance>();
const blacklistForm = reactive({ reasonCode: '', reason: '', confirmation: '' });
const blacklistRules: FormRules = {
  reasonCode: [{ required: true, message: '请选择风险原因', trigger: 'change' }],
  reason: [{ required: true, message: '请填写详细说明', trigger: 'blur' }, { min: 5, max: 400, message: '详细说明需为5到400个字符', trigger: 'blur' }],
  confirmation: [
    { required: true, message: '请输入完整企业名称', trigger: 'blur' },
    { validator: (_rule, value, callback) => (value === blacklistTarget.value?.companyName ? callback() : callback(new Error('企业名称不一致'))), trigger: 'blur' }
  ]
};

// 招行密钥只存在于当前编辑表单，加载接口永不回填明文；空值由后端解释为保留既有密钥。
const cmbConfigVisible = ref(false);
const cmbConfigLoading = ref(false);
const cmbConfigSubmitting = ref(false);
const cmbConfigFormRef = ref<FormInstance>();
const cmbConfigStatus = reactive<SettlementCmbConfig>({
  enabled: false,
  prodUrl: 'https://cdc.cmbchina.com/cdcserver/api/v2',
  uidMasked: '',
  parentAccountNoMasked: '',
  businessMode: '',
  approvalRequired: true,
  overdraftControl: 'Y',
  refundType: 'N',
  closeType: 'Y',
  connectTimeoutSeconds: 3,
  readTimeoutSeconds: 15,
  maxResponseBytes: 2097152,
  uidConfigured: false,
  privateKeyConfigured: false,
  bankPublicKeyConfigured: false,
  symmetricKeyConfigured: false,
  parentAccountConfigured: false,
  ready: false,
  missingFields: []
});
const cmbConfigForm = reactive<SettlementCmbConfigRequest>({
  enabled: true,
  prodUrl: 'https://cdc.cmbchina.com/cdcserver/api/v2',
  uid: '',
  privateKeyBase64: '',
  bankPublicKeyBase64: '',
  symmetricKey: '',
  parentAccountNo: '',
  businessMode: '',
  approvalRequired: true,
  overdraftControl: 'Y',
  refundType: 'N',
  closeType: 'Y',
  connectTimeoutSeconds: 3,
  readTimeoutSeconds: 15,
  maxResponseBytes: 2097152
});

function configuredOrInput(configured: () => boolean, label: string) {
  return (_rule: unknown, value: string, callback: (error?: Error) => void) => {
    if (configured() || String(value || '').trim()) callback();
    else callback(new Error(`请配置${label}`));
  };
}

const cmbConfigRules: FormRules = {
  prodUrl: [
    { required: true, message: '请输入招行生产地址', trigger: 'blur' },
    {
      validator: (_rule, value, callback) =>
        value === 'https://cdc.cmbchina.com/cdcserver/api/v2' ? callback() : callback(new Error('生产地址必须使用招行批准地址')),
      trigger: 'blur'
    }
  ],
  uid: [{ validator: configuredOrInput(() => cmbConfigStatus.uidConfigured, '企业网银 UID'), trigger: 'blur' }],
  parentAccountNo: [
    { validator: configuredOrInput(() => cmbConfigStatus.parentAccountConfigured, '主结算账号'), trigger: 'blur' },
    { pattern: /^$|^[0-9]{6,35}$/, message: '主结算账号必须为6至35位数字', trigger: 'blur' }
  ],
  privateKeyBase64: [{ validator: configuredOrInput(() => cmbConfigStatus.privateKeyConfigured, '用户 SM2 私钥'), trigger: 'blur' }],
  bankPublicKeyBase64: [{ validator: configuredOrInput(() => cmbConfigStatus.bankPublicKeyConfigured, '招行 SM2 公钥'), trigger: 'blur' }],
  symmetricKey: [{ validator: configuredOrInput(() => cmbConfigStatus.symmetricKeyConfigured, 'SM4 对称密钥'), trigger: 'blur' }],
  businessMode: [{ required: true, message: '请输入业务模式', trigger: 'blur' }]
};

// 完整敏感值仅保存在当前页面内存，翻页/刷新即清空；每次首次查看都由后端记录审计。
const revealedBankAccounts = reactive<Record<string, string>>({});
const revealedContactPhones = reactive<Record<string, string>>({});
const sensitiveLoadingKeys = ref<string[]>([]);

const pendingSelections = computed(() => selectedRows.value.filter((row) => row.status === 'PENDING'));
const hasActiveFilter = computed(() => Boolean(query.keyword || query.status || query.subAccountName || query.bankBranch || timeRange.value.length));
const imagePreviewList = computed(() => materialFiles.value.filter((file) => file.kind === 'image').map((file) => file.url));

onMounted(async () => {
  restorePreferences();
  await refreshAll();
});

function buildQuery(): SettlementSubAccountQuery {
  return {
    ...query,
    keyword: query.keyword?.trim() || undefined,
    subAccountName: query.subAccountName?.trim() || undefined,
    bankBranch: query.bankBranch?.trim() || undefined,
    beginTime: timeRange.value[0] || undefined,
    endTime: timeRange.value[1] || undefined
  };
}

async function loadData() {
  loading.value = true;
  try {
    const res: any = await listSettlementSubAccount(buildQuery());
    rows.value = res.rows || [];
    total.value = Number(res.total || 0);
    selectedRows.value = [];
    clearRevealedValues();
    saveFilters();
  } finally {
    loading.value = false;
  }
}

async function loadStatistics() {
  const res: any = await getSettlementSubAccountStatistics();
  const data = res.data || {};
  Object.assign(statistics, {
    totalCount: Number(data.totalCount || 0),
    pendingCount: Number(data.pendingCount || 0),
    approvedCount: Number(data.approvedCount || 0),
    rejectedCount: Number(data.rejectedCount || 0),
    blacklistedCount: Number(data.blacklistedCount || 0),
    overduePendingCount: Number(data.overduePendingCount || 0)
  });
}

async function refreshAll() {
  await Promise.all([loadData(), loadStatistics()]);
}

async function openCmbConfig() {
  cmbConfigVisible.value = true;
  cmbConfigLoading.value = true;
  try {
    const res: any = await getSettlementCmbConfig();
    const data = (res.data || {}) as SettlementCmbConfig;
    Object.assign(cmbConfigStatus, data, { missingFields: Array.isArray(data.missingFields) ? data.missingFields : [] });
    Object.assign(cmbConfigForm, {
      enabled: data.enabled,
      prodUrl: data.prodUrl || 'https://cdc.cmbchina.com/cdcserver/api/v2',
      uid: '',
      privateKeyBase64: '',
      bankPublicKeyBase64: '',
      symmetricKey: '',
      parentAccountNo: '',
      businessMode: data.businessMode || '',
      approvalRequired: data.approvalRequired !== false,
      overdraftControl: data.overdraftControl || 'Y',
      refundType: data.refundType || 'N',
      closeType: data.closeType || 'Y',
      connectTimeoutSeconds: Number(data.connectTimeoutSeconds || 3),
      readTimeoutSeconds: Number(data.readTimeoutSeconds || 15),
      maxResponseBytes: Number(data.maxResponseBytes || 2097152)
    });
    cmbConfigFormRef.value?.clearValidate();
  } catch (error) {
    cmbConfigVisible.value = false;
    console.error('加载招行开户配置失败', error);
  } finally {
    cmbConfigLoading.value = false;
  }
}

async function submitCmbConfig() {
  if (!cmbConfigFormRef.value) return;
  const valid = await cmbConfigFormRef.value.validate().catch(() => false);
  if (!valid) return;
  const warning = cmbConfigForm.enabled
    ? cmbConfigForm.approvalRequired
      ? '保存后，白名单审核通过将异步请求真实招行生产接口。确认配置无误并启用？'
      : '当前选择“免审核”，企业提交申请后将直接请求真实招行生产接口。确认继续？'
    : '保存后真实招行接口将停用，已审核任务会进入补偿等待。确认继续？';
  const confirmed = await ElMessageBox.confirm(warning, '高风险配置确认', {
    type: 'warning',
    confirmButtonText: '确认保存',
    distinguishCancelAndClose: true
  }).catch(() => false);
  if (!confirmed) return;
  cmbConfigSubmitting.value = true;
  try {
    await updateSettlementCmbConfig({
      ...cmbConfigForm,
      prodUrl: cmbConfigForm.prodUrl.trim(),
      uid: cmbConfigForm.uid?.trim(),
      privateKeyBase64: cmbConfigForm.privateKeyBase64?.trim(),
      bankPublicKeyBase64: cmbConfigForm.bankPublicKeyBase64?.trim(),
      symmetricKey: cmbConfigForm.symmetricKey?.trim(),
      parentAccountNo: cmbConfigForm.parentAccountNo?.trim(),
      businessMode: cmbConfigForm.businessMode.trim()
    });
    ElMessage.success('招行开户配置已保存并立即生效');
    cmbConfigVisible.value = false;
  } finally {
    cmbConfigSubmitting.value = false;
  }
}

function handleQuery() {
  query.pageNum = 1;
  quickRange.value = '';
  loadData();
}

function resetQuery() {
  Object.assign(query, { pageNum: 1, pageSize: 10, keyword: '', status: '', subAccountName: '', bankBranch: '' });
  timeRange.value = [];
  quickRange.value = '';
  localStorage.removeItem(FILTER_STORAGE_KEY);
  loadData();
}

function applyStatusFilter(status: SubAccountAuditStatus | '') {
  query.status = status;
  query.pageNum = 1;
  loadData();
}

function applyQuickRange(range: Exclude<QuickRange, ''>) {
  const end = new Date();
  const start = new Date(end);
  if (range === 'today') start.setHours(0, 0, 0, 0);
  if (range === '7d') start.setDate(start.getDate() - 6);
  if (range === '30d') start.setDate(start.getDate() - 29);
  timeRange.value = [formatDateTime(start), formatDateTime(end)];
  quickRange.value = range;
  query.pageNum = 1;
  loadData();
}

function saveFilters() {
  localStorage.setItem(
    FILTER_STORAGE_KEY,
    JSON.stringify({ keyword: query.keyword, status: query.status, subAccountName: query.subAccountName, bankBranch: query.bankBranch, pageSize: query.pageSize, timeRange: timeRange.value })
  );
}

function restorePreferences() {
  try {
    const saved = JSON.parse(localStorage.getItem(FILTER_STORAGE_KEY) || '{}');
    Object.assign(query, {
      keyword: saved.keyword || '',
      status: saved.status || '',
      subAccountName: saved.subAccountName || '',
      bankBranch: saved.bankBranch || '',
      pageSize: [10, 20, 50, 100].includes(Number(saved.pageSize)) ? Number(saved.pageSize) : 10
    });
    timeRange.value = Array.isArray(saved.timeRange) && saved.timeRange.length === 2 ? saved.timeRange : [];
    const columns = JSON.parse(localStorage.getItem(COLUMN_STORAGE_KEY) || '[]');
    if (Array.isArray(columns) && columns.length) visibleColumns.value = Array.from(new Set(['company', ...columns]));
  } catch {
    localStorage.removeItem(FILTER_STORAGE_KEY);
    localStorage.removeItem(COLUMN_STORAGE_KEY);
  }
}

function saveColumnSettings() {
  if (!visibleColumns.value.includes('company')) visibleColumns.value.unshift('company');
  localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(visibleColumns.value));
}

function isColumnVisible(key: string) {
  return visibleColumns.value.includes(key);
}

function onSelectionChange(selection: SettlementSubAccountVO[]) {
  selectedRows.value = selection;
}

function isRowSelectable(row: SettlementSubAccountVO) {
  return row.status === 'PENDING';
}

function isSubmitting(row: SettlementSubAccountVO) {
  return submittingIds.value.includes(String(row.applicationId));
}

function openAudit(targets: SettlementSubAccountVO[]) {
  auditTargets.value = targets.filter((row) => row.status === 'PENDING').slice(0, 20);
  if (!auditTargets.value.length) return ElMessage.warning('请选择待审核工单');
  if (targets.length > 20) ElMessage.warning('单次最多处理 20 条，已截取前 20 条');
  Object.assign(auditForm, { checks: [], opinion: '', riskConfirmed: false });
  auditVisible.value = true;
  auditFormRef.value?.clearValidate();
}

async function submitApprove() {
  if (!auditFormRef.value) return;
  const valid = await auditFormRef.value.validate().catch(() => false);
  if (!valid) return;
  const confirmed = await ElMessageBox.confirm(`确认通过 ${auditTargets.value.length} 家企业的记账子单元申请？`, '审核确认', { type: 'warning', confirmButtonText: '确认通过' }).catch(() => false);
  if (!confirmed) return;
  auditSubmitting.value = true;
  const opinion = auditForm.opinion.trim();
  const result = await runBatch(auditTargets.value, (row) => approveSettlementSubAccount(row.applicationId, opinion));
  auditSubmitting.value = false;
  auditVisible.value = false;
  showBatchResult('审核通过', result, true);
  await refreshAll();
}

function openReject(target: SettlementSubAccountVO | SettlementSubAccountVO[]) {
  const targets = Array.isArray(target) ? target : [target];
  rejectTargets.value = targets.filter((row) => row.status === 'PENDING').slice(0, 20);
  if (!rejectTargets.value.length) return ElMessage.warning('请选择待审核工单');
  rejectTemplate.value = '';
  rejectForm.reason = '';
  rejectVisible.value = true;
  rejectFormRef.value?.clearValidate();
}

function applyRejectTemplate(value: string) {
  if (value) rejectForm.reason = value;
}

async function submitReject() {
  if (!rejectFormRef.value) return;
  const valid = await rejectFormRef.value.validate().catch(() => false);
  if (!valid) return;
  rejectSubmitting.value = true;
  const reason = rejectForm.reason.trim();
  const result = await runBatch(rejectTargets.value, (row) => rejectSettlementSubAccount(row.applicationId, reason));
  rejectSubmitting.value = false;
  rejectVisible.value = false;
  showBatchResult('驳回', result);
  await refreshAll();
}

function openBlacklist(row: SettlementSubAccountVO) {
  blacklistTarget.value = row;
  Object.assign(blacklistForm, { reasonCode: '', reason: '', confirmation: '' });
  blacklistVisible.value = true;
  blacklistFormRef.value?.clearValidate();
}

async function submitBlacklist() {
  if (!blacklistFormRef.value || !blacklistTarget.value) return;
  const valid = await blacklistFormRef.value.validate().catch(() => false);
  if (!valid) return;
  blacklistSubmitting.value = true;
  const id = String(blacklistTarget.value.applicationId);
  submittingIds.value = [...submittingIds.value, id];
  try {
    await blacklistSettlementSubAccount(blacklistTarget.value.applicationId, `【${blacklistForm.reasonCode}】${blacklistForm.reason.trim()}`);
    ElMessage.success('企业已移出结算白名单');
    blacklistVisible.value = false;
    await refreshAll();
  } finally {
    blacklistSubmitting.value = false;
    submittingIds.value = submittingIds.value.filter((item) => item !== id);
  }
}

async function runBatch(targets: SettlementSubAccountVO[], action: (row: SettlementSubAccountVO) => Promise<any>) {
  let success = 0;
  const successMessages: string[] = [];
  const failureMessages: string[] = [];
  const failed: string[] = [];
  submittingIds.value = targets.map((row) => String(row.applicationId));
  for (const row of targets) {
    try {
      const response = await action(row);
      success += 1;
      // 审核响应携带银行开户首个结果，页面必须采用后端文案，不能统一误报“审核成功”。
      if (response?.msg) successMessages.push(response.msg);
    } catch (error: any) {
      failed.push(row.companyName || String(row.applicationId));
      if (error?.message) failureMessages.push(error.message);
    }
  }
  submittingIds.value = [];
  return { success, failed, successMessages, failureMessages };
}

function showBatchResult(
  action: string,
  result: { success: number; failed: string[]; successMessages: string[]; failureMessages: string[] },
  useResponseMessage = false
) {
  if (!result.failed.length) {
    const messages = Array.from(new Set(result.successMessages));
    const processingMessages = messages.filter((message) => message.includes('处理中'));
    if (useResponseMessage && processingMessages.length) {
      const message = result.success === 1 ? processingMessages[0] : `${action}已提交，其中 ${processingMessages.length} 条银行开户仍在处理中`;
      return ElMessage.warning(message);
    }
    const message = useResponseMessage && messages.length === 1 ? messages[0] : `${action}成功，共 ${result.success} 条`;
    return ElMessage.success(message);
  }
  const failureMessages = Array.from(new Set(result.failureMessages));
  if (useResponseMessage && result.success === 0 && failureMessages.length === 1) {
    return ElMessage.error(failureMessages[0]);
  }
  if (useResponseMessage && failureMessages.length) {
    return ElMessage.warning(`${action}完成：成功 ${result.success} 条，失败 ${result.failed.length} 条；${failureMessages.join('；')}`);
  }
  ElMessage.warning(`${action}完成：成功 ${result.success} 条，失败 ${result.failed.length} 条（${result.failed.join('、')}）`);
}

async function openDetail(row: SettlementSubAccountVO, tab: DetailTab = 'application') {
  detailTarget.value = row;
  detailTab.value = tab;
  detailVisible.value = true;
  detailLoading.value = true;
  currentCompany.value = undefined;
  currentCert.value = undefined;
  materialFiles.value = [];
  auditLogs.value = [];
  const [companyResult, companyHistoryResult, subAccountHistoryResult] = await Promise.allSettled([
    getCompany(row.companyId),
    getCompanyAuditHistory(row.companyId),
    getAuditHistory({ targetType: '记账子单元', targetNo: String(row.applicationId) })
  ]);
  const company = companyResult.status === 'fulfilled' ? (((companyResult.value as any).data || {}) as Record<string, any>) : {};
  const companyHistory = companyHistoryResult.status === 'fulfilled' ? (companyHistoryResult.value as any).data || {} : {};
  const latestCert = Array.isArray(companyHistory.certHistory) ? companyHistory.certHistory[0] || {} : {};
  currentCompany.value = company;
  currentCert.value = latestCert;
  const materialSource = { ...company };
  Object.entries(latestCert).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') materialSource[key] = value;
  });
  await hydrateMaterials(materialSource);
  const companyLogs = companyHistory.auditLogs || [];
  const subAccountPayload = subAccountHistoryResult.status === 'fulfilled' ? (subAccountHistoryResult.value as any).data : [];
  const subAccountLogs = Array.isArray(subAccountPayload) ? subAccountPayload : subAccountPayload?.rows || [];
  auditLogs.value = deduplicateAuditLogs([...subAccountLogs, ...companyLogs]);
  if (companyResult.status === 'rejected') ElMessage.warning('企业扩展资料加载失败，申请信息仍可查看');
  detailLoading.value = false;
}

async function openAuthorizationLetter(row?: SettlementSubAccountVO) {
  if (!row?.authorizationLetterUploaded) return;
  // 先由用户点击同步打开空页，避免等待临时签名地址期间被浏览器判定为弹窗并拦截。
  const previewWindow = window.open('', '_blank');
  if (previewWindow) previewWindow.opener = null;
  authorizationLetterLoading.value = true;
  try {
    const res: any = await getSettlementSubAccountAuthorizationLetter(row.applicationId);
    const url = res?.data?.url;
    if (!url) throw new Error('委托书文件地址为空');
    if (previewWindow) previewWindow.location.href = url;
    else window.open(url, '_blank', 'noopener,noreferrer');
  } catch (error) {
    previewWindow?.close();
    console.error('打开代发授权委托书失败', error);
    ElMessage.error('代发授权委托书暂不可访问，请稍后重试');
  } finally {
    authorizationLetterLoading.value = false;
  }
}

async function hydrateMaterials(company: Record<string, any>) {
  const fields = [
    { key: 'businessLicense', label: '营业执照', kind: 'image' as const },
    { key: 'legalPersonIdFront', label: '法人身份证正面', kind: 'image' as const },
    { key: 'legalPersonIdBack', label: '法人身份证反面', kind: 'image' as const },
    { key: 'bankAccountProof', label: '对公账户凭证', kind: 'image' as const },
    { key: 'authLetter', label: '企业授权书', kind: 'auto' as const },
    { key: 'officePhotos', label: '经营场地照片', kind: 'image' as const }
  ];
  const rawItems = fields.flatMap((field) => splitValues(company[field.key]).map((value) => ({ ...field, value })));
  const ossIds = rawItems.filter((item) => /^\d+$/.test(item.value)).map((item) => item.value);
  const fileMap: Record<string, any> = {};
  if (ossIds.length) {
    try {
      const res: any = await listByIds(Array.from(new Set(ossIds)).join(','));
      (res.data || []).forEach((file: any) => (fileMap[String(file.ossId)] = file));
    } catch {
      // 材料解析失败仅影响预览，不阻断申请详情与审核记录查看。
    }
  }
  materialFiles.value = rawItems
    .map((item) => {
      const oss = fileMap[item.value];
      const url = oss?.url || (/^https?:\/\//i.test(item.value) || item.value.startsWith('/') ? item.value : '');
      if (!url) return null;
      const suffix = fileExt(oss?.fileSuffix || oss?.originalName || url);
      const kind = item.kind === 'image' || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'].includes(suffix) ? 'image' : 'document';
      return { label: item.label, url, kind, name: oss?.originalName } as MaterialFile;
    })
    .filter(Boolean) as MaterialFile[];
}

function fileExt(source?: string) {
  const raw = (String(source || '').split('?')[0].split('#')[0].split('/').pop() || '').replace(/^\./, '');
  const parts = raw.split('.');
  return (parts.length > 1 ? parts.pop() : raw).toLowerCase();
}

function imagePreviewIndex(file: MaterialFile) {
  return Math.max(0, imagePreviewList.value.findIndex((url) => url === file.url));
}

function sensitiveRowKey(row: SettlementSubAccountVO) {
  return String(row.applicationId);
}

function bankAccountText(row: SettlementSubAccountVO) {
  return revealedBankAccounts[sensitiveRowKey(row)] || row.bankAccountMasked || '-';
}

function contactPhoneText(row: SettlementSubAccountVO) {
  return revealedContactPhones[sensitiveRowKey(row)] || row.contactPhoneMasked || '号码未返回';
}

function isBankAccountRevealed(row: SettlementSubAccountVO) {
  return Boolean(revealedBankAccounts[sensitiveRowKey(row)]);
}

function isContactPhoneRevealed(row: SettlementSubAccountVO) {
  return Boolean(revealedContactPhones[sensitiveRowKey(row)]);
}

function isSensitiveLoading(row: SettlementSubAccountVO, kind: 'bank' | 'phone') {
  return sensitiveLoadingKeys.value.includes(`${kind}:${sensitiveRowKey(row)}`);
}

async function toggleBankAccount(row: SettlementSubAccountVO) {
  const rowKey = sensitiveRowKey(row);
  if (revealedBankAccounts[rowKey]) {
    delete revealedBankAccounts[rowKey];
    return;
  }
  const loadingKey = `bank:${rowKey}`;
  sensitiveLoadingKeys.value.push(loadingKey);
  try {
    const res: any = await getSettlementSubAccountBankAccount(row.applicationId);
    const value = res.data?.bankAccount;
    if (!value) return ElMessage.warning('未获取到完整银行卡号');
    revealedBankAccounts[rowKey] = value;
  } finally {
    sensitiveLoadingKeys.value = sensitiveLoadingKeys.value.filter((item) => item !== loadingKey);
  }
}

async function toggleContactPhone(row: SettlementSubAccountVO) {
  const rowKey = sensitiveRowKey(row);
  if (revealedContactPhones[rowKey]) {
    delete revealedContactPhones[rowKey];
    return;
  }
  const loadingKey = `phone:${rowKey}`;
  sensitiveLoadingKeys.value.push(loadingKey);
  try {
    const res: any = await getSettlementSubAccountContactPhone(row.applicationId);
    const value = res.data?.contactPhone;
    if (!value) return ElMessage.warning('未获取到完整手机号');
    revealedContactPhones[rowKey] = value;
  } finally {
    sensitiveLoadingKeys.value = sensitiveLoadingKeys.value.filter((item) => item !== loadingKey);
  }
}

function clearRevealedValues() {
  Object.keys(revealedBankAccounts).forEach((key) => delete revealedBankAccounts[key]);
  Object.keys(revealedContactPhones).forEach((key) => delete revealedContactPhones[key]);
}

function handleRowCommand(command: string, row: SettlementSubAccountVO) {
  if (command === 'materials') openDetail(row, 'materials');
  if (command === 'logs') openDetail(row, 'logs');
  if (command === 'account') toggleBankAccount(row);
}

function goCompanyManagement() {
  router.push({ name: 'RecruitmentCompany' });
}

function openExternal(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer');
}

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    ElMessage.success('已复制当前显示号码');
  } catch {
    ElMessage.warning('复制失败，请手动选择文本');
  }
}

function accountTypeText(value?: string) {
  return value === 'CORPORATE' ? '对公账户' : value === 'INDIVIDUAL' ? '个人账户' : value || '-';
}

function statusMeta(status?: SubAccountAuditStatus) {
  const map = {
    PENDING: { label: '待审核', type: 'warning' as const },
    APPROVED: { label: '已通过', type: 'success' as const },
    REJECTED: { label: '已驳回', type: 'danger' as const },
    BLACKLISTED: { label: '已拉黑', type: 'danger' as const }
  };
  return status ? map[status] : { label: '未知', type: 'info' as const };
}

function certStatusMeta(status?: string) {
  const normalized = String(status || '').toUpperCase();
  if (normalized === '0' || normalized === 'PENDING') return { label: '待认证审核', type: 'warning' as const };
  if (normalized === '1' || normalized === 'APPROVED') return { label: '认证通过', type: 'success' as const };
  if (normalized === '2' || normalized === 'REJECTED') return { label: '认证驳回', type: 'danger' as const };
  return { label: '未认证', type: 'info' as const };
}

function maskPhone(value?: unknown) {
  const phone = String(value || '').trim();
  if (!phone) return '-';
  if (phone.includes('*')) return phone;
  if (/^1\d{10}$/.test(phone)) return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
  if (phone.length > 7) return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
  return phone;
}

function outflowMeta(row: SettlementSubAccountVO) {
  if (row.status === 'APPROVED') return { label: '准入正常', type: 'success' as const };
  if (row.status === 'BLACKLISTED') return { label: '永久关停', type: 'danger' as const };
  if (row.status === 'PENDING') return { label: '未开通', type: 'warning' as const };
  return { label: '未准入', type: 'info' as const };
}

function statusReason(row?: SettlementSubAccountVO) {
  return row && ['REJECTED', 'BLACKLISTED'].includes(row.status) ? row.rejectReason || '' : '';
}

function waitingDays(row: SettlementSubAccountVO) {
  if (!row.createTime) return 0;
  const end = row.status === 'PENDING' || !row.auditTime ? Date.now() : new Date(row.auditTime).getTime();
  return Math.max(0, Math.floor((end - new Date(row.createTime).getTime()) / 86_400_000));
}

function waitingText(row: SettlementSubAccountVO) {
  const days = waitingDays(row);
  return row.status === 'PENDING' ? (days === 0 ? '今日提交' : `待审 ${days} 天`) : days === 0 ? '当日处理' : `${days} 天处理`;
}

function tableRowClassName({ row }: { row: SettlementSubAccountVO }) {
  const classes: string[] = [];
  if (row.status === 'APPROVED' || row.status === 'REJECTED') classes.push('selection-hidden-row');
  if (row.status === 'BLACKLISTED') classes.push('blacklisted-row');
  if (row.status === 'PENDING' && waitingDays(row) >= 7) classes.push('overdue-row');
  return classes.join(' ');
}

function formatMinute(value?: string) {
  return value ? value.replace('T', ' ').slice(0, 16) : '-';
}

function formatDateTime(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function splitValues(value: unknown) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

// 新日志由后端直接返回昵称和角色；历史日志仍含企业ID时，在展示层替换为可读的操作人身份。
function auditOperatorName(log: AuditLogVO) {
  if (String(log.operId || '') === String(userStore.userId || '')) {
    return userStore.nickname || log.operName || '当前用户';
  }
  return log.operName || '系统';
}

function auditOperatorRole(log: AuditLogVO) {
  if (log.operRole) return log.operRole;
  if (String(log.operId || '') !== String(userStore.userId || '')) return '角色未记录';
  const roleLabels: Record<string, string> = {
    superadmin: '超级管理员',
    admin: '管理员',
    operations_manager: '运营主管',
    finance: '财务管理员',
    B: '企业用户'
  };
  const roles = (userStore.roles || []).map((role) => roleLabels[role] || role).filter(Boolean);
  return roles.length ? [...new Set(roles)].join('、') : '未配置角色';
}

function auditDetailText(log: AuditLogVO) {
  const rawDetail = log.detail || log.remark || '无补充说明';
  if (!/(?:^|[，,])企业ID=/.test(rawDetail)) return rawDetail;
  const businessDetail = rawDetail
    .replace(/(?:^|[，,])企业ID=[^，,]+/g, '')
    .replace(/^[，,]+|[，,]+$/g, '');
  const actorDetail = `操作人=${auditOperatorName(log)}，角色=${auditOperatorRole(log)}`;
  return businessDetail ? `${actorDetail}，${businessDetail}` : actorDetail;
}

function deduplicateAuditLogs(logs: AuditLogVO[]) {
  const seen = new Set<string>();
  return logs
    .filter((log) => {
      const key = String(log.logId || `${log.targetNo}-${log.action}-${log.operTime || log.createTime}`);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((left, right) => String(right.operTime || right.createTime || '').localeCompare(String(left.operTime || left.createTime || '')));
}
</script>

<style scoped lang="scss">
.sub-account-page {
  min-width: 980px;
}

.muted-text {
  color: var(--el-text-color-secondary);
}

.stat-row :deep(.el-card__body) {
  padding: 18px 20px;
}

.stat-mini-card {
  height: 100%;
  border: 1px solid var(--el-border-color-lighter);
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.stat-mini-card.clickable {
  cursor: pointer;
}

.stat-mini-card:hover,
.stat-mini-card.active {
  transform: translateY(-2px);
  border-color: var(--el-color-primary-light-5);
}

.stat-mini-card.warning { border-left: 3px solid var(--el-color-warning); }
.stat-mini-card.success { border-left: 3px solid var(--el-color-success); }
.stat-mini-card.danger { border-left: 3px solid var(--el-color-danger); }

.stat-mini {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-label { color: var(--el-text-color-regular); font-size: 14px; }
.stat-value { color: var(--el-text-color-primary); font-size: 28px; line-height: 1; }
.stat-value.warning { color: var(--el-color-warning); }
.stat-value.success { color: var(--el-color-success); }
.stat-value.danger { color: var(--el-color-danger); }
.stat-caption { color: var(--el-text-color-secondary); font-size: 12px; }

.risk-alert {
  cursor: pointer;
}

.risk-alert :deep(.el-alert__title) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.search-card :deep(.el-card__body) {
  padding-bottom: 14px;
}

.query-form {
  display: flex;
  flex-wrap: wrap;
  column-gap: 12px;
}

.query-form :deep(.el-form-item) {
  margin-right: 0;
  margin-bottom: 14px;
}

.quick-filter-row,
.table-toolbar,
.toolbar-left,
.toolbar-right,
.row-actions,
.target-list {
  display: flex;
  align-items: center;
}

.quick-filter-row {
  flex-wrap: wrap;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--el-border-color-lighter);
}

.quick-label,
.memory-hint,
.table-subtitle,
.secondary-text,
.company-code {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.memory-hint {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
}

.table-toolbar {
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.toolbar-left,
.toolbar-right,
.row-actions {
  gap: 10px;
}

.row-actions {
  justify-content: center;
  gap: 4px;
  white-space: nowrap;
}

.row-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

.toolbar-left {
  flex-wrap: wrap;
}

.toolbar-right {
  justify-content: flex-end;
  flex-wrap: wrap;
}

.table-title {
  font-size: 16px;
  font-weight: 600;
}

.table-subtitle {
  margin-left: 10px;
}

.company-cell,
.two-line-cell {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 4px;
}

.company-name {
  align-self: flex-start;
  max-width: 100%;
  padding: 0;
  overflow: hidden;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.company-code,
.ellipsis-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.masked-account {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  letter-spacing: 0.4px;
}

.sensitive-value-row {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  min-width: 0;
}

.sensitive-eye-button {
  min-height: auto;
  margin-left: 0 !important;
  padding: 2px;
}

.align-center {
  align-items: center;
}

.waiting-time {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.waiting-time.overdue {
  color: var(--el-color-danger);
  font-weight: 600;
}

.contact-phone {
  display: flex;
  align-items: center;
  gap: 2px;
}

.column-setting-title {
  margin-bottom: 10px;
  font-weight: 600;
}

.column-setting-list {
  display: flex;
  flex-direction: column;
}

.table-card :deep(.overdue-row > td.el-table__cell) {
  background: var(--el-color-warning-light-9) !important;
}

.table-card :deep(.blacklisted-row > td.el-table__cell) {
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light) !important;
}

/* 已完成审核的行不再展示无效复选框，待审核行仍参与表头全选和批量操作。 */
.table-card :deep(.selection-hidden-row .el-table-column--selection .el-checkbox) {
  visibility: hidden;
}

.detail-dialog-body {
  min-height: 360px;
}

.detail-tip,
.dialog-form {
  margin-top: 18px;
}

.qualification-section-title {
  margin: 4px 0 12px;
  padding-left: 10px;
  border-left: 3px solid var(--el-color-primary);
  font-size: 15px;
  font-weight: 600;
}

.qualification-descriptions {
  margin-bottom: 20px;
}

.material-section-title {
  margin-top: 22px;
}

.material-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.material-card {
  min-height: 195px;
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  background: var(--el-fill-color-blank);
}

.material-label {
  margin-bottom: 10px;
  font-weight: 600;
}

.material-image {
  width: 100%;
  height: 150px;
  border-radius: 4px;
  cursor: zoom-in;
}

.material-image-error,
.material-document {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 150px;
  border-radius: 4px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
}

.material-document {
  flex-direction: column;
  padding: 12px;
  text-align: center;
}

.material-document-icon {
  color: var(--el-color-primary);
  font-size: 28px;
}

.audit-log-card {
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
}

.audit-log-card strong {
  margin-right: 10px;
}

.audit-operator {
  margin-right: 8px;
  color: var(--el-text-color-regular);
}

.audit-log-card p {
  margin: 8px 0 0;
  color: var(--el-text-color-regular);
}

.target-list {
  flex-wrap: wrap;
  gap: 6px;
}

.audit-checklist {
  display: grid;
  grid-template-columns: 1fr;
}

@media (max-width: 1200px) {
  .material-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .memory-hint { margin-left: 0; }
}
</style>
