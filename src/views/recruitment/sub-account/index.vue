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
              v-hasPermi="['settlement:subAccount:commissionRate', 'settlement:subAccount:interestRate', 'settlement:subAccount:config']"
              type="primary"
              plain
              icon="Setting"
              @click="openGlobalSettings"
            >
              全局设置
            </el-button>
            <el-button
              v-if="showCmbConfigEntry"
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
        <el-table-column v-if="isColumnVisible('subAccount')" label="子单元账户" min-width="180">
          <template #default="{ row }">
            <div class="two-line-cell">
              <span>{{ row.subAccountName || '-' }}</span>
              <div class="sensitive-value-row masked-account secondary-text">
                <span>{{ subAccountNoText(row) }}</span>
                <el-tooltip v-if="row.subAccountNoMasked" :content="isSubAccountNoRevealed(row) ? '隐藏完整子单元账户' : '查看完整子单元账户'" placement="top">
                  <el-button
                    v-hasPermi="['settlement:subAccount:decrypt']"
                    class="sensitive-eye-button"
                    link
                    type="primary"
                    :icon="isSubAccountNoRevealed(row) ? 'Hide' : 'View'"
                    :loading="isSensitiveLoading(row, 'subAccount')"
                    :aria-label="isSubAccountNoRevealed(row) ? '隐藏完整招商子单元账户' : '查看完整招商子单元账户'"
                    @click.stop="toggleSubAccountNo(row)"
                  />
                </el-tooltip>
              </div>
              <span class="secondary-text">{{ accountTypeText(row.accountType) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column v-if="isColumnVisible('commissionRate')" label="抽佣比例" width="130" align="center">
          <template #default="{ row }">
            <div class="two-line-cell align-center">
              <el-tooltip :disabled="!isCommissionRateEditable(row) || !canManageCommissionRate" content="点击修改该企业抽佣比例" placement="top">
                <el-button
                  class="commission-rate-value"
                  link
                  type="primary"
                  :disabled="!isCommissionRateEditable(row) || !canManageCommissionRate"
                  @click="openCommissionRateEditor(row)"
                >
                  {{ commissionRateText(row.effectiveCommissionRate) }}
                </el-button>
              </el-tooltip>
              <el-tag :type="row.commissionRateSource === 'INDIVIDUAL' ? 'warning' : 'info'" size="small" effect="plain">
                {{ row.commissionRateSource === 'INDIVIDUAL' ? '企业单独' : '继承全局' }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="主账号设置" width="125" align="center">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'APPROVED' && row.openingStatus === 'SUCCESS'"
              v-hasPermi="['settlement:subAccount:config']"
              link
              type="primary"
              icon="CreditCard"
              @click="openPaymentAccounts(row)"
            >
              设置
            </el-button>
            <span v-else class="secondary-text">-</span>
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
        <el-table-column label="操作" width="160" fixed="right" align="center">
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
              <el-dropdown trigger="click" @command="(command) => handleRowCommand(command, row)">
                <el-button link type="primary">更多<el-icon class="el-icon--right"><ArrowDown /></el-icon></el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
                      v-if="row.status !== 'BLACKLISTED'"
                      v-hasPermi="['settlement:subAccount:edit']"
                      command="editRecord"
                      icon="Edit"
                    >
                      编辑
                    </el-dropdown-item>
                    <el-dropdown-item command="materials" icon="FolderOpened">查看材料</el-dropdown-item>
                    <el-dropdown-item command="logs" icon="Document">审计日志</el-dropdown-item>
                    <el-dropdown-item
                      v-if="row.status === 'APPROVED' && row.openingStatus === 'SUCCESS'"
                      v-hasPermi="['settlement:subAccount:config']"
                      command="paymentAccounts"
                      icon="CreditCard"
                    >主账号设置</el-dropdown-item>
                    <el-dropdown-item v-hasPermi="['settlement:subAccount:decrypt']" command="account" icon="View">查看完整账号</el-dropdown-item>
                    <el-dropdown-item
                      v-if="row.status === 'APPROVED'"
                      v-hasPermi="['settlement:subAccount:blacklist']"
                      command="blacklist"
                      icon="Lock"
                      divided
                    >
                      拉黑并关闭子单元
                    </el-dropdown-item>
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
              <el-descriptions-item label="子单元账户" :span="2">
                <div v-if="detailTarget" class="sensitive-value-row masked-account">
                  <span>{{ subAccountNoText(detailTarget) }}</span>
                  <el-button
                    v-if="detailTarget.subAccountNoMasked"
                    v-hasPermi="['settlement:subAccount:decrypt']"
                    class="sensitive-eye-button"
                    link
                    type="primary"
                    :icon="isSubAccountNoRevealed(detailTarget) ? 'Hide' : 'View'"
                    :loading="isSensitiveLoading(detailTarget, 'subAccount')"
                    @click="toggleSubAccountNo(detailTarget)"
                  />
                </div>
              </el-descriptions-item>
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

    <el-dialog
      v-model="editVisible"
      title="编辑白名单数据"
      width="680px"
      append-to-body
      destroy-on-close
      @closed="clearEditSensitiveFields"
    >
      <el-alert
        v-if="editTarget?.status === 'APPROVED'"
        title="修改已开户数据的子单元名称后，系统会同步提交招行 NTDMAMNT 修改任务。"
        type="warning"
        :closable="false"
        show-icon
      />
      <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-width="118px" class="dialog-form">
        <el-form-item label="企业名称">{{ editTarget?.companyName || '-' }}</el-form-item>
        <el-form-item label="子单元名称" prop="subAccountName">
          <el-input v-model="editForm.subAccountName" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="账户类型" prop="accountType">
          <el-radio-group v-model="editForm.accountType">
            <el-radio value="CORPORATE">对公账户</el-radio>
            <el-radio value="INDIVIDUAL">个人账户</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="开户行 / 支行" prop="bankBranch">
          <el-input v-model="editForm.bankBranch" maxlength="120" show-word-limit />
        </el-form-item>
        <el-form-item label="当前银行账号">
          <el-input :model-value="editTarget?.bankAccountMasked || '-'" disabled />
        </el-form-item>
        <el-form-item label="新银行账号" prop="bankAccount">
          <el-input v-model="editForm.bankAccount" type="password" show-password clearable maxlength="32" autocomplete="new-password" placeholder="不填写则保留当前账号" />
        </el-form-item>
        <el-form-item label="联系人" prop="contactName">
          <el-input v-model="editForm.contactName" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="当前联系电话">
          <el-input :model-value="editTarget?.contactPhoneMasked || '-'" disabled />
        </el-form-item>
        <el-form-item label="新联系电话" prop="contactPhone">
          <el-input v-model="editForm.contactPhone" type="password" show-password clearable maxlength="11" autocomplete="new-password" placeholder="不填写则保留当前电话" />
        </el-form-item>
        <template v-if="editTarget?.status === 'APPROVED' && canManageCommissionRate">
          <el-divider content-position="left">抽佣比例</el-divider>
          <el-form-item label="全局抽佣比例">{{ commissionRateText(globalCommissionRate) }}</el-form-item>
          <el-form-item label="抽佣方式" prop="commissionRateMode">
            <el-radio-group v-model="editForm.commissionRateMode">
              <el-radio value="GLOBAL">继承全局</el-radio>
              <el-radio value="INDIVIDUAL">单独设置</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item v-if="editForm.commissionRateMode === 'INDIVIDUAL'" label="企业抽佣比例" prop="commissionRate">
            <el-input-number v-model="editForm.commissionRate" :min="3" :max="100" :precision="1" :step="0.1" controls-position="right" />
            <span class="rate-unit">%</span>
          </el-form-item>
        </template>
        <el-form-item label="修改原因" prop="reason">
          <el-input v-model="editForm.reason" type="textarea" :rows="3" maxlength="500" show-word-limit placeholder="请说明本次修改原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button :disabled="editSubmitting" @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="editSubmitting" @click="submitEditRecord">保存修改</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="blacklistVisible" title="企业移出结算白名单" width="620px" append-to-body>
      <el-alert title="拉黑后企业立即失去白名单资格，系统同时提交子单元关户任务；余额未清零或存在未完成支付时会等待，满足条件后关闭。" type="error" :closable="false" show-icon />
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
        <el-button type="danger" :loading="blacklistSubmitting" @click="submitBlacklist">确认拉黑并关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="globalSettingsVisible" title="全局设置" width="600px" append-to-body @closed="globalSettingsForm.mainAccountNo = ''">
      <el-alert
        title="抽佣比例和多主账号开关作为企业默认值；修改全局主账号不会批量替换企业已有的银行关联。"
        type="info"
        :closable="false"
        show-icon
      />
      <el-form
        v-loading="globalSettingsLoading"
        ref="globalSettingsFormRef"
        :model="globalSettingsForm"
        :rules="commissionRateRules"
        label-width="150px"
        class="dialog-form"
      >
        <el-form-item label="全局抽佣比例" prop="commissionRate">
          <el-input-number v-model="globalSettingsForm.commissionRate" :min="3" :max="100" :precision="1" :step="0.1" controls-position="right" />
          <span class="rate-unit">%</span>
        </el-form-item>
        <el-form-item label="全局配置主账号" prop="mainAccountNo">
          <el-input
            v-model="globalSettingsForm.mainAccountNo"
            maxlength="35"
            clearable
            :placeholder="globalMainAccountConfigured ? `已配置 ${globalMainAccountNoMasked}，留空不修改` : '请输入6至35位主账号'"
          />
        </el-form-item>
        <el-form-item label="允许多个主账号">
          <el-switch
            v-model="globalSettingsForm.allowMultipleMainAccounts"
            active-text="允许"
            inactive-text="仅单个"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button :disabled="globalSettingsSubmitting" @click="globalSettingsVisible = false">取消</el-button>
        <el-button type="primary" :loading="globalSettingsSubmitting" @click="submitGlobalSettings">保存并生效</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="commissionRateEditorVisible" :title="`${commissionRateEditorTarget?.companyName || ''} · 抽佣比例`" width="500px" append-to-body>
      <el-form ref="commissionRateEditorFormRef" :model="commissionRateEditorForm" :rules="commissionRateRules" label-width="110px">
        <el-form-item label="设置方式">
          <el-radio-group v-model="commissionRateEditorForm.mode">
            <el-radio value="GLOBAL">继承全局（{{ commissionRateText(globalCommissionRate) }}）</el-radio>
            <el-radio value="INDIVIDUAL">企业单独设置</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="commissionRateEditorForm.mode === 'INDIVIDUAL'" label="抽佣比例" prop="commissionRate">
          <el-input-number v-model="commissionRateEditorForm.commissionRate" :min="3" :max="100" :precision="1" :step="0.1" controls-position="right" />
          <span class="rate-unit">%</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button :disabled="commissionRateEditorSubmitting" @click="commissionRateEditorVisible = false">取消</el-button>
        <el-button type="primary" :loading="commissionRateEditorSubmitting" @click="submitCommissionRateEditor">保存</el-button>
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

    <el-dialog
      v-model="paymentAccountVisible"
      :title="`${paymentAccountTarget?.companyName || ''} · 主账号设置`"
      width="1000px"
      append-to-body
      destroy-on-close
      @closed="clearPaymentAccountSensitiveValues"
    >
      <div v-loading="paymentAccountLoading" class="payment-account-dialog">
        <el-alert
          title="默认主账号根据开户成功的子账号归属记录判定：匹配显示正常，不匹配显示未绑定，本地开户记录异常时显示异常。"
          type="info"
          :closable="false"
          show-icon
        />
        <div class="main-account-policy">
          <div>
            <span class="policy-label">允许多个主账号</span>
            <el-tag v-if="paymentAccountSettingSource === 'GLOBAL'" type="info" size="small" effect="plain">当前继承全局</el-tag>
          </div>
          <el-switch
            v-model="paymentAccountAllowMultiple"
            active-text="开启"
            inactive-text="关闭"
            @change="handleMultipleMainAccountChange"
          />
        </div>
        <el-table :data="paymentAccountRows" row-key="accountId" class="payment-account-table">
          <el-table-column label="关联子账号" width="118" align="center">
            <template #default="{ row }">
              <el-switch
                :model-value="paymentAccountSelectedIds.includes(String(row.accountId))"
                inline-prompt
                active-text="关联"
                inactive-text="关闭"
                :disabled="paymentAccountSubmitting"
                @change="(checked) => togglePaymentAccount(row.accountId, Boolean(checked))"
              />
            </template>
          </el-table-column>
          <el-table-column label="主账号名称" min-width="180">
            <template #default="{ row }">
              <div class="payment-account-name-cell">
                <span
                  :class="['payment-bank-logo', `is-${paymentAccountBankBrand(row.accountName).key}`]"
                  role="img"
                  :aria-label="`${paymentAccountBankBrand(row.accountName).name} Logo`"
                  :title="paymentAccountBankBrand(row.accountName).name"
                >
                  <img
                    v-if="paymentAccountBankBrand(row.accountName).logo"
                    class="payment-bank-logo-image"
                    :src="paymentAccountBankBrand(row.accountName).logo"
                    alt=""
                  />
                  <template v-else>{{ paymentAccountBankBrand(row.accountName).glyph }}</template>
                </span>
                <span class="payment-account-name">{{ row.accountName || '-' }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="主账号企业" min-width="180" show-overflow-tooltip>
            <template #default="{ row }">
              <span :class="['payment-account-company', { 'is-empty': !row.subjectCompanyName }]">
                {{ row.subjectCompanyName || '待补充' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="银行卡号" min-width="190">
            <template #default="{ row }">
              <div class="sensitive-value-row masked-account">
                <span>{{ paymentAccountNoText(row) }}</span>
                <el-tooltip :content="isPaymentAccountNoRevealed(row) ? '隐藏完整银行卡号' : '查看完整银行卡号'" placement="top">
                  <el-button
                    v-hasPermi="['settlement:subAccount:decrypt']"
                    class="sensitive-eye-button"
                    link
                    type="primary"
                    :icon="isPaymentAccountNoRevealed(row) ? 'Hide' : 'View'"
                    :loading="isPaymentAccountNoLoading(row)"
                    :aria-label="isPaymentAccountNoRevealed(row) ? '隐藏完整主账号银行卡号' : '查看完整主账号银行卡号'"
                    @click.stop="togglePaymentAccountNo(row)"
                  />
                </el-tooltip>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="联系人 / 联系方式" min-width="180">
            <template #default="{ row }">
              <div class="two-line-cell">
                <span>{{ row.contactName || '-' }}</span>
                <span class="secondary-text">{{ row.contactPhoneMasked || '待补充' }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="默认" width="72" align="center">
            <template #default="{ row }">
              <el-radio
                v-model="paymentAccountDefaultId"
                :label="String(row.accountId)"
                :disabled="!paymentAccountSelectedIds.includes(String(row.accountId))"
              ><span /></el-radio>
            </template>
          </el-table-column>
          <el-table-column label="默认主账号关系" min-width="210">
            <template #default="{ row }">
              <div class="payment-account-status-cell">
                <el-tooltip
                  v-if="paymentAccountStatusDetail(row)"
                  :content="paymentAccountStatusDetail(row)"
                  placement="top"
                  :show-after="200"
                >
                  <el-tag :type="paymentAccountStatusType(paymentAccountDisplayStatus(row))" size="small">
                    {{ paymentAccountStatusText(paymentAccountDisplayStatus(row)) }}
                  </el-tag>
                </el-tooltip>
                <el-tag v-else :type="paymentAccountStatusType(paymentAccountDisplayStatus(row))" size="small">
                  {{ paymentAccountStatusText(paymentAccountDisplayStatus(row)) }}
                </el-tag>
                <span
                  v-if="paymentAccountStatusDetail(row)"
                  :class="['payment-account-status-reason', { 'is-error': paymentAccountDisplayStatus(row) === 'ERROR' }]"
                >
                  {{ paymentAccountStatusDetail(row) }}
                </span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="76" align="center" fixed="right">
            <template #default="{ row }">
              <el-button
                link
                type="danger"
                icon="Delete"
                :loading="paymentAccountDeletingIds.includes(String(row.accountId))"
                @click.stop="confirmDeletePaymentAccount(row)"
              >删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-divider content-position="left">主账号资料</el-divider>
        <el-form class="payment-account-add-form" label-width="96px" @submit.prevent>
          <el-form-item label="选择主账号" class="payment-account-profile-account">
            <div class="payment-account-selector-row">
              <el-select
                v-model="paymentAccountProfileAccountId"
                placeholder="请选择已有主账号"
                @change="selectPaymentAccountProfile"
              >
                <el-option
                  v-for="item in paymentAccountRows"
                  :key="String(item.accountId)"
                  :label="`${item.accountName || '未命名主账号'}（${item.subjectCompanyName || '企业待补充'}）`"
                  :value="String(item.accountId)"
                />
                <el-option label="新增主账号" :value="NEW_PAYMENT_ACCOUNT_ID" />
              </el-select>
              <el-button
                type="primary"
                plain
                :disabled="isCreatingPaymentAccount"
                @click="selectPaymentAccountProfile(NEW_PAYMENT_ACCOUNT_ID)"
              >＋ 添加主账号</el-button>
            </div>
          </el-form-item>
          <el-form-item label="主账号名称">
            <el-input v-model="paymentAccountEditor.accountName" maxlength="64" placeholder="请输入主账号名称" />
          </el-form-item>
          <el-form-item label="主账号企业">
            <el-input v-model="paymentAccountEditor.subjectCompanyName" maxlength="100" placeholder="请输入该主账号实际开户企业名称" />
          </el-form-item>
          <el-form-item label="联系人">
            <el-input v-model="paymentAccountEditor.contactName" maxlength="50" placeholder="请输入该主账号联系人姓名" />
          </el-form-item>
          <el-form-item label="联系方式">
            <el-input
              v-model="paymentAccountEditor.contactPhone"
              maxlength="32"
              :placeholder="paymentAccountStoredContactPhoneMasked ? `已保存 ${paymentAccountStoredContactPhoneMasked}，留空不修改` : '请输入手机号或固定电话'"
            />
          </el-form-item>
          <el-form-item label="银行卡号">
            <el-input
              v-if="isCreatingPaymentAccount"
              v-model="paymentAccountEditor.accountNo"
              maxlength="35"
              placeholder="请输入完整银行卡号"
            />
            <el-input v-else :model-value="currentPaymentAccount?.accountNoMasked || '-'" disabled />
          </el-form-item>
          <el-form-item class="payment-account-add-action">
            <el-button
              type="primary"
              plain
              :disabled="!paymentAccountProfileAccountId"
              :loading="paymentAccountAdding || paymentAccountProfileSubmitting"
              @click="savePaymentAccountEditor"
            >{{ isCreatingPaymentAccount ? '添加主账号' : '保存主账号资料' }}</el-button>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button :disabled="paymentAccountSubmitting" @click="paymentAccountVisible = false">取消</el-button>
        <el-button type="primary" :loading="paymentAccountSubmitting" @click="submitPaymentAccounts">保存配置</el-button>
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
import { encrypt } from '@/utils/jsencrypt';
import hengfengBankLogo from '@/assets/bank-logos/hfb.png';
import jiangsuBankLogo from '@/assets/bank-logos/jsbc.svg';
import {
  approveSettlementSubAccount,
  addSettlementPaymentAccount,
  assignSettlementPaymentAccounts,
  blacklistSettlementSubAccount,
  deleteSettlementPaymentAccount,
  getSettlementGlobalSettings,
  getSettlementMainAccountSettings,
  getSettlementPaymentAccountNo,
  getSettlementSubAccountBankAccount,
  getSettlementSubAccountNo,
  getSettlementSubAccountContactPhone,
  getSettlementSubAccountAuthorizationLetter,
  getSettlementPaymentAccounts,
  getSettlementSubAccountStatistics,
  getSettlementCmbConfig,
  listSettlementSubAccount,
  rejectSettlementSubAccount,
  resetCompanySettlementCommissionRate,
  updateCompanySettlementCommissionRate,
  updateSettlementGlobalSettings,
  updateSettlementPaymentAccountProfile,
  updateSettlementSubAccount,
  updateSettlementCmbConfig,
  type SettlementCmbConfig,
  type SettlementCmbConfigRequest,
  type SettlementSubAccountQuery,
  type SettlementSubAccountStatistics,
  type SettlementSubAccountUpdateRequest,
  type SettlementSubAccountVO,
  type SettlementPaymentAccount,
  type SubAccountAuditStatus
} from '@/api/recruitment/settlementSubAccount';

type QuickRange = '' | 'today' | '7d' | '30d';
type DetailTab = 'application' | 'materials' | 'logs';
type CommissionRateMode = 'GLOBAL' | 'INDIVIDUAL';

interface MaterialFile {
  label: string;
  url: string;
  kind: 'image' | 'document';
  name?: string;
}

const FILTER_STORAGE_KEY = 'admin:sub-account:filters:v2';
const COLUMN_STORAGE_KEY = 'admin:sub-account:columns:v2';
const router = useRouter();
const userStore = useUserStore();
// 编辑权限与抽佣权限分开判断，只有具备抽佣权限时才在编辑弹窗展示比例设置。
const canManageCommissionRate = computed(() =>
  userStore.permissions.includes('*:*:*')
  || userStore.permissions.includes('settlement:subAccount:commissionRate')
  || userStore.permissions.includes('settlement:subAccount:interestRate')
);
// 生产参数仍由后端保留，本页面按运营要求隐藏配置入口，后续可通过开关恢复。
const showCmbConfigEntry = false;
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
  { key: 'subAccount', label: '子单元账户', required: true },
  { key: 'commissionRate', label: '抽佣比例', required: true },
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

interface SettlementSubAccountEditForm {
  subAccountName: string;
  accountType: 'CORPORATE' | 'INDIVIDUAL';
  bankBranch: string;
  bankAccount: string;
  contactName: string;
  contactPhone: string;
  commissionRateMode: CommissionRateMode;
  commissionRate: number;
  reason: string;
}

const editVisible = ref(false);
const editSubmitting = ref(false);
const editTarget = ref<SettlementSubAccountVO>();
const editFormRef = ref<FormInstance>();
const editForm = reactive<SettlementSubAccountEditForm>({
  subAccountName: '',
  accountType: 'CORPORATE',
  bankBranch: '',
  bankAccount: '',
  contactName: '',
  contactPhone: '',
  commissionRateMode: 'GLOBAL',
  commissionRate: 5,
  reason: ''
});
const editRules: FormRules = {
  subAccountName: [
    { required: true, message: '请输入子单元名称', trigger: 'blur' },
    { max: 100, message: '子单元名称不能超过100个字符', trigger: 'blur' },
    { pattern: /^[\p{L}\p{N}\s（）()·&._-]+$/u, message: '子单元名称包含不允许的特殊符号', trigger: 'blur' }
  ],
  accountType: [{ required: true, message: '请选择账户类型', trigger: 'change' }],
  bankBranch: [
    { required: true, message: '请输入开户行或支行', trigger: 'blur' },
    { max: 120, message: '开户支行不能超过120个字符', trigger: 'blur' },
    { pattern: /^[\p{L}\p{N}\s（）()·&._-]+$/u, message: '开户支行包含不允许的特殊符号', trigger: 'blur' }
  ],
  bankAccount: [
    { pattern: /^$|^\d{8,32}$/, message: '新银行账号应为8到32位数字', trigger: 'blur' }
  ],
  contactName: [
    { required: true, message: '请输入联系人', trigger: 'blur' },
    { max: 50, message: '联系人不能超过50个字符', trigger: 'blur' },
    { pattern: /^[\p{L}\p{N}\s·._-]+$/u, message: '联系人包含不允许的特殊符号', trigger: 'blur' }
  ],
  contactPhone: [
    { pattern: /^$|^1[3-9]\d{9}$/, message: '新联系电话格式不正确', trigger: 'blur' }
  ],
  commissionRateMode: [{ required: true, message: '请选择抽佣方式', trigger: 'change' }],
  commissionRate: [
    { required: true, message: '请输入抽佣比例', trigger: 'change' },
    {
      validator: (_rule, value, callback) => {
        const rate = Number(value);
        if (!Number.isFinite(rate) || rate < 3 || rate > 100) return callback(new Error('抽佣比例需在3.0%到100.0%之间'));
        if (!/^\d{1,3}(\.\d)?$/.test(String(value))) return callback(new Error('抽佣比例只能保留1位小数'));
        callback();
      },
      trigger: 'change'
    }
  ],
  reason: [
    { required: true, message: '请输入修改原因', trigger: 'blur' },
    { max: 500, message: '修改原因不能超过500个字符', trigger: 'blur' }
  ]
};

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

// 付款账户配置按当前申请加载；完整卡号只在管理员主动点击后留存在当前弹窗内，关闭即清除。
const paymentAccountVisible = ref(false);
const paymentAccountLoading = ref(false);
const paymentAccountSubmitting = ref(false);
const paymentAccountAdding = ref(false);
const paymentAccountProfileSubmitting = ref(false);
const paymentAccountDeletingIds = ref<string[]>([]);
const paymentAccountTarget = ref<SettlementSubAccountVO>();
const paymentAccountRows = ref<SettlementPaymentAccount[]>([]);
const revealedPaymentAccountNos = reactive<Record<string, string>>({});
const paymentAccountNoLoadingIds = ref<string[]>([]);
const paymentAccountRevealVersion = ref(0);
const paymentAccountSelectedIds = ref<string[]>([]);
const paymentAccountDefaultId = ref('');
const paymentAccountAllowMultiple = ref(false);
const paymentAccountSettingSource = ref<'GLOBAL' | 'INDIVIDUAL'>('GLOBAL');
const NEW_PAYMENT_ACCOUNT_ID = '__NEW_PAYMENT_ACCOUNT__';
const paymentAccountProfileAccountId = ref('');
const paymentAccountStoredContactPhoneMasked = ref('');
// 已有账号编辑和新增账号共用一条资料模型，仅银行卡号在新增时允许录入。
const paymentAccountEditor = reactive({
  accountName: '',
  subjectCompanyName: '',
  contactName: '',
  accountNo: '',
  contactPhone: ''
});
const isCreatingPaymentAccount = computed(() => paymentAccountProfileAccountId.value === NEW_PAYMENT_ACCOUNT_ID);
const currentPaymentAccount = computed(() => paymentAccountRows.value.find(
  (item) => String(item.accountId) === paymentAccountProfileAccountId.value
));

const globalCommissionRate = ref(5);
const globalSettingsVisible = ref(false);
const globalSettingsLoading = ref(false);
const globalSettingsSubmitting = ref(false);
const globalSettingsFormRef = ref<FormInstance>();
const globalMainAccountNoMasked = ref('');
const globalMainAccountConfigured = ref(false);
const globalSettingsForm = reactive({ commissionRate: 5, mainAccountNo: '', allowMultipleMainAccounts: false });
const commissionRateRules: FormRules = {
  commissionRate: [
    { required: true, message: '请输入抽佣比例', trigger: 'change' },
    {
      validator: (_rule, value, callback) => {
        const rate = Number(value);
        if (!Number.isFinite(rate) || rate < 3 || rate > 100) return callback(new Error('抽佣比例需在3.0%到100.0%之间'));
        if (!/^\d{1,3}(\.\d)?$/.test(String(value))) return callback(new Error('抽佣比例只能保留1位小数'));
        callback();
      },
      trigger: 'change'
    }
  ],
  mainAccountNo: [
    { pattern: /^$|^\d{6,35}$/, message: '全局主账号必须为6至35位数字', trigger: 'blur' }
  ]
};

// 列表比例采用独立轻量弹窗，避免为只改抽佣比例打开完整企业编辑表单。
const commissionRateEditorVisible = ref(false);
const commissionRateEditorSubmitting = ref(false);
const commissionRateEditorTarget = ref<SettlementSubAccountVO>();
const commissionRateEditorFormRef = ref<FormInstance>();
const commissionRateEditorForm = reactive<{ mode: CommissionRateMode; commissionRate: number }>({
  mode: 'GLOBAL',
  commissionRate: 5
});

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
  closeType: 'N',
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
  closeType: 'N',
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
const revealedSubAccountNumbers = reactive<Record<string, string>>({});
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

async function loadGlobalCommissionRate() {
  const res: any = await getSettlementGlobalSettings();
  globalCommissionRate.value = Number(res.data?.globalCommissionRate ?? 5);
  return globalCommissionRate.value;
}

async function openGlobalSettings() {
  globalSettingsVisible.value = true;
  globalSettingsLoading.value = true;
  try {
    const res: any = await getSettlementGlobalSettings();
    const data = res.data || {};
    globalCommissionRate.value = Number(data.globalCommissionRate ?? 5);
    globalMainAccountNoMasked.value = data.globalMainAccountNoMasked || '';
    globalMainAccountConfigured.value = data.globalMainAccountConfigured === true;
    Object.assign(globalSettingsForm, {
      commissionRate: globalCommissionRate.value,
      mainAccountNo: '',
      allowMultipleMainAccounts: data.allowMultipleMainAccounts === true
    });
    globalSettingsFormRef.value?.clearValidate();
  } finally {
    globalSettingsLoading.value = false;
  }
}

async function submitGlobalSettings() {
  if (!globalSettingsFormRef.value) return;
  const valid = await globalSettingsFormRef.value.validate().catch(() => false);
  if (!valid) return;
  globalSettingsSubmitting.value = true;
  try {
    await updateSettlementGlobalSettings({
      commissionRate: globalSettingsForm.commissionRate,
      mainAccountNo: globalSettingsForm.mainAccountNo.trim() || undefined,
      allowMultipleMainAccounts: globalSettingsForm.allowMultipleMainAccounts
    });
    globalCommissionRate.value = globalSettingsForm.commissionRate;
    globalSettingsVisible.value = false;
    ElMessage.success('全局设置已更新');
    await loadData();
  } finally {
    globalSettingsSubmitting.value = false;
  }
}

async function openCommissionRateEditor(row: SettlementSubAccountVO) {
  if (!isCommissionRateEditable(row) || !canManageCommissionRate.value) return;
  commissionRateEditorTarget.value = row;
  commissionRateEditorForm.mode = row.commissionRateSource === 'INDIVIDUAL' ? 'INDIVIDUAL' : 'GLOBAL';
  commissionRateEditorForm.commissionRate = Number(row.individualCommissionRate ?? row.effectiveCommissionRate ?? 5);
  commissionRateEditorVisible.value = true;
  await loadGlobalCommissionRate();
  commissionRateEditorFormRef.value?.clearValidate();
}

// 待审核时允许预设抽佣比例，驳回和拉黑记录保持只读。
function isCommissionRateEditable(row: SettlementSubAccountVO) {
  return row.status === 'PENDING' || row.status === 'APPROVED';
}

async function submitCommissionRateEditor() {
  const target = commissionRateEditorTarget.value;
  if (!target || !commissionRateEditorFormRef.value) return;
  if (commissionRateEditorForm.mode === 'INDIVIDUAL') {
    const valid = await commissionRateEditorFormRef.value.validate().catch(() => false);
    if (!valid) return;
  }
  commissionRateEditorSubmitting.value = true;
  try {
    if (commissionRateEditorForm.mode === 'INDIVIDUAL') {
      await updateCompanySettlementCommissionRate(target.applicationId, commissionRateEditorForm.commissionRate);
    } else {
      await resetCompanySettlementCommissionRate(target.applicationId);
    }
    ElMessage.success('企业抽佣比例已更新');
    commissionRateEditorVisible.value = false;
    await loadData();
  } finally {
    commissionRateEditorSubmitting.value = false;
  }
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
      closeType: data.closeType || 'N',
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
    if (Array.isArray(columns) && columns.length) {
      visibleColumns.value = Array.from(new Set(['company', 'subAccount', 'commissionRate', ...columns]));
    }
  } catch {
    localStorage.removeItem(FILTER_STORAGE_KEY);
    localStorage.removeItem(COLUMN_STORAGE_KEY);
  }
}

function saveColumnSettings() {
  ['commissionRate', 'subAccount', 'company'].forEach((key) => {
    if (!visibleColumns.value.includes(key)) visibleColumns.value.unshift(key);
  });
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

async function openEditRecord(row: SettlementSubAccountVO) {
  editTarget.value = row;
  Object.assign(editForm, {
    subAccountName: row.subAccountName || '',
    accountType: row.accountType === 'INDIVIDUAL' ? 'INDIVIDUAL' : 'CORPORATE',
    bankBranch: row.bankBranch || '',
    bankAccount: '',
    contactName: row.contactName || '',
    contactPhone: '',
    commissionRateMode: row.commissionRateSource === 'INDIVIDUAL' ? 'INDIVIDUAL' : 'GLOBAL',
    commissionRate: Number(row.individualCommissionRate ?? row.effectiveCommissionRate ?? 5),
    reason: ''
  });
  editVisible.value = true;
  if (row.status === 'APPROVED' && canManageCommissionRate.value) {
    await loadGlobalCommissionRate();
  }
  editFormRef.value?.clearValidate();
}

function clearEditSensitiveFields() {
  editForm.bankAccount = '';
  editForm.contactPhone = '';
  editTarget.value = undefined;
}

async function submitEditRecord() {
  const target = editTarget.value;
  if (!editFormRef.value || !target) return;
  const valid = await editFormRef.value.validate().catch(() => false);
  if (!valid) return;

  const bankAccount = editForm.bankAccount.trim();
  const contactPhone = editForm.contactPhone.trim();
  const encryptedBankAccount = bankAccount ? encrypt(bankAccount) : undefined;
  const encryptedContactPhone = contactPhone ? encrypt(contactPhone) : undefined;
  if ((bankAccount && !encryptedBankAccount) || (contactPhone && !encryptedContactPhone)) {
    return ElMessage.error('敏感信息加密失败，请刷新页面后重试');
  }

  const payload: SettlementSubAccountUpdateRequest = {
    subAccountName: editForm.subAccountName.trim(),
    accountType: editForm.accountType,
    bankBranch: editForm.bankBranch.trim(),
    contactName: editForm.contactName.trim(),
    reason: editForm.reason.trim(),
    version: Number(target.version ?? 0)
  };
  if (encryptedBankAccount) payload.encryptedBankAccount = encryptedBankAccount;
  if (encryptedContactPhone) payload.encryptedContactPhone = encryptedContactPhone;
  if (target.status === 'APPROVED' && canManageCommissionRate.value) {
    payload.commissionRateMode = editForm.commissionRateMode;
    if (editForm.commissionRateMode === 'INDIVIDUAL') {
      payload.commissionRate = editForm.commissionRate;
    }
  }

  editSubmitting.value = true;
  try {
    await updateSettlementSubAccount(target.applicationId, payload);
    ElMessage.success('这条白名单数据已更新');
    editVisible.value = false;
    await loadData();
  } finally {
    editSubmitting.value = false;
  }
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
    ElMessage.success('企业已拉黑，子单元关户任务已提交');
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

function subAccountNoText(row: SettlementSubAccountVO) {
  return revealedSubAccountNumbers[sensitiveRowKey(row)]
    || row.subAccountNoMasked
    || (row.openingStatus === 'SUCCESS' ? '编号暂不可用' : '开户成功后显示');
}

function commissionRateText(value?: number | null) {
  const rate = Number(value);
  if (!Number.isFinite(rate)) return '-';
  return `${rate.toFixed(1)}%`;
}

function contactPhoneText(row: SettlementSubAccountVO) {
  return revealedContactPhones[sensitiveRowKey(row)] || row.contactPhoneMasked || '号码未返回';
}

function isBankAccountRevealed(row: SettlementSubAccountVO) {
  return Boolean(revealedBankAccounts[sensitiveRowKey(row)]);
}

function isSubAccountNoRevealed(row: SettlementSubAccountVO) {
  return Boolean(revealedSubAccountNumbers[sensitiveRowKey(row)]);
}

function isContactPhoneRevealed(row: SettlementSubAccountVO) {
  return Boolean(revealedContactPhones[sensitiveRowKey(row)]);
}

function isSensitiveLoading(row: SettlementSubAccountVO, kind: 'bank' | 'subAccount' | 'phone') {
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

async function toggleSubAccountNo(row: SettlementSubAccountVO) {
  const rowKey = sensitiveRowKey(row);
  if (revealedSubAccountNumbers[rowKey]) {
    delete revealedSubAccountNumbers[rowKey];
    return;
  }
  const loadingKey = `subAccount:${rowKey}`;
  sensitiveLoadingKeys.value.push(loadingKey);
  try {
    const res: any = await getSettlementSubAccountNo(row.applicationId);
    const value = res.data?.subAccountNo;
    if (!value) return ElMessage.warning('未获取到完整招商子单元账户');
    revealedSubAccountNumbers[rowKey] = value;
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
  Object.keys(revealedSubAccountNumbers).forEach((key) => delete revealedSubAccountNumbers[key]);
  Object.keys(revealedContactPhones).forEach((key) => delete revealedContactPhones[key]);
}

function handleRowCommand(command: string, row: SettlementSubAccountVO) {
  if (command === 'editRecord') openEditRecord(row);
  if (command === 'materials') openDetail(row, 'materials');
  if (command === 'logs') openDetail(row, 'logs');
  if (command === 'paymentAccounts') openPaymentAccounts(row);
  if (command === 'account') toggleBankAccount(row);
  if (command === 'blacklist') openBlacklist(row);
}

interface PaymentBankBrand {
  terms: readonly string[];
  key: string;
  glyph: string;
  name: string;
  logo?: string;
}

// 银行名称来自账户名称字段；全国性商业银行使用本地品牌图标字库，江苏银行使用本地 SVG，未知银行才显示通用标识。
const paymentBankBrands: readonly PaymentBankBrand[] = [
  { terms: ['招商银行', 'CMB'], key: 'cmb', glyph: '\ue512', name: '招商银行' },
  { terms: ['工商银行', 'ICBC'], key: 'icbc', glyph: '\ue516', name: '中国工商银行' },
  { terms: ['农业银行', 'ABC'], key: 'abc', glyph: '\ue502', name: '中国农业银行' },
  { terms: ['中国银行', 'BOC'], key: 'boc', glyph: '\ue501', name: '中国银行' },
  { terms: ['建设银行', 'CCB'], key: 'ccb', glyph: '\ue507', name: '中国建设银行' },
  { terms: ['交通银行', 'BOCOM', 'BOCO'], key: 'bocom', glyph: '\ue504', name: '交通银行' },
  { terms: ['邮储银行', '邮政储蓄', 'PSBC'], key: 'psbc', glyph: '\ue520', name: '中国邮政储蓄银行' },
  { terms: ['浦发银行', 'SPDB'], key: 'spdb', glyph: '\ue521', name: '浦发银行' },
  { terms: ['中信银行', 'CITIC'], key: 'citic', glyph: '\ue510', name: '中信银行' },
  { terms: ['光大银行', 'CEB'], key: 'ceb', glyph: '\ue508', name: '中国光大银行' },
  { terms: ['民生银行', 'CMBC'], key: 'cmbc', glyph: '\ue511', name: '中国民生银行' },
  { terms: ['兴业银行', 'CIB'], key: 'cib', glyph: '\ue509', name: '兴业银行' },
  { terms: ['平安银行', 'PAB'], key: 'pingan', glyph: '\ue519', name: '平安银行' },
  { terms: ['广发银行', 'CGB', 'GDB'], key: 'cgb', glyph: '\ue514', name: '广发银行' },
  { terms: ['华夏银行', 'HXB'], key: 'hxb', glyph: '\ue515', name: '华夏银行' },
  { terms: ['浙商银行', 'CZB'], key: 'czb', glyph: '\ue513', name: '浙商银行' },
  { terms: ['渤海银行', 'CBHB'], key: 'cbhb', glyph: '\ue506', name: '渤海银行' },
  { terms: ['恒丰银行', 'HFB', 'EGB'], key: 'hfb', glyph: '', name: '恒丰银行', logo: hengfengBankLogo },
  { terms: ['北京银行', 'BCCB', 'BOB'], key: 'bccb', glyph: '\ue503', name: '北京银行' },
  { terms: ['北京农商银行', '北京农村商业银行', 'BRCB'], key: 'brcb', glyph: '\ue505', name: '北京农商银行' },
  { terms: ['南京银行', 'NJCB'], key: 'njcb', glyph: '\ue518', name: '南京银行' },
  { terms: ['江苏银行', 'JSBC'], key: 'jsbc', glyph: '', name: '江苏银行', logo: jiangsuBankLogo }
];

function paymentAccountBankBrand(accountName?: string): PaymentBankBrand {
  const normalizedName = String(accountName || '').toUpperCase();
  const words = normalizedName.split(/[^A-Z0-9]+/).filter(Boolean);
  return paymentBankBrands.find((brand) => brand.terms.some((term) => {
    const normalizedTerm = term.toUpperCase();
    return /^[A-Z]+$/.test(normalizedTerm)
      ? words.includes(normalizedTerm)
      : normalizedName.includes(normalizedTerm);
  }))
    || { terms: [], key: 'generic', glyph: '银', name: '银行账户' };
}

function paymentAccountNoText(row: SettlementPaymentAccount) {
  return revealedPaymentAccountNos[String(row.accountId)] || row.accountNoMasked || '-';
}

function isPaymentAccountNoRevealed(row: SettlementPaymentAccount) {
  return Boolean(revealedPaymentAccountNos[String(row.accountId)]);
}

function isPaymentAccountNoLoading(row: SettlementPaymentAccount) {
  return paymentAccountNoLoadingIds.value.includes(String(row.accountId));
}

async function togglePaymentAccountNo(row: SettlementPaymentAccount) {
  const accountId = String(row.accountId);
  if (revealedPaymentAccountNos[accountId]) {
    delete revealedPaymentAccountNos[accountId];
    return;
  }
  if (!paymentAccountTarget.value || paymentAccountNoLoadingIds.value.includes(accountId)) return;
  const revealVersion = paymentAccountRevealVersion.value;
  paymentAccountNoLoadingIds.value.push(accountId);
  try {
    const response: any = await getSettlementPaymentAccountNo(
      paymentAccountTarget.value.applicationId,
      row.accountId
    );
    const accountNo = response?.data?.accountNo;
    if (!accountNo) return ElMessage.warning('未获取到完整银行卡号');
    if (!paymentAccountVisible.value || revealVersion !== paymentAccountRevealVersion.value) return;
    revealedPaymentAccountNos[accountId] = accountNo;
  } finally {
    paymentAccountNoLoadingIds.value = paymentAccountNoLoadingIds.value.filter((item) => item !== accountId);
  }
}

function clearPaymentAccountSensitiveValues() {
  paymentAccountRevealVersion.value += 1;
  Object.keys(revealedPaymentAccountNos).forEach((key) => delete revealedPaymentAccountNos[key]);
  paymentAccountNoLoadingIds.value = [];
  paymentAccountDeletingIds.value = [];
  selectPaymentAccountProfile('');
  paymentAccountTarget.value = undefined;
}

function selectPaymentAccountProfile(accountId: string | number) {
  const id = String(accountId || '');
  if (id === NEW_PAYMENT_ACCOUNT_ID) {
    paymentAccountProfileAccountId.value = NEW_PAYMENT_ACCOUNT_ID;
    Object.assign(paymentAccountEditor, {
      accountName: '',
      subjectCompanyName: '',
      contactName: '',
      contactPhone: '',
      accountNo: ''
    });
    paymentAccountStoredContactPhoneMasked.value = '';
    return;
  }
  const account = paymentAccountRows.value.find((item) => String(item.accountId) === id);
  paymentAccountProfileAccountId.value = account ? id : '';
  paymentAccountEditor.accountName = account?.accountName || '';
  paymentAccountEditor.subjectCompanyName = account?.subjectCompanyName || '';
  paymentAccountEditor.contactName = account?.contactName || '';
  paymentAccountEditor.contactPhone = '';
  paymentAccountEditor.accountNo = '';
  paymentAccountStoredContactPhoneMasked.value = account?.contactPhoneMasked || '';
}

async function loadPaymentAccounts() {
  if (!paymentAccountTarget.value) return;
  paymentAccountRevealVersion.value += 1;
  Object.keys(revealedPaymentAccountNos).forEach((key) => delete revealedPaymentAccountNos[key]);
  paymentAccountLoading.value = true;
  try {
    const [response, settingsResponse]: any[] = await Promise.all([
      getSettlementPaymentAccounts(paymentAccountTarget.value.applicationId),
      getSettlementMainAccountSettings(paymentAccountTarget.value.applicationId)
    ]);
    paymentAccountRows.value = Array.isArray(response?.data) ? response.data : [];
    paymentAccountAllowMultiple.value = settingsResponse?.data?.allowMultipleMainAccounts === true;
    paymentAccountSettingSource.value = settingsResponse?.data?.settingSource === 'INDIVIDUAL' ? 'INDIVIDUAL' : 'GLOBAL';
    paymentAccountSelectedIds.value = paymentAccountRows.value
      .filter((item) => item.assigned)
      .map((item) => String(item.accountId));
    paymentAccountDefaultId.value = String(
      paymentAccountRows.value.find((item) => item.assigned && item.defaultAccount)?.accountId
        ?? paymentAccountRows.value.find((item) => item.assigned)?.accountId
        ?? ''
    );
    // 编辑区只读取主账号自身资料，不使用当前 B 端申请企业兜底，防止错误归属被保存。
    const profileAccount = paymentAccountRows.value.find((item) => String(item.accountId) === paymentAccountProfileAccountId.value)
      ?? paymentAccountRows.value.find((item) => String(item.accountId) === paymentAccountDefaultId.value)
      ?? paymentAccountRows.value.find((item) => item.assigned)
      ?? paymentAccountRows.value[0];
    selectPaymentAccountProfile(profileAccount?.accountId || NEW_PAYMENT_ACCOUNT_ID);
    if (!paymentAccountAllowMultiple.value && paymentAccountSelectedIds.value.length > 1) {
      const retainedId = paymentAccountDefaultId.value || paymentAccountSelectedIds.value[0];
      paymentAccountSelectedIds.value = retainedId ? [retainedId] : [];
      paymentAccountDefaultId.value = retainedId || '';
    }
  } finally {
    paymentAccountLoading.value = false;
  }
}

async function openPaymentAccounts(row: SettlementSubAccountVO) {
  clearPaymentAccountSensitiveValues();
  paymentAccountTarget.value = row;
  paymentAccountVisible.value = true;
  await loadPaymentAccounts();
}

function togglePaymentAccount(accountId: string | number, checked: boolean) {
  const id = String(accountId);
  if (checked && !paymentAccountAllowMultiple.value) {
    paymentAccountSelectedIds.value = [id];
    paymentAccountDefaultId.value = id;
    selectPaymentAccountProfile(id);
    return;
  }
  const selected = new Set(paymentAccountSelectedIds.value);
  if (checked) selected.add(id);
  else selected.delete(id);
  paymentAccountSelectedIds.value = [...selected];
  if (!selected.has(paymentAccountDefaultId.value)) {
    paymentAccountDefaultId.value = paymentAccountSelectedIds.value[0] || '';
  }
}

function handleMultipleMainAccountChange(enabled: boolean | string | number) {
  paymentAccountSettingSource.value = 'INDIVIDUAL';
  if (Boolean(enabled) || paymentAccountSelectedIds.value.length <= 1) return;
  const retainedId = paymentAccountDefaultId.value || paymentAccountSelectedIds.value[0] || '';
  paymentAccountSelectedIds.value = retainedId ? [retainedId] : [];
  paymentAccountDefaultId.value = retainedId;
  ElMessage.info('已保留当前默认主账号，其余账号将在保存后解除分配');
}

async function persistPaymentAccount(
  accountName: string,
  accountNo: string,
  subjectCompanyName: string,
  contactName: string,
  contactPhone: string
) {
  const response = await addSettlementPaymentAccount(paymentAccountTarget.value!.applicationId, {
    accountName,
    accountNo,
    subjectCompanyName,
    contactName,
    contactPhone
  });
  const savedAccount = response?.data;
  if (!savedAccount?.accountId) throw new Error('新增主账号后未返回账户信息，请刷新后重试');
  const existingIndex = paymentAccountRows.value.findIndex((item) => String(item.accountId) === String(savedAccount.accountId));
  // 新增接口按银行卡号幂等返回实际记录，弹窗始终以服务端账户 ID 作为后续分配依据。
  if (existingIndex >= 0) paymentAccountRows.value.splice(existingIndex, 1, savedAccount);
  else paymentAccountRows.value.push(savedAccount);
  return { savedAccount, existing: existingIndex >= 0 };
}

function normalizedPaymentAccountDraft() {
  return {
    accountName: paymentAccountEditor.accountName.trim(),
    accountNo: paymentAccountEditor.accountNo.replace(/\s/g, ''),
    subjectCompanyName: paymentAccountEditor.subjectCompanyName.trim(),
    contactName: paymentAccountEditor.contactName.trim(),
    contactPhone: paymentAccountEditor.contactPhone.trim()
  };
}

function validatePaymentAccountDraft(draft: ReturnType<typeof normalizedPaymentAccountDraft>) {
  if (!/^\d{6,35}$/.test(draft.accountNo)) return '请输入6至35位银行卡号';
  return validatePaymentAccountProfile(draft, true);
}

function normalizedPaymentAccountProfileDraft() {
  return {
    accountName: paymentAccountEditor.accountName.trim(),
    subjectCompanyName: paymentAccountEditor.subjectCompanyName.trim(),
    contactName: paymentAccountEditor.contactName.trim(),
    contactPhone: paymentAccountEditor.contactPhone.trim()
  };
}

function validatePaymentAccountProfile(
  draft: { accountName: string; subjectCompanyName: string; contactName: string; contactPhone: string },
  requirePhone: boolean
) {
  if (!draft.accountName) return '请输入主账号名称';
  if (!draft.subjectCompanyName) return '请输入主账号企业名称';
  if (!draft.contactName) return '请输入联系人';
  if (requirePhone && !draft.contactPhone) return '请输入联系人联系方式';
  if (draft.contactPhone && !/^[0-9+()\-\s]{6,32}$/.test(draft.contactPhone)) return '请输入正确的联系人联系方式';
  return '';
}

function selectedPaymentAccountMissingProfile() {
  const selected = new Set(paymentAccountSelectedIds.value.map(String));
  return paymentAccountRows.value.find((item) => selected.has(String(item.accountId))
    && (!item.accountName || !item.subjectCompanyName || !item.contactName || !item.contactPhoneMasked));
}

async function persistPaymentAccountProfile() {
  if (!paymentAccountTarget.value || !paymentAccountProfileAccountId.value || isCreatingPaymentAccount.value) return false;
  const current = paymentAccountRows.value.find(
    (item) => String(item.accountId) === paymentAccountProfileAccountId.value
  );
  if (!current) return false;
  const draft = normalizedPaymentAccountProfileDraft();
  const validationMessage = validatePaymentAccountProfile(draft, !current.contactPhoneMasked);
  if (validationMessage) {
    ElMessage.warning(validationMessage);
    return false;
  }
  const response = await updateSettlementPaymentAccountProfile(
    paymentAccountTarget.value.applicationId,
    current.accountId,
    {
      accountName: draft.accountName,
      subjectCompanyName: draft.subjectCompanyName,
      contactName: draft.contactName,
      contactPhone: draft.contactPhone || undefined
    }
  );
  const savedAccount = response?.data;
  if (!savedAccount?.accountId) throw new Error('保存主账号企业资料后未返回账户信息，请刷新后重试');
  const index = paymentAccountRows.value.findIndex((item) => String(item.accountId) === String(savedAccount.accountId));
  if (index >= 0) paymentAccountRows.value.splice(index, 1, savedAccount);
  selectPaymentAccountProfile(savedAccount.accountId);
  return true;
}

async function savePaymentAccountEditor() {
  if (isCreatingPaymentAccount.value) {
    await addPaymentAccount();
    return;
  }
  paymentAccountProfileSubmitting.value = true;
  try {
    if (await persistPaymentAccountProfile()) ElMessage.success('主账号企业与联系人资料已保存');
  } finally {
    paymentAccountProfileSubmitting.value = false;
  }
}

async function addPaymentAccount() {
  if (!paymentAccountTarget.value) return false;
  const draft = normalizedPaymentAccountDraft();
  const validationMessage = validatePaymentAccountDraft(draft);
  if (validationMessage) {
    ElMessage.warning(validationMessage);
    return false;
  }
  paymentAccountAdding.value = true;
  try {
    const { savedAccount, existing } = await persistPaymentAccount(
      draft.accountName,
      draft.accountNo,
      draft.subjectCompanyName,
      draft.contactName,
      draft.contactPhone
    );
    await loadPaymentAccounts();
    selectPaymentAccountProfile(savedAccount.accountId);
    ElMessage.success(existing ? '该银行卡号已存在，当前保持原关联状态' : '主账号已添加，当前未关联子账号');
    return true;
  } finally {
    paymentAccountAdding.value = false;
  }
}

async function confirmDeletePaymentAccount(row: SettlementPaymentAccount) {
  if (!paymentAccountTarget.value) return;
  const accountId = String(row.accountId);
  const confirmed = await ElMessageBox.confirm(
    `确认删除主账号“${row.accountName || '未命名主账号'}”吗？删除后该账号将不再显示，且不可直接恢复。`,
    '删除主账号',
    {
      type: 'warning',
      confirmButtonText: '确认删除',
      cancelButtonText: '取消'
    }
  ).then(() => true).catch(() => false);
  if (!confirmed) return;
  if (row.assigned) {
    ElMessage.warning('该主账号仍关联当前子账号，请先关闭关联并保存配置后再删除');
    return;
  }
  paymentAccountDeletingIds.value.push(accountId);
  try {
    await deleteSettlementPaymentAccount(paymentAccountTarget.value.applicationId, row.accountId);
    if (paymentAccountProfileAccountId.value === accountId) paymentAccountProfileAccountId.value = '';
    await loadPaymentAccounts();
    ElMessage.success('主账号已删除');
  } finally {
    paymentAccountDeletingIds.value = paymentAccountDeletingIds.value.filter((item) => item !== accountId);
  }
}

async function submitPaymentAccounts() {
  if (!paymentAccountTarget.value) return;
  paymentAccountSubmitting.value = true;
  try {
    // 新增模式下填写了任一资料时，底部“保存配置”会先创建并选中该主账号。
    const hasNewAccountDraft = [
      paymentAccountEditor.accountName,
      paymentAccountEditor.subjectCompanyName,
      paymentAccountEditor.contactName,
      paymentAccountEditor.contactPhone,
      paymentAccountEditor.accountNo
    ].some((value) => value.trim());
    if (isCreatingPaymentAccount.value && hasNewAccountDraft) {
      if (!(await addPaymentAccount())) return;
    }
    if (!paymentAccountSelectedIds.value.length || !paymentAccountDefaultId.value) {
      return ElMessage.warning('请至少选择一个主账号并指定默认账号');
    }
    if (paymentAccountProfileAccountId.value && !isCreatingPaymentAccount.value
      && !(await persistPaymentAccountProfile())) return;
    const incompleteAccount = selectedPaymentAccountMissingProfile();
    if (incompleteAccount) {
      return ElMessage.warning(`请先完善主账号“${incompleteAccount.accountName || '未命名主账号'}”的企业与联系人资料`);
    }
    await assignSettlementPaymentAccounts(paymentAccountTarget.value.applicationId, {
      accountIds: paymentAccountSelectedIds.value,
      defaultAccountId: paymentAccountDefaultId.value,
      allowMultipleMainAccounts: paymentAccountAllowMultiple.value
    });
    ElMessage.success('主账号设置已提交，银行确认后企业端即可选择');
    paymentAccountVisible.value = false;
  } finally {
    paymentAccountSubmitting.value = false;
  }
}

function paymentAccountStatusText(status?: string) {
  const texts: Record<string, string> = {
    SUCCESS: '正常',
    UNASSIGNED: '未绑定',
    ERROR: '异常'
  };
  return texts[String(status || '')] || '异常';
}

// 页面只保留父子账号关系三态；默认主账号与开户记录匹配才表示正常。
function paymentAccountDisplayStatus(row: SettlementPaymentAccount) {
  const status = String(row.syncStatus || '');
  if (status === 'SUCCESS') return 'SUCCESS';
  if (status === 'UNASSIGNED') return 'UNASSIGNED';
  return 'ERROR';
}

// 后端只返回已脱敏的异常；正常和未绑定状态不追加干扰信息。
function paymentAccountStatusDetail(row: SettlementPaymentAccount) {
  if (paymentAccountDisplayStatus(row) !== 'ERROR') return '';
  const message = String(row.syncMessage || '').trim();
  const code = String(row.syncCode || '').trim();
  if (message && code && !message.includes(code)) return `${message}（返回码：${code}）`;
  return message || (code ? `银行返回码：${code}` : '银行未返回明确的绑定结果');
}

function paymentAccountStatusType(status?: string): 'success' | 'warning' | 'danger' | 'info' {
  if (status === 'SUCCESS') return 'success';
  if (status === 'ERROR') return 'danger';
  return 'info';
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

.commission-rate-value {
  font-weight: 600;
}

.commission-rate-value.is-disabled {
  color: var(--el-color-primary);
  opacity: 1;
}

.rate-unit {
  margin-left: 8px;
  color: var(--el-text-color-secondary);
}

.main-account-policy {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 14px 0 10px;
  padding: 12px 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  background: var(--el-fill-color-light);
}

.policy-label {
  margin-right: 8px;
  color: var(--el-text-color-primary);
  font-weight: 600;
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

.payment-account-dialog {
  min-height: 240px;
}

.payment-account-table {
  margin-top: 16px;
}

.payment-account-status-cell {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 8px;
}

.payment-account-status-reason {
  overflow: hidden;
  min-width: 0;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.payment-account-status-reason.is-error {
  color: var(--el-color-danger);
}

.payment-account-name-cell {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
}

.payment-account-name {
  overflow: hidden;
  color: var(--el-text-color-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.payment-account-name-text {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 3px;
}

.payment-account-company {
  overflow: hidden;
  color: var(--el-text-color-regular);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.payment-account-company.is-empty {
  color: var(--el-text-color-placeholder);
}

@font-face {
  font-family: 'China Bank Logos';
  src: url('../../../assets/bank-logos/china-bank-logos.woff') format('woff');
  font-weight: normal;
  font-style: normal;
  font-display: block;
}

/* 银行品牌资源全部随前端发布，未知银行才使用统一“银”标识兜底。 */
.payment-bank-logo {
  display: inline-flex;
  flex: 0 0 28px;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid var(--el-border-color-lighter);
  background: #fff;
  color: #5b6472;
  font-family: 'China Bank Logos', sans-serif;
  font-size: 22px;
  font-weight: 400;
  line-height: 1;
  box-shadow: 0 1px 3px rgb(15 23 42 / 8%);
}

.payment-bank-logo.is-cmb,
.payment-bank-logo.is-njcb,
.payment-bank-logo.is-bccb,
.payment-bank-logo.is-icbc,
.payment-bank-logo.is-boc,
.payment-bank-logo.is-citic,
.payment-bank-logo.is-cgb,
.payment-bank-logo.is-hxb,
.payment-bank-logo.is-czb {
  color: #c9152c;
}

.payment-bank-logo.is-abc,
.payment-bank-logo.is-psbc,
.payment-bank-logo.is-cmbc,
.payment-bank-logo.is-brcb {
  color: #008b72;
}

.payment-bank-logo.is-ccb,
.payment-bank-logo.is-bocom,
.payment-bank-logo.is-spdb,
.payment-bank-logo.is-cib,
.payment-bank-logo.is-cbhb {
  color: #075aa5;
}

.payment-bank-logo.is-ceb {
  color: #69419b;
}

.payment-bank-logo.is-pingan {
  color: #ef6c00;
}

.payment-bank-logo.is-generic {
  border-color: transparent;
  background: #409eff;
  color: #fff;
  font-family: var(--el-font-family);
  font-size: 14px;
  font-weight: 700;
}

.payment-bank-logo-image {
  display: block;
  width: 22px;
  height: 22px;
  object-fit: contain;
}

.payment-account-add-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 18px;
}

.payment-account-add-form :deep(.el-form-item) {
  min-width: 0;
  margin-right: 0;
}

.payment-account-add-form :deep(.el-form-item__content),
.payment-account-add-form :deep(.el-input),
.payment-account-add-form :deep(.el-select) {
  min-width: 0;
  width: 100%;
}

.payment-account-profile-account {
  grid-column: 1 / -1;
}

.payment-account-selector-row {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 12px;
}

.payment-account-selector-row :deep(.el-select) {
  flex: 1;
}

.payment-account-add-action {
  justify-self: end;
}

@media (max-width: 1200px) {
  .material-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .memory-hint { margin-left: 0; }
  .payment-account-add-form { grid-template-columns: 1fr; }
  .payment-account-add-action { justify-self: stretch; }
}
</style>
