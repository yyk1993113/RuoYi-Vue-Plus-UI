<template>
  <!--
    平台后台 路 渠道推广管理页。    职责：用页签拆分推广统计看板与推广人员维护；统计数据来自
    GET /admin/recruitment/promoter/statistics，列表/表单来自同模块 CRUD 接口。  -->
  <div class="promoter-page">
    <div class="promoter-tabs-shell">
      <el-tabs v-model="activeTab" class="promoter-tabs" @tab-change="handleTabChange">
        <el-tab-pane v-if="isAdminUser" label="总览统计" name="overview">
          <div v-loading="statisticsLoading" class="overview-board">
            <div class="board-head">
              <div>
                <div class="board-title">推广数据总览</div>
                <div class="board-subtitle">按年、半年、季度、月统计 B/C 端整体转化</div>
              </div>
              <div class="board-actions">
                <el-button icon="Download" @click="handlePeriodStatisticsExport">导出周期统计</el-button>
                <el-button icon="Refresh" :loading="statisticsLoading" @click="loadStatistics">刷新总览</el-button>
              </div>
            </div>

            <div class="overview-grid">
              <div v-for="card in overviewCards" :key="card.key" class="overview-card" :class="card.tone">
                <span class="metric-label">{{ card.label }}</span>
                <strong>{{ card.value }}</strong>
                <span class="metric-sub">{{ card.sub }}</span>
              </div>
            </div>

            <div class="overview-table">
              <div class="panel-head">
                <span>统计口径</span>
                <el-tag size="small" effect="plain">年 / 半年 / 季度 / 月</el-tag>
              </div>
              <el-table :data="overviewRows" border stripe>
                <el-table-column label="统计项" prop="label" min-width="180" />
                <el-table-column label="说明" prop="description" min-width="300" show-overflow-tooltip />
                <el-table-column label="今日" prop="today" width="110" align="center" />
                <el-table-column label="本年" prop="year" width="110" align="center" />
                <el-table-column label="本半年" prop="halfYear" width="110" align="center" />
                <el-table-column label="本季度" prop="quarter" width="110" align="center" />
                <el-table-column label="本月" prop="month" width="110" align="center" />
              </el-table>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane v-if="isAdminUser" label="人员渠道统计" name="identity">
          <div v-loading="statisticsLoading" class="overview-board">
            <div class="board-head">
              <div>
                <div class="board-title">内部人员 / 渠道统计</div>
                <div class="board-subtitle">按年、半年、季度、月拆分内部人员与渠道贡献</div>
              </div>
              <div class="board-actions">
                <el-button icon="Download" @click="handlePeriodStatisticsExport">导出周期统计</el-button>
                <el-button icon="Refresh" :loading="statisticsLoading" @click="loadStatistics">刷新统计</el-button>
              </div>
            </div>
            <div class="chart-layout secondary">
              <div class="chart-panel">
                <div class="panel-head">
                  <span>内部/渠道趋势</span>
                  <el-tag size="small" effect="plain">按周期统计</el-tag>
                </div>
                <div ref="identityPeriodChartRef" class="chart-main compact"></div>
              </div>
              <div class="chart-panel">
                <div class="panel-head">
                  <span>内部/渠道分布</span>
                  <el-tag size="small" effect="plain">当前筛选数据</el-tag>
                </div>
                <div ref="identityDistributionChartRef" class="chart-main compact"></div>
              </div>
              <div class="chart-panel">
                <div class="panel-head">
                  <span>内部/渠道折线</span>
                  <el-tag size="small" effect="plain">{{ metricLabel }}</el-tag>
                </div>
                <div ref="identityLineChartRef" class="chart-main compact"></div>
              </div>
            </div>
            <div class="overview-table">
              <div class="panel-head">
                <span>内部人员 / 渠道拆分</span>
                <el-tag size="small" effect="plain">推广人贡献</el-tag>
              </div>
              <el-table :data="identityPeriodRows" border stripe>
                <el-table-column label="统计周期" prop="label" min-width="110" fixed />
                <el-table-column label="内部人员" align="center">
                  <el-table-column label="人数" prop="internalPromoterCount" width="90" align="center" />
                  <el-table-column label="B端企业" prop="internalCompanyCount" width="110" align="center" />
                  <el-table-column label="C端用户" prop="internalJobSeekerCount" width="110" align="center" />
                </el-table-column>
                <el-table-column label="渠道" align="center">
                  <el-table-column label="人数" prop="channelPromoterCount" width="90" align="center" />
                  <el-table-column label="B端企业" prop="channelCompanyCount" width="110" align="center" />
                  <el-table-column label="C端用户" prop="channelJobSeekerCount" width="110" align="center" />
                </el-table-column>
              </el-table>
              <el-alert
                v-if="statisticsData.overview?.remark"
                class="overview-remark"
                type="info"
                :closable="false"
                show-icon
                :title="statisticsData.overview.remark"
              />
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane v-if="isAdminUser" label="活跃统计" name="statistics">
          <div v-loading="statisticsLoading" class="statistics-board">
            <div class="board-head">
              <div>
                <div class="board-title">渠道推广活跃统计</div>
                <div class="board-subtitle">推广人、身份、时间、B/C端、状态</div>
              </div>
              <div class="board-actions">
                <el-button icon="Download" @click="handleStatisticsExport">导出汇总统计</el-button>
                <el-button icon="Refresh" :loading="statisticsLoading" @click="loadStatistics">刷新统计</el-button>
              </div>
            </div>

            <el-form :model="statisticsQuery" :inline="true" label-width="76px" class="statistics-filter">
              <el-form-item label="推广人">
                <el-input v-model="statisticsQuery.name" placeholder="姓名/昵称" clearable style="width: 180px" @keyup.enter="loadStatistics" />
              </el-form-item>
              <el-form-item label="身份">
                <el-select v-model="statisticsQuery.identityType" placeholder="全部" clearable style="width: 150px">
                  <el-option label="内部人员" value="0" />
                  <el-option label="外部渠道" value="1" />
                  <el-option label="合伙人" value="2" />
                </el-select>
              </el-form-item>
              <el-form-item label="状态">
                <el-select v-model="statisticsQuery.status" placeholder="全部" clearable style="width: 130px">
                  <el-option label="启用" value="1" />
                  <el-option label="禁用" value="0" />
                </el-select>
              </el-form-item>
              <el-form-item label="时间">
                <el-date-picker
                  v-model="statisticsDateRange"
                  type="daterange"
                  value-format="YYYY-MM-DD"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  range-separator="-"
                  style="width: 240px"
                />
              </el-form-item>
              <el-form-item label="时间维度">
                <el-select v-model="statisticsTimeUnit" placeholder="按天" style="width: 126px">
                  <el-option v-for="item in statisticsTimeUnitOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
              <el-form-item label="B/C端">
                <el-radio-group v-model="statisticsSide">
                  <el-radio-button value="all">合计</el-radio-button>
                  <el-radio-button value="company">B端</el-radio-button>
                  <el-radio-button value="jobSeeker">C端</el-radio-button>
                </el-radio-group>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" icon="Search" @click="loadStatistics">搜索</el-button>
                <el-button icon="Refresh" @click="resetStatisticsQuery">重置</el-button>
              </el-form-item>
            </el-form>

            <div class="metric-grid">
              <div v-for="card in metricCards" :key="card.key" class="metric-card" :class="card.tone">
                <span class="metric-label">{{ card.label }}</span>
                <strong>{{ card.value }}</strong>
                <span class="metric-sub">{{ card.sub }}</span>
              </div>
            </div>

            <div class="chart-layout main">
              <div class="chart-panel chart-panel-wide">
                <div class="panel-head">
                  <span>按时间趋势</span>
                  <el-tag size="small" effect="plain">{{ metricLabel }}</el-tag>
                </div>
                <div ref="trendChartRef" class="chart-main"></div>
              </div>
              <div class="chart-panel">
                <div class="panel-head">
                  <span>B/C端占比</span>
                  <el-tag size="small" effect="plain">总量</el-tag>
                </div>
                <div ref="sideChartRef" class="chart-main"></div>
              </div>
            </div>

            <div class="chart-layout secondary">
              <div class="chart-panel">
                <div class="panel-head">
                  <span>推广人排行</span>
                  <el-tag size="small" effect="plain">Top 8</el-tag>
                </div>
                <div ref="promoterChartRef" class="chart-main compact"></div>
              </div>
              <div class="chart-panel">
                <div class="panel-head">
                  <span>身份分布</span>
                  <el-tag size="small" effect="plain">{{ metricLabel }}</el-tag>
                </div>
                <div ref="identityChartRef" class="chart-main compact"></div>
              </div>
              <div class="chart-panel">
                <div class="panel-head">
                  <span>状态分布</span>
                  <el-tag size="small" effect="plain">账号数</el-tag>
                </div>
                <div ref="statusChartRef" class="chart-main compact"></div>
              </div>
            </div>

            <div class="detail-panel">
              <div class="panel-head">
                <span>统计明细</span>
                <el-tag size="small" effect="plain">{{ statisticsRows.length }} 条</el-tag>
              </div>
              <el-table :data="statisticsRows" border stripe max-height="320">
                <el-table-column label="推广人" min-width="160" show-overflow-tooltip>
                  <template #default="{ row }">
                    <div class="name-cell">
                      <span class="name-text">{{ row.name || '-' }}</span>
                      <span class="sub-text">{{ row.phonenumber || '-' }}</span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column label="身份" prop="identityType" width="120" align="center">
                  <template #default="{ row }">
                    <el-tag :type="identityTypeTag(row.identityType)" size="small">{{ identityTypeText(row.identityType) }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="状态" prop="status" width="90" align="center">
                  <template #default="{ row }">
                    <el-tag :type="statusTag(row.status)" size="small">{{ statusText(row.status) }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="B端企业" prop="companyCount" width="110" align="center">
                  <template #default="{ row }">{{ row.companyCount || 0 }}</template>
                </el-table-column>
                <el-table-column label="C端求职者" prop="jobSeekerCount" width="120" align="center">
                  <template #default="{ row }">{{ row.jobSeekerCount || 0 }}</template>
                </el-table-column>
                <el-table-column label="授权手机号" prop="authorizedCount" width="110" align="center">
                  <template #default="{ row }">{{ row.authorizedCount || 0 }}</template>
                </el-table-column>
                <el-table-column label="完成简历" prop="resumeCount" width="100" align="center">
                  <template #default="{ row }">{{ row.resumeCount || 0 }}</template>
                </el-table-column>
                <el-table-column label="产生投递" prop="applyCount" width="100" align="center">
                  <template #default="{ row }">{{ row.applyCount || 0 }}</template>
                </el-table-column>
                <el-table-column label="合计" width="100" align="center">
                  <template #default="{ row }">{{ rowMetric(row) }}</template>
                </el-table-column>
                <el-table-column label="创建时间" prop="createTime" width="170" align="center" />
              </el-table>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane v-if="isAdminUser" label="统计明细" name="statisticsDetail">
          <div v-loading="detailLoading" class="statistics-board">
            <div class="board-head">
              <div>
                <div class="board-title">推广来源明细</div>
                <div class="board-subtitle">按 B 端企业 / C 端求职者拆分查看授权、简历、投递转化节点</div>
              </div>
              <div class="board-actions">
                <el-button icon="Download" @click="handleAttributionExport">导出</el-button>
                <el-button icon="Refresh" :loading="detailLoading" @click="loadAttributionDetails">刷新明细</el-button>
              </div>
            </div>

            <el-form :model="detailQuery" :inline="true" label-width="76px" class="statistics-filter">
              <el-form-item label="B/C端">
                <el-radio-group v-model="detailObjectType" @change="handleDetailTypeChange">
                  <el-radio-button value="company">B端企业</el-radio-button>
                  <el-radio-button value="user">C端求职者</el-radio-button>
                </el-radio-group>
              </el-form-item>
              <el-form-item label="推广人">
                <el-input v-model="detailQuery.promoterKeyword" placeholder="姓名/手机号" clearable style="width: 180px" @keyup.enter="handleAttributionQuery" />
              </el-form-item>
              <el-form-item label="身份">
                <el-select v-model="detailQuery.identityType" placeholder="全部" clearable style="width: 150px">
                  <el-option label="内部人员" value="0" />
                  <el-option label="外部渠道" value="1" />
                  <el-option label="合伙人" value="2" />
                </el-select>
              </el-form-item>
              <el-form-item label="状态">
                <el-select v-model="detailQuery.status" placeholder="全部" clearable style="width: 150px">
                  <el-option v-for="item in detailStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
              <el-form-item :label="detailObjectType === 'company' ? '企业' : '求职者'">
                <el-input v-model="detailQuery.keyword" :placeholder="detailKeywordPlaceholder" clearable style="width: 210px" @keyup.enter="handleAttributionQuery" />
              </el-form-item>
              <el-form-item label="时间">
                <el-date-picker
                  v-model="detailDateRange"
                  type="daterange"
                  value-format="YYYY-MM-DD"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  range-separator="-"
                  style="width: 240px"
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" icon="Search" @click="handleAttributionQuery">查询</el-button>
                <el-button icon="Refresh" @click="resetAttributionQuery">重置</el-button>
              </el-form-item>
            </el-form>

            <div class="detail-panel">
              <div class="panel-head">
                <span>{{ detailObjectTypeName }}明细</span>
                <el-tag size="small" effect="plain">{{ detailTotal }} 条</el-tag>
              </div>
              <el-table :data="attributionDetailRows" border stripe max-height="520">
                <el-table-column :label="detailObjectType === 'company' ? '企业' : '求职者'" min-width="180" show-overflow-tooltip>
                  <template #default="{ row }">
                    <div class="name-cell">
                      <span class="name-text">{{ row.objectName || '-' }}</span>
                      <span class="sub-text">{{ row.phone || '-' }}</span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column label="来源推广人" min-width="160" show-overflow-tooltip>
                  <template #default="{ row }">
                    <div class="name-cell">
                      <span class="name-text">{{ row.promoterName || '-' }}</span>
                      <span class="sub-text">{{ row.promoterPhone || '-' }}</span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column label="身份" prop="identityType" width="120" align="center">
                  <template #default="{ row }">
                    <el-tag :type="identityTypeTag(row.identityType)" size="small">{{ row.identityTypeName || identityTypeText(row.identityType) }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="状态" prop="statusName" width="120" align="center">
                  <template #default="{ row }">
                    <el-tag :type="detailStatusTag(row)" size="small">{{ row.statusName || '-' }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column v-if="detailObjectType === 'company'" label="资料完整" prop="completed" width="100" align="center">
                  <template #default="{ row }">
                    <el-tag :type="yesNoTag(row.completed)" size="small">{{ row.completed || '-' }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column v-if="detailObjectType === 'company'" label="岗位数" prop="jobCount" width="90" align="center" />
                <el-table-column v-if="detailObjectType === 'user'" label="授权" prop="authorized" width="90" align="center">
                  <template #default="{ row }">
                    <el-tag :type="yesNoTag(row.authorized)" size="small">{{ row.authorized || '-' }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column v-if="detailObjectType === 'user'" label="简历" prop="resumeCompleted" width="90" align="center">
                  <template #default="{ row }">
                    <el-tag :type="yesNoTag(row.resumeCompleted)" size="small">{{ row.resumeCompleted || '-' }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column v-if="detailObjectType === 'user'" label="投递" prop="applied" width="90" align="center">
                  <template #default="{ row }">
                    <el-tag :type="yesNoTag(row.applied)" size="small">{{ row.applied || '-' }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="首次进入" prop="promotedAt" width="170" align="center">
                  <template #default="{ row }">{{ row.promotedAt || row.createTime || '-' }}</template>
                </el-table-column>
                <el-table-column v-if="detailObjectType === 'user'" label="授权时间" prop="authorizedTime" width="170" align="center" />
                <el-table-column v-if="detailObjectType === 'user'" label="简历时间" prop="resumeCompletedTime" width="170" align="center" />
                <el-table-column v-if="detailObjectType === 'user'" label="投递时间" prop="firstApplyTime" width="170" align="center" />
                <el-table-column label="操作" width="110" fixed="right" align="center">
                  <template #default="{ row }">
                    <el-button link type="primary" icon="Edit" @click="openAdjustAttribution(row)">调整来源</el-button>
                  </template>
                </el-table-column>
              </el-table>
              <pagination
                v-show="detailTotal > 0"
                v-model:page="detailQuery.pageNum"
                v-model:limit="detailQuery.pageSize"
                :total="detailTotal"
                @pagination="loadAttributionDetails"
              />
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="推广渠道维护" name="list">
          <el-card shadow="never" class="query-card">
            <template #header>
              <div class="card-head">
                <span>人员筛选</span>
                <el-button link type="primary" @click="showMoreQuery = !showMoreQuery">{{ showMoreQuery ? '收起' : '更多条件' }}</el-button>
              </div>
            </template>
            <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="88px" class="query-form">
              <el-form-item label="姓名/昵称" prop="name">
                <el-input v-model="queryParams.name" placeholder="请输入姓名/昵称" clearable style="width: 200px" @keyup.enter="handleQuery" />
              </el-form-item>
              <el-form-item label="手机号" prop="phonenumber">
                <el-input v-model="queryParams.phonenumber" placeholder="请输入手机号" clearable style="width: 200px" @keyup.enter="handleQuery" />
              </el-form-item>
              <el-form-item label="身份类型" prop="identityType">
                <el-select v-model="queryParams.identityType" placeholder="全部" clearable style="width: 150px">
                  <el-option label="内部渠道" value="0" />
                  <el-option label="外部渠道" value="1" />
                  <el-option label="合伙人" value="2" />
                </el-select>
              </el-form-item>
              <el-form-item label="岗位/角色" prop="roleName">
                <el-input v-model="queryParams.roleName" placeholder="请输入岗位/角色" clearable style="width: 180px" @keyup.enter="handleQuery" />
              </el-form-item>
              <el-form-item label="账号状态" prop="status">
                <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 130px">
                  <el-option label="启用" value="1" />
                  <el-option label="禁用" value="0" />
                </el-select>
              </el-form-item>
              <el-form-item v-show="showMoreQuery" label="创建时间">
                <el-date-picker
                  v-model="listDateRange"
                  type="daterange"
                  value-format="YYYY-MM-DD"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  range-separator="-"
                  style="width: 240px"
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
                <el-button icon="Refresh" @click="resetQuery">重置</el-button>
              </el-form-item>
            </el-form>
          </el-card>

          <el-card shadow="never" class="table-card">
            <template #header>
              <div class="table-head">
                <div>
                  <span class="table-title">推广人员管理</span>
                  <span class="table-subtitle">维护推广账号、推广码与B/C端数量</span>
                </div>
                <div class="table-actions">
                  <el-button type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
                  <el-button plain icon="Refresh" @click="loadData">刷新</el-button>
                </div>
              </div>
            </template>

            <el-table v-loading="loading" :data="tableData" border stripe>
              <el-table-column label="推广人" min-width="170" show-overflow-tooltip>
                <template #default="{ row }">
                  <div class="name-cell">
                    <span class="name-text">{{ row.name || '-' }}</span>
                    <span class="sub-text">{{ row.phonenumber || '-' }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="身份类型" prop="identityType" width="120" align="center">
                <template #default="{ row }">
                  <el-tag :type="identityTypeTag(row.identityType)" size="small">
                    {{ identityTypeText(row.identityType) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="岗位/角色" prop="roleName" min-width="150" show-overflow-tooltip />
              <el-table-column label="B端企业" prop="companyCount" width="105" align="center">
                <template #default="{ row }">{{ row.companyCount ?? 0 }}</template>
              </el-table-column>
              <el-table-column label="C端求职者" prop="jobSeekerCount" width="120" align="center">
                <template #default="{ row }">{{ row.jobSeekerCount ?? 0 }}</template>
              </el-table-column>
              <el-table-column label="账号状态" prop="status" width="120" align="center">
                <template #default="{ row }">
                  <el-switch
                    :model-value="row.status"
                    active-value="1"
                    inactive-value="0"
                    active-text="启用"
                    inactive-text="禁用"
                    inline-prompt
                    @change="(val) => handleStatusChange(row, val as string)"
                  />
                </template>
              </el-table-column>
              <el-table-column label="推广码链接" prop="promotionCode" min-width="220" show-overflow-tooltip>
                <template #default="{ row }">
                  <div class="promotion-cell">
                    <span class="promotion-code">{{ row.promotionCode || '-' }}</span>
                    <el-button v-if="row.promotionCode" link type="primary" icon="CopyDocument" @click="handleCopyPromotion(row)">复制</el-button>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="备注" prop="remark" min-width="180" show-overflow-tooltip>
                <template #default="{ row }">{{ row.remark || '-' }}</template>
              </el-table-column>
              <el-table-column label="创建时间" prop="createTime" width="170" align="center" />
              <el-table-column label="操作" width="170" fixed="right" align="center">
                <template #default="{ row }">
                  <el-button link type="primary" icon="Download" @click="handleDownloadQrCode(row)">下载码</el-button>
                  <el-button link type="primary" icon="Edit" @click="handleEdit(row)">编辑</el-button>
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
        </el-tab-pane>
      </el-tabs>
    </div>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="560px" append-to-body @closed="resetForm">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="姓名/昵称" prop="name">
          <el-input v-model="form.name" placeholder="请输入推广人员展示名称" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="手机号" prop="phonenumber">
          <el-input v-model="form.phonenumber" placeholder="账号登录手机号，作为唯一标识" maxlength="11" />
        </el-form-item>
        <el-form-item label="身份类型" prop="identityType">
          <el-radio-group v-model="form.identityType" @change="handleIdentityTypeChange">
            <el-radio label="0">内部渠道</el-radio>
            <el-radio label="1">外部渠道</el-radio>
            <el-radio label="2">合伙人</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="岗位/角色" prop="roleName">
          <el-select v-model="form.roleName" placeholder="请选择岗位/角色" clearable filterable style="width: 100%">
            <el-option v-for="item in roleOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-row v-if="isEdit" :gutter="12">
          <el-col :span="12">
            <el-form-item label="B端企业" prop="companyCount">
              <el-input-number v-model="form.companyCount" :min="0" :precision="0" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="C端求职者" prop="jobSeekerCount">
              <el-input-number v-model="form.jobSeekerCount" :min="0" :precision="0" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="账号状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio label="1">启用</el-radio>
            <el-radio label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="4" placeholder="合作说明、地区、来源等" maxlength="500" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="adjustDialogVisible" title="调整推广来源" width="460px" append-to-body>
      <el-form :model="adjustForm" label-width="110px">
        <el-form-item label="调整对象">
          <el-input :model-value="adjustForm.objectName" disabled />
        </el-form-item>
        <el-form-item label="推广人ID">
          <el-input v-model="adjustForm.promoterId" placeholder="填写推广人ID，留空则清空为自然流量" clearable />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="adjustDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="adjustSubmitting" @click="submitAdjustAttribution">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="RecruitmentPromoter" lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import * as echarts from 'echarts';
import { ElMessage, type FormRules } from 'element-plus';
import {
  addPromoter,
  adjustPromoterAttribution,
  changePromoterStatus,
  getPromoter,
  getPromoterStatistics,
  listPromoterCompanyDetail,
  listPromoterUserDetail,
  listPromoter,
  updatePromoter,
  type PromotionAttributionAdjustForm,
  type PromotionAttributionDetailVO,
  type PromotionAttributionQuery,
  type PromoterForm,
  type PromoterQuery,
  type PromoterStatisticsGroup,
  type PromoterStatisticsTimeUnit,
  type PromoterStatisticsVO,
  type PromoterVO
} from '@/api/recruitment';
import { download } from '@/utils/request';
import { useUserStore } from '@/store/modules/user';
import { unwrapList } from './helpers';

type TagType = 'primary' | 'success' | 'warning' | 'danger' | 'info';
type StatisticsSide = 'all' | 'company' | 'jobSeeker';
type DetailObjectType = 'company' | 'user';
type ActiveTab = 'overview' | 'identity' | 'statistics' | 'statisticsDetail' | 'list';
type CountLike = Pick<PromoterStatisticsGroup, 'companyCount' | 'jobSeekerCount'>;
type OverviewPeriodMetric = 'companyCount' | 'jobSeekerCount' | 'authorizedCount' | 'resumeCount' | 'applyCount';

const loading = ref(false);
const submitting = ref(false);
const tableData = ref<PromoterVO[]>([]);
const total = ref(0);
const dialogVisible = ref(false);
const isEdit = ref(false);
const showMoreQuery = ref(false);
const queryFormRef = ref();
const formRef = ref();
const userStore = useUserStore();
const isAdminUser = computed(() => userStore.roles.includes('superadmin'));
const activeTab = ref<ActiveTab>(isAdminUser.value ? 'overview' : 'list');

const statisticsLoading = ref(false);
const statisticsDateRange = ref<[string, string] | []>([]);
const listDateRange = ref<[string, string] | []>([]);
const detailDateRange = ref<[string, string] | []>([]);
const statisticsTimeUnit = ref<PromoterStatisticsTimeUnit>('month');
const statisticsSide = ref<StatisticsSide>('all');
const detailObjectType = ref<DetailObjectType>('company');
const detailLoading = ref(false);
const attributionDetailRows = ref<PromotionAttributionDetailVO[]>([]);
const detailTotal = ref(0);
const adjustDialogVisible = ref(false);
const adjustSubmitting = ref(false);
const statisticsTimeUnitOptions: { label: string; value: PromoterStatisticsTimeUnit }[] = [
  { label: '按日', value: 'day' },
  { label: '按年', value: 'year' },
  { label: '按半年', value: 'halfYear' },
  { label: '按季度', value: 'quarter' },
  { label: '按月', value: 'month' }
];

const statisticsQuery = reactive<PromoterQuery>({
  name: '',
  identityType: '',
  status: ''
});

const detailQuery = reactive<PromotionAttributionQuery>({
  pageNum: 1,
  pageSize: 10,
  promoterKeyword: '',
  identityType: '',
  status: '',
  keyword: ''
});

const statisticsData = reactive<PromoterStatisticsVO>({
  totalPromoterCount: 0,
  totalCompanyCount: 0,
  totalJobSeekerCount: 0,
  rows: [],
  identityStats: [],
  timeStats: [],
  statusStats: [],
  overview: {
    todayCompanyCount: 0,
    todayJobSeekerCount: 0,
    todayAuthorizedCount: 0,
    todayResumeCount: 0,
    todayApplyCount: 0,
    totalCompanyCount: 0,
    totalJobSeekerCount: 0,
    remark: '',
    periodStats: [],
    identityPeriodStats: []
  }
});

const queryParams = reactive<PromoterQuery>({
  pageNum: 1,
  pageSize: 10,
  name: '',
  phonenumber: '',
  identityType: '',
  roleName: '',
  status: ''
});

const form = reactive<PromoterForm>({
  promoterId: undefined,
  name: '',
  phonenumber: '',
  identityType: '0',
  roleName: '',
  companyCount: 0,
  jobSeekerCount: 0,
  status: '1',
  remark: ''
});

const adjustForm = reactive<PromotionAttributionAdjustForm & { objectName?: string; promoterId?: string | number | undefined }>({
  objectType: 'company',
  objectId: '',
  objectName: '',
  promoterId: undefined
});

// 渠道推广人员的数量字段由运营手工维护，后端按 company_count/job_seeker_count 原样落库。
const nonNegativeCountRule = { type: 'number', min: 0, message: '数量不能小于0', trigger: 'change' } as const;
const roleOptionsMap: Record<string, string[]> = {
  // 身份类型为内部人员时，岗位角色作为二级分类使用。
  '0': ['实习生', '销售岗', '拓展岗'],
  '1': ['外部渠道'],
  '2': ['合伙人']
};

const rules: FormRules = {
  name: [{ required: true, message: '请输入姓名/昵称', trigger: 'blur' }],
  phonenumber: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ],
  identityType: [{ required: true, message: '请选择身份类型', trigger: 'change' }],
  roleName: [{ required: true, message: '请选择岗位/角色', trigger: 'change' }],
  companyCount: [nonNegativeCountRule],
  jobSeekerCount: [nonNegativeCountRule],
  status: [{ required: true, message: '请选择账号状态', trigger: 'change' }]
};

const dialogTitle = computed(() => (isEdit.value ? '编辑推广人员' : '新增推广人员'));
const roleOptions = computed(() => roleOptionsMap[form.identityType || '0'] || []);
const overviewCards = computed(() => {
  const yearCompany = overviewPeriodValue('year', 'companyCount');
  const yearJobSeeker = overviewPeriodValue('year', 'jobSeekerCount');
  const halfCompany = overviewPeriodValue('halfYear', 'companyCount');
  const halfJobSeeker = overviewPeriodValue('halfYear', 'jobSeekerCount');
  const quarterCompany = overviewPeriodValue('quarter', 'companyCount');
  const quarterJobSeeker = overviewPeriodValue('quarter', 'jobSeekerCount');
  const monthCompany = overviewPeriodValue('month', 'companyCount');
  const monthJobSeeker = overviewPeriodValue('month', 'jobSeekerCount');
  return [
    { key: 'year', label: '本年新增', value: yearCompany + yearJobSeeker, sub: `B端 ${yearCompany} / C端 ${yearJobSeeker}`, tone: 'success' },
    { key: 'halfYear', label: '本半年新增', value: halfCompany + halfJobSeeker, sub: `B端 ${halfCompany} / C端 ${halfJobSeeker}`, tone: 'primary' },
    {
      key: 'quarter',
      label: '本季度新增',
      value: quarterCompany + quarterJobSeeker,
      sub: `B端 ${quarterCompany} / C端 ${quarterJobSeeker}`,
      tone: 'warning'
    },
    { key: 'month', label: '本月新增', value: monthCompany + monthJobSeeker, sub: `B端 ${monthCompany} / C端 ${monthJobSeeker}`, tone: 'info' }
  ];
});
const overviewRows = computed(() => [
  buildOverviewRow('新增B端企业', '通过推广进入的企业数量', 'companyCount'),
  buildOverviewRow('新增C端用户', '通过推广进入的求职者数量', 'jobSeekerCount'),
  buildOverviewRow('C端授权数', '授权手机号人数', 'authorizedCount'),
  buildOverviewRow('C端简历数', '填写简历人数', 'resumeCount'),
  buildOverviewRow('C端投递数', '产生投递的人数', 'applyCount')
]);
const identityPeriodRows = computed(() => statisticsData.overview?.identityPeriodStats || []);
const metricLabel = computed(() => {
  if (statisticsSide.value === 'company') return 'B端企业';
  if (statisticsSide.value === 'jobSeeker') return 'C端求职者';
  return 'B/C合计';
});
const detailObjectTypeName = computed(() => (detailObjectType.value === 'company' ? 'B端企业' : 'C端求职者'));
const detailKeywordPlaceholder = computed(() => (detailObjectType.value === 'company' ? '企业名称/联系人/手机号' : '昵称/姓名/手机号'));
const detailStatusOptions = computed(() =>
  detailObjectType.value === 'company'
    ? [
        { label: '待审核', value: '0' },
        { label: '已认证', value: '1' },
        { label: '已禁用', value: '2' },
        { label: '资料完整', value: 'completed' },
        { label: '资料不完整', value: 'incomplete' },
        { label: '已发布岗位', value: 'published' }
      ]
    : [
        { label: '已授权手机号', value: 'authorized' },
        { label: '已完善简历', value: 'resume' },
        { label: '已投递', value: 'apply' },
        { label: '未完善简历', value: 'unresume' },
        { label: '未投递', value: 'unapply' }
      ]
);

const metricCards = computed(() => [
  { key: 'promoter', label: '推广人', value: statisticsData.totalPromoterCount || 0, sub: '当前筛选结果', tone: 'primary' },
  { key: 'company', label: 'B端企业', value: statisticsData.totalCompanyCount || 0, sub: '企业注册/线索量', tone: 'success' },
  { key: 'jobSeeker', label: 'C端求职者', value: statisticsData.totalJobSeekerCount || 0, sub: '求职者注册/线索量', tone: 'warning' },
  { key: 'resume', label: '简历完成', value: sumRowMetric('resumeCount'), sub: '归因简历量', tone: 'info' },
  { key: 'apply', label: '产生投递', value: sumRowMetric('applyCount'), sub: '归因投递人数', tone: 'success' },
  { key: 'enabled', label: '启用账号', value: statusCount('1'), sub: '推广人账号', tone: 'info' },
  { key: 'disabled', label: '禁用账号', value: statusCount('0'), sub: '推广人账号', tone: 'danger' }
]);

const statisticsRows = computed(() => {
  return [...(statisticsData.rows || [])].sort((a, b) => rowMetric(b) - rowMetric(a));
});

const trendChartRef = ref<HTMLElement | null>(null);
const sideChartRef = ref<HTMLElement | null>(null);
const identityPeriodChartRef = ref<HTMLElement | null>(null);
const identityDistributionChartRef = ref<HTMLElement | null>(null);
const identityLineChartRef = ref<HTMLElement | null>(null);
const promoterChartRef = ref<HTMLElement | null>(null);
const identityChartRef = ref<HTMLElement | null>(null);
const statusChartRef = ref<HTMLElement | null>(null);
let trendChart: echarts.ECharts | null = null;
let sideChart: echarts.ECharts | null = null;
let identityPeriodChart: echarts.ECharts | null = null;
let identityDistributionChart: echarts.ECharts | null = null;
let identityLineChart: echarts.ECharts | null = null;
let promoterChart: echarts.ECharts | null = null;
let identityChart: echarts.ECharts | null = null;
let statusChart: echarts.ECharts | null = null;
const chartColors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#13C2C2', '#909399', '#9B59B6'];

function identityTypeText(value?: string) {
  if (value === '1') return '外部渠道';
  if (value === '2') return '合伙人';
  return '内部人员';
}

function identityTypeTag(value?: string): TagType {
  if (value === '1') return 'warning';
  if (value === '2') return 'success';
  return 'primary';
}

function statusText(value?: string) {
  return value === '1' ? '启用' : '禁用';
}

function statusTag(value?: string): TagType {
  return value === '1' ? 'success' : 'danger';
}

function detailStatusTag(row: PromotionAttributionDetailVO): TagType {
  if (detailObjectType.value === 'company') {
    if (row.status === '1' || row.status === 'completed' || row.status === 'published') return 'success';
    if (row.status === '0' || row.status === 'incomplete') return 'warning';
    if (row.status === '2') return 'danger';
    return 'info';
  }
  if (row.status === 'apply') return 'success';
  if (row.status === 'resume') return 'primary';
  if (row.status === 'authorized') return 'warning';
  return 'info';
}

function yesNoTag(value?: string): TagType {
  return value === '是' ? 'success' : 'info';
}

function toCount(value?: number) {
  return Number(value || 0);
}

function groupMetric(item: CountLike) {
  const company = toCount(item.companyCount);
  const jobSeeker = toCount(item.jobSeekerCount);
  if (statisticsSide.value === 'company') return company;
  if (statisticsSide.value === 'jobSeeker') return jobSeeker;
  return company + jobSeeker;
}

function rowMetric(row: PromoterVO) {
  return groupMetric(row);
}

function sumRowMetric(key: 'authorizedCount' | 'resumeCount' | 'applyCount') {
  return (statisticsData.rows || []).reduce((sum, row) => sum + toCount(row[key]), 0);
}

function identityInternalValue(item: { internalCompanyCount?: number; internalJobSeekerCount?: number }) {
  return toCount(item.internalCompanyCount) + toCount(item.internalJobSeekerCount);
}

function identityChannelValue(item: { channelCompanyCount?: number; channelJobSeekerCount?: number }) {
  return toCount(item.channelCompanyCount) + toCount(item.channelJobSeekerCount);
}

function identityPeriodInternalMetric(
  item: {
    internalCompanyCount?: number;
    internalJobSeekerCount?: number;
    channelCompanyCount?: number;
    channelJobSeekerCount?: number;
  },
  side?: StatisticsSide
) {
  if (side === 'company') {
    return toCount(item.internalCompanyCount);
  }
  if (side === 'jobSeeker') {
    return toCount(item.internalJobSeekerCount);
  }
  return toCount(item.internalCompanyCount) + toCount(item.internalJobSeekerCount);
}

function identityPeriodChannelMetric(
  item: {
    channelCompanyCount?: number;
    channelJobSeekerCount?: number;
  },
  side?: StatisticsSide
) {
  if (side === 'company') {
    return toCount(item.channelCompanyCount);
  }
  if (side === 'jobSeeker') {
    return toCount(item.channelJobSeekerCount);
  }
  return toCount(item.channelCompanyCount) + toCount(item.channelJobSeekerCount);
}

function statusCount(status: string) {
  return statisticsData.statusStats?.find((item) => item.key === status)?.promoterCount || 0;
}

function overviewPeriodValue(periodKey: string, metric: OverviewPeriodMetric) {
  const period = statisticsData.overview?.periodStats?.find((item) => item.key === periodKey);
  return Number(period?.[metric] || 0);
}

function buildOverviewRow(label: string, description: string, metric: OverviewPeriodMetric) {
  return {
    label,
    description,
    today: overviewPeriodValue('today', metric),
    year: overviewPeriodValue('year', metric),
    halfYear: overviewPeriodValue('halfYear', metric),
    quarter: overviewPeriodValue('quarter', metric),
    month: overviewPeriodValue('month', metric)
  };
}

function resetFormData() {
  form.promoterId = undefined;
  form.name = '';
  form.phonenumber = '';
  form.identityType = '0';
  form.roleName = '';
  form.companyCount = 0;
  form.jobSeekerCount = 0;
  form.status = '1';
  form.remark = '';
}

function handleIdentityTypeChange(value: string | number | boolean | undefined) {
  const type = String(value ?? '0');
  const options = roleOptionsMap[type] || [];
  form.roleName = options.length === 1 ? options[0] : '';
}

watch(
  () => form.identityType,
  (value) => {
    const options = roleOptionsMap[value || '0'] || [];
    if (form.roleName && !options.includes(form.roleName)) {
      form.roleName = options.length === 1 ? options[0] : '';
    }
  }
);

watch(statisticsSide, () => {
  scheduleActiveTabCharts();
});

watch(detailObjectType, () => {
  detailQuery.status = '';
  detailQuery.pageNum = 1;
});

watch(isAdminUser, (allowed) => {
  activeTab.value = allowed ? 'overview' : 'list';
  if (allowed) {
    loadStatistics();
  }
});

function handleTabChange(name: string | number) {
  if (name === 'identity') {
    scheduleIdentityCharts();
  } else if (name === 'statistics') {
    scheduleStatisticsCharts();
  } else if (name === 'statisticsDetail') {
    loadAttributionDetails();
  }
}

function handleDetailTypeChange() {
  loadAttributionDetails();
}

function buildQuery(): PromoterQuery {
  const [beginDate, endDate] = listDateRange.value;
  return {
    ...queryParams,
    name: queryParams.name || undefined,
    phonenumber: queryParams.phonenumber || undefined,
    identityType: queryParams.identityType || undefined,
    roleName: queryParams.roleName || undefined,
    status: queryParams.status || undefined,
    params: {
      beginTime: beginDate ? `${beginDate} 00:00:00` : undefined,
      endTime: endDate ? `${endDate} 23:59:59` : undefined
    }
  };
}

async function loadData() {
  loading.value = true;
  try {
    const res = await listPromoter(buildQuery());
    const list = unwrapList<PromoterVO>(res);
    tableData.value = list.rows;
    total.value = list.total;
  } finally {
    loading.value = false;
  }
}

function buildStatisticsQuery(): PromoterQuery {
  const [beginDate, endDate] = statisticsDateRange.value;
  return {
    ...statisticsQuery,
    name: statisticsQuery.name || undefined,
    identityType: statisticsQuery.identityType || undefined,
    status: statisticsQuery.status || undefined,
    params: {
      beginTime: beginDate ? `${beginDate} 00:00:00` : undefined,
      endTime: endDate ? `${endDate} 23:59:59` : undefined,
      timeUnit: statisticsTimeUnit.value
    }
  };
}

async function loadStatistics() {
  if (!isAdminUser.value) return;
  statisticsLoading.value = true;
  try {
    const res: any = await getPromoterStatistics(buildStatisticsQuery());
    Object.assign(statisticsData, {
      totalPromoterCount: 0,
      totalCompanyCount: 0,
      totalJobSeekerCount: 0,
      rows: [],
      identityStats: [],
      timeStats: [],
      statusStats: [],
      overview: {
        todayCompanyCount: 0,
        todayJobSeekerCount: 0,
        todayAuthorizedCount: 0,
        todayResumeCount: 0,
        todayApplyCount: 0,
        totalCompanyCount: 0,
        totalJobSeekerCount: 0,
        remark: '',
        periodStats: [],
        identityPeriodStats: []
      },
      ...(res?.data || {})
    });
    await nextTick();
    scheduleActiveTabCharts();
  } finally {
    statisticsLoading.value = false;
  }
}

function buildAttributionDetailQuery(): PromotionAttributionQuery {
  const [beginDate, endDate] = detailDateRange.value;
  return {
    ...detailQuery,
    promoterKeyword: detailQuery.promoterKeyword || undefined,
    identityType: detailQuery.identityType || undefined,
    status: detailQuery.status || undefined,
    keyword: detailQuery.keyword || undefined,
    beginTime: beginDate ? `${beginDate} 00:00:00` : undefined,
    endTime: endDate ? `${endDate} 23:59:59` : undefined
  };
}

async function loadAttributionDetails() {
  if (!isAdminUser.value) return;
  detailLoading.value = true;
  try {
    const query = buildAttributionDetailQuery();
    const api = detailObjectType.value === 'company' ? listPromoterCompanyDetail : listPromoterUserDetail;
    const res = await api(query);
    const list = unwrapList<PromotionAttributionDetailVO>(res);
    attributionDetailRows.value = list.rows;
    detailTotal.value = list.total;
  } finally {
    detailLoading.value = false;
  }
}

function handleAttributionQuery() {
  detailQuery.pageNum = 1;
  loadAttributionDetails();
}

function resetAttributionQuery() {
  detailQuery.pageNum = 1;
  detailQuery.pageSize = 10;
  detailQuery.promoterKeyword = '';
  detailQuery.identityType = '';
  detailQuery.status = '';
  detailQuery.keyword = '';
  detailDateRange.value = [];
  loadAttributionDetails();
}

function handleAttributionExport() {
  const url =
    detailObjectType.value === 'company'
      ? '/admin/recruitment/promoter/company-detail/export'
      : '/admin/recruitment/promoter/user-detail/export';
  const fileName = `${detailObjectTypeName.value}推广来源明细_${new Date().getTime()}.xlsx`;
  download(url, buildAttributionDetailQuery(), fileName);
}

function handleStatisticsExport() {
  download('/admin/recruitment/promoter/statistics/export', buildStatisticsQuery(), `推广人汇总统计_${new Date().getTime()}.xlsx`);
}

function handlePeriodStatisticsExport() {
  download('/admin/recruitment/promoter/period-statistics/export', buildStatisticsQuery(), `推广周期统计_${new Date().getTime()}.xlsx`);
}

function openAdjustAttribution(row: PromotionAttributionDetailVO) {
  if (!row.objectId || !row.objectType) {
    ElMessage.warning('当前记录缺少对象编号，无法调整来源');
    return;
  }
  adjustForm.objectType = row.objectType;
  adjustForm.objectId = row.objectId;
  adjustForm.objectName = `${row.objectTypeName || detailObjectTypeName.value}：${row.objectName || row.objectId}`;
  adjustForm.promoterId = row.promoterId || undefined;
  adjustDialogVisible.value = true;
}

async function submitAdjustAttribution() {
  if (!adjustForm.objectId || !adjustForm.objectType) {
    ElMessage.warning('调整对象不能为空');
    return;
  }
  adjustSubmitting.value = true;
  try {
    await adjustPromoterAttribution({
      objectType: adjustForm.objectType,
      objectId: adjustForm.objectId,
      promoterId: adjustForm.promoterId || undefined
    });
    ElMessage.success('推广来源已调整');
    adjustDialogVisible.value = false;
    await loadAttributionDetails();
    loadStatistics();
  } finally {
    adjustSubmitting.value = false;
  }
}

function resetStatisticsQuery() {
  statisticsQuery.name = '';
  statisticsQuery.identityType = '';
  statisticsQuery.status = '';
  statisticsDateRange.value = [];
  statisticsTimeUnit.value = 'month';
  statisticsSide.value = 'all';
  loadStatistics();
}

function handleQuery() {
  queryParams.pageNum = 1;
  loadData();
}

function resetQuery() {
  queryFormRef.value?.resetFields?.();
  listDateRange.value = [];
  queryParams.pageNum = 1;
  loadData();
}

function handleAdd() {
  isEdit.value = false;
  resetFormData();
  dialogVisible.value = true;
}

async function handleEdit(row: PromoterVO) {
  isEdit.value = true;
  resetFormData();
  try {
    const res: any = await getPromoter(row.promoterId!);
    Object.assign(form, res?.data || row);
  } catch {
    Object.assign(form, row);
  }
  dialogVisible.value = true;
}

function resetForm() {
  formRef.value?.clearValidate?.();
}

function buildPromotionLink(row: PromoterVO) {
  const page = row.promotionPage || 'pages/login/index';
  if (row.promoterId) {
    return `${page}?promoterId=${encodeURIComponent(String(row.promoterId))}`;
  }
  if (row.promotionLink) {
    return row.promotionLink;
  }
  const code = row.promotionCode || (row.promoterId ? String(row.promoterId) : '');
  if (!code) {
    return '';
  }
  return `${page}?promoterCode=${encodeURIComponent(code)}`;
}

async function handleCopyPromotion(row: PromoterVO) {
  const link = buildPromotionLink(row);
  if (!link) {
    ElMessage.warning('暂无推广链接');
    return;
  }
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(link);
  } else {
    const input = document.createElement('textarea');
    input.value = link;
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
  }
  ElMessage.success('推广链接已复制');
}

function handleDownloadQrCode(row: PromoterVO) {
  if (!row.promoterId) {
    ElMessage.warning('请先保存推广员');
    return;
  }
  const fileName = `推广二维码_${row.name || row.promoterId}.jpg`;
  download(`/admin/recruitment/promoter/${row.promoterId}/qrcode/download`, {}, fileName);
}

async function submitForm() {
  await formRef.value?.validate();
  submitting.value = true;
  try {
    const payload = {
      ...form,
      companyCount: form.companyCount ?? 0,
      jobSeekerCount: form.jobSeekerCount ?? 0
    };
    if (isEdit.value) {
      await updatePromoter(payload);
      ElMessage.success('修改成功');
    } else {
      await addPromoter(payload);
      ElMessage.success('新增成功，已生成专属推广链接');
    }
    dialogVisible.value = false;
    await loadData();
    loadStatistics();
  } finally {
    submitting.value = false;
  }
}

async function handleStatusChange(row: PromoterVO, status: string) {
  try {
    await changePromoterStatus({ promoterId: row.promoterId!, status });
    row.status = status;
    ElMessage.success('状态已更新');
    loadStatistics();
  } catch {
    loadData();
  }
}

function getVisibleChartEl(el: HTMLElement | null) {
  if (!el) return null;
  const { clientWidth, clientHeight } = el;
  return clientWidth > 0 && clientHeight > 0 ? el : null;
}

function scheduleChartRender(render: () => void) {
  nextTick(() => {
    window.requestAnimationFrame(() => {
      render();
    });
  });
}

function scheduleStatisticsCharts() {
  scheduleChartRender(renderStatisticsCharts);
}

function scheduleIdentityCharts() {
  scheduleChartRender(renderIdentityCharts);
}

function scheduleActiveTabCharts() {
  if (activeTab.value === 'statistics' || activeTab.value === 'statisticsDetail') {
    scheduleStatisticsCharts();
  }
  if (activeTab.value === 'identity') {
    scheduleIdentityCharts();
  }
}

function renderTrendChart() {
  const el = getVisibleChartEl(trendChartRef.value);
  if (!el) return;
  if (!trendChart) trendChart = echarts.init(el);
  const groups = statisticsData.timeStats || [];
  const labels = groups.length ? groups.map((item) => item.label || item.key || '-') : ['暂无数据'];
  const companyData = groups.length ? groups.map((item) => toCount(item.companyCount)) : [0];
  const jobSeekerData = groups.length ? groups.map((item) => toCount(item.jobSeekerCount)) : [0];
  const metricData = groups.length ? groups.map((item) => groupMetric(item)) : [0];
  const series =
    statisticsSide.value === 'all'
      ? [
          { name: 'B端企业', type: 'bar', stack: 'total', data: companyData, itemStyle: { color: '#67C23A', borderRadius: [4, 4, 0, 0] } },
          { name: 'C端求职者', type: 'bar', stack: 'total', data: jobSeekerData, itemStyle: { color: '#E6A23C', borderRadius: [4, 4, 0, 0] } },
          { name: '合计', type: 'line', smooth: true, data: metricData, lineStyle: { color: '#409EFF', width: 2 }, itemStyle: { color: '#409EFF' } }
        ]
      : [
          {
            name: metricLabel.value,
            type: 'bar',
            data: metricData,
            barWidth: '42%',
            itemStyle: { color: statisticsSide.value === 'company' ? '#67C23A' : '#E6A23C', borderRadius: [4, 4, 0, 0] }
          }
        ];

  trendChart.setOption(
    {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { top: 0, right: 0 },
      grid: { left: '3%', right: '3%', top: 42, bottom: 24, containLabel: true },
      xAxis: { type: 'category', data: labels, axisLabel: { fontSize: 11 } },
      yAxis: { type: 'value', minInterval: 1, axisLabel: { fontSize: 11 } },
      series
    },
    true
  );
}

function renderSideChart() {
  const el = getVisibleChartEl(sideChartRef.value);
  if (!el) return;
  if (!sideChart) sideChart = echarts.init(el);
  const company = statisticsData.totalCompanyCount || 0;
  const jobSeeker = statisticsData.totalJobSeekerCount || 0;
  const hasData = company + jobSeeker > 0;
  sideChart.setOption(
    {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 0, textStyle: { fontSize: 11 } },
      color: ['#67C23A', '#E6A23C', '#DCDFE6'],
      series: [
        {
          name: 'B/C端占比',
          type: 'pie',
          radius: ['46%', '72%'],
          center: ['50%', '45%'],
          avoidLabelOverlap: true,
          itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
          label: { formatter: '{b}\n{c}', fontSize: 11 },
          data: hasData
            ? [
                { name: 'B端企业', value: company },
                { name: 'C端求职者', value: jobSeeker }
              ]
            : [{ name: '暂无数据', value: 1 }]
        }
      ]
    },
    true
  );
}

function renderPromoterChart() {
  const el = getVisibleChartEl(promoterChartRef.value);
  if (!el) return;
  if (!promoterChart) promoterChart = echarts.init(el);
  const rows = statisticsRows.value.slice(0, 8).reverse();
  const labels = rows.length ? rows.map((item) => item.name || item.phonenumber || '-') : ['暂无数据'];
  const values = rows.length ? rows.map((item) => rowMetric(item)) : [0];
  promoterChart.setOption(
    {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '6%', top: 12, bottom: 12, containLabel: true },
      xAxis: { type: 'value', minInterval: 1, axisLabel: { fontSize: 10 } },
      yAxis: { type: 'category', data: labels, axisLabel: { width: 86, overflow: 'truncate', fontSize: 11 } },
      series: [
        {
          name: metricLabel.value,
          type: 'bar',
          data: values,
          barWidth: '54%',
          label: { show: true, position: 'right', fontSize: 10 },
          itemStyle: { color: (params: any) => chartColors[params.dataIndex % chartColors.length], borderRadius: [0, 4, 4, 0] }
        }
      ]
    },
    true
  );
}

function renderIdentityChart() {
  const el = getVisibleChartEl(identityChartRef.value);
  if (!el) return;
  if (!identityChart) identityChart = echarts.init(el);
  const groups = statisticsData.identityStats || [];
  const hasData = groups.some((item) => groupMetric(item) > 0);
  identityChart.setOption(
    {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 0, textStyle: { fontSize: 11 } },
      color: ['#409EFF', '#E6A23C', '#67C23A', '#DCDFE6'],
      series: [
        {
          name: '身份分布',
          type: 'pie',
          radius: ['42%', '68%'],
          center: ['50%', '43%'],
          itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
          label: { formatter: '{b}\n{c}', fontSize: 11 },
          data: hasData ? groups.map((item) => ({ name: item.label || item.key || '-', value: groupMetric(item) })) : [{ name: '暂无数据', value: 1 }]
        }
      ]
    },
    true
  );
}

function renderIdentityPeriodChart() {
  const el = getVisibleChartEl(identityPeriodChartRef.value);
  if (!el) return;
  if (!identityPeriodChart) identityPeriodChart = echarts.init(el);
  const rows = identityPeriodRows.value;
  const labels = rows.length ? rows.map((item) => item.label || item.key || '-') : ['暂无数据'];
  const internalValues = rows.length
    ? rows.map((item) =>
        statisticsSide.value === 'company'
          ? toCount(item.internalCompanyCount)
          : statisticsSide.value === 'jobSeeker'
            ? toCount(item.internalJobSeekerCount)
            : identityInternalValue(item)
      )
    : [0];
  const channelValues = rows.length
    ? rows.map((item) =>
        statisticsSide.value === 'company'
          ? toCount(item.channelCompanyCount)
          : statisticsSide.value === 'jobSeeker'
            ? toCount(item.channelJobSeekerCount)
            : identityChannelValue(item)
      )
    : [0];
  const hasData = internalValues.some((value) => value > 0) || channelValues.some((value) => value > 0);
  identityPeriodChart.setOption(
    {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { top: 0, right: 0 },
      grid: { left: '3%', right: '3%', top: 42, bottom: 24, containLabel: true },
      xAxis: { type: 'category', data: labels, axisLabel: { fontSize: 11 } },
      yAxis: { type: 'value', minInterval: 1, axisLabel: { fontSize: 11 } },
      series: hasData
        ? [
            { name: '内部人员', type: 'bar', data: internalValues, itemStyle: { color: '#67C23A', borderRadius: [4, 4, 0, 0] } },
            { name: '渠道', type: 'bar', data: channelValues, itemStyle: { color: '#409EFF', borderRadius: [4, 4, 0, 0] } }
          ]
        : [{ name: '暂无数据', type: 'line', data: [0], symbol: 'none' }]
    },
    true
  );
}

function renderIdentityDistributionChart() {
  const el = getVisibleChartEl(identityDistributionChartRef.value);
  if (!el) return;
  if (!identityDistributionChart) identityDistributionChart = echarts.init(el);
  const rows = identityPeriodRows.value;
  const internalTotal = rows.reduce(
    (sum, item) => sum + identityPeriodInternalMetric(item, statisticsSide.value === 'all' ? undefined : statisticsSide.value),
    0
  );
  const channelTotal = rows.reduce(
    (sum, item) =>
      sum +
      (statisticsSide.value === 'company'
        ? toCount(item.channelCompanyCount)
        : statisticsSide.value === 'jobSeeker'
          ? toCount(item.channelJobSeekerCount)
          : identityChannelValue(item)),
    0
  );
  const hasData = internalTotal + channelTotal > 0;
  identityDistributionChart.setOption(
    {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 0, textStyle: { fontSize: 11 } },
      color: ['#67C23A', '#409EFF', '#DCDFE6'],
      series: [
        {
          name: '内部/渠道分布',
          type: 'pie',
          radius: ['42%', '68%'],
          center: ['50%', '45%'],
          avoidLabelOverlap: true,
          itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
          label: { formatter: '{b}\n{c}', fontSize: 11 },
          data: hasData
            ? [
                { name: '内部', value: internalTotal },
                { name: '渠道', value: channelTotal }
              ]
            : [{ name: '暂无数据', value: 1 }]
        }
      ]
    },
    true
  );
}

function renderIdentityLineChart() {
  const el = getVisibleChartEl(identityLineChartRef.value);
  if (!el) return;
  if (!identityLineChart) identityLineChart = echarts.init(el);
  const rows = identityPeriodRows.value;
  const labels = rows.length ? rows.map((item) => item.label || item.key || '-') : ['暂无数据'];
  const currentSide = statisticsSide.value === 'all' ? undefined : statisticsSide.value;
  const internalValues = rows.length ? rows.map((item) => identityPeriodInternalMetric(item, currentSide)) : [0];
  const channelValues = rows.length ? rows.map((item) => identityPeriodChannelMetric(item, currentSide)) : [0];
  identityLineChart.setOption(
    {
      tooltip: { trigger: 'axis' },
      legend: { top: 0, right: 0 },
      grid: { left: '3%', right: '4%', top: 42, bottom: 24, containLabel: true },
      xAxis: { type: 'category', boundaryGap: false, data: labels, axisLabel: { fontSize: 11 } },
      yAxis: { type: 'value', minInterval: 1, axisLabel: { fontSize: 11 } },
      series: [
        {
          name: '内部人员',
          type: 'line',
          smooth: true,
          data: internalValues,
          symbolSize: 7,
          lineStyle: { width: 3, color: '#67C23A' },
          itemStyle: { color: '#67C23A' },
          areaStyle: { color: 'rgba(103, 194, 58, 0.12)' }
        },
        {
          name: '渠道',
          type: 'line',
          smooth: true,
          data: channelValues,
          symbolSize: 7,
          lineStyle: { width: 3, color: '#409EFF' },
          itemStyle: { color: '#409EFF' },
          areaStyle: { color: 'rgba(64, 158, 255, 0.12)' }
        }
      ]
    },
    true
  );
}

function renderStatusChart() {
  const el = getVisibleChartEl(statusChartRef.value);
  if (!el) return;
  if (!statusChart) statusChart = echarts.init(el);
  const groups = statisticsData.statusStats || [];
  const hasData = groups.some((item) => toCount(item.promoterCount) > 0);
  statusChart.setOption(
    {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 0, textStyle: { fontSize: 11 } },
      color: ['#67C23A', '#F56C6C', '#DCDFE6'],
      series: [
        {
          name: '状态分布',
          type: 'pie',
          radius: ['42%', '68%'],
          center: ['50%', '43%'],
          itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
          label: { formatter: '{b}\n{c}', fontSize: 11 },
          data: hasData
            ? groups.map((item) => ({ name: item.label || statusText(item.key), value: toCount(item.promoterCount) }))
            : [{ name: '暂无数据', value: 1 }]
        }
      ]
    },
    true
  );
}

function renderStatisticsCharts() {
  renderTrendChart();
  renderSideChart();
  renderPromoterChart();
  renderIdentityChart();
  renderStatusChart();
}

function renderIdentityCharts() {
  renderIdentityPeriodChart();
  renderIdentityDistributionChart();
  renderIdentityLineChart();
}

function handleResize() {
  trendChart?.resize();
  sideChart?.resize();
  identityPeriodChart?.resize();
  identityDistributionChart?.resize();
  identityLineChart?.resize();
  promoterChart?.resize();
  identityChart?.resize();
  statusChart?.resize();
}

onMounted(() => {
  loadData();
  loadStatistics();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  trendChart?.dispose();
  sideChart?.dispose();
  identityPeriodChart?.dispose();
  identityDistributionChart?.dispose();
  identityLineChart?.dispose();
  promoterChart?.dispose();
  identityChart?.dispose();
  statusChart?.dispose();
});
</script>

<style scoped>
.promoter-page {
  padding: 16px;
}

.promoter-tabs-shell {
  padding: 16px 16px 0;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background: var(--el-bg-color);
}

.promoter-tabs :deep(.el-tabs__header) {
  margin-bottom: 16px;
}

.promoter-tabs :deep(.el-tabs__nav-wrap::after) {
  height: 1px;
}

.overview-board,
.statistics-board,
.query-card,
.table-card {
  margin-bottom: 16px;
}

.overview-board,
.statistics-board {
  padding: 16px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background: var(--el-bg-color);
}

.board-head,
.table-head,
.card-head,
.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.board-title,
.table-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.board-subtitle,
.table-subtitle,
.metric-sub,
.sub-text {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.table-title {
  margin-right: 10px;
}

.board-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.statistics-filter,
.query-form {
  margin-top: 14px;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(150px, 1fr));
  gap: 12px;
  margin-top: 10px;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(180px, 1fr));
  gap: 12px;
  margin-top: 14px;
}

.overview-card {
  min-height: 92px;
  padding: 14px 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-top: 4px solid var(--el-color-primary);
  border-radius: 8px;
  background: var(--el-fill-color-blank);
}

.metric-card {
  min-height: 86px;
  padding: 14px 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-left: 4px solid var(--el-color-primary);
  border-radius: 8px;
  background: var(--el-fill-color-blank);
}

.metric-card.success {
  border-left-color: var(--el-color-success);
}

.metric-card.warning {
  border-left-color: var(--el-color-warning);
}

.metric-card.danger {
  border-left-color: var(--el-color-danger);
}

.metric-card.info {
  border-left-color: var(--el-color-info);
}

.overview-card.success {
  border-top-color: var(--el-color-success);
}

.overview-card.warning {
  border-top-color: var(--el-color-warning);
}

.overview-card.danger {
  border-top-color: var(--el-color-danger);
}

.overview-card.info {
  border-top-color: var(--el-color-info);
}

.metric-label {
  display: block;
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.overview-card strong,
.metric-card strong {
  display: block;
  margin: 8px 0 6px;
  font-size: 26px;
  line-height: 1;
  color: var(--el-text-color-primary);
}

.chart-layout {
  display: grid;
  gap: 12px;
  margin-top: 12px;
}

.chart-layout.main {
  grid-template-columns: minmax(0, 2fr) minmax(320px, 1fr);
}

.chart-layout.secondary {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.chart-panel,
.detail-panel {
  padding: 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-blank);
}

.panel-head {
  margin-bottom: 10px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.chart-main {
  height: 300px;
}

.chart-main.compact {
  height: 260px;
}

.detail-panel {
  margin-top: 12px;
}

.overview-table {
  margin-top: 12px;
  padding: 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-blank);
}

.overview-remark {
  margin-top: 12px;
}

.table-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.name-cell {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.name-text {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.promotion-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.promotion-code {
  overflow: hidden;
  color: var(--el-text-color-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 1280px) {
  .overview-grid,
  .metric-grid {
    grid-template-columns: repeat(3, minmax(150px, 1fr));
  }

  .chart-layout.main,
  .chart-layout.secondary {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .promoter-page {
    padding: 12px;
  }

  .board-head,
  .table-head,
  .card-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .metric-grid {
    grid-template-columns: 1fr;
  }

  .overview-grid {
    grid-template-columns: 1fr;
  }

  .table-actions {
    justify-content: flex-start;
  }
}
</style>
