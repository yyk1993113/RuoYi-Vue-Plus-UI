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
            <span class="label">岗位总数</span>
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
          @click="handleStatFilter('online')"
          @keyup.enter="handleStatFilter('online')"
          @keyup.space="handleStatFilter('online')"
        >
          <div class="stat-mini">
            <span class="label">已上架</span>
            <span class="value success">{{ statistics.onlineCount || 0 }}</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card
          shadow="hover"
          class="stat-mini-card stat-clickable info"
          role="button"
          tabindex="0"
          @click="handleStatFilter('offline')"
          @keyup.enter="handleStatFilter('offline')"
          @keyup.space="handleStatFilter('offline')"
        >
          <div class="stat-mini">
            <span class="label">已下架</span>
            <span class="value info">{{ statistics.offlineCount || 0 }}</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 搜索栏 -->
    <el-card shadow="hover" class="mb-4">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true" class="job-query-form">
        <el-form-item label="岗位编码" prop="jobNo">
          <el-input v-model="queryParams.jobNo" placeholder="请输入岗位编码" clearable style="width: 180px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="岗位名称" prop="jobName">
          <el-input v-model="queryParams.jobName" placeholder="请输入岗位名称" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="所属企业" prop="companyName">
          <el-input v-model="queryParams.companyName" placeholder="请输入企业名称" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="岗位类型" prop="jobType">
          <el-select v-model="queryParams.jobType" placeholder="全部" clearable style="width: 120px">
            <el-option label="全职" value="0" />
            <el-option label="兼职" value="1" />
            <el-option label="临时工" value="2" />
            <el-option label="项目制" value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="推荐" prop="isRecommend">
          <el-select v-model="queryParams.isRecommend" placeholder="全部" clearable style="width: 100px">
            <el-option label="是" value="1" />
            <el-option label="否" value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="热门" prop="isHot">
          <el-select v-model="queryParams.isHot" placeholder="全部" clearable style="width: 100px">
            <el-option label="是" value="1" />
            <el-option label="否" value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="待审核" value="0" />
            <el-option label="已上架" value="1" />
            <el-option label="已下架" value="2" />
            <el-option label="草稿" value="3" />
            <el-option label="驳回" value="6" />
          </el-select>
        </el-form-item>
        <el-form-item v-show="showMoreQuery" label="工作地点" prop="workAddress">
          <el-input v-model="queryParams.workAddress" placeholder="请输入工作地点" clearable style="width: 180px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item v-show="showMoreQuery" label="投递人数" prop="applyCount">
          <el-input-number
            v-model="queryParams.applyCount"
            :min="0"
            :precision="0"
            controls-position="right"
            placeholder="投递人数"
            style="width: 130px"
          />
        </el-form-item>
        <el-form-item v-show="showMoreQuery" label="发布时间">
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
        <el-row :gutter="10" align="middle">
          <el-col :span="1.5">
            <!-- 运营代发岗位：跳转独立发布整页（需指定所属企业） -->
            <el-button type="primary" icon="Plus" @click="handleCreate">新增岗位</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="primary" plain icon="Refresh" @click="handleRefresh" :loading="refreshing">刷新</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Download" @click="handleExport">导出</el-button>
          </el-col>
          <!-- 操作指引：常驻文字提示（按需求不用 tooltip 气泡），与按钮同行展示 -->
          <el-col :span="12" class="toolbar-tip">
            <el-icon><InfoFilled /></el-icon>
            提示：点击列表中的「投递人数」可查看具体投递人员
          </el-col>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="tableData" border stripe :row-class-name="jobRowClassName">
        <el-table-column label="岗位编码" prop="jobNo" width="180" align="center" show-overflow-tooltip>
          <template #default="{ row }">{{ row.jobNo || '-' }}</template>
        </el-table-column>
        <el-table-column label="岗位信息" min-width="250">
          <template #default="{ row }">
            <div class="job-info">
              <div class="job-header">
                <span class="job-name">{{ row.jobName }}</span>
                <el-tag :type="jobTypeMeta(row.jobType).type" size="small">{{ jobTypeMeta(row.jobType).label }}</el-tag>
                <el-tag v-if="isComplianceSettlement(row)" type="success" size="small" effect="dark">合规结算</el-tag>
              </div>
              <div class="job-salary">{{ formatSalary(row.salaryMin, row.salaryMax, row.salaryUnit) }}</div>
              <div class="job-location">
                <el-icon><Location /></el-icon>
                {{ row.workAddress || '未知地点' }}
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="所属企业" min-width="150">
          <template #default="{ row }">
            <div>{{ row.companyName || '-' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="投递人数" prop="applyCount" width="100" align="center">
          <template #default="{ row }">
            <!-- 点击数字打开该岗位的求职人（候选人）列表弹窗，复用"更多→候选人"同一弹窗；
                 操作指引为工具栏常驻文字（导出按钮旁），不用气泡 -->
            <el-tag type="primary" class="apply-count-tag" @click="handleSelectApplyUsers(row)">
              {{ row.applyCount || 0 }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="推荐" width="80" align="center">
          <template #default="{ row }">
            <el-switch v-model="row.isRecommend" active-value="1" inactive-value="0" @change="handleRecommendChange(row)" />
          </template>
        </el-table-column>
        <el-table-column label="热门" width="80" align="center">
          <template #default="{ row }">
            <el-switch v-model="row.isHot" active-value="1" inactive-value="0" @change="handleHotChange(row)" />
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="jobStatusMeta(row.status).type">{{ jobStatusMeta(row.status).label }}</el-tag>
          </template>
        </el-table-column>
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
        <el-table-column label="发布时间" prop="publishTime" width="160" align="center" />
        <!-- 240px 容纳 详情/编辑/更多 三按钮单行展示；nowrap 防止"更多"折到第二行 -->
        <el-table-column label="操作" width="240" fixed="right" align="center">
          <template #default="{ row }">
            <div style="display: flex; align-items: center; justify-content: center; gap: 4px; flex-wrap: nowrap; white-space: nowrap">
              <el-button link type="primary" icon="View" @click="handleDetail(row)">详情</el-button>
              <el-button link type="primary" icon="Edit" @click="handleEdit(row)">编辑</el-button>
              <el-dropdown trigger="click">
                <span class="el-dropdown-link">
                  <el-button link type="primary"
                    >更多<el-icon class="el-icon--right"><arrow-down /></el-icon
                  ></el-button>
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <!-- 候选人入口仅审核通过后展示：待审核(0)/草稿(3)岗位尚无有效投递，隐藏避免误导；
                         已上架(1)/已下架(2)/已满员(4)/已结束(5)均为通过后状态，保留查看历史候选人 -->
                    <el-dropdown-item v-if="row.status !== '0' && row.status !== '3'" icon="user" @click="handleSelectApplyUsers(row)"
                      >候选人</el-dropdown-item
                    >
                    <el-dropdown-item v-if="row.status === '0'" icon="CircleCheck" @click="handleAudit(row, '1')">审核通过</el-dropdown-item>
                    <el-dropdown-item v-if="row.status === '0'" icon="Close" @click="handleAudit(row, '6')">审核拒绝</el-dropdown-item>
                    <el-dropdown-item v-if="row.status === '1'" icon="Bottom" @click="handleStatusChange(row, '2')">下架</el-dropdown-item>
                    <el-dropdown-item v-if="row.status === '2'" icon="Top" @click="handleStatusChange(row, '1')">上架</el-dropdown-item>
                    <!-- 南京标签是独立旁路数据，不修改岗位本身，也不触发上下架或推荐刷新。 -->
                    <el-dropdown-item icon="PriceTag" @click="handleNanjingTags(row)">南京标签</el-dropdown-item>
                    <!-- 复制发布：进入代发整页并按 jobId 回填原岗位信息，少量修改即可重发 -->
                    <el-dropdown-item v-if="canShowSettlementIntent(row)" icon="Tickets" @click="handleSettlementIntent(row)"
                      >意向结算</el-dropdown-item
                    >
                    <el-dropdown-item icon="CopyDocument" @click="handleCopyPublish(row)">复制发布</el-dropdown-item>
                    <el-dropdown-item icon="Delete" @click="handleDelete(row)">删除</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="loadData" />
    </el-card>

    <!-- 岗位详情对话框：完整字段（数据来源 GET /admin/recruitment/jobDetail/{jobId} → JobFullVO，枚举译名由后端 *Name 提供） -->
    <el-dialog v-model="detailVisible" title="岗位详情" width="760px" append-to-body>
      <div v-loading="detailLoading">
        <el-descriptions v-if="currentJob" :column="2" border>
          <!-- 基本信息 -->
          <el-descriptions-item label="岗位编码">{{ currentJob.jobNo || '-' }}</el-descriptions-item>
          <el-descriptions-item label="岗位状态">
            <el-tag :type="jobStatusMeta(currentJob.status).type">{{ jobStatusMeta(currentJob.status).label }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="岗位名称" :span="2">{{ currentJob.jobName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="企业名称" :span="2">{{ currentJob.companyName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="用工性质">
            <el-tag :type="jobTypeMeta(currentJob.jobType).type">{{ jobTypeMeta(currentJob.jobType).label }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="职位类目">{{ jobCategoryText(currentJob) }}</el-descriptions-item>
          <el-descriptions-item label="薪资范围">{{
            formatSalary(currentJob.salaryMin, currentJob.salaryMax, currentJob.salaryUnit)
          }}</el-descriptions-item>
          <el-descriptions-item label="招聘人数">{{
            currentJob.recruitNumber != null ? currentJob.recruitNumber + ' 人' : '-'
          }}</el-descriptions-item>
          <el-descriptions-item label="经验要求">{{ currentJob.experienceName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="学历要求">{{ currentJob.educationName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="期望到岗时间">{{ formatStartDate(currentJob.expectedStartDate) }}</el-descriptions-item>
          <el-descriptions-item label="省市区">{{ jobRegionText(currentJob) }}</el-descriptions-item>
          <el-descriptions-item label="工作地点" :span="2">{{ currentJob.workAddress || '未知' }}</el-descriptions-item>

          <!-- 工作时间（仅在有数据时展示，兼容 JSON 数组与纯文本两种来源格式） -->
          <el-descriptions-item v-if="workTimeList.length" label="工作时间" :span="2">
            <div class="detail-tags">
              <el-tag v-for="(wt, i) in workTimeList" :key="i" type="info" effect="plain" class="mr-1 mb-1">{{ wt }}</el-tag>
            </div>
          </el-descriptions-item>

          <!-- 岗位福利 -->
          <el-descriptions-item label="岗位福利" :span="2">
            <div v-if="benefitsList.length" class="detail-tags">
              <el-tag v-for="(b, i) in benefitsList" :key="i" type="success" effect="plain" class="mr-1 mb-1">{{ b }}</el-tag>
            </div>
            <span v-else>暂无</span>
          </el-descriptions-item>

          <!-- 详细文本 -->
          <el-descriptions-item label="职位亮点" :span="2">
            <div class="detail-text">{{ detailHighlights }}</div>
          </el-descriptions-item>
          <el-descriptions-item label="岗位描述" :span="2">
            <div class="detail-text">{{ detailDescription }}</div>
          </el-descriptions-item>
          <el-descriptions-item label="团队介绍" :span="2">
            <div class="detail-text">{{ detailTeamIntro }}</div>
          </el-descriptions-item>
          <el-descriptions-item label="附加条件" :span="2">
            <div class="detail-text">{{ detailAdditionalConditions }}</div>
          </el-descriptions-item>

          <!-- 运营信息 -->
          <el-descriptions-item label="投递人数">{{ currentJob.applyCount || 0 }}</el-descriptions-item>
          <el-descriptions-item label="浏览人数">{{ currentJob.browseCount || 0 }}</el-descriptions-item>
          <el-descriptions-item label="发布时间">{{ detailPublishTime }}</el-descriptions-item>
          <el-descriptions-item v-if="detailCreateTime" label="创建时间">{{ detailCreateTime }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ currentJob.remark || '暂无' }}</el-descriptions-item>
        </el-descriptions>
        <el-empty v-else-if="!detailLoading" description="暂无详情数据" />
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 意向结算：字段来自 job_settlement_intent，运营在岗位维度维护临时用工服务意向和线索跟进状态。 -->
    <el-dialog v-model="settlementIntentVisible" title="意向结算（临时用工服务意向）" width="680px" append-to-body>
      <div v-loading="settlementIntentLoading">
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
        <el-button v-if="settlementLead?.orderNo || settlementLead?.ledgerId" type="warning" plain @click="openSettlementLeadInvoice"
          >查看发票</el-button
        >
        <el-button @click="settlementLeadVisible = false">关闭</el-button>
      </template>
    </el-drawer>

    <!-- 审核对话框：通过即上架（status=1），驳回写 status=6（独立驳回态，区别企业自主已下架=2） -->
    <el-dialog v-model="auditVisible" title="岗位审核" width="500px" append-to-body>
      <el-form ref="auditFormRef" :model="auditForm" label-width="80px">
        <el-form-item label="审核结果">
          <el-radio-group v-model="auditForm.status">
            <el-radio label="1">通过（上架）</el-radio>
            <el-radio label="6">驳回</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="auditForm.status === '6' ? '驳回原因' : '备注'" :required="auditForm.status === '6'">
          <el-input
            v-model="auditForm.remark"
            type="textarea"
            :rows="3"
            :placeholder="auditForm.status === '6' ? '请填写驳回原因（必填，将告知企业）' : '请输入审核备注（选填）'"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAudit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 岗位编辑对话框：运营修正岗位核心信息。
         数据来源 getJobFullDetail 全量回显；提交走 PUT /admin/recruitment/job，只发送结构化薪资字段。 -->
    <el-dialog v-model="editVisible" title="编辑岗位" width="1080px" append-to-body>
      <!-- 字段集与排序对齐 B 端发布岗位表单：名称/性质/类目/地点/薪资/经验/学历/人数/描述。
           表单按「基础信息 / 招聘要求 / 岗位详情」三段分组(el-divider 标题)，短字段双栏(el-col :span=12)以压缩弹窗高度。 -->
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="editRules"
        label-width="100px"
        v-loading="editLoading"
        scroll-to-error
        class="job-edit-form"
      >
        <!-- 模块1：基础岗位信息 -->
        <el-divider content-position="left">
          <span class="section-title"
            ><el-icon><Document /></el-icon>基础岗位信息</span
          >
        </el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="岗位名称" prop="jobName">
              <!-- 岗位名称是招聘展示标题，可自由填写；职位类目独立选择并作为分类合同提交。 -->
              <el-input v-model="editForm.jobName" placeholder="请输入岗位名称，如 全职前端开发工程师" maxlength="50" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="职位类目" prop="category">
              <JobPositionPicker v-model="editForm.positionName" placeholder="请选择标准职位（来自职位类目库）" @pick="selectEditStandardPosition" />
            </el-form-item>
          </el-col>
        </el-row>
        <!-- 用工性质：整行通栏，4 张块状卡片单行展示不折行（半栏宽容不下 4 张）。点击后手动触发校验(rule trigger=change 对程序赋值不生效) -->
        <el-form-item label="用工性质" prop="jobType">
          <div class="job-type-cards">
            <div
              v-for="opt in jobTypeOptions"
              :key="opt.value"
              class="job-type-card"
              :class="{ active: editForm.jobType === opt.value }"
              role="radio"
              tabindex="0"
              :aria-checked="editForm.jobType === opt.value"
              @click="selectJobType(opt.value)"
              @keyup.enter="selectJobType(opt.value)"
              @keyup.space="selectJobType(opt.value)"
            >
              {{ opt.label }}
            </div>
          </div>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="省市区" prop="regionPath">
              <!-- checkStrictly: 允许部分路径(只到省/市)回显与选择——B 端按「全省/全市」发的岗位只存省或省+市，
                   3 级级联默认只认完整叶子路径会导致这类岗位省市区带不出来 -->
              <el-cascader
                v-model="editForm.regionPath"
                :options="regionOptions"
                :props="{ checkStrictly: true }"
                filterable
                clearable
                placeholder="请选择省 / 市 / 区县"
                style="width: 100%"
                @change="syncEditRegionFromPath"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="工作地点" prop="workAddress">
              <el-input v-model="editForm.workAddress" placeholder="请输入详细地址（如：张江路 88 号 3 号楼）" maxlength="200">
                <template #prefix
                  ><el-icon><LocationInformation /></el-icon
                ></template>
              </el-input>
              <div class="field-hint">选好省市区后会自动预填地址前缀，补充街道门牌即可，例：合肥市高新区创新产业园 A 栋</div>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 模块2：招聘要求 -->
        <el-divider content-position="left">
          <span class="section-title"
            ><el-icon><Filter /></el-icon>招聘要求</span
          >
        </el-divider>
        <el-form-item label="薪资区间" prop="salaryMin">
          <div class="salary-field">
            <!-- 快捷薪资标签：一键填充常用区间(均按元/月口径)，减少手动输入误填 -->
            <div class="salary-quick">
              <el-tag
                v-for="q in salaryQuickOptions"
                :key="q.label"
                class="salary-quick-tag"
                :type="isSalaryQuickActive(q) ? 'primary' : 'info'"
                :effect="isSalaryQuickActive(q) ? 'dark' : 'plain'"
                @click="applySalaryQuick(q)"
                >{{ q.label }}</el-tag
              >
            </div>
            <div class="salary-inputs">
              <el-input-number
                v-model="editForm.salaryMin"
                :min="0"
                :max="9999999"
                :precision="0"
                controls-position="right"
                placeholder="最低"
                style="width: 150px"
                @change="revalidateSalary"
              />
              <span>至</span>
              <el-input-number
                v-model="editForm.salaryMax"
                :min="0"
                :max="9999999"
                :precision="0"
                controls-position="right"
                placeholder="最高"
                style="width: 150px"
                @change="revalidateSalary"
              />
              <el-select v-model="editForm.salaryUnit" style="width: 100px" @change="revalidateSalary">
                <el-option label="元/月" value="1" />
                <el-option label="元/天" value="0" />
                <el-option label="元/小时" value="3" />
                <el-option label="元/次" value="2" />
              </el-select>
            </div>
            <!-- 极低薪友好提示：不阻断提交，仅提醒会降低投递量 -->
            <div v-if="salaryTooLow" class="salary-tip">
              <el-icon><WarningFilled /></el-icon>
              薪资偏低会大幅降低简历投递量，建议调整到合理范围
            </div>
          </div>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="经验要求" prop="experience">
              <el-select v-model="editForm.experience" placeholder="请选择经验要求" clearable filterable style="width: 100%">
                <el-option v-for="opt in experienceOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="学历要求" prop="education">
              <el-select v-model="editForm.education" placeholder="请选择学历要求" clearable filterable style="width: 100%">
                <el-option v-for="opt in educationOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="招聘人数" prop="recruitNumber">
          <div class="recruit-field">
            <div class="recruit-quick">
              <!-- 招聘人数为单值，快捷标签填具体人数（不用 2-5 人区间，避免歧义） -->
              <el-tag
                v-for="n in recruitQuickOptions"
                :key="n"
                class="recruit-quick-tag"
                :type="editForm.recruitNumber === n ? 'primary' : 'info'"
                :effect="editForm.recruitNumber === n ? 'dark' : 'plain'"
                @click="applyRecruitQuick(n)"
                >{{ n }} 人</el-tag
              >
            </div>
            <div class="recruit-input">
              <!-- 去上下箭头(:controls=false)防误触，:precision=0 限正整数 -->
              <el-input-number
                v-model="editForm.recruitNumber"
                :min="1"
                :max="9999"
                :precision="0"
                :controls="false"
                style="width: 150px"
                @change="revalidateRecruit"
              />
              <span style="margin-left: 8px; color: #606266">人</span>
            </div>
          </div>
        </el-form-item>

        <!-- 工作时间（仅非全职展示）：兼职/临时工/项目制需采集工作时间类型与具体时间，全职不展示也不校验 -->
        <el-row v-if="isEditPartTime" :gutter="20" class="edit-work-time-row">
          <el-col :span="12">
            <el-form-item label="工作时间类型" prop="workTimeType" :required="isEditPartTime" label-width="126px">
              <el-select v-model="editForm.workTimeType" placeholder="请选择工作时间类型" clearable style="width: 100%">
                <el-option v-for="opt in workTimeTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="工作时间" prop="workTime" :required="isEditPartTime">
              <el-input v-model="editForm.workTime" placeholder="如：周一至周五 09:00-18:00，或 每周六日全天" maxlength="200" show-word-limit />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 模块3：岗位详情 -->
        <el-divider content-position="left" class="job-detail-divider">
          <span class="section-title"
            ><el-icon><Tickets /></el-icon>岗位详情</span
          >
        </el-divider>
        <el-form-item label="岗位描述" prop="description">
          <div class="desc-field">
            <!-- 模板快捷填充：生成「岗位职责/任职要求/福利待遇」三段式纯文本（非富文本，保持落库为纯文本）。
                 已有内容时二次确认，避免误覆盖。 -->
            <div class="desc-templates">
              <span class="desc-templates-label">模板：</span>
              <el-button v-for="t in descTemplates" :key="t.key" size="small" plain @click="applyDescTemplate(t)">{{ t.label }}</el-button>
            </div>
            <el-input
              v-model="editForm.description"
              type="textarea"
              :rows="6"
              :placeholder="descriptionPlaceholder"
              maxlength="2000"
              show-word-limit
            />
          </div>
        </el-form-item>
        <!-- 岗位福利：小程序端为 JSON 数组串、B 端 PC 为纯文本，此处原样回显/原样保存不做转换，避免破坏来源格式 -->
        <el-form-item label="岗位福利">
          <div class="benefit-field">
            <!-- 快捷福利标签：点击把标签文字以「、」追加进纯文本框，不改变 benefits 的纯文本存储口径 -->
            <div class="benefit-quick">
              <el-tag v-for="b in benefitQuickOptions" :key="b" class="benefit-quick-tag" type="success" effect="plain" @click="appendBenefit(b)"
                >+ {{ b }}</el-tag
              >
            </div>
            <el-input
              v-model="editForm.benefits"
              type="textarea"
              :rows="3"
              placeholder="选填：如五险一金、餐补、年终奖、弹性工作等"
              maxlength="500"
              show-word-limit
            />
          </div>
        </el-form-item>
        <el-form-item label="团队介绍">
          <el-input
            v-model="editForm.teamIntro"
            type="textarea"
            :rows="3"
            placeholder="选填：介绍团队规模、氛围、技术栈等"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="附加条件">
          <el-input
            v-model="editForm.additionalConditions"
            type="textarea"
            :rows="3"
            placeholder="选填：任职附加条件（如需自带工具、接受出差、持有相关证书等）"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="editForm.remark" type="textarea" :rows="2" placeholder="运营备注（选填）" maxlength="200" show-word-limit />
        </el-form-item>

        <!-- 内联审核：仅待审核(0)岗位展示。通过=上架(status 1)，驳回=独立驳回态(status 6，原因必填，将告知企业) -->
        <template v-if="editJobStatus === '0'">
          <el-divider content-position="left">
            <span class="section-title"
              ><el-icon><CircleCheck /></el-icon>岗位审核</span
            >
          </el-divider>
          <el-form-item label="审核结果">
            <el-radio-group v-model="editAuditForm.status">
              <el-radio label="1">通过（上架）</el-radio>
              <el-radio label="6">驳回</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item :label="editAuditForm.status === '6' ? '驳回原因' : '审核备注'" :required="editAuditForm.status === '6'">
            <el-input
              v-model="editAuditForm.remark"
              type="textarea"
              :rows="2"
              :placeholder="editAuditForm.status === '6' ? '请填写驳回原因（必填，将告知企业）' : '审核备注（选填）'"
              maxlength="200"
            />
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <!-- 待审核岗位：保存与审核分开两按钮；其余状态仅保存 -->
        <template v-if="editJobStatus === '0'">
          <el-button :loading="editSubmitting" @click="submitEdit">仅保存</el-button>
          <el-button type="primary" :loading="editSubmitting" @click="submitEditAndAudit">保存并审核</el-button>
        </template>
        <el-button v-else type="primary" :loading="editSubmitting" @click="submitEdit">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="handleSelectApplyUsersVisible" title="投递人员" width="85%" append-to-body>
      <!-- ========== 数据表格 ========== -->
      <el-table :data="SelectApplyUsertableData" border stripe>
        <el-table-column label="投递编码" prop="applyNo" width="180" align="center" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.applyNo || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="求职者信息" min-width="160">
          <template #default="{ row }">
            <div class="user-cell">
              <el-avatar :size="34" :src="candidateAvatarSrc(row)" style="background: #2b7fff; flex-shrink: 0">
                {{ (row.userName || 'U').charAt(0) }}
              </el-avatar>
              <div class="user-detail">
                <div class="name">{{ row.userName || '未知用户' }}</div>
                <div class="phone">{{ displayPhone(row) }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="岗位信息" min-width="150">
          <template #default="{ row }">
            <div class="job-cell">
              <div class="job-name">{{ row.jobName || row.jobNo || '-' }}</div>
              <div class="salary">{{ formatSalary(row.salaryMin, row.salaryMax, row.salaryUnit) }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="投递时间" prop="applyTime" width="160" align="center" />
        <el-table-column label="状态" width="150" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.status === '0'" :type="row.isRead === '0' ? 'warning' : 'info'" size="small">
              {{ row.isRead === '0' ? '新投递' : '已投递' }}
            </el-tag>
            <el-tag v-else-if="row.status === '1'" type="primary" size="small">面试邀请</el-tag>
            <el-tag v-else-if="row.status === '2'" type="success" size="small">已录用</el-tag>
            <el-tag v-else type="danger" size="small">已拒绝</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="已读" width="150" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.isRead === '1'" type="success" size="small">已读</el-tag>
            <el-tag v-else type="warning" size="small">未读</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="联系方式" width="150" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.exchangeStatus === 'accepted' || row.exchangeStatus === 'exchanged'" type="success" size="small">已交换</el-tag>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" fixed="right" align="center">
          <template #default="{ row }">
            <div style="display: flex; align-items: center; justify-content: center; gap: 8px">
              <el-button link type="primary" icon="View" @click="handleDetail(row)">详情</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <pagination
          v-show="total1 > 0"
          v-model:page="queryParams1.pageNum"
          v-model:limit="queryParams1.pageSize"
          :total="total1"
          @pagination="loadData1"
        />
      </template>
    </el-dialog>

    <el-dialog v-model="nanjingTagVisible" title="南京产业标签" width="680px" append-to-body destroy-on-close>
      <div v-loading="nanjingTagLoading">
        <el-alert
          title="标签仅保存到独立标签库，不会修改岗位内容、状态或现有推荐结果"
          type="info"
          :closable="false"
          show-icon
          class="mb-4"
        />
        <el-descriptions :column="2" border class="mb-4">
          <el-descriptions-item label="岗位名称">{{ nanjingTagJob?.jobName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="岗位编码">{{ nanjingTagJob?.jobNo || '-' }}</el-descriptions-item>
        </el-descriptions>

        <el-checkbox-group v-if="nanjingTagOptions.length" v-model="selectedNanjingTagIds" class="nanjing-tag-groups">
          <section v-if="nanjingRegionTags.length" class="nanjing-tag-group">
            <div class="nanjing-tag-group__title">南京产业片区</div>
            <div class="nanjing-tag-options">
              <el-checkbox v-for="tag in nanjingRegionTags" :key="tag.tagId" :value="tag.tagId" border>
                {{ tag.tagName }}
              </el-checkbox>
            </div>
          </section>
          <section v-if="nanjingIndustryTags.length" class="nanjing-tag-group">
            <div class="nanjing-tag-group__title">产业赛道</div>
            <div class="nanjing-tag-options">
              <el-checkbox v-for="tag in nanjingIndustryTags" :key="tag.tagId" :value="tag.tagId" border>
                {{ tag.tagName }}
              </el-checkbox>
            </div>
          </section>
        </el-checkbox-group>
        <el-empty v-else-if="!nanjingTagLoading" description="暂无可用标签" />
      </div>
      <template #footer>
        <el-button @click="nanjingTagVisible = false">取消</el-button>
        <el-button type="primary" :loading="nanjingTagSubmitting" @click="submitNanjingTags">保存标签</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="JobManagement" lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  listJob,
  listNanjingIndustryTags,
  getJobNanjingIndustryTags,
  updateJobNanjingIndustryTags,
  getJobStatistics,
  getJobFullDetail,
  auditJob,
  changeJobStatus,
  delJob,
  updateJob,
  updateJobSettlementIntent,
  refreshJobRecommendCache,
  listApply2,
  listApply,
  listInvoiceManage
} from '@/api/recruitment';
import type { InvoiceManageVO, JobFullVO, NanjingIndustryTagOptionVO } from '@/api/recruitment';
import { getBizNoChainByCompanyId, type BizNoChainVO } from '@/api/recruitment/serialRule';
import { download } from '@/utils/request';
import { REGIONS } from '@/utils/region-data';
import { unwrapList, formatSalary, formatMoney } from './helpers';
import { invoiceStatusMeta, jobStatusMeta, jobTypeMeta } from './constants';
import JobPositionPicker from './components/JobPositionPicker.vue';

const router = useRouter();
const route = useRoute();
const loading = ref(false);
const refreshing = ref(false);
const total = ref(0);
const total1 = ref(0);
const tableData = ref<any[]>([]);
const SelectApplyUsertableData = ref<any[]>([]);
const detailVisible = ref(false);
const auditVisible = ref(false);
const handleSelectApplyUsersVisible = ref(false);
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
const settlementLeadInvoices = ref<InvoiceManageVO[]>([]);
let jobChangedRefreshTimer: ReturnType<typeof setTimeout> | undefined;
let lastJobChangedEventKey = '';

// 当前查看的岗位完整字段（数据来源：GET /admin/recruitment/jobDetail/{jobId} → JobFullVO）
const currentJob = ref<JobFullVO | null>(null);
const detailLoading = ref(false);
const queryFormRef = ref();
const auditFormRef = ref();
const dateRange = ref<[string, string] | []>([]);
const showMoreQuery = ref(false);
const nanjingTagVisible = ref(false);
const nanjingTagLoading = ref(false);
const nanjingTagSubmitting = ref(false);
const nanjingTagJob = ref<any | null>(null);
const nanjingTagOptions = ref<NanjingIndustryTagOptionVO[]>([]);
const selectedNanjingTagIds = ref<Array<number | string>>([]);
const nanjingRegionTags = computed(() => nanjingTagOptions.value.filter((tag) => tag.tagType === 'REGION'));
const nanjingIndustryTags = computed(() => nanjingTagOptions.value.filter((tag) => tag.tagType === 'INDUSTRY'));

/** 打开独立标签弹窗；不复用岗位编辑提交，避免触碰现有岗位业务字段。 */
async function handleNanjingTags(row: any) {
  nanjingTagJob.value = row;
  selectedNanjingTagIds.value = [];
  nanjingTagVisible.value = true;
  nanjingTagLoading.value = true;
  try {
    const [tagRes, assignmentRes] = await Promise.all([
      listNanjingIndustryTags(),
      getJobNanjingIndustryTags(row.jobId)
    ]);
    nanjingTagOptions.value = tagRes.data || [];
    selectedNanjingTagIds.value = assignmentRes.data?.tagIds || [];
  } catch (error) {
    nanjingTagVisible.value = false;
    ElMessage.error('南京产业标签加载失败');
  } finally {
    nanjingTagLoading.value = false;
  }
}

async function submitNanjingTags() {
  const jobId = nanjingTagJob.value?.jobId;
  if (!jobId) return;
  nanjingTagSubmitting.value = true;
  try {
    await updateJobNanjingIndustryTags(jobId, selectedNanjingTagIds.value);
    ElMessage.success('南京产业标签保存成功');
    nanjingTagVisible.value = false;
  } catch (error) {
    ElMessage.error('南京产业标签保存失败');
  } finally {
    nanjingTagSubmitting.value = false;
  }
}

function parseMaybeJson(value?: unknown): unknown {
  if (typeof value !== 'string') return value;
  const text = value.trim();
  if (!text) return '';
  if (!/^[\[{"]/.test(text)) return value;
  try {
    return JSON.parse(text);
  } catch {
    return value;
  }
}

function primitiveText(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(primitiveText).filter(Boolean).join('\n');
  if (typeof value === 'object') {
    const item = value as Record<string, unknown>;
    const direct = item.label ?? item.name ?? item.title ?? item.text ?? item.content ?? item.value ?? item.desc ?? item.description;
    if (direct != null) return primitiveText(direct);
    const values = Object.values(item).map(primitiveText).filter(Boolean);
    return values.join(' ');
  }
  return '';
}

function splitDetailTags(text: string): string[] {
  return text
    .split(/[、,，;；\n\r]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function normalizeDetailTags(value?: unknown): string[] {
  const parsed = parseMaybeJson(value);
  if (Array.isArray(parsed)) {
    return parsed.map(primitiveText).flatMap(splitDetailTags).filter(Boolean);
  }
  const text = primitiveText(parsed);
  return text ? splitDetailTags(text) : [];
}

function normalizeDetailBreaks(text: string): string {
  return text
    .replace(/\\r\\n|\\n|\\r/g, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n')
    .replace(/<\/div>\s*<div[^>]*>/gi, '\n')
    .replace(/<\/li>\s*<li[^>]*>/gi, '\n')
    .replace(/<\/?(p|div|span|section|ul|ol|li|strong|b|em)[^>]*>/gi, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function normalizeDetailText(value?: unknown, fallback = '暂无'): string {
  const parsed = parseMaybeJson(value);
  const text = normalizeDetailBreaks(primitiveText(parsed))
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return text || fallback;
}

function formatWorkTimeItem(value: unknown): string {
  if (value == null) return '';
  if (typeof value !== 'object' || Array.isArray(value)) return primitiveText(value);
  const item = value as Record<string, unknown>;
  const direct = item.label ?? item.name ?? item.title ?? item.text ?? item.content ?? item.value;
  if (direct != null) return primitiveText(direct);
  const day = primitiveText(item.day ?? item.week ?? item.date);
  const start = primitiveText(item.start ?? item.startTime ?? item.from);
  const end = primitiveText(item.end ?? item.endTime ?? item.to);
  const range = start || end ? `${start}${start && end ? '-' : ''}${end}` : '';
  return `${day}${day && range ? ' ' : ''}${range}`.trim() || primitiveText(value);
}

function cleanDetailText(value: unknown): string {
  return String(value ?? '').trim();
}

function normalizeDisplayText(value: unknown): string {
  const text = cleanDetailText(value);
  return text && !['-', '暂无', '未知', 'null', 'undefined'].includes(text) ? text : '';
}

function normalizeDateTimeText(value: unknown): string {
  return String(value ?? '').trim();
}

function mergeJobDetail(row: Partial<JobFullVO>, detail?: Partial<JobFullVO> | null): JobFullVO {
  const merged = { ...row, ...(detail || {}) } as JobFullVO;
  // 详情接口当前未稳定返回 createTime；列表行有值时保留列表值，避免详情空字段把时间冲掉。
  merged.createTime = normalizeDateTimeText(detail?.createTime) || normalizeDateTimeText(row.createTime);
  merged.publishTime = normalizeDateTimeText(detail?.publishTime) || normalizeDateTimeText(row.publishTime);
  return merged;
}

function jobCategoryText(job?: JobFullVO | null): string {
  const category = normalizeDisplayText(job?.categoryName) || normalizeDisplayText(job?.category);
  const position = normalizeDisplayText(job?.positionName);
  const seen = new Set<string>();
  const parts = [category, position].filter((item) => {
    if (!item || seen.has(item)) return false;
    seen.add(item);
    return true;
  });
  return parts.join(' / ') || '-';
}

function jobRegionText(job?: JobFullVO | null): string {
  if (!job) return '-';
  if (job.regionScope === 'nationwide') return '全国';
  return [job.province, job.city, job.district].map(cleanDetailText).filter(Boolean).join(' / ') || '-';
}

// 工作时间：不同发布入口可能返回 JSON 数组、对象数组或纯文本，这里统一转成标签文案。
const workTimeList = computed<string[]>(() => {
  const raw = currentJob.value?.workTime;
  const parsed = parseMaybeJson(raw);
  if (Array.isArray(parsed)) {
    return parsed.map(formatWorkTimeItem).filter(Boolean);
  }
  const text = formatWorkTimeItem(parsed);
  return text ? [text] : [];
});

// 岗位福利：兼容 JSON 数组、对象数组和 B 端纯文本，统一拆成标签展示。
const benefitsList = computed<string[]>(() => normalizeDetailTags(currentJob.value?.benefits));
const detailHighlights = computed(() => normalizeDetailText(currentJob.value?.highlights));
const detailDescription = computed(() => normalizeDetailText(currentJob.value?.description, '暂无描述'));
const detailTeamIntro = computed(() => normalizeDetailText(currentJob.value?.teamIntro));
const detailAdditionalConditions = computed(() => normalizeDetailText(currentJob.value?.additionalConditions));
const detailPublishTime = computed(() => normalizeDateTimeText(currentJob.value?.publishTime) || '-');
const detailCreateTime = computed(() => {
  const createTime = normalizeDateTimeText(currentJob.value?.createTime);
  const publishTime = normalizeDateTimeText(currentJob.value?.publishTime);
  return createTime && createTime !== publishTime ? createTime : '';
});

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

function isComplianceSettlement(row: any) {
  return canShowSettlementIntent(row) && String(row?.settlementIntentType || '') === '3';
}

function isPendingSettlementLead(row: any) {
  return !!row?.settlementIntentId && String(row?.settlementFollowStatus || '') === '0';
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

function jobRowClassName({ row }: { row: any }) {
  return isComplianceSettlement(row) ? 'settlement-compliance-row' : '';
}

function settlementLeadJobTypeText(row: any) {
  return row?.jobTypeName || jobTypeMeta(row?.jobType).label;
}

function settlementLeadSalaryText(row: any) {
  return row?.salary || formatSalary(row?.salaryMin, row?.salaryMax, row?.salaryUnit);
}

function settlementLeadLocationText(row: any) {
  const region = [row?.province, row?.city, row?.district].filter(Boolean).join(' / ');
  return row?.workAddress || row?.location || region;
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

function settlementLeadInvoiceSummary() {
  if (!settlementLead.value?.orderNo && !settlementLead.value?.ledgerId) return '生成台账后再跟进发票';
  if (!settlementLeadInvoices.value.length) return '暂无关联发票';
  const totalAmount = settlementLeadInvoices.value.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  return `${settlementLeadInvoices.value.length} 张 / ¥${formatMoney(totalAmount)}`;
}

function settlementLeadInvoiceDetailText() {
  if (!settlementLead.value?.orderNo && !settlementLead.value?.ledgerId) return '生成台账后再跟进发票';
  if (!settlementLeadInvoices.value.length) return '暂无关联发票';
  return settlementLeadInvoices.value
    .map((item) => {
      const status = invoiceStatusMeta(item.status).label;
      const amount = item.amount != null ? `¥${formatMoney(item.amount)}` : '金额-';
      return `${item.invoiceNo || '未编号发票'} / ${status} / ${amount}`;
    })
    .join('\n');
}

async function loadSettlementLeadInvoices(chain?: BizNoChainVO | null) {
  settlementLeadInvoices.value = [];
  if (!chain?.orderNo && !chain?.ledgerId) return;
  try {
    const res = await listInvoiceManage({
      pageNum: 1,
      pageSize: 100,
      ledgerId: chain.ledgerId,
      ledgerOrderNo: chain.orderNo,
      orderNo: chain.orderNo
    });
    settlementLeadInvoices.value = unwrapList<InvoiceManageVO>(res).rows;
  } catch (error) {
    settlementLeadInvoices.value = [];
    console.warn('线索关联发票加载失败', error);
  }
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
        { label: '用工性质', value: settlementLeadJobTypeText(context) },
        { label: '服务意向', value: settlementIntentMeta(context?.settlementIntentType).label },
        { label: '线索状态', value: settlementLeadFollowStatusText(context) },
        { label: '薪资范围', value: settlementLeadSalaryText(context) },
        { label: '工作地点', value: settlementLeadLocationText(context) },
        { label: '招聘人数', value: context?.recruitNumber },
        { label: '投递人数', value: context?.applyCount },
        { label: '发布时间', value: normalizeDateTimeText(context?.publishTime) },
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
      desc: settlementLeadMoneyText(chain.orderAmount),
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
        { label: '服务意向', value: settlementLabel },
        { label: '开票跟进', value: settlementLeadInvoiceSummary() }
      ]
    },
    {
      key: 'invoice',
      title: '发票',
      code: settlementLeadInvoices.value.length ? `${settlementLeadInvoices.value.length} 张` : '',
      desc: settlementLeadInvoiceSummary(),
      done: settlementLeadInvoices.value.length > 0,
      emptyText: chain.orderNo || chain.ledgerId ? '暂无发票' : '待生成台账',
      details: [
        { label: '关联台账', value: chain.orderNo },
        { label: '发票概览', value: settlementLeadInvoiceSummary() },
        { label: '发票明细', value: settlementLeadInvoiceDetailText() }
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

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  jobNo: '',
  jobName: '',
  jobType: '',
  status: '',
  companyName: '',
  isRecommend: '',
  isHot: '',
  workAddress: '',
  applyCount: undefined as number | undefined
});

const queryParams1 = reactive({
  pageNum: 1,
  pageSize: 10,
  // 投递人员弹窗的岗位过滤条件：保存原始雪花ID（字符串），不可转 Number
  jobId: undefined as string | number | undefined,
  jobName: '',
  jobType: '',
  status: '',
  companyName: '',
  isRecommend: '',
  isHot: ''
});
const statistics = reactive({
  totalCount: 0,
  pendingCount: 0,
  onlineCount: 0,
  offlineCount: 0
});

const auditForm = reactive({
  jobId: 0,
  status: '1',
  remark: ''
});

// ===== 岗位编辑 =====
const editVisible = ref(false);
const editLoading = ref(false); // 打开弹窗拉取全量详情时的回显 loading
const editSubmitting = ref(false); // 保存提交中，驱动按钮等待动画防重复提交
const editFormRef = ref();

const editForm = reactive({
  jobId: undefined as number | string | undefined,
  jobName: '',
  positionId: '' as number | string | '',
  positionName: '',
  jobType: '0',
  categoryId: '' as number | string | '',
  category: '',
  regionPath: [] as string[],
  regionScope: '',
  province: '',
  city: '',
  district: '',
  salaryMin: undefined as number | undefined,
  salaryMax: undefined as number | undefined,
  salaryUnit: '1',
  workAddress: '',
  experience: '',
  education: '',
  recruitNumber: undefined as number | undefined,
  workTime: '', // 工作时间（仅非全职）
  workTimeType: '', // 工作时间类型（仅非全职）
  description: '',
  benefits: '',
  teamIntro: '',
  additionalConditions: '',
  remark: ''
});

// 非全职：jobType 不为 '0' 时需采集工作时间相关字段（与 B 端发布表单口径一致）
const isEditPartTime = computed(() => editForm.jobType !== '0');

// 编辑弹窗内联审核：仅当被编辑岗位为「待审核(0)」时展示审核区与「保存并审核」按钮。
const editJobStatus = ref('');
const editAuditForm = reactive({
  status: '1', // 审核结果：'1' 通过(上架) / '6' 驳回
  remark: '' // 驳回原因（驳回必填）/ 审核备注
});

// 工作时间类型（仅非全职展示）
const workTimeTypeOptions = [
  { value: '0', label: '固定班次' },
  { value: '1', label: '排班/轮班' },
  { value: '2', label: '弹性时间' },
  { value: '3', label: '按需/临时' }
];

// 经验要求 0-4 / 学历要求 0-7：口径与 B 端发布表单一致
const experienceOptions = [
  { value: '0', label: '经验不限' },
  { value: '1', label: '应届/1年以内' },
  { value: '2', label: '1-3年' },
  { value: '3', label: '3-5年' },
  { value: '4', label: '5年以上' }
];

const educationOptions = [
  { value: '0', label: '学历不限' },
  { value: '1', label: '初中及以下' },
  { value: '2', label: '高中' },
  { value: '3', label: '中专/技校' },
  { value: '4', label: '大专' },
  { value: '5', label: '本科' },
  { value: '6', label: '硕士' },
  { value: '7', label: '博士' }
];

// 用工性质：块状单选卡片选项，value 口径与 jobType(0全职/1兼职/2临时工/3项目制)一致
const jobTypeOptions = [
  { value: '0', label: '全职' },
  { value: '1', label: '兼职' },
  { value: '2', label: '临时工' },
  { value: '3', label: '项目制' }
];

// 选中用工性质卡片：程序赋值不会触发 rule 的 change 校验，手动 validateField 清除红框
function selectJobType(v: string) {
  editForm.jobType = v;
  editFormRef.value?.validateField?.('jobType');
}

// 快捷薪资标签：固定按「元/月」(salaryUnit=1)填充常用区间，点击即覆盖最低/最高并切回月薪
const salaryQuickOptions = [
  { label: '3k-5k', min: 3000, max: 5000 },
  { label: '5k-8k', min: 5000, max: 8000 },
  { label: '8k-12k', min: 8000, max: 12000 },
  { label: '12k-20k', min: 12000, max: 20000 }
];

function applySalaryQuick(q: { min: number; max: number }) {
  editForm.salaryMin = q.min;
  editForm.salaryMax = q.max;
  editForm.salaryUnit = '1';
  revalidateSalary();
}

// 高亮当前与已填值匹配的快捷标签（仅月薪口径下比较）
function isSalaryQuickActive(q: { min: number; max: number }): boolean {
  return editForm.salaryUnit === '1' && editForm.salaryMin === q.min && editForm.salaryMax === q.max;
}

// 薪资任一输入或单位变化时，重新校验 salaryMin 规则，使「最低>最高」实时标红
function revalidateSalary() {
  editFormRef.value?.validateField?.('salaryMin');
}

// 极低薪提示阈值：按单位区分合理下限，低于阈值给出友好提醒（不阻断提交）
const salaryLowThreshold: Record<string, number> = {
  '1': 1000, // 元/月
  '0': 50, // 元/天
  '3': 10, // 元/小时
  '2': 10 // 元/次
};

const salaryTooLow = computed<boolean>(() => {
  const min = editForm.salaryMin;
  if (min == null || min <= 0) return false;
  const threshold = salaryLowThreshold[editForm.salaryUnit] ?? 1000;
  return min < threshold;
});

// 岗位描述分段引导：用换行占位提示 HR 按「职责/要求/福利」三段填写
const descriptionPlaceholder = ['【岗位职责】', '1. ', '', '【任职要求】', '1. ', '', '【福利待遇】', '1. '].join('\n');

// 招聘人数快捷标签：单值填充（不用区间避免歧义），点击后重校验清红框
const recruitQuickOptions = [1, 2, 5, 10];
function applyRecruitQuick(n: number) {
  editForm.recruitNumber = n;
  revalidateRecruit();
}
function revalidateRecruit() {
  editFormRef.value?.validateField?.('recruitNumber');
}

// 岗位描述模板：三段式纯文本（非富文本，保持 description 落库为纯文本）。已有内容时二次确认再覆盖。
const descTemplates = [
  {
    key: 'tech',
    label: '技术岗模板',
    text: [
      '一、岗位职责',
      '1. 负责核心模块的设计、开发与维护；',
      '2. 参与技术方案评审，保障代码质量与系统稳定性；',
      '3. 配合团队完成需求迭代与线上问题排查。',
      '',
      '二、任职要求',
      '1. 计算机相关专业，扎实的数据结构与算法基础；',
      '2. 熟悉主流开发框架，有良好的编码习惯；',
      '3. 具备较强的学习能力与团队协作意识。',
      '',
      '三、员工福利',
      '五险一金、双休、年终奖、定期团建、技术成长体系。'
    ].join('\n')
  },
  {
    key: 'sales',
    label: '销售岗模板',
    text: [
      '一、岗位职责',
      '1. 负责目标客户开发与维护，完成销售业绩指标；',
      '2. 挖掘客户需求，制定并推进销售方案；',
      '3. 维护客户关系，提升客户满意度与复购率。',
      '',
      '二、任职要求',
      '1. 具备良好的沟通表达与谈判能力；',
      '2. 有销售相关经验者优先，结果导向、抗压能力强；',
      '3. 认同公司文化，有强烈的目标达成意愿。',
      '',
      '三、员工福利',
      '底薪 + 高提成、五险一金、双休、销售冠军激励。'
    ].join('\n')
  },
  {
    key: 'function',
    label: '职能岗模板',
    text: [
      '一、岗位职责',
      '1. 负责本职能模块的日常运转与流程执行；',
      '2. 协同各部门推进工作落地，输出阶段性成果；',
      '3. 持续优化工作流程，提升协作效率。',
      '',
      '二、任职要求',
      '1. 相关专业背景，工作细致、责任心强；',
      '2. 熟练使用办公软件，具备良好的统筹能力；',
      '3. 沟通顺畅，能适应多任务并行的工作节奏。',
      '',
      '三、员工福利',
      '五险一金、双休、节日福利、带薪年假。'
    ].join('\n')
  }
];

async function applyDescTemplate(t: { text: string }) {
  if (editForm.description && editForm.description.trim()) {
    try {
      await ElMessageBox.confirm('当前已有岗位描述，套用模板会覆盖现有内容，是否继续？', '提示', {
        confirmButtonText: '覆盖',
        cancelButtonText: '取消',
        type: 'warning'
      });
    } catch {
      return; // 取消则不覆盖
    }
  }
  editForm.description = t.text;
  editFormRef.value?.validateField?.('description');
}

// 福利快捷标签：以「、」追加进纯文本福利框，已存在则忽略，不改变 benefits 纯文本存储口径
const benefitQuickOptions = ['五险一金', '双休', '年终奖', '弹性工作制', '带薪年假', '餐补', '交通补贴', '定期体检'];
function appendBenefit(b: string) {
  const cur = (editForm.benefits || '').trim();
  // 已含该福利（按中英文逗号/顿号切分判断）则不重复追加
  const exists = cur
    .split(/[、,，]/)
    .map((s) => s.trim())
    .includes(b);
  if (exists) return;
  editForm.benefits = cur ? `${cur}、${b}` : b;
}

// 运营后台编辑岗位同样使用三级联动数据源，地区字段只由 cascader 拆分生成。
const NATIONAL_REGION_VALUE = '__nationwide__';
const regionOptions = [
  { label: '全国', value: NATIONAL_REGION_VALUE },
  ...REGIONS.map((province: any) => ({
    label: province.name,
    value: province.name,
    children: (province.cities || []).map((city: any) => ({
      label: city.name,
      value: city.name,
      children: (city.areas || []).map((area: string) => ({
        label: area,
        value: area
      }))
    }))
  }))
];

interface StandardPositionPick {
  positionId?: number | string;
  positionName?: string;
  categoryId?: number | string;
  categoryName?: string;
  name?: string;
  category?: string;
}

// 编辑弹窗同样选择 positions 叶子，避免只保存二级类目而丢失标准职位。
function selectEditStandardPosition(position: StandardPositionPick) {
  const previousPositionName = String(editForm.positionName || '');
  const nextPositionName = String(position?.positionName || position?.name || '');
  editForm.positionId = position?.positionId != null ? String(position.positionId) : '';
  editForm.positionName = nextPositionName;
  editForm.categoryId = position?.categoryId != null ? String(position.categoryId) : '';
  editForm.category = String(position?.categoryName || position?.category || '');
  if (nextPositionName && (!editForm.jobName.trim() || editForm.jobName.trim() === previousPositionName)) {
    editForm.jobName = nextPositionName;
  }
  editFormRef.value?.validateField?.('category');
  editFormRef.value?.validateField?.('jobName');
}

function applyEditPositionSnapshot(positionId: unknown, positionName: unknown, categoryId: unknown, categoryText: unknown) {
  editForm.positionId = positionId != null ? String(positionId) : '';
  editForm.positionName = String(positionName || '');
  editForm.categoryId = categoryId != null ? String(categoryId) : '';
  editForm.category = String(categoryText || '');
}

function validateEditStandardPosition(_rule: unknown, _value: unknown, callback: (error?: Error) => void) {
  if (editForm.positionId && editForm.positionName && editForm.categoryId && editForm.category) {
    callback();
    return;
  }
  callback(new Error('请选择标准职位'));
}

const editRules = {
  jobName: [{ required: true, message: '请输入岗位名称', trigger: 'blur' }],
  jobType: [{ required: true, message: '请选择用工性质', trigger: 'change' }],
  category: [{ required: true, validator: validateEditStandardPosition, trigger: 'change' }],
  // 至少选到省即可（min:1）：配合 checkStrictly 支持「全省/全市」类部分路径岗位的回显与保存，不强制必须到区县
  regionPath: [{ required: true, type: 'array', min: 1, message: '请至少选择省份', trigger: 'change' }],
  workAddress: [{ required: true, message: '请输入工作地点', trigger: 'blur' }],
  experience: [{ required: true, message: '请选择经验要求', trigger: 'change' }],
  education: [{ required: true, message: '请选择学历要求', trigger: 'change' }],
  recruitNumber: [{ required: true, message: '请输入招聘人数', trigger: 'change' }],
  // 工作时间相关：仅非全职(isEditPartTime)时必填，全职跳过
  workTimeType: [
    {
      validator: (_rule: any, value: any, callback: (e?: Error) => void) => {
        if (isEditPartTime.value && !value) callback(new Error('请选择工作时间类型'));
        else callback();
      },
      trigger: 'change'
    }
  ],
  workTime: [
    {
      validator: (_rule: any, value: any, callback: (e?: Error) => void) => {
        if (isEditPartTime.value && !value) callback(new Error('请描述具体工作时间'));
        else callback();
      },
      trigger: 'blur'
    }
  ],
  description: [{ required: true, message: '请输入岗位描述', trigger: 'blur' }],
  salaryMin: [
    {
      required: true,
      validator: (_rule: any, _value: any, callback: (err?: Error) => void) => {
        if (editForm.salaryMin == null || editForm.salaryMax == null) {
          callback(new Error('请填写完整薪资区间'));
        } else if (Number(editForm.salaryMax) < Number(editForm.salaryMin)) {
          callback(new Error('最高薪资不能低于最低薪资'));
        } else {
          callback();
        }
      },
      trigger: 'change'
    }
  ]
};

// 薪资单位归一：编辑提交只发新契约 0天/1月/2次/3小时。
function normalizeSalaryUnit(u?: string): string {
  const unit = String(u || '').trim();
  const codeMap: Record<string, string> = {
    '0': '0',
    '1': '1',
    '2': '2',
    '3': '3'
  };
  return codeMap[unit] || '1';
}

// 打开编辑：拉全量详情回显（列表行字段不全，缺 salaryMin/Max/recruitNumber/description 等）
async function handleEdit(row: any) {
  editVisible.value = true;
  editLoading.value = true;
  try {
    const res = await getJobFullDetail(row.jobId);
    const d: any = res.data || {};
    editForm.jobId = d.jobId ?? row.jobId;
    editForm.jobName = d.jobName || d.positionName || '';
    editForm.jobType = d.jobType != null ? String(d.jobType) : '0';
    applyEditPositionSnapshot(d.positionId, d.positionName, d.categoryId, d.categoryName || d.category);
    editForm.province = d.province ?? '';
    editForm.city = d.city ?? '';
    editForm.district = d.district ?? '';
    editForm.regionScope = d.regionScope || '';
    editForm.regionPath =
      d.regionScope === 'nationwide' || (!d.province && !d.city && !d.district && d.workAddress === '全国')
        ? [NATIONAL_REGION_VALUE]
        : [d.province, d.city, d.district].filter(Boolean);
    editForm.salaryMin = d.salaryMin ?? undefined;
    editForm.salaryMax = d.salaryMax ?? undefined;
    editForm.salaryUnit = normalizeSalaryUnit(d.salaryUnit);
    editForm.workAddress = d.workAddress || '';
    editForm.experience = d.experience != null ? String(d.experience) : '';
    editForm.education = d.education != null ? String(d.education) : '';
    editForm.recruitNumber = d.recruitNumber ?? undefined;
    editForm.workTime = d.workTime ?? '';
    editForm.workTimeType = d.workTimeType != null ? String(d.workTimeType) : '';
    editForm.description = d.description ?? '';
    editForm.benefits = d.benefits ?? '';
    editForm.teamIntro = d.teamIntro ?? '';
    editForm.additionalConditions = d.additionalConditions ?? '';
    editForm.remark = d.remark ?? '';
    // 内联审核：记录当前岗位状态，重置审核选项（默认通过）
    editJobStatus.value = d.status != null ? String(d.status) : '';
    editAuditForm.status = '1';
    editAuditForm.remark = '';
    editFormRef.value?.clearValidate?.();
  } catch (error) {
    ElMessage.error('获取岗位详情失败');
    editVisible.value = false;
  } finally {
    editLoading.value = false;
  }
}

// 组装编辑提交 payload：只提交结构化地区、薪资和 workAddress；工作时间仅非全职随单下发。
function buildEditPayload() {
  syncEditRegionFromPath();
  const payload: any = {
    jobId: editForm.jobId,
    jobName: editForm.jobName,
    positionId: editForm.positionId || undefined,
    positionName: editForm.positionName || undefined,
    jobType: editForm.jobType,
    categoryId: editForm.categoryId || undefined,
    categoryName: editForm.category,
    category: editForm.category,
    province: editForm.province,
    city: editForm.city,
    district: editForm.district,
    regionScope: editForm.regionScope,
    salaryMin: editForm.salaryMin,
    salaryMax: editForm.salaryMax,
    salaryUnit: editForm.salaryUnit,
    workAddress: editForm.workAddress,
    experience: editForm.experience,
    education: editForm.education,
    recruitNumber: editForm.recruitNumber,
    description: editForm.description,
    benefits: editForm.benefits,
    teamIntro: editForm.teamIntro,
    additionalConditions: editForm.additionalConditions,
    remark: editForm.remark || undefined
  };
  if (isEditPartTime.value) {
    payload.workTime = editForm.workTime;
    payload.workTimeType = editForm.workTimeType;
  }
  return payload;
}

// 仅保存编辑（不改状态）
async function submitEdit() {
  editFormRef.value?.validate(async (valid: boolean) => {
    if (!valid) return;
    editSubmitting.value = true;
    try {
      await updateJob(buildEditPayload());
      ElMessage.success('保存成功');
      editVisible.value = false;
      loadData();
    } catch (error) {
      ElMessage.error('保存失败');
    } finally {
      editSubmitting.value = false;
    }
  });
}

// 保存并审核（仅待审核岗位）：先保存编辑，再提交审核结果（通过上架=1 / 驳回=6）。
// 驳回必须填原因，与独立审核弹窗口径一致（写入 Job.remark 经 /job/audit）。
async function submitEditAndAudit() {
  if (editAuditForm.status === '6' && !editAuditForm.remark.trim()) {
    ElMessage.warning('驳回岗位请填写驳回原因');
    return;
  }
  editFormRef.value?.validate(async (valid: boolean) => {
    if (!valid) return;
    editSubmitting.value = true;
    try {
      await updateJob(buildEditPayload());
      await auditJob({ jobId: editForm.jobId as number, status: editAuditForm.status, remark: editAuditForm.remark.trim() || undefined });
      ElMessage.success(editAuditForm.status === '1' ? '已保存并通过上架' : '已保存并驳回');
      editVisible.value = false;
      loadData();
      loadStatistics();
    } catch (error) {
      ElMessage.error('操作失败');
    } finally {
      editSubmitting.value = false;
    }
  });
}

function syncEditRegionFromPath() {
  const [province = '', city = '', district = ''] = editForm.regionPath || [];
  if (province === NATIONAL_REGION_VALUE) {
    editForm.province = '';
    editForm.city = '';
    editForm.district = '';
    editForm.regionScope = 'nationwide';
    editForm.workAddress = '全国';
    editFormRef.value?.validateField?.('workAddress');
    return;
  }
  editForm.province = province;
  editForm.city = city;
  editForm.district = district;
  editForm.regionScope = district ? 'district' : city ? 'city' : province ? 'province' : '';
  // 工作地点为空时，用「省+市」预填地址前缀，HR 只需补街道门牌；已填则不覆盖，避免破坏运营已修正的地址
  if (!String(editForm.workAddress || '').trim() && (province || city)) {
    editForm.workAddress = `${province}${city}`;
    editFormRef.value?.validateField?.('workAddress');
  }
}

async function loadData() {
  loading.value = true;
  try {
    const res = await listJob(buildJobQueryParams());
    const list = unwrapList(res);
    tableData.value = list.rows;
    total.value = list.total;
  } catch (error) {
    console.error('加载数据失败:', error);
  } finally {
    loading.value = false;
  }
}

async function handleRefresh() {
  refreshing.value = true;
  try {
    await refreshJobRecommendCache();
    await Promise.all([loadData(), loadStatistics()]);
    ElMessage.success('刷新成功');
  } catch (error) {
    console.error('刷新岗位缓存失败:', error);
    ElMessage.error('刷新失败');
  } finally {
    refreshing.value = false;
  }
}

async function loadData1() {
  try {
    const params: any = {
      pageNum: queryParams1.pageNum,
      pageSize: queryParams1.pageSize,
      // 岗位ID为19位雪花ID，必须按字符串透传：Number() 超出安全整数会丢精度，
      // 后端按错误ID过滤导致列表恒空（后端 @RequestParam Long 会自行解析字符串）
      jobId: queryParams1.jobId ? String(queryParams1.jobId) : undefined
    };
    const res: any = await listApply(params);

    const list = unwrapList(res);
    SelectApplyUsertableData.value = list.rows;
    total1.value = list.total;
  } catch (error) {
    console.error('加载数据失败:', error);
  } finally {
  }
}

async function loadStatistics() {
  try {
    const res = await getJobStatistics();
    Object.assign(statistics, res.data || {});
  } catch (error) {
    console.error('加载统计失败:', error);
  }
}

function handleQuery() {
  queryParams.pageNum = 1;
  loadData();
}

function buildJobQueryParams() {
  const params: any = { ...queryParams };
  if (dateRange.value && dateRange.value.length === 2) {
    params.params = {
      beginTime: `${dateRange.value[0]} 00:00:00`,
      endTime: `${dateRange.value[1]} 23:59:59`
    };
  }
  return params;
}

function clearQueryFilters() {
  queryParams.jobNo = '';
  queryParams.jobName = '';
  queryParams.jobType = '';
  queryParams.status = '';
  queryParams.companyName = '';
  queryParams.isRecommend = '';
  queryParams.isHot = '';
  queryParams.workAddress = '';
  queryParams.applyCount = undefined;
  dateRange.value = [];
}

function handleStatFilter(type: 'all' | 'pending' | 'online' | 'offline') {
  queryParams.pageNum = 1;
  clearQueryFilters();
  if (type === 'pending') {
    queryParams.status = '0';
  } else if (type === 'online') {
    queryParams.status = '1';
  } else if (type === 'offline') {
    queryParams.status = '2';
  }
  loadData();
}

function resetQuery() {
  queryFormRef.value?.resetFields();
  queryParams.pageNum = 1;
  clearQueryFilters();
  loadData();
}

async function handleRecommendChange(row: any) {
  const text = row.isRecommend === '1' ? '推荐' : '取消推荐';
  try {
    await updateJob({ jobId: row.jobId, isRecommend: row.isRecommend });
    ElMessage.success(`${text}成功`);
  } catch (err) {
    row.isRecommend = row.isRecommend === '1' ? '0' : '1';
    ElMessage.error(`${text}失败`);
  }
}

async function handleHotChange(row: any) {
  const text = row.isHot === '1' ? '设为热门' : '取消热门';
  try {
    await updateJob({ jobId: row.jobId, isHot: row.isHot });
    ElMessage.success(`${text}成功`);
  } catch (err) {
    row.isHot = row.isHot === '1' ? '0' : '1';
    ElMessage.error(`${text}失败`);
  }
}

// 打开详情：调用完整字段详情接口（jobDetail），展示类目/学历/招聘人数/到岗时间/工作时间/福利/团队介绍/附加条件等全量字段
async function handleDetail(row: any) {
  detailVisible.value = true;
  detailLoading.value = true;
  currentJob.value = mergeJobDetail(row);
  try {
    const res = await getJobFullDetail(row.jobId);
    currentJob.value = mergeJobDetail(row, res.data || {});
  } catch (error) {
    ElMessage.error('获取岗位详情失败');
  } finally {
    detailLoading.value = false;
  }
}

async function handleSettlementIntent(row: any) {
  settlementIntentVisible.value = true;
  settlementIntentLoading.value = true;
  settlementIntentJob.value = null;
  // 意向结算优先使用列表行字段；若列表轻量字段缺失，再拉完整详情兜底。
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
  settlementLeadInvoices.value = [];
  settlementLeadContext.value = { ...leadRow };
  settlementLeadActiveKey.value = 'company';
  try {
    if (!leadRow.companyId) {
      throw new Error('missing companyId');
    }
    const res = await getBizNoChainByCompanyId(leadRow.companyId, leadRow.settlementIntentId);
    settlementLead.value = res.data || null;
    await loadSettlementLeadInvoices(settlementLead.value);
    settlementLeadActiveKey.value = [...settlementLeadSteps.value].reverse().find((step) => step.done)?.key || 'company';
  } catch {
    settlementLeadContext.value = null;
    settlementLeadInvoices.value = [];
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

function openSettlementLeadInvoice() {
  if (!settlementLead.value?.orderNo && !settlementLead.value?.ledgerId) return;
  settlementLeadVisible.value = false;
  router.push({
    name: 'RecruitmentInvoice',
    query: {
      ...(settlementLead.value.orderNo ? { ledgerOrderNo: settlementLead.value.orderNo } : {}),
      ...(settlementLead.value.ledgerId ? { ledgerId: String(settlementLead.value.ledgerId) } : {})
    }
  });
}

function handleAudit(row: any, status: string) {
  auditForm.jobId = row.jobId;
  auditForm.status = status;
  auditForm.remark = '';
  auditVisible.value = true;
}

// 从岗位行进入投递人员弹窗：只透传雪花 jobId 字符串，避免大整数精度丢失。
function handleSelectApplyUsers(row: any) {
  handleSelectApplyUsersVisible.value = true;
  queryParams1.jobId = row.jobId;
  loadData1();
}

function displayPhone(row: any): string {
  return row?.phone || '-';
}

function imageUrl(value?: string | number): string {
  const url = String(value || '').trim();
  return /^(https?:\/\/|\/)/.test(url) ? url : '';
}

// 投递人员头像使用后端可访问 URL；旧头像 ID 不是图片地址，必须保留文字兜底。
function candidateAvatarSrc(row: any): string {
  return imageUrl(row?.resumeAvatarUrl || row?.avatarUrl || row?.avatar);
}

async function submitAudit() {
  // 驳回（status=6）必须填写原因，写入 Job.remark 一并提交（后端 /job/audit 取 status + remark）
  if (auditForm.status === '6' && !auditForm.remark.trim()) {
    ElMessage.warning('驳回岗位请填写驳回原因');
    return;
  }
  try {
    await auditJob({ jobId: auditForm.jobId, status: auditForm.status, remark: auditForm.remark.trim() || undefined });
    ElMessage.success(auditForm.status === '1' ? '已通过并上架' : '已驳回');
    auditVisible.value = false;
    loadData();
    loadStatistics();
  } catch (error) {
    ElMessage.error('审核失败');
  }
}

async function handleStatusChange(row: any, status: string) {
  const action = status === '1' ? '上架' : '下架';
  try {
    await ElMessageBox.confirm(`确认要${action}该岗位吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    await changeJobStatus({ jobId: row.jobId, status });
    ElMessage.success(`${action}成功`);
    loadData();
    loadStatistics();
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(`${action}失败`);
    }
  }
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm('确认要删除该岗位吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    await delJob(row.jobId);
    ElMessage.success('删除成功');
    loadData();
    loadStatistics();
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败');
    }
  }
}

// 新增岗位：进入代发整页（运营代企业发布，需在该页选所属企业）
function handleCreate() {
  router.push({ name: 'RecruitmentJobPublish' });
}

// 复制发布：携带 jobId 进入代发整页，由该页拉全量详情回填
function handleCopyPublish(row: any) {
  router.push({ name: 'RecruitmentJobPublish', query: { copyFrom: String(row.jobId) } });
}

async function applyRouteFocus() {
  const qStatus = route.query.status;
  if (typeof qStatus === 'string' && qStatus) {
    queryParams.status = qStatus;
  }
  const qCompanyName = route.query.companyName;
  if (typeof qCompanyName === 'string' && qCompanyName) {
    queryParams.companyName = qCompanyName;
  }
  const qJobNo = route.query.jobNo;
  if (typeof qJobNo === 'string' && qJobNo) {
    queryParams.jobNo = qJobNo;
  }
  const qJobId = route.query.jobId;
  if (typeof qJobId === 'string' && qJobId) {
    await handleDetail({ jobId: qJobId });
  }
}

function handleBusinessEvent(event: Event) {
  const detail = (event as CustomEvent<{ type?: string; jobId?: number | string; action?: string; timestamp?: number | string }>)?.detail;
  if (detail?.type !== 'job_changed') return;

  const eventKey = [detail.jobId, detail.action, detail.timestamp].filter((item) => item !== undefined && item !== null && item !== '').join('|');
  if (eventKey && eventKey === lastJobChangedEventKey) return;
  lastJobChangedEventKey = eventKey;

  // 业务事件只作为刷新信号；最终展示仍以 admin REST 列表和统计接口为准。
  if (jobChangedRefreshTimer) {
    clearTimeout(jobChangedRefreshTimer);
  }
  jobChangedRefreshTimer = setTimeout(() => {
    loadData();
    loadStatistics();
    jobChangedRefreshTimer = undefined;
  }, 500);
}

onMounted(() => {
  applyRouteFocus();
  loadData();
  loadStatistics();
  window.addEventListener('business-event', handleBusinessEvent);
});

onUnmounted(() => {
  window.removeEventListener('business-event', handleBusinessEvent);
  if (jobChangedRefreshTimer) {
    clearTimeout(jobChangedRefreshTimer);
    jobChangedRefreshTimer = undefined;
  }
});

function handleExport() {
  download('/admin/recruitment/job/export', buildJobQueryParams(), `岗位数据_${new Date().getTime()}.xlsx`);
}

// 期望到岗时间：后端 expectedStartDate 为 Date（序列化为时间戳/ISO 字符串），仅展示到日期即可
function formatStartDate(val?: string | number): string {
  if (!val) return '随时到岗';
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}
</script>

<style scoped>
.mb-4 {
  margin-bottom: 16px;
}

.job-query-form {
  display: flex;
  flex-wrap: wrap;
  row-gap: 6px;
}

.stat-clickable {
  cursor: pointer;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}

.stat-clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
}

/* 投递人数：可点击打开候选人弹窗，hover 给出可交互反馈 */
.apply-count-tag {
  cursor: pointer;
}

.apply-count-tag:hover {
  opacity: 0.8;
  text-decoration: underline;
}

/* 投递人员弹窗：求职者/岗位单元格布局（与投递管理页 apply.vue 同款样式，
   模板复制自该页但样式此前缺失，导致头像与文字纵向堆叠错位） */
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
  font-size: 12px;
  color: #f56c6c;
  margin-top: 2px;
}

.text-muted {
  color: #c0c4cc;
}

/* 工具栏操作指引：与刷新/导出按钮同行的常驻灰字提示 */
.toolbar-tip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #909399;
}

.nanjing-tag-groups {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.nanjing-tag-group__title {
  margin-bottom: 10px;
  color: var(--el-text-color-primary);
  font-weight: 600;
}

.nanjing-tag-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.nanjing-tag-options :deep(.el-checkbox) {
  margin-right: 0;
}

.stat-mini-card {
  text-align: center;
}

.stat-mini {
  display: flex;
  flex-direction: column;
  align-items: center;
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

.stat-mini .value.warning {
  color: #e6a23c;
}

.stat-mini .value.success {
  color: #67c23a;
}

.stat-mini .value.info {
  color: #909399;
}

.job-info {
  padding: 4px 0;
}

.job-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.job-name {
  font-weight: 600;
  color: #303133;
}

.job-salary {
  color: #f56c6c;
  font-weight: 600;
  margin-top: 4px;
}

.job-location {
  color: #909399;
  font-size: 12px;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 编辑弹窗：分组标题独占稳定行距，避免上一行表单的计数/提示区域压住下一段标题。 */
.job-edit-form :deep(.el-divider) {
  clear: both;
  margin: 22px 0 22px;
}

.job-edit-form :deep(.el-divider__text) {
  display: inline-flex;
  align-items: center;
  max-width: calc(100% - 32px);
  padding: 0 12px;
  line-height: 20px;
  font-weight: 600;
  color: #303133;
  white-space: nowrap;
}

.job-edit-form .edit-work-time-row {
  display: flex;
  align-items: flex-start;
  width: 100%;
  margin-bottom: 24px;
}

.job-edit-form .edit-work-time-row :deep(.el-col) {
  min-width: 0;
}

.job-edit-form .edit-work-time-row :deep(.el-form-item) {
  margin-bottom: 0;
}

.job-edit-form .edit-work-time-row :deep(.el-form-item__label) {
  white-space: nowrap;
  word-break: keep-all;
}

.job-edit-form .edit-work-time-row :deep(.el-input__wrapper),
.job-edit-form .edit-work-time-row :deep(.el-select__wrapper) {
  min-height: 32px;
}

.job-edit-form .edit-work-time-row :deep(.el-input__count) {
  position: static;
  flex: none;
  margin-left: 8px;
  white-space: nowrap;
  background: transparent;
  transform: none;
}

.job-edit-form .job-detail-divider {
  margin-top: 26px;
}

/* 模块标题：浅蓝文字 + 前置图标，区分不同分组 */
.section-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #2b7fff;
  font-size: 14px;
}

/* 表单标签加粗深灰，对标主流招聘平台 */
.job-edit-form :deep(.el-form-item__label) {
  font-weight: 600;
  color: #333;
}

/* 字段下方浅灰示例小字，弱化不抢视觉 */
.field-hint {
  margin-top: 4px;
  font-size: 12px;
  color: #a8abb2;
  line-height: 1.4;
}

/* 招聘人数：快捷标签在上、输入在下 */
.recruit-quick,
.benefit-quick {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.recruit-quick-tag,
.benefit-quick-tag {
  cursor: pointer;
}

/* 描述模板按钮行 */
.desc-templates {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.desc-templates-label {
  font-size: 12px;
  color: #909399;
}

.desc-field,
.benefit-field,
.recruit-field {
  width: 100%;
}

/* 用工性质块状单选卡片 */
.job-type-cards {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.job-type-card {
  min-width: 60px;
  padding: 5px 14px;
  text-align: center;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
  font-size: 13px;
  color: #606266;
  transition: all 0.15s ease;
}

.job-type-card:hover {
  background: #f5f7fa;
  border-color: #c0c4cc;
}

.job-type-card.active {
  background: #2b7fff;
  border-color: #2b7fff;
  color: #fff;
}

.p-4 :deep(.el-table__body tr.settlement-compliance-row > td) {
  background: #f0f9eb !important;
}

.p-4 :deep(.el-table__body tr.settlement-compliance-row:hover > td) {
  background: #e6f7dc !important;
}

.job-settlement-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  line-height: 1.2;
}

.job-settlement-tags {
  display: inline-flex;
  justify-content: center;
  gap: 4px;
  flex-wrap: wrap;
}

.settlement-intent-form :deep(.el-form-item__content) {
  align-items: center;
}

.settlement-intent-radio {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.settlement-intent-radio :deep(.el-radio.is-bordered) {
  width: 100%;
  height: auto;
  margin-right: 0;
  padding: 10px 12px;
}

.settlement-radio-text {
  display: flex;
  flex-direction: column;
  gap: 3px;
  white-space: normal;
  line-height: 1.35;
}

.settlement-radio-text small {
  color: #909399;
}

.settlement-lead-drawer {
  min-height: 220px;
}

.settlement-chain {
  display: grid;
  grid-template-columns: repeat(5, minmax(108px, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.settlement-chain-node {
  position: relative;
  min-width: 0;
  cursor: pointer;
  outline: none;
}

.settlement-chain-node:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 18px;
  left: calc(100% - 2px);
  width: 14px;
  height: 2px;
  background: #dcdfe6;
}

.settlement-chain-marker {
  width: 36px;
  height: 36px;
  margin: 0 auto 8px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #f4f4f5;
  color: #909399;
  font-weight: 700;
  border: 1px solid #dcdfe6;
}

.settlement-chain-node.is-done .settlement-chain-marker {
  background: #ecf5ff;
  border-color: #409eff;
  color: #409eff;
}

.settlement-chain-node.is-active .settlement-chain-marker {
  background: #409eff;
  border-color: #409eff;
  color: #fff;
}

.settlement-chain-card {
  min-height: 106px;
  padding: 10px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background: #fff;
}

.settlement-chain-node.is-done .settlement-chain-card {
  border-color: #a0cfff;
  background: #f5faff;
}

.settlement-chain-node.is-active .settlement-chain-card,
.settlement-chain-node:focus-visible .settlement-chain-card {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.12);
}

.settlement-chain-node.is-empty .settlement-chain-card {
  background: #fafafa;
}

.settlement-chain-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  margin-bottom: 8px;
  color: #303133;
  font-weight: 600;
}

.settlement-chain-code {
  min-height: 20px;
  color: #606266;
  font-size: 13px;
  word-break: break-all;
}

.settlement-chain-desc {
  margin-top: 4px;
  color: #909399;
  font-size: 12px;
  line-height: 1.5;
  word-break: break-all;
}

.settlement-chain-detail {
  margin-top: 12px;
}

/* 薪资区间：快捷标签 + 数值输入 + 极低薪提示纵向排布 */
.salary-field {
  width: 100%;
}

.salary-quick {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.salary-quick-tag {
  cursor: pointer;
}

.salary-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.salary-tip {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
  font-size: 12px;
  color: #e6a23c;
}

/* 详情弹窗内福利/工作时间标签的换行排布 */
.detail-tags {
  display: flex;
  flex-wrap: wrap;
}

.detail-text {
  white-space: pre-wrap;
  line-height: 1.7;
  word-break: break-word;
}

.mr-1 {
  margin-right: 6px;
}

.mb-1 {
  margin-bottom: 6px;
}
</style>
