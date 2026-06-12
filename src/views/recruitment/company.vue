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
            <el-button type="primary" plain icon="Plus" @click="add">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="primary" plain icon="Refresh" @click="loadData">刷新</el-button>
          </el-col>
          <el-col :span="1.5">
            <!-- 批量删除：未勾选时点击给出提示，勾选后按所选 companyId 批量删除 -->
            <el-button type="danger" plain icon="Delete" @click="handleBatchDelete">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Download" @click="handleExport">导出</el-button>
          </el-col>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="tableData" border stripe @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="50" align="center" />
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
              <el-button link type="primary" icon="Edit" @click="handleEdit(row)">编辑</el-button>
              <el-dropdown trigger="click">
                <span class="el-dropdown-link">
                  <el-button link type="primary">管理<el-icon class="el-icon--right"><arrow-down /></el-icon></el-button>
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <!-- 人员：已认证企业的人员管理入口，置于菜单最上方（行为待接，后端接口待补） -->
                    <el-dropdown-item v-if="row.status === '1'" icon="User" @click="handleStaff(row)">人员</el-dropdown-item>
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

        <!-- 资质图片：营业执照/身份证/对公凭证/办公实景/授权书/Logo（来自 company 表）。
             这些字段存的是 OSS 文件 id(逗号分隔)，已在 handleDetail 中通过 listByIds 解析为可预览 URL。
             每组支持多图，点击可放大轮播预览。 -->
        <div class="section-title">资质图片</div>
        <div v-loading="certLoading" class="cert-images">
          <div v-for="group in certGroups" :key="group.label" class="cert-item">
            <div class="cert-label">{{ group.label }}</div>
            <div v-if="group.urls.length" class="cert-img-row">
              <el-image
                v-for="(url, idx) in group.urls"
                :key="url"
                :src="url"
                :preview-src-list="group.urls"
                :initial-index="idx"
                :preview-teleported="true"
                fit="cover"
                class="cert-img"
              />
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
                <el-input v-model="form.companyName" placeholder="与营业执照一致" maxlength="20" ></el-input>
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
                <el-input v-model="form.contactPhone" placeholder="法定代表人电话"  maxlength="11"
                          @input="form.contactPhone = form.contactPhone.replace(/[^\d]/g, '')"></el-input>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <!-- 超管手机号：企业超级管理员账号的登录手机号；不填时后端回退用法人电话开通账号 -->
              <el-form-item label="超管手机号" prop="adminPhone">
                <el-input v-model="form.adminPhone" placeholder="企业超级管理员手机号，空则用法人电话" maxlength="11"
                          @input="form.adminPhone = (form.adminPhone || '').replace(/[^\d]/g, '')"></el-input>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="注册地址" prop="registeredAddress">
                <el-input type="textarea" show-word-limit  :autosize="{ minRows: 3, maxRows: 6 }" v-model="form.registeredAddress" placeholder="企业注册登记地址" maxlength="150"></el-input>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="办公地址" prop="creditCode">
                <el-input type="textarea" show-word-limit  :autosize="{ minRows: 3, maxRows: 6 }" v-model="form.companyAddress" placeholder="与注册地址不符时填写" maxlength="150"></el-input>
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <!-- 资质图片：与详情弹窗"资质图片"分区一致，按网格平铺各类上传项 -->
        <div class="section-title">资质图片</div>
        <div class="edit-block">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="营业执照正负本">
                <imageUpload v-model="form.businessLicense" :limit="1" @update:modelValue="handleOssChange" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="法人身份证正反面">
                <imageUpload v-model="form.idCardPhotoIds" :limit="2" @update:modelValue="handleOssIdCarPhotoChange"/>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="对公账户凭证">
                <imageUpload v-model="form.bankAccountIds" :limit="1" @update:modelValue="handleOssBankAccountIdsChange"/>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="办公场地实景">
                <imageUpload v-model="form.companyAddressIds" @update:modelValue="handleOssCompanyAddressIdsChange"/>
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
                <imageUpload v-model="form.recruitmentAuthorizationIds" :limit="1" @update:modelValue="handleOssRecruitmentAuthorizationIdsChange"/>
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
        >保存</el-button>
        <!-- 存草稿仅限"新增（尚无状态）/ 草稿(4)"：已进入审核流（待审核/已认证/驳回）的企业不允许再回退为草稿 -->
        <el-button
          v-if="!form.status || form.status === '4'"
          type="primary"
          :loading="editSubmitting === 'draft'"
          :disabled="!!editSubmitting && editSubmitting !== 'draft'"
          @click="handleDraft"
        >存草稿</el-button>
        <el-button
          v-if="form.status !== '1'"
          type="primary"
          :loading="editSubmitting === 'submit'"
          :disabled="!!editSubmitting && editSubmitting !== 'submit'"
          @click="submit"
        >提交</el-button>
        <el-button :disabled="!!editSubmitting" @click="editVisible = false">取消</el-button>
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

    <!-- 人员管理弹窗：iframe 内嵌系统用户管理页(/system/user)，destroy-on-close 保证每次打开为最新状态 -->
    <el-dialog v-model="staffVisible" :title="staffTitle" width="90%" top="5vh" append-to-body destroy-on-close>
      <iframe v-if="staffUrl" :src="staffUrl" class="staff-iframe" frameborder="0"></iframe>
    </el-dialog>

    <!-- 投递人员弹窗：点击「已反馈/未反馈」数字，按企业 + 反馈口径分页查看投递人员列表；点击行查看求职者详情 -->
    <el-dialog v-model="applyVisible" :title="applyTitle" width="900px" append-to-body destroy-on-close>
      <div class="apply-tip">点击任意行可查看投递全景详情</div>
      <el-table v-loading="applyLoading" :data="applyList" border stripe row-class-name="row-clickable" @row-click="openApplyDetail">
        <el-table-column label="求职者" prop="userName" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">{{ row.userName || row.realName || '-' }}</template>
        </el-table-column>
        <el-table-column label="联系电话" prop="phonenumber" width="140" align="center">
          <template #default="{ row }">{{ row.phonenumber || '-' }}</template>
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

    <!-- 投递全景详情弹窗（复用组件）：点击投递行后按 applyId 加载完整详情 -->
    <ApplyDetailDialog ref="applyDetailRef" />
  </div>
</template>

<script setup name="CompanyManagement" lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
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
  type CompanyCertVO, addOrUpdate, delCompany, listApply
} from '@/api/recruitment';
import ApplyDetailDialog from './components/ApplyDetailDialog.vue';
import { download } from '@/utils/request';
import { listByIds } from '@/api/system/oss';
import { unwrapList, splitToArray } from './helpers';
import { companyStatusMeta, certStatusMeta, applyStatusMeta } from './constants';
import { UserForm } from '@/api/system/user/types';
import { updateUserProfile } from '@/api/system/user';
import { RoleVO } from '@/api/system/role/types';

const router = useRouter();

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

// 详情弹窗「资质图片」：company 表各资质字段存的是 OSS id，需解析为 URL 后分组展示
const certLoading = ref(false);
const certGroups = ref<{ label: string; urls: string[] }[]>([]);

// 投递人员弹窗：点击「已反馈/未反馈」按企业 + 反馈口径分页查看
const applyVisible = ref(false);
const applyTitle = ref('');
const applyLoading = ref(false);
const applyList = ref<any[]>([]);
const applyTotal = ref(0);
const applyQuery = reactive({ pageNum: 1, pageSize: 10, companyId: undefined as number | undefined, feedback: '' });

// 投递全景详情弹窗组件引用：点击投递行 → open(applyId)
const applyDetailRef = ref<InstanceType<typeof ApplyDetailDialog>>();
const queryFormRef = ref();
const auditFormRef = ref();
const silenceFormRef = ref();
const formRef = ref();

const form = ref<Partial<UserForm>>({});

const rules = reactive({
  companyName: [
    { required: true, message: '请输入公司全称', trigger: 'blur' }
  ],
  socialCreditCode:[
    { required: true, message: '请输入信用代码', trigger: 'blur' },
    { pattern: /^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/, message: '请输入正确的18位统一社会信用代码', trigger: 'blur' }
  ],
  contactPhone: [
    { required: true, message: '请输入法定代表人电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的11位手机号', trigger: 'blur' }
  ],
  contactPerson:[
    { required: true, message: '请输入法人姓名', trigger: 'blur' },
  ],
  registeredAddress:[
    { required: true, message: '请输入注册地址', trigger: 'blur' }
  ],
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
})

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

// 解析企业资质图片：company 表各字段存的是逗号分隔的 OSS id（个别历史数据可能直接是 URL）。
// 统一收集 id 批量 listByIds 换成可预览 URL，按资质类型分组（每组可多图），失败不阻断详情。
async function loadCompanyCertImages(company: any) {
  const isOssId = (t: string) => /^\d+$/.test(t); // 纯数字视为 OSS id，其余（含 http/相对路径）按 URL 直用
  const fields = [
    { label: '营业执照正负本', value: company?.businessLicense },
    { label: '法人身份证正反面', value: company?.idCardPhotoIds },
    { label: '对公账户凭证', value: company?.bankAccountIds },
    { label: '办公场地实景', value: company?.companyAddressIds },
    { label: '招聘授权书', value: company?.recruitmentAuthorizationIds },
    { label: '企业 Logo', value: company?.logoUrl }
  ];
  certLoading.value = true;
  certGroups.value = [];
  try {
    // 收集所有需要解析的 OSS id（去重），一次性查回 URL
    const idSet = new Set<string>();
    fields.forEach((f) => splitToArray(f.value).forEach((t) => { if (isOssId(t)) idSet.add(t); }));
    const urlMap: Record<string, string> = {};
    if (idSet.size > 0) {
      const res = await listByIds(Array.from(idSet).join(','));
      (res.data || []).forEach((o: any) => { urlMap[String(o.ossId)] = o.url; });
    }
    certGroups.value = fields.map((f) => ({
      label: f.label,
      urls: splitToArray(f.value).map((t) => (isOssId(t) ? urlMap[t] : t)).filter(Boolean) as string[]
    }));
  } catch (e) {
    // 解析失败时退化为按原始值展示，避免整块空白
    certGroups.value = fields.map((f) => ({ label: f.label, urls: splitToArray(f.value).filter(Boolean) }));
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

// 人员管理入口：用弹窗 + iframe 内嵌「用户管理」(/system/user)。
// iframe 在弹窗内独立加载该路由，即使该路由 404 也只影响 iframe 内部，不会动到外层 Layout/左侧菜单。
// 带上 companyId/deptId 作上下文透传，便于用户管理页后续按企业过滤。
function handleStaff(row: any) {
  // deptName=企业名：企业审核通过时以企业名建的部门(deptName=companyName)，
  // 用户管理页据此默认选中对应单位并过滤用户；companyId 仅作上下文备用。
  const { href } = router.resolve({
    path: '/system/user',
    query: { companyId: row.companyId, deptName: row.companyName }
  });
  // 兼容 history / hash 两种路由模式，统一拼成同源绝对地址供 iframe 加载
  staffUrl.value = new URL(href, window.location.href).toString();
  staffTitle.value = `人员管理${row.companyName ? ' - ' + row.companyName : ''}`;
  staffVisible.value = true;
}

// 打开投递人员弹窗：feedback='1' 已反馈 / '0' 未反馈，按 companyId 精确过滤
function openApplyDialog(row: any, feedback: string) {
  applyQuery.companyId = row.companyId;
  applyQuery.feedback = feedback;
  applyQuery.pageNum = 1;
  applyTitle.value = `${feedback === '1' ? '已反馈' : '未反馈'}投递 - ${row.companyName || ''}`;
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

// 表格勾选变化：收集所选行的 companyId
function handleSelectionChange(rows: any[]) {
  selectedIds.value = rows.map((r) => r.companyId);
}

// 批量删除：二次确认后按所选 companyId 删除（后端接口待补，前端已对接 delCompany）
async function handleBatchDelete() {
  // 未勾选任何企业时给出提示，避免静默无反应
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择要删除的企业');
    return;
  }
  try {
    await ElMessageBox.confirm(`是否删除选中企业？`, '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning',
    });
    await delCompany(selectedIds.value);
    ElMessage.success('删除成功');
    selectedIds.value = [];
    loadData();
    loadStatistics();
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败');
    }
  }
}

//新增

function add(){
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
    logoUrl:''
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
}

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
}

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
}

const handleOssChange = (ossIds) => {
  form.businessLicense = ossIds;
};

const handleOssIdCarPhotoChange = (ossIds) => {
  form.idCardPhotoIds = ossIds;
};

const handleOssBankAccountIdsChange = (ossIds) => {
  form.bankAccountIds = ossIds;
};

const handleOssCompanyAddressIdsChange= (ossIds) => {
  form.companyAddressIds = ossIds;
};

const handleOssRecruitmentAuthorizationIdsChange= (ossIds) => {
  form.recruitmentAuthorizationIds = ossIds;
};

const handleOsslogoUrlChange= (ossIds) => {
  form.logoUrl = ossIds;
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
