<template>
  <div class="p-4">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="mb-4">
      <el-col :span="6">
        <el-card
          shadow="hover"
          class="stat-mini-card stat-clickable"
          role="button"
          tabindex="0"
          @click="handleStatFilter('all')"
          @keyup.enter="handleStatFilter('all')"
          @keyup.space="handleStatFilter('all')"
        >
          <div class="stat-mini">
            <span class="label">企业总数</span>
            <span class="value">{{ statistics.totalCount || 0 }}</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card
          shadow="hover"
          class="stat-mini-card stat-clickable warning"
          role="button"
          tabindex="0"
          @click="handleStatFilter('pending')"
          @keyup.enter="handleStatFilter('pending')"
          @keyup.space="handleStatFilter('pending')"
        >
          <div class="stat-mini">
            <span class="label">待审核</span>
            <span class="value warning">{{ statistics.pendingCount || 0 }}</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card
          shadow="hover"
          class="stat-mini-card stat-clickable success"
          role="button"
          tabindex="0"
          @click="handleStatFilter('approved')"
          @keyup.enter="handleStatFilter('approved')"
          @keyup.space="handleStatFilter('approved')"
        >
          <div class="stat-mini">
            <span class="label">已认证</span>
            <span class="value success">{{ statistics.approvedCount || 0 }}</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card
          shadow="hover"
          class="stat-mini-card stat-clickable danger"
          role="button"
          tabindex="0"
          @click="handleStatFilter('disabled')"
          @keyup.enter="handleStatFilter('disabled')"
          @keyup.space="handleStatFilter('disabled')"
        >
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
        <el-card
          shadow="hover"
          class="stat-mini-card stat-clickable danger"
          role="button"
          tabindex="0"
          @click="handleStatFilter('silenced')"
          @keyup.enter="handleStatFilter('silenced')"
          @keyup.space="handleStatFilter('silenced')"
        >
          <div class="stat-mini">
            <span class="label">被禁言企业</span>
            <span class="value danger">{{ statistics.silencedCount || 0 }}</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 查询表单 -->
    <el-card shadow="hover" class="mb-4">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true" class="company-query-form">
        <el-form-item label="企业编码" prop="companyNo">
          <el-input v-model="queryParams.companyNo" placeholder="请输入企业编码" clearable style="width: 180px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="企业名称" prop="companyName">
          <el-input v-model="queryParams.companyName" placeholder="请输入企业名称" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item v-show="showMoreQuery" label="企业描述" prop="description">
          <el-input v-model="queryParams.description" placeholder="请输入描述关键词" clearable style="width: 180px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="联系人" prop="contactPerson">
          <el-input v-model="queryParams.contactPerson" placeholder="请输入联系人" clearable style="width: 150px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="联系电话" prop="contactPhone">
          <el-input v-model="queryParams.contactPhone" placeholder="请输入联系电话" clearable style="width: 170px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 150px">
            <el-option label="待审核" value="0" />
            <el-option label="已认证" value="1" />
            <el-option label="已禁用" value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="数据状态" prop="deleted">
          <el-select v-model="queryParams.deleted" placeholder="全部" style="width: 140px" @change="handleQuery">
            <el-option label="正常" value="0" />
            <el-option label="已删除" value="1" />
          </el-select>
        </el-form-item>
        <el-form-item label="禁言状态" prop="isSilenced">
          <el-select v-model="queryParams.isSilenced" placeholder="全部" clearable style="width: 150px">
            <el-option label="正常" value="0" />
            <el-option label="已禁言" value="1" />
          </el-select>
        </el-form-item>
        <el-form-item v-show="showMoreQuery" label="职位数" prop="jobCount">
          <el-input-number
            v-model="queryParams.jobCount"
            :min="0"
            :precision="0"
            controls-position="right"
            placeholder="职位数"
            style="width: 130px"
          />
        </el-form-item>
        <el-form-item v-show="showMoreQuery" label="投递数" prop="applyCount">
          <el-input-number
            v-model="queryParams.applyCount"
            :min="0"
            :precision="0"
            controls-position="right"
            placeholder="投递数"
            style="width: 130px"
          />
        </el-form-item>
        <el-form-item v-show="showMoreQuery" label="已反馈" prop="feedbackCount">
          <el-input-number
            v-model="queryParams.feedbackCount"
            :min="0"
            :precision="0"
            controls-position="right"
            placeholder="已反馈"
            style="width: 130px"
          />
        </el-form-item>
        <el-form-item v-show="showMoreQuery" label="未反馈" prop="noFeedbackCount">
          <el-input-number
            v-model="queryParams.noFeedbackCount"
            :min="0"
            :precision="0"
            controls-position="right"
            placeholder="未反馈"
            style="width: 130px"
          />
        </el-form-item>
        <el-form-item v-show="showMoreQuery" label="注册时间">
          <el-date-picker
            v-model="dateRange"
            value-format="YYYY-MM-DD"
            type="daterange"
            range-separator="-"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
          <el-button link type="primary" @click="showMoreQuery = !showMoreQuery">{{ showMoreQuery ? '收起' : '更多条件' }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据表格 -->
    <el-card shadow="hover">
      <template #header>
        <el-row :gutter="10">
          <el-col :span="1.5">
            <el-button type="primary" plain icon="Plus" @click="add">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="primary" plain icon="Refresh" @click="loadData">刷新</el-button>
          </el-col>
          <el-col :span="1.5">
            <!-- 批量删除：未勾选时点击给出提示，勾选后按所选 companyId 批量删除 -->
            <el-button v-if="queryParams.deleted !== '1'" type="danger" plain icon="Delete" @click="handleBatchDelete">删除</el-button>
            <el-button v-else type="success" plain icon="RefreshLeft" @click="handleBatchRestore">恢复</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Download" @click="handleExport">导出</el-button>
          </el-col>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="tableData" border stripe @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column label="企业编码" prop="companyNo" width="180" align="center" show-overflow-tooltip>
          <template #default="{ row }">{{ row.companyNo || '-' }}</template>
        </el-table-column>
        <el-table-column label="企业信息" min-width="200">
          <template #default="{ row }">
            <div class="company-info">
              <el-avatar v-if="row.logoUrl" :src="row.logoUrl" :size="40" />
              <el-avatar v-else :size="40" style="background: #409eff">
                {{ row.companyName?.charAt(0) }}
              </el-avatar>
              <div class="company-detail">
                <div class="name">
                  {{ row.companyName }}
                  <el-tag v-if="row.deleted === '1'" type="info" size="small" effect="plain">已删除</el-tag>
                </div>
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
            <el-tag type="info" class="count-clickable" @click="openJobDialog(row)">{{ row.jobCount || 0 }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="投递数" prop="applyCount" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="success" class="count-clickable" @click="openApplyDialog(row)">{{ row.applyCount || 0 }}</el-tag>
          </template>
        </el-table-column>
        <!-- 已反馈：企业已处理的投递(面试邀请/已录用/已拒绝)；未反馈：仅已投递、企业尚未处理。后端聚合返回，无额外查询。
             点击数字弹框查看对应投递人员列表。 -->
        <el-table-column label="已反馈" prop="feedbackCount" width="90" align="center">
          <template #default="{ row }">
            <el-tag type="warning" class="count-clickable" @click="openApplyDialog(row, '1')">{{ row.feedbackCount || 0 }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="未反馈" prop="noFeedbackCount" width="90" align="center">
          <template #default="{ row }">
            <el-tag type="info" class="count-clickable" @click="openApplyDialog(row, '0')">{{ row.noFeedbackCount || 0 }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="认证状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="companyAuditStatusMeta(row).type">{{ companyAuditStatusMeta(row).label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="数据状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.deleted === '1'" type="info">已删除</el-tag>
            <el-tag v-else type="success">正常</el-tag>
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
            <div style="display: flex; align-items: center; justify-content: center; gap: 8px">
              <template v-if="row.deleted === '1'">
                <el-button link type="primary" icon="View" @click="handleDetail(row)">详情</el-button>
                <el-button link type="success" icon="RefreshLeft" @click="handleRestore(row)">恢复</el-button>
              </template>
              <template v-else>
                <el-button link type="primary" icon="View" @click="handleDetail(row)">详情</el-button>
                <el-button link type="primary" icon="Edit" @click="handleEdit(row)">编辑</el-button>
                <el-dropdown trigger="click">
                  <span class="el-dropdown-link">
                    <el-button link type="primary"
                      >管理<el-icon class="el-icon--right"><arrow-down /></el-icon
                    ></el-button>
                  </span>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <!-- 人员：已认证企业的人员管理入口，置于菜单最上方（行为待接，后端接口待补） -->
                      <el-dropdown-item v-if="row.status === '1'" icon="User" @click="handleStaff(row)">人员</el-dropdown-item>
                      <el-dropdown-item v-if="row.status === '0'" icon="CircleCheck" @click="handleAudit(row, '1')">审核通过</el-dropdown-item>
                      <el-dropdown-item v-if="row.status === '0'" icon="Close" @click="handleAudit(row, '2')">审核拒绝</el-dropdown-item>
                      <el-dropdown-item v-if="hasPendingSettlementIntent(row)" icon="Phone" @click="handleSettlementContacted(row)">
                        标记已联系
                      </el-dropdown-item>
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
              </template>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="loadData" />
    </el-card>

    <!-- 企业详情对话框：主体信息 + 资质图片 + 历史审核记录 -->
    <el-dialog v-model="detailVisible" title="企业详情" width="820px" append-to-body>
      <div v-if="currentCompany">
        <!-- 主体信息 -->
        <el-descriptions title="主体信息" :column="2" border>
          <el-descriptions-item label="企业编码">{{ currentCompany.companyNo || '-' }}</el-descriptions-item>
          <el-descriptions-item label="企业状态">
            <el-tag :type="companyAuditStatusMeta(currentCompany).type">{{ companyAuditStatusMeta(currentCompany).label }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="数据状态">
            <el-tag v-if="currentCompany.deleted === '1'" type="info">已删除</el-tag>
            <el-tag v-else type="success">正常</el-tag>
          </el-descriptions-item>
          <el-descriptions-item v-if="currentCompany.deleted === '1'" label="删除时间">{{ currentCompany.deletedTime || '-' }}</el-descriptions-item>
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

        <!-- 资质材料：图片可预览；招聘授权书支持图片预览或 PDF 打开。 -->
        <div class="section-title">资质材料</div>
        <div v-loading="certLoading" class="cert-images">
          <div v-for="group in certGroups" :key="group.label" class="cert-item">
            <div class="cert-label">{{ group.label }}</div>
            <div v-if="group.files.length" class="cert-img-row">
              <template v-for="(file, idx) in group.files" :key="file.ossId || file.url || idx">
                <el-image
                  v-if="file.kind === 'image'"
                  :src="file.url"
                  :preview-src-list="group.files.filter((f) => f.kind === 'image').map((f) => f.url)"
                  :initial-index="idx"
                  :preview-teleported="true"
                  fit="cover"
                  class="cert-img"
                />
                <div v-else class="cert-doc-card">
                  <el-icon><Document /></el-icon>
                  <span>{{ file.name || '招聘授权书.pdf' }}</span>
                  <el-button link type="primary" @click="openUrl(file.url)">打开</el-button>
                </div>
              </template>
            </div>
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
              <!-- 认证材料：图片可预览；招聘授权书支持图片预览或 PDF 打开。 -->
              <div class="cert-images cert-images-wrap">
                <div v-for="group in certImageList(cert)" :key="group.label" class="cert-item">
                  <div class="cert-label">{{ group.label }}</div>
                  <div class="cert-img-row">
                    <el-image
                      v-for="(url, index) in group.urls"
                      :key="group.label + index"
                      :src="url"
                      :preview-src-list="certPreviewList(cert)"
                      :initial-index="group.startIndex + index"
                      :preview-teleported="true"
                      fit="cover"
                      class="cert-img cert-img-sm"
                    />
                  </div>
                </div>
                <div v-if="certAuthLetterFiles(cert).length" class="cert-item">
                  <div class="cert-label">招聘授权书</div>
                  <div class="cert-img-row">
                    <template v-for="file in certAuthLetterFiles(cert)" :key="file.ossId || file.url">
                      <el-image
                        v-if="file.kind === 'image'"
                        :src="file.url"
                        :preview-src-list="
                          certAuthLetterFiles(cert)
                            .filter((f) => f.kind === 'image')
                            .map((f) => f.url)
                        "
                        :preview-teleported="true"
                        fit="cover"
                        class="cert-img cert-img-sm"
                      />
                      <div v-else class="cert-doc-card cert-doc-card-sm">
                        <el-icon><Document /></el-icon>
                        <span>{{ file.name || '招聘授权书.pdf' }}</span>
                        <el-button link type="primary" @click="openUrl(file.url)">打开</el-button>
                      </div>
                    </template>
                  </div>
                </div>
                <div v-if="certImageList(cert).length === 0 && certAuthLetterFiles(cert).length === 0" class="cert-empty">未上传认证材料</div>
              </div>
            </el-card>
          </el-tab-pane>
        </el-tabs>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 企业编辑对话框：主体信息 + 资质图片（视觉风格与"企业详情"对齐：分区标题 + 边框分组） -->
    <el-dialog v-model="editVisible" title="企业编辑" width="820px" append-to-body>
      <!-- scroll-to-error：校验失败时自动滚动到首个出错字段，避免错误提示滚出视野后点提交"无反应" -->
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" scroll-to-error>
        <!-- 主体信息：与详情弹窗一致的蓝条分区标题 + 边框分组容器 -->
        <div class="section-title">主体信息</div>
        <div class="edit-block">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="公司全称" prop="companyName">
                <el-input v-model="form.companyName" placeholder="与营业执照一致" maxlength="20"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="信用代码" prop="socialCreditCode">
                <el-input v-model="form.socialCreditCode" placeholder="统一社会信用代码" maxlength="60"></el-input>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="法人姓名" prop="contactPerson">
                <el-input v-model="form.contactPerson" placeholder="法定代表人姓名" maxlength="10"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="法人电话" prop="contactPhone">
                <el-input
                  v-model="form.contactPhone"
                  placeholder="法定代表人电话"
                  maxlength="11"
                  @input="form.contactPhone = form.contactPhone.replace(/[^\d]/g, '')"
                ></el-input>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <!-- 超管手机号：企业超级管理员账号的登录手机号；不填时后端回退用法人电话开通账号 -->
              <el-form-item label="超管手机号" prop="adminPhone">
                <el-input
                  v-model="form.adminPhone"
                  placeholder="企业超级管理员手机号，空则用法人电话"
                  maxlength="11"
                  @input="form.adminPhone = (form.adminPhone || '').replace(/[^\d]/g, '')"
                ></el-input>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="注册地址" prop="registeredAddress">
                <el-input
                  type="textarea"
                  show-word-limit
                  :autosize="{ minRows: 3, maxRows: 6 }"
                  v-model="form.registeredAddress"
                  placeholder="企业注册登记地址"
                  maxlength="150"
                ></el-input>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="办公地址" prop="creditCode">
                <el-input
                  type="textarea"
                  show-word-limit
                  :autosize="{ minRows: 3, maxRows: 6 }"
                  v-model="form.companyAddress"
                  placeholder="与注册地址不符时填写"
                  maxlength="150"
                ></el-input>
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <!-- 资质材料：普通材料用 imageUpload；招聘授权书允许 PDF 或图片单文件。 -->
        <div class="section-title">资质材料</div>
        <div class="edit-block">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="营业执照正负本">
                <imageUpload v-model="form.businessLicense" :limit="1" @update:modelValue="handleOssChange" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="法人身份证附件">
                <imageUpload v-model="form.idCardPhotoIds" :limit="2" @update:modelValue="handleOssIdCarPhotoChange" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="对公账户凭证">
                <imageUpload v-model="form.bankAccountIds" :limit="1" @update:modelValue="handleOssBankAccountIdsChange" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="办公场地实景">
                <imageUpload v-model="form.companyAddressIds" @update:modelValue="handleOssCompanyAddressIdsChange" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="企业logo">
                <imageUpload v-model="form.logoUrl" :limit="1" @update:modelValue="handleOsslogoUrlChange" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="招聘授权书">
                <file-upload
                  v-model="form.recruitmentAuthorizationIds"
                  :limit="1"
                  :file-size="10"
                  :file-type="['pdf', 'jpg', 'jpeg', 'png', 'bmp', 'webp', 'gif']"
                  upload-url="/api/company/upload"
                  @update:modelValue="handleOssRecruitmentAuthorizationIdsChange"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </div>
      </el-form>
      <template #footer>
        <!-- 提交中：当前操作按钮转圈，其余按钮禁用，防止重复/交叉提交 -->
        <el-button
          v-if="form.status && form.status !== '4'"
          type="primary"
          :loading="editSubmitting === 'save'"
          :disabled="!!editSubmitting && editSubmitting !== 'save'"
          @click="handleSave"
          >保存</el-button
        >
        <!-- 存草稿仅限"新增（尚无状态）/ 草稿(4)"：已进入审核流（待审核/已认证/驳回）的企业不允许再回退为草稿 -->
        <el-button
          v-if="!form.status || form.status === '4'"
          type="primary"
          :loading="editSubmitting === 'draft'"
          :disabled="!!editSubmitting && editSubmitting !== 'draft'"
          @click="handleDraft"
          >存草稿</el-button
        >
        <el-button
          v-if="form.status !== '1'"
          type="primary"
          :loading="editSubmitting === 'submit'"
          :disabled="!!editSubmitting && editSubmitting !== 'submit'"
          @click="submit"
          >提交</el-button
        >
        <!-- 待审核(0)：运营可在编辑弹窗内直接发起审核，复用「企业审核」对话框（通过/驳回），不改保存/提交逻辑 -->
        <el-button v-if="form.status === '0'" type="success" :disabled="!!editSubmitting" @click="handleAuditFromEdit('1')">审核通过</el-button>
        <el-button v-if="form.status === '0'" type="danger" :disabled="!!editSubmitting" @click="handleAuditFromEdit('2')">审核拒绝</el-button>
        <el-button :disabled="!!editSubmitting" @click="editVisible = false">取消</el-button>
      </template>
    </el-dialog>

    <!-- 审核对话框：通过走 /company/audit（置已认证并生成企业编号、回写资质=已通过）；
         驳回走 /company/rejectCert（资质=已驳回+原因，企业回到待重新提交态） -->
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

    <!-- 人员管理弹窗：iframe 内嵌系统用户管理页(/system/user)，destroy-on-close 保证每次打开为最新状态 -->
    <el-dialog v-model="staffVisible" :title="staffTitle" width="90%" top="5vh" append-to-body destroy-on-close>
      <iframe v-if="staffUrl" :src="staffUrl" class="staff-iframe" frameborder="0"></iframe>
    </el-dialog>

    <!-- 职位列表弹窗：点击企业行「职位数」，按 companyId 分页查询该企业岗位 -->
    <el-dialog v-model="jobVisible" :title="jobTitle" width="960px" append-to-body destroy-on-close>
      <el-table v-loading="jobLoading" :data="jobList" border stripe>
        <el-table-column label="岗位编码" prop="jobNo" width="160" align="center" show-overflow-tooltip>
          <template #default="{ row }">{{ row.jobNo || '-' }}</template>
        </el-table-column>
        <el-table-column label="岗位名称" prop="jobName" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">{{ row.jobName || '-' }}</template>
        </el-table-column>
        <el-table-column label="用工性质" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="jobTypeMeta(row.jobType).type">{{ row.jobTypeName || jobTypeMeta(row.jobType).label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="薪资" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">{{ formatSalary(row.salaryMin, row.salaryMax, row.salaryUnit) }}</template>
        </el-table-column>
        <el-table-column label="工作地点" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">{{ row.workAddress || '-' }}</template>
        </el-table-column>
        <el-table-column label="投递数" prop="applyCount" width="90" align="center">
          <template #default="{ row }">{{ row.applyCount || 0 }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="jobStatusMeta(row.status).type">{{ row.statusName || jobStatusMeta(row.status).label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="发布时间" prop="publishTime" width="170" align="center">
          <template #default="{ row }">{{ row.publishTime || row.createTime || '-' }}</template>
        </el-table-column>
      </el-table>
      <pagination
        v-show="jobTotal > 0"
        v-model:page="jobQuery.pageNum"
        v-model:limit="jobQuery.pageSize"
        :total="jobTotal"
        @pagination="loadJobList"
      />
    </el-dialog>

    <!-- 投递人员弹窗：点击「已反馈/未反馈」数字，按企业 + 反馈口径分页查看投递人员列表；点击行查看求职者详情 -->
    <el-dialog v-model="applyVisible" :title="applyTitle" width="900px" append-to-body destroy-on-close>
      <div class="apply-tip">点击任意行可查看投递全景详情</div>
      <el-table v-loading="applyLoading" :data="applyList" border stripe row-class-name="row-clickable" @row-click="openApplyDetail">
        <el-table-column label="求职者" prop="userName" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">{{ row.userName || row.realName || '-' }}</template>
        </el-table-column>
        <el-table-column label="联系电话" prop="phone" width="140" align="center">
          <template #default="{ row }">{{ row.phone || '-' }}</template>
        </el-table-column>
        <el-table-column label="应聘职位" prop="jobName" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">{{ row.jobName || '-' }}</template>
        </el-table-column>
        <el-table-column label="投递状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="applyStatusMeta(row.status).type">{{ applyStatusMeta(row.status).label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="投递时间" prop="applyTime" width="170" align="center">
          <template #default="{ row }">{{ row.applyTime || row.createTime || '-' }}</template>
        </el-table-column>
      </el-table>
      <pagination
        v-show="applyTotal > 0"
        v-model:page="applyQuery.pageNum"
        v-model:limit="applyQuery.pageSize"
        :total="applyTotal"
        @pagination="loadApplyList"
      />
    </el-dialog>

    <el-drawer
      v-model="chainDrawerVisible"
      :title="chainDrawerTitle"
      direction="rtl"
      size="min(760px, 92vw)"
      append-to-body
      class="company-chain-drawer"
    >
      <div v-loading="chainLoading" class="company-chain-body">
        <el-empty v-if="!chainCascade.company && !chainLoading" description="暂无链路线索" />
        <template v-else-if="chainCascade.company">
          <div class="company-chain-summary">
            <div>
              <div class="summary-title">{{ chainCascade.company.companyName || '-' }}</div>
              <div class="summary-subtitle">{{ chainCascade.company.companyNo || chainCascade.company.companyId || '-' }}</div>
            </div>
            <el-tag v-if="chainCascade.ledgers.length" type="success" effect="plain">已形成台账</el-tag>
            <el-tag v-else type="warning" effect="plain">线索跟进中</el-tag>
          </div>

          <div class="company-chain-flow">
            <template v-for="(step, index) in companyChainSteps" :key="step.kind">
              <button
                type="button"
                class="company-chain-node"
                :class="{ active: chainActiveNode === step.kind }"
                @click="handleChainStepClick(step.kind)"
              >
                <span class="chain-node-dot"></span>
                <span class="chain-node-label">{{ step.label }}</span>
                <span class="chain-node-code">{{ step.code }}</span>
                <span v-if="step.desc" class="chain-node-desc">{{ step.desc }}</span>
              </button>
              <span v-if="index < companyChainSteps.length - 1" class="company-chain-arrow"></span>
            </template>
          </div>

          <el-divider />

          <el-skeleton v-if="chainDetailLoading" :rows="6" animated />
          <div v-else class="company-chain-detail">
            <div class="chain-detail-title">{{ activeChainTitle }}</div>
            <el-descriptions v-if="chainActiveNode === 'company'" :column="2" border>
              <el-descriptions-item label="企业ID">{{ chainCascade.company.companyId || '-' }}</el-descriptions-item>
              <el-descriptions-item label="企业编码">{{ chainCascade.company.companyNo || '-' }}</el-descriptions-item>
              <el-descriptions-item label="企业名称">{{ chainCascade.company.companyName || '-' }}</el-descriptions-item>
              <el-descriptions-item label="联系人">{{ chainCascade.company.contactPerson || '-' }}</el-descriptions-item>
              <el-descriptions-item label="联系电话">{{ chainCascade.company.contactPhone || '-' }}</el-descriptions-item>
              <el-descriptions-item label="创建时间">{{ chainCascade.company.createTime || '-' }}</el-descriptions-item>
              <el-descriptions-item label="备注" :span="2">{{ chainCascade.company.remark || '-' }}</el-descriptions-item>
            </el-descriptions>

            <el-table v-else-if="chainActiveNode === 'job'" :data="chainCascade.jobs" border height="360" @row-click="selectChainJob">
              <el-table-column prop="jobId" label="岗位ID" width="170" show-overflow-tooltip />
              <el-table-column prop="jobName" label="岗位名称" min-width="180" show-overflow-tooltip />
              <el-table-column label="用工性质" width="110">
                <template #default="{ row }">{{ jobTypeMeta(row.jobType).label }}</template>
              </el-table-column>
              <el-table-column label="薪资" width="130">
                <template #default="{ row }">{{ formatChainSalary(row) }}</template>
              </el-table-column>
              <el-table-column label="状态" width="100">
                <template #default="{ row }">{{ row.statusName || jobStatusMeta(row.status).label }}</template>
              </el-table-column>
            </el-table>

            <el-table v-else-if="chainActiveNode === 'apply'" :data="chainCascade.applies" border height="360" @row-click="selectChainApply">
              <el-table-column prop="applyId" label="投递ID" width="170" show-overflow-tooltip />
              <el-table-column prop="userName" label="求职人" width="130" show-overflow-tooltip />
              <el-table-column prop="phone" label="手机号" width="140" show-overflow-tooltip />
              <el-table-column label="状态" width="110">
                <template #default="{ row }">{{ row.statusName || applyStatusMeta(row.status).label }}</template>
              </el-table-column>
              <el-table-column prop="applyTime" label="投递时间" min-width="160" show-overflow-tooltip />
            </el-table>

            <el-table v-else-if="chainActiveNode === 'user'" :data="chainCascade.users" border height="360" @row-click="selectChainUser">
              <el-table-column prop="userId" label="求职人ID" width="170" show-overflow-tooltip />
              <el-table-column prop="userName" label="姓名" min-width="160" show-overflow-tooltip />
              <el-table-column prop="phone" label="手机号" width="150" show-overflow-tooltip />
              <el-table-column prop="applyCount" label="投递数" width="100" />
            </el-table>

            <el-table v-else-if="chainActiveNode === 'task'" :data="chainCascade.tasks" border height="360" @row-click="selectChainTask">
              <el-table-column prop="taskId" label="履约ID" width="170" show-overflow-tooltip />
              <el-table-column prop="workerName" label="求职人" width="130" show-overflow-tooltip />
              <el-table-column prop="jobName" label="岗位" min-width="170" show-overflow-tooltip />
              <el-table-column prop="statusName" label="状态" width="110" show-overflow-tooltip />
              <el-table-column label="结算金额" width="120">
                <template #default="{ row }">{{ row.settleAmount != null ? `¥${formatMoney(row.settleAmount)}` : '-' }}</template>
              </el-table-column>
            </el-table>

            <el-table
              v-else-if="chainActiveNode === 'ledger'"
              :data="chainCascade.ledgers"
              border
              height="360"
              @row-click="(row) => (chainCascade.selectedLedger = row)"
            >
              <el-table-column prop="ledgerId" label="台账ID" width="170" show-overflow-tooltip />
              <el-table-column prop="orderNo" label="台账编号" min-width="180" show-overflow-tooltip />
              <el-table-column label="金额" width="120">
                <template #default="{ row }">¥{{ formatMoney(row.amount) }}</template>
              </el-table-column>
              <el-table-column label="结算状态" width="110">
                <template #default="{ row }">{{ ledgerStatusMeta(row.status).label }}</template>
              </el-table-column>
              <el-table-column label="发票状态" width="110">
                <template #default="{ row }">{{ ledgerInvoiceStatusMeta(row.invoiceStatus).label }}</template>
              </el-table-column>
            </el-table>

            <el-empty v-else description="暂无详情" />
          </div>
        </template>
      </div>
    </el-drawer>

    <!-- 投递全景详情弹窗（复用组件）：点击投递行后按 applyId 加载完整详情 -->
    <ApplyDetailDialog ref="applyDetailRef" />
  </div>
</template>

<script setup name="CompanyManagement" lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox, type FormRules } from 'element-plus';
import { Document } from '@element-plus/icons-vue';
import {
  listCompany,
  getCompanyStatistics,
  getCompany,
  getCompanyAuditHistory,
  auditCompany,
  changeCompanyStatus,
  rejectCompanyCert,
  silenceCompany,
  unsilenceCompany,
  listJob,
  listTask,
  listLedger,
  type CompanyAuditHistoryVO,
  type CompanyCertVO,
  type JobVO,
  addOrUpdate,
  delCompany,
  restoreCompany,
  listApply
} from '@/api/recruitment';
import ApplyDetailDialog from './components/ApplyDetailDialog.vue';
import { download } from '@/utils/request';
import { listByIds } from '@/api/system/oss';
import { unwrapList, splitToArray, formatSalary, formatMoney } from './helpers';
import {
  companyStatusMeta,
  certStatusMeta,
  applyStatusMeta,
  jobStatusMeta,
  jobTypeMeta,
  ledgerStatusMeta,
  ledgerInvoiceStatusMeta
} from './constants';
import { UserForm } from '@/api/system/user/types';
import { updateUserProfile } from '@/api/system/user';
import { RoleVO } from '@/api/system/role/types';

const router = useRouter();
const route = useRoute();

interface CertMaterialFile {
  kind: 'image' | 'doc';
  url: string;
  name?: string;
  ossId?: string;
  suffix?: string;
}

type ChainNodeKind = 'company' | 'job' | 'user' | 'apply' | 'task' | 'ledger';

interface CompanyChainStep {
  kind: ChainNodeKind;
  label: string;
  code?: string;
  desc?: string;
}

interface ChainUserItem {
  userId?: number;
  userName?: string;
  phone?: string;
  applyCount: number;
}

const loading = ref(false);
const total = ref(0);
const tableData = ref<any[]>([]);
const detailVisible = ref(false);
const editVisible = ref(false);
const auditVisible = ref(false);
const silenceVisible = ref(false);
const currentCompany = ref<any>(null);
// 表格多选：勾选行的 companyId 集合，驱动批量删除按钮的可用态与删除请求
const selectedIds = ref<number[]>([]);
// 人员管理弹窗：iframe 内嵌 /system/user
const staffVisible = ref(false);
const staffUrl = ref('');
const staffTitle = ref('人员管理');

// 职位列表弹窗：点击企业行「职位数」后，按 companyId 调用岗位列表接口分页展示
const jobVisible = ref(false);
const jobTitle = ref('');
const jobLoading = ref(false);
const jobList = ref<JobVO[]>([]);
const jobTotal = ref(0);
const jobQuery = reactive({ pageNum: 1, pageSize: 10, companyId: undefined as number | undefined });

// 详情弹窗「资质材料」：company 表存 OSS id；授权书按后缀区分图片预览或 PDF 文档打开。
const certLoading = ref(false);
const certGroups = ref<{ label: string; files: CertMaterialFile[] }[]>([]);

// 投递人员弹窗：点击「已反馈/未反馈」按企业 + 反馈口径分页查看
const applyVisible = ref(false);
const applyTitle = ref('');
const applyLoading = ref(false);
const applyList = ref<any[]>([]);
const applyTotal = ref(0);
const applyQuery = reactive({ pageNum: 1, pageSize: 10, companyId: undefined as number | undefined, feedback: '' });

const chainDrawerVisible = ref(false);
const chainDrawerTitle = ref('线索链路');
const chainLoading = ref(false);
const chainDetailLoading = ref(false);
const chainActiveNode = ref<ChainNodeKind>('company');
const chainCascade = reactive<{
  company: any | null;
  jobs: any[];
  applies: any[];
  users: ChainUserItem[];
  tasks: any[];
  ledgers: any[];
  selectedJob: any | null;
  selectedApply: any | null;
  selectedUser: ChainUserItem | null;
  selectedTask: any | null;
  selectedLedger: any | null;
}>({
  company: null,
  jobs: [],
  applies: [],
  users: [],
  tasks: [],
  ledgers: [],
  selectedJob: null,
  selectedApply: null,
  selectedUser: null,
  selectedTask: null,
  selectedLedger: null
});

// 投递全景详情弹窗组件引用：点击投递行 → open(applyId)
const applyDetailRef = ref<InstanceType<typeof ApplyDetailDialog>>();
const queryFormRef = ref();
const auditFormRef = ref();
const silenceFormRef = ref();
const formRef = ref();
const dateRange = ref<[string, string] | []>([]);
const showMoreQuery = ref(false);

const form = ref<Partial<UserForm>>({});

const rules = reactive({
  companyName: [{ required: true, message: '请输入公司全称', trigger: 'blur' }],
  socialCreditCode: [
    { required: true, message: '请输入信用代码', trigger: 'blur' },
    { pattern: /^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/, message: '请输入正确的18位统一社会信用代码', trigger: 'blur' }
  ],
  contactPhone: [
    { required: true, message: '请输入法定代表人电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的11位手机号', trigger: 'blur' }
  ],
  contactPerson: [{ required: true, message: '请输入法人姓名', trigger: 'blur' }],
  registeredAddress: [{ required: true, message: '请输入注册地址', trigger: 'blur' }],
  // 超管手机号：选填；填了必须是 11 位手机号（空值放行，不能直接用 pattern——async-validator 对空串也会跑 pattern）
  adminPhone: [
    {
      validator: (_rule: any, value: string, callback: (err?: Error) => void) => {
        if (!value || /^1[3-9]\d{9}$/.test(value)) {
          callback();
        } else {
          callback(new Error('请输入正确的11位手机号'));
        }
      },
      trigger: 'blur'
    }
  ]
});

// 审核提交中标志，防止重复提交（通过/驳回均复用）
const auditSubmitting = ref(false);

// 企业编辑弹窗提交中状态：'' 空闲 / save 保存 / draft 存草稿 / submit 提交。
// 驱动对应按钮的 loading 等待动画，其余按钮（含取消）禁用，防止请求期间重复或交叉操作。
const editSubmitting = ref<'' | 'save' | 'draft' | 'submit'>('');

// ===== 历史审核记录（详情弹窗）=====
// 数据来源：getCompanyAuditHistory → CompanyAuditHistoryVO，聚合 rec_audit_log 与 company_cert。
const historyTab = ref('logs');
const historyLoading = ref(false);
const auditHistory = ref<CompanyAuditHistoryVO>({ auditLogs: [], certHistory: [] });

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  companyNo: '',
  companyName: '',
  description: '',
  contactPerson: '',
  contactPhone: '',
  status: '',
  // deleted 是企业业务归档筛选；默认只展示正常企业，切到已删除时作为恢复列表使用。
  deleted: '0',
  isSilenced: '',
  jobCount: undefined as number | undefined,
  applyCount: undefined as number | undefined,
  feedbackCount: undefined as number | undefined,
  noFeedbackCount: undefined as number | undefined
});

const statistics = reactive({
  totalCount: 0,
  pendingCount: 0,
  approvedCount: 0,
  disabledCount: 0,
  silencedCount: 0
});

const auditForm = reactive({
  companyId: 0,
  companyName: '',
  status: '1',
  remark: ''
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
      trigger: 'blur'
    }
  ]
});

const silenceForm = reactive({
  companyId: 0,
  companyName: '',
  reason: ''
});

const companyChainSteps = computed<CompanyChainStep[]>(() => {
  const company = chainCascade.company;
  if (!company) return [];
  return [
    { kind: 'company', label: '企业', code: company.companyNo || String(company.companyId || '-'), desc: company.companyName },
    { kind: 'job', label: '岗位', code: `${chainCascade.jobs.length} 条`, desc: chainCascade.selectedJob?.jobName },
    { kind: 'apply', label: '投递', code: `${chainCascade.applies.length} 条`, desc: chainCascade.selectedApply?.userName },
    { kind: 'user', label: '求职人', code: `${chainCascade.users.length} 人`, desc: chainCascade.selectedUser?.userName },
    {
      kind: 'task',
      label: '履约',
      code: `${chainCascade.tasks.length} 条`,
      desc: chainCascade.selectedTask?.statusName || chainCascade.selectedTask?.status
    },
    { kind: 'ledger', label: '台账', code: `${chainCascade.ledgers.length} 条`, desc: chainCascade.selectedLedger?.orderNo }
  ];
});

const activeChainTitle = computed(() => companyChainSteps.value.find((step) => step.kind === chainActiveNode.value)?.label || '链路详情');

function resetCompanyChainCascade() {
  chainActiveNode.value = 'company';
  chainCascade.company = null;
  chainCascade.jobs = [];
  chainCascade.applies = [];
  chainCascade.users = [];
  chainCascade.tasks = [];
  chainCascade.ledgers = [];
  chainCascade.selectedJob = null;
  chainCascade.selectedApply = null;
  chainCascade.selectedUser = null;
  chainCascade.selectedTask = null;
  chainCascade.selectedLedger = null;
}

function formatChainSalary(job: any) {
  if (!job) return '-';
  if (job.salary) return job.salary;
  return formatSalary(job.salaryMin, job.salaryMax, job.salaryUnit);
}

function buildChainUsers(applies: any[]): ChainUserItem[] {
  const map = new Map<number, ChainUserItem>();
  for (const item of applies) {
    if (item?.userId == null) continue;
    const userId = Number(item.userId);
    const existing = map.get(userId);
    if (existing) {
      existing.applyCount += 1;
      continue;
    }
    map.set(userId, {
      userId,
      userName: item.userName || item.realName || item.nickName || '-',
      phone: item.phone || item.jobSeekerContact || '',
      applyCount: 1
    });
  }
  return Array.from(map.values());
}

function clearChainAfter(level: ChainNodeKind) {
  if (level === 'company') {
    chainCascade.jobs = [];
    chainCascade.selectedJob = null;
  }
  if (['company', 'job'].includes(level)) {
    chainCascade.applies = [];
    chainCascade.users = [];
    chainCascade.selectedApply = null;
    chainCascade.selectedUser = null;
  }
  if (['company', 'job', 'apply', 'user'].includes(level)) {
    chainCascade.tasks = [];
    chainCascade.selectedTask = null;
  }
  if (['company', 'job', 'apply', 'user', 'task'].includes(level)) {
    chainCascade.ledgers = [];
    chainCascade.selectedLedger = null;
  }
}

async function loadChainJobs(companyId: number | string, preferredJobId?: number | string, preferredJobName?: string) {
  chainDetailLoading.value = true;
  try {
    const res = await listJob({ pageNum: 1, pageSize: 100, companyId });
    chainCascade.jobs = unwrapList(res).rows;
    const preferred = preferredJobId
      ? chainCascade.jobs.find((job) => String(job.jobId || '') === String(preferredJobId))
      : preferredJobName
        ? chainCascade.jobs.find((job) => String(job.jobName || '') === String(preferredJobName))
        : null;
    const firstJob = preferred || chainCascade.jobs[0] || null;
    if (firstJob) {
      await selectChainJob(firstJob, true);
    } else {
      chainActiveNode.value = 'job';
    }
  } finally {
    chainDetailLoading.value = false;
  }
}

async function selectChainJob(row: any, keepNode = false) {
  if (!row?.jobId || !chainCascade.company?.companyId) return;
  chainCascade.selectedJob = row;
  clearChainAfter('job');
  chainDetailLoading.value = true;
  try {
    const res = await listApply({ pageNum: 1, pageSize: 100, companyId: chainCascade.company.companyId, jobId: row.jobId });
    chainCascade.applies = unwrapList(res).rows;
    chainCascade.users = buildChainUsers(chainCascade.applies);
    if (chainCascade.applies[0]) {
      await selectChainApply(chainCascade.applies[0], true);
    }
    chainActiveNode.value = keepNode ? 'job' : 'apply';
  } finally {
    chainDetailLoading.value = false;
  }
}

async function selectChainApply(row: any, keepNode = false) {
  if (!row?.applyId || !chainCascade.company?.companyId) return;
  chainCascade.selectedApply = row;
  chainCascade.selectedUser = chainCascade.users.find((user) => Number(user.userId) === Number(row.userId)) || null;
  clearChainAfter('apply');
  chainDetailLoading.value = true;
  try {
    const res = await listTask({ pageNum: 1, pageSize: 100, companyId: chainCascade.company.companyId, jobId: row.jobId, applyId: row.applyId });
    chainCascade.tasks = unwrapList(res).rows;
    if (chainCascade.tasks[0]) {
      await selectChainTask(chainCascade.tasks[0], true);
    } else {
      await loadChainLedgers({ companyId: chainCascade.company.companyId, jobId: row.jobId, applyId: row.applyId });
    }
    chainActiveNode.value = keepNode ? 'apply' : 'task';
  } finally {
    chainDetailLoading.value = false;
  }
}

async function selectChainUser(row: ChainUserItem, keepNode = false) {
  if (!row?.userId || !chainCascade.company?.companyId) return;
  chainCascade.selectedUser = row;
  chainCascade.selectedApply = chainCascade.applies.find((item) => Number(item.userId) === Number(row.userId)) || null;
  clearChainAfter('user');
  chainDetailLoading.value = true;
  try {
    const res = await listTask({
      pageNum: 1,
      pageSize: 100,
      companyId: chainCascade.company.companyId,
      jobId: chainCascade.selectedJob?.jobId,
      userId: row.userId
    });
    chainCascade.tasks = unwrapList(res).rows;
    if (chainCascade.tasks[0]) {
      await selectChainTask(chainCascade.tasks[0], true);
    }
    chainActiveNode.value = keepNode ? 'user' : 'task';
  } finally {
    chainDetailLoading.value = false;
  }
}

async function selectChainTask(row: any, keepNode = false) {
  if (!row?.taskId || !chainCascade.company?.companyId) return;
  chainCascade.selectedTask = row;
  clearChainAfter('task');
  chainDetailLoading.value = true;
  try {
    await loadChainLedgers({ companyId: chainCascade.company.companyId, jobId: row.jobId, applyId: row.applyId, taskId: row.taskId });
    chainActiveNode.value = keepNode ? 'task' : 'ledger';
  } finally {
    chainDetailLoading.value = false;
  }
}

async function loadChainLedgers(query: { companyId: number | string; jobId?: number; applyId?: number; taskId?: number }) {
  try {
    const res = await listLedger({ pageNum: 1, pageSize: 100, ...query });
    chainCascade.ledgers = unwrapList(res).rows;
    chainCascade.selectedLedger = chainCascade.ledgers[0] || null;
  } catch (error) {
    chainCascade.ledgers = [];
    chainCascade.selectedLedger = null;
    ElMessage.warning('台账链路加载失败，请确认台账权限');
  }
}

function handleChainStepClick(kind: ChainNodeKind) {
  chainActiveNode.value = kind;
}

async function loadData() {
  loading.value = true;
  try {
    const res = await listCompany(buildCompanyQueryParams());
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

function clearQueryFilters() {
  queryParams.companyNo = '';
  queryParams.companyName = '';
  queryParams.description = '';
  queryParams.contactPerson = '';
  queryParams.contactPhone = '';
  queryParams.status = '';
  queryParams.deleted = '0';
  queryParams.isSilenced = '';
  queryParams.jobCount = undefined;
  queryParams.applyCount = undefined;
  queryParams.feedbackCount = undefined;
  queryParams.noFeedbackCount = undefined;
  dateRange.value = [];
}

function handleStatFilter(type: 'all' | 'pending' | 'approved' | 'disabled' | 'silenced') {
  queryParams.pageNum = 1;
  clearQueryFilters();

  if (type === 'pending') {
    queryParams.status = '0';
  } else if (type === 'approved') {
    queryParams.status = '1';
  } else if (type === 'disabled') {
    queryParams.status = '2';
  } else if (type === 'silenced') {
    queryParams.isSilenced = '1';
  }

  loadData();
}

function resetQuery() {
  queryFormRef.value?.resetFields();
  queryParams.pageNum = 1;
  clearQueryFilters();
  loadData();
}

// 解析企业资质材料：company 表各字段存 OSS id（个别历史数据可能直接是 URL）。
const AUTH_LETTER_IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'bmp', 'webp', 'gif'];

function fileExt(source?: string) {
  const raw = (
    String(source || '')
      .split('?')[0]
      .split('#')[0]
      .split('/')
      .pop() || ''
  ).replace(/^\./, '');
  const parts = raw.split('.');
  return (parts.length > 1 ? parts.pop() : raw).toLowerCase();
}

function authLetterKind(oss: any, url?: string): 'image' | 'doc' {
  const ext = fileExt(oss?.fileSuffix || oss?.originalName || url || '');
  return AUTH_LETTER_IMAGE_EXTS.includes(ext) ? 'image' : 'doc';
}

function companyAuditStatusMeta(company?: any) {
  // Reject keeps company.status as draft so B-side users can log in and resubmit; admin list should still show the audit result.
  if (company?.status === '4' && String(company?.remark || '').trim()) {
    return { label: '驳回', type: 'danger' as const };
  }
  return companyStatusMeta(company?.status);
}

// 授权书允许 PDF 或图片，必须保留文件元数据供下载卡片/图片预览判断。
async function loadCompanyCertImages(company: any) {
  const isOssId = (t: string) => /^\d+$/.test(t); // 纯数字视为 OSS id，其余（含 http/相对路径）按 URL 直用
  const fields = [
    { label: '营业执照正负本', value: company?.businessLicense, kind: 'image' as const },
    { label: '法人身份证附件', value: company?.idCardPhotoIds, kind: 'image' as const },
    { label: '对公账户凭证', value: company?.bankAccountIds, kind: 'image' as const },
    { label: '办公场地实景', value: company?.companyAddressIds, kind: 'image' as const },
    { label: '招聘授权书', value: company?.recruitmentAuthorizationIds, kind: 'doc' as const },
    { label: '企业 Logo', value: company?.logoUrl, kind: 'image' as const }
  ];
  certLoading.value = true;
  certGroups.value = [];
  try {
    // 收集所有需要解析的 OSS id（去重），一次性查回 URL
    const idSet = new Set<string>();
    fields.forEach((f) =>
      splitToArray(f.value).forEach((t) => {
        if (isOssId(t)) idSet.add(t);
      })
    );
    const fileMap: Record<string, any> = {};
    if (idSet.size > 0) {
      const res = await listByIds(Array.from(idSet).join(','));
      (res.data || []).forEach((o: any) => {
        fileMap[String(o.ossId)] = o;
      });
    }
    certGroups.value = fields.map((f) => ({
      label: f.label,
      files: splitToArray(f.value)
        .map((t) => {
          const oss = isOssId(t) ? fileMap[t] : null;
          const url = oss ? oss.url : t;
          if (!url) return null;
          return {
            kind: f.label === '招聘授权书' ? authLetterKind(oss, url) : f.kind,
            url,
            name: oss?.originalName,
            ossId: oss ? String(oss.ossId) : undefined,
            suffix: oss?.fileSuffix
          } as CertMaterialFile;
        })
        .filter(Boolean) as CertMaterialFile[]
    }));
  } catch (e) {
    // 解析失败时退化为按原始值展示，避免整块空白
    certGroups.value = fields.map((f) => ({
      label: f.label,
      files: splitToArray(f.value)
        .filter(Boolean)
        .map((url) => ({
          kind: f.label === '招聘授权书' ? authLetterKind(null, url) : f.kind,
          url
        }))
    }));
  } finally {
    certLoading.value = false;
  }
}

async function handleDetail(row: any) {
  try {
    const res = await getCompany(row.companyId);
    currentCompany.value = res.data;
    historyTab.value = 'logs';
    detailVisible.value = true;
    // 解析资质图片（OSS id → URL）；并行加载历史审核记录，二者失败均不阻断详情展示
    loadCompanyCertImages(res.data);
    loadAuditHistory(row.companyId);
  } catch (error) {
    ElMessage.error('获取企业详情失败');
  }
}

async function handleEdit(row: any) {
  try {
    const res = await getCompany(row.companyId);
    form.value = res.data;
    editVisible.value = true;
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
    await hydrateCertHistoryFiles();
  } catch (error) {
    console.error('审核历史加载失败:', error);
  } finally {
    historyLoading.value = false;
  }
}

// 认证历史从后端取到的材料字段可能仍是 OSS id；这里统一解析，避免文档/图片展示拿到不可访问的裸 id。
async function hydrateCertHistoryFiles() {
  const certs = auditHistory.value.certHistory || [];
  const isOssId = (t: string) => /^\d+$/.test(t);
  const materialFields = ['businessLicense', 'legalPersonIdFront', 'legalPersonIdBack', 'bankAccountProof', 'authLetter', 'officePhotos'];
  const idSet = new Set<string>();
  certs.forEach((cert: any) => {
    materialFields.forEach((field) =>
      splitToArray(cert[field]).forEach((t) => {
        if (isOssId(t)) idSet.add(t);
      })
    );
  });
  if (idSet.size === 0) return;
  const res = await listByIds(Array.from(idSet).join(','));
  const fileMap: Record<string, any> = {};
  (res.data || []).forEach((file: any) => {
    fileMap[String(file.ossId)] = file;
  });
  certs.forEach((cert: any) => {
    const rawAuthLetter = cert.authLetter;
    materialFields.forEach((field) => {
      cert[field] = splitToArray(cert[field])
        .map((t) => (isOssId(t) ? fileMap[t]?.url : t))
        .filter(Boolean)
        .join(',');
    });
    cert.authLetterFiles = splitToArray(cert.authLetter).map((url, index) => {
      const raw = splitToArray(rawAuthLetter).at(index);
      const oss = raw && isOssId(raw) ? fileMap[raw] : null;
      return {
        kind: authLetterKind(oss, url),
        url,
        name: oss?.originalName || '招聘授权书.pdf',
        ossId: oss ? String(oss.ossId) : undefined,
        suffix: oss?.fileSuffix
      } as CertMaterialFile;
    });
  });
}

// 按操作动作给时间线节点上色：审核/通过=绿，驳回/拒绝/禁言/禁用=红，其余=主色蓝。
function auditLogDotType(action?: string): 'primary' | 'success' | 'warning' | 'danger' | 'info' {
  const a = action || '';
  if (/拒绝|驳回|禁言|禁用|删除/.test(a)) return 'danger';
  if (/通过|认证|启用|解禁/.test(a)) return 'success';
  if (/导出|状态/.test(a)) return 'warning';
  return 'primary';
}

// 认证材料图片清单（按材料类型分组 + 在合并预览列表中的起始索引）。
function certImageList(cert: CompanyCertVO): { label: string; urls: string[]; startIndex: number }[] {
  const groups = [
    { label: '营业执照', urls: splitToArray(cert.businessLicense) },
    { label: '法人身份证附件', urls: [cert.legalPersonIdFront, cert.legalPersonIdBack].flatMap((url) => splitToArray(url)) },
    { label: '对公账户凭证', urls: splitToArray(cert.bankAccountProof) },
    { label: '办公实景', urls: splitToArray(cert.officePhotos) }
  ].filter((group) => group.urls.length > 0);

  let startIndex = 0;
  return groups.map((group) => {
    const item = { ...group, startIndex };
    startIndex += group.urls.length;
    return item;
  });
}

// 单条认证记录的预览图地址列表（与 certImageList 顺序一致，供 el-image 放大轮播）。
function certPreviewList(cert: CompanyCertVO): string[] {
  return certImageList(cert).flatMap((i) => i.urls);
}

function certAuthLetterFiles(cert: CompanyCertVO): CertMaterialFile[] {
  const files = (cert as any).authLetterFiles as CertMaterialFile[] | undefined;
  if (files?.length) return files;
  return splitToArray(cert.authLetter).map((url) => ({
    kind: authLetterKind(null, url),
    url,
    name: '招聘授权书.pdf'
  }));
}

function openUrl(url?: string) {
  if (!url) {
    ElMessage.warning('文件地址不可用');
    return;
  }
  window.open(url, '_blank');
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

// 从「企业编辑」弹窗内直接发起审核：先关编辑弹窗再开审核对话框，避免审核完成后背后残留过期的编辑框。
// 仅复用现有审核流程，不改动 保存/提交/存草稿 的既有逻辑。
function handleAuditFromEdit(status: string) {
  editVisible.value = false;
  handleAudit(form.value, status);
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
      // 驳回：走 /company/rejectCert，把资质态置为已驳回并让企业回到待重新提交态；
      // 不走 changeStatus 禁用账号，避免企业无法看到驳回原因和重新提交入口。
      await rejectCompanyCert({ companyId: auditForm.companyId, remark: auditForm.remark });
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
      type: 'warning'
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

// 企业线索按企业维度逐级查询：companyId -> jobId -> apply/userId -> taskId -> ledger。
function getRowCompanyId(row: any) {
  return String(row?.company_id ?? row?.companyId ?? '').trim();
}

async function openCompanyChain(row: any) {
  const companyId = getRowCompanyId(row);
  if (!companyId || companyId === '0') {
    ElMessage.warning('该企业暂无企业ID，无法查询链路');
    return;
  }
  chainDrawerVisible.value = true;
  chainDrawerTitle.value = `线索链路${row?.companyName ? ' - ' + row.companyName : ''}`;
  chainLoading.value = true;
  resetCompanyChainCascade();
  // 链路入口以列表行 company_id/companyId 为准，避免 19 位雪花 ID 经 Number 转换后丢精度。
  chainCascade.company = { ...row, companyId: row?.companyId ?? row?.company_id ?? companyId };
  try {
    try {
      const res = await getCompany(companyId);
      const detail = res.data || {};
      chainCascade.company = {
        ...row,
        ...detail,
        companyId: detail.companyId ?? detail.company_id ?? row?.companyId ?? row?.company_id ?? companyId
      };
    } catch (error) {
      console.warn('企业详情加载失败，使用列表 company_id 继续查询链路', error);
    }
    await loadChainJobs(companyId, row?.settlementJobId, row?.settlementJobName);
  } catch (error) {
    resetCompanyChainCascade();
    ElMessage.error('链路加载失败');
  } finally {
    chainLoading.value = false;
  }
}

// 人员管理入口：用弹窗 + iframe 内嵌「用户管理」(/system/user)。
// iframe 在弹窗内独立加载该路由，即使该路由 404 也只影响 iframe 内部，不会动到外层 Layout/左侧菜单。
// 带上 companyId/deptId 作上下文透传，便于用户管理页后续按企业过滤。
function handleStaff(row: any) {
  // deptName=企业名：企业审核通过时以企业名建的部门(deptName=companyName)，
  // 用户管理页据此默认选中对应单位并过滤用户；companyId 仅作上下文备用。
  const { href } = router.resolve({
    path: '/system/user',
    query: { companyId: row.companyId, userId: row.userId, deptName: row.companyName }
  });
  // 兼容 history / hash 两种路由模式，统一拼成同源绝对地址供 iframe 加载
  staffUrl.value = new URL(href, window.location.href).toString();
  staffTitle.value = `人员管理${row.companyName ? ' - ' + row.companyName : ''}`;
  staffVisible.value = true;
}

function openJobDialog(row: any) {
  jobQuery.companyId = row.companyId;
  jobQuery.pageNum = 1;
  jobTitle.value = `职位列表${row.companyName ? ' - ' + row.companyName : ''}`;
  jobVisible.value = true;
  loadJobList();
}

async function loadJobList() {
  jobLoading.value = true;
  try {
    const res = await listJob(jobQuery);
    const list = unwrapList(res);
    jobList.value = list.rows;
    jobTotal.value = list.total;
  } catch (error) {
    ElMessage.error('加载职位列表失败');
  } finally {
    jobLoading.value = false;
  }
}

function buildCompanyQueryParams() {
  const params: any = { ...queryParams };
  if (dateRange.value && dateRange.value.length === 2) {
    params.params = {
      beginTime: `${dateRange.value[0]} 00:00:00`,
      endTime: `${dateRange.value[1]} 23:59:59`
    };
  }
  return params;
}

// 打开投递人员弹窗：feedback='1' 已反馈 / '0' 未反馈；不传 feedback 时展示该企业全部投递
function openApplyDialog(row: any, feedback = '') {
  applyQuery.companyId = row.companyId;
  applyQuery.feedback = feedback;
  applyQuery.pageNum = 1;
  const label = feedback === '1' ? '已反馈投递' : feedback === '0' ? '未反馈投递' : '投递列表';
  applyTitle.value = `${label} - ${row.companyName || ''}`;
  applyVisible.value = true;
  loadApplyList();
}

async function loadApplyList() {
  applyLoading.value = true;
  try {
    const res = await listApply(applyQuery);
    const list = unwrapList(res);
    applyList.value = list.rows;
    applyTotal.value = list.total;
  } catch (error) {
    ElMessage.error('加载投递列表失败');
  } finally {
    applyLoading.value = false;
  }
}

// 点击投递行 → 打开投递全景详情（组件内部按 applyId 调 apply2/detail 加载）
function openApplyDetail(applyRow: any) {
  applyDetailRef.value?.open(applyRow?.applyId);
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
      type: 'warning'
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

async function applyRouteFocus() {
  const qCompanyNo = route.query.companyNo;
  if (typeof qCompanyNo === 'string' && qCompanyNo) {
    queryParams.companyNo = qCompanyNo;
  }
  const qCompanyId = route.query.companyId;
  if (typeof qCompanyId === 'string' && qCompanyId) {
    await handleDetail({ companyId: qCompanyId });
  }
}

onMounted(() => {
  applyRouteFocus();
  loadData();
  loadStatistics();
});

function handleExport() {
  download('/admin/recruitment/company/exportData', buildCompanyQueryParams(), `企业数据_${new Date().getTime()}.xlsx`);
}

// 表格勾选变化：收集所选行的 companyId
function handleSelectionChange(rows: any[]) {
  selectedIds.value = rows.map((r) => r.companyId);
}

// 批量删除：后端执行软删除归档并下架在线岗位，企业从活动列表隐藏但历史业务数据保留。
async function handleBatchDelete() {
  // 未勾选任何企业时给出提示，避免静默无反应
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择要删除的企业');
    return;
  }
  try {
    await ElMessageBox.confirm('删除后企业将移入已删除列表，关联在线岗位会自动下架；投递、履约和财务历史会保留。是否继续？', '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    });
    await delCompany(selectedIds.value);
    ElMessage.success('已移入已删除列表');
    selectedIds.value = [];
    loadData();
    loadStatistics();
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败');
    }
  }
}

// 恢复只解除企业归档状态；岗位是否重新上架仍由岗位管理流程决定。
async function handleRestore(row: any) {
  try {
    await ElMessageBox.confirm('确定要恢复该企业吗？恢复后企业会回到正常列表，但不会自动重新上架岗位。', '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    });
    await restoreCompany(row.companyId);
    ElMessage.success('恢复成功');
    loadData();
    loadStatistics();
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('恢复失败');
    }
  }
}

async function handleBatchRestore() {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择要恢复的企业');
    return;
  }
  try {
    await ElMessageBox.confirm('确定要恢复选中的企业吗？恢复后不会自动重新上架岗位。', '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    });
    await restoreCompany(selectedIds.value);
    ElMessage.success('恢复成功');
    selectedIds.value = [];
    loadData();
    loadStatistics();
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('恢复失败');
    }
  }
}

//新增

function add() {
  editVisible.value = true;
  form.value = {
    companyName: '',
    socialCreditCode: '',
    contactPerson: '',
    contactPhone: '',
    adminPhone: '',
    registeredAddress: '',
    companyAddress: '',
    businessLicense: '',
    idCardPhotoIds: '',
    bankAccountIds: '',
    companyAddressIds: '',
    recruitmentAuthorizationIds: '',
    logoUrl: ''
  };
}
/** 提交按钮：完整校验通过后置为「待审核」(status=0)，进入运营审核队列。 */
const submit = async () => {
  // 1. 表单校验（异常处理放回调内：外层 try 包不住 async 回调里的 await 异常）
  formRef.value?.validate(async (valid: boolean) => {
    // 校验失败必须显式提示：错误红字可能在弹窗滚动区上方（视野外），静默 return 会被误判为"按钮无效"
    if (!valid) {
      ElMessage.warning('请检查表单：必填项未填或格式不正确（信用代码需18位、电话需11位手机号）');
      return;
    }
    editSubmitting.value = 'submit';
    try {
      (form.value as any).status = '0'; // 待审核
      await addOrUpdate(form.value);
      ElMessage.success('提交成功，已进入待审核');
      editVisible.value = false;
      loadData(); // 刷新列表
    } catch (e) {
      ElMessage.error('提交失败');
    } finally {
      editSubmitting.value = '';
    }
  });
};

/**
 * 存草稿按钮：把当前填写的内容以「草稿」(status=4)落库，允许信息不完整 —— 不做必填校验，
 * 便于运营先存后补。新增时走新增、编辑时走更新（addOrUpdate 按 companyId 自动区分）。
 */
const handleDraft = async () => {
  editSubmitting.value = 'draft';
  try {
    (form.value as any).status = '4'; // 草稿
    await addOrUpdate(form.value);
    ElMessage.success('已存为草稿');
    editVisible.value = false;
    loadData(); // 刷新列表
  } catch (e) {
    ElMessage.error('存草稿失败');
  } finally {
    editSubmitting.value = '';
  }
};

/**
 * 保存按钮：企业编辑(修改)场景。
 * form 由 handleEdit 注入完整企业数据(含 companyId)，沿用 addOrUpdate 接口 —— 后端见 companyId 非空
 * 即走 updateById 仅更新非空字段，不会新增。无 companyId(理论上不会进保存按钮)时拦截给提示。
 */
const handleSave = async () => {
  if (!(form.value as any).companyId) {
    ElMessage.warning('缺少企业ID，无法保存修改');
    return;
  }
  formRef.value?.validate(async (valid: boolean) => {
    if (!valid) {
      ElMessage.warning('请检查表单：必填项未填或格式不正确（信用代码需18位、电话需11位手机号）');
      return;
    }
    editSubmitting.value = 'save';
    try {
      await addOrUpdate(form.value);
      ElMessage.success('保存成功');
      editVisible.value = false;
      loadData(); // 刷新列表
    } catch (e) {
      ElMessage.error('保存失败');
    } finally {
      editSubmitting.value = '';
    }
  });
};

const handleOssChange = (ossIds) => {
  form.value.businessLicense = ossIds;
};

const handleOssIdCarPhotoChange = (ossIds) => {
  form.value.idCardPhotoIds = ossIds;
};

const handleOssBankAccountIdsChange = (ossIds) => {
  form.value.bankAccountIds = ossIds;
};

const handleOssCompanyAddressIdsChange = (ossIds) => {
  form.value.companyAddressIds = ossIds;
};

const handleOssRecruitmentAuthorizationIdsChange = (ossIds) => {
  form.value.recruitmentAuthorizationIds = ossIds;
};

const handleOsslogoUrlChange = (ossIds) => {
  form.value.logoUrl = ossIds;
};
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

.stat-mini .value.warning {
  color: #e6a23c;
}
.stat-mini .value.success {
  color: #67c23a;
}
.stat-mini .value.danger {
  color: #f56c6c;
}

.company-query-form {
  display: flex;
  flex-wrap: wrap;
  row-gap: 6px;
}

.stat-clickable {
  cursor: pointer;
  transition:
    transform 0.16s ease,
    box-shadow 0.16s ease;
}

.stat-clickable:hover,
.stat-clickable:focus-visible {
  transform: translateY(-2px);
}

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

.company-chain-body {
  min-height: 360px;
}

.company-chain-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  padding: 12px 14px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background: #f8fafc;
}

.summary-title {
  max-width: 460px;
  overflow: hidden;
  color: #303133;
  font-size: 16px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.summary-subtitle {
  margin-top: 4px;
  color: #909399;
  font-family: ui-monospace, SFMono-Regular, Consolas, 'Liberation Mono', monospace;
  font-size: 12px;
}

.company-chain-flow {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 12px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background: #fff;
}

.company-chain-node {
  position: relative;
  flex: 1 1 86px;
  min-width: 78px;
  min-height: 78px;
  padding: 10px 8px 8px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  background: #fff;
  color: #303133;
  cursor: pointer;
  text-align: left;
  transition:
    border-color 0.2s,
    box-shadow 0.2s,
    color 0.2s;
}

.company-chain-node:hover,
.company-chain-node.active {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.chain-node-dot {
  display: block;
  width: 9px;
  height: 9px;
  margin-bottom: 6px;
  border-radius: 50%;
  background: #c0c4cc;
}

.company-chain-node.active .chain-node-dot,
.company-chain-node:hover .chain-node-dot {
  background: var(--el-color-primary);
}

.chain-node-label,
.chain-node-code,
.chain-node-desc {
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chain-node-label {
  font-size: 13px;
  font-weight: 700;
}

.chain-node-code {
  margin-top: 6px;
  font-family: ui-monospace, SFMono-Regular, Consolas, 'Liberation Mono', monospace;
  font-size: 12px;
  color: #606266;
}

.chain-node-desc {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
}

.company-chain-arrow {
  position: relative;
  flex: 0 0 14px;
  height: 1px;
  background: #dcdfe6;
}

.company-chain-arrow::after {
  position: absolute;
  top: -4px;
  right: 0;
  width: 8px;
  height: 8px;
  border-top: 1px solid #dcdfe6;
  border-right: 1px solid #dcdfe6;
  content: '';
  transform: rotate(45deg);
}

.company-chain-detail {
  padding: 2px 0 0;
  min-height: 180px;
}

.chain-detail-title {
  margin-bottom: 12px;
  padding-left: 10px;
  border-left: 4px solid var(--el-color-primary);
  color: #303133;
  font-size: 15px;
  font-weight: 700;
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

/* 已反馈/未反馈数字 tag：可点击查看投递人员 */
.count-clickable {
  cursor: pointer;
}
.count-clickable:hover {
  opacity: 0.8;
}

/* 投递人员弹窗：行可点击查看求职者详情 */
.apply-tip {
  margin-bottom: 8px;
  font-size: 12px;
  color: #909399;
}
:deep(.row-clickable) {
  cursor: pointer;
}

/* 人员管理弹窗内嵌 iframe：撑满弹窗体，去边框 */
.staff-iframe {
  width: 100%;
  height: 75vh;
  border: 0;
  display: block;
}

/* 编辑弹窗：分区内容容器，浅边框 + 圆角，呼应详情弹窗的 el-descriptions 边框观感 */
.edit-block {
  padding: 18px 16px 2px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background: #fafbfc;
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

/* 同一资质类型下的多张图片横向排列 */
.cert-img-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
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

.cert-doc-card {
  width: 160px;
  min-height: 100px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background: #fafafa;
}

.cert-doc-card-sm {
  width: 130px;
  min-height: 80px;
}

.cert-doc-card .el-icon {
  font-size: 28px;
  color: #2b7fff;
}

.cert-doc-card span {
  max-width: 130px;
  overflow: hidden;
  font-size: 12px;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
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
