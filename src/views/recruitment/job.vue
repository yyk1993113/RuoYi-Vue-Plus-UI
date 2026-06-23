<template>
  <div class="p-4">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="mb-4">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-mini-card stat-clickable" role="button" tabindex="0" @click="handleStatFilter('all')" @keyup.enter="handleStatFilter('all')" @keyup.space="handleStatFilter('all')">
          <div class="stat-mini">
            <span class="label">岗位总数</span>
            <span class="value">{{ statistics.totalCount || 0 }}</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-mini-card stat-clickable warning" role="button" tabindex="0" @click="handleStatFilter('pending')" @keyup.enter="handleStatFilter('pending')" @keyup.space="handleStatFilter('pending')">
          <div class="stat-mini">
            <span class="label">待审核</span>
            <span class="value warning">{{ statistics.pendingCount || 0 }}</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-mini-card stat-clickable success" role="button" tabindex="0" @click="handleStatFilter('online')" @keyup.enter="handleStatFilter('online')" @keyup.space="handleStatFilter('online')">
          <div class="stat-mini">
            <span class="label">已上架</span>
            <span class="value success">{{ statistics.onlineCount || 0 }}</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-mini-card stat-clickable info" role="button" tabindex="0" @click="handleStatFilter('offline')" @keyup.enter="handleStatFilter('offline')" @keyup.space="handleStatFilter('offline')">
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
        <el-form-item label="岗位ID" prop="jobId">
          <el-input v-model="queryParams.jobId" placeholder="请输入岗位ID" clearable style="width: 180px" @keyup.enter="handleQuery" />
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
          </el-select>
        </el-form-item>
        <el-form-item v-show="showMoreQuery" label="工作地点" prop="workAddress">
          <el-input v-model="queryParams.workAddress" placeholder="请输入工作地点" clearable style="width: 180px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item v-show="showMoreQuery" label="薪资" prop="salary">
          <el-input v-model="queryParams.salary" placeholder="请输入薪资关键词" clearable style="width: 170px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item v-show="showMoreQuery" label="投递人数" prop="applyCount">
          <el-input-number v-model="queryParams.applyCount" :min="0" :precision="0" controls-position="right" placeholder="投递人数" style="width: 130px" />
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

      <el-table v-loading="loading" :data="tableData" border stripe>
        <el-table-column label="岗位ID" prop="jobId" width="200" align="center" />
        <el-table-column label="岗位信息" min-width="250">
          <template #default="{ row }">
            <div class="job-info">
              <div class="job-header">
                <span class="job-name">{{ row.jobName }}</span>
                <el-tag :type="jobTypeMeta(row.jobType).type" size="small">{{ jobTypeMeta(row.jobType).label }}</el-tag>
              </div>
              <div class="job-salary">{{ row.salary }}</div>
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
            <el-switch
              v-model="row.isRecommend"
              active-value="1"
              inactive-value="0"
              @change="handleRecommendChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="热门" width="80" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.isHot"
              active-value="1"
              inactive-value="0"
              @change="handleHotChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="jobStatusMeta(row.status).type">{{ jobStatusMeta(row.status).label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="发布时间" prop="publishTime" width="160" align="center" />
        <!-- 240px 容纳 详情/编辑/更多 三按钮单行展示；nowrap 防止"更多"折到第二行 -->
        <el-table-column label="操作" width="240" fixed="right" align="center">
          <template #default="{ row }">
            <div style="display: flex; align-items: center; justify-content: center; gap: 4px; flex-wrap: nowrap; white-space: nowrap;">
              <el-button link type="primary" icon="View" @click="handleDetail(row)">详情</el-button>
              <el-button link type="primary" icon="Edit" @click="handleEdit(row)">编辑</el-button>
              <el-dropdown trigger="click">
                <span class="el-dropdown-link">
                  <el-button link type="primary">更多<el-icon class="el-icon--right"><arrow-down /></el-icon></el-button>
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <!-- 候选人入口仅审核通过后展示：待审核(0)/草稿(3)岗位尚无有效投递，隐藏避免误导；
                         已上架(1)/已下架(2)/已满员(4)/已结束(5)均为通过后状态，保留查看历史候选人 -->
                    <el-dropdown-item
                      v-if="row.status !== '0' && row.status !== '3'"
                      icon="user"
                      @click="handleSelectApplyUsers(row)"
                    >候选人</el-dropdown-item>
                    <el-dropdown-item v-if="row.status === '0'" icon="CircleCheck" @click="handleAudit(row, '1')">审核通过</el-dropdown-item>
                    <el-dropdown-item v-if="row.status === '0'" icon="Close" @click="handleAudit(row, '2')">审核拒绝</el-dropdown-item>
                    <el-dropdown-item v-if="row.status === '1'" icon="Bottom" @click="handleStatusChange(row, '2')">下架</el-dropdown-item>
                    <el-dropdown-item v-if="row.status === '2'" icon="Top" @click="handleStatusChange(row, '1')">上架</el-dropdown-item>
                    <el-dropdown-item icon="Delete" @click="handleDelete(row)">删除</el-dropdown-item>
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

    <!-- 岗位详情对话框：完整字段（数据来源 GET /admin/recruitment/jobDetail/{jobId} → JobFullVO，枚举译名由后端 *Name 提供） -->
    <el-dialog v-model="detailVisible" title="岗位详情" width="760px" append-to-body>
      <div v-loading="detailLoading">
        <el-descriptions v-if="currentJob" :column="2" border>
          <!-- 基本信息 -->
          <el-descriptions-item label="岗位ID">{{ currentJob.jobId }}</el-descriptions-item>
          <el-descriptions-item label="岗位状态">
            <el-tag :type="jobStatusMeta(currentJob.status).type">{{ jobStatusMeta(currentJob.status).label }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="岗位名称" :span="2">{{ currentJob.jobName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="企业名称" :span="2">{{ currentJob.companyName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="用工性质">
            <el-tag :type="jobTypeMeta(currentJob.jobType).type">{{ jobTypeMeta(currentJob.jobType).label }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="职位类目">{{ currentJob.category || '-' }}</el-descriptions-item>
          <el-descriptions-item label="薪资范围">{{ currentJob.salary || '面议' }}</el-descriptions-item>
          <el-descriptions-item label="招聘人数">{{ currentJob.recruitNumber != null ? currentJob.recruitNumber + ' 人' : '-' }}</el-descriptions-item>
          <el-descriptions-item label="经验要求">{{ currentJob.experienceName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="学历要求">{{ currentJob.educationName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="期望到岗时间">{{ formatStartDate(currentJob.expectedStartDate) }}</el-descriptions-item>
          <el-descriptions-item label="省市区">{{ [currentJob.province, currentJob.city, currentJob.district].filter(Boolean).join(' / ') || '-' }}</el-descriptions-item>
          <el-descriptions-item label="工作地点">{{ currentJob.workAddress || '未知' }}</el-descriptions-item>

          <!-- 兼职工作时间（仅在有数据时展示，benefits/workTime 为 JSON，已在 computed 中解析） -->
          <el-descriptions-item v-if="workTimeList.length" label="兼职工作时间" :span="2">
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
            <div style="white-space: pre-wrap">{{ currentJob.highlights || '暂无' }}</div>
          </el-descriptions-item>
          <el-descriptions-item label="岗位描述" :span="2">
            <div style="white-space: pre-wrap">{{ currentJob.description || '暂无描述' }}</div>
          </el-descriptions-item>
          <el-descriptions-item label="团队介绍" :span="2">
            <div style="white-space: pre-wrap">{{ currentJob.teamIntro || '暂无' }}</div>
          </el-descriptions-item>
          <el-descriptions-item label="附加条件" :span="2">
            <div style="white-space: pre-wrap">{{ currentJob.additionalConditions || '暂无' }}</div>
          </el-descriptions-item>

          <!-- 运营信息 -->
          <el-descriptions-item label="投递人数">{{ currentJob.applyCount || 0 }}</el-descriptions-item>
          <el-descriptions-item label="浏览人数">{{ currentJob.browseCount || 0 }}</el-descriptions-item>
          <el-descriptions-item label="发布时间">{{ currentJob.publishTime || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ currentJob.createTime || '-' }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ currentJob.remark || '暂无' }}</el-descriptions-item>
        </el-descriptions>
        <el-empty v-else-if="!detailLoading" description="暂无详情数据" />
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 审核对话框：通过即上架（status=1），驳回需填原因（status=2，写入 remark） -->
    <el-dialog v-model="auditVisible" title="岗位审核" width="500px" append-to-body>
      <el-form ref="auditFormRef" :model="auditForm" label-width="80px">
        <el-form-item label="审核结果">
          <el-radio-group v-model="auditForm.status">
            <el-radio label="1">通过（上架）</el-radio>
            <el-radio label="2">驳回</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="auditForm.status === '2' ? '驳回原因' : '备注'" :required="auditForm.status === '2'">
          <el-input
            v-model="auditForm.remark"
            type="textarea"
            :rows="3"
            :placeholder="auditForm.status === '2' ? '请填写驳回原因（必填，将告知企业）' : '请输入审核备注（选填）'"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAudit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 岗位编辑对话框：运营修正岗位核心信息。
         数据来源 getJobFullDetail 全量回显；提交走 PUT /admin/recruitment/job（updateById 按非空字段更新），
         薪资改动时前端同步合成 salary 展示串（后端 update 不重算该串，不传会导致列表显示旧薪资）。 -->
    <el-dialog v-model="editVisible" title="编辑岗位" width="640px" append-to-body>
      <!-- 字段集与排序对齐 B 端发布岗位表单：名称/性质/类目/地点/薪资/经验/学历/人数/描述 -->
      <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-width="100px" v-loading="editLoading" scroll-to-error>
        <el-form-item label="岗位名称" prop="jobName">
          <el-input v-model="editForm.jobName" placeholder="请输入岗位名称" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="用工性质" prop="jobType">
          <el-radio-group v-model="editForm.jobType">
            <el-radio label="0">全职</el-radio>
            <el-radio label="1">兼职</el-radio>
            <el-radio label="2">临时工</el-radio>
            <el-radio label="3">项目制</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="职位类目" prop="category">
          <el-select v-model="editForm.category" placeholder="请选择职位类目" clearable filterable style="width: 100%">
            <el-option v-for="opt in categoryOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="省市区" prop="regionPath">
          <el-cascader
            v-model="editForm.regionPath"
            :options="regionOptions"
            filterable
            clearable
            placeholder="请选择省 / 市 / 区县"
            style="width: 100%"
            @change="syncEditRegionFromPath"
          />
        </el-form-item>
        <el-form-item label="工作地点" prop="workAddress">
          <el-input v-model="editForm.workAddress" placeholder="请输入详细地址" maxlength="200" />
        </el-form-item>
        <el-form-item label="薪资区间" prop="salaryMin">
          <div style="display: flex; align-items: center; gap: 8px; width: 100%">
            <el-input-number v-model="editForm.salaryMin" :min="0" :max="9999999" controls-position="right" placeholder="最低" style="width: 150px" />
            <span>至</span>
            <el-input-number v-model="editForm.salaryMax" :min="0" :max="9999999" controls-position="right" placeholder="最高" style="width: 150px" />
            <el-select v-model="editForm.salaryUnit" style="width: 100px">
              <el-option label="元/月" value="1" />
              <el-option label="元/天" value="0" />
              <el-option label="元/小时" value="3" />
              <el-option label="元/次" value="2" />
            </el-select>
          </div>
        </el-form-item>
        <el-form-item label="经验要求" prop="experience">
          <el-select v-model="editForm.experience" placeholder="请选择经验要求" clearable style="width: 100%">
            <el-option v-for="opt in experienceOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="学历要求" prop="education">
          <el-select v-model="editForm.education" placeholder="请选择学历要求" clearable style="width: 100%">
            <el-option v-for="opt in educationOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="招聘人数" prop="recruitNumber">
          <el-input-number v-model="editForm.recruitNumber" :min="1" :max="9999" controls-position="right" style="width: 150px" />
          <span style="margin-left: 8px; color: #606266">人</span>
        </el-form-item>
        <el-form-item label="岗位描述" prop="description">
          <el-input v-model="editForm.description" type="textarea" :rows="5" placeholder="岗位职责、工作内容、任职要求等" maxlength="2000" show-word-limit />
        </el-form-item>
        <!-- 岗位福利：小程序端为 JSON 数组串、B 端 PC 为纯文本，此处原样回显/原样保存不做转换，避免破坏来源格式 -->
        <el-form-item label="岗位福利">
          <el-input v-model="editForm.benefits" type="textarea" :rows="3" placeholder="选填：如五险一金、餐补、年终奖、弹性工作等" maxlength="500" show-word-limit />
        </el-form-item>
        <el-form-item label="团队介绍">
          <el-input v-model="editForm.teamIntro" type="textarea" :rows="3" placeholder="选填：介绍团队规模、氛围、技术栈等" maxlength="500" show-word-limit />
        </el-form-item>
        <el-form-item label="附加条件">
          <el-input v-model="editForm.additionalConditions" type="textarea" :rows="3" placeholder="选填：任职附加条件（如需自带工具、接受出差、持有相关证书等）" maxlength="500" show-word-limit />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="editForm.remark" type="textarea" :rows="2" placeholder="运营备注（选填）" maxlength="200" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="editSubmitting" @click="submitEdit">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="handleSelectApplyUsersVisible" title="投递人员" width="85%" append-to-body>
      <!-- ========== 数据表格 ========== -->
        <el-table  :data="SelectApplyUsertableData" border stripe>
          <el-table-column label="投递ID" prop="applyId" width="200" align="center" />
          <el-table-column label="求职者信息" min-width="160">
            <template #default="{ row }">
              <div class="user-cell">
                <el-avatar :size="34" :src="row.avatarUrl || row.avatar" style="background: #2b7fff; flex-shrink: 0">
                  {{ (row.userName || 'U').charAt(0) }}
                </el-avatar>
                <div class="user-detail">
                  <div class="name">{{ row.userName || (row.userId ? '用户#' + row.userId : '未知用户') }}</div>
                  <div class="phone">{{ displayPhone(row) }}</div>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="岗位信息" min-width="150">
            <template #default="{ row }">
              <div class="job-cell">
                <div class="job-name">{{ row.jobName || (row.jobId ? '岗位#' + row.jobId : '-') }}</div>
                <div class="salary">{{ row.salary || '' }}</div>
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
              <el-tag
                v-if="row.exchanged === true || row.exchanged === '1' || (typeof row.exchanged === 'number' && row.exchanged > 0)"
                type="success"
                size="small"
              >已交换</el-tag
              >
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
        <pagination v-show="total1 > 0" v-model:page="queryParams1.pageNum" v-model:limit="queryParams1.pageSize" :total="total1" @pagination="loadData1" />
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="JobManagement" lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { computed } from 'vue';
import {
  listJob,
  getJobStatistics,
  getJobFullDetail,
  auditJob,
  changeJobStatus,
  delJob,
  updateJob,
  refreshJobRecommendCache,
  listApply2, listApply
} from '@/api/recruitment';
import type { JobFullVO } from '@/api/recruitment';
import { download } from '@/utils/request';
import { REGIONS } from '@/utils/region-data';
import { unwrapList, splitToArray } from './helpers';
import { jobStatusMeta, jobTypeMeta } from './constants';

const loading = ref(false);
const refreshing = ref(false);
const total = ref(0);
const total1 = ref(0);
const tableData = ref<any[]>([]);
const SelectApplyUsertableData = ref<any[]>([]);
const detailVisible = ref(false);
const auditVisible = ref(false);
const handleSelectApplyUsersVisible = ref(false);

// 当前查看的岗位完整字段（数据来源：GET /admin/recruitment/jobDetail/{jobId} → JobFullVO）
const currentJob = ref<JobFullVO | null>(null);
const detailLoading = ref(false);
const queryFormRef = ref();
const auditFormRef = ref();
const dateRange = ref<[string, string] | []>([]);
const showMoreQuery = ref(false);

// 兼职工作时间：后端 workTime 为 JSON 字符串，解析为可读的时段文本数组供详情渲染。
// 兼容两种常见结构：字符串数组，或对象数组（取 start/end、day/time、label 等常见键拼装）。
const workTimeList = computed<string[]>(() => {
  const raw = currentJob.value?.workTime;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [String(raw)];
    return parsed.map((it: any) => {
      if (it == null) return '';
      if (typeof it === 'string') return it;
      const day = it.day ?? it.week ?? it.date ?? it.label ?? '';
      const start = it.start ?? it.startTime ?? it.from ?? '';
      const end = it.end ?? it.endTime ?? it.to ?? '';
      const range = start || end ? `${start}${start && end ? '-' : ''}${end}` : '';
      const text = `${day}${day && range ? ' ' : ''}${range}`.trim();
      return text || JSON.stringify(it);
    }).filter(Boolean);
  } catch {
    // 非合法 JSON 时原样展示，避免详情空白
    return [String(raw)];
  }
});

// 岗位福利：后端 benefits 为 JSON 数组字符串，解析为标签数组渲染。非法 JSON 时按逗号兜底切分。
const benefitsList = computed<string[]>(() => {
  const raw = currentJob.value?.benefits;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((it: any) => (typeof it === 'string' ? it : it?.label ?? it?.name ?? JSON.stringify(it))).filter(Boolean);
    }
    return [String(parsed)];
  } catch {
    // 非法 JSON 时按中英文逗号兜底切分
    return splitToArray(raw);
  }
});

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  jobId: '',
  jobName: '',
  jobType: '',
  status: '',
  companyName: '',
  isRecommend: '',
  isHot: '',
  workAddress: '',
  salary: '',
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
  jobType: '0',
  category: '',
  regionPath: [] as string[],
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
  description: '',
  benefits: '',
  teamIntro: '',
  additionalConditions: '',
  remark: ''
});

// 职位类目：与 B 端发布表单同一套本地常量（value 为字典值、label 为展示名），保证两端落库口径一致
const categoryOptions = [
  { value: 'tech', label: '技术研发' },
  { value: 'product', label: '产品' },
  { value: 'design', label: '设计' },
  { value: 'operation', label: '运营' },
  { value: 'marketing', label: '市场营销' },
  { value: 'sales', label: '销售' },
  { value: 'service', label: '客服' },
  { value: 'finance', label: '财务/会计' },
  { value: 'hr', label: '人力资源/行政' },
  { value: 'logistics', label: '物流/仓储' },
  { value: 'catering', label: '餐饮/服务业' },
  { value: 'retail', label: '零售/导购' },
  { value: 'manufacture', label: '生产/制造' },
  { value: 'education', label: '教育/培训' },
  { value: 'other', label: '其他' }
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

// 运营后台编辑岗位同样使用三级联动数据源，地区字段只由 cascader 拆分生成。
const regionOptions = REGIONS.map((province: any) => ({
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
}));

const editRules = {
  jobName: [{ required: true, message: '请输入岗位名称', trigger: 'blur' }],
  jobType: [{ required: true, message: '请选择用工性质', trigger: 'change' }],
  category: [{ required: true, message: '请选择职位类目', trigger: 'change' }],
  regionPath: [{ required: true, type: 'array', min: 3, message: '请选择省市区', trigger: 'change' }],
  workAddress: [{ required: true, message: '请输入工作地点', trigger: 'blur' }],
  experience: [{ required: true, message: '请选择经验要求', trigger: 'change' }],
  education: [{ required: true, message: '请选择学历要求', trigger: 'change' }],
  recruitNumber: [{ required: true, message: '请输入招聘人数', trigger: 'change' }],
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

// 薪资单位归一：编辑提交只发新契约 0天/1月/2次/3小时；中文仅用于兼容存量回显。
function normalizeSalaryUnit(u?: string): string {
  const unit = String(u || '').trim();
  const codeMap: Record<string, string> = {
    '0': '0',
    '1': '1',
    '2': '2',
    '3': '3',
    天: '0',
    日: '0',
    月: '1',
    次: '2',
    时: '3',
    小时: '3',
    '元/天': '0',
    '元/月': '1',
    '元/次': '2',
    '元/时': '3',
    '元/小时': '3'
  };
  return codeMap[unit] || '1';
}

function salaryUnitSuffix(unit: string): string {
  return ({ '0': '天', '1': '月', '2': '次', '3': '小时' } as Record<string, string>)[unit] || '月';
}

// 打开编辑：拉全量详情回显（列表行字段不全，缺 salaryMin/Max/recruitNumber/description 等）
async function handleEdit(row: any) {
  editVisible.value = true;
  editLoading.value = true;
  try {
    const res = await getJobFullDetail(row.jobId);
    const d: any = res.data || {};
    editForm.jobId = d.jobId ?? row.jobId;
    editForm.jobName = d.jobName ?? '';
    editForm.jobType = d.jobType != null ? String(d.jobType) : '0';
    editForm.category = d.category != null ? String(d.category) : '';
    editForm.province = d.province ?? '';
    editForm.city = d.city ?? '';
    editForm.district = d.district ?? '';
    editForm.regionPath = [d.province, d.city, d.district].filter(Boolean);
    editForm.salaryMin = d.salaryMin ?? undefined;
    editForm.salaryMax = d.salaryMax ?? undefined;
    editForm.salaryUnit = normalizeSalaryUnit(d.salaryUnit);
    editForm.workAddress = d.workAddress || '';
    editForm.experience = d.experience != null ? String(d.experience) : '';
    editForm.education = d.education != null ? String(d.education) : '';
    editForm.recruitNumber = d.recruitNumber ?? undefined;
    editForm.description = d.description ?? '';
    editForm.benefits = d.benefits ?? '';
    editForm.teamIntro = d.teamIntro ?? '';
    editForm.additionalConditions = d.additionalConditions ?? '';
    editForm.remark = d.remark ?? '';
    editFormRef.value?.clearValidate?.();
  } catch (error) {
    ElMessage.error('获取岗位详情失败');
    editVisible.value = false;
  } finally {
    editLoading.value = false;
  }
}

// 保存编辑：只提交结构化地区和 workAddress；salary 展示串同步合成，salaryUnit 仅提交新契约码值。
async function submitEdit() {
  editFormRef.value?.validate(async (valid: boolean) => {
    if (!valid) return;
    editSubmitting.value = true;
    try {
      syncEditRegionFromPath();
      await updateJob({
        jobId: editForm.jobId,
        jobName: editForm.jobName,
        jobType: editForm.jobType,
        category: editForm.category,
        province: editForm.province,
        city: editForm.city,
        district: editForm.district,
        salaryMin: editForm.salaryMin,
        salaryMax: editForm.salaryMax,
        salaryUnit: editForm.salaryUnit,
        salary: `${editForm.salaryMin}-${editForm.salaryMax}/${salaryUnitSuffix(editForm.salaryUnit)}`,
        workAddress: editForm.workAddress,
        experience: editForm.experience,
        education: editForm.education,
        recruitNumber: editForm.recruitNumber,
        description: editForm.description,
        benefits: editForm.benefits,
        teamIntro: editForm.teamIntro,
        additionalConditions: editForm.additionalConditions,
        remark: editForm.remark || undefined
      });
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

function syncEditRegionFromPath() {
  const [province = '', city = '', district = ''] = editForm.regionPath || [];
  editForm.province = province;
  editForm.city = city;
  editForm.district = district;
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
    let res: any;
    res = await listApply(params);

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
  queryParams.jobId = '';
  queryParams.jobName = '';
  queryParams.jobType = '';
  queryParams.status = '';
  queryParams.companyName = '';
  queryParams.isRecommend = '';
  queryParams.isHot = '';
  queryParams.workAddress = '';
  queryParams.salary = '';
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
  currentJob.value = null;
  try {
    const res = await getJobFullDetail(row.jobId);
    currentJob.value = res.data;
  } catch (error) {
    ElMessage.error('获取岗位详情失败');
  } finally {
    detailLoading.value = false;
  }
}

function handleAudit(row: any, status: string) {
  auditForm.jobId = row.jobId;
  auditForm.status = status;
  auditForm.remark = '';
  auditVisible.value = true;
}

// 从岗位行进入投递人员弹窗：只透传雪花 jobId 字符串，避免大整数精度丢失。
function handleSelectApplyUsers(row: any){
  handleSelectApplyUsersVisible.value=true;
  queryParams1.jobId = row.jobId;
  loadData1();
}

function displayPhone(row: any): string {
  return row?.phone || '-';
}

async function submitAudit() {
  // 驳回（status=2）必须填写原因，写入 Job.remark 一并提交（后端 /job/audit 取 status + remark）
  if (auditForm.status === '2' && !auditForm.remark.trim()) {
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

onMounted(() => {
  loadData();
  loadStatistics();
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
  transition: transform 0.15s ease, box-shadow 0.15s ease;
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
  color: #E6A23C;
}

.stat-mini .value.success {
  color: #67C23A;
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
  color: #F56C6C;
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

/* 详情弹窗内福利/工作时间标签的换行排布 */
.detail-tags {
  display: flex;
  flex-wrap: wrap;
}

.mr-1 {
  margin-right: 6px;
}

.mb-1 {
  margin-bottom: 6px;
}
</style>
