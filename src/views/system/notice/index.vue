<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="公告标题" prop="noticeTitle">
              <el-input v-model="queryParams.noticeTitle" placeholder="请输入公告标题" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="操作人员" prop="createByName">
              <el-input v-model="queryParams.createByName" placeholder="请输入操作人员" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="类型" prop="noticeType">
              <el-select v-model="queryParams.noticeType" placeholder="公告类型" clearable>
                <el-option v-for="item in noticeTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="业务分类" prop="businessCategory">
              <el-select v-model="queryParams.businessCategory" placeholder="全部" clearable style="width: 150px">
                <el-option v-for="item in businessCategoryOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="推送状态" prop="pushStatus">
              <el-select v-model="queryParams.pushStatus" placeholder="全部" clearable style="width: 130px">
                <el-option v-for="item in pushStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="接收人群" prop="audienceType">
              <el-select v-model="queryParams.audienceType" placeholder="全部" clearable style="width: 150px">
                <el-option v-for="item in audienceTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item v-if="activeNoticeTab === 'period'" label="推送周期" prop="periodCycle">
              <el-select v-model="queryParams.periodCycle" placeholder="全部" clearable style="width: 140px">
                <el-option v-for="item in periodCycleFilterOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item v-if="activeNoticeTab === 'period'" label="数据人群" prop="dataAudience">
              <el-select v-model="queryParams.dataAudience" placeholder="全部" clearable style="width: 140px">
                <el-option v-for="item in periodAudienceOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item v-if="activeNoticeTab === 'period'" label="分层标签" prop="segmentTag">
              <el-select v-model="queryParams.segmentTag" placeholder="全部" clearable style="width: 150px">
                <el-option v-for="item in segmentTagOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item v-if="activeNoticeTab === 'period'" label="周期状态" prop="periodStatus">
              <el-select v-model="queryParams.periodStatus" placeholder="全部" clearable style="width: 130px">
                <el-option v-for="item in periodStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="发布时间" style="width: 308px">
              <el-date-picker
                v-model="publishDateRange"
                value-format="YYYY-MM-DD HH:mm:ss"
                type="daterange"
                range-separator="-"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
                :default-time="[new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)]"
              />
            </el-form-item>
            <el-form-item label="关键词" prop="keyword">
              <el-input v-model="queryParams.keyword" placeholder="标题/内容关键词" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="快捷筛选">
              <el-checkbox v-model="queryParams.isTop" true-label="1" false-label="">置顶</el-checkbox>
              <el-checkbox v-model="queryParams.isRed" true-label="1" false-label="">标红</el-checkbox>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
              <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </transition>

    <el-card class="notice-tabs-card" shadow="never">
      <el-tabs v-model="activeNoticeTab" @tab-change="handleNoticeTabChange">
        <el-tab-pane label="通知公告" name="notice" />
        <el-tab-pane label="周/月" name="period" />
      </el-tabs>
    </el-card>

    <el-card shadow="hover">
      <template #header>
        <el-row :gutter="10" class="mb8">
          <el-col v-if="activeNoticeTab === 'notice'" :span="1.5">
            <el-button v-hasPermi="['system:notice:add']" type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
          </el-col>
          <el-col v-if="activeNoticeTab === 'period'" :span="1.5">
            <el-button v-hasPermi="['system:notice:add']" type="primary" plain icon="Calendar" @click="handleAddPeriodPush">新建周/月数据推送</el-button>
          </el-col>
          <el-col v-if="activeNoticeTab === 'notice'" :span="1.5">
            <el-button v-hasPermi="['system:notice:edit']" type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()"
              >修改</el-button
            >
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['system:notice:remove']" type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()">
              删除
            </el-button>
          </el-col>
          <el-col v-if="activeNoticeTab === 'notice'" :span="1.5">
            <el-button type="warning" plain icon="Top" :disabled="multiple" @click="batchPlaceholder('批量置顶')">批量置顶</el-button>
          </el-col>
          <el-col v-if="activeNoticeTab === 'notice'" :span="1.5">
            <el-button type="info" plain icon="RefreshLeft" :disabled="multiple" @click="batchPlaceholder('批量撤回')">批量撤回</el-button>
          </el-col>
          <el-col v-if="activeNoticeTab === 'notice'" :span="1.5">
            <el-button type="primary" plain icon="Timer" :disabled="multiple" @click="batchPlaceholder('批量设置有效期')">设置有效期</el-button>
          </el-col>
          <el-col v-if="activeNoticeTab === 'period'" :span="1.5">
            <el-button type="success" plain icon="Promotion" :disabled="multiple" @click="batchPlaceholder('批量补发未读')">批量补发未读</el-button>
          </el-col>
          <el-col v-if="activeNoticeTab === 'period'" :span="1.5">
            <el-button type="warning" plain icon="VideoPause" :disabled="multiple" @click="batchPlaceholder('暂停周期任务')">暂停周期任务</el-button>
          </el-col>
          <el-col v-if="activeNoticeTab === 'period'" :span="1.5">
            <el-button type="primary" plain icon="CaretRight" :disabled="multiple" @click="batchPlaceholder('立即手动执行')">立即手动执行</el-button>
          </el-col>
          <el-col v-if="activeNoticeTab === 'period'" :span="1.5">
            <el-button type="info" plain icon="Download" :disabled="multiple" @click="batchPlaceholder('导出推送明细')">导出推送明细</el-button>
          </el-col>
          <right-toolbar v-model:show-search="showSearch" @query-table="getList"></right-toolbar>
        </el-row>
      </template>

      <div v-if="activeNoticeTab === 'period'" class="period-overview">
        <el-tag type="primary" effect="plain">运行中周期推送任务 {{ periodOverview.running }} 个</el-tag>
        <el-tag type="primary" effect="plain">岗位/人才周报 {{ periodOverview.enterpriseWeekly }} 个</el-tag>
        <el-tag type="success" effect="plain">求职者月报 {{ periodOverview.jobSeekerMonthly }} 个</el-tag>
        <el-tag type="warning" effect="plain">本周已下发 {{ periodOverview.weekDelivered }} 条</el-tag>
        <el-tag type="info" effect="plain">企业HR平均阅读率 {{ periodOverview.enterpriseReadRate }}%</el-tag>
        <el-tag type="success" effect="plain">求职者平均阅读率 {{ periodOverview.jobSeekerReadRate }}%</el-tag>
        <el-tag type="danger" effect="plain">沉睡未读占比 {{ periodOverview.sleepUnreadRate }}%</el-tag>
      </div>

      <el-table v-loading="loading" border :data="noticeList" :row-class-name="noticeRowClassName" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column v-if="false" label="序号" align="center" prop="noticeId" width="100" />
        <el-table-column label="公告标题" align="center" prop="noticeTitle" min-width="220" :show-overflow-tooltip="true">
          <template #default="scope">
            <div class="notice-title-cell">
              <el-tag v-if="noticeMeta(scope.row).isTop" type="danger" size="small">置顶</el-tag>
              <el-tag v-if="noticeMeta(scope.row).isRed" type="danger" size="small" effect="plain">标红</el-tag>
              <span>{{ scope.row.noticeTitle }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="公告类型" align="center" prop="noticeType" width="100">
          <template #default="scope">
            <el-tag v-if="isPeriodNotice(scope.row)" :type="periodNoticeTypeMeta(periodNoticeTypeValue(scope.row)).tagType" size="small">
              {{ periodNoticeTypeMeta(periodNoticeTypeValue(scope.row)).label }}
            </el-tag>
            <dict-tag v-else :options="sys_notice_type" :value="scope.row.noticeType" />
          </template>
        </el-table-column>
        <el-table-column label="业务分类" align="center" width="120">
          <template #default="scope">
            <el-tag size="small" effect="plain">{{ optionLabel(businessCategoryOptions, noticeMeta(scope.row).businessCategory) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="推送范围" align="center" width="120">
          <template #default="scope">{{ noticePushRangeLabel(scope.row) }}</template>
        </el-table-column>
        <el-table-column v-if="activeNoticeTab === 'period'" label="推送周期" align="center" width="110">
          <template #default="scope">{{ optionLabel(periodCycleDisplayOptions, noticeMeta(scope.row).periodCycle) }}</template>
        </el-table-column>
        <el-table-column label="推送状态" align="center" prop="status" width="110">
          <template #default="scope">
            <el-tag :type="pushStatusMeta(noticeMeta(scope.row).pushStatus).type" size="small">{{ pushStatusMeta(noticeMeta(scope.row).pushStatus).label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="阅读率" align="center" width="110">
          <template #default="scope">
            <el-button link type="primary" @click="openReadRecord(scope.row)">{{ noticeMeta(scope.row).readRate }}%</el-button>
          </template>
        </el-table-column>
        <el-table-column label="未读人数" align="center" width="100">
          <template #default="scope">
            <el-popover placement="top" width="300" trigger="hover">
              <template #reference>
                <el-button link type="primary">{{ noticeMeta(scope.row).unreadCount }}</el-button>
              </template>
              <div class="notice-popover">
                <div class="notice-popover__title">未读分层明细</div>
                <div v-for="item in noticeUnreadLayers(scope.row)" :key="item.label" class="notice-popover__row">
                  <span>{{ item.label }}</span>
                  <strong>{{ item.value }}</strong>
                </div>
                <div class="notice-popover__actions">
                  <el-button size="small" type="primary" link @click="noticeActionPlaceholder(scope.row, '补发未读提醒')">补发未读</el-button>
                  <el-button size="small" type="primary" link @click="openReadRecord(scope.row)">查看明细</el-button>
                </div>
              </div>
            </el-popover>
          </template>
        </el-table-column>
        <el-table-column label="定时发布时间" align="center" width="160">
          <template #default="scope">{{ noticeMeta(scope.row).scheduleTime || '-' }}</template>
        </el-table-column>
        <el-table-column label="有效期" align="center" width="160">
          <template #default="scope">{{ noticeMeta(scope.row).validEndTime || '-' }}</template>
        </el-table-column>
        <el-table-column v-if="activeNoticeTab === 'notice'" label="强提醒" align="center" width="90">
          <template #default="scope">
            <el-tag :type="noticeMeta(scope.row).forcePopup === '1' ? 'warning' : 'info'" size="small">
              {{ noticeMeta(scope.row).forcePopup === '1' ? '弹窗' : '普通' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建者" align="center" prop="createByName" width="100" />
        <el-table-column label="创建时间" align="center" prop="createTime" width="100">
          <template #default="scope">
            <span>{{ proxy.parseTime(scope.row.createTime, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip v-if="activeNoticeTab === 'notice'" content="修改" placement="top">
              <el-button
                v-hasPermi="['system:notice:edit']"
                link
                type="primary"
                icon="Edit"
                :disabled="!canEditNotice(scope.row)"
                @click="handleUpdate(scope.row)"
              ></el-button>
            </el-tooltip>
            <el-tooltip v-if="activeNoticeTab === 'notice'" content="复制新建" placement="top">
              <el-button v-hasPermi="['system:notice:add']" link type="primary" icon="CopyDocument" @click="handleCopyNotice(scope.row)"></el-button>
            </el-tooltip>
            <el-tooltip v-if="activeNoticeTab === 'notice'" content="撤回" placement="top">
              <el-button
                link
                type="primary"
                icon="RefreshLeft"
                :disabled="!canWithdrawNotice(scope.row)"
                @click="handleWithdrawNotice(scope.row)"
              ></el-button>
            </el-tooltip>
            <el-tooltip v-if="activeNoticeTab === 'notice'" content="重新发送" placement="top">
              <el-button
                v-hasPermi="['system:notice:edit']"
                link
                type="primary"
                icon="Promotion"
                :disabled="!canResendNotice(scope.row)"
                @click="handleResendNotice(scope.row)"
              ></el-button>
            </el-tooltip>
            <el-tooltip v-if="activeNoticeTab === 'period'" content="终止推送" placement="top">
              <el-button link type="primary" icon="CircleClose" @click="handleStopPeriodNotice(scope.row)"></el-button>
            </el-tooltip>
            <el-tooltip v-if="activeNoticeTab === 'notice'" content="延长有效期" placement="top">
              <el-button link type="primary" icon="Timer" @click="noticeActionPlaceholder(scope.row, '延长有效期')"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button v-hasPermi="['system:notice:remove']" link type="primary" icon="Delete" @click="handleDelete(scope.row)"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>
    <!-- 添加或修改公告对话框 -->
    <el-dialog v-model="dialog.visible" :title="dialog.title" width="780px" append-to-body>
      <el-form ref="noticeFormRef" :model="form" :rules="rules" label-width="80px">
        <el-row>
          <el-col :span="24">
            <el-form-item label="模板库">
              <el-select placeholder="选择常用模板" clearable style="width: 260px" @change="applyNoticeTemplate">
                <el-option v-for="item in noticeTemplateOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
              <el-button class="ml-2" type="primary" plain @click="noticeActionPlaceholder(form, '保存为模板')">保存为模板</el-button>
              <el-button plain @click="previewDialog.visible = true">预览</el-button>
              <el-button type="success" plain @click="noticeActionPlaceholder(form, '测试推送')">测试推送</el-button>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="公告标题" prop="noticeTitle">
              <el-input v-model="form.noticeTitle" placeholder="请输入公告标题" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="公告类型" prop="noticeType">
              <el-select v-model="form.noticeType" placeholder="请选择">
                <el-option v-for="dict in sys_notice_type" :key="dict.value" :label="dict.label" :value="dict.value"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="业务分类" prop="businessCategory">
              <el-select v-model="form.businessCategory" placeholder="请选择业务分类">
                <el-option v-for="item in businessCategoryOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="推送范围" prop="pushRange">
              <el-select v-model="form.pushRange" placeholder="请选择推送范围">
                <el-option v-for="item in pushRangeOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="接收人群" prop="audienceType">
              <el-select v-model="form.audienceType" placeholder="请选择接收人群">
                <el-option v-for="item in audienceTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col v-if="form.audienceType === 'all'" :span="24">
            <el-form-item label="全员范围" prop="targetAllScope">
              <el-select v-model="form.targetAllScope" placeholder="请选择全员范围">
                <el-option v-for="item in allAudienceScopeOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col v-if="form.audienceType === 'dept'" :span="24">
            <el-form-item label="选择部门" prop="targetDeptIds">
              <el-tree-select
                v-model="form.targetDeptIds"
                :data="deptOptions"
                :props="{ value: 'id', label: 'label', children: 'children' }"
                value-key="id"
                multiple
                check-strictly
                collapse-tags
                collapse-tags-tooltip
                placeholder="请选择接收部门"
              />
            </el-form-item>
          </el-col>
          <el-col v-if="form.audienceType === 'user'" :span="24">
            <el-form-item label="人员类型" prop="targetUserSegment">
              <el-radio-group v-model="form.targetUserSegment">
                <el-radio-button label="internal">内部人员</el-radio-button>
                <el-radio-button label="business">B端企业用户</el-radio-button>
                <el-radio-button label="jobSeeker">C端求职者</el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col v-if="form.audienceType === 'user'" :span="24">
            <el-form-item label="选择人员" prop="targetUserIds">
              <el-select v-model="form.targetUserIds" multiple filterable collapse-tags collapse-tags-tooltip placeholder="请选择接收人员">
                <el-option
                  v-for="item in filteredUserOptions"
                  :key="item.userId"
                  :label="formatNoticeUserLabel(item)"
                  :value="item.userId"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col v-if="form.audienceType === 'role'" :span="24">
            <el-form-item label="选择角色" prop="targetRoleIds">
              <el-select v-model="form.targetRoleIds" multiple filterable collapse-tags collapse-tags-tooltip placeholder="请选择接收角色">
                <el-option v-for="item in roleOptions" :key="item.roleId" :label="item.roleName" :value="item.roleId" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col v-if="form.audienceType === 'tag'" :span="24">
            <el-form-item label="用户标签" prop="targetTags">
              <el-select v-model="form.targetTags" multiple filterable allow-create default-first-option collapse-tags placeholder="输入或选择用户标签">
                <el-option v-for="item in userTagOptions" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="定时发布" prop="scheduleTime">
              <el-date-picker v-model="form.scheduleTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择时间" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="有效期至" prop="validEndTime">
              <el-date-picker v-model="form.validEndTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="自动下线时间" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="排除名单">
              <el-select
                v-model="form.excludeUsers"
                multiple
                filterable
                collapse-tags
                collapse-tags-tooltip
                :disabled="form.audienceType !== 'all'"
                placeholder="请选择全员范围内不接收本次公告的用户"
              >
                <el-option
                  v-for="item in excludeUserOptions"
                  :key="item.userId"
                  :label="formatNoticeUserLabel(item)"
                  :value="item.userId"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="状态">
              <el-radio-group v-model="form.status">
                <el-radio v-for="dict in sys_notice_status" :key="dict.value" :value="dict.value">{{ dict.label }}</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="内容">
              <editor v-model="form.noticeContent" :min-height="192" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="previewDialog.visible" title="公告预览" width="720px" append-to-body>
      <div class="notice-preview">
        <div class="notice-preview__pc">
          <div class="notice-preview__title">{{ form.noticeTitle || '公告标题' }}</div>
          <div class="notice-preview__meta">
            {{ optionLabel(businessCategoryOptions, form.businessCategory || 'system') }} ·
            {{ optionLabel(pushRangeOptions, form.pushRange || 'internal') }}
          </div>
          <div class="notice-preview__content" v-html="form.noticeContent || '公告内容预览'"></div>
        </div>
      </div>
    </el-dialog>

    <el-dialog v-model="periodDialog.visible" title="新建周期数据推送" width="860px" append-to-body>
      <el-form ref="periodFormRef" :model="periodForm" :rules="periodRules" label-width="120px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="推送名称" prop="noticeTitle">
              <el-input v-model="periodForm.noticeTitle" placeholder="请输入周期推送名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="报表类型" prop="noticeType">
              <el-select v-model="periodForm.noticeType" placeholder="请选择报表类型">
                <el-option v-for="item in periodNoticeTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="推送对象" prop="dataAudience">
              <el-select v-model="periodForm.dataAudience" placeholder="请选择推送对象">
                <el-option v-for="item in periodAudienceOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="分层企业/用户" prop="segmentTag">
              <el-select v-model="periodForm.segmentTag" placeholder="请选择分层">
                <el-option v-for="item in periodSegmentOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="推送周期" prop="periodCycle">
              <el-select v-model="periodForm.periodCycle" placeholder="请选择周期">
                <el-option v-for="item in periodCycleConfigOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col v-if="periodForm.periodCycle === 'weekly'" :span="12">
            <el-form-item label="每周发送日" prop="weekDay">
              <el-select v-model="periodForm.weekDay" placeholder="请选择">
                <el-option label="周一" value="monday" />
                <el-option label="周五" value="friday" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="发送时间" prop="sendTime">
              <el-time-picker v-model="periodForm.sendTime" value-format="HH:mm" format="HH:mm" placeholder="推荐 10:00 / 15:00" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="生效开始" prop="periodStartTime">
              <el-date-picker v-model="periodForm.periodStartTime" type="date" value-format="YYYY-MM-DD" placeholder="请选择开始日期" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitPeriodForm">确 定</el-button>
          <el-button @click="periodDialog.visible = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Notice" lang="ts">
import { listNotice, getNotice, delNotice, addNotice, addPeriodNotice, updateNotice, withdrawNotice, resendNotice, stopPeriodNotice } from '@/api/system/notice';
import { NoticeForm, NoticeQuery, NoticeVO } from '@/api/system/notice/types';
import { deptTreeSelect, listBusinessUsers, listJobSeekerUsers, listUser } from '@/api/system/user';
import { listRole } from '@/api/system/role';
import { DeptTreeVO } from '@/api/system/dept/types';
import { UserVO } from '@/api/system/user/types';
import { RoleVO } from '@/api/system/role/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { sys_notice_status, sys_notice_type } = toRefs<any>(proxy?.useDict('sys_notice_status', 'sys_notice_type'));

const noticeList = ref<NoticeVO[]>([]);
const loading = ref(true);
const showSearch = ref(true);
const activeNoticeTab = ref<'notice' | 'period'>('notice');
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const noticeFormRef = ref<ElFormInstance>();
const periodFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});
const previewDialog = reactive<DialogOption>({
  visible: false,
  title: ''
});
const periodDialog = reactive<DialogOption>({
  visible: false,
  title: ''
});
const publishDateRange = ref<[DateModelType, DateModelType]>(['', '']);

type NoticeOption = { label: string; value: string };
type NoticeTagType = 'success' | 'warning' | 'info' | 'primary' | 'danger';
type PeriodNoticeOption = NoticeOption & { tagType: NoticeTagType; audience: 'business' | 'jobSeeker' };
type NoticeAudienceUser = UserVO & {
  sourceSegment?: 'internal' | 'business' | 'jobSeeker';
  memberRole?: string;
  memberRoleName?: string;
};
type PeriodDataForm = {
  noticeTitle: string;
  noticeType: string;
  dataAudience: 'business' | 'jobSeeker';
  segmentTag: string;
  periodCycle: 'weekly' | 'monthly';
  weekDay: 'monday' | 'friday';
  sendTime: string;
  periodStartTime: string;
};

const businessCategoryOptions: NoticeOption[] = [
  { label: '系统公告', value: 'system' },
  { label: '活动通知', value: 'activity' },
  { label: '人事通知', value: 'hr' },
  { label: '风控告警', value: 'risk' },
  { label: '运维公告', value: 'ops' },
  { label: '数据报表', value: 'data_report' }
];
const pushRangeOptions: NoticeOption[] = [
  { label: '对内', value: 'internal' },
  { label: '对外', value: 'external' },
  { label: '内外全部', value: 'all' }
];
const pushStatusOptions: Array<NoticeOption & { type: NoticeTagType }> = [
  { label: '未发布', value: 'draft', type: 'info' },
  { label: '已定时', value: 'scheduled', type: 'warning' },
  { label: '已发布', value: 'published', type: 'success' },
  { label: '已撤回', value: 'withdrawn', type: 'danger' },
  { label: '已过期', value: 'expired', type: 'info' }
];
const periodNoticeTypeOptions: PeriodNoticeOption[] = [
  { label: '本周岗位/人才数量周报', value: 'enterprise_weekly_report', tagType: 'primary', audience: 'business' },
  { label: '本周岗位/人才数量月报', value: 'enterprise_monthly_report', tagType: 'primary', audience: 'business' },
  { label: '求职者投递情况周报', value: 'jobseeker_weekly_report', tagType: 'success', audience: 'jobSeeker' },
  { label: '求职者投递情况月报', value: 'jobseeker_monthly_report', tagType: 'success', audience: 'jobSeeker' }
];
const noticeTypeOptions = computed<NoticeOption[]>(() => {
  if (activeNoticeTab.value === 'period') {
    return periodNoticeTypeOptions;
  }
  return (sys_notice_type.value || []).map((item: any) => ({ label: item.label, value: item.value }));
});
const periodCycleFilterOptions: NoticeOption[] = [
  { label: '单次推送', value: 'once' },
  { label: '每周周期', value: 'weekly' },
  { label: '每月周期', value: 'monthly' }
];
const periodCycleConfigOptions: NoticeOption[] = [
  { label: '每周自动', value: 'weekly' },
  { label: '每月自动', value: 'monthly' }
];
const periodCycleDisplayOptions: NoticeOption[] = [
  { label: '一次性', value: 'once' },
  { label: '每周自动', value: 'weekly' },
  { label: '每月自动', value: 'monthly' }
];
const periodAudienceOptions: NoticeOption[] = [
  { label: 'B端企业', value: 'business' },
  { label: 'C端求职者', value: 'jobSeeker' }
];
const segmentTagOptions: NoticeOption[] = [
  { label: 'B端企业', value: 'business' },
  { label: 'C端求职者', value: 'jobSeeker' },
  { label: '高价值客户', value: 'high_value' },
  { label: '沉睡客户', value: 'sleep' },
  { label: '新人', value: 'new' },
  { label: '风险客户', value: 'risk' },
  { label: '高意向求职者', value: 'high_intent' },
  { label: '沉睡流失求职者', value: 'jobseeker_sleep' },
  { label: '空白简历新人', value: 'blank_resume' }
];
const businessSegmentOptions: NoticeOption[] = [
  { label: '全部入驻企业', value: 'all_business' },
  { label: '高价值付费企业', value: 'high_value' },
  { label: '沉睡零产出企业', value: 'sleep' },
  { label: '新入驻企业', value: 'new' },
  { label: '风险违规企业', value: 'risk' }
];
const jobSeekerSegmentOptions: NoticeOption[] = [
  { label: '全部注册求职者', value: 'all_jobseeker' },
  { label: '高意向活跃求职者', value: 'high_intent' },
  { label: '沉睡流失求职者', value: 'jobseeker_sleep' },
  { label: '空白简历新人', value: 'blank_resume' }
];
const periodTargetSegmentOptions: NoticeOption[] = [
  { label: 'B端企业', value: 'business' },
  { label: 'C端求职者', value: 'jobSeeker' }
];
const periodStatusOptions: Array<NoticeOption & { type: NoticeTagType }> = [
  { label: '运行中', value: 'running', type: 'success' },
  { label: '已暂停', value: 'paused', type: 'warning' },
  { label: '已到期', value: 'expired', type: 'info' }
];
const audienceTypeOptions: NoticeOption[] = [
  { label: '全员', value: 'all' },
  { label: '指定部门', value: 'dept' },
  { label: '指定人员', value: 'user' },
  { label: '指定角色', value: 'role' },
  { label: '自定义标签用户', value: 'tag' }
];
const allAudienceScopeOptions: NoticeOption[] = [
  { label: '内部全员', value: 'internal_all' },
  { label: 'B端企业管理员', value: 'business_admin' },
  { label: 'B端总经理', value: 'business_general_manager' },
  { label: 'B端普通HR', value: 'business_hr' },
  { label: 'C端所有求职者', value: 'job_seeker_all' }
];
const userTagOptions = ['高意向求职者', 'VIP', '应届生', '沉睡用户', '风险用户'];
const deptOptions = ref<DeptTreeVO[]>([]);
const userOptions = ref<NoticeAudienceUser[]>([]);
const roleOptions = ref<RoleVO[]>([]);
const filteredUserOptions = computed(() => userOptions.value.filter((item) => noticeUserSegment(item) === (form.value.targetUserSegment || 'internal')));
const excludeUserOptions = computed(() => userOptions.value.filter((item) => matchAllAudienceScope(item, form.value.targetAllScope)));
const periodSegmentOptions = computed(() => periodTargetSegmentOptions);
const noticeTemplateOptions = [
  {
    label: '系统维护通知',
    value: 'systemOps',
    data: {
      noticeTitle: '系统维护通知',
      businessCategory: 'ops',
      pushRange: 'internal',
      audienceType: 'all',
      forcePopup: '1',
      noticeContent: '<p>平台将进行系统维护，请相关人员提前保存工作内容。</p>'
    }
  },
  {
    label: '活动通知',
    value: 'activity',
    data: {
      noticeTitle: '活动通知',
      businessCategory: 'activity',
      pushRange: 'external',
      audienceType: 'tag',
      forcePopup: '0',
      noticeContent: '<p>平台活动已上线，请关注活动规则与参与时间。</p>'
    }
  },
  {
    label: '人事通知',
    value: 'hr',
    data: {
      noticeTitle: '人事通知',
      businessCategory: 'hr',
      pushRange: 'internal',
      audienceType: 'dept',
      forcePopup: '1',
      noticeContent: '<p>请相关同事关注最新人事通知并按要求处理。</p>'
    }
  }
];

const initFormData: NoticeForm = {
  noticeId: undefined,
  noticeTitle: '',
  noticeType: '',
  noticeContent: '',
  status: '0',
  remark: '',
  createByName: '',
  businessCategory: 'system',
  pushRange: 'internal',
  pushStatus: 'draft',
  audienceType: 'all',
  targetAllScope: 'internal_all',
  targetUserSegment: 'internal',
  targetDeptIds: [],
  targetUserIds: [],
  targetRoleIds: [],
  targetTags: [],
  scheduleTime: '',
  validEndTime: '',
  forcePopup: '0',
  forceRead: '0',
  channelInSite: '1',
  channelApp: '0',
  channelSms: '0',
  excludeUsers: []
};
const initPeriodFormData: PeriodDataForm = {
  noticeTitle: '',
  noticeType: 'enterprise_weekly_report',
  dataAudience: 'business',
  segmentTag: 'business',
  periodCycle: 'weekly',
  weekDay: 'monday',
  sendTime: '10:00',
  periodStartTime: ''
};
const data = reactive<PageData<NoticeForm, NoticeQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    noticeTitle: '',
    createByName: '',
    status: '',
    noticeType: '',
    businessCategory: '',
    pushStatus: '',
    audienceType: '',
    periodCycle: '',
    dataAudience: '',
    segmentTag: '',
    periodStatus: '',
    keyword: '',
    isTop: '',
    isRed: ''
  },
  rules: {
    noticeTitle: [{ required: true, message: '公告标题不能为空', trigger: 'blur' }],
    noticeType: [{ required: true, message: '公告类型不能为空', trigger: 'change' }]
  }
});

const { queryParams, form, rules } = toRefs(data);
const periodForm = ref<PeriodDataForm>({ ...initPeriodFormData });
const periodRules = {
  noticeTitle: [{ required: true, message: '推送名称不能为空', trigger: 'blur' }],
  noticeType: [{ required: true, message: '报表类型不能为空', trigger: 'change' }],
  dataAudience: [{ required: true, message: '推送对象不能为空', trigger: 'change' }],
  segmentTag: [{ required: true, message: '分层不能为空', trigger: 'change' }],
  periodCycle: [{ required: true, message: '推送周期不能为空', trigger: 'change' }],
  sendTime: [{ required: true, message: '发送时间不能为空', trigger: 'change' }],
  periodStartTime: [{ required: true, message: '生效开始不能为空', trigger: 'change' }]
};

/** 查询公告列表 */
const getList = async () => {
  loading.value = true;
  const res = await listNotice(buildNoticeListQuery());
  const rows = filterNoticeRows(res.rows || []);
  noticeList.value = sortNoticeRows(rows);
  total.value = hasLocalNoticeFilter() ? rows.length : res.total;
  loading.value = false;
};

const buildNoticeListQuery = (): NoticeQuery => ({
  pageNum: queryParams.value.pageNum,
  pageSize: queryParams.value.pageSize,
  noticeTitle: queryParams.value.noticeTitle,
  createByName: queryParams.value.createByName,
  status: queryParams.value.status,
  noticeType: isPeriodNoticeType(queryParams.value.noticeType) ? '' : queryParams.value.noticeType,
  businessCategory: queryParams.value.businessCategory,
  pushStatus: queryParams.value.pushStatus,
  audienceType: queryParams.value.audienceType,
  periodCycle: queryParams.value.periodCycle,
  dataAudience: queryParams.value.dataAudience,
  segmentTag: queryParams.value.segmentTag,
  periodStatus: queryParams.value.periodStatus
});

const hasLocalNoticeFilter = () => {
  return !!(
    queryParams.value.keyword ||
    queryParams.value.isTop ||
    queryParams.value.isRed ||
    activeNoticeTab.value ||
    isPeriodNoticeType(queryParams.value.noticeType) ||
    queryParams.value.periodCycle ||
    queryParams.value.dataAudience ||
    queryParams.value.segmentTag ||
    queryParams.value.periodStatus ||
    publishDateRange.value[0] ||
    publishDateRange.value[1]
  );
};

const optionLabel = (options: NoticeOption[], value?: string) => options.find((item) => item.value === value)?.label || '-';

const pushStatusMeta = (value?: string) => pushStatusOptions.find((item) => item.value === value) || pushStatusOptions[0];
const periodNoticeTypeMeta = (value?: string) =>
  periodNoticeTypeOptions.find((item) => item.value === value) || ({ label: '通知', value: value || '', tagType: 'warning', audience: 'business' } as PeriodNoticeOption);
const isPeriodNoticeType = (value?: string) => periodNoticeTypeOptions.some((item) => item.value === value);
const periodNoticeTypeValue = (row: NoticeVO) => row.dataReportType || (isPeriodNoticeType(row.noticeType) ? row.noticeType : '');
const isPeriodNotice = (row: NoticeVO) => !!row.periodCycle || isPeriodNoticeType(row.noticeType) || isPeriodNoticeType(row.dataReportType);
const segmentLabel = (value?: string) => optionLabel([...businessSegmentOptions, ...jobSeekerSegmentOptions, ...segmentTagOptions], value);

const noticeMeta = (row: NoticeVO) => {
  const validEndTime = row.validEndTime || '';
  const expired = validEndTime ? new Date(validEndTime).getTime() < Date.now() : false;
  const scheduled = row.scheduleTime ? new Date(row.scheduleTime).getTime() > Date.now() : false;
  const pushStatus = expired ? 'expired' : row.pushStatus || (scheduled ? 'scheduled' : row.status === '0' ? 'published' : 'draft');
  return {
    businessCategory: row.businessCategory || 'system',
    pushRange: row.pushRange || 'internal',
    pushStatus,
    audienceType: row.audienceType || 'all',
    readRate: row.readRate ?? 0,
    unreadCount: row.unreadCount ?? 0,
    scheduleTime: row.scheduleTime || '',
    validEndTime,
    forcePopup: row.forcePopup || '0',
    isTop: row.isTop === '1',
    isRed: row.isRed === '1',
    periodCycle: row.periodCycle || 'once',
    dataAudience: row.dataAudience || (isPeriodNotice(row) ? periodNoticeTypeMeta(periodNoticeTypeValue(row)).audience : ''),
    segmentTag: row.segmentTag || '',
    periodStatus: row.periodStatus || (expired ? 'expired' : row.periodCycle && row.periodCycle !== 'once' ? 'running' : ''),
    unreadLayerSummary: row.unreadLayerSummary || ''
  };
};

const periodOverview = computed(() => {
  const rows = noticeList.value.filter((row) => isPeriodNotice(row));
  const enterpriseRows = rows.filter((row) => noticeMeta(row).dataAudience === 'business');
  const jobSeekerRows = rows.filter((row) => noticeMeta(row).dataAudience === 'jobSeeker');
  const averageRate = (list: NoticeVO[]) => {
    if (!list.length) return 0;
    const totalRate = list.reduce((sum, row) => sum + Number(noticeMeta(row).readRate || 0), 0);
    return Number((totalRate / list.length).toFixed(1));
  };
  const sleepRows = rows.filter((row) => ['sleep', 'jobseeker_sleep'].includes(noticeMeta(row).segmentTag));
  const sleepUnreadTotal = sleepRows.reduce((sum, row) => sum + Number(noticeMeta(row).unreadCount || 0), 0);
  const unreadTotal = rows.reduce((sum, row) => sum + Number(noticeMeta(row).unreadCount || 0), 0);
  return {
    running: rows.filter((row) => noticeMeta(row).periodStatus === 'running').length,
    enterpriseWeekly: rows.filter((row) => periodNoticeTypeValue(row) === 'enterprise_weekly_report').length,
    jobSeekerMonthly: rows.filter((row) => periodNoticeTypeValue(row) === 'jobseeker_monthly_report').length,
    weekDelivered: rows.filter((row) => noticeMeta(row).pushStatus === 'published').length,
    enterpriseReadRate: averageRate(enterpriseRows),
    jobSeekerReadRate: averageRate(jobSeekerRows),
    sleepUnreadRate: unreadTotal ? Number(((sleepUnreadTotal / unreadTotal) * 100).toFixed(1)) : 0
  };
});

const noticePushRangeLabel = (row: NoticeVO) => {
  const meta = noticeMeta(row);
  if (isPeriodNotice(row)) return segmentLabel(meta.segmentTag) || optionLabel(periodAudienceOptions, meta.dataAudience);
  return optionLabel(pushRangeOptions, meta.pushRange);
};

const noticeUnreadLayers = (row: NoticeVO) => {
  const meta = noticeMeta(row);
  if (!isPeriodNotice(row)) {
    return [
      { label: '未读人数', value: meta.unreadCount },
      { label: '阅读率', value: `${meta.readRate}%` }
    ];
  }
  if (meta.unreadLayerSummary) {
    return String(meta.unreadLayerSummary)
      .split(/[;；,，]/)
      .map((item) => {
        const [label, value] = item.split(/[:：]/);
        return { label: label || '未读', value: value || '-' };
      });
  }
  if (meta.dataAudience === 'business') {
    return [
      { label: '总推送HR数', value: row.targetUserCount ?? '-' },
      { label: '已读人数', value: row.readCount ?? '-' },
      { label: '未读沉睡企业数量', value: row.sleepUnreadCount ?? meta.unreadCount }
    ];
  }
  return [
    { label: '总推送人数', value: row.targetUserCount ?? '-' },
    { label: '高意向已读', value: row.highIntentReadCount ?? '-' },
    { label: '流失未读人数', value: row.sleepUnreadCount ?? meta.unreadCount }
  ];
};

const filterNoticeRows = (rows: NoticeVO[]) => {
  const keyword = queryParams.value.keyword?.trim();
  const [beginTime, endTime] = publishDateRange.value;
  return rows.filter((row) => {
    const meta = noticeMeta(row);
    const periodRow = isPeriodNotice(row);
    if (activeNoticeTab.value === 'period' && !periodRow) return false;
    if (activeNoticeTab.value === 'notice' && periodRow) return false;
    if (queryParams.value.noticeType) {
      const matchType = isPeriodNoticeType(queryParams.value.noticeType)
        ? periodNoticeTypeValue(row) === queryParams.value.noticeType
        : row.noticeType === queryParams.value.noticeType;
      if (!matchType) return false;
    }
    if (queryParams.value.businessCategory && meta.businessCategory !== queryParams.value.businessCategory) return false;
    if (queryParams.value.pushStatus && meta.pushStatus !== queryParams.value.pushStatus) return false;
    if (queryParams.value.audienceType && meta.audienceType !== queryParams.value.audienceType) return false;
    if (queryParams.value.periodCycle && meta.periodCycle !== queryParams.value.periodCycle) return false;
    if (queryParams.value.dataAudience && meta.dataAudience !== queryParams.value.dataAudience) return false;
    if (queryParams.value.segmentTag && meta.segmentTag !== queryParams.value.segmentTag) return false;
    if (queryParams.value.periodStatus && meta.periodStatus !== queryParams.value.periodStatus) return false;
    if (queryParams.value.isTop && !meta.isTop) return false;
    if (queryParams.value.isRed && !meta.isRed) return false;
    if (keyword && !`${row.noticeTitle || ''}${row.noticeContent || ''}${row.remark || ''}`.includes(keyword)) return false;
    if (beginTime && row.createTime && new Date(row.createTime).getTime() < new Date(String(beginTime)).getTime()) return false;
    if (endTime && row.createTime && new Date(row.createTime).getTime() > new Date(String(endTime)).getTime()) return false;
    return true;
  });
};

const sortNoticeRows = (rows: NoticeVO[]) => {
  return [...rows].sort((a, b) => {
    const aMeta = noticeMeta(a);
    const bMeta = noticeMeta(b);
    if (aMeta.isTop !== bMeta.isTop) return aMeta.isTop ? -1 : 1;
    if (aMeta.pushStatus === 'expired' && bMeta.pushStatus !== 'expired') return 1;
    if (bMeta.pushStatus === 'expired' && aMeta.pushStatus !== 'expired') return -1;
    return new Date(b.createTime || '').getTime() - new Date(a.createTime || '').getTime();
  });
};

const noticeRowClassName = ({ row }: { row: NoticeVO }) => {
  const meta = noticeMeta(row);
  if (meta.isTop || meta.isRed) return 'notice-row-important';
  if (meta.pushStatus === 'expired') return 'notice-row-expired';
  return '';
};

const openReadRecord = (row: NoticeVO) => {
  ElMessage.info(`阅读明细待接入：${row.noticeTitle || row.noticeId}`);
};

const noticeActionPlaceholder = (row: Partial<NoticeVO>, action: string) => {
  ElMessage.info(`${action}待接入：${row.noticeTitle || row.noticeId || '当前公告'}`);
};

const canEditNotice = (row: NoticeVO) => noticeMeta(row).pushStatus !== 'published';

const canResendNotice = (row: NoticeVO) => ['withdrawn', 'draft'].includes(noticeMeta(row).pushStatus);

const canWithdrawNotice = (row: NoticeVO) => {
  const meta = noticeMeta(row);
  const publishTime = row.publishTime || row.createTime || meta.scheduleTime;
  if (meta.pushStatus !== 'published' || !publishTime) return false;
  return Date.now() - new Date(publishTime).getTime() <= 5 * 60 * 1000;
};

const handleWithdrawNotice = async (row: NoticeVO) => {
  if (!canWithdrawNotice(row)) {
    ElMessage.warning('仅支持公告发布后5分钟内撤回');
    return;
  }
  await proxy?.$modal.confirm(`确认撤回公告"${row.noticeTitle}"吗？`);
  await withdrawNotice(row.noticeId, '运营撤回');
  proxy?.$modal.msgSuccess('撤回成功');
  await getList();
};

const handleResendNotice = async (row: NoticeVO) => {
  if (!canResendNotice(row)) {
    ElMessage.warning('仅草稿或已撤回公告支持重新发送');
    return;
  }
  await proxy?.$modal.confirm(`确认重新发送公告"${row.noticeTitle}"吗？如存在未来定时发布时间，将按定时任务发送。`);
  await resendNotice(row.noticeId);
  proxy?.$modal.msgSuccess('操作成功');
  await getList();
};

const handleStopPeriodNotice = async (row: NoticeVO) => {
  await proxy?.$modal.confirm(`确认终止"${row.noticeTitle}"的周/月推送吗？`);
  await stopPeriodNotice(row.noticeId);
  proxy?.$modal.msgSuccess('终止成功');
  await getList();
};

const batchPlaceholder = (action: string) => {
  ElMessage.info(`${action}待接入，已选 ${ids.value.length} 条`);
};

const applyNoticeTemplate = (value: string) => {
  const template = noticeTemplateOptions.find((item) => item.value === value);
  if (!template) return;
  Object.assign(form.value, template.data);
};

const loadAudienceOptions = async () => {
  const [deptRes, userRes, businessRes, jobSeekerRes, roleRes] = await Promise.all([
    deptTreeSelect(),
    listUser({ pageNum: 1, pageSize: 10000, userName: '', nickName: '', phonenumber: '', status: '' }),
    listBusinessUsers({ pageNum: 1, pageSize: 10000 }),
    listJobSeekerUsers({ pageNum: 1, pageSize: 10000 }),
    listRole({ pageNum: 1, pageSize: 10000, roleName: '', roleKey: '', status: '' })
  ]);
  deptOptions.value = normalizeNoticeDeptOptions(deptRes.data || []);
  userOptions.value = mergeNoticeAudienceUsers(userRes.rows || [], businessRes.rows || [], jobSeekerRes.rows || []);
  roleOptions.value = roleRes.rows || [];
};

const mergeNoticeAudienceUsers = (internalRows: any[], businessRows: any[], jobSeekerRows: any[]) => {
  const result = new Map<string | number, NoticeAudienceUser>();
  internalRows
    .filter((row) => noticeUserSegment(row) === 'internal')
    .forEach((row) => result.set(row.userId, { ...row, sourceSegment: 'internal' }));
  businessRows.forEach((row) => {
    const userId = row.userId || row.companyId;
    if (!userId) return;
    result.set(userId, {
      ...row,
      userId,
      userName: row.userName || row.contactPhone || String(userId),
      nickName: row.nickName || row.contactPerson || row.companyName || '',
      phonenumber: row.phonenumber || row.contactPhone || '',
      userType: 'B',
      sourceSegment: 'business',
      memberRole: row.memberRole,
      memberRoleName: row.memberRoleName
    } as NoticeAudienceUser);
  });
  jobSeekerRows.forEach((row) => {
    if (!row.userId) return;
    result.set(row.userId, {
      ...row,
      userName: row.userName || String(row.userId),
      nickName: row.realName || row.nickName || '',
      phonenumber: row.resumePhone || row.phone || row.phonenumber || row.accountPhone || '',
      userType: row.userType || 'C',
      sourceSegment: 'jobSeeker'
    } as NoticeAudienceUser);
  });
  return Array.from(result.values());
};

const normalizeNoticeDeptOptions = (list: DeptTreeVO[]) => {
  if (list.length === 1 && String(list[0].label) === '全部' && Array.isArray(list[0].children)) {
    return list[0].children;
  }
  return list;
};

const noticeUserSegment = (row: UserVO) => {
  if ((row as NoticeAudienceUser).sourceSegment) return (row as NoticeAudienceUser).sourceSegment;
  if (row.userType === 'B') return 'business';
  if (row.userType === 'C' || row.userType === 'app_user') return 'jobSeeker';
  return 'internal';
};

const matchAllAudienceScope = (row: NoticeAudienceUser, scope?: string) => {
  const segment = noticeUserSegment(row);
  if (scope === 'internal_all') return segment === 'internal';
  if (scope === 'business_admin') return segment === 'business' && row.memberRole === 'admin';
  if (scope === 'business_general_manager') return segment === 'business' && row.memberRole === 'general_manager';
  if (scope === 'business_hr') return segment === 'business' && row.memberRole === 'recruiter';
  if (scope === 'job_seeker_all') return segment === 'jobSeeker';
  return false;
};

const noticeUserSegmentLabel = (row: UserVO) => {
  const segment = noticeUserSegment(row);
  if (segment === 'business') return 'B端';
  if (segment === 'jobSeeker') return 'C端';
  return '内部';
};

const formatNoticeUserLabel = (row: UserVO) => {
  const name = row.nickName || row.userName || row.phonenumber || row.userId;
  const account = row.userName || row.phonenumber || row.userId;
  const roleName = (row as NoticeAudienceUser).memberRoleName ? ` / ${(row as NoticeAudienceUser).memberRoleName}` : '';
  return `${name}（${account} / ${noticeUserSegmentLabel(row)}${roleName}）`;
};

watch(
  () => form.value.audienceType,
  (value) => {
    if (value !== 'all') form.value.targetAllScope = '';
    if (value === 'all' && !form.value.targetAllScope) form.value.targetAllScope = 'internal_all';
    if (value !== 'all') form.value.excludeUsers = [];
    if (value !== 'dept') form.value.targetDeptIds = [];
    if (value !== 'user') form.value.targetUserIds = [];
    if (value !== 'role') form.value.targetRoleIds = [];
    if (value !== 'tag') form.value.targetTags = [];
  }
);

watch(
  () => form.value.targetUserSegment,
  () => {
    form.value.targetUserIds = [];
  }
);

watch(
  () => form.value.targetAllScope,
  () => {
    form.value.excludeUsers = [];
  }
);

watch(
  () => periodForm.value.dataAudience,
  (value) => {
    if (value === 'business') {
      periodForm.value.noticeType = periodForm.value.periodCycle === 'monthly' ? 'enterprise_monthly_report' : 'enterprise_weekly_report';
      periodForm.value.segmentTag = 'business';
      return;
    }
    periodForm.value.noticeType = periodForm.value.periodCycle === 'monthly' ? 'jobseeker_monthly_report' : 'jobseeker_weekly_report';
    periodForm.value.segmentTag = 'jobSeeker';
  }
);

watch(
  () => periodForm.value.periodCycle,
  (value) => {
    const isBusiness = periodForm.value.dataAudience === 'business';
    periodForm.value.noticeType = isBusiness
      ? value === 'monthly'
        ? 'enterprise_monthly_report'
        : 'enterprise_weekly_report'
      : value === 'monthly'
        ? 'jobseeker_monthly_report'
        : 'jobseeker_weekly_report';
  }
);

watch(
  () => periodForm.value.segmentTag,
  (value) => {
    if (value === 'business' || value === 'jobSeeker') {
      periodForm.value.dataAudience = value;
    }
  }
);

/** 取消按钮 */
const cancel = () => {
  reset();
  dialog.visible = false;
};
/** 表单重置 */
const reset = () => {
  form.value = { ...initFormData };
  noticeFormRef.value?.resetFields();
};
/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

const handleNoticeTabChange = () => {
  ids.value = [];
  single.value = true;
  multiple.value = true;
  queryParams.value.pageNum = 1;
  if (activeNoticeTab.value === 'notice') {
    if (isPeriodNoticeType(queryParams.value.noticeType)) queryParams.value.noticeType = '';
    queryParams.value.periodCycle = '';
    queryParams.value.dataAudience = '';
    queryParams.value.segmentTag = '';
    queryParams.value.periodStatus = '';
  } else if (queryParams.value.noticeType && !isPeriodNoticeType(queryParams.value.noticeType)) {
    queryParams.value.noticeType = '';
  }
  getList();
};

/** 重置按钮操作 */
const resetQuery = () => {
  publishDateRange.value = ['', ''];
  queryFormRef.value?.resetFields();
  handleQuery();
};
/** 多选框选中数据 */
const handleSelectionChange = (selection: NoticeVO[]) => {
  ids.value = selection.map((item) => item.noticeId);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};
/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  loadAudienceOptions();
  dialog.visible = true;
  dialog.title = '添加公告';
};

const handleAddPeriodPush = () => {
  periodForm.value = { ...initPeriodFormData };
  periodDialog.visible = true;
};
/**修改按钮操作 */
const handleUpdate = async (row?: NoticeVO) => {
  reset();
  loadAudienceOptions();
  const noticeId = row?.noticeId || ids.value[0];
  const { data } = await getNotice(noticeId);
  if (!canEditNotice(data)) {
    ElMessage.warning('已发布公告不能修改，请先撤回');
    return;
  }
  Object.assign(form.value, data);
  form.value.targetDeptIds = splitNoticeIds(data.targetDeptIds);
  form.value.targetUserIds = splitNoticeIds(data.targetUserIds);
  form.value.targetRoleIds = splitNoticeIds(data.targetRoleIds);
  form.value.targetTags = splitNoticeIds(data.targetTags) as string[];
  form.value.excludeUsers = splitNoticeIds(data.excludeUsers);
  dialog.visible = true;
  dialog.title = '修改公告';
};

const handleCopyNotice = async (row: NoticeVO) => {
  reset();
  loadAudienceOptions();
  const { data } = await getNotice(row.noticeId);
  Object.assign(form.value, data, {
    noticeId: undefined,
    noticeTitle: `${data.noticeTitle || row.noticeTitle} - 副本`,
    status: '1',
    pushStatus: 'draft'
  });
  form.value.targetDeptIds = splitNoticeIds(data.targetDeptIds);
  form.value.targetUserIds = splitNoticeIds(data.targetUserIds);
  form.value.targetRoleIds = splitNoticeIds(data.targetRoleIds);
  form.value.targetTags = splitNoticeIds(data.targetTags) as string[];
  form.value.excludeUsers = splitNoticeIds(data.excludeUsers);
  dialog.visible = true;
  dialog.title = '复制新建公告';
};

const splitNoticeIds = (value?: string | Array<string | number>) => {
  if (Array.isArray(value)) return value;
  return value ? value.split(',').filter(Boolean) : [];
};

const joinNoticeIds = (value?: string | Array<string | number>) => {
  if (Array.isArray(value)) return value.join(',');
  return value || '';
};

const buildNoticeSubmitPayload = () => ({
  ...form.value,
  targetDeptIds: joinNoticeIds(form.value.targetDeptIds),
  targetUserIds: joinNoticeIds(form.value.targetUserIds),
  targetRoleIds: joinNoticeIds(form.value.targetRoleIds),
  targetTags: joinNoticeIds(form.value.targetTags),
  excludeUsers: joinNoticeIds(form.value.excludeUsers)
});

const buildPeriodNoticeContent = () => {
  const audienceLabel = optionLabel(periodAudienceOptions, periodForm.value.dataAudience);
  const segmentName = segmentLabel(periodForm.value.segmentTag);
  const reportTypeName = periodNoticeTypeMeta(periodForm.value.noticeType).label;
  return [
    `<p>${reportTypeName}</p>`,
    `<p>推送对象：${audienceLabel}，分层：${segmentName}。</p>`,
    periodForm.value.dataAudience === 'business'
      ? '<p>报表将统计本周期岗位数量、人才数量等经营数据。</p>'
      : '<p>报表将统计本周期求职者投递情况等求职数据。</p>'
  ]
    .filter(Boolean)
    .join('');
};

const buildPeriodSubmitPayload = () => {
  const dataAudience = periodForm.value.dataAudience;
  const targetAllScope = dataAudience === 'business' ? 'business_hr' : 'job_seeker_all';
  return {
    noticeTitle: periodForm.value.noticeTitle,
    noticeType: periodForm.value.noticeType,
    dataReportType: periodForm.value.noticeType,
    noticeContent: buildPeriodNoticeContent(),
    status: '0',
    remark: '',
    businessCategory: 'data_report',
    pushRange: dataAudience === 'business' ? 'business' : 'client',
    pushStatus: 'scheduled',
    audienceType: 'all',
    targetAllScope,
    periodCycle: periodForm.value.periodCycle,
    weekDay: periodForm.value.weekDay,
    sendTime: periodForm.value.sendTime,
    periodStartTime: periodForm.value.periodStartTime,
    periodStatus: 'running',
    dataAudience,
    segmentTag: periodForm.value.segmentTag,
    channelInSite: '1',
    scheduleTime: buildPeriodFirstScheduleTime()
  };
};

const buildPeriodFirstScheduleTime = () => {
  if (!periodForm.value.periodStartTime || !periodForm.value.sendTime) return '';
  return `${periodForm.value.periodStartTime} ${periodForm.value.sendTime}:00`;
};

const submitPeriodForm = () => {
  periodFormRef.value?.validate(async (valid: boolean) => {
    if (!valid) return;
    await addPeriodNotice(buildPeriodSubmitPayload());
    proxy?.$modal.msgSuccess('周/月数据推送创建成功');
    periodDialog.visible = false;
    await getList();
  });
};

const validateBeforeSubmit = () => {
  if (!form.value.noticeTitle?.trim() || !form.value.noticeContent?.trim()) {
    ElMessage.warning('公告标题和内容不能为空');
    return false;
  }
  if (form.value.scheduleTime && new Date(form.value.scheduleTime).getTime() < Date.now()) {
    ElMessage.warning('定时发布时间不能早于当前时间');
    return false;
  }
  if (form.value.audienceType === 'all' && !form.value.targetAllScope) {
    ElMessage.warning('请选择全员范围');
    return false;
  }
  if (form.value.audienceType === 'dept' && !form.value.targetDeptIds?.length) {
    ElMessage.warning('请选择接收部门');
    return false;
  }
  if (form.value.audienceType === 'user' && !form.value.targetUserIds?.length) {
    ElMessage.warning('请选择接收人员');
    return false;
  }
  if (form.value.audienceType === 'role' && !form.value.targetRoleIds?.length) {
    ElMessage.warning('请选择接收角色');
    return false;
  }
  if (form.value.audienceType === 'tag' && !form.value.targetTags?.length) {
    ElMessage.warning('请选择或输入用户标签');
    return false;
  }
  return true;
};
/** 提交按钮 */
const submitForm = () => {
  noticeFormRef.value?.validate(async (valid: boolean) => {
    if (valid && validateBeforeSubmit()) {
      const payload = buildNoticeSubmitPayload();
      form.value.noticeId ? await updateNotice(payload) : await addNotice(payload);
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};
/** 删除按钮操作 */
const handleDelete = async (row?: NoticeVO) => {
  const noticeIds = row?.noticeId || ids.value;
  await proxy?.$modal.confirm('是否确认删除公告编号为"' + noticeIds + '"的数据项？');
  await delNotice(noticeIds);
  await getList();
  proxy?.$modal.msgSuccess('删除成功');
};

onMounted(() => {
  getList();
});
</script>

<style scoped lang="scss">
.notice-title-cell {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  max-width: 100%;
}

.notice-tabs-card {
  margin-bottom: 10px;
}

:deep(.notice-tabs-card .el-card__body) {
  padding: 0 16px;
}

:deep(.notice-tabs-card .el-tabs__header) {
  margin-bottom: 0;
}

.period-overview {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.notice-popover__title {
  margin-bottom: 8px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.notice-popover__row {
  display: flex;
  justify-content: space-between;
  line-height: 28px;
  color: var(--el-text-color-regular);
}

.notice-popover__actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.notice-preview__pc {
  padding: 16px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
}

.notice-preview__title {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.notice-preview__meta {
  margin-top: 8px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.notice-preview__content {
  margin-top: 14px;
  line-height: 1.7;
}

:deep(.notice-row-important) {
  --el-table-tr-bg-color: #fff5f5;
}

:deep(.notice-row-expired) {
  color: var(--el-text-color-secondary);
  --el-table-tr-bg-color: var(--el-fill-color-lighter);
}
</style>
