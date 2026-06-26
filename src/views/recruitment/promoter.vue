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
              <div
                v-for="card in overviewCards"
                :key="card.key"
                class="overview-card is-clickable"
                :class="card.tone"
                role="button"
                tabindex="0"
                @click="openOverviewCardDrilldown(card)"
                @keyup.enter="openOverviewCardDrilldown(card)"
              >
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
                <el-table-column label="今日" width="110" align="center">
                  <template #default="{ row }">
                    <button type="button" class="stat-link" @click="openOverviewCellDrilldown(row, 'today')">{{ row.today }}</button>
                  </template>
                </el-table-column>
                <el-table-column label="本年" width="110" align="center">
                  <template #default="{ row }">
                    <button type="button" class="stat-link" @click="openOverviewCellDrilldown(row, 'year')">{{ row.year }}</button>
                  </template>
                </el-table-column>
                <el-table-column label="本半年" width="110" align="center">
                  <template #default="{ row }">
                    <button type="button" class="stat-link" @click="openOverviewCellDrilldown(row, 'halfYear')">{{ row.halfYear }}</button>
                  </template>
                </el-table-column>
                <el-table-column label="本季度" width="110" align="center">
                  <template #default="{ row }">
                    <button type="button" class="stat-link" @click="openOverviewCellDrilldown(row, 'quarter')">{{ row.quarter }}</button>
                  </template>
                </el-table-column>
                <el-table-column label="本月" width="110" align="center">
                  <template #default="{ row }">
                    <button type="button" class="stat-link" @click="openOverviewCellDrilldown(row, 'month')">{{ row.month }}</button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane v-if="isAdminUser" label="企业端概览" name="companyOverview">
          <div v-loading="companyOverviewLoading" class="overview-board">
            <div class="board-head">
              <div>
                <div class="board-title">企业端概览</div>
                <div class="board-subtitle">企业端关键维度数据（与推广总览同接口返回）</div>
              </div>
              <div class="board-actions">
                <el-button icon="Refresh" :loading="companyOverviewLoading" @click="loadCompanyOverviewStatistics">刷新企业端概览</el-button>
              </div>
            </div>
            <div class="overview-table">
              <div class="panel-head">
                <span>企业端指标</span>
                <el-tag size="small" effect="plain">今日/本年/本半年/本季度/本月</el-tag>
              </div>
              <el-table :data="companyOverviewRows" border stripe>
                <el-table-column label="指标" prop="label" min-width="210" />
                <el-table-column label="说明" prop="description" min-width="280" show-overflow-tooltip />
                <el-table-column label="今日" width="110" align="center">
                  <template #default="{ row }">
                    <button type="button" class="stat-link" @click="openCompanyOverviewCellDrilldown(row, 'today')">{{ row.today }}</button>
                  </template>
                </el-table-column>
                <el-table-column label="本年" width="110" align="center">
                  <template #default="{ row }">
                    <button type="button" class="stat-link" @click="openCompanyOverviewCellDrilldown(row, 'year')">{{ row.year }}</button>
                  </template>
                </el-table-column>
                <el-table-column label="本半年" width="110" align="center">
                  <template #default="{ row }">
                    <button type="button" class="stat-link" @click="openCompanyOverviewCellDrilldown(row, 'halfYear')">{{ row.halfYear }}</button>
                  </template>
                </el-table-column>
                <el-table-column label="本季度" width="110" align="center">
                  <template #default="{ row }">
                    <button type="button" class="stat-link" @click="openCompanyOverviewCellDrilldown(row, 'quarter')">{{ row.quarter }}</button>
                  </template>
                </el-table-column>
                <el-table-column label="本月" width="110" align="center">
                  <template #default="{ row }">
                    <button type="button" class="stat-link" @click="openCompanyOverviewCellDrilldown(row, 'month')">{{ row.month }}</button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane v-if="isAdminUser" label="用户端概览" name="userOverview">
          <div v-loading="userOverviewLoading" class="overview-board">
            <div class="board-head">
              <div>
                <div class="board-title">用户端概览</div>
                <div class="board-subtitle">C 端求职者关键维度数据（与推广总览同接口返回）</div>
              </div>
              <div class="board-actions">
                <el-button icon="Refresh" :loading="userOverviewLoading" @click="loadUserOverviewStatistics">刷新用户端概览</el-button>
              </div>
            </div>
            <div class="overview-table">
              <div class="panel-head">
                <span>用户端指标</span>
                <el-tag size="small" effect="plain">今日/本年/本半年/本季度/本月</el-tag>
              </div>
              <el-table :data="userOverviewRows" border stripe>
                <el-table-column label="指标" prop="label" min-width="210" />
                <el-table-column label="说明" prop="description" min-width="280" show-overflow-tooltip />
                <el-table-column label="今日" width="110" align="center">
                  <template #default="{ row }">
                    <button type="button" class="stat-link" @click="openUserOverviewCellDrilldown(row, 'today')">{{ row.today }}</button>
                  </template>
                </el-table-column>
                <el-table-column label="本年" width="110" align="center">
                  <template #default="{ row }">
                    <button type="button" class="stat-link" @click="openUserOverviewCellDrilldown(row, 'year')">{{ row.year }}</button>
                  </template>
                </el-table-column>
                <el-table-column label="本半年" width="110" align="center">
                  <template #default="{ row }">
                    <button type="button" class="stat-link" @click="openUserOverviewCellDrilldown(row, 'halfYear')">{{ row.halfYear }}</button>
                  </template>
                </el-table-column>
                <el-table-column label="本季度" width="110" align="center">
                  <template #default="{ row }">
                    <button type="button" class="stat-link" @click="openUserOverviewCellDrilldown(row, 'quarter')">{{ row.quarter }}</button>
                  </template>
                </el-table-column>
                <el-table-column label="本月" width="110" align="center">
                  <template #default="{ row }">
                    <button type="button" class="stat-link" @click="openUserOverviewCellDrilldown(row, 'month')">{{ row.month }}</button>
                  </template>
                </el-table-column>
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
                  <el-table-column label="人数" prop="internalPromoterCount" width="90" align="center">
                    <template #default="{ row }">
                      <button type="button" class="stat-link" @click="openIdentityPromoterDrilldown(row, 'internal')">
                        {{ row.internalPromoterCount || 0 }}
                      </button>
                    </template>
                  </el-table-column>
                  <el-table-column label="B端企业" prop="internalCompanyCount" width="110" align="center">
                    <template #default="{ row }">
                      <button type="button" class="stat-link" @click="openIdentityPeriodDrilldown(row, 'internal', 'company')">
                        {{ row.internalCompanyCount || 0 }}
                      </button>
                    </template>
                  </el-table-column>
                  <el-table-column label="C端用户" prop="internalJobSeekerCount" width="110" align="center">
                    <template #default="{ row }">
                      <button type="button" class="stat-link" @click="openIdentityPeriodDrilldown(row, 'internal', 'user')">
                        {{ row.internalJobSeekerCount || 0 }}
                      </button>
                    </template>
                  </el-table-column>
                </el-table-column>
                <el-table-column label="渠道" align="center">
                  <el-table-column label="人数" prop="channelPromoterCount" width="90" align="center">
                    <template #default="{ row }">
                      <button type="button" class="stat-link" @click="openIdentityPromoterDrilldown(row, 'channel')">
                        {{ row.channelPromoterCount || 0 }}
                      </button>
                    </template>
                  </el-table-column>
                  <el-table-column label="B端企业" prop="channelCompanyCount" width="110" align="center">
                    <template #default="{ row }">
                      <button type="button" class="stat-link" @click="openIdentityPeriodDrilldown(row, 'channel', 'company')">
                        {{ row.channelCompanyCount || 0 }}
                      </button>
                    </template>
                  </el-table-column>
                  <el-table-column label="C端用户" prop="channelJobSeekerCount" width="110" align="center">
                    <template #default="{ row }">
                      <button type="button" class="stat-link" @click="openIdentityPeriodDrilldown(row, 'channel', 'user')">
                        {{ row.channelJobSeekerCount || 0 }}
                      </button>
                    </template>
                  </el-table-column>
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
              <div
                v-for="card in metricCards"
                :key="card.key"
                class="metric-card is-clickable"
                :class="card.tone"
                role="button"
                tabindex="0"
                @click="openMetricCardDrilldown(card)"
                @keyup.enter="openMetricCardDrilldown(card)"
              >
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
                  <template #default="{ row }">
                    <button type="button" class="stat-link" @click="openStatisticsRowDrilldown(row, 'company')">{{ row.companyCount || 0 }}</button>
                  </template>
                </el-table-column>
                <el-table-column label="C端求职者" prop="jobSeekerCount" width="120" align="center">
                  <template #default="{ row }">
                    <button type="button" class="stat-link" @click="openStatisticsRowDrilldown(row, 'jobSeeker')">
                      {{ row.jobSeekerCount || 0 }}
                    </button>
                  </template>
                </el-table-column>
                <el-table-column label="授权手机号" prop="authorizedCount" width="110" align="center">
                  <template #default="{ row }">
                    <button type="button" class="stat-link" @click="openStatisticsRowDrilldown(row, 'authorized')">
                      {{ row.authorizedCount || 0 }}
                    </button>
                  </template>
                </el-table-column>
                <el-table-column label="完成简历" prop="resumeCount" width="100" align="center">
                  <template #default="{ row }">
                    <button type="button" class="stat-link" @click="openStatisticsRowDrilldown(row, 'resume')">{{ row.resumeCount || 0 }}</button>
                  </template>
                </el-table-column>
                <el-table-column label="产生投递" prop="applyCount" width="100" align="center">
                  <template #default="{ row }">
                    <button type="button" class="stat-link" @click="openStatisticsRowDrilldown(row, 'apply')">{{ row.applyCount || 0 }}</button>
                  </template>
                </el-table-column>
                <el-table-column label="合计" width="100" align="center">
                  <template #default="{ row }">
                    <button type="button" class="stat-link" @click="openStatisticsRowTotalDrilldown(row)">{{ rowMetric(row) }}</button>
                  </template>
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
                <el-input
                  v-model="detailQuery.promoterKeyword"
                  placeholder="姓名/手机号"
                  clearable
                  style="width: 180px"
                  @keyup.enter="handleAttributionQuery"
                />
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
                <el-input
                  v-model="detailQuery.keyword"
                  :placeholder="detailKeywordPlaceholder"
                  clearable
                  style="width: 210px"
                  @keyup.enter="handleAttributionQuery"
                />
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
                    <el-tag :type="identityTypeTag(row.identityType)" size="small">{{
                      row.identityTypeName || identityTypeText(row.identityType)
                    }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="状态" prop="statusName" width="120" align="center">
                  <template #default="{ row }">
                    <el-tag :type="detailStatusTag(row)" size="small">{{ detailStatusText(row) }}</el-tag>
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

        <!-- 客户管理：按对象类型(企业B端/面试者C端) × 归因状态(已绑推广码/公海) 两个维度查看客户，并可手动分配/调整推广人 -->
        <el-tab-pane v-if="isAdminUser" label="客户管理" name="sea">
          <el-tabs v-model="seaObjectType" class="sea-subtabs" @tab-change="handleSeaTypeChange">
            <el-tab-pane label="企业B端" name="company" />
            <el-tab-pane label="面试者C端" name="user" />
          </el-tabs>
          <el-tabs v-model="customerScope" class="sea-subtabs sea-scope-tabs" @tab-change="handleScopeChange">
            <el-tab-pane label="已绑推广码客户" name="bound" />
            <el-tab-pane label="公海客户" name="sea" />
          </el-tabs>

          <!-- 已绑口径：左树(壹聘 根 > 全部推广人 员工，节点带企业/求职者统计) + 右表(按选中员工 promoterId 过滤推广明细)；公海无推广人不展示树 -->
          <div class="customer-layout" :class="{ 'has-tree': customerScope === 'bound' }">
            <el-card v-if="customerScope === 'bound'" shadow="never" class="promoter-tree-card">
              <template #header>
                <div class="tree-head">
                  <span>壹聘员工</span>
                  <el-button link type="primary" icon="Refresh" @click="loadPromoterTree">刷新</el-button>
                </div>
              </template>
              <el-input
                v-model="promoterTreeKeyword"
                placeholder="搜索员工姓名/手机"
                clearable
                size="small"
                prefix-icon="Search"
                class="tree-search"
              />
              <!-- 懒加载异步树：根节点秒出，员工节点展开时并行拉取(花名册+绑定统计)，非阻塞 -->
              <el-tree
                ref="promoterTreeRef"
                :key="promoterTreeKey"
                lazy
                :load="loadPromoterTreeNode"
                node-key="id"
                highlight-current
                :current-node-key="selectedPromoterNodeId"
                :default-expanded-keys="promoterTreeExpandedKeys"
                :expand-on-click-node="false"
                :filter-node-method="filterPromoterTreeNode"
                class="promoter-tree"
                @node-click="handlePromoterNodeClick"
                @node-expand="handlePromoterNodeExpand"
                @node-collapse="handlePromoterNodeCollapse"
              >
                <template #default="{ data }">
                  <span class="promoter-tree-node">
                    <span class="ptn-label">{{ data.label }}</span>
                    <span v-if="data.id !== 'ROOT' || rootStatLoaded" class="ptn-stat">
                      企业 {{ nodeStatText(data).companyCount }} · 求职 {{ nodeStatText(data).jobSeekerCount }}
                    </span>
                  </span>
                </template>
              </el-tree>
            </el-card>

            <div class="customer-main">
              <el-card shadow="never" class="query-card">
                <el-form :inline="true" label-width="72px" class="query-form">
                  <el-form-item :label="seaObjectType === 'company' ? '企业/联系' : '昵称/手机'">
                    <el-input
                      v-model="seaQuery.keyword"
                      :placeholder="seaObjectType === 'company' ? '企业名称/联系人/手机号' : '昵称/姓名/手机号'"
                      clearable
                      style="width: 220px"
                      @keyup.enter="handleSeaQuery"
                      @clear="handleSeaQuery"
                    />
                  </el-form-item>
                  <el-form-item v-if="customerScope === 'bound'" label="推广人">
                    <el-input
                      v-model="seaQuery.promoterKeyword"
                      placeholder="推广人姓名/手机号"
                      clearable
                      style="width: 180px"
                      @keyup.enter="handleSeaQuery"
                      @clear="handleSeaQuery"
                    />
                  </el-form-item>
                  <el-form-item label="状态">
                    <el-select v-model="seaQuery.status" placeholder="全部" clearable style="width: 150px">
                      <el-option v-for="opt in seaStatusOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="创建时间">
                    <el-date-picker
                      v-model="seaDateRange"
                      type="daterange"
                      value-format="YYYY-MM-DD"
                      start-placeholder="开始日期"
                      end-placeholder="结束日期"
                      range-separator="-"
                      style="width: 240px"
                    />
                  </el-form-item>
                  <el-form-item>
                    <el-button type="primary" icon="Search" @click="handleSeaQuery">搜索</el-button>
                    <el-button icon="Refresh" @click="resetSeaQuery">重置</el-button>
                  </el-form-item>
                </el-form>
              </el-card>

              <el-card shadow="never" class="table-card">
                <template #header>
                  <div class="table-head">
                    <div>
                      <span class="table-title">{{ customerTableTitle }}</span>
                      <span class="table-subtitle">{{
                        customerScope === 'sea' ? '无推广来源的客户，可手动分配给推广人完成归因' : '已绑定推广码的客户，可调整其来源推广人'
                      }}</span>
                    </div>
                    <div class="table-actions">
                      <!-- 仅「已绑推广码」口径：批量移动公海(解除归因)；操作前二次确认 -->
                      <el-button
                        v-if="customerScope === 'bound'"
                        type="warning"
                        plain
                        icon="Promotion"
                        :disabled="seaSelection.length === 0"
                        @click="handleBatchMoveSea"
                      >
                        批量移动公海{{ seaSelection.length ? `(${seaSelection.length})` : '' }}
                      </el-button>
                      <!-- 仅「已绑推广码」口径可导出：复用归因明细导出接口，沿用当前筛选条件 -->
                      <el-button v-if="customerScope === 'bound'" plain icon="Download" @click="handleCustomerExport">导出</el-button>
                      <el-button plain icon="Refresh" @click="loadCustomerList">刷新</el-button>
                    </div>
                  </div>
                </template>

                <el-table
                  ref="seaTableRef"
                  v-loading="seaLoading"
                  :data="seaRows"
                  border
                  stripe
                  :row-key="(row: PromotionAttributionDetailVO) => String(row.objectId)"
                  @selection-change="handleSeaSelectionChange"
                >
                  <!-- 仅已绑口径可多选，用于批量移动公海 -->
                  <el-table-column v-if="customerScope === 'bound'" type="selection" width="48" reserve-selection />
                  <el-table-column :label="seaObjectType === 'company' ? '企业' : '面试者'" min-width="190" show-overflow-tooltip>
                    <template #default="{ row }">
                      <div class="name-cell">
                        <!-- B端企业：点击企业名打开只读企业详情弹窗（复用 openCompanyInfo / getCompany） -->
                        <button v-if="seaObjectType === 'company'" type="button" class="stat-link name-text" @click="openCompanyInfo(row)">
                          {{ row.objectName || '-' }}
                        </button>
                        <span v-else class="name-text">{{ row.objectName || '-' }}</span>
                        <span class="sub-text">{{ row.phone || '-' }}</span>
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column v-if="seaObjectType === 'company'" label="联系人" prop="contactPerson" min-width="110" show-overflow-tooltip>
                    <template #default="{ row }">{{ row.contactPerson || '-' }}</template>
                  </el-table-column>
                  <!-- 已绑客户展示来源推广人；公海客户无来源推广人不显示该列 -->
                  <el-table-column v-if="customerScope === 'bound'" label="来源推广人" min-width="160" show-overflow-tooltip>
                    <template #default="{ row }">
                      <div class="name-cell">
                        <span class="name-text">{{ row.promoterName || '-' }}</span>
                        <span class="sub-text">{{ row.promoterPhone || '-' }}</span>
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column v-if="customerScope === 'bound'" label="推广人身份" width="110" align="center">
                    <template #default="{ row }">
                      <el-tag :type="identityTypeTag(row.identityType)" size="small">{{
                        row.identityTypeName || identityTypeText(row.identityType)
                      }}</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column label="状态" prop="statusName" width="120" align="center">
                    <template #default="{ row }">
                      <el-tag :type="detailStatusTag(row, seaObjectType)" size="small">{{ detailStatusText(row, seaObjectType) }}</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column v-if="seaObjectType === 'company'" label="资料完整" prop="completed" width="100" align="center">
                    <template #default="{ row }">
                      <el-tag :type="yesNoTag(row.completed)" size="small">{{ row.completed || '-' }}</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column v-if="seaObjectType === 'company'" label="岗位数" prop="jobCount" width="90" align="center" />
                  <el-table-column v-if="seaObjectType === 'user'" label="授权" prop="authorized" width="80" align="center">
                    <template #default="{ row }">
                      <el-tag :type="yesNoTag(row.authorized)" size="small">{{ row.authorized || '-' }}</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column v-if="seaObjectType === 'user'" label="简历" prop="resumeCompleted" width="80" align="center">
                    <template #default="{ row }">
                      <el-tag :type="yesNoTag(row.resumeCompleted)" size="small">{{ row.resumeCompleted || '-' }}</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column v-if="seaObjectType === 'user'" label="投递" prop="applied" width="80" align="center">
                    <template #default="{ row }">
                      <el-tag :type="yesNoTag(row.applied)" size="small">{{ row.applied || '-' }}</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column label="创建时间" prop="createTime" width="170" align="center" />
                  <el-table-column label="操作" width="130" fixed="right" align="center">
                    <template #default="{ row }">
                      <el-button link type="primary" :icon="customerScope === 'sea' ? 'Promotion' : 'Edit'" @click="openCustomerAdjust(row)">
                        {{ customerScope === 'sea' ? '分配推广人' : '调整推广人' }}
                      </el-button>
                    </template>
                  </el-table-column>
                </el-table>

                <pagination
                  v-show="seaTotal > 0"
                  v-model:page="seaQuery.pageNum"
                  v-model:limit="seaQuery.pageSize"
                  :total="seaTotal"
                  @pagination="loadCustomerList"
                />
              </el-card>
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
                  <el-button plain icon="Download" @click="importTemplate">下载模板</el-button>
                  <el-button type="success" plain icon="Upload" @click="handleImport">导入</el-button>
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
                <template #default="{ row }">
                  <button type="button" class="stat-link" @click="openPromoterAttributionDrilldown(row, 'company')">
                    {{ row.companyCount ?? 0 }}
                  </button>
                </template>
              </el-table-column>
              <el-table-column label="C端求职者" prop="jobSeekerCount" width="120" align="center">
                <template #default="{ row }">
                  <button type="button" class="stat-link" @click="openPromoterAttributionDrilldown(row, 'jobSeeker')">
                    {{ row.jobSeekerCount ?? 0 }}
                  </button>
                </template>
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

    <el-dialog v-model="drilldownVisible" :title="drilldownTitle" width="1120px" append-to-body>
      <div class="dialog-toolbar">
        <el-radio-group v-if="drilldownAllowSwitch" v-model="drilldownObjectType" @change="handleDrilldownTypeChange">
          <el-radio-button value="company">B端企业</el-radio-button>
          <el-radio-button value="user">C端求职者</el-radio-button>
        </el-radio-group>
        <el-tag v-else type="primary" effect="plain">{{ drilldownObjectTypeName }}</el-tag>
        <el-input
          v-model="drilldownQuery.keyword"
          :placeholder="drilldownObjectType === 'company' ? '企业名称/联系人/手机号' : '昵称/姓名/手机号'"
          clearable
          style="width: 220px"
          @keyup.enter="handleDrilldownSearch"
          @clear="handleDrilldownSearch"
        />
        <el-input
          v-model="drilldownQuery.promoterKeyword"
          placeholder="推广人姓名/手机号"
          clearable
          style="width: 190px"
          @keyup.enter="handleDrilldownSearch"
          @clear="handleDrilldownSearch"
        />
        <el-button type="primary" icon="Search" @click="handleDrilldownSearch">查询</el-button>
        <el-button icon="Refresh" :loading="drilldownLoading" @click="loadDrilldownDetails">刷新</el-button>
        <el-button icon="Download" @click="handleDrilldownExport">导出</el-button>
      </div>
      <el-table v-loading="drilldownLoading" :data="drilldownRows" border stripe max-height="520">
        <el-table-column :label="drilldownObjectType === 'company' ? '企业' : '求职者'" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="name-cell">
              <button v-if="drilldownObjectType === 'company'" type="button" class="stat-link name-text" @click="openCompanyInfo(row)">
                {{ row.objectName || '-' }}
              </button>
              <span v-else class="name-text">{{ row.objectName || '-' }}</span>
              <span class="sub-text">{{ row.phone || '-' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="来源推广人" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="name-cell">
              <button type="button" class="stat-link name-text" @click="openPromoterInfo(row)">{{ row.promoterName || '-' }}</button>
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
            <el-tag :type="detailStatusTag(row, drilldownObjectType)" size="small">{{ detailStatusText(row, drilldownObjectType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column v-if="drilldownObjectType === 'company'" label="资料完整" prop="completed" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="yesNoTag(row.completed)" size="small">{{ row.completed || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column v-if="drilldownObjectType === 'company'" label="岗位数" prop="jobCount" width="90" align="center" />
        <el-table-column v-if="drilldownObjectType === 'user'" label="授权" prop="authorized" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="yesNoTag(row.authorized)" size="small">{{ row.authorized || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column v-if="drilldownObjectType === 'user'" label="简历" prop="resumeCompleted" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="yesNoTag(row.resumeCompleted)" size="small">{{ row.resumeCompleted || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column v-if="drilldownObjectType === 'user'" label="投递" prop="applied" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="yesNoTag(row.applied)" size="small">{{ row.applied || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="首次进入" prop="promotedAt" width="170" align="center">
          <template #default="{ row }">{{ row.promotedAt || row.createTime || '-' }}</template>
        </el-table-column>
        <el-table-column v-if="drilldownObjectType === 'user'" label="授权时间" prop="authorizedTime" width="170" align="center" />
        <el-table-column v-if="drilldownObjectType === 'user'" label="简历时间" prop="resumeCompletedTime" width="170" align="center" />
        <el-table-column v-if="drilldownObjectType === 'user'" label="投递时间" prop="firstApplyTime" width="170" align="center" />
        <el-table-column label="操作" width="110" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" icon="Edit" @click="openAdjustAttribution(row)">调整来源</el-button>
          </template>
        </el-table-column>
      </el-table>
      <pagination
        v-show="drilldownTotal > 0"
        v-model:page="drilldownQuery.pageNum"
        v-model:limit="drilldownQuery.pageSize"
        :total="drilldownTotal"
        @pagination="loadDrilldownDetails"
      />
    </el-dialog>

    <!-- 企业/推广人 只读详情：由钻取明细列表点击企业名或推广人名打开 -->
    <el-dialog v-model="detailInfoVisible" :title="detailInfoTitle" width="560px" append-to-body>
      <el-descriptions v-loading="detailInfoLoading" :column="1" border>
        <el-descriptions-item v-for="item in detailInfoRows" :key="item.label" :label="item.label">
          {{ item.value }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <el-dialog v-model="promoterDrilldownVisible" :title="promoterDrilldownTitle" width="920px" append-to-body>
      <div class="dialog-toolbar">
        <el-tag type="primary" effect="plain">推广渠道维护</el-tag>
        <el-button icon="Refresh" :loading="promoterDrilldownLoading" @click="loadPromoterDrilldown">刷新</el-button>
      </div>
      <el-table v-loading="promoterDrilldownLoading" :data="promoterDrilldownRows" border stripe max-height="520">
        <el-table-column label="推广人" min-width="170" show-overflow-tooltip>
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
        <el-table-column label="岗位/角色" prop="roleName" min-width="150" show-overflow-tooltip />
        <el-table-column label="B端企业" prop="companyCount" width="105" align="center">
          <template #default="{ row }">
            <button type="button" class="stat-link" @click="openPromoterAttributionDrilldown(row, 'company')">{{ row.companyCount ?? 0 }}</button>
          </template>
        </el-table-column>
        <el-table-column label="C端求职者" prop="jobSeekerCount" width="120" align="center">
          <template #default="{ row }">
            <button type="button" class="stat-link" @click="openPromoterAttributionDrilldown(row, 'jobSeeker')">{{ row.jobSeekerCount ?? 0 }}</button>
          </template>
        </el-table-column>
        <el-table-column label="账号状态" prop="status" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.status)" size="small">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" prop="createTime" width="170" align="center" />
      </el-table>
      <pagination
        v-show="promoterDrilldownTotal > 0"
        v-model:page="promoterDrilldownQuery.pageNum"
        v-model:limit="promoterDrilldownQuery.pageSize"
        :total="promoterDrilldownTotal"
        @pagination="loadPromoterDrilldown"
      />
    </el-dialog>

    <el-dialog v-model="adjustDialogVisible" :title="adjustRequirePromoter ? '分配推广人' : '调整推广人'" width="520px" append-to-body>
      <el-form :model="adjustForm" label-width="92px">
        <el-form-item label="客户对象">
          <el-input :model-value="adjustForm.objectName" disabled />
        </el-form-item>
        <el-form-item label="推广人身份">
          <el-radio-group v-model="adjustPromoterIdentity">
            <el-radio-button value="">全部</el-radio-button>
            <el-radio-button value="0">内部</el-radio-button>
            <el-radio-button value="channel">外部</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="选择推广人">
          <el-select
            v-model="adjustForm.promoterId"
            :loading="promotersLoading"
            filterable
            clearable
            placeholder="输入姓名/手机号搜索后选择"
            style="width: 100%"
          >
            <el-option
              v-for="p in adjustPromoterCandidates"
              :key="p.promoterId"
              :label="`${p.name || '-'}（${p.phonenumber || '-'}）`"
              :value="p.promoterId!"
            >
              <span style="float: left">{{ p.name || '-' }}（{{ p.phonenumber || '-' }}）</span>
              <el-tag :type="identityTypeTag(p.identityType)" size="small" style="float: right; margin-top: 4px">
                {{ identityTypeText(p.identityType) }}
              </el-tag>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item v-if="!adjustRequirePromoter">
          <span class="table-subtitle">不选择推广人直接确定，将清空该客户的推广归因（转为自然流量）</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="adjustDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="adjustSubmitting" @click="submitAdjustAttribution">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="upload.open" :title="upload.title" width="420px" append-to-body>
      <el-upload
        ref="uploadRef"
        :limit="1"
        accept=".xlsx, .xls"
        :headers="upload.headers"
        :action="upload.url + '?updateSupport=' + upload.updateSupport"
        :disabled="upload.isUploading"
        :on-progress="handleFileUploadProgress"
        :on-success="handleFileSuccess"
        :auto-upload="false"
        drag
      >
        <el-icon class="el-icon--upload">
          <i-ep-upload-filled />
        </el-icon>
        <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
        <template #tip>
          <div class="text-center el-upload__tip">
            <div class="el-upload__tip"><el-checkbox v-model="upload.updateSupport" />更新已存在手机号的推广人员</div>
            <span>仅允许导入 xls、xlsx 格式文件。</span>
            <el-link type="primary" :underline="false" style="font-size: 12px; vertical-align: baseline" @click="importTemplate">下载模板</el-link>
          </div>
        </template>
      </el-upload>
      <template #footer>
        <el-button @click="upload.open = false">取消</el-button>
        <el-button type="primary" :loading="upload.isUploading" @click="submitFileForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="RecruitmentPromoter" lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import * as echarts from 'echarts';
import { ElMessage, ElMessageBox, type FormRules, type UploadFile, type UploadInstance } from 'element-plus';
import {
  addPromoter,
  adjustPromoterAttribution,
  changePromoterStatus,
  getCompany,
  getPromoter,
  getPromoterStatistics,
  listPromoterCompanyDetail,
  listPromoterUserDetail,
  listSeaCustomerCompany,
  listSeaCustomerUser,
  listPromoter,
  updatePromoter,
  type PromotionAttributionAdjustForm,
  type PromotionAttributionDetailVO,
  type PromotionAttributionQuery,
  type PromoterForm,
  type PromoterIdentityPeriod,
  type PromoterQuery,
  type PromoterStatisticsGroup,
  type PromoterStatisticsPeriod,
  type PromoterStatisticsRow,
  type PromoterStatisticsTimeUnit,
  type PromoterStatisticsVO,
  type PromoterVO
} from '@/api/recruitment';
import { download, globalHeaders } from '@/utils/request';
import { useUserStore } from '@/store/modules/user';
import { unwrapList } from './helpers';
import { companyStatusMeta } from './constants';

type TagType = 'primary' | 'success' | 'warning' | 'danger' | 'info';
type StatisticsSide = 'all' | 'company' | 'jobSeeker';
type DetailObjectType = 'company' | 'user';
type ActiveTab = 'overview' | 'companyOverview' | 'userOverview' | 'identity' | 'statistics' | 'statisticsDetail' | 'sea' | 'list';
type CountLike = Pick<PromoterStatisticsGroup, 'companyCount' | 'jobSeekerCount'>;
type OverviewPeriodMetric = 'companyCount' | 'jobSeekerCount' | 'authorizedCount' | 'resumeCount' | 'applyCount';
type DrilldownMetric = 'company' | 'jobSeeker' | 'authorized' | 'resume' | 'apply';
type IdentityDrilldownType = 'internal' | 'channel';
type OverviewRow = {
  label: string;
  description: string;
  metric: OverviewPeriodMetric;
  today: number;
  year: number;
  halfYear: number;
  quarter: number;
  month: number;
};
type CompanyOverviewMetric =
  | 'enteredCompanyCount'
  | 'certifiedCompanyCount'
  | 'publishedCompanyCount'
  | 'fullTimePublishedCompanyCount'
  | 'partTimePublishedCompanyCount'
  | 'promotedCompanyCount'
  | 'interviewCompanyCount'
  | 'hiredCompanyCount';
type CompanyOverviewRow = {
  label: string;
  description: string;
  metric: CompanyOverviewMetric;
  today: number;
  year: number;
  halfYear: number;
  quarter: number;
  month: number;
};
// 用户端概览指标：均取自 overview.periodStats（与推广总览同接口返回）。
// authorized/resume/apply 为已有口径；fullTime/partTime/interview/hired 为后端新增的用户侧投递漏斗口径。
type UserOverviewMetric =
  | 'authorizedCount'
  | 'resumeCount'
  | 'applyCount'
  | 'fullTimeApplyCount'
  | 'partTimeApplyCount'
  | 'interviewUserCount'
  | 'hiredUserCount';
type UserOverviewRow = {
  label: string;
  description: string;
  metric: UserOverviewMetric;
  today: number;
  year: number;
  halfYear: number;
  quarter: number;
  month: number;
};

interface AttributionDrilldownOptions {
  title: string;
  objectType?: DetailObjectType;
  metric?: DrilldownMetric;
  periodKey?: string;
  promoterId?: string | number;
  promoterKeyword?: string;
  identityType?: string;
  status?: string;
  allowSwitch?: boolean;
  useCurrentRange?: boolean;
}

interface PromoterDrilldownOptions {
  title: string;
  query?: PromoterQuery;
  periodKey?: string;
  useCurrentRange?: boolean;
  useDateRange?: boolean;
}

const loading = ref(false);
const submitting = ref(false);
const tableData = ref<PromoterVO[]>([]);
const total = ref(0);
const dialogVisible = ref(false);
const isEdit = ref(false);
const showMoreQuery = ref(false);
const queryFormRef = ref();
const formRef = ref();
const uploadRef = ref<UploadInstance>();
const userStore = useUserStore();
const isAdminUser = computed(() => userStore.roles.includes('superadmin'));
const activeTab = ref<ActiveTab>(isAdminUser.value ? 'overview' : 'list');

const statisticsLoading = ref(false);
const companyOverviewLoading = ref(false);
const userOverviewLoading = ref(false);
const statisticsDateRange = ref<[string, string] | []>([]);
const listDateRange = ref<[string, string] | []>([]);
const detailDateRange = ref<[string, string] | []>([]);
const statisticsTimeUnit = ref<PromoterStatisticsTimeUnit>('month');
const statisticsSide = ref<StatisticsSide>('all');
const detailObjectType = ref<DetailObjectType>('company');
const detailLoading = ref(false);
const attributionDetailRows = ref<PromotionAttributionDetailVO[]>([]);
const detailTotal = ref(0);
const drilldownVisible = ref(false);
const drilldownTitle = ref('');
const drilldownObjectType = ref<DetailObjectType>('company');
const drilldownAllowSwitch = ref(false);
const drilldownLoading = ref(false);
const drilldownRows = ref<PromotionAttributionDetailVO[]>([]);
const drilldownTotal = ref(0);
const promoterDrilldownVisible = ref(false);
const promoterDrilldownTitle = ref('');
const promoterDrilldownLoading = ref(false);
const promoterDrilldownRows = ref<PromoterVO[]>([]);
const promoterDrilldownTotal = ref(0);
const adjustDialogVisible = ref(false);
const adjustSubmitting = ref(false);
// 分配来源的触发上下文：来自归因明细弹窗('detail') 还是客户管理列表('customer')，决定提交后刷新哪个列表
const adjustContext = ref<'detail' | 'customer'>('detail');
// 调整/分配弹窗：推广人候选列表（一次性拉取启用中的推广人，弹窗内按身份本地过滤 + 名称搜索）
const allPromoters = ref<PromoterVO[]>([]);
const promotersLoading = ref(false);
const adjustPromoterIdentity = ref<string>(''); // '' 全部 / '0' 内部 / 'channel' 外部(渠道+合伙人)

// 客户管理：对象类型(企业B端/面试者C端) × 归因状态(已绑推广码 bound / 公海 sea) 两个维度，共用一套查询/数据，切换时重新拉取。
const seaObjectType = ref<DetailObjectType>('company');
const customerScope = ref<'bound' | 'sea'>('bound');
const seaLoading = ref(false);
const seaRows = ref<PromotionAttributionDetailVO[]>([]);
const seaTotal = ref(0);
const seaDateRange = ref<[string, string] | []>([]);
const seaQuery = reactive<PromotionAttributionQuery>({
  pageNum: 1,
  pageSize: 10,
  keyword: '',
  status: '',
  promoterKeyword: '',
  promoterId: undefined
});

// 已绑列表多选 + 批量移动公海
const seaTableRef = ref();
const seaSelection = ref<PromotionAttributionDetailVO[]>([]);

// 已绑客户左树（懒加载异步树）：根=部门壹聘(全部)，展开后子=全部推广人(员工)，节点带 企业数/求职者数 统计；点击员工→右表按 promoterId 过滤
const promoterTreeRef = ref();
const promoterTreeKeyword = ref('');
const selectedPromoterNodeId = ref<string>('ROOT'); // 当前选中节点 id，'ROOT'=壹聘=全部
const promoterTreeKey = ref(0); // 变更即重挂树(用于「刷新」强制重拉懒加载)
const promoterTreeExpandedKeys = ref<string[]>(['ROOT']); // 默认展开根，员工异步流入
const rootStat = ref({ companyCount: 0, jobSeekerCount: 0 }); // 全员合计（员工加载后回填）
const rootStatLoaded = ref(false);

// 员工节点缓存：同一份 Promise 复用，避免切 tab/口径或折叠展开时重复请求统计接口
let employeesPromise: Promise<any[]> | null = null;

// 拉取员工节点：listPromoter(全员花名册) 与 getPromoterStatistics(真实绑定量) 并行，
// 真实绑定量取自统计 rows（与右表/活跃统计同源）；listPromoter 自带的 companyCount 是表单手填值故不用。
function fetchPromoterEmployees(force = false): Promise<any[]> {
  if (force) employeesPromise = null;
  if (!employeesPromise) {
    employeesPromise = (async () => {
      const [pRes, sRes] = await Promise.all([
        listPromoter({ pageNum: 1, pageSize: 1000 }),
        getPromoterStatistics({}).catch(() => null) // 统计异常不阻断树，退化为 0
      ]);
      const roster = unwrapList<PromoterVO>(pRes).rows;
      const statMap = new Map<string, { companyCount: number; jobSeekerCount: number }>();
      for (const r of (sRes as any)?.data?.rows || []) {
        statMap.set(String(r.promoterId), { companyCount: r.companyCount ?? 0, jobSeekerCount: r.jobSeekerCount ?? 0 });
      }
      const nodes = roster.map((p) => {
        const s = statMap.get(String(p.promoterId));
        return {
          id: String(p.promoterId),
          label: `${p.name || '-'}（${p.phonenumber || '-'}）`,
          promoterId: p.promoterId,
          companyCount: s?.companyCount ?? 0,
          jobSeekerCount: s?.jobSeekerCount ?? 0,
          isLeaf: true
        };
      });
      rootStat.value = {
        companyCount: nodes.reduce((a, n) => a + n.companyCount, 0),
        jobSeekerCount: nodes.reduce((a, n) => a + n.jobSeekerCount, 0)
      };
      rootStatLoaded.value = true;
      return nodes;
    })().catch((e) => {
      employeesPromise = null; // 失败允许下次重试
      throw e;
    });
  }
  return employeesPromise;
}

// el-tree 懒加载回调：level 0 返回根节点(秒出)，展开根时异步返回员工(node 自带 loading)
async function loadPromoterTreeNode(node: any, resolve: (data: any[]) => void) {
  if (node.level === 0) {
    resolve([{ id: 'ROOT', label: '部门壹聘', promoterId: '', isLeaf: false }]);
    return;
  }
  if (node.data?.id === 'ROOT') {
    try {
      resolve(await fetchPromoterEmployees());
    } catch {
      resolve([]);
    }
    return;
  }
  resolve([]);
}

// 「刷新」：清缓存 + 重挂树强制重拉懒加载（保留展开状态，根展开则自动重载）
function loadPromoterTree() {
  employeesPromise = null;
  rootStatLoaded.value = false;
  rootStat.value = { companyCount: 0, jobSeekerCount: 0 };
  promoterTreeKey.value++;
}

// 节点统计文案：根用全员合计，员工用各自绑定量
function nodeStatText(data: any) {
  if (data.id === 'ROOT') return rootStat.value;
  return { companyCount: data.companyCount ?? 0, jobSeekerCount: data.jobSeekerCount ?? 0 };
}

// 记录展开状态，便于刷新重挂后保持
function handlePromoterNodeExpand(data: any) {
  if (!promoterTreeExpandedKeys.value.includes(data.id)) promoterTreeExpandedKeys.value.push(data.id);
}
function handlePromoterNodeCollapse(data: any) {
  promoterTreeExpandedKeys.value = promoterTreeExpandedKeys.value.filter((k) => k !== data.id);
}

// 树本地搜索：按节点 label(姓名/手机) 过滤（懒加载下对已加载节点生效）
function filterPromoterTreeNode(value: string, data: any) {
  if (!value) return true;
  return String(data.label).includes(value);
}
watch(promoterTreeKeyword, (val) => {
  promoterTreeRef.value?.filter(val);
});

// 点击树节点：根=清除推广人过滤看全部，员工=按其 promoterId 过滤右表
function handlePromoterNodeClick(data: any) {
  selectedPromoterNodeId.value = data.id;
  seaQuery.promoterId = data.id === 'ROOT' ? undefined : data.promoterId;
  seaQuery.pageNum = 1;
  loadCustomerList();
}
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

const drilldownQuery = reactive<PromotionAttributionQuery>({
  pageNum: 1,
  pageSize: 10,
  promoterId: undefined,
  promoterKeyword: '',
  identityType: '',
  status: '',
  keyword: '',
  beginTime: '',
  endTime: ''
});

const promoterDrilldownQuery = reactive<PromoterQuery>({
  pageNum: 1,
  pageSize: 10,
  name: '',
  phonenumber: '',
  identityType: '',
  roleName: '',
  status: '',
  params: {}
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

const upload = reactive<ImportOption>({
  open: false,
  title: '',
  isUploading: false,
  updateSupport: 0,
  headers: globalHeaders(),
  url: import.meta.env.VITE_APP_BASE_API + '/admin/recruitment/promoter/importData'
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
const companyOverviewRows = computed(() => [
  // 企业端指标已并入 /promoter/statistics（overview.periodStats），与推广总览同接口返回
  buildCompanyOverviewRow('已进入', '通过推广进入但仍未审核的企业（待审核或草稿未提交）', 'enteredCompanyCount'),
  buildCompanyOverviewRow('已认证企业', '审核通过的企业数量', 'certifiedCompanyCount'),
  buildCompanyOverviewRow('已发布岗位企业', '已发布任意岗位的企业数量', 'publishedCompanyCount'),
  buildCompanyOverviewRow('已发布全职岗位企业', '已发布全职岗位的企业数量', 'fullTimePublishedCompanyCount'),
  buildCompanyOverviewRow('已发布兼职岗位企业', '已发布兼职岗位的企业数量', 'partTimePublishedCompanyCount'),
  buildCompanyOverviewRow('推广进入企业', '通过推广进入且审核通过的企业数量', 'promotedCompanyCount'),
  buildCompanyOverviewRow('已邀请面试企业', '已邀请面试的企业数量', 'interviewCompanyCount'),
  buildCompanyOverviewRow('已录用企业', '已录用企业数量', 'hiredCompanyCount')
]);
const userOverviewRows = computed<UserOverviewRow[]>(() => [
  // 用户端漏斗：进入授权 → 完善简历 → 投递（合计/全职/兼职）→ 参与面试 → 被录用。
  // 全部取自 overview.periodStats（同 /promoter/statistics 接口），与企业端概览同源，切页签无需重复请求。
  buildUserOverviewRow('进入并授权手机号', '通过推广链接/二维码进入并完成手机号授权的求职者数', 'authorizedCount'),
  buildUserOverviewRow('完善简历', '填写/完善简历的求职者数', 'resumeCount'),
  buildUserOverviewRow('投递企业（合计）', '产生投递的求职者去重数', 'applyCount'),
  buildUserOverviewRow('投递企业·全职', '投递了全职岗位的求职者去重数', 'fullTimeApplyCount'),
  buildUserOverviewRow('投递企业·兼职', '投递了兼职岗位的求职者去重数', 'partTimeApplyCount'),
  buildUserOverviewRow('参与面试', '投递进入面试邀请状态的求职者去重数', 'interviewUserCount'),
  buildUserOverviewRow('被录用', '投递进入已录用状态的求职者去重数', 'hiredUserCount')
]);
const identityPeriodRows = computed(() => statisticsData.overview?.identityPeriodStats || []);
const metricLabel = computed(() => {
  if (statisticsSide.value === 'company') return 'B端企业';
  if (statisticsSide.value === 'jobSeeker') return 'C端求职者';
  return 'B/C合计';
});
const detailObjectTypeName = computed(() => (detailObjectType.value === 'company' ? 'B端企业' : 'C端求职者'));
const drilldownObjectTypeName = computed(() => (drilldownObjectType.value === 'company' ? 'B端企业' : 'C端求职者'));
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
const periodLabelMap: Record<string, string> = {
  today: '今日',
  year: '本年',
  halfYear: '本半年',
  quarter: '本季度',
  month: '本月'
};
const metricLabelMap: Record<DrilldownMetric, string> = {
  company: 'B端企业',
  jobSeeker: 'C端求职者',
  authorized: '授权手机号',
  resume: '完成简历',
  apply: '产生投递'
};
const identityGroupLabelMap: Record<IdentityDrilldownType, string> = {
  internal: '内部人员',
  channel: '渠道'
};

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

function detailStatusTag(row: PromotionAttributionDetailVO, objectType: DetailObjectType = detailObjectType.value): TagType {
  if (objectType === 'company') {
    if (row.status === '1' || row.status === 'completed' || row.status === 'published') return 'success';
    if (row.status === '0' || row.status === 'incomplete' || row.status === '4') return 'warning';
    if (row.status === '2') return 'danger';
    return 'info';
  }
  if (row.status === 'apply') return 'success';
  if (row.status === 'resume') return 'primary';
  if (row.status === 'authorized') return 'warning';
  return 'info';
}

// 状态文本：企业端后端 statusName 对未覆盖状态(如草稿4)会回退成原始数字，统一用企业状态字典兜底；C端 statusName 已是中文枚举直接用。
function detailStatusText(row: PromotionAttributionDetailVO, objectType: DetailObjectType = detailObjectType.value): string {
  if (objectType === 'company') return companyStatusMeta(row.status).label;
  return row.statusName || '-';
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

type NormalizedPromoterPeriodKey = 'today' | 'year' | 'halfYear' | 'quarter' | 'month';

const periodAliasMap: Record<string, NormalizedPromoterPeriodKey> = {
  // 口径对齐：把不同后端 key 映射为前端固定口径
  today: 'today',
  day: 'today',
  daily: 'today',
  todaypromotion: 'today',
  thisday: 'today',
  year: 'year',
  yearly: 'year',
  annual: 'year',
  ytd: 'year',
  yeartodate: 'year',
  fullyear: 'year',
  halfyear: 'halfYear',
  h1: 'halfYear',
  h2: 'halfYear',
  quarter: 'quarter',
  q1: 'quarter',
  q2: 'quarter',
  q3: 'quarter',
  q4: 'quarter',
  month: 'month',
  monthly: 'month',
  thismonth: 'month',
  monthtodate: 'month'
};

const normalizeOverviewPeriodKey = (raw?: string): NormalizedPromoterPeriodKey | undefined => {
  if (!raw) return undefined;
  const normalized = String(raw)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/-/g, '')
    .replace(/_/g, '')
    .replace(/([^\u4e00-\u9fff\w])/g, '');
  return Object.prototype.hasOwnProperty.call(periodAliasMap, normalized) ? periodAliasMap[normalized] : undefined;
};

const normalizedPromoterPeriodMetricKeys: Array<keyof Omit<PromoterStatisticsPeriod, 'key' | 'label'>> = [
  'companyCount',
  'jobSeekerCount',
  'authorizedCount',
  'resumeCount',
  'applyCount',
  'fullTimeApplyCount',
  'partTimeApplyCount',
  'interviewUserCount',
  'hiredUserCount',
  'enteredCompanyCount',
  'certifiedCompanyCount',
  'publishedCompanyCount',
  'fullTimePublishedCompanyCount',
  'partTimePublishedCompanyCount',
  'promotedCompanyCount',
  'communicatedCompanyCount',
  'interviewCompanyCount',
  'hiredCompanyCount',
  'settledCompanyCount'
];
function normalizeOverviewPeriodStats(periodStats?: PromoterStatisticsPeriod[]): PromoterStatisticsPeriod[] {
  if (!Array.isArray(periodStats) || periodStats.length === 0) return [];
  const mergedMap = periodStats.reduce<Map<NormalizedPromoterPeriodKey, PromoterStatisticsPeriod>>((acc, item) => {
    const key = normalizeOverviewPeriodKey(item.key || item.label);
    if (!key) return acc;
    const exist = acc.get(key) || ({ key, label: periodLabelMap[key] } as PromoterStatisticsPeriod);
    const merged: PromoterStatisticsPeriod = {
      ...exist,
      key
    };
    for (const metricKey of normalizedPromoterPeriodMetricKeys) {
      merged[metricKey] = toCount((exist as Record<string, number | undefined>)[metricKey] as number) + toCount(item[metricKey] as number);
    }
    acc.set(key, merged);
    return acc;
  }, new Map());
  return Array.from(mergedMap.values());
}

function isNormalizedPeriodMatch(itemKey: string | undefined, target: NormalizedPromoterPeriodKey) {
  const normalized = normalizeOverviewPeriodKey(itemKey);
  return Boolean(normalized && normalized === target);
}

function overviewPeriodValue(periodKey: string, metric: OverviewPeriodMetric) {
  const target = normalizeOverviewPeriodKey(periodKey);
  if (!target) {
    const direct = (statisticsData.overview?.periodStats || []).find((item) => item.key === periodKey || item.label === periodKey);
    return Number(direct?.[metric] || 0);
  }
  const period = (statisticsData.overview?.periodStats || []).find(
    (item) => isNormalizedPeriodMatch(item.key, target) || isNormalizedPeriodMatch(item.label, target)
  );
  return Number(period?.[metric] || 0);
}

function buildOverviewRow(label: string, description: string, metric: OverviewPeriodMetric) {
  return {
    label,
    description,
    metric,
    today: overviewPeriodValue('today', metric),
    year: overviewPeriodValue('year', metric),
    halfYear: overviewPeriodValue('halfYear', metric),
    quarter: overviewPeriodValue('quarter', metric),
    month: overviewPeriodValue('month', metric)
  };
}

function companyOverviewPeriodValue(periodKey: string, metric: CompanyOverviewMetric) {
  // 企业端概览复用「总览统计」已加载的数据（同接口 /promoter/statistics 返回，overview.periodStats），
  // 因此切换到本页签时无需再次请求接口。
  const periodStats = statisticsData.overview?.periodStats || [];
  const target = normalizeOverviewPeriodKey(periodKey);
  if (!target) {
    const direct = periodStats.find((item) => item.key === periodKey || item.label === periodKey);
    return Number((direct as Record<string, number | undefined> | undefined)?.[metric] || 0);
  }
  const period = periodStats.find((item) => isNormalizedPeriodMatch(item.key, target) || isNormalizedPeriodMatch(item.label, target));
  return Number((period as Record<string, number | undefined> | undefined)?.[metric] || 0);
}

function buildCompanyOverviewRow(label: string, description: string, metric: CompanyOverviewMetric) {
  return {
    label,
    description,
    metric,
    today: companyOverviewPeriodValue('today', metric),
    year: companyOverviewPeriodValue('year', metric),
    halfYear: companyOverviewPeriodValue('halfYear', metric),
    quarter: companyOverviewPeriodValue('quarter', metric),
    month: companyOverviewPeriodValue('month', metric)
  };
}

// 用户端概览与企业端概览同样复用 overview.periodStats，按周期 key 取对应用户侧指标值。
function userOverviewPeriodValue(periodKey: string, metric: UserOverviewMetric) {
  const periodStats = statisticsData.overview?.periodStats || [];
  const target = normalizeOverviewPeriodKey(periodKey);
  if (!target) {
    const direct = periodStats.find((item) => item.key === periodKey || item.label === periodKey);
    return Number((direct as Record<string, number | undefined> | undefined)?.[metric] || 0);
  }
  const period = periodStats.find((item) => isNormalizedPeriodMatch(item.key, target) || isNormalizedPeriodMatch(item.label, target));
  return Number((period as Record<string, number | undefined> | undefined)?.[metric] || 0);
}

function buildUserOverviewRow(label: string, description: string, metric: UserOverviewMetric): UserOverviewRow {
  return {
    label,
    description,
    metric,
    today: userOverviewPeriodValue('today', metric),
    year: userOverviewPeriodValue('year', metric),
    halfYear: userOverviewPeriodValue('halfYear', metric),
    quarter: userOverviewPeriodValue('quarter', metric),
    month: userOverviewPeriodValue('month', metric)
  };
}

function periodLabel(periodKey?: string) {
  return periodKey ? periodLabelMap[periodKey] || periodKey : '当前筛选';
}

function padDate(value: number) {
  return String(value).padStart(2, '0');
}

function formatDateTime(date: Date) {
  return `${date.getFullYear()}-${padDate(date.getMonth() + 1)}-${padDate(date.getDate())} ${padDate(date.getHours())}:${padDate(date.getMinutes())}:${padDate(date.getSeconds())}`;
}

function getPeriodDateRange(periodKey?: string) {
  if (!periodKey) return null;
  const now = new Date();
  let start: Date | null = null;
  let endStart: Date | null = null;
  if (periodKey === 'today') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    endStart = new Date(start);
    endStart.setDate(endStart.getDate() + 1);
  } else if (periodKey === 'year') {
    start = new Date(now.getFullYear(), 0, 1);
    endStart = new Date(now.getFullYear() + 1, 0, 1);
  } else if (periodKey === 'halfYear') {
    const startMonth = now.getMonth() < 6 ? 0 : 6;
    start = new Date(now.getFullYear(), startMonth, 1);
    endStart = new Date(now.getFullYear(), startMonth + 6, 1);
  } else if (periodKey === 'quarter') {
    const startMonth = Math.floor(now.getMonth() / 3) * 3;
    start = new Date(now.getFullYear(), startMonth, 1);
    endStart = new Date(now.getFullYear(), startMonth + 3, 1);
  } else if (periodKey === 'month') {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    endStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }
  if (!start || !endStart) return null;
  return {
    beginTime: formatDateTime(start),
    endTime: formatDateTime(new Date(endStart.getTime() - 1000))
  };
}

function getTimeLabelDateRange(label?: string) {
  if (!label || label === '-') return null;
  const dayMatch = label.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dayMatch) {
    const start = new Date(Number(dayMatch[1]), Number(dayMatch[2]) - 1, Number(dayMatch[3]));
    const endStart = new Date(start);
    endStart.setDate(endStart.getDate() + 1);
    return { beginTime: formatDateTime(start), endTime: formatDateTime(new Date(endStart.getTime() - 1000)) };
  }
  const monthMatch = label.match(/^(\d{4})-(\d{2})$/);
  if (monthMatch) {
    const start = new Date(Number(monthMatch[1]), Number(monthMatch[2]) - 1, 1);
    const endStart = new Date(Number(monthMatch[1]), Number(monthMatch[2]), 1);
    return { beginTime: formatDateTime(start), endTime: formatDateTime(new Date(endStart.getTime() - 1000)) };
  }
  const quarterMatch = label.match(/^(\d{4})-Q([1-4])$/);
  if (quarterMatch) {
    const startMonth = (Number(quarterMatch[2]) - 1) * 3;
    const start = new Date(Number(quarterMatch[1]), startMonth, 1);
    const endStart = new Date(Number(quarterMatch[1]), startMonth + 3, 1);
    return { beginTime: formatDateTime(start), endTime: formatDateTime(new Date(endStart.getTime() - 1000)) };
  }
  const halfYearMatch = label.match(/^(\d{4})-H([1-2])$/);
  if (halfYearMatch) {
    const startMonth = Number(halfYearMatch[2]) === 1 ? 0 : 6;
    const start = new Date(Number(halfYearMatch[1]), startMonth, 1);
    const endStart = new Date(Number(halfYearMatch[1]), startMonth + 6, 1);
    return { beginTime: formatDateTime(start), endTime: formatDateTime(new Date(endStart.getTime() - 1000)) };
  }
  const yearMatch = label.match(/^(\d{4})$/);
  if (yearMatch) {
    const start = new Date(Number(yearMatch[1]), 0, 1);
    const endStart = new Date(Number(yearMatch[1]) + 1, 0, 1);
    return { beginTime: formatDateTime(start), endTime: formatDateTime(new Date(endStart.getTime() - 1000)) };
  }
  return null;
}

function currentStatisticsDateRange() {
  const [beginDate, endDate] = statisticsDateRange.value;
  return {
    beginTime: beginDate ? `${beginDate} 00:00:00` : '',
    endTime: endDate ? `${endDate} 23:59:59` : ''
  };
}

function resolveDateRange(periodKey?: string, useCurrentRange = true) {
  return getPeriodDateRange(periodKey) || (useCurrentRange ? currentStatisticsDateRange() : { beginTime: '', endTime: '' });
}

function metricDetailFilter(metric?: DrilldownMetric, fallbackObjectType: DetailObjectType = 'company') {
  if (metric === 'company') return { objectType: 'company' as DetailObjectType, status: '' };
  if (metric === 'jobSeeker') return { objectType: 'user' as DetailObjectType, status: '' };
  if (metric === 'authorized') return { objectType: 'user' as DetailObjectType, status: 'authorized' };
  if (metric === 'resume') return { objectType: 'user' as DetailObjectType, status: 'resume' };
  if (metric === 'apply') return { objectType: 'user' as DetailObjectType, status: 'apply' };
  return { objectType: fallbackObjectType, status: '' };
}

function setDrilldownQuery(options: AttributionDrilldownOptions, status: string) {
  const dateRange = resolveDateRange(options.periodKey, options.useCurrentRange !== false);
  drilldownQuery.pageNum = 1;
  drilldownQuery.pageSize = 10;
  drilldownQuery.promoterId = options.promoterId;
  drilldownQuery.promoterKeyword = options.promoterKeyword ?? statisticsQuery.name ?? '';
  drilldownQuery.identityType = options.identityType ?? statisticsQuery.identityType ?? '';
  drilldownQuery.status = options.status ?? status;
  drilldownQuery.keyword = '';
  drilldownQuery.beginTime = dateRange.beginTime;
  drilldownQuery.endTime = dateRange.endTime;
}

function buildDrilldownQuery(): PromotionAttributionQuery {
  return {
    ...drilldownQuery,
    promoterId: drilldownQuery.promoterId || undefined,
    promoterKeyword: drilldownQuery.promoterKeyword || undefined,
    identityType: drilldownQuery.identityType || undefined,
    status: drilldownQuery.status || undefined,
    keyword: drilldownQuery.keyword || undefined,
    beginTime: drilldownQuery.beginTime || undefined,
    endTime: drilldownQuery.endTime || undefined
  };
}

function openAttributionDrilldown(options: AttributionDrilldownOptions) {
  const filter = metricDetailFilter(options.metric, options.objectType || 'company');
  drilldownObjectType.value = options.objectType || filter.objectType;
  drilldownAllowSwitch.value = Boolean(options.allowSwitch);
  drilldownTitle.value = options.title;
  setDrilldownQuery(options, filter.status);
  drilldownVisible.value = true;
  loadDrilldownDetails();
}

async function loadDrilldownDetails() {
  if (!isAdminUser.value) return;
  drilldownLoading.value = true;
  try {
    const api = drilldownObjectType.value === 'company' ? listPromoterCompanyDetail : listPromoterUserDetail;
    const res = await api(buildDrilldownQuery());
    const list = unwrapList<PromotionAttributionDetailVO>(res);
    drilldownRows.value = list.rows;
    drilldownTotal.value = list.total;
  } finally {
    drilldownLoading.value = false;
  }
}

function handleDrilldownTypeChange() {
  drilldownQuery.pageNum = 1;
  drilldownQuery.status = '';
  loadDrilldownDetails();
}

function openOverviewCardDrilldown(card: { key: string; label: string }) {
  openAttributionDrilldown({
    title: `${card.label}推广明细`,
    objectType: 'company',
    periodKey: card.key,
    promoterKeyword: '',
    identityType: '',
    allowSwitch: true,
    useCurrentRange: false
  });
}

function openOverviewCellDrilldown(row: OverviewRow, periodKey: string) {
  openAttributionDrilldown({
    title: `${periodLabel(periodKey)}${row.label}明细`,
    metric:
      row.metric === 'companyCount'
        ? 'company'
        : row.metric === 'jobSeekerCount'
          ? 'jobSeeker'
          : row.metric === 'authorizedCount'
            ? 'authorized'
            : row.metric === 'resumeCount'
              ? 'resume'
              : 'apply',
    periodKey,
    promoterKeyword: '',
    identityType: '',
    useCurrentRange: false
  });
}

// 企业端概览各指标 → 归因明细列表的 status 过滤值（与后端 selectCompanyAttributionPage 的 status 分支一致）
const companyOverviewMetricStatusMap: Record<CompanyOverviewMetric, string> = {
  enteredCompanyCount: 'entered', // 未审核：待审核0/草稿4
  certifiedCompanyCount: 'certified', // 审核通过：已认证1/通过3
  promotedCompanyCount: 'certified', // 推广进入企业=审核通过，同上
  publishedCompanyCount: 'published', // 名下有岗位
  fullTimePublishedCompanyCount: 'fulltime', // 名下有全职岗位
  partTimePublishedCompanyCount: 'parttime', // 名下有兼职/临时/项目制岗位
  interviewCompanyCount: 'interview', // 名下有面试邀请/录用投递
  hiredCompanyCount: 'hired' // 名下有已录用投递
};

// 企业端概览按单元格进入归因明细：按所点指标下发 status 过滤，列表只展示该指标对应的企业
function openCompanyOverviewCellDrilldown(row: CompanyOverviewRow, periodKey: string) {
  openAttributionDrilldown({
    title: `${periodLabel(periodKey)}${row.label}明细`,
    objectType: 'company',
    status: companyOverviewMetricStatusMap[row.metric] || '',
    periodKey,
    promoterKeyword: '',
    identityType: '',
    useCurrentRange: false
  });
}

// 用户端概览各指标 → 用户归因明细列表的 status 过滤值（与后端 selectUserAttributionPage 支持的状态一致）。
// 该明细接口目前仅支持 authorized/resume/apply（及 unresume/unapply）；
// 全职/兼职、参与面试、被录用 暂无对应明细状态，统一下钻到「已投递」求职者列表，表头计数仍为各自精确口径。
const userOverviewMetricStatusMap: Record<UserOverviewMetric, string> = {
  authorizedCount: 'authorized',
  resumeCount: 'resume',
  applyCount: 'apply',
  fullTimeApplyCount: 'apply',
  partTimeApplyCount: 'apply',
  interviewUserCount: 'apply',
  hiredUserCount: 'apply'
};

// 用户端概览按单元格进入归因明细：下钻到该周期内归因到推广的 C 端求职者，并按指标预选明细状态。
function openUserOverviewCellDrilldown(row: UserOverviewRow, periodKey: string) {
  openAttributionDrilldown({
    title: `${periodLabel(periodKey)}${row.label}明细`,
    objectType: 'user',
    status: userOverviewMetricStatusMap[row.metric] || '',
    periodKey,
    promoterKeyword: '',
    identityType: '',
    useCurrentRange: false
  });
}

function openIdentityPeriodDrilldown(row: PromoterIdentityPeriod, identityType: IdentityDrilldownType, objectType: DetailObjectType) {
  openAttributionDrilldown({
    title: `${row.label || periodLabel(row.key)}${identityGroupLabelMap[identityType]}${objectType === 'company' ? 'B端企业' : 'C端用户'}明细`,
    objectType,
    identityType,
    promoterKeyword: '',
    periodKey: row.key,
    useCurrentRange: false
  });
}

function setPromoterDrilldownQuery(query: PromoterQuery = {}, periodKey?: string, useCurrentRange = true, useDateRange = true) {
  const dateRange = useDateRange ? resolveDateRange(periodKey, useCurrentRange) : { beginTime: '', endTime: '' };
  promoterDrilldownQuery.pageNum = 1;
  promoterDrilldownQuery.pageSize = 10;
  promoterDrilldownQuery.name = query.name || '';
  promoterDrilldownQuery.phonenumber = query.phonenumber || '';
  promoterDrilldownQuery.identityType = query.identityType || '';
  promoterDrilldownQuery.roleName = query.roleName || '';
  promoterDrilldownQuery.status = query.status || '';
  promoterDrilldownQuery.params = {
    beginTime: dateRange.beginTime || undefined,
    endTime: dateRange.endTime || undefined
  };
}

function buildPromoterDrilldownQuery(): PromoterQuery {
  const params = promoterDrilldownQuery.params || {};
  return {
    ...promoterDrilldownQuery,
    name: promoterDrilldownQuery.name || undefined,
    phonenumber: promoterDrilldownQuery.phonenumber || undefined,
    identityType: promoterDrilldownQuery.identityType || undefined,
    roleName: promoterDrilldownQuery.roleName || undefined,
    status: promoterDrilldownQuery.status || undefined,
    params: {
      beginTime: params.beginTime || undefined,
      endTime: params.endTime || undefined
    }
  };
}

function openPromoterDrilldown(options: PromoterDrilldownOptions) {
  promoterDrilldownTitle.value = options.title;
  setPromoterDrilldownQuery(options.query, options.periodKey, options.useCurrentRange !== false, options.useDateRange !== false);
  promoterDrilldownVisible.value = true;
  loadPromoterDrilldown();
}

function openTimeTrendDrilldown(group: PromoterStatisticsGroup) {
  const range = getTimeLabelDateRange(group.key || group.label);
  promoterDrilldownTitle.value = `${group.label || group.key || '时间趋势'}推广人列表`;
  setPromoterDrilldownQuery(
    {
      name: statisticsQuery.name,
      identityType: statisticsQuery.identityType,
      status: statisticsQuery.status
    },
    undefined,
    true,
    false
  );
  promoterDrilldownQuery.params = {
    beginTime: range?.beginTime || undefined,
    endTime: range?.endTime || undefined
  };
  promoterDrilldownVisible.value = true;
  loadPromoterDrilldown();
}

async function loadPromoterDrilldown() {
  if (!isAdminUser.value) return;
  promoterDrilldownLoading.value = true;
  try {
    const res = await listPromoter(buildPromoterDrilldownQuery());
    const list = unwrapList<PromoterVO>(res);
    promoterDrilldownRows.value = list.rows;
    promoterDrilldownTotal.value = list.total;
  } finally {
    promoterDrilldownLoading.value = false;
  }
}

function openIdentityPromoterDrilldown(row: PromoterIdentityPeriod, identityType: IdentityDrilldownType) {
  openPromoterDrilldown({
    title: `${row.label || periodLabel(row.key)}${identityGroupLabelMap[identityType]}推广人列表`,
    query: { identityType },
    useDateRange: false
  });
}

function openMetricCardDrilldown(card: { key: string; label: string }) {
  const baseQuery: PromoterQuery = {
    name: statisticsQuery.name,
    identityType: statisticsQuery.identityType,
    status: statisticsQuery.status
  };
  if (card.key === 'promoter') {
    openPromoterDrilldown({ title: '推广人列表', query: baseQuery });
    return;
  }
  if (card.key === 'enabled' || card.key === 'disabled') {
    openPromoterDrilldown({
      title: `${card.label}列表`,
      query: { ...baseQuery, status: card.key === 'enabled' ? '1' : '0' }
    });
    return;
  }
  const metric = card.key as DrilldownMetric;
  openAttributionDrilldown({
    title: `${card.label}明细`,
    metric,
    promoterKeyword: statisticsQuery.name,
    identityType: statisticsQuery.identityType
  });
}

function openStatisticsRowDrilldown(row: PromoterStatisticsRow, metric: DrilldownMetric) {
  openAttributionDrilldown({
    title: `${row.name || row.phonenumber || '推广人'}-${metricLabelMap[metric]}明细`,
    metric,
    promoterId: row.promoterId,
    identityType: row.identityType,
    promoterKeyword: ''
  });
}

function openStatisticsRowTotalDrilldown(row: PromoterStatisticsRow) {
  if (statisticsSide.value === 'company') {
    openStatisticsRowDrilldown(row, 'company');
    return;
  }
  if (statisticsSide.value === 'jobSeeker') {
    openStatisticsRowDrilldown(row, 'jobSeeker');
    return;
  }
  openAttributionDrilldown({
    title: `${row.name || row.phonenumber || '推广人'}-B/C合计明细`,
    objectType: 'company',
    promoterId: row.promoterId,
    identityType: row.identityType,
    promoterKeyword: '',
    allowSwitch: true
  });
}

function openPromoterAttributionDrilldown(row: PromoterVO, metric: 'company' | 'jobSeeker') {
  openAttributionDrilldown({
    title: `${row.name || row.phonenumber || '推广人'}-${metricLabelMap[metric]}明细`,
    metric,
    promoterId: row.promoterId,
    identityType: row.identityType,
    promoterKeyword: '',
    useCurrentRange: false
  });
}

function openIdentityChartDrilldown(group: PromoterStatisticsGroup) {
  const label = group.label || identityTypeText(group.key);
  if (statisticsSide.value === 'company') {
    openAttributionDrilldown({
      title: `${label}B端企业明细`,
      metric: 'company',
      identityType: group.key,
      promoterKeyword: statisticsQuery.name
    });
    return;
  }
  if (statisticsSide.value === 'jobSeeker') {
    openAttributionDrilldown({
      title: `${label}C端求职者明细`,
      metric: 'jobSeeker',
      identityType: group.key,
      promoterKeyword: statisticsQuery.name
    });
    return;
  }
  openAttributionDrilldown({
    title: `${label}B/C合计明细`,
    objectType: 'company',
    identityType: group.key,
    promoterKeyword: statisticsQuery.name,
    allowSwitch: true
  });
}

function openIdentityPeriodChartDrilldown(row: PromoterIdentityPeriod, identityType: IdentityDrilldownType) {
  if (statisticsSide.value === 'company') {
    openIdentityPeriodDrilldown(row, identityType, 'company');
    return;
  }
  if (statisticsSide.value === 'jobSeeker') {
    openIdentityPeriodDrilldown(row, identityType, 'user');
    return;
  }
  openAttributionDrilldown({
    title: `${row.label || periodLabel(row.key)}${identityGroupLabelMap[identityType]}B/C合计明细`,
    objectType: 'company',
    identityType,
    promoterKeyword: '',
    periodKey: row.key,
    allowSwitch: true,
    useCurrentRange: false
  });
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
    // 企业端概览与总览统计同源，统一由 loadStatistics 加载，避免重复请求
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
  } else if (name === 'sea') {
    // 进入客户管理：左树为懒加载异步树(展开根才拉员工，且有缓存)，此处只加载右表
    loadCustomerList();
  }
}

function handleDetailTypeChange() {
  loadAttributionDetails();
}

// 客户管理状态筛选项：B端按企业生命周期，C端按求职漏斗，与后端归因明细/公海接口的 status 口径一致
const seaStatusOptions = computed<{ label: string; value: string }[]>(() =>
  seaObjectType.value === 'company'
    ? [
        { label: '待审核', value: '0' },
        { label: '已认证', value: '1' },
        { label: '已禁用', value: '2' },
        { label: '资料完整', value: 'completed' },
        { label: '资料不全', value: 'incomplete' },
        { label: '已发岗', value: 'published' }
      ]
    : [
        { label: '已授权手机号', value: 'authorized' },
        { label: '已完善简历', value: 'resume' },
        { label: '已投递', value: 'apply' },
        { label: '未填简历', value: 'unresume' },
        { label: '未投递', value: 'unapply' }
      ]
);

// 客户管理表格标题：随对象类型 + 归因状态变化
const customerTableTitle = computed(() => {
  const obj = seaObjectType.value === 'company' ? '企业（B端）' : '面试者（C端）';
  return `${customerScope.value === 'sea' ? '公海' : '已绑推广码'}${obj}`;
});

// 客户管理列表加载：已绑(bound)走归因明细接口(含推广人)，公海(sea)走未归因接口
async function loadCustomerList() {
  seaLoading.value = true;
  try {
    const [beginDate, endDate] = seaDateRange.value;
    const isCompany = seaObjectType.value === 'company';
    const isSea = customerScope.value === 'sea';
    const api = isSea ? (isCompany ? listSeaCustomerCompany : listSeaCustomerUser) : isCompany ? listPromoterCompanyDetail : listPromoterUserDetail;
    const res = await api({
      ...seaQuery,
      keyword: seaQuery.keyword || undefined,
      status: seaQuery.status || undefined,
      // 推广人关键字/树选中员工仅在「已绑」口径有意义；公海无推广人，置空避免误传
      promoterKeyword: isSea ? undefined : seaQuery.promoterKeyword || undefined,
      promoterId: isSea ? undefined : seaQuery.promoterId || undefined,
      beginTime: beginDate ? `${beginDate} 00:00:00` : undefined,
      endTime: endDate ? `${endDate} 23:59:59` : undefined
    });
    const list = unwrapList<PromotionAttributionDetailVO>(res);
    seaRows.value = list.rows;
    seaTotal.value = list.total;
  } finally {
    seaLoading.value = false;
  }
}

function handleSeaQuery() {
  seaQuery.pageNum = 1;
  loadCustomerList();
}

function resetSeaQuery() {
  seaQuery.keyword = '';
  seaQuery.status = '';
  seaQuery.promoterKeyword = '';
  seaDateRange.value = [];
  // 重置同时把左树选中回到根节点(壹聘=全部)，清除员工过滤
  seaQuery.promoterId = undefined;
  selectedPromoterNodeId.value = 'ROOT';
  promoterTreeRef.value?.setCurrentKey?.('ROOT');
  seaQuery.pageNum = 1;
  loadCustomerList();
}

// 切换 B/C 对象类型：状态口径不同需清空状态筛选并回到首页重新查询
function handleSeaTypeChange() {
  seaQuery.status = '';
  seaQuery.pageNum = 1;
  seaTableRef.value?.clearSelection?.(); // 切换对象类型，清空已勾选
  seaSelection.value = [];
  loadCustomerList();
}

// 切换 已绑/公海 归因状态：公海无推广人筛选与左树，清空员工过滤后重查；进入已绑时确保树已加载
function handleScopeChange() {
  seaQuery.promoterKeyword = '';
  seaQuery.promoterId = undefined;
  selectedPromoterNodeId.value = 'ROOT';
  seaQuery.pageNum = 1;
  seaTableRef.value?.clearSelection?.(); // 切换已绑/公海，清空已勾选
  seaSelection.value = [];
  // 左树为懒加载+缓存，切回已绑时会自动复用缓存，无需主动重拉
  loadCustomerList();
}

// 客户管理分配/调整推广人：复用「调整推广来源」弹窗，提交后回刷当前客户列表
function openCustomerAdjust(row: PromotionAttributionDetailVO) {
  openAdjustAttribution(row, 'customer');
}

function handleSeaSelectionChange(rows: PromotionAttributionDetailVO[]) {
  seaSelection.value = rows;
}

// 批量移动公海：对选中已绑客户逐条调用归因调整(promoterId 置空=解除归因→落入公海)。
// 无批量后端接口，前端用 Promise.allSettled 并发；操作前二次确认，完成后汇报成功/失败并刷新列表与左树统计。
async function handleBatchMoveSea() {
  const rows = seaSelection.value.filter((r) => r.objectId != null);
  if (rows.length === 0) {
    ElMessage.warning('请先勾选要移动的客户');
    return;
  }
  const objName = seaObjectType.value === 'company' ? '企业' : '面试者';
  try {
    await ElMessageBox.confirm(
      `确认将选中的 ${rows.length} 个${objName}移动到公海？移动后将解除其推广归因（清除来源推广人与推广码、归因时间），可在「公海客户」中重新分配。`,
      '批量移动公海',
      { type: 'warning', confirmButtonText: '确认移动', cancelButtonText: '取消' }
    );
  } catch {
    return; // 用户取消
  }
  seaLoading.value = true;
  try {
    const objectType = seaObjectType.value; // 'company' | 'user'
    const results = await Promise.allSettled(
      rows.map((r) => adjustPromoterAttribution({ objectType, objectId: r.objectId as string | number, promoterId: undefined }))
    );
    const ok = results.filter((r) => r.status === 'fulfilled').length;
    const fail = results.length - ok;
    if (fail === 0) {
      ElMessage.success(`已将 ${ok} 个${objName}移动到公海`);
    } else {
      ElMessage.warning(`移动完成：成功 ${ok} 个，失败 ${fail} 个`);
    }
    seaTableRef.value?.clearSelection?.();
    seaSelection.value = [];
    loadCustomerList();
    loadPromoterTree(); // 归因变化，刷新左树绑定统计
  } finally {
    seaLoading.value = false;
  }
}

// 已绑推广码客户导出：B端走 company-detail/export、C端走 user-detail/export，沿用当前关键字/推广人/状态/时间筛选
function handleCustomerExport() {
  const [beginDate, endDate] = seaDateRange.value;
  const isCompany = seaObjectType.value === 'company';
  const url = isCompany ? '/admin/recruitment/promoter/company-detail/export' : '/admin/recruitment/promoter/user-detail/export';
  const fileName = `${customerTableTitle.value}_${new Date().getTime()}.xlsx`;
  download(
    url,
    {
      keyword: seaQuery.keyword || undefined,
      status: seaQuery.status || undefined,
      promoterKeyword: seaQuery.promoterKeyword || undefined,
      beginTime: beginDate ? `${beginDate} 00:00:00` : undefined,
      endTime: endDate ? `${endDate} 23:59:59` : undefined
    },
    fileName
  );
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
    const normalizedOverview = {
      ...(res?.data?.overview || {}),
      periodStats: normalizeOverviewPeriodStats(res?.data?.overview?.periodStats)
    };
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
      ...(res?.data || {}),
      overview: normalizedOverview
    });
    await nextTick();
    scheduleActiveTabCharts();
  } finally {
    statisticsLoading.value = false;
  }
}

// 僅刷新企業端概覽的後端接口資料，避免混用 /promoter/statistics 的統計結果
async function loadCompanyOverviewStatistics() {
  // 「刷新企业端概览」按钮：企业端数据已并入 /promoter/statistics，直接复用 loadStatistics 刷新同源数据。
  if (!isAdminUser.value) return;
  companyOverviewLoading.value = true;
  try {
    await loadStatistics();
  } finally {
    companyOverviewLoading.value = false;
  }
}

async function loadUserOverviewStatistics() {
  // 「刷新用户端概览」按钮：用户端数据同样并入 /promoter/statistics（overview.periodStats），复用 loadStatistics 刷新同源数据。
  if (!isAdminUser.value) return;
  userOverviewLoading.value = true;
  try {
    await loadStatistics();
  } finally {
    userOverviewLoading.value = false;
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
    detailObjectType.value === 'company' ? '/admin/recruitment/promoter/company-detail/export' : '/admin/recruitment/promoter/user-detail/export';
  const fileName = `${detailObjectTypeName.value}推广来源明细_${new Date().getTime()}.xlsx`;
  download(url, buildAttributionDetailQuery(), fileName);
}

// 钻取明细弹窗内查询：重置到第一页后按当前关键字/推广人关键字重新加载
function handleDrilldownSearch() {
  drilldownQuery.pageNum = 1;
  loadDrilldownDetails();
}

// 钻取明细导出：复用归因明细导出接口，沿用当前钻取的筛选条件（含指标 status 与时间区间）
function handleDrilldownExport() {
  const url =
    drilldownObjectType.value === 'company' ? '/admin/recruitment/promoter/company-detail/export' : '/admin/recruitment/promoter/user-detail/export';
  const fileName = `${drilldownTitle.value || drilldownObjectTypeName.value + '明细'}_${new Date().getTime()}.xlsx`;
  download(url, buildDrilldownQuery(), fileName);
}

// 钻取明细——查看企业 / 推广人详情（只读弹窗）。行数据已含主要信息，再按需用接口补全。
const detailInfoVisible = ref(false);
const detailInfoLoading = ref(false);
const detailInfoTitle = ref('');
const detailInfoRows = ref<Array<{ label: string; value: string }>>([]);

async function openCompanyInfo(row: PromotionAttributionDetailVO) {
  if (!row.objectId) return;
  detailInfoTitle.value = `企业详情 - ${row.objectName || ''}`;
  detailInfoRows.value = [];
  detailInfoVisible.value = true;
  detailInfoLoading.value = true;
  try {
    const res: any = await getCompany(Number(row.objectId));
    const c = res?.data || {};
    detailInfoRows.value = [
      { label: '企业名称', value: c.companyName || row.objectName || '-' },
      { label: '企业编号', value: c.companyNo || '-' },
      { label: '联系人', value: c.contactPerson || row.contactPerson || '-' },
      { label: '联系电话', value: c.contactPhone || c.adminPhone || row.phone || '-' },
      { label: '状态', value: companyStatusMeta(row.status).label },
      { label: '岗位数', value: String(row.jobCount ?? '-') },
      { label: '来源推广人', value: `${row.promoterName || '-'}（${row.promoterPhone || '-'}）` },
      { label: '首次进入', value: row.promotedAt || row.createTime || '-' }
    ];
  } finally {
    detailInfoLoading.value = false;
  }
}

async function openPromoterInfo(row: PromotionAttributionDetailVO) {
  if (!row.promoterId) {
    ElMessage.info('该记录暂无关联推广人');
    return;
  }
  detailInfoTitle.value = `推广人详情 - ${row.promoterName || ''}`;
  detailInfoRows.value = [];
  detailInfoVisible.value = true;
  detailInfoLoading.value = true;
  try {
    const res: any = await getPromoter(Number(row.promoterId));
    const p = res?.data || {};
    detailInfoRows.value = [
      { label: '姓名/昵称', value: p.name || row.promoterName || '-' },
      { label: '手机号', value: p.phonenumber || row.promoterPhone || '-' },
      { label: '身份', value: row.identityTypeName || identityTypeText(p.identityType) },
      { label: '岗位/角色', value: p.roleName || row.roleName || '-' },
      { label: '推广码', value: p.promotionCode || '-' },
      { label: '维护企业数', value: String(p.companyCount ?? '-') },
      { label: '维护用户数', value: String(p.jobSeekerCount ?? '-') },
      { label: '账号状态', value: p.status === '1' ? '启用' : '禁用' }
    ];
  } finally {
    detailInfoLoading.value = false;
  }
}

function handleStatisticsExport() {
  download('/admin/recruitment/promoter/statistics/export', buildStatisticsQuery(), `推广人汇总统计_${new Date().getTime()}.xlsx`);
}

function handlePeriodStatisticsExport() {
  download('/admin/recruitment/promoter/period-statistics/export', buildStatisticsQuery(), `推广周期统计_${new Date().getTime()}.xlsx`);
}

// 弹窗内按身份本地过滤推广人候选：'' 全部 / '0' 内部 / 'channel' 外部(渠道1+合伙人2)
const adjustPromoterCandidates = computed<PromoterVO[]>(() => {
  const identity = adjustPromoterIdentity.value;
  if (!identity) return allPromoters.value;
  if (identity === 'channel') return allPromoters.value.filter((p) => p.identityType === '1' || p.identityType === '2');
  return allPromoters.value.filter((p) => p.identityType === identity);
});

// 一次性拉取启用中的推广人作为候选（量不大，弹窗内本地过滤/搜索，避免每次远程请求）
async function ensurePromotersLoaded(force = false) {
  if (!force && allPromoters.value.length > 0) return;
  promotersLoading.value = true;
  try {
    const res = await listPromoter({ pageNum: 1, pageSize: 1000, status: '1' });
    allPromoters.value = unwrapList<PromoterVO>(res).rows;
  } finally {
    promotersLoading.value = false;
  }
}

function openAdjustAttribution(row: PromotionAttributionDetailVO, context: 'detail' | 'customer' = 'detail') {
  if (!row.objectId || !row.objectType) {
    ElMessage.warning('当前记录缺少对象编号，无法调整来源');
    return;
  }
  adjustContext.value = context;
  adjustForm.objectType = row.objectType;
  adjustForm.objectId = row.objectId;
  adjustForm.objectName = `${row.objectTypeName || detailObjectTypeName.value}：${row.objectName || row.objectId}`;
  adjustForm.promoterId = row.promoterId || undefined;
  adjustPromoterIdentity.value = '';
  adjustDialogVisible.value = true;
  ensurePromotersLoaded();
}

// 客户管理-公海口径下分配推广人语义是「指派」而非「清空」，必须选择推广人
const adjustRequirePromoter = computed(() => adjustContext.value === 'customer' && customerScope.value === 'sea');

async function submitAdjustAttribution() {
  if (!adjustForm.objectId || !adjustForm.objectType) {
    ElMessage.warning('调整对象不能为空');
    return;
  }
  if (adjustRequirePromoter.value && !adjustForm.promoterId) {
    ElMessage.warning('请选择要分配的推广人');
    return;
  }
  // 二次确认：是否绑定到所选推广人（未选则为清空归因）
  const picked = allPromoters.value.find((p) => String(p.promoterId) === String(adjustForm.promoterId));
  const confirmText = adjustForm.promoterId
    ? `确认将「${adjustForm.objectName}」绑定到推广人「${picked?.name || adjustForm.promoterId}（${picked?.phonenumber || '-'}）」？`
    : `确认清空「${adjustForm.objectName}」的推广归因，转为自然流量？`;
  try {
    await ElMessageBox.confirm(confirmText, adjustForm.promoterId ? '绑定推广人' : '清空归因', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    });
  } catch {
    return; // 用户取消
  }
  adjustSubmitting.value = true;
  try {
    await adjustPromoterAttribution({
      objectType: adjustForm.objectType,
      objectId: adjustForm.objectId,
      promoterId: adjustForm.promoterId || undefined
    });
    ElMessage.success(adjustForm.promoterId ? '已绑定推广人' : '已清空推广归因');
    adjustDialogVisible.value = false;
    if (adjustContext.value === 'customer') {
      // 分配/调整后归因状态可能变化（公海←→已绑），回刷当前客户列表
      await loadCustomerList();
    } else {
      await loadAttributionDetails();
    }
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

function handleImport() {
  upload.title = '推广人员导入';
  upload.open = true;
}

function importTemplate() {
  download('/admin/recruitment/promoter/importTemplate', {}, `promoter_template_${new Date().getTime()}.xlsx`);
}

function handleFileUploadProgress() {
  upload.isUploading = true;
}

function handleFileSuccess(response: any, file: UploadFile) {
  upload.open = false;
  upload.isUploading = false;
  uploadRef.value?.handleRemove(file);
  ElMessageBox.alert(
    "<div style='overflow: auto;overflow-x: hidden;max-height: 70vh;padding: 10px 20px 0;'>" + (response?.msg || '导入完成') + '</div>',
    '导入结果',
    {
      dangerouslyUseHTMLString: true
    }
  );
  loadData();
  loadStatistics();
}

function submitFileForm() {
  uploadRef.value?.submit();
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
  trendChart.off('click');
  trendChart.on('click', (params: any) => {
    const group = groups[params.dataIndex];
    if (group) {
      openTimeTrendDrilldown(group);
    }
  });
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
  sideChart.off('click');
  sideChart.on('click', (params: any) => {
    if (params.name === 'B端企业') {
      openAttributionDrilldown({
        title: 'B端企业明细',
        metric: 'company',
        promoterKeyword: statisticsQuery.name,
        identityType: statisticsQuery.identityType
      });
    } else if (params.name === 'C端求职者') {
      openAttributionDrilldown({
        title: 'C端求职者明细',
        metric: 'jobSeeker',
        promoterKeyword: statisticsQuery.name,
        identityType: statisticsQuery.identityType
      });
    }
  });
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
  promoterChart.off('click');
  promoterChart.on('click', (params: any) => {
    const row = rows[params.dataIndex];
    if (row) {
      openStatisticsRowTotalDrilldown(row);
    }
  });
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
  identityChart.off('click');
  identityChart.on('click', (params: any) => {
    const group = groups[params.dataIndex];
    if (group) {
      openIdentityChartDrilldown(group);
    }
  });
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
  identityPeriodChart.off('click');
  identityPeriodChart.on('click', (params: any) => {
    const row = rows[params.dataIndex];
    if (!row || (params.seriesName !== '内部人员' && params.seriesName !== '渠道')) return;
    openIdentityPeriodChartDrilldown(row, params.seriesName === '内部人员' ? 'internal' : 'channel');
  });
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
  identityLineChart.off('click');
  identityLineChart.on('click', (params: any) => {
    const row = rows[params.dataIndex];
    if (!row || (params.seriesName !== '内部人员' && params.seriesName !== '渠道')) return;
    openIdentityPeriodChartDrilldown(row, params.seriesName === '内部人员' ? 'internal' : 'channel');
  });
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
  statusChart.off('click');
  statusChart.on('click', (params: any) => {
    const group = groups[params.dataIndex];
    if (!group) return;
    openPromoterDrilldown({
      title: `${group.label || statusText(group.key)}推广人列表`,
      query: {
        name: statisticsQuery.name,
        identityType: statisticsQuery.identityType,
        status: group.key || ''
      }
    });
  });
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
  // loadStatistics 同时承载总览统计与企业端概览（同源数据），无需为企业端概览单独加载
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

/* 客户管理-已绑：左树右表布局 */
.customer-layout.has-tree {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}
.customer-layout .customer-main {
  flex: 1;
  min-width: 0; /* 防止表格撑破 flex 容器 */
}
.promoter-tree-card {
  width: 280px;
  flex-shrink: 0;
  margin-bottom: 16px;
}
.promoter-tree-card .tree-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
}
.promoter-tree-card .tree-search {
  margin-bottom: 8px;
}
.promoter-tree {
  max-height: 560px;
  overflow: auto;
}
/* 树节点：上行姓名、下行企业/求职者统计 */
.promoter-tree-node {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
  padding: 2px 0;
}
.promoter-tree-node .ptn-label {
  font-size: 13px;
  color: var(--el-text-color-primary);
}
.promoter-tree-node .ptn-stat {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
/* 让自定义节点占满整行，统计右对齐时不溢出 */
.promoter-tree :deep(.el-tree-node__content) {
  height: auto;
  align-items: flex-start;
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

.is-clickable {
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.is-clickable:hover,
.is-clickable:focus-visible {
  border-color: var(--el-color-primary-light-5);
  box-shadow: var(--el-box-shadow-light);
  transform: translateY(-1px);
  outline: none;
}

.stat-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  border: 0;
  background: transparent;
  color: var(--el-color-primary);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.stat-link:hover,
.stat-link:focus-visible {
  color: var(--el-color-primary-dark-2);
  text-decoration: underline;
  outline: none;
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

.dialog-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
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
