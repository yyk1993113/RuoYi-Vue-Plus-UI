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

      <el-table v-loading="loading" :data="tableData" border stripe>
        <el-table-column label="岗位ID" prop="jobId" width="200" align="center" />
        <el-table-column label="岗位信息" min-width="250">
          <template #default="{ row }">
            <div class="job-info">
              <div class="job-header">
                <span class="job-name">{{ row.jobName }}</span>
                <el-tag :type="jobTypeMeta(row.jobType).type" size="small">{{ jobTypeMeta(row.jobType).label }}</el-tag>
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
                    <!-- 复制发布：进入代发整页并按 jobId 回填原岗位信息，少量修改即可重发 -->
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
          <el-descriptions-item label="岗位ID">{{ currentJob.jobId }}</el-descriptions-item>
          <el-descriptions-item label="岗位状态">
            <el-tag :type="jobStatusMeta(currentJob.status).type">{{ jobStatusMeta(currentJob.status).label }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="岗位名称" :span="2">{{ currentJob.jobName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="企业名称" :span="2">{{ currentJob.companyName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="用工性质">
            <el-tag :type="jobTypeMeta(currentJob.jobType).type">{{ jobTypeMeta(currentJob.jobType).label }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="职位类目">{{ currentJob.categoryName || currentJob.category || '-' }}</el-descriptions-item>
          <el-descriptions-item label="薪资范围">{{
            formatSalary(currentJob.salaryMin, currentJob.salaryMax, currentJob.salaryUnit)
          }}</el-descriptions-item>
          <el-descriptions-item label="招聘人数">{{
            currentJob.recruitNumber != null ? currentJob.recruitNumber + ' 人' : '-'
          }}</el-descriptions-item>
          <el-descriptions-item label="经验要求">{{ currentJob.experienceName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="学历要求">{{ currentJob.educationName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="期望到岗时间">{{ formatStartDate(currentJob.expectedStartDate) }}</el-descriptions-item>
          <el-descriptions-item label="省市区">{{
            [currentJob.province, currentJob.city, currentJob.district].filter(Boolean).join(' / ') || '-'
          }}</el-descriptions-item>
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
    <el-dialog v-model="editVisible" title="编辑岗位" width="880px" append-to-body>
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
              <JobPositionPicker
                v-model="editForm.positionName"
                placeholder="请选择标准职位（来自职位类目库）"
                @pick="selectEditStandardPosition"
              />
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
        <el-row v-if="isEditPartTime" :gutter="20">
          <el-col :span="12">
            <el-form-item label="工作时间类型" prop="workTimeType" :required="isEditPartTime">
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
        <el-divider content-position="left">
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
  </div>
</template>

<script setup name="JobManagement" lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  listJob,
  getJobStatistics,
  getJobFullDetail,
  auditJob,
  changeJobStatus,
  delJob,
  updateJob,
  refreshJobRecommendCache,
  listApply2,
  listApply
} from '@/api/recruitment';
import type { JobFullVO } from '@/api/recruitment';
import { download } from '@/utils/request';
import { REGIONS } from '@/utils/region-data';
import { unwrapList, splitToArray, formatSalary } from './helpers';
import { jobStatusMeta, jobTypeMeta } from './constants';
import JobPositionPicker from './components/JobPositionPicker.vue';

const router = useRouter();
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
    return parsed
      .map((it: any) => {
        if (it == null) return '';
        if (typeof it === 'string') return it;
        const day = it.day ?? it.week ?? it.date ?? it.label ?? '';
        const start = it.start ?? it.startTime ?? it.from ?? '';
        const end = it.end ?? it.endTime ?? it.to ?? '';
        const range = start || end ? `${start}${start && end ? '-' : ''}${end}` : '';
        const text = `${day}${day && range ? ' ' : ''}${range}`.trim();
        return text || JSON.stringify(it);
      })
      .filter(Boolean);
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
      return parsed.map((it: any) => (typeof it === 'string' ? it : (it?.label ?? it?.name ?? JSON.stringify(it)))).filter(Boolean);
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
    editForm.regionPath = [d.province, d.city, d.district].filter(Boolean);
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
  editForm.province = province;
  editForm.city = city;
  editForm.district = district;
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
  queryParams.jobId = '';
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
function handleSelectApplyUsers(row: any) {
  handleSelectApplyUsersVisible.value = true;
  queryParams1.jobId = row.jobId;
  loadData1();
}

function displayPhone(row: any): string {
  return row?.phone || '-';
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

/* 编辑弹窗：分组标题(el-divider)上下间距收紧，使三段更紧凑 */
.job-edit-form :deep(.el-divider) {
  margin: 4px 0 18px;
}

.job-edit-form :deep(.el-divider__text) {
  font-weight: 600;
  color: #303133;
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

.mr-1 {
  margin-right: 6px;
}

.mb-1 {
  margin-bottom: 6px;
}
</style>
