<template>
  <div class="p-4">
    <!-- ========== 区块一：统计概览 ========== -->
    <el-row :gutter="16" class="mb-4">
      <el-col :xs="24" :sm="12" :md="4">
        <el-card shadow="hover" class="stat-card" :class="{ active: activeStat === 'total' }" @click="handleStatQuery('total')">
          <div class="stat-inner">
            <div class="stat-icon primary">
              <el-icon><User /></el-icon>
            </div>
            <div class="stat-body">
              <span class="stat-label">求职者总数</span>
              <span class="stat-value primary">{{ stats.totalCount || 0 }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="4">
        <el-card shadow="hover" class="stat-card" :class="{ active: activeStat === 'normal' }" @click="handleStatQuery('normal')">
          <div class="stat-inner">
            <div class="stat-icon success">
              <el-icon><CircleCheck /></el-icon>
            </div>
            <div class="stat-body">
              <span class="stat-label">正常用户</span>
              <span class="stat-value success">{{ stats.normalCount || 0 }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="4">
        <el-card shadow="hover" class="stat-card" :class="{ active: activeStat === 'applied' }" @click="handleStatQuery('applied')">
          <div class="stat-inner">
            <div class="stat-icon warning">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-body">
              <span class="stat-label">有投递记录</span>
              <span class="stat-value warning">{{ stats.appliedCount || 0 }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="4">
        <el-card shadow="hover" class="stat-card" :class="{ active: activeStat === 'pending' }" @click="handleStatQuery('pending')">
          <div class="stat-inner">
            <div class="stat-icon info">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="stat-body">
              <span class="stat-label">待处理投递</span>
              <span class="stat-value info">{{ stats.pendingApplyCount || 0 }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="4">
        <el-card shadow="hover" class="stat-card" :class="{ active: activeStat === 'silenced' }" @click="handleStatQuery('silenced')">
          <div class="stat-inner">
            <div class="stat-icon danger">
              <el-icon><WarnTriangleFilled /></el-icon>
            </div>
            <div class="stat-body">
              <span class="stat-label">已禁言</span>
              <span class="stat-value danger">{{ stats.silencedCount || 0 }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="4">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-inner">
            <div class="stat-icon purple">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="stat-body">
              <span class="stat-label">累计面试</span>
              <span class="stat-value purple">{{ totalInterviews || 0 }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- ========== 区块二：搜索栏 ========== -->
    <el-card shadow="hover" class="mb-4">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true">
        <el-form-item label="用户昵称" prop="userName">
          <el-input v-model="queryParams.userName" placeholder="昵称 / 账号" clearable style="width: 160px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="手机号" prop="phonenumber">
          <el-input v-model="queryParams.phonenumber" placeholder="请输入手机号" clearable style="width: 140px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="用户状态" prop="isSilenced">
          <el-select v-model="queryParams.isSilenced" placeholder="全部" clearable style="width: 130px">
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

    <!-- ========== 区块三：数据表格 ========== -->
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="header-title">求职者列表</span>
          <div style="display: flex; gap: 8px">
            <el-dropdown>
              <el-button plain icon="Download">
                下载模板<el-icon class="el-icon--right"><i-ep-arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item icon="Document" @click="downloadExcelTemplate">下载 Excel 模板</el-dropdown-item>
                  <el-dropdown-item icon="Document" @click="downloadWordTemplate">下载 Word 模板</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button type="success" plain icon="Upload" @click="handleImport">导入</el-button>
            <el-button type="success" plain icon="Download" @click="handleExport">导出</el-button>
            <el-button type="primary" plain icon="Refresh" @click="loadData" :loading="loading">刷新</el-button>
          </div>
        </div>
      </template>

      <el-table v-loading="loading" :data="tableData" border stripe>
        <!-- 求职者编码来自最新简历；历史无简历用户兜底展示用户ID，避免老数据空白。 -->
        <el-table-column label="求职者编码" prop="jobSeekerNo" width="180" align="center" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.jobSeekerNo || row.userId || '-' }}
          </template>
        </el-table-column>

        <el-table-column label="用户信息" min-width="190">
          <template #default="{ row }">
            <div class="user-info">
              <el-avatar :src="displayAvatar(row)" :size="40" fit="cover">
                {{ avatarInitial(row) }}
              </el-avatar>
              <div class="user-detail">
                <div class="name">
                  {{ displayUserName(row) }}
                  <el-tag v-if="!row.resumeId" type="info" size="small" style="margin-left: 4px">暂无简历</el-tag>
                  <el-tag v-if="row.status === '1'" type="danger" size="small" style="margin-left: 4px">停用</el-tag>
                </div>
                <div class="sub">账号: {{ row.userName || '-' }}</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- 联系方式 -->
        <el-table-column label="联系方式" width="150">
          <template #default="{ row }">
            <div class="contact-info">
              <div class="contact-item">
                <el-icon><Phone /></el-icon>
                <span>{{ displayPrimaryPhone(row) }}</span>
              </div>
              <div v-if="displayAccountPhone(row) !== displayPrimaryPhone(row) && displayAccountPhone(row) !== '-'" class="contact-item muted">
                <span>授权: {{ displayAccountPhone(row) }}</span>
              </div>
              <div class="contact-item" v-if="row.email">
                <el-icon><Message /></el-icon>
                <span class="email-text">{{ row.email }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- 性别（本列表按求职者口径查询，类型恒为求职者，不再展示类型标签；
             双重身份用户的 userType 可在详情弹窗查看） -->
        <el-table-column label="性别" width="70" align="center">
          <template #default="{ row }">
            <el-tag v-if="displayPrimarySex(row) !== '-'" size="small" plain>{{ displayPrimarySex(row) }}</el-tag>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>

        <!-- 投递统计 -->
        <el-table-column label="投递统计" align="center" width="280">
          <template #default="{ row }">
            <div class="apply-stats">
              <el-tooltip content="总投递数" placement="top">
                <div class="stat-chip total" @click="handleViewApplies(row)">
                  <span class="chip-num">{{ row.totalApplies || 0 }}</span>
                  <span class="chip-label">投递</span>
                </div>
              </el-tooltip>
              <el-tooltip content="待处理" placement="top">
                <div class="stat-chip pending" @click="handleViewApplies(row, '0')">
                  <span class="chip-num">{{ row.pendingApplies || 0 }}</span>
                  <span class="chip-label">待处理</span>
                </div>
              </el-tooltip>
              <el-tooltip content="面试邀请" placement="top">
                <div class="stat-chip interview" @click="handleViewApplies(row, '1')">
                  <span class="chip-num">{{ row.interviewApplies || 0 }}</span>
                  <span class="chip-label">面试</span>
                </div>
              </el-tooltip>
              <el-tooltip content="已录用" placement="top">
                <div class="stat-chip hired" @click="handleViewApplies(row, '2')">
                  <span class="chip-num">{{ row.hiredApplies || 0 }}</span>
                  <span class="chip-label">录用</span>
                </div>
              </el-tooltip>
              <el-tooltip content="已拒绝" placement="top">
                <div class="stat-chip rejected" @click="handleViewApplies(row, '3')">
                  <span class="chip-num">{{ row.rejectedApplies || 0 }}</span>
                  <span class="chip-label">拒绝</span>
                </div>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>

        <!-- 禁言状态 -->
        <el-table-column label="禁言状态" width="140" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.isRecruitmentSilenced === '1'" type="danger" size="small" class="silence-status-tag">
              <span>已禁言</span>
            </el-tag>
            <el-tag v-else type="success" size="small">正常</el-tag>
          </template>
        </el-table-column>

        <!-- 注册/最后登录合并双行展示，压缩横向占宽避免出现横向滚动条 -->
        <el-table-column label="注册 / 最后登录" width="170" align="center">
          <template #default="{ row }">
            <div class="time-cell">
              <div>{{ row.createTime || '-' }}</div>
              <div class="sub">{{ row.loginDate || '未登录' }}</div>
            </div>
          </template>
        </el-table-column>

        <!-- 操作 -->
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="{ row }">
            <div style="display: flex; align-items: center; justify-content: center; gap: 4px; flex-wrap: wrap">
              <el-button link type="primary" icon="View" @click="handleDetail(row)">详情</el-button>
              <el-button link type="danger" @click="handleSilence(row)" v-if="row.isRecruitmentSilenced !== '1'"> 禁言 </el-button>
              <el-button link type="success" @click="handleUnsilence(row)" v-else> 解禁 </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="loadData" />
    </el-card>

    <!-- ========== 区块四：详情对话框 ========== -->
    <el-dialog v-model="detailVisible" title="求职者详情" width="880px" append-to-body>
      <template v-if="currentUser">
        <div class="detail-section">
          <div class="detail-section-title">最新简历</div>
          <div class="resume-profile-header">
            <el-avatar :src="displayAvatar(currentUser)" :size="64" fit="cover">
              {{ avatarInitial(currentUser) }}
            </el-avatar>
            <div class="resume-profile-main">
              <div class="resume-profile-name">{{ currentUser.realName || displayUserName(currentUser) }}</div>
              <div class="resume-profile-meta">{{ currentUser.jobSeekerNo || currentUser.userId || '-' }}</div>
            </div>
            <el-tag :type="resumeCompletenessType(currentUser)" size="small">{{ displayResumeCompleteness(currentUser) }}</el-tag>
          </div>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="姓名">{{ currentUser.realName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="性别">{{ displayResumeSex(currentUser) }}</el-descriptions-item>
            <el-descriptions-item label="简历手机号">{{ currentUser.resumePhone || '-' }}</el-descriptions-item>
            <el-descriptions-item label="微信号">{{ currentUser.wechat || '-' }}</el-descriptions-item>
            <el-descriptions-item label="最高学历">{{ displayEducation(currentUser) }}</el-descriptions-item>
            <el-descriptions-item label="所在城市">{{ currentUser.city || '-' }}</el-descriptions-item>
            <el-descriptions-item label="出生日期">{{ currentUser.birthDate || '-' }}</el-descriptions-item>
            <el-descriptions-item label="年龄">{{ currentUser.age != null ? currentUser.age : '-' }}</el-descriptions-item>
            <el-descriptions-item label="电子邮箱" :span="2">{{ currentUser.resumeEmail || '-' }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="detail-section">
          <div class="detail-section-title">求职意向</div>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="求职意向">{{ currentUser.expectPosition || '-' }}</el-descriptions-item>
            <el-descriptions-item label="期望城市">{{ currentUser.expectCity || '-' }}</el-descriptions-item>
            <el-descriptions-item label="求职类型">{{ displayJobType(currentUser) }}</el-descriptions-item>
            <el-descriptions-item label="求职状态">{{ displayJobStatus(currentUser) }}</el-descriptions-item>
            <el-descriptions-item label="到岗时间">{{ currentUser.expectedDate || '-' }}</el-descriptions-item>
            <el-descriptions-item label="工作年限">{{ currentUser.workYears != null ? currentUser.workYears + '年' : '-' }}</el-descriptions-item>
            <el-descriptions-item label="可工作时段">{{ displayAvailableTimeSlots(currentUser) }}</el-descriptions-item>
            <el-descriptions-item label="每周可出勤">{{ displayWeeklyHours(currentUser) }}</el-descriptions-item>
            <el-descriptions-item label="期望薪资" :span="2">{{ displaySalary(currentUser) }}</el-descriptions-item>
            <el-descriptions-item label="期望行业" :span="2">{{ displayExpectedIndustry(currentUser) }}</el-descriptions-item>
            <el-descriptions-item label="岗位偏好备注" :span="2">{{ displayJobPreferenceRemark(currentUser) }}</el-descriptions-item>
            <el-descriptions-item label="技能标签" :span="2">{{ currentUser.skills || '-' }}</el-descriptions-item>
            <el-descriptions-item label="个人总结" :span="2">{{ currentUser.summary || '-' }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="detail-section">
          <div class="detail-section-title">简历附件</div>
          <div v-if="currentUser.resumeAttachmentUrl" class="resume-attachment resume-attachment-box">
            <el-icon><Document /></el-icon>
            <span class="resume-file-name">{{ currentUser.resumeAttachmentName || getAttachmentName(currentUser.resumeAttachmentUrl) }}</span>
            <el-button link type="primary" icon="View" @click="viewResumeAttachment(currentUser)">查看</el-button>
            <el-button link type="primary" icon="Download" @click="downloadResumeAttachment(currentUser)">下载</el-button>
          </div>
          <span v-else class="text-muted">-</span>
        </div>

        <div v-for="section in resumeListSections(currentUser)" :key="section.title" class="detail-section">
          <div class="detail-section-title">{{ section.title }}</div>
          <div class="resume-list">
            <div v-for="(item, index) in section.items" :key="index" class="resume-list-item">
              <div class="resume-item-title">{{ item.title }}</div>
              <div v-if="item.meta" class="resume-item-meta">{{ item.meta }}</div>
              <div v-if="item.desc" class="resume-item-desc">{{ item.desc }}</div>
              <div v-if="item.extra" class="resume-item-extra">{{ item.extra }}</div>
            </div>
          </div>
        </div>

        <div v-if="resumeCertificateTags(currentUser).length" class="detail-section">
          <div class="detail-section-title">技能证书</div>
          <div class="resume-tags">
            <el-tag v-for="tag in resumeCertificateTags(currentUser)" :key="tag" type="info" effect="plain">{{ tag }}</el-tag>
          </div>
        </div>

        <div v-if="resumeOtherRows(currentUser).length" class="detail-section">
          <div class="detail-section-title">其他补充</div>
          <div class="resume-other-grid">
            <div v-for="row in resumeOtherRows(currentUser)" :key="row.label" class="resume-other-row">
              <span class="resume-other-label">{{ row.label }}</span>
              <span class="resume-other-value">
                <template v-if="row.url">
                  <span class="resume-other-link-text">{{ row.value }}</span>
                  <el-button link type="primary" icon="View" @click="viewResumeExtra(row)">查看</el-button>
                  <el-button link type="primary" icon="Download" @click="downloadResumeExtra(row)">下载</el-button>
                </template>
                <template v-else>{{ row.value }}</template>
              </span>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <div class="detail-section-title">账号信息</div>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="用户ID">{{ currentUser.userId }}</el-descriptions-item>
            <el-descriptions-item label="用户类型">
              <!-- C/B 是招聘业务对求职者/企业的标记;app_user/sys_user 是 RuoYi 框架自带的 sys_user.user_type 值。
                   本页是求职者管理,app端注册用户(app_user)本质即求职者,与 C 统一显示「求职者」;sys_user 为后台系统用户 -->
              <el-tag v-if="currentUser.userType === 'C' || currentUser.userType === 'app_user'" type="success">求职者</el-tag>
              <el-tag v-else-if="currentUser.userType === 'B'" type="warning">企业</el-tag>
              <el-tag v-else-if="currentUser.userType === 'sys_user'" type="info">系统用户</el-tag>
              <el-tag v-else>{{ currentUser.userType || '-' }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="昵称">{{ currentUser.nickName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="账号">{{ currentUser.userName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="账号状态">
              <el-tag v-if="currentUser.status === '0'" type="success">正常</el-tag>
              <el-tag v-else type="danger">停用</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="授权手机号">{{ displayAccountPhone(currentUser) }}</el-descriptions-item>
            <el-descriptions-item label="登录IP">{{ currentUser.loginIp || '-' }}</el-descriptions-item>
            <el-descriptions-item label="最后登录">{{ currentUser.loginDate || '-' }}</el-descriptions-item>
            <el-descriptions-item label="注册时间" :span="2">{{ currentUser.createTime || '-' }}</el-descriptions-item>
            <el-descriptions-item label="禁言状态">
              <el-tag v-if="currentUser.isRecruitmentSilenced === '1'" type="danger">已禁言</el-tag>
              <el-tag v-else type="success">正常</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="禁言原因">{{ currentUser.silenceReason || '-' }}</el-descriptions-item>
            <el-descriptions-item label="禁言时间">{{ currentUser.silenceTime || '-' }}</el-descriptions-item>
            <el-descriptions-item label="备注" :span="2">{{ currentUser.remark || '暂无' }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 投递统计仍按账号 userId 聚合；简历资料与账号信息分开展示，避免来源混淆。 -->
        <div class="detail-section">
          <div class="detail-section-title">投递统计</div>
          <div class="detail-stats detail-stats-standalone">
            <span class="detail-stat-chip total" @click="handleViewApplies(currentUser)">投递 {{ currentUser.totalApplies || 0 }}</span>
            <span class="detail-stat-chip pending" @click="handleViewApplies(currentUser, '0')">待处理 {{ currentUser.pendingApplies || 0 }}</span>
            <span class="detail-stat-chip interview" @click="handleViewApplies(currentUser, '1')">面试 {{ currentUser.interviewApplies || 0 }}</span>
            <span class="detail-stat-chip hired" @click="handleViewApplies(currentUser, '2')">录用 {{ currentUser.hiredApplies || 0 }}</span>
            <span class="detail-stat-chip rejected" @click="handleViewApplies(currentUser, '3')">拒绝 {{ currentUser.rejectedApplies || 0 }}</span>
          </div>
        </div>
      </template>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button type="danger" @click="openSilence(currentUser)" v-if="currentUser?.isRecruitmentSilenced !== '1'"> 禁言该用户 </el-button>
        <el-button type="success" @click="handleUnsilence(currentUser)" v-else> 解除禁言 </el-button>
      </template>
    </el-dialog>

    <!-- ========== 区块五：禁言对话框 ========== -->
    <el-dialog v-model="silenceVisible" title="禁言求职者" width="500px" append-to-body>
      <el-form ref="silenceFormRef" :model="silenceForm" label-width="100px">
        <el-alert type="warning" :closable="false" style="margin-bottom: 16px"> 禁言后该求职者将无法查看招聘信息、投递职位、联系企业 </el-alert>
        <el-form-item label="用户">
          <el-input :model-value="silenceForm.nickName || silenceForm.userName" disabled />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input :model-value="silenceForm.phone || silenceForm.phonenumber" disabled />
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

    <!-- ========== 区块六：投递记录弹窗 ========== -->
    <el-dialog v-model="applyDialogVisible" :title="applyDialogTitle" width="1180px" append-to-body>
      <el-form :model="applyQueryParams" :inline="true" class="apply-dialog-query">
        <el-form-item label="投递编号">
          <el-input
            v-model="applyQueryParams.applyId"
            placeholder="精确投递ID"
            clearable
            style="width: 150px"
            @keyup.enter="handleApplyDialogQuery"
          />
        </el-form-item>
        <el-form-item label="企业编号">
          <el-input
            v-model="applyQueryParams.companyId"
            placeholder="精确企业ID"
            clearable
            style="width: 150px"
            @keyup.enter="handleApplyDialogQuery"
          />
        </el-form-item>
        <el-form-item label="投递时间">
          <el-date-picker
            v-model="applyDateRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 240px"
            @change="handleApplyDialogQuery"
          />
        </el-form-item>
        <el-form-item label="岗位名称">
          <el-input
            v-model="applyQueryParams.jobName"
            placeholder="请输入岗位名称"
            clearable
            style="width: 180px"
            @keyup.enter="handleApplyDialogQuery"
          />
        </el-form-item>
        <el-form-item label="求职者">
          <el-input
            v-model="applyQueryParams.userName"
            placeholder="请输入求职者"
            clearable
            style="width: 150px"
            @keyup.enter="handleApplyDialogQuery"
          />
        </el-form-item>
        <el-form-item label="企业名称">
          <el-input
            v-model="applyQueryParams.companyName"
            placeholder="请输入企业名称"
            clearable
            style="width: 180px"
            @keyup.enter="handleApplyDialogQuery"
          />
        </el-form-item>
        <el-form-item label="投递状态">
          <el-select v-model="applyQueryParams.status" placeholder="全部" clearable style="width: 140px">
            <el-option label="已投递" value="0" />
            <el-option label="面试邀请" value="1" />
            <el-option label="已录用" value="2" />
            <el-option label="已拒绝" value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="已读状态">
          <el-select v-model="applyQueryParams.isRead" placeholder="全部" clearable style="width: 110px">
            <el-option label="未读" value="0" />
            <el-option label="已读" value="1" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleApplyDialogQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetApplyDialogQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="applyDialogLoading" :data="applyDialogData" border stripe max-height="460">
        <el-table-column label="投递编码" prop="applyNo" width="150" align="center" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.applyNo || row.applyId || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="岗位名称" prop="jobName" min-width="170" show-overflow-tooltip />
        <el-table-column label="企业名称" prop="companyName" min-width="170" show-overflow-tooltip />
        <el-table-column label="手机号" prop="phone" width="130" align="center" />
        <el-table-column label="薪资" prop="salary" width="130" show-overflow-tooltip />
        <el-table-column label="投递状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="getApplyTagType(row.status)" size="small">
              {{ row.statusName || applyStatusMeta(row.status).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="已读状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.isRead === '1' ? 'info' : 'warning'" size="small">
              {{ row.isRead === '1' ? '已读' : '未读' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="投递时间" prop="applyTime" width="170" align="center" />
        <el-table-column label="备注" prop="message" min-width="180" show-overflow-tooltip />
      </el-table>

      <pagination
        v-show="applyDialogTotal > 0"
        v-model:page="applyQueryParams.pageNum"
        v-model:limit="applyQueryParams.pageSize"
        :total="applyDialogTotal"
        @pagination="loadApplyDialogData"
      />
    </el-dialog>

    <!-- 求职者导入：支持 Excel、Word、PDF 或 zip 包；zip 内可混放 PDF/Word 简历附件。 -->
    <el-dialog v-model="upload.open" :title="upload.title" width="420px" append-to-body>
      <el-upload
        ref="uploadRef"
        :limit="1"
        accept=".zip,.xlsx,.xls,.doc,.docx,.pdf"
        :headers="upload.headers"
        :action="upload.url"
        :disabled="upload.isUploading"
        :before-upload="beforeImportUpload"
        :on-progress="handleFileUploadProgress"
        :on-success="handleFileSuccess"
        :on-error="handleFileError"
        :auto-upload="false"
        drag
      >
        <el-icon class="el-icon--upload">
          <i-ep-upload-filled />
        </el-icon>
        <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
        <template #tip>
          <div class="text-center el-upload__tip">
            <span>支持 xls、xlsx、doc、docx、pdf 或 zip；zip 内可混放 Excel、PDF、Word 简历附件。</span>
            <el-link type="primary" :underline="false" style="font-size: 12px; vertical-align: baseline" @click="downloadExcelTemplate"
              >下载 Excel 模板</el-link
            >
            <el-link
              type="primary"
              :underline="false"
              style="font-size: 12px; vertical-align: baseline; margin-left: 8px"
              @click="downloadWordTemplate"
            >
              下载 Word 模板
            </el-link>
          </div>
        </template>
      </el-upload>
      <div v-if="upload.isUploading || upload.taskId || upload.resultMsg" class="import-progress">
        <el-progress :percentage="upload.progress" :status="upload.progressStatus" />
        <div class="import-progress-text">{{ upload.statusText }}</div>
      </div>
      <template #footer>
        <el-button :disabled="upload.isUploading" @click="closeImportDialog">取消</el-button>
        <el-button type="primary" :loading="upload.isUploading" @click="submitFileForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage, ElMessageBox, type UploadFile, type UploadInstance } from 'element-plus';
import {
  statisticsUser,
  listUsersWithStats,
  getRecruitmentUserDetail,
  listApply,
  silenceUser,
  unsilenceUser,
  type ApplyVO,
  type RecruitmentUserVO
} from '@/api/recruitment';
import request, { download, globalHeaders } from '@/utils/request';
import { unwrapList } from './helpers';
import { applyStatusMeta } from './constants';

const route = useRoute();
const loading = ref(false);
const total = ref(0);
const tableData = ref<RecruitmentUserVO[]>([]);
const detailVisible = ref(false);
const silenceVisible = ref(false);
const applyDialogVisible = ref(false);
const applyDialogLoading = ref(false);
const currentUser = ref<RecruitmentUserVO | null>(null);
const applyDialogUser = ref<RecruitmentUserVO | null>(null);
const applyDialogData = ref<ApplyVO[]>([]);
const applyDialogTotal = ref(0);
const applyDialogInitialStatus = ref('');
const applyDateRange = ref<[string, string] | []>([]);
const queryFormRef = ref();
const silenceFormRef = ref();
const uploadRef = ref<UploadInstance>();
const importPollTimer = ref<ReturnType<typeof setInterval> | null>(null);
type StatFilter = 'total' | 'normal' | 'applied' | 'pending' | 'silenced';
const activeStat = ref<StatFilter>('total');

const upload = reactive({
  open: false,
  title: '',
  isUploading: false,
  taskId: '',
  progress: 0,
  progressStatus: undefined as 'success' | 'exception' | undefined,
  statusText: '',
  resultMsg: '',
  headers: globalHeaders(),
  url: import.meta.env.VITE_APP_BASE_API + '/admin/recruitment/user/importData'
});

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  userName: '',
  phonenumber: '',
  isSilenced: '',
  applyFilter: ''
});

const applyQueryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  applyId: '',
  companyId: '',
  userId: undefined as string | undefined,
  status: '',
  isRead: '',
  jobName: '',
  userName: '',
  companyName: ''
});

const stats = reactive({
  totalCount: 0,
  silencedCount: 0,
  normalCount: 0,
  appliedCount: 0,
  pendingApplyCount: 0
});

// 全局累计面试数（来自表格数据）
const totalInterviews = computed(() => tableData.value.reduce((sum, u) => sum + (u.interviewApplies || 0), 0));

const salaryUnitMap: Record<string, string> = {
  '1': '/月',
  '2': '/次',
  '3': '/小时',
  '0': '/天'
};

const educationMap: Record<string, string> = {
  '0': '学历不限',
  '1': '初中',
  '2': '高中',
  '3': '中专',
  '4': '大专',
  '5': '本科',
  '6': '硕士',
  '7': '博士'
};

const jobTypeMap: Record<string, string> = {
  '0': '全职',
  '1': '兼职',
  '2': '临时工',
  '3': '项目制'
};

const jobStatusMap: Record<string, string> = {
  '0': '随时到岗',
  '1': '考虑新机会',
  '2': '在职看机会'
};

type ResumeJsonRecord = Record<string, unknown>;
type ResumeListItem = {
  title: string;
  meta?: string;
  desc?: string;
  extra?: string;
};
type ResumeSection = {
  title: string;
  items: ResumeListItem[];
};
type ResumeOtherRow = {
  label: string;
  value: string;
  url?: string;
  fileName?: string;
};

// 求职者展示字段统一从最新简历优先取值；账号字段只作为无简历或空值时的兜底。
function displayUserName(row: RecruitmentUserVO | null) {
  return row?.realName || row?.nickName || row?.userName || '-';
}

function imageUrl(value?: string | number) {
  const url = String(value || '').trim();
  return /^(https?:\/\/|\/)/.test(url) ? url : '';
}

function displayAvatar(row: RecruitmentUserVO | null) {
  // 用户管理页头像同样只接收后端签名 URL，旧数字头像 ID 继续走文字兜底。
  return imageUrl(row?.resumeAvatarUrl || row?.avatarUrl || row?.avatar);
}

function avatarInitial(row: RecruitmentUserVO | null) {
  const name = displayUserName(row);
  return name === '-' ? '?' : name.charAt(0);
}

function displayAccountPhone(row: RecruitmentUserVO | null) {
  return row?.accountPhone || row?.phonenumber || row?.phone || '-';
}

function displayPrimaryPhone(row: RecruitmentUserVO | null) {
  return row?.resumePhone || displayAccountPhone(row);
}

function normalizeSexName(value?: string) {
  if (value === 'M' || value === '0') return '男';
  if (value === 'F' || value === '1') return '女';
  if (value === '2') return '未知';
  return '-';
}

function displayPrimarySex(row: RecruitmentUserVO | null) {
  return row?.resumeSexName && row.resumeSexName !== '-' ? row.resumeSexName : row?.sexName || normalizeSexName(row?.sex);
}

function displayResumeSex(row: RecruitmentUserVO | null) {
  if (!row?.resumeId) return '-';
  return row.resumeSexName && row.resumeSexName !== '-' ? row.resumeSexName : normalizeSexName(row.resumeSex);
}

function displayResumeCompleteness(row: RecruitmentUserVO | null) {
  if (!row?.resumeId) return '暂无简历';
  const value = Number(row.resumeCompleteness);
  return Number.isFinite(value) ? `${value}%` : '-';
}

function resumeCompletenessType(row: RecruitmentUserVO | null): 'success' | 'warning' | 'info' {
  if (!row?.resumeId) return 'info';
  const value = Number(row.resumeCompleteness || 0);
  if (value >= 100) return 'success';
  if (value >= 80) return 'warning';
  return 'info';
}

function displayEducation(row: RecruitmentUserVO | null) {
  if (!row?.resumeId) return '-';
  const rawEducation = displayEducationValue(row.education);
  if (row.educationName && row.educationName !== '学历不限') return row.educationName;
  return rawEducation || row.educationName || '-';
}

function displayJobType(row: RecruitmentUserVO | null) {
  if (!row?.resumeId) return '-';
  if (row.jobTypeName) return row.jobTypeName;
  return jobTypeMap[String(row.jobType ?? '0')] || String(row.jobType || '-');
}

function displayJobStatus(row: RecruitmentUserVO | null) {
  if (!row?.resumeId) return '-';
  return row.jobStatusName || jobStatusMap[String(row.jobStatus ?? '')] || '-';
}

function displaySalary(row: RecruitmentUserVO | null) {
  if (!row?.resumeId) return '-';
  const min = row.salaryMin;
  const max = row.salaryMax;
  if (min == null && max == null) return '-';
  const unit = salaryUnitMap[String(row.salaryUnit ?? '0')] || '/天';
  if (min != null && max != null) return `${min}-${max}${unit}`;
  return `${min ?? max}${unit}`;
}

function displayAvailableTimeSlots(row: RecruitmentUserVO | null) {
  if (!row?.resumeId) return '-';
  return displayStoredValue(row.availableTimeSlots) || firstOtherInfoValue(row, ['availableTimeSlots', 'worktime', 'workTime', '可工作时段']) || '-';
}

function displayWeeklyHours(row: RecruitmentUserVO | null) {
  if (!row?.resumeId) return '-';
  const value = row.weeklyHours ?? firstOtherInfoValue(row, ['weeklyHours', 'weeklyHoursText', 'hours', '每周可出勤']);
  const text = displayStoredValue(value);
  return text ? (/\d$/.test(text) ? `${text}小时` : text) : '-';
}

function displayExpectedIndustry(row: RecruitmentUserVO | null) {
  if (!row?.resumeId) return '-';
  return displayStoredValue(row.expectedIndustry) || firstOtherInfoValue(row, ['expectedIndustry', 'industry', 'expectIndustry', '期望行业']) || '-';
}

function displayJobPreferenceRemark(row: RecruitmentUserVO | null) {
  if (!row?.resumeId) return '-';
  return (
    displayStoredValue(row.jobPreferenceRemark) ||
    firstOtherInfoValue(row, ['jobPreferenceRemark', 'preferenceRemark', 'positionPreferenceRemark', '岗位偏好备注']) ||
    '-'
  );
}

function displayEducationValue(value?: unknown) {
  const text = displayText(value);
  return educationMap[text] || text;
}

function displayText(value: unknown): string {
  if (value == null) return '';
  if (Array.isArray(value)) {
    return value
      .map((item) => displayText(item))
      .filter(Boolean)
      .join('、');
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value).trim();
}

function parseJsonValue(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return '';
  try {
    return JSON.parse(trimmed);
  } catch {
    return trimmed;
  }
}

// C 端简历的经历/证书/补充信息以 JSON 字符串保存；运营端只读展示，解析失败时保持空模块。
function parseResumeList(value: unknown): ResumeJsonRecord[] {
  const parsed = parseJsonValue(value);
  if (Array.isArray(parsed)) {
    return parsed.filter((item): item is ResumeJsonRecord => !!item && typeof item === 'object' && !Array.isArray(item));
  }
  if (parsed && typeof parsed === 'object') {
    return [parsed as ResumeJsonRecord];
  }
  return [];
}

function displayStoredValue(value: unknown): string {
  return displayText(parseJsonValue(value));
}

function pickText(source: ResumeJsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = displayText(source[key]);
    if (value) return value;
  }
  return '';
}

function firstOtherInfoValue(row: RecruitmentUserVO | null, keys: string[]) {
  if (!row?.otherInfo) return '';
  for (const item of parseResumeList(row.otherInfo)) {
    const value = pickText(item, keys);
    if (value) return value;
  }
  return '';
}

function labelText(label: string, value: string) {
  return value ? `${label}：${value}` : '';
}

function joinParts(parts: string[], separator = ' · ') {
  return parts.filter(Boolean).join(separator);
}

function formatItemRange(item: ResumeJsonRecord) {
  const period = pickText(item, ['period', 'range', 'time']);
  if (period) return period;
  const start = pickText(item, ['startDate', 'startTime', 'beginDate']);
  const end = pickText(item, ['endDate', 'endTime', 'finishDate']);
  if (start && end) return `${start}-${end}`;
  if (start) return `${start}-至今`;
  return end;
}

function hasResumeItemContent(item: ResumeListItem) {
  return Boolean(item.title || item.meta || item.desc || item.extra);
}

function mapEducationItem(item: ResumeJsonRecord): ResumeListItem {
  const school = pickText(item, ['school', 'schoolName', 'name']);
  const level = displayEducationValue(pickText(item, ['level', 'education', 'degree', 'edu']));
  const major = pickText(item, ['major', 'profession']);
  const courses = pickText(item, ['courses', 'course', 'mainCourse']);
  const gpa = pickText(item, ['gpa']);
  return {
    title: joinParts([school || '院校', level]),
    meta: joinParts([major, formatItemRange(item)]),
    desc: joinParts([labelText('主修', courses), labelText('GPA', gpa)], '；')
  };
}

function mapWorkItem(item: ResumeJsonRecord): ResumeListItem {
  const company = pickText(item, ['company', 'companyName', 'name']);
  const role = pickText(item, ['role', 'position', 'jobTitle']);
  const salary = pickText(item, ['salary']);
  const dept = pickText(item, ['dept', 'department']);
  const duty = pickText(item, ['duty', 'description', 'desc', 'content']);
  const perf = pickText(item, ['perf', 'result', 'achievement']);
  return {
    title: joinParts([company || '公司', role]),
    meta: joinParts([formatItemRange(item), salary ? `在职薪水 ${salary}` : '', dept]),
    desc: duty,
    extra: labelText('业绩', perf)
  };
}

function mapProjectItem(item: ResumeJsonRecord): ResumeListItem {
  const name = pickText(item, ['name', 'projectName', 'title']);
  const role = pickText(item, ['role', 'position']);
  const tech = pickText(item, ['tech', 'technology']);
  const desc = pickText(item, ['desc', 'description', 'content']);
  const result = pickText(item, ['result', 'achievement']);
  return {
    title: joinParts([name || '项目', role]),
    meta: joinParts([formatItemRange(item), tech]),
    desc,
    extra: labelText('成果', result)
  };
}

function resumeListSections(row: RecruitmentUserVO | null): ResumeSection[] {
  if (!row?.resumeId) return [];
  const sections: ResumeSection[] = [];
  const educationItems = parseResumeList(row.educationExperience).map(mapEducationItem).filter(hasResumeItemContent);
  const workItems = parseResumeList(row.workExperience).map(mapWorkItem).filter(hasResumeItemContent);
  const projectItems = parseResumeList(row.projectExperience).map(mapProjectItem).filter(hasResumeItemContent);
  if (educationItems.length) sections.push({ title: '教育经历', items: educationItems });
  if (workItems.length) sections.push({ title: '工作经历', items: workItems });
  if (projectItems.length) sections.push({ title: '项目经历', items: projectItems });
  return sections;
}

function resumeCertificateTags(row: RecruitmentUserVO | null) {
  if (!row?.resumeId) return [];
  const tags = parseResumeList(row.certificates).flatMap((item) => {
    const skill = pickText(item, ['skill', 'name', 'title']);
    const cert = pickText(item, ['cert', 'certName', 'certificate']);
    const lang = pickText(item, ['lang', 'language']);
    return [skill, cert ? `证书：${cert}` : '', lang ? `语言：${lang}` : ''].filter(Boolean);
  });
  return Array.from(new Set(tags));
}

function resumeOtherRows(row: RecruitmentUserVO | null): ResumeOtherRow[] {
  if (!row?.resumeId) return [];
  const rows: ResumeOtherRow[] = [];
  const labelMap: Record<string, string> = {
    portfolio: '作品集',
    portfolioUrl: '作品集',
    github: 'GitHub',
    githubUrl: 'GitHub',
    volunteer: '志愿者',
    volunteerExperience: '志愿者',
    honor: '荣誉',
    awards: '荣誉'
  };
  const skippedOtherKeys = new Set([
    'expectedIndustry',
    'industry',
    'expectIndustry',
    'jobPreferenceRemark',
    'preferenceRemark',
    'positionPreferenceRemark'
  ]);
  const addRow = (label: string, value: unknown, urlValue?: unknown) => {
    const text = displayStoredValue(value);
    if (!text || text === 'null' || text === 'undefined') return;
    const urlText = displayStoredValue(urlValue ?? value);
    const url = isLinkLikeValue(urlText) ? normalizeFileUrl(urlText) : undefined;
    if (!rows.some((rowItem) => rowItem.label === label && rowItem.value === text)) {
      rows.push({ label, value: text, url, fileName: url ? getAttachmentName(urlText) : undefined });
    }
  };

  parseResumeList(row.otherInfo).forEach((item) => {
    Object.entries(item).forEach(([key, value]) => {
      if (skippedOtherKeys.has(key)) return;
      addRow(labelMap[key] || key, value);
    });
  });
  addRow('作品集', row.portfolioUrl);
  addRow('GitHub', row.githubUrl);
  addRow('志愿者', row.volunteerExperience);
  addRow('荣誉', row.awards);
  return rows;
}

const applyDialogTitle = computed(() => {
  const userName = applyDialogUser.value ? displayUserName(applyDialogUser.value) : '求职者';
  const statusText = applyQueryParams.status ? ` - ${applyStatusMeta(applyQueryParams.status).label}` : '';
  return `${userName}的投递记录${statusText}`;
});

const silenceForm = reactive<RecruitmentUserVO & { reason: string }>({
  userId: 0,
  userName: '',
  nickName: '',
  userType: '',
  phone: '',
  phonenumber: '',
  email: '',
  sex: '',
  sexName: '',
  avatar: 0,
  avatarUrl: '',
  status: '0',
  statusName: '',
  isRecruitmentSilenced: '0',
  silenceReason: '',
  silenceTime: '',
  totalApplies: 0,
  pendingApplies: 0,
  interviewApplies: 0,
  hiredApplies: 0,
  rejectedApplies: 0,
  resumeAttachmentUrl: '',
  resumeAttachmentName: '',
  loginIp: '',
  loginDate: '',
  createTime: '',
  remark: '',
  reason: ''
});

async function loadData() {
  loading.value = true;
  try {
    const res = await listUsersWithStats({
      pageNum: queryParams.pageNum,
      pageSize: queryParams.pageSize,
      userName: queryParams.userName || undefined,
      phone: queryParams.phonenumber || undefined,
      isRecruitmentSilenced: queryParams.isSilenced || undefined,
      applyFilter: queryParams.applyFilter || undefined
    });
    // 列表拆包：本接口 /user/listWithStats 后端用 R<TableDataInfo> 包了一层（与 listJob/listApply 等
    // 「直接返回 TableDataInfo、顶层 rows/total」的项目约定不一致），数据在 res.data.{rows,total}。
    // 这里兼容两种形态：R 包则取 res.data，直返则取 res，避免列表恒空。
    // 安全：不要打印整包响应，避免把求职者手机号/邮箱/登录IP 等 PII 暴露到浏览器控制台
    const list = unwrapList<RecruitmentUserVO>((res as any)?.data ?? res);
    // 账号手机号与简历手机号分线展示；旧 phone/phonenumber 字段保留为账号兜底，避免历史接口空列。
    tableData.value = list.rows.map((item) => ({
      ...item,
      phone: item.phone || item.phonenumber || '',
      phonenumber: item.phonenumber || item.phone || '',
      accountPhone: item.accountPhone || item.phonenumber || item.phone || ''
    }));
    total.value = list.total;
  } catch (e) {
    tableData.value = [];
    total.value = 0;
    console.error('[求职者管理] loadData 异常:', e);
  } finally {
    loading.value = false;
  }
}

async function loadStatistics() {
  try {
    const res = await statisticsUser();
    // res = R.data: UserStatisticsVO { totalCount, normalCount, ... }
    Object.assign(stats, res.data || {});
  } catch {
    // silent
  }
}

function handleQuery() {
  queryParams.pageNum = 1;
  syncActiveStatFromQuery();
  loadData();
}

function syncActiveStatFromQuery() {
  if (queryParams.applyFilter === 'applied' || queryParams.applyFilter === 'pending') {
    activeStat.value = queryParams.applyFilter as StatFilter;
  } else if (queryParams.isSilenced === '0') {
    activeStat.value = 'normal';
  } else if (queryParams.isSilenced === '1') {
    activeStat.value = 'silenced';
  } else {
    activeStat.value = 'total';
  }
}

function handleStatQuery(type: StatFilter) {
  activeStat.value = type;
  queryParams.pageNum = 1;
  queryParams.applyFilter = '';
  if (type === 'total') {
    queryParams.isSilenced = '';
  } else if (type === 'normal') {
    queryParams.isSilenced = '0';
  } else if (type === 'silenced') {
    queryParams.isSilenced = '1';
  } else {
    queryParams.isSilenced = '';
    queryParams.applyFilter = type;
  }
  loadData();
}

function resetQuery() {
  queryFormRef.value?.resetFields();
  queryParams.pageNum = 1;
  queryParams.userName = '';
  queryParams.phonenumber = '';
  queryParams.isSilenced = '';
  queryParams.applyFilter = '';
  activeStat.value = 'total';
  loadData();
}

async function handleDetail(row: RecruitmentUserVO) {
  currentUser.value = { ...row };
  detailVisible.value = true;
  try {
    const res = await getRecruitmentUserDetail(row.userId);
    currentUser.value = { ...row, ...(res.data || {}) };
  } catch {
    ElMessage.error('求职者详情加载失败');
  }
}

function getAttachmentName(url?: string) {
  if (!url) return '简历附件';
  const cleanUrl = url.split('?')[0].split('#')[0];
  const fileName = cleanUrl.substring(cleanUrl.lastIndexOf('/') + 1);
  try {
    return decodeURIComponent(fileName || '简历附件');
  } catch {
    return fileName || '简历附件';
  }
}

function normalizeFileUrl(url: string) {
  const trimmed = String(url || '').trim();
  if (!trimmed) return '';
  if (/^(https?:)?\/\//i.test(trimmed) || trimmed.startsWith('/') || trimmed.startsWith('blob:') || trimmed.startsWith('data:')) {
    return trimmed;
  }
  if (/^www\./i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return `/${trimmed}`;
}

function isLinkLikeValue(value?: string) {
  return (
    !!value &&
    (/^(https?:)?\/\//i.test(value) || /^www\./i.test(value) || value.startsWith('/') || value.startsWith('blob:') || value.startsWith('data:'))
  );
}

function getFileExtension(url?: string, name?: string) {
  const source = (name || url || '').split('?')[0].split('#')[0];
  const fileName = source.substring(source.lastIndexOf('/') + 1);
  const dotIndex = fileName.lastIndexOf('.');
  return dotIndex >= 0 ? fileName.substring(dotIndex + 1).toLowerCase() : '';
}

function isPreviewableFile(url?: string, name?: string) {
  const ext = getFileExtension(url, name);
  return !ext || ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'txt'].includes(ext);
}

function triggerDownload(url: string, fileName: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName || getAttachmentName(url);
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

async function downloadFileUrl(rawUrl: string, fileName?: string) {
  const url = normalizeFileUrl(rawUrl);
  const safeName = fileName || getAttachmentName(rawUrl);
  try {
    const response = await fetch(url, { credentials: url.startsWith('/') ? 'include' : 'omit' });
    if (!response.ok) throw new Error('download failed');
    const blobUrl = URL.createObjectURL(await response.blob());
    triggerDownload(blobUrl, safeName);
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  } catch {
    triggerDownload(url, safeName);
  }
}

function viewFileUrl(rawUrl: string, fileName?: string) {
  const url = normalizeFileUrl(rawUrl);
  if (!isPreviewableFile(url, fileName)) {
    void downloadFileUrl(rawUrl, fileName);
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

function viewResumeAttachment(row: RecruitmentUserVO | null) {
  if (!row?.resumeAttachmentUrl) {
    ElMessage.warning('暂无简历附件');
    return;
  }
  viewFileUrl(row.resumeAttachmentUrl, row.resumeAttachmentName || getAttachmentName(row.resumeAttachmentUrl));
}

function downloadResumeAttachment(row: RecruitmentUserVO | null) {
  if (!row?.resumeAttachmentUrl) {
    ElMessage.warning('暂无简历附件');
    return;
  }
  void downloadFileUrl(row.resumeAttachmentUrl, row.resumeAttachmentName || getAttachmentName(row.resumeAttachmentUrl));
}

function viewResumeExtra(row: ResumeOtherRow) {
  if (!row.url) return;
  viewFileUrl(row.url, row.fileName || row.value);
}

function downloadResumeExtra(row: ResumeOtherRow) {
  if (!row.url) return;
  void downloadFileUrl(row.url, row.fileName || row.value);
}

function openSilence(row: RecruitmentUserVO) {
  detailVisible.value = false;
  setTimeout(() => handleSilence(row), 50);
}

function handleSilence(row: RecruitmentUserVO) {
  Object.assign(silenceForm, row);
  silenceForm.reason = '';
  silenceVisible.value = true;
}

async function submitSilence() {
  if (!silenceForm.reason.trim()) {
    ElMessage.warning('请填写禁言原因');
    return;
  }
  try {
    await silenceUser({ userId: silenceForm.userId, reason: silenceForm.reason });
    ElMessage.success('禁言成功');
    silenceVisible.value = false;
    loadData();
    loadStatistics();
  } catch {
    ElMessage.error('禁言失败');
  }
}

async function handleUnsilence(row: RecruitmentUserVO | null) {
  if (!row) return;
  try {
    await ElMessageBox.confirm('确定要取消该求职者的禁言状态吗？取消后用户可以正常查看职位信息。', '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    });
    await unsilenceUser({ userId: row.userId });
    ElMessage.success('已解除禁言');
    detailVisible.value = false;
    loadData();
    loadStatistics();
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error('操作失败');
    }
  }
}

function handleViewApplies(row: RecruitmentUserVO | null, status?: string) {
  if (!row?.userId) {
    ElMessage.warning('缺少求职者用户ID，无法查询投递记录');
    return;
  }
  applyDialogUser.value = row;
  applyDialogInitialStatus.value = status || '';
  applyQueryParams.pageNum = 1;
  applyQueryParams.pageSize = 10;
  applyQueryParams.applyId = '';
  applyQueryParams.companyId = '';
  // 后端雪花 ID 会以字符串返回，弹窗查询保持字符串透传，避免浏览器 number 精度丢失。
  applyQueryParams.userId = String(row.userId);
  applyQueryParams.status = status || '';
  applyQueryParams.isRead = '';
  applyQueryParams.jobName = '';
  applyQueryParams.userName = '';
  applyQueryParams.companyName = '';
  applyDateRange.value = [];
  applyDialogVisible.value = true;
  loadApplyDialogData();
}

async function loadApplyDialogData() {
  if (!applyQueryParams.userId) return;
  applyDialogLoading.value = true;
  try {
    const res = await listApply({
      pageNum: applyQueryParams.pageNum,
      pageSize: applyQueryParams.pageSize,
      applyId: applyQueryParams.applyId ? Number(applyQueryParams.applyId) : undefined,
      companyId: applyQueryParams.companyId ? Number(applyQueryParams.companyId) : undefined,
      userId: applyQueryParams.userId,
      status: applyQueryParams.status || undefined,
      isRead: applyQueryParams.isRead || undefined,
      jobName: applyQueryParams.jobName || undefined,
      userName: applyQueryParams.userName || undefined,
      companyName: applyQueryParams.companyName || undefined,
      beginTime: applyDateRange.value.length === 2 ? applyDateRange.value[0] : undefined,
      endTime: applyDateRange.value.length === 2 ? applyDateRange.value[1] : undefined
    });
    const list = unwrapList<ApplyVO>(res);
    applyDialogData.value = list.rows;
    applyDialogTotal.value = list.total;
  } catch (e) {
    applyDialogData.value = [];
    applyDialogTotal.value = 0;
    console.error('[求职者管理] 投递记录加载失败:', e);
    ElMessage.error('投递记录加载失败');
  } finally {
    applyDialogLoading.value = false;
  }
}

function handleApplyDialogQuery() {
  applyQueryParams.pageNum = 1;
  loadApplyDialogData();
}

function resetApplyDialogQuery() {
  applyQueryParams.pageNum = 1;
  applyQueryParams.applyId = '';
  applyQueryParams.companyId = '';
  applyQueryParams.status = applyDialogInitialStatus.value;
  applyQueryParams.isRead = '';
  applyQueryParams.jobName = '';
  applyQueryParams.userName = '';
  applyQueryParams.companyName = '';
  applyDateRange.value = [];
  loadApplyDialogData();
}

function getApplyTagType(status?: string | null) {
  return (applyStatusMeta(status).type || 'info') as 'warning' | 'primary' | 'success' | 'info' | 'danger';
}

async function applyRouteFocus() {
  const qUserId = route.query.userId;
  if (typeof qUserId === 'string' && qUserId) {
    await handleDetail({ userId: qUserId } as RecruitmentUserVO);
  }
}

onMounted(() => {
  applyRouteFocus();
  loadData();
  loadStatistics();
});

onBeforeUnmount(() => {
  clearImportPolling();
});

function handleExport() {
  download(
    '/admin/recruitment/user/export',
    {
      userName: queryParams.userName || undefined,
      phone: queryParams.phonenumber || undefined,
      isRecruitmentSilenced: queryParams.isSilenced || undefined,
      applyFilter: queryParams.applyFilter || undefined
    },
    `求职者数据_${new Date().getTime()}.xlsx`
  );
}

function handleImport() {
  resetUploadState();
  upload.title = '求职者导入';
  upload.open = true;
}

function downloadExcelTemplate() {
  download('/admin/recruitment/user/importTemplate', {}, `求职者导入模板_${new Date().getTime()}.xlsx`);
}

function downloadWordTemplate() {
  download('/admin/recruitment/user/importTemplate/word', {}, `求职者Word导入模板_${new Date().getTime()}.doc`);
}

function resetUploadState() {
  clearImportPolling();
  upload.isUploading = false;
  upload.taskId = '';
  upload.progress = 0;
  upload.progressStatus = undefined;
  upload.statusText = '';
  upload.resultMsg = '';
}

function handleFileUploadProgress(event?: { percent?: number }) {
  upload.isUploading = true;
  upload.progressStatus = undefined;
  upload.statusText = '文件上传中';
  upload.progress = Math.min(30, Math.round(event?.percent || 0));
}

function beforeImportUpload(file: UploadFile['raw']) {
  const fileName = file?.name || '';
  const allow = /\.(xls|xlsx|doc|docx|pdf|zip)$/i.test(fileName);
  if (!allow) {
    ElMessage.warning('仅支持上传 xls、xlsx、doc、docx、pdf 或 zip');
    setTimeout(() => uploadRef.value?.clearFiles(), 0);
    return false;
  }
  return true;
}

function handleFileSuccess(response: any, file: UploadFile) {
  const task = response?.data || response;
  const taskId = task?.taskId;
  if (!taskId) {
    if (response?.code && response.code !== 200) {
      upload.isUploading = false;
      upload.progressStatus = 'exception';
      upload.statusText = response?.msg || '导入失败';
      ElMessage.error(upload.statusText);
      return;
    }
    upload.isUploading = false;
    upload.progress = 100;
    upload.progressStatus = 'success';
    upload.resultMsg = response?.msg || task?.message || task?.analysis || '导入完成';
    upload.statusText = '导入完成';
    uploadRef.value?.handleRemove(file);
    upload.open = false;
    showImportResult(upload.resultMsg);
    loadData();
    loadStatistics();
    return;
  }
  upload.taskId = taskId;
  upload.progress = Math.max(upload.progress, task?.percent || 30);
  upload.statusText = '后台正在分段导入';
  uploadRef.value?.handleRemove(file);
  startImportPolling(taskId);
}

function handleFileError() {
  upload.isUploading = false;
  upload.progressStatus = 'exception';
  upload.statusText = '文件上传失败';
}

function startImportPolling(taskId: string) {
  clearImportPolling();
  pollImportTask(taskId);
  importPollTimer.value = setInterval(() => pollImportTask(taskId), 1000);
}

async function pollImportTask(taskId: string) {
  try {
    const res = await request({
      url: `/admin/recruitment/user/importTask/${taskId}`,
      method: 'get',
      silent: true
    } as any);
    const task = (res as any)?.data || res;
    upload.progress = Math.max(upload.progress, Number(task?.percent || 0));
    upload.statusText = task?.message || '后台正在分段导入';
    if (task?.status === 'SUCCESS' || task?.status === 'FAILED') {
      clearImportPolling();
      upload.isUploading = false;
      upload.progress = task.status === 'SUCCESS' ? 100 : upload.progress;
      upload.progressStatus = task.status === 'SUCCESS' ? 'success' : 'exception';
      upload.resultMsg = task?.message || (task.status === 'SUCCESS' ? '导入完成' : '导入失败');
      showImportResult(upload.resultMsg);
      if (task.status === 'SUCCESS') {
        upload.open = false;
        loadData();
        loadStatistics();
      }
    }
  } catch {
    clearImportPolling();
    upload.isUploading = false;
    upload.progressStatus = 'exception';
    upload.statusText = '导入进度查询失败';
  }
}

function clearImportPolling() {
  if (importPollTimer.value) {
    clearInterval(importPollTimer.value);
    importPollTimer.value = null;
  }
}

function showImportResult(message: string) {
  ElMessageBox.alert("<div style='overflow: auto;overflow-x: hidden;max-height: 70vh;padding: 10px 20px 0;'>" + message + '</div>', '导入结果', {
    dangerouslyUseHTMLString: true
  });
}

function submitFileForm() {
  upload.progress = 0;
  upload.progressStatus = undefined;
  upload.statusText = '';
  upload.resultMsg = '';
  uploadRef.value?.submit();
}

function closeImportDialog() {
  upload.open = false;
  resetUploadState();
  uploadRef.value?.clearFiles();
}
</script>

<style scoped>
.mb-4 {
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.header-title {
  font-weight: 600;
  font-size: 15px;
  color: #303133;
}

/* ---------- 统计卡片 ---------- */
.stat-card {
  border-radius: 10px;
  transition: all 0.3s;
  cursor: pointer;
}
.stat-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1) !important;
}
.stat-card.active {
  border-color: #409eff;
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.18) !important;
}
.stat-inner {
  display: flex;
  align-items: center;
  gap: 14px;
}
.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}
.stat-icon.primary {
  background: #ecf5ff;
  color: #409eff;
}
.stat-icon.success {
  background: #f0f9eb;
  color: #67c23a;
}
.stat-icon.warning {
  background: #fdf6ec;
  color: #e6a23c;
}
.stat-icon.info {
  background: #f4f4f5;
  color: #909399;
}
.stat-icon.danger {
  background: #fef0f0;
  color: #f56c6c;
}
.stat-icon.purple {
  background: #f0eeff;
  color: #7c6fff;
}

.stat-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.stat-label {
  font-size: 13px;
  color: #909399;
}
.stat-value {
  font-size: 26px;
  font-weight: 800;
  line-height: 1;
}
.stat-value.primary {
  color: #409eff;
}
.stat-value.success {
  color: #67c23a;
}
.stat-value.warning {
  color: #e6a23c;
}
.stat-value.info {
  color: #909399;
}
.stat-value.danger {
  color: #f56c6c;
}
.stat-value.purple {
  color: #7c6fff;
}

/* ---------- 表格内用户信息 ---------- */
.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}
.user-detail .name {
  font-weight: 600;
  color: #303133;
  line-height: 1.3;
}
.user-detail .sub {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

/* ---------- 联系方式 ---------- */
.contact-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.contact-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  color: #606266;
}
.contact-item.muted {
  padding-left: 21px;
  font-size: 12px;
  color: #909399;
}
.email-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 150px;
}

/* ---------- 投递统计芯片 ---------- */
.apply-stats {
  display: flex;
  align-items: center;
  gap: 4px;
  justify-content: center;
}
.stat-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3px 6px;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s;
  min-width: 44px;
}
.stat-chip:hover {
  transform: scale(1.08);
}
.chip-num {
  font-size: 16px;
  font-weight: 800;
  line-height: 1.2;
}
.chip-label {
  font-size: 10px;
  margin-top: 2px;
}
.stat-chip.total {
  background: #f0f9eb;
  color: #67c23a;
}
.stat-chip.pending {
  background: #fdf6ec;
  color: #e6a23c;
}
.stat-chip.interview {
  background: #ecf5ff;
  color: #409eff;
}
.stat-chip.hired {
  background: #e8f8ee;
  color: #22c55e;
}
.stat-chip.rejected {
  background: #fef0f0;
  color: #f56c6c;
}

/* ---------- 详情弹窗：求职者简历与账号信息分区 ---------- */
.detail-section {
  margin-bottom: 14px;
}
.detail-section-title {
  margin: 0 0 8px;
  font-size: 13px;
  font-weight: 700;
  color: #303133;
}

.resume-profile-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  margin-bottom: 12px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #fafafa;
}
.resume-profile-main {
  flex: 1;
  min-width: 0;
}
.resume-profile-name {
  font-size: 18px;
  font-weight: 700;
  color: #303133;
}
.resume-profile-meta {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
}

/* ---------- 详情统计 ---------- */
.detail-stats {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.detail-stats-standalone {
  padding: 10px 12px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #fafafa;
}
.detail-stat-chip {
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}
.detail-stat-chip:hover {
  transform: translateY(-1px);
}
.detail-stat-chip.total {
  background: #f0f9eb;
  color: #67c23a;
}
.detail-stat-chip.pending {
  background: #fdf6ec;
  color: #e6a23c;
}
.detail-stat-chip.interview {
  background: #ecf5ff;
  color: #409eff;
}
.detail-stat-chip.hired {
  background: #e8f8ee;
  color: #22c55e;
}
.detail-stat-chip.rejected {
  background: #fef0f0;
  color: #f56c6c;
}

.resume-attachment {
  display: flex;
  align-items: center;
  gap: 8px;
}
.resume-attachment-box {
  padding: 10px 12px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #fafafa;
}
.resume-file-name {
  max-width: 420px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.resume-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.resume-list-item {
  padding: 10px 12px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #fff;
}
.resume-item-title {
  font-weight: 700;
  color: #303133;
}
.resume-item-meta,
.resume-item-desc,
.resume-item-extra {
  margin-top: 5px;
  font-size: 13px;
  line-height: 1.5;
  color: #606266;
}
.resume-item-meta {
  color: #909399;
}
.resume-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.resume-other-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 12px;
}
.resume-other-row {
  display: flex;
  gap: 8px;
  min-width: 0;
  padding: 9px 10px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #fafafa;
}
.resume-other-label {
  flex: 0 0 76px;
  color: #909399;
}
.resume-other-value {
  min-width: 0;
  overflow-wrap: anywhere;
  color: #303133;
}
.resume-other-link-text {
  margin-right: 8px;
}

.text-muted {
  color: #c0c4cc;
}

/* 禁言标签固定为文字单行，避免表格列宽收紧时「已禁言」折行。 */
.silence-status-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 58px;
  gap: 2px;
  white-space: nowrap;
}

.apply-dialog-query {
  padding: 14px 16px 2px;
  margin-bottom: 12px;
  background: #f8fafc;
  border: 1px solid #ebeef5;
  border-radius: 8px;
}

.import-progress {
  margin-top: 14px;
}
.import-progress-text {
  margin-top: 6px;
  font-size: 12px;
  color: #606266;
}

/* 注册/最后登录合并列：上行注册时间、下行最近登录（灰色小字） */
.time-cell {
  font-size: 12px;
  line-height: 1.6;
}
.time-cell .sub {
  color: #909399;
  font-size: 11px;
}
</style>
