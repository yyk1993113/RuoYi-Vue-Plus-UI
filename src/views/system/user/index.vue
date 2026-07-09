<template>
  <div class="p-2">
    <el-row>
      <el-col :span="24">
        <el-card shadow="hover" class="mb-[10px]">
          <el-radio-group v-model="activePersonnelSegment" @change="handlePersonnelSegmentChange">
            <el-radio-button v-for="segment in personnelSegments" :key="segment.value" :value="segment.value">
              {{ segment.label }}
            </el-radio-button>
          </el-radio-group>
        </el-card>
        <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
          <div v-show="showSearch" class="mb-[10px]">
            <el-card shadow="hover">
              <el-form v-if="activePersonnelSegment === 'internal'" ref="queryFormRef" :model="internalQuery" :inline="true">
                <el-form-item label="用户名称" prop="userName">
                  <el-input v-model="internalQuery.userName" placeholder="请输入用户名称" clearable @keyup.enter="handleQuery" />
                </el-form-item>
                <el-form-item label="用户昵称" prop="nickName">
                  <el-input v-model="internalQuery.nickName" placeholder="请输入用户昵称" clearable @keyup.enter="handleQuery" />
                </el-form-item>
                <el-form-item label="手机号码" prop="phonenumber">
                  <el-input v-model="internalQuery.phonenumber" placeholder="请输入手机号码" clearable @keyup.enter="handleQuery" />
                </el-form-item>
                <el-form-item label="账号状态" prop="status">
                  <el-select v-model="internalQuery.status" placeholder="全部" clearable>
                    <el-option v-for="dict in sys_normal_disable" :key="dict.value" :label="dict.label" :value="dict.value" />
                  </el-select>
                </el-form-item>
                <el-form-item label="创建时间" style="width: 308px">
                  <el-date-picker
                    v-model="dateRange"
                    value-format="YYYY-MM-DD HH:mm:ss"
                    type="daterange"
                    range-separator="-"
                    start-placeholder="开始日期"
                    end-placeholder="结束日期"
                    :default-time="[new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)]"
                  ></el-date-picker>
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
                  <el-button icon="Refresh" @click="resetQuery">重置</el-button>
                </el-form-item>
              </el-form>
              <el-form v-else-if="activePersonnelSegment === 'business'" ref="queryFormRef" :model="businessQuery" :inline="true">
                <el-form-item label="企业名称" prop="companyName">
                  <el-input v-model="businessQuery.companyName" placeholder="请输入企业名称" clearable @keyup.enter="handleQuery" />
                </el-form-item>
                <el-form-item label="HR姓名" prop="contactPerson">
                  <el-input v-model="businessQuery.contactPerson" placeholder="请输入联系人" clearable @keyup.enter="handleQuery" />
                </el-form-item>
                <el-form-item label="HR手机号" prop="contactPhone">
                  <el-input v-model="businessQuery.contactPhone" placeholder="请输入手机号" clearable @keyup.enter="handleQuery" />
                </el-form-item>
                <el-form-item label="企业状态" prop="status">
                  <el-select v-model="businessQuery.status" placeholder="全部" clearable>
                    <el-option label="待审核" value="0" />
                    <el-option label="已认证" value="1" />
                    <el-option label="已禁用" value="2" />
                    <el-option label="草稿" value="4" />
                  </el-select>
                </el-form-item>
                <el-form-item label="禁言状态" prop="isSilenced">
                  <el-select v-model="businessQuery.isSilenced" placeholder="全部" clearable>
                    <el-option label="正常" value="0" />
                    <el-option label="已禁言" value="1" />
                  </el-select>
                </el-form-item>
                <el-form-item label="客户分层" prop="customerLayer">
                  <el-select v-model="businessQuery.customerLayer" placeholder="全部" clearable style="width: 150px">
                    <el-option label="高价值客户" value="highValue" />
                    <el-option label="沉睡流失预警" value="sleeping" />
                    <el-option label="新入驻待激活" value="newInactive" />
                    <el-option label="风险客户" value="risk" />
                    <el-option label="静态零产出" value="zeroOutput" />
                  </el-select>
                </el-form-item>
                <el-form-item label="岗位数量">
                  <el-input-number v-model="businessQuery.jobCountMin" :min="0" :controls="false" placeholder="最小" style="width: 92px" />
                  <span class="mx-1">-</span>
                  <el-input-number v-model="businessQuery.jobCountMax" :min="0" :controls="false" placeholder="最大" style="width: 92px" />
                </el-form-item>
                <el-form-item label="投递区间">
                  <el-input-number v-model="businessQuery.applyCountMin" :min="0" :controls="false" placeholder="最小" style="width: 92px" />
                  <span class="mx-1">-</span>
                  <el-input-number v-model="businessQuery.applyCountMax" :min="0" :controls="false" placeholder="最大" style="width: 92px" />
                </el-form-item>
                <el-form-item label="付费状态" prop="paidStatus">
                  <el-select v-model="businessQuery.paidStatus" placeholder="全部" clearable style="width: 130px">
                    <el-option label="已付费" value="paid" />
                    <el-option label="未付费" value="unpaid" />
                    <el-option label="已欠费" value="arrears" />
                  </el-select>
                </el-form-item>
                <el-form-item label="近7天活跃" prop="active7d">
                  <el-select v-model="businessQuery.active7d" placeholder="全部" clearable style="width: 130px">
                    <el-option label="高活跃" value="high" />
                    <el-option label="低活跃" value="low" />
                    <el-option label="无登录" value="none" />
                  </el-select>
                </el-form-item>
                <el-form-item label="入驻时间" style="width: 308px">
                  <el-date-picker
                    v-model="dateRange"
                    value-format="YYYY-MM-DD HH:mm:ss"
                    type="daterange"
                    range-separator="-"
                    start-placeholder="开始日期"
                    end-placeholder="结束日期"
                    :default-time="[new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)]"
                  ></el-date-picker>
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
                  <el-button icon="Refresh" @click="resetQuery">重置</el-button>
                </el-form-item>
              </el-form>
              <el-form v-else ref="queryFormRef" :model="jobSeekerQuery" :inline="true">
                <el-form-item label="用户昵称" prop="userName">
                  <el-input v-model="jobSeekerQuery.userName" placeholder="昵称 / 账号" clearable @keyup.enter="handleQuery" />
                </el-form-item>
                <el-form-item label="手机号" prop="phonenumber">
                  <el-input v-model="jobSeekerQuery.phonenumber" placeholder="请输入手机号" clearable @keyup.enter="handleQuery" />
                </el-form-item>
                <el-form-item label="禁言状态" prop="isRecruitmentSilenced">
                  <el-select v-model="jobSeekerQuery.isRecruitmentSilenced" placeholder="全部" clearable>
                    <el-option label="正常" value="0" />
                    <el-option label="已禁言" value="1" />
                  </el-select>
                </el-form-item>
                <el-form-item label="业务状态" prop="applyFilter">
                  <el-select v-model="jobSeekerQuery.applyFilter" placeholder="全部" clearable>
                    <el-option label="有投递记录" value="applied" />
                    <el-option label="待处理投递" value="pending" />
                  </el-select>
                </el-form-item>
                <el-form-item label="投递区间">
                  <el-input-number v-model="jobSeekerQuery.applyCountMin" :min="0" :controls="false" placeholder="最小" style="width: 92px" />
                  <span class="mx-1">-</span>
                  <el-input-number v-model="jobSeekerQuery.applyCountMax" :min="0" :controls="false" placeholder="最大" style="width: 92px" />
                </el-form-item>
                <el-form-item label="面试区间">
                  <el-input-number v-model="jobSeekerQuery.interviewCountMin" :min="0" :controls="false" placeholder="最小" style="width: 92px" />
                  <span class="mx-1">-</span>
                  <el-input-number v-model="jobSeekerQuery.interviewCountMax" :min="0" :controls="false" placeholder="最大" style="width: 92px" />
                </el-form-item>
                <el-form-item label="用户分层" prop="userLayer">
                  <el-select v-model="jobSeekerQuery.userLayer" placeholder="全部" clearable style="width: 150px">
                    <el-option label="高意向" value="highIntent" />
                    <el-option label="沉睡" value="sleeping" />
                    <el-option label="新人" value="newcomer" />
                    <el-option label="风险用户" value="risk" />
                  </el-select>
                </el-form-item>
                <el-form-item label="活跃状态" prop="activeStatus">
                  <el-select v-model="jobSeekerQuery.activeStatus" placeholder="全部" clearable style="width: 150px">
                    <el-option label="近7天活跃" value="active7d" />
                    <el-option label="30天流失" value="lost30d" />
                  </el-select>
                </el-form-item>
                <el-form-item label="简历状态" prop="resumeStatus">
                  <el-select v-model="jobSeekerQuery.resumeStatus" placeholder="全部" clearable style="width: 150px">
                    <el-option label="空白简历" value="blank" />
                    <el-option label="完整简历" value="full" />
                  </el-select>
                </el-form-item>
                <el-form-item label="付费状态" prop="paidStatus">
                  <el-select v-model="jobSeekerQuery.paidStatus" placeholder="全部" clearable style="width: 130px">
                    <el-option label="会员" value="member" />
                    <el-option label="非会员" value="nonMember" />
                  </el-select>
                </el-form-item>
                <el-form-item label="注册渠道" prop="registerChannel">
                  <el-input v-model="jobSeekerQuery.registerChannel" placeholder="请输入渠道" clearable @keyup.enter="handleQuery" />
                </el-form-item>
                <el-form-item label="归属推广员" prop="promoterKeyword">
                  <el-input v-model="jobSeekerQuery.promoterKeyword" placeholder="推广员姓名/手机号" clearable @keyup.enter="handleQuery" />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
                  <el-button icon="Refresh" @click="resetQuery">重置</el-button>
                </el-form-item>
              </el-form>
            </el-card>
          </div>
        </transition>

        <div class="user-list-layout" :class="{ 'is-business': activePersonnelSegment === 'business' }">
          <el-card v-if="activePersonnelSegment === 'business'" shadow="hover" class="business-tree-card">
            <template #header>
              <div class="flex items-center justify-between">
                <span>企业树</span>
                <el-button link type="primary" @click="clearBusinessTreeFilter">全部</el-button>
              </div>
            </template>
            <el-input v-model="businessTreeKeyword" placeholder="搜索企业" prefix-icon="Search" clearable class="mb-2" />
            <el-tree
              ref="businessTreeRef"
              node-key="id"
              :data="businessTreeOptions"
              :props="{ label: 'label', children: 'children' } as any"
              :filter-node-method="filterBusinessTreeNode"
              default-expand-all
              highlight-current
              @node-click="handleBusinessTreeClick"
            />
          </el-card>

          <el-card shadow="hover" class="user-table-card">
            <template #header>
              <el-row :gutter="10">
                <el-col v-if="isInternalSegment" :span="1.5">
                  <el-button v-has-permi="['system:user:add']" type="primary" plain icon="Plus" @click="handleAdd()">新增</el-button>
                </el-col>
                <el-col v-if="isInternalSegment" :span="1.5">
                  <el-button v-has-permi="['system:user:edit']" type="success" plain :disabled="single" icon="Edit" @click="handleUpdate()">
                    修改
                  </el-button>
                </el-col>
                <el-col v-if="isInternalSegment" :span="1.5">
                  <el-button v-has-permi="['system:user:remove']" type="danger" plain :disabled="multiple" icon="Delete" @click="handleDelete()">
                    删除
                  </el-button>
                </el-col>
                <el-col v-if="isInternalSegment" :span="1.5">
                  <el-dropdown class="mt-[1px]">
                    <el-button plain type="info">
                      更多
                      <el-icon class="el-icon--right"><arrow-down /></el-icon
                    ></el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item icon="Download" @click="importTemplate">下载模板</el-dropdown-item>
                        <!-- 注意 由于el-dropdown-item标签是延迟加载的 所以v-has-permi自定义标签不生效 需要使用v-if调用方法执行 -->
                        <el-dropdown-item v-if="checkPermi(['system:user:import'])" icon="Top" @click="handleImport">导入数据</el-dropdown-item>
                        <el-dropdown-item v-if="checkPermi(['system:user:export'])" icon="Download" @click="handleExport">导出数据</el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </el-col>
                <right-toolbar v-model:show-search="showSearch" :columns="columns" :search="true" @query-table="getList"></right-toolbar>
              </el-row>
            </template>

            <div v-if="activePersonnelSegment === 'business'" class="business-summary mb-[10px]">
              <el-tooltip content="当前筛选结果中，全部企业岗位数总和 ÷ 当前列表企业数，保留 1 位小数。" placement="top">
                <el-tag type="primary" effect="plain">平均岗位 {{ businessSummary.avgJobs }}</el-tag>
              </el-tooltip>
              <el-tooltip content="当前筛选结果中，全部企业投递量总和 ÷ 当前列表企业数，保留 1 位小数。" placement="top">
                <el-tag type="success" effect="plain">平均投递 {{ businessSummary.avgApplies }}</el-tag>
              </el-tooltip>
              <el-tooltip content="当前筛选结果中，满足“投递≥20、持续付费、近7天登录≥3天”的企业数量。" placement="top">
                <el-tag type="success" effect="plain">高价值 {{ businessSummary.highValueCount }}</el-tag>
              </el-tooltip>
              <el-tooltip content="当前筛选结果中，满足“30天0新增岗位、0登录、0投递，且入驻超过30天”的企业数量。" placement="top">
                <el-tag type="warning" effect="plain">沉睡 {{ businessSummary.sleepingCount }}</el-tag>
              </el-tooltip>
            </div>

            <el-table v-loading="loading" border :data="userList" @selection-change="handleSelectionChange">
              <el-table-column v-if="isInternalSegment" type="selection" width="50" align="center" />
              <el-table-column v-if="columns[0].visible" key="userId" label="用户编号" align="center" prop="userId" />
              <el-table-column
                v-if="columns[1].visible"
                key="userName"
                label="用户名称"
                align="center"
                prop="userName"
                :show-overflow-tooltip="true"
              />
              <el-table-column
                v-if="columns[2].visible"
                key="nickName"
                label="用户昵称"
                align="center"
                prop="nickName"
                min-width="150"
                :show-overflow-tooltip="true"
              >
                <template #default="scope">
                  <span>{{ scope.row.nickName || '-' }}</span>
                  <el-tag v-if="scope.row.sourceSegment === 'business'" class="ml-1" size="small" type="primary" effect="plain">
                    {{ scope.row.businessStats?.memberRoleName || '企业成员' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column
                v-if="columns[3].visible"
                key="deptName"
                label="业务归属/统计"
                align="center"
                prop="deptName"
                min-width="220"
                :show-overflow-tooltip="true"
              >
                <template #default="scope">
                  <el-popover v-if="scope.row.sourceSegment === 'business'" placement="right" width="520" trigger="hover">
                    <template #reference>
                      <div class="business-stat-cell">
                        <el-button link type="primary" class="stat-link" @click.stop="openBusinessJobs(scope.row)">
                          岗位 {{ scope.row.businessStats?.jobCount || 0 }}
                        </el-button>
                        <span>/</span>
                        <el-button link type="primary" class="stat-link" @click.stop="openBusinessApplies(scope.row)">
                          投递 {{ scope.row.businessStats?.applyCount || 0 }}
                        </el-button>
                        <el-tag size="small" :type="customerLayerMeta(scope.row).type">{{ customerLayerMeta(scope.row).label }}</el-tag>
                      </div>
                    </template>
                    <div class="business-popover">
                      <div class="business-popover-title">{{ scope.row.userName || '-' }}</div>
                      <el-descriptions :column="2" size="small" border>
                        <el-descriptions-item label="有效在岗岗位">
                          <el-button link type="primary" @click="openBusinessJobs(scope.row, '1')">{{ metricValue(scope.row, 'activeJobCount') }}</el-button>
                        </el-descriptions-item>
                        <el-descriptions-item label="历史总发布">{{
                          metricValue(scope.row, 'historyJobCount', scope.row.businessStats?.jobCount)
                        }}</el-descriptions-item>
                        <el-descriptions-item label="下架岗位">
                          <el-button link type="primary" @click="openBusinessJobs(scope.row, '2')">{{ metricValue(scope.row, 'offlineJobCount') }}</el-button>
                        </el-descriptions-item>
                        <el-descriptions-item label="总投递量">
                          <el-button link type="primary" @click="openBusinessApplies(scope.row)">{{
                            metricValue(scope.row, 'applyCount', scope.row.businessStats?.applyCount)
                          }}</el-button>
                        </el-descriptions-item>
                        <el-descriptions-item label="有效简历投递">
                          <el-button link type="primary" @click="openBusinessApplies(scope.row)">{{ metricValue(scope.row, 'validApplyCount') }}</el-button>
                        </el-descriptions-item>
                        <el-descriptions-item label="简历下载">{{ metricValue(scope.row, 'resumeDownloadCount') }}</el-descriptions-item>
                        <el-descriptions-item label="近7天登录天数">{{ metricValue(scope.row, 'hrLoginDays7d') }}</el-descriptions-item>
                        <el-descriptions-item label="上次登录">{{ metricValue(scope.row, 'lastLoginTime') }}</el-descriptions-item>
                        <el-descriptions-item label="30天沟通消息">{{ metricValue(scope.row, 'messageCount30d') }}</el-descriptions-item>
                        <el-descriptions-item label="当前套餐">{{ metricValue(scope.row, 'packageName') }}</el-descriptions-item>
                        <el-descriptions-item label="套餐到期">{{ metricValue(scope.row, 'packageExpireTime') }}</el-descriptions-item>
                        <el-descriptions-item label="累计充值">{{ metricValue(scope.row, 'totalRechargeAmount') }}</el-descriptions-item>
                        <el-descriptions-item label="剩余招聘点">{{ metricValue(scope.row, 'remainRecruitPoints') }}</el-descriptions-item>
                        <el-descriptions-item label="邀约面试">{{ metricValue(scope.row, 'interviewInviteCount') }}</el-descriptions-item>
                        <el-descriptions-item label="成功入职">{{ metricValue(scope.row, 'hiredCount') }}</el-descriptions-item>
                        <el-descriptions-item label="简历邀约率">{{ metricValue(scope.row, 'resumeInviteRate') }}</el-descriptions-item>
                        <el-descriptions-item label="风险标签">{{ riskText(scope.row) }}</el-descriptions-item>
                      </el-descriptions>
                      <div class="business-actions">
                        <el-button link type="primary" @click="openBusinessDashboard(scope.row)">查看数据看板</el-button>
                        <el-button link type="warning" @click="sendBusinessReminder(scope.row)">发送运营提醒</el-button>
                      </div>
                    </div>
                  </el-popover>
                  <el-popover v-else-if="scope.row.sourceSegment === 'jobSeeker'" placement="right" width="560" trigger="hover">
                    <template #reference>
                      <div class="job-seeker-stat-cell">
                        <el-button link type="primary" class="stat-link" @click.stop="openJobSeekerApplies(scope.row)">
                          投递 {{ scope.row.jobSeekerStats?.totalApplies || 0 }}
                        </el-button>
                        <span>|</span>
                        <el-button link type="primary" class="stat-link" @click.stop="openJobSeekerApplies(scope.row, '1')">
                          面试 {{ scope.row.jobSeekerStats?.interviewApplies || 0 }}
                        </el-button>
                      </div>
                    </template>
                    <div class="business-popover">
                      <div class="business-popover-title">{{ scope.row.nickName || scope.row.userName || '-' }}</div>
                      <el-descriptions :column="2" size="small" border>
                        <el-descriptions-item label="总投递岗位">
                          <el-button link type="primary" @click="openJobSeekerApplies(scope.row)">{{ jobSeekerMetricValue(scope.row, 'totalApplies', 0) }}</el-button>
                        </el-descriptions-item>
                        <el-descriptions-item label="有效投递">
                          <el-button link type="primary" @click="openJobSeekerApplies(scope.row)">{{ jobSeekerMetricValue(scope.row, 'validApplyCount', 0) }}</el-button>
                        </el-descriptions-item>
                        <el-descriptions-item label="主动沟通HR">{{ jobSeekerMetricValue(scope.row, 'activeHrChatCount', 0) }}</el-descriptions-item>
                        <el-descriptions-item label="面试邀约">
                          <el-button link type="primary" @click="openJobSeekerApplies(scope.row, '1')">{{
                            jobSeekerMetricValue(scope.row, 'interviewInviteCount', scope.row.jobSeekerStats?.interviewApplies || 0)
                          }}</el-button>
                        </el-descriptions-item>
                        <el-descriptions-item label="确认面试">{{ jobSeekerMetricValue(scope.row, 'confirmedInterviewCount', 0) }}</el-descriptions-item>
                        <el-descriptions-item label="到场面试">{{ jobSeekerMetricValue(scope.row, 'attendedInterviewCount', 0) }}</el-descriptions-item>
                        <el-descriptions-item label="成功入职">{{ jobSeekerMetricValue(scope.row, 'hiredCount', 0) }}</el-descriptions-item>
                        <el-descriptions-item label="简历完整度">{{ resumeCompletenessText(scope.row) }}</el-descriptions-item>
                        <el-descriptions-item label="简历更新时间">{{ jobSeekerMetricValue(scope.row, 'resumeUpdateTime') }}</el-descriptions-item>
                        <el-descriptions-item label="期望薪资">{{ jobSeekerMetricValue(scope.row, 'expectedSalary') }}</el-descriptions-item>
                        <el-descriptions-item label="意向行业">{{ jobSeekerMetricValue(scope.row, 'intentionIndustry') }}</el-descriptions-item>
                        <el-descriptions-item label="工作年限">{{ jobSeekerMetricValue(scope.row, 'workYears') }}</el-descriptions-item>
                        <el-descriptions-item label="近7天登录">{{ jobSeekerMetricValue(scope.row, 'loginCount7d', 0) }}</el-descriptions-item>
                        <el-descriptions-item label="最后登录">{{ jobSeekerMetricValue(scope.row, 'lastLoginTime', scope.row.loginDate) }}</el-descriptions-item>
                        <el-descriptions-item label="30天活跃">{{ jobSeekerThirtyDayActiveText(scope.row) }}</el-descriptions-item>
                        <el-descriptions-item label="收藏岗位">{{ jobSeekerMetricValue(scope.row, 'favoriteJobCount', 0) }}</el-descriptions-item>
                        <el-descriptions-item label="浏览职位">{{ jobSeekerMetricValue(scope.row, 'browseJobCount', 0) }}</el-descriptions-item>
                        <el-descriptions-item label="测评状态">{{ assessmentStatusText(scope.row) }}</el-descriptions-item>
                      </el-descriptions>
                      <div class="job-seeker-actions">
                        <el-button link type="primary" @click="pushJobPack(scope.row)">推送岗位包</el-button>
                        <el-button link type="primary" @click="sendJobSeekerNotice(scope.row)">站内/短信通知</el-button>
                        <el-button link type="success" @click="openCustomTag(scope.row)">自定义标签</el-button>
                        <el-button link type="warning" @click="toggleJobSeekerMute(scope.row)">禁言/解禁</el-button>
                        <el-button link type="danger" @click="submitRiskTicket(scope.row)">风控工单</el-button>
                        <el-button link type="primary" @click="openJobSeekerBehaviorDashboard(scope.row)">行为看板</el-button>
                        <el-button link type="primary" @click="transferPromoterFollow(scope.row)">渠道跟进</el-button>
                      </div>
                    </div>
                  </el-popover>
                  <span v-else>{{ scope.row.deptName }}</span>
                </template>
              </el-table-column>
              <el-table-column v-if="columns[4].visible" key="phonenumber" label="手机号码" align="center" prop="phonenumber" width="120" />
              <el-table-column v-if="columns[5].visible" key="status" label="状态" align="center" width="90">
                <template #default="scope">
                  <el-switch
                    v-if="isInternalSegment"
                    v-model="scope.row.status"
                    active-value="0"
                    inactive-value="1"
                    @change="handleStatusChange(scope.row)"
                  ></el-switch>
                  <el-tag v-else :type="nonInternalStatusTag(scope.row.status)" size="small">
                    {{ nonInternalStatusText(scope.row.status) }}
                  </el-tag>
                </template>
              </el-table-column>

              <el-table-column v-if="columns[6].visible" label="创建时间" align="center" prop="createTime" width="160">
                <template #default="scope">
                  <span>{{ scope.row.createTime }}</span>
                </template>
              </el-table-column>

              <el-table-column label="操作" fixed="right" width="140" class-name="small-padding fixed-width">
                <template #default="scope">
                  <el-tooltip v-if="scope.row.userId !== 1" content="修改" placement="top">
                    <el-button v-hasPermi="['system:user:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)"></el-button>
                  </el-tooltip>
                  <el-tooltip v-if="scope.row.userId !== 1" content="删除" placement="top">
                    <el-button v-hasPermi="['system:user:remove']" link type="primary" icon="Delete" @click="handleDelete(scope.row)"></el-button>
                  </el-tooltip>

                  <el-tooltip v-if="scope.row.userId !== 1" content="重置密码" placement="top">
                    <el-button v-hasPermi="['system:user:resetPwd']" link type="primary" icon="Key" @click="handleResetPwd(scope.row)"></el-button>
                  </el-tooltip>

                  <el-tooltip v-if="scope.row.userId !== 1" content="分配角色" placement="top">
                    <el-button
                      v-hasPermi="['system:user:edit']"
                      link
                      type="primary"
                      icon="CircleCheck"
                      @click="handleAuthRole(scope.row)"
                    ></el-button>
                  </el-tooltip>
                </template>
              </el-table-column>
            </el-table>

            <pagination v-show="total > 0" v-model:page="currentPageNum" v-model:limit="currentPageSize" :total="total" @pagination="getList" />
          </el-card>
        </div>
      </el-col>
    </el-row>

    <!-- 添加或修改用户配置对话框 -->
    <el-dialog ref="formDialogRef" v-model="dialog.visible" :title="dialog.title" width="600px" append-to-body @close="closeDialog">
      <el-form ref="userFormRef" :model="form" :rules="rules" label-width="80px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="用户昵称" prop="nickName">
              <el-input v-model="form.nickName" placeholder="请输入用户昵称" maxlength="30" />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="form.userId == null || form.userId != useUserStore().userId">
            <el-form-item label="归属部门" prop="deptId">
              <el-tree-select
                v-model="form.deptId"
                :data="enabledDeptOptions"
                :props="{ value: 'id', label: 'label', children: 'children' } as any"
                value-key="id"
                placeholder="请选择归属部门"
                check-strictly
                @change="handleDeptChange"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="手机号码" prop="phonenumber">
              <el-input v-model="form.phonenumber" placeholder="请输入手机号码" maxlength="11" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="form.email" placeholder="请输入邮箱" maxlength="50" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item v-if="form.userId == undefined" label="用户名称" prop="userName">
              <el-input v-model="form.userName" placeholder="请输入用户名称" maxlength="30" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item v-if="form.userId == undefined" label="用户密码" prop="password">
              <el-input v-model="form.password" placeholder="请输入用户密码" type="password" maxlength="20" show-password />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="用户性别">
              <el-select v-model="form.sex" placeholder="请选择">
                <el-option v-for="dict in sys_user_sex" :key="dict.value" :label="dict.label" :value="dict.value"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-radio-group v-model="form.status">
                <el-radio v-for="dict in sys_normal_disable" :key="dict.value" :value="dict.value">{{ dict.label }}</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12" v-if="form.userId == null || form.userId != useUserStore().userId">
            <el-form-item label="岗位">
              <el-select v-model="form.postIds" multiple placeholder="请选择">
                <el-option
                  v-for="item in postOptions"
                  :key="item.postId"
                  :label="item.postName"
                  :value="item.postId"
                  :disabled="item.status == '1'"
                ></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="form.userId == null || form.userId != useUserStore().userId">
            <el-form-item label="角色" prop="roleIds">
              <el-select v-model="form.roleIds" filterable multiple placeholder="请选择">
                <el-option
                  v-for="item in roleOptions"
                  :key="item.roleId"
                  :label="item.roleName"
                  :value="item.roleId"
                  :disabled="item.status == '1'"
                ></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input v-model="form.remark" type="textarea" placeholder="请输入内容"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel()">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 用户导入对话框 -->
    <el-dialog v-model="upload.open" :title="upload.title" width="400px" append-to-body>
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
            <div class="el-upload__tip"><el-checkbox v-model="upload.updateSupport" />是否更新已经存在的用户数据</div>
            <span>仅允许导入xls、xlsx格式文件。</span>
            <el-link type="primary" :underline="false" style="font-size: 12px; vertical-align: baseline" @click="importTemplate">下载模板</el-link>
          </div>
        </template>
      </el-upload>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitFileForm">确 定</el-button>
          <el-button @click="upload.open = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="User" lang="ts">
import api from '@/api/system/user';
import { BusinessUserQuery, JobSeekerUserQuery, UserForm, UserQuery, UserVO } from '@/api/system/user/types';
import { DeptTreeVO } from '@/api/system/dept/types';
import { RoleVO } from '@/api/system/role/types';
import { PostVO } from '@/api/system/post/types';
import { globalHeaders } from '@/utils/request';
import { to } from 'await-to-js';
import { optionselect } from '@/api/system/post';
import { checkPermi } from '@/utils/permission';
import { useUserStore } from '@/store/modules/user';

const router = useRouter();
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { sys_normal_disable, sys_user_sex } = toRefs<any>(proxy?.useDict('sys_normal_disable', 'sys_user_sex'));
type PersonnelSegment = 'internal' | 'business' | 'jobSeeker';
type TagType = 'success' | 'warning' | 'info' | 'primary' | 'danger';
type PersonnelRow = UserVO & {
  sourceSegment?: PersonnelSegment;
  sourceId?: string | number;
  businessStats?: Record<string, any>;
  jobSeekerStats?: Record<string, any>;
};
const userList = ref<PersonnelRow[]>();
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<number | string>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const dateRange = ref<[DateModelType, DateModelType]>(['', '']);
const deptOptions = ref<DeptTreeVO[]>([]);
const enabledDeptOptions = ref<DeptTreeVO[]>([]);
const initPassword = ref<string>('');
const postOptions = ref<PostVO[]>([]);
const roleOptions = ref<RoleVO[]>([]);
const activePersonnelSegment = ref<PersonnelSegment>('internal');
const businessTreeRef = ref<ElTreeInstance>();
const businessTreeKeyword = ref('');
const businessTreeOptions = ref<Array<{ id: string | number; label: string; companyId?: string | number; children?: any[] }>>([]);
// 用户管理按三端隔离：内部账号、B端企业主HR账号、C端小程序注册用户分别走独立查询条件和接口。
const personnelSegments: Array<{ value: PersonnelSegment; label: string; desc: string }> = [
  { value: 'internal', label: '内部用户', desc: '平台内部所有岗位人员账号' },
  { value: 'business', label: 'B端企业用户', desc: '全部入驻企业HR账号' },
  { value: 'jobSeeker', label: 'C端求职者', desc: '小程序全部注册用户' }
];
/*** 用户导入参数 */
const upload = reactive<ImportOption>({
  // 是否显示弹出层（用户导入）
  open: false,
  // 弹出层标题（用户导入）
  title: '',
  // 是否禁用上传
  isUploading: false,
  // 是否更新已经存在的用户数据
  updateSupport: 0,
  // 设置上传的请求头部
  headers: globalHeaders(),
  // 上传的地址
  url: import.meta.env.VITE_APP_BASE_API + '/system/user/importData'
});
// 列显隐信息
const columns = ref<FieldOption[]>([
  { key: 0, label: `用户编号`, visible: false, children: [] },
  { key: 1, label: `用户名称`, visible: true, children: [] },
  { key: 2, label: `用户昵称`, visible: true, children: [] },
  { key: 3, label: `业务归属/统计`, visible: true, children: [] },
  { key: 4, label: `手机号码`, visible: true, children: [] },
  { key: 5, label: `状态`, visible: true, children: [] },
  { key: 6, label: `创建时间`, visible: true, children: [] }
]);

const queryFormRef = ref<ElFormInstance>();
const userFormRef = ref<ElFormInstance>();
const uploadRef = ref<ElUploadInstance>();
const formDialogRef = ref<ElDialogInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: UserForm = {
  userId: undefined,
  deptId: undefined,
  userName: '',
  nickName: undefined,
  password: '',
  phonenumber: undefined,
  email: undefined,
  sex: undefined,
  status: '0',
  remark: '',
  postIds: [],
  roleIds: []
};

const initData: PageData<UserForm, UserQuery> = {
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    userName: '',
    phonenumber: '',
    status: '',
    userType: 'sys_user',
    deptId: '',
    roleId: ''
  },
  rules: {
    userName: [
      { required: true, message: '用户名称不能为空', trigger: 'blur' },
      {
        min: 2,
        max: 20,
        message: '用户名称长度必须介于 2 和 20 之间',
        trigger: 'blur'
      }
    ],
    nickName: [{ required: true, message: '用户昵称不能为空', trigger: 'blur' }],
    password: [
      { required: true, message: '用户密码不能为空', trigger: 'blur' },
      {
        min: 5,
        max: 20,
        message: '用户密码长度必须介于 5 和 20 之间',
        trigger: 'blur'
      },
      { pattern: /^[^<>"'|\\]+$/, message: '不能包含非法字符：< > " \' \\ |', trigger: 'blur' }
    ],
    email: [
      {
        type: 'email',
        message: '请输入正确的邮箱地址',
        trigger: ['blur', 'change']
      }
    ],
    phonenumber: [
      {
        pattern: /^1[3456789][0-9]\d{8}$/,
        message: '请输入正确的手机号码',
        trigger: 'blur'
      }
    ],
    roleIds: [{ required: true, message: '用户角色不能为空', trigger: 'blur' }]
  }
};
const data = reactive<PageData<UserForm, UserQuery>>(initData);

const { form, rules } = toRefs<PageData<UserForm, UserQuery>>(data);
const internalQuery = reactive<UserQuery>({ ...initData.queryParams });
const businessQuery = reactive<BusinessUserQuery>({
  pageNum: 1,
  pageSize: 10,
  companyId: undefined,
  companyName: '',
  contactPerson: '',
  contactPhone: '',
  status: '',
  isSilenced: '',
  customerLayer: '',
  jobCountMin: undefined,
  jobCountMax: undefined,
  applyCountMin: undefined,
  applyCountMax: undefined,
  paidStatus: '',
  active7d: '',
  params: {}
});
const jobSeekerQuery = reactive<JobSeekerUserQuery>({
  pageNum: 1,
  pageSize: 10,
  userName: '',
  phonenumber: '',
  isRecruitmentSilenced: '',
  applyFilter: '',
  applyCountMin: undefined,
  applyCountMax: undefined,
  interviewCountMin: undefined,
  interviewCountMax: undefined,
  userLayer: '',
  activeStatus: '',
  resumeStatus: '',
  paidStatus: '',
  registerChannel: '',
  promoterKeyword: ''
});

const currentPageNum = computed({
  get: () => currentListQuery.value.pageNum || 1,
  set: (value: number) => {
    currentListQuery.value.pageNum = value;
  }
});
const currentPageSize = computed({
  get: () => currentListQuery.value.pageSize || 10,
  set: (value: number) => {
    currentListQuery.value.pageSize = value;
  }
});
const businessSummary = computed(() => {
  const rows = (userList.value || []).filter((row) => row.sourceSegment === 'business');
  const count = rows.length || 1;
  const totalJobs = rows.reduce((sum, row) => sum + toNumber(row.businessStats?.jobCount), 0);
  const totalApplies = rows.reduce((sum, row) => sum + toNumber(row.businessStats?.applyCount), 0);
  return {
    avgJobs: (totalJobs / count).toFixed(1),
    avgApplies: (totalApplies / count).toFixed(1),
    highValueCount: rows.filter((row) => customerLayerMeta(row).key === 'highValue').length,
    sleepingCount: rows.filter((row) => customerLayerMeta(row).key === 'sleeping').length
  };
});

/** 查询用户列表 */
const getList = async () => {
  loading.value = true;
  try {
    ids.value = [];
    single.value = true;
    multiple.value = true;
    if (activePersonnelSegment.value === 'business') {
      await loadBusinessUsers();
      return;
    }
    if (activePersonnelSegment.value === 'jobSeeker') {
      await loadJobSeekers();
      return;
    }
    await loadInternalUsers();
  } finally {
    loading.value = false;
  }
};

const unwrapPagedRows = <T,>(res: any): { rows: T[]; total: number } => {
  const body = res?.data?.rows || res?.data?.total !== undefined ? res.data : res;
  const rows = body?.rows;
  return {
    rows: Array.isArray(rows) ? rows : [],
    total: Number(body?.total || 0)
  };
};

const makePersonnelRow = (row: Partial<UserVO> & { userId: string | number; sourceSegment: PersonnelSegment }): PersonnelRow => {
  return {
    tenantId: '',
    deptId: 0,
    userName: '',
    nickName: '',
    userType: '',
    email: '',
    phonenumber: '',
    sex: '',
    avatar: '',
    status: '',
    delFlag: '',
    loginIp: '',
    loginDate: '',
    remark: '',
    deptName: '',
    roles: [],
    roleIds: [],
    postIds: [],
    roleId: undefined,
    admin: false,
    ...row
  };
};

const loadInternalUsers = async () => {
  internalQuery.userType = 'sys_user';
  const pageNum = internalQuery.pageNum || 1;
  const pageSize = internalQuery.pageSize || 10;
  const res = await api.listUser(proxy?.addDateRange({ ...internalQuery, pageNum: 1, pageSize: 10000 }, dateRange.value));
  const list = unwrapPagedRows<UserVO>(res);
  // 后端部分环境尚未按 userType 过滤，这里兜底只展示平台内部账号，避免 B/C 端账号混入默认 Tab。
  const rows = list.rows.filter((row) => row.userType === 'sys_user');
  userList.value = rows.slice((pageNum - 1) * pageSize, pageNum * pageSize).map((row) => makePersonnelRow({ ...row, sourceSegment: 'internal' }));
  total.value = rows.length;
};

const loadBusinessUsers = async () => {
  if (!businessTreeOptions.value.length) {
    loadBusinessTree();
  }
  const [beginTime, endTime] = dateRange.value;
  const query: BusinessUserQuery = {
    pageNum: businessQuery.pageNum,
    pageSize: businessQuery.pageSize,
    companyId: businessQuery.companyId || undefined,
    companyName: businessQuery.companyName || undefined,
    contactPerson: businessQuery.contactPerson || undefined,
    contactPhone: businessQuery.contactPhone || undefined,
    status: businessQuery.status || undefined,
    isSilenced: businessQuery.isSilenced || undefined,
    customerLayer: businessQuery.customerLayer || undefined,
    jobCountMin: businessQuery.jobCountMin ?? undefined,
    jobCountMax: businessQuery.jobCountMax ?? undefined,
    applyCountMin: businessQuery.applyCountMin ?? undefined,
    applyCountMax: businessQuery.applyCountMax ?? undefined,
    paidStatus: businessQuery.paidStatus || undefined,
    active7d: businessQuery.active7d || undefined,
    params: {
      beginTime: beginTime || undefined,
      endTime: endTime || undefined
    }
  };
  const res = await api.listBusinessUsers(query);
  const list = unwrapPagedRows<any>(res);
  userList.value = list.rows.map((row) =>
    makePersonnelRow({
      userId: row.userId || row.companyId || '',
      sourceId: row.companyId,
      sourceSegment: 'business',
      userName: row.userName || '',
      nickName: row.nickName || row.contactPerson || '',
      deptName: `岗位 ${row.jobCount || 0} / 投递 ${row.applyCount || 0}`,
      userType: 'B',
      phonenumber: row.contactPhone || '',
      status: row.status || '',
      createTime: row.createTime,
      remark: row.remark || row.silenceReason || '',
      businessStats: row
    })
  );
  total.value = list.total;
};

const loadBusinessTree = async () => {
  const res = await api.listBusinessCompanies({ pageNum: 1, pageSize: 10000 });
  const list = unwrapPagedRows<any>(res);
  businessTreeOptions.value = [
    {
      id: 'all',
      label: `全部企业（${list.total || list.rows.length}）`,
      children: list.rows.map((row) => ({
        id: row.companyId || row.userId || row.companyName,
        companyId: row.companyId,
        label: row.companyName || row.contactPerson || '-'
      }))
    }
  ];
};

const loadJobSeekers = async () => {
  const res = await api.listJobSeekerUsers({
    pageNum: jobSeekerQuery.pageNum,
    pageSize: jobSeekerQuery.pageSize,
    userName: jobSeekerQuery.userName || undefined,
    phonenumber: jobSeekerQuery.phonenumber || undefined,
    isRecruitmentSilenced: jobSeekerQuery.isRecruitmentSilenced || undefined,
    applyFilter: jobSeekerQuery.applyFilter || undefined,
    applyCountMin: jobSeekerQuery.applyCountMin ?? undefined,
    applyCountMax: jobSeekerQuery.applyCountMax ?? undefined,
    interviewCountMin: jobSeekerQuery.interviewCountMin ?? undefined,
    interviewCountMax: jobSeekerQuery.interviewCountMax ?? undefined,
    userLayer: jobSeekerQuery.userLayer || undefined,
    activeStatus: jobSeekerQuery.activeStatus || undefined,
    resumeStatus: jobSeekerQuery.resumeStatus || undefined,
    paidStatus: jobSeekerQuery.paidStatus || undefined,
    registerChannel: jobSeekerQuery.registerChannel || undefined,
    promoterKeyword: jobSeekerQuery.promoterKeyword || undefined
  });
  const list = unwrapPagedRows<any>(res);
  userList.value = list.rows.map((row) =>
    makePersonnelRow({
      userId: row.userId,
      sourceSegment: 'jobSeeker',
      userName: row.userName || '',
      nickName: row.realName || row.nickName || '',
      deptName: `投递 ${row.totalApplies || 0} | 面试 ${row.interviewApplies || 0}`,
      userType: row.userType || 'C',
      email: row.resumeEmail || row.email || '',
      phonenumber: row.resumePhone || row.phone || row.phonenumber || row.accountPhone || '',
      sex: row.resumeSex || row.accountSex || row.sex || '',
      avatar: String(row.resumeAvatarUrl || row.avatarUrl || row.avatar || ''),
      status: row.status || '',
      loginIp: row.loginIp || '',
      loginDate: row.loginDate || '',
      createTime: row.createTime,
      remark: row.remark || row.silenceReason || '',
      jobSeekerStats: row
    })
  );
  total.value = list.total;
};

/** 查询部门下拉树结构 */
const getDeptTree = async () => {
  const res = await api.deptTreeSelect();
  deptOptions.value = renameRootDeptToAll(res.data || []);
  enabledDeptOptions.value = filterDisabledDept(res.data);
};

/** 过滤禁用的部门 */
const renameRootDeptToAll = (deptList: DeptTreeVO[], isRoot = true) => {
  return deptList.map((dept, index) => ({
    ...dept,
    label: isRoot && index === 0 ? '全部' : dept.label,
    children: dept.children ? renameRootDeptToAll(dept.children, false) : dept.children
  }));
};

const filterDisabledDept = (deptList: DeptTreeVO[]) => {
  return deptList.filter((dept) => {
    if (dept.disabled) {
      return false;
    }
    if (dept.children && dept.children.length) {
      dept.children = filterDisabledDept(dept.children);
    }
    return true;
  });
};

/** 在部门树中按名称递归查找节点 id（供「企业管理-人员」入口按企业名定位单位用） */
const findDeptIdByName = (list: DeptTreeVO[], name: string): number | string | undefined => {
  for (const dept of list || []) {
    if (dept.label === name) return dept.id;
    if (dept.children && dept.children.length) {
      const found = findDeptIdByName(dept.children, name);
      if (found !== undefined) return found;
    }
  }
  return undefined;
};

const findDeptIdById = (list: DeptTreeVO[], id: string | number): number | string | undefined => {
  const target = String(id);
  for (const dept of list || []) {
    if (String(dept.id) === target) return dept.id;
    if (dept.children && dept.children.length) {
      const found = findDeptIdById(dept.children, id);
      if (found !== undefined) return found;
    }
  }
  return undefined;
};

/**
 * 入口透传定位：当从企业管理「人员」弹窗进入(URL 带 deptName=企业名 / deptId)时，
 * 默认选中对应单位节点并过滤用户列表。无该参数时(常规菜单进入)不做任何处理。
 */
const applyEntryDeptFilter = async () => {
  const query = router.currentRoute.value.query;
  const entryDeptName = query.deptName as string;
  const deptIdQuery = query.deptId as string;
  const userIdQuery = query.userId as string;
  let targetId: number | string | undefined;
  if (userIdQuery) {
    try {
      const { data } = await api.getUser(userIdQuery);
      targetId = data?.user?.deptId ? findDeptIdById(deptOptions.value, data.user.deptId) : undefined;
    } catch (error) {
      console.warn('入口用户部门定位失败:', error);
    }
  }
  if (targetId === undefined && deptIdQuery) {
    targetId = findDeptIdById(deptOptions.value, deptIdQuery);
  }
  if (targetId === undefined && entryDeptName) {
    targetId = findDeptIdByName(deptOptions.value, entryDeptName);
  }
  if (targetId !== undefined) {
    internalQuery.deptId = targetId;
  }
};

const currentListQuery = computed(() => {
  if (activePersonnelSegment.value === 'business') return businessQuery;
  if (activePersonnelSegment.value === 'jobSeeker') return jobSeekerQuery;
  return internalQuery;
});
const isInternalSegment = computed(() => activePersonnelSegment.value === 'internal');

const handlePersonnelSegmentChange = (value: string | number) => {
  activePersonnelSegment.value = value as PersonnelSegment;
  currentListQuery.value.pageNum = 1;
  getList();
};

const userTypeText = (value?: string) => {
  if (value === 'sys_user') return '内部人员';
  if (value === 'B') return 'B端企业用户';
  if (value === 'C' || value === 'app_user') return '求职者';
  return value || '-';
};

const userTypeTag = (value?: string): TagType => {
  if (value === 'sys_user') return 'info';
  if (value === 'B') return 'primary';
  if (value === 'C' || value === 'app_user') return 'success';
  return 'info';
};

const nonInternalStatusText = (value?: string) => {
  if (activePersonnelSegment.value === 'business') {
    if (value === '0') return '待审核';
    if (value === '1') return '已认证';
    if (value === '2') return '已禁用';
    if (value === '4') return '草稿';
    return value || '-';
  }
  if (value === '0') return '正常';
  if (value === '1') return '停用';
  return value || '-';
};

const nonInternalStatusTag = (value?: string): TagType => {
  if (activePersonnelSegment.value === 'business') {
    if (value === '1') return 'success';
    if (value === '2') return 'danger';
    if (value === '0' || value === '4') return 'warning';
    return 'info';
  }
  if (value === '0') return 'success';
  if (value === '1') return 'danger';
  return 'info';
};

watch(
  () => businessTreeKeyword.value,
  (value) => {
    businessTreeRef.value?.filter(value);
  }
);

const filterBusinessTreeNode = (value: string, data: any) => {
  if (!value) return true;
  return String(data.label || '').includes(value);
};

const handleBusinessTreeClick = (data: any) => {
  businessQuery.companyId = data.companyId || undefined;
  businessQuery.pageNum = 1;
  getList();
};

const clearBusinessTreeFilter = () => {
  businessTreeKeyword.value = '';
  businessQuery.companyId = undefined;
  businessTreeRef.value?.setCurrentKey('all');
  getList();
};

const toNumber = (value: any) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const daysSince = (value?: string) => {
  if (!value) return Number.POSITIVE_INFINITY;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? (Date.now() - time) / 86400000 : Number.POSITIVE_INFINITY;
};

const metricValue = (row: PersonnelRow, key: string, fallback?: any) => {
  const value = row.businessStats?.[key] ?? fallback;
  return value === undefined || value === null || value === '' ? '暂无' : value;
};

const riskText = (row: PersonnelRow) => {
  const stats = row.businessStats || {};
  const risks = [
    stats.isSilenced === '1' ? '禁言' : '',
    stats.arrears === '1' || stats.isArrears === '1' ? '欠费' : '',
    toNumber(stats.violationCount) > 0 ? `违规${stats.violationCount}` : '',
    toNumber(stats.complaintCount) > 0 ? `投诉${stats.complaintCount}` : ''
  ].filter(Boolean);
  return risks.length ? risks.join(' / ') : '暂无';
};

const customerLayerMeta = (row: PersonnelRow): { key: string; label: string; type: TagType } => {
  const stats = row.businessStats || {};
  const applyCount = toNumber(stats.applyCount);
  const jobCount = toNumber(stats.jobCount);
  const loginDays7d = toNumber(stats.hrLoginDays7d);
  const isPaid = stats.paidStatus === 'paid' || stats.hasPaid === true || toNumber(stats.totalRechargeAmount) > 0;
  const hasRisk =
    stats.isSilenced === '1' ||
    stats.arrears === '1' ||
    stats.isArrears === '1' ||
    toNumber(stats.violationCount) > 0 ||
    toNumber(stats.complaintCount) > 0 ||
    toNumber(stats.garbageJobCount) > 0;
  if (hasRisk) return { key: 'risk', label: '风险客户', type: 'danger' };
  if (applyCount >= 20 && isPaid && loginDays7d >= 3) return { key: 'highValue', label: '高价值客户', type: 'success' };
  if (daysSince(stats.createTime) <= 7 && jobCount === 0) return { key: 'newInactive', label: '新入驻待激活', type: 'warning' };
  if (
    toNumber(stats.newJobCount30d) === 0 &&
    toNumber(stats.loginDays30d) === 0 &&
    toNumber(stats.applyCount30d) === 0 &&
    daysSince(stats.createTime) > 30
  ) {
    return { key: 'sleeping', label: '沉睡流失预警', type: 'warning' };
  }
  if (jobCount === 0 && applyCount === 0 && daysSince(stats.createTime) > 30) return { key: 'zeroOutput', label: '静态零产出', type: 'info' };
  return { key: 'normal', label: '正常运营', type: 'primary' };
};

const openBusinessDashboard = (row: PersonnelRow) => {
  ElMessage.info(`查看业务全链路待接入：${row.userName || row.sourceId || '-'}`);
};

const sendBusinessReminder = (row: PersonnelRow) => {
  ElMessage.info(`运营提醒待接入：${row.userName || row.sourceId || '-'}`);
};

const openBusinessJobs = (row: PersonnelRow, status?: string) => {
  router.push({
    path: '/recruitment/job',
    query: {
      companyName: row.businessStats?.companyName || row.userName || '',
      status: status || undefined
    }
  });
};

const openBusinessApplies = (row: PersonnelRow, status?: string) => {
  router.push({
    path: '/recruitment/apply',
    query: {
      companyId: row.sourceId ? String(row.sourceId) : undefined,
      companyName: row.businessStats?.companyName || row.userName || undefined,
      status: status || undefined
    }
  });
};

const jobSeekerRawValue = (row: PersonnelRow, keys: string[], fallback?: any) => {
  const stats = row.jobSeekerStats || {};
  for (const key of keys) {
    const value = stats[key] ?? (row as any)[key];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return fallback;
};

const jobSeekerMetricValue = (row: PersonnelRow, key: string, fallback?: any) => {
  const aliases: Record<string, string[]> = {
    totalApplies: ['totalApplies', 'applyCount', 'totalApplyCount'],
    validApplyCount: ['validApplyCount', 'effectiveApplyCount', 'dedupApplyCount'],
    activeHrChatCount: ['activeHrChatCount', 'hrChatCount', 'communicateHrCount'],
    interviewInviteCount: ['interviewInviteCount', 'interviewApplies', 'interviewCount'],
    confirmedInterviewCount: ['confirmedInterviewCount', 'confirmInterviewCount'],
    attendedInterviewCount: ['attendedInterviewCount', 'arrivedInterviewCount'],
    hiredCount: ['hiredCount', 'entryCount'],
    resumeUpdateTime: ['resumeUpdateTime', 'resumeUpdatedTime', 'resumeUpdateDate'],
    expectedSalary: ['expectedSalary', 'salaryExpectation', 'expectSalary'],
    intentionIndustry: ['intentionIndustry', 'expectedIndustry', 'industryName'],
    workYears: ['workYears', 'workExperienceYears', 'experienceYears'],
    loginCount7d: ['loginCount7d', 'loginDays7d', 'sevenDayLoginCount'],
    lastLoginTime: ['lastLoginTime', 'loginDate'],
    favoriteJobCount: ['favoriteJobCount', 'collectJobCount'],
    browseJobCount: ['browseJobCount', 'viewJobCount', 'jobBrowseCount']
  };
  const value = jobSeekerRawValue(row, aliases[key] || [key], fallback);
  return value === undefined || value === null || value === '' ? '暂无' : value;
};

const isBlankResume = (row: PersonnelRow) => {
  const value = jobSeekerRawValue(row, ['resumeCompleteness', 'resumeCompleteRate', 'resumeIntegrity']);
  const text = String(value ?? '').trim();
  if (['空白', '空白简历', 'blank'].includes(text)) return true;
  if (text !== '' && Number.isFinite(Number(text))) return Number(text) <= 0;
  return !jobSeekerRawValue(row, ['resumeId', 'resumeUpdateTime', 'resumeUpdatedTime']);
};

const resumeCompletenessText = (row: PersonnelRow) => {
  const value = jobSeekerRawValue(row, ['resumeCompleteness', 'resumeCompleteRate', 'resumeIntegrity']);
  const text = String(value ?? '').trim();
  if (['空白', '空白简历', 'blank'].includes(text) || isBlankResume(row)) return '空白';
  const numeric = Number(text);
  if (Number.isFinite(numeric)) {
    if (numeric >= 80) return '完整简历';
    if (numeric > 0) return '基础完善';
  }
  if (['完整', '完整简历', 'full'].includes(text)) return '完整简历';
  return text || '基础完善';
};

const jobSeekerThirtyDayActiveText = (row: PersonnelRow) => {
  const active30d = jobSeekerRawValue(row, ['active30d', 'isActive30d']);
  if (active30d !== undefined) return active30d === true || active30d === '1' || active30d === 'true' ? '活跃' : '流失';
  return daysSince(String(jobSeekerRawValue(row, ['lastLoginTime', 'loginDate'], row.loginDate) || '')) <= 30 ? '活跃' : '流失';
};

const assessmentStatusText = (row: PersonnelRow) => {
  const value = jobSeekerRawValue(row, ['assessmentStatus', 'evaluationStatus', 'testCompleteStatus']);
  if (value === '1' || value === true || value === 'completed') return '已完成';
  if (value === '0' || value === false || value === 'pending') return '未完成';
  return value || '暂无';
};

const jobSeekerLayerMeta = (row: PersonnelRow): { key: string; label: string; type: TagType; desc: string } => {
  const applyCount = toNumber(jobSeekerRawValue(row, ['totalApplies', 'applyCount', 'totalApplyCount']));
  const interviewCount = toNumber(jobSeekerRawValue(row, ['interviewApplies', 'interviewInviteCount', 'interviewCount']));
  const newApplyCount30d = toNumber(jobSeekerRawValue(row, ['newApplyCount30d', 'applyCount30d']));
  const dayApplyCount = toNumber(jobSeekerRawValue(row, ['dayApplyCount', 'todayApplyCount']));
  const complaintCount = toNumber(jobSeekerRawValue(row, ['complaintCount', 'companyComplaintCount']));
  const spamCount = toNumber(jobSeekerRawValue(row, ['spamCount', 'maliciousCount']));
  const lastLoginTime = String(jobSeekerRawValue(row, ['lastLoginTime', 'loginDate'], row.loginDate) || '');
  const createTime = String(jobSeekerRawValue(row, ['createTime'], row.createTime) || '');
  const isMember =
    jobSeekerRawValue(row, ['paidStatus']) === 'member' ||
    jobSeekerRawValue(row, ['memberStatus']) === '1' ||
    jobSeekerRawValue(row, ['isMember']) === true ||
    toNumber(jobSeekerRawValue(row, ['memberPackageCount', 'resumeUnlockCount'])) > 0;
  const hasRisk = row.jobSeekerStats?.isRecruitmentSilenced === '1' || dayApplyCount > 20 || complaintCount > 0 || spamCount > 0;
  if (hasRisk) {
    return { key: 'risk', label: '风险水投用户', type: 'danger', desc: '命中规则：已禁言、单日投递大于20、存在企业投诉或恶意刷屏记录。' };
  }
  if (applyCount >= 5 && interviewCount >= 1) {
    return { key: 'highIntent', label: '高意向求职者', type: 'success', desc: '命中规则：累计投递不少于5次，且至少获得1次面试邀约。' };
  }
  if (daysSince(createTime) <= 7 && applyCount === 0 && isBlankResume(row)) {
    return { key: 'newBlank', label: '新注册空白简历', type: 'warning', desc: '命中规则：注册7天内，投递为0，且简历为空白。' };
  }
  if (daysSince(lastLoginTime) > 30 && newApplyCount30d === 0 && daysSince(createTime) > 30) {
    return { key: 'sleeping', label: '沉睡僵尸', type: 'warning', desc: '命中规则：超过30天未登录，近30天无新增投递。' };
  }
  if (isMember) return { key: 'member', label: '付费会员', type: 'primary', desc: '命中规则：购买过简历解锁或会员套餐。' };
  if (applyCount === 0 && !lastLoginTime && isBlankResume(row)) {
    return { key: 'zombieBlank', label: '僵尸空白账号', type: 'info', desc: '命中规则：注册后未编辑简历、0投递，且无登录记录。' };
  }
  return { key: 'normal', label: '普通求职者', type: 'info', desc: '未命中特殊运营分层规则，按普通求职者展示。' };
};

const pushJobPack = (row: PersonnelRow) => {
  ElMessage.info(`定向岗位包推送待接入：${row.nickName || row.userName || row.userId}`);
};

const sendJobSeekerNotice = (row: PersonnelRow) => {
  ElMessage.info(`站内/短信通知待接入：${row.nickName || row.userName || row.userId}`);
};

const openCustomTag = (row: PersonnelRow) => {
  ElMessage.info(`自定义标签待接入：${row.nickName || row.userName || row.userId}`);
};

const toggleJobSeekerMute = (row: PersonnelRow) => {
  ElMessage.info(`求职者禁言/解禁待接入：${row.nickName || row.userName || row.userId}`);
};

const submitRiskTicket = (row: PersonnelRow) => {
  ElMessage.info(`风控工单待接入：${row.nickName || row.userName || row.userId}`);
};

const openJobSeekerBehaviorDashboard = (row: PersonnelRow) => {
  ElMessage.info(`用户行为看板待接入：${row.nickName || row.userName || row.userId}`);
};

const transferPromoterFollow = (row: PersonnelRow) => {
  ElMessage.info(`渠道运营跟进待接入：${row.nickName || row.userName || row.userId}`);
};

const openJobSeekerApplies = (row: PersonnelRow, status?: string) => {
  router.push({
    path: '/recruitment/apply',
    query: {
      userName: row.nickName || row.userName || undefined,
      status: status || undefined
    }
  });
};

/** 搜索按钮操作 */
const handleQuery = () => {
  currentListQuery.value.pageNum = 1;
  getList();
};
/** 重置按钮操作 */
const resetQuery = () => {
  dateRange.value = ['', ''];
  queryFormRef.value?.resetFields();
  currentListQuery.value.pageNum = 1;
  if (activePersonnelSegment.value === 'internal') {
    internalQuery.deptId = undefined;
  }
  if (activePersonnelSegment.value === 'business') {
    businessQuery.companyId = undefined;
    businessTreeRef.value?.setCurrentKey('all');
  }
  handleQuery();
};

/** 删除按钮操作 */
const handleDelete = async (row?: UserVO) => {
  const userIds = row?.userId || ids.value;
  const [err] = await to(proxy?.$modal.confirm('是否确认删除用户编号为"' + userIds + '"的数据项？') as any);
  if (!err) {
    await api.delUser(userIds);
    await getList();
    proxy?.$modal.msgSuccess('删除成功');
  }
};

/** 用户状态修改  */
const handleStatusChange = async (row: UserVO) => {
  const text = row.status === '0' ? '启用' : '停用';
  try {
    await proxy?.$modal.confirm('确认要"' + text + '""' + row.userName + '"用户吗?');
    await api.changeUserStatus(row.userId, row.status);
    proxy?.$modal.msgSuccess(text + '成功');
  } catch (err) {
    row.status = row.status === '0' ? '1' : '0';
  }
};
/** 跳转角色分配 */
const handleAuthRole = (row: UserVO) => {
  const userId = row.userId;
  router.push('/system/user-auth/role/' + userId);
};

/** 重置密码按钮操作 */
const handleResetPwd = async (row: UserVO) => {
  const [err, res] = await to(
    ElMessageBox.prompt('请输入"' + row.userName + '"的新密码', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      closeOnClickModal: false,
      inputPattern: /^.{5,20}$/,
      inputErrorMessage: '用户密码长度必须介于 5 和 20 之间',
      inputValidator: (value) => {
        if (/<|>|"|'|\||\\/.test(value)) {
          return '不能包含非法字符：< > " \' \\ |';
        }
      }
    })
  );
  if (!err && res) {
    await api.resetUserPwd(row.userId, res.value);
    proxy?.$modal.msgSuccess('修改成功，新密码是：' + res.value);
  }
};

/** 选择条数  */
const handleSelectionChange = (selection: PersonnelRow[]) => {
  ids.value = selection.map((item) => item.userId);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 导入按钮操作 */
const handleImport = () => {
  upload.title = '用户导入';
  upload.open = true;
};
/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'system/user/export',
    {
      ...internalQuery
    },
    `user_${new Date().getTime()}.xlsx`
  );
};
/** 下载模板操作 */
const importTemplate = () => {
  proxy?.download('system/user/importTemplate', {}, `user_template_${new Date().getTime()}.xlsx`);
};

/**文件上传中处理 */
const handleFileUploadProgress = () => {
  upload.isUploading = true;
};
/** 文件上传成功处理 */
const handleFileSuccess = (response: any, file: UploadFile) => {
  upload.open = false;
  upload.isUploading = false;
  uploadRef.value?.handleRemove(file);
  ElMessageBox.alert("<div style='overflow: auto;overflow-x: hidden;max-height: 70vh;padding: 10px 20px 0;'>" + response.msg + '</div>', '导入结果', {
    dangerouslyUseHTMLString: true
  });
  getList();
};

/** 提交上传文件 */
function submitFileForm() {
  uploadRef.value?.submit();
}

/** 重置操作表单 */
const reset = () => {
  form.value = { ...initFormData };
  userFormRef.value?.resetFields();
};
/** 取消按钮 */
const cancel = () => {
  dialog.visible = false;
  reset();
};

/** 新增按钮操作 */
const handleAdd = async () => {
  reset();
  const { data } = await api.getUser();
  dialog.visible = true;
  dialog.title = '新增用户';
  postOptions.value = data.posts;
  roleOptions.value = data.roles;
  form.value.password = initPassword.value.toString();
};

/** 修改按钮操作 */
const handleUpdate = async (row?: UserForm) => {
  reset();
  const userId = row?.userId || ids.value[0];
  const { data } = await api.getUser(userId);
  dialog.visible = true;
  dialog.title = '修改用户';
  Object.assign(form.value, data.user);
  postOptions.value = data.posts;
  roleOptions.value = Array.from(new Map([...data.roles, ...data.user.roles].map((role) => [role.roleId, role])).values());
  form.value.postIds = data.postIds;
  form.value.roleIds = data.roleIds;
  form.value.password = '';
};

/** 提交按钮 */
const submitForm = () => {
  userFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      if (form.value.userId) {
        // 自己编辑自己的情况下 不允许编辑角色部门岗位
        if (form.value.userId == useUserStore().userId) {
          form.value.roleIds = null;
          form.value.deptId = null;
          form.value.postIds = null;
        }
        await api.updateUser(form.value);
      } else {
        await api.addUser(form.value);
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

/**
 * 关闭用户弹窗
 */
const closeDialog = () => {
  dialog.visible = false;
  resetForm();
};

/**
 * 重置表单
 */
const resetForm = () => {
  userFormRef.value?.resetFields();
  userFormRef.value?.clearValidate();

  form.value.id = undefined;
  form.value.status = '1';
};
onMounted(async () => {
  await getDeptTree(); // 初始化部门数据
  await applyEntryDeptFilter(); // 若由企业「人员」入口带参进入，默认选中对应单位
  getList(); // 初始化列表数据（已带上入口定位的 deptId）
  proxy?.getConfigKey('sys.user.initPassword').then((response) => {
    initPassword.value = response.data;
  });
});

async function handleDeptChange(value: number | string) {
  const response = await optionselect(value);
  postOptions.value = response.data;
  form.value.postIds = [];
}
</script>

<style scoped lang="scss">
.personnel-segment {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.personnel-segment__item {
  min-height: 72px;
  padding: 14px 18px;
  text-align: left;
  cursor: pointer;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  box-shadow: var(--el-box-shadow-light);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    color 0.2s ease;
}

.personnel-segment__item:hover,
.personnel-segment__item.is-active {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary);
  box-shadow: 0 6px 18px rgba(64, 158, 255, 0.14);
}

.personnel-segment__label {
  display: block;
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
}

.personnel-segment__desc {
  display: block;
  margin-top: 6px;
  font-size: 13px;
  line-height: 18px;
  color: var(--el-text-color-secondary);
}

@media (max-width: 768px) {
  .personnel-segment {
    grid-template-columns: 1fr;
  }
}

.user-list-layout {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.user-table-card {
  width: 100%;
  min-width: 0;
  flex: 1;
}

.user-list-layout.is-business .user-table-card {
  min-width: 0;
  flex: 1;
}

.business-tree-card {
  width: 260px;
  flex: 0 0 260px;
}

.business-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.business-stat-cell,
.job-seeker-stat-cell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.stat-link {
  height: auto;
  padding: 0;
  font-weight: 500;
}

.business-popover-title {
  margin-bottom: 8px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.business-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 10px;
}

.job-seeker-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  justify-content: flex-end;
  margin-top: 10px;
}

@media (max-width: 1200px) {
  .user-list-layout {
    display: block;
  }

  .business-tree-card {
    width: auto;
    margin-bottom: 10px;
  }
}
</style>
