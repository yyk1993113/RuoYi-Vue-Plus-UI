<!--
  推荐链路诊断页：只读查看当前租户的 Outbox、行为记忆与独立推荐服务状态，并受控执行单条 KNN 查询。
  页面只调用管理后端；ES/MQ 地址及内部令牌不会暴露给浏览器，也不会自动轮询或重发事件。
-->
<template>
  <div class="diagnostics-page p-4">
    <el-card shadow="never" class="hero-card mb-4">
      <div class="hero-content">
        <div>
          <div class="hero-title">推荐链路诊断</div>
          <div class="hero-subtitle">观察“业务变更/用户行为 → Outbox → 独立 MQ → 推荐服务 → 记忆与向量检索”的运行状态</div>
        </div>
        <el-button icon="Refresh" :loading="overviewLoading || tableLoading" @click="refreshAll">刷新状态</el-button>
      </div>
    </el-card>

    <el-alert v-if="overview" :title="overview.summary" :type="summaryType" :closable="false" show-icon class="mb-4" />

    <el-row :gutter="16" class="mb-4">
      <el-col v-for="card in statusCards" :key="card.key" :xs="24" :sm="12" :lg="6">
        <el-card v-loading="overviewLoading" shadow="hover" class="status-card">
          <div class="status-label">{{ card.label }}</div>
          <div class="status-main">
            <span class="status-value">{{ card.value }}</span>
            <el-tag :type="card.tagType" effect="light">{{ card.tag }}</el-tag>
          </div>
          <div class="status-note">{{ card.note }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-alert
      v-if="overview && !overview.diagnosticsEnabled"
      title="诊断功能默认关闭"
      description="开启诊断配置并重启管理后端后，本页才会读取 Outbox 和检查独立推荐服务。关闭状态不会增加数据库或网络压力。"
      type="info"
      :closable="false"
      show-icon
      class="mb-4"
    />

    <el-card shadow="hover" class="mb-4">
      <template #header>
        <div class="card-header">
          <div>
            <div class="section-title">推荐功能开关</div>
            <div class="section-note">保存到系统参数配置；默认关闭，开启后按开关逐步生效，不修改岗位、简历、投递主流程</div>
          </div>
          <el-button type="primary" :loading="switchSaving" @click="saveSwitchSettings">保存开关</el-button>
        </div>
      </template>
      <el-alert
        title="建议上线顺序：先开诊断和在线查询，再把精排设为 SHADOW，确认结果后再改 ON；Outbox / 行为记忆会增加异步事件和 MQ 压力。"
        type="warning"
        :closable="false"
        show-icon
        class="mb-3"
      />
      <el-form v-loading="switchLoading" :model="switchForm" label-width="150px">
        <el-row :gutter="18">
          <el-col :xs="24" :lg="12">
            <el-form-item label="精排模式">
              <el-radio-group v-model="switchForm.rerankMode">
                <el-radio-button value="OFF">关闭</el-radio-button>
                <el-radio-button value="SHADOW">灰度观察</el-radio-button>
                <el-radio-button value="ON">正式重排</el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :lg="12">
            <el-form-item label="事件灰度范围">
              <el-radio-group v-model="switchForm.rolloutMode">
                <el-radio-button value="NONE">不写事件</el-radio-button>
                <el-radio-button value="ALLOWLIST">白名单</el-radio-button>
                <el-radio-button value="ALL">全量</el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="18">
          <el-col :xs="24" :sm="12" :lg="6">
            <el-form-item label="诊断页面">
              <el-switch v-model="switchForm.diagnosticsEnabled" active-text="开启" inactive-text="关闭" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :lg="6">
            <el-form-item label="手动测试">
              <el-switch v-model="switchForm.diagnosticsTestEnabled" active-text="开启" inactive-text="关闭" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :lg="6">
            <el-form-item label="B/C端推荐查询">
              <el-switch v-model="switchForm.onlineQueryEnabled" active-text="开启" inactive-text="关闭" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :lg="6">
            <el-form-item label="产业图谱">
              <el-switch v-model="switchForm.industryGraphEnabled" active-text="开启" inactive-text="关闭" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :lg="6">
            <el-form-item label="白领/蓝领策略">
              <el-switch v-model="switchForm.crowdStrategyEnabled" active-text="开启" inactive-text="关闭" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :lg="6">
            <el-form-item label="增强公式">
              <el-switch v-model="switchForm.enhancedFormulaEnabled" active-text="开启" inactive-text="关闭" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :lg="6">
            <el-form-item label="企业分层">
              <el-switch v-model="switchForm.companyTierEnabled" active-text="开启" inactive-text="关闭" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :lg="6">
            <el-form-item label="高校冷启动">
              <el-switch v-model="switchForm.universityColdStartEnabled" active-text="开启" inactive-text="关闭" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-divider content-position="left">异步向量与行为记忆</el-divider>
        <el-row :gutter="18">
          <el-col :xs="24" :sm="12" :lg="6">
            <el-form-item label="向量事件写入">
              <el-switch v-model="switchForm.outboxWriteEnabled" active-text="开启" inactive-text="关闭" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :lg="6">
            <el-form-item label="向量MQ发布">
              <el-switch v-model="switchForm.outboxPublisherEnabled" active-text="开启" inactive-text="关闭" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :lg="6">
            <el-form-item label="行为记忆写入">
              <el-switch v-model="switchForm.behaviorOutboxWriteEnabled" active-text="开启" inactive-text="关闭" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :lg="6">
            <el-form-item label="行为MQ发布">
              <el-switch v-model="switchForm.behaviorOutboxPublisherEnabled" active-text="开启" inactive-text="关闭" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :lg="6">
            <el-form-item label="离线刷新任务">
              <el-switch v-model="switchForm.offlineRefreshEnabled" active-text="开启" inactive-text="关闭" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :lg="6">
            <el-form-item label="离线定时刷新">
              <el-switch v-model="switchForm.offlineScheduleEnabled" active-text="开启" inactive-text="关闭" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <el-card shadow="hover" class="mb-4">
      <template #header>
        <div class="card-header">
          <div>
            <div class="section-title">单条向量检索测试</div>
            <div class="section-note">只查询已经生成的向量，不修改岗位、简历、Outbox 或 ES 文档</div>
          </div>
          <el-tag v-if="overview?.testEnabled" type="success">已开放</el-tag>
          <el-tag v-else type="info">默认关闭</el-tag>
        </div>
      </template>

      <el-form ref="testFormRef" :model="testForm" :rules="testRules" label-width="112px">
        <el-row :gutter="18">
          <el-col :xs="24" :lg="10">
            <el-form-item label="检索方向" prop="direction">
              <el-radio-group v-model="testForm.direction">
                <el-radio-button value="CANDIDATE_TO_JOB">求职者找岗位</el-radio-button>
                <el-radio-button value="JOB_TO_CANDIDATE">岗位找候选人</el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :lg="7">
            <el-form-item :label="sourceCodeLabel" prop="sourceCode">
              <el-input v-model="testForm.sourceCode" clearable maxlength="32" :placeholder="sourceCodePlaceholder" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :lg="7">
            <el-form-item label="返回数量" prop="k">
              <el-input-number v-model="testForm.k" :min="1" :max="overview?.maxTestK || 20" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-collapse class="filter-collapse">
          <el-collapse-item title="可选业务过滤条件" name="filters">
            <el-row :gutter="18">
              <el-col :xs="24" :sm="12" :lg="6">
                <el-form-item label="省份">
                  <el-input v-model="testForm.filters.province" clearable maxlength="64" placeholder="如 江苏省" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :lg="6">
                <el-form-item label="城市">
                  <el-input v-model="testForm.filters.city" clearable maxlength="64" placeholder="如 南京市" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :lg="6">
                <el-form-item label="岗位类型">
                  <el-input v-model="testForm.filters.jobType" clearable maxlength="32" placeholder="业务字典值" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :lg="6">
                <el-form-item label="职位 ID">
                  <el-input-number v-model="testForm.filters.positionId" :min="1" controls-position="right" style="width: 100%" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-collapse-item>
        </el-collapse>

        <div class="test-actions">
          <el-button type="primary" icon="Search" :loading="testLoading" :disabled="!canRunTest" @click="runTest">开始检索</el-button>
          <span class="test-hint">{{ testHint }}</span>
        </div>
      </el-form>

      <div v-if="testResult" class="test-result">
        <el-alert :title="testResult.message" :type="testResult.success ? 'success' : 'warning'" :closable="false" show-icon />
        <el-descriptions :column="4" border class="mt-3">
          <el-descriptions-item label="结果状态">{{ resultStatusLabel(testResult.status) }}</el-descriptions-item>
          <el-descriptions-item label="模型版本">{{ testResult.modelVersion || '-' }}</el-descriptions-item>
          <el-descriptions-item label="推荐耗时">{{ testResult.recommendationTookMillis }} ms</el-descriptions-item>
          <el-descriptions-item label="端到端耗时">{{ testResult.gatewayTookMillis }} ms</el-descriptions-item>
        </el-descriptions>
        <el-table v-if="testResult.hits.length" :data="testResult.hits" border stripe class="mt-3">
          <el-table-column type="index" label="排名" width="80" align="center" />
          <el-table-column :label="targetCodeLabel" prop="entityCode" min-width="190" align="center">
            <template #default="{ row }">{{ row.entityCode || '-' }}</template>
          </el-table-column>
          <el-table-column :label="targetNameLabel" prop="entityName" min-width="160">
            <template #default="{ row }">{{ row.entityName || '-' }}</template>
          </el-table-column>
          <el-table-column v-if="testResult.direction === 'CANDIDATE_TO_JOB'" label="公司名称" prop="companyName" min-width="200">
            <template #default="{ row }">{{ row.companyName || '-' }}</template>
          </el-table-column>
          <el-table-column :label="targetIdLabel" prop="entityId" min-width="160" align="center" />
          <el-table-column label="相似度分数" min-width="160" align="center">
            <template #default="{ row }">{{ Number(row.score).toFixed(6) }}</template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <el-card shadow="hover" class="mb-4">
      <template #header>
        <div class="card-header">
          <div>
            <div class="section-title">行为记忆检查</div>
            <div class="section-note">输入业务编号查看记忆是否生成；只读元数据，不展示或修改向量内容</div>
          </div>
          <el-tag type="info" effect="plain">只读检查</el-tag>
        </div>
      </template>

      <el-form ref="memoryFormRef" :model="memoryForm" :rules="memoryRules" label-width="112px">
        <el-row :gutter="18">
          <el-col :xs="24" :lg="10">
            <el-form-item label="检查对象" prop="direction">
              <el-radio-group v-model="memoryForm.direction">
                <el-radio-button value="CANDIDATE_TO_JOB">求职者记忆</el-radio-button>
                <el-radio-button value="JOB_TO_CANDIDATE">岗位记忆</el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :lg="7">
            <el-form-item :label="memoryCodeLabel" prop="sourceCode">
              <el-input v-model="memoryForm.sourceCode" clearable maxlength="32" :placeholder="memoryCodePlaceholder" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :lg="7">
            <div class="memory-action">
              <el-button type="primary" icon="Search" :loading="memoryLoading" :disabled="!canCheckMemory" @click="checkMemory">
                查看记忆状态
              </el-button>
              <span class="test-hint">{{ memoryHint }}</span>
            </div>
          </el-col>
        </el-row>
      </el-form>

      <div v-if="memoryResult" class="test-result">
        <el-alert :title="memoryResult.message" :type="memoryResultType" :closable="false" show-icon />
        <el-descriptions :column="4" border class="mt-3">
          <el-descriptions-item label="记忆功能">
            <el-tag :type="memoryResult.memoryEnabled ? 'success' : 'info'">
              {{ memoryResult.memoryEnabled ? '已开启' : '未开启' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="记忆状态">
            <el-tag :type="memoryResult.present ? 'success' : 'warning'">
              {{ memoryResult.present ? '已生成' : '暂无记忆' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="有效行为次数">{{ memoryResult.eventCount || 0 }}</el-descriptions-item>
          <el-descriptions-item label="记忆可信度">{{ formatConfidence(memoryResult.confidence) }}</el-descriptions-item>
          <el-descriptions-item label="最近行为时间">{{ memoryResult.observedAt || '-' }}</el-descriptions-item>
          <el-descriptions-item label="记忆版本">{{ memoryResult.entityVersion || '-' }}</el-descriptions-item>
          <el-descriptions-item label="模型版本">{{ memoryResult.modelVersion || '-' }}</el-descriptions-item>
          <el-descriptions-item label="结构版本">{{ memoryResult.schemaVersion || '-' }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-card>

    <el-card shadow="hover" class="mb-4">
      <template #header>
        <div class="card-header">
          <div>
            <div class="section-title">白领 / 蓝领识别规则</div>
            <div class="section-note">按岗位名称、分类、类型或薪资单位选择精排权重；未命中时使用通用策略</div>
          </div>
          <div class="count-tags">
            <el-button icon="Refresh" :loading="crowdRuleLoading" @click="loadCrowdRules">刷新</el-button>
            <el-button type="primary" @click="openCrowdRuleDialog()">新增规则</el-button>
          </div>
        </div>
      </template>
      <el-alert
        title="规则默认关闭；规则只选择精排权重，不修改岗位、简历、投递和沟通流程。数字越小优先级越高。"
        type="info"
        :closable="false"
        show-icon
        class="mb-3"
      />
      <el-table v-loading="crowdRuleLoading" :data="crowdRules" border stripe>
        <el-table-column label="策略" width="150">
          <template #default="{ row }">{{ crowdStrategyLabel(row.strategyCode) }}</template>
        </el-table-column>
        <el-table-column label="匹配字段" width="140">
          <template #default="{ row }">{{ crowdFieldLabel(row.matchField) }}</template>
        </el-table-column>
        <el-table-column label="匹配值" prop="matchValues" min-width="300" show-overflow-tooltip />
        <el-table-column label="优先级" prop="priority" width="90" align="center" />
        <el-table-column label="说明" prop="description" min-width="220" show-overflow-tooltip />
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }"><el-tag :type="row.status === '0' ? 'success' : 'info'">{{ row.status === '0' ? '启用' : '停用' }}</el-tag></template>
        </el-table-column>
        <el-table-column label="操作" width="90" fixed="right" align="center">
          <template #default="{ row }"><el-button link type="primary" @click="openCrowdRuleDialog(row)">编辑</el-button></template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="crowdRuleDialogVisible" :title="crowdRuleForm.ruleId ? '编辑识别规则' : '新增识别规则'" width="620px" append-to-body>
      <el-form :model="crowdRuleForm" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="人群策略" required><el-select v-model="crowdRuleForm.strategyCode" style="width: 100%"><el-option label="白领/专业技术" value="WHITE_COLLAR" /><el-option label="蓝领/门店" value="BLUE_COLLAR" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="匹配字段" required><el-select v-model="crowdRuleForm.matchField" style="width: 100%"><el-option v-for="item in crowdFieldOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="匹配值" required><el-input v-model="crowdRuleForm.matchValues" type="textarea" :rows="3" maxlength="1000" placeholder="多个值使用中文或英文逗号分隔" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="优先级"><el-input-number v-model="crowdRuleForm.priority" :min="0" :max="100000" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="状态"><el-radio-group v-model="crowdRuleForm.status"><el-radio value="0">启用</el-radio><el-radio value="1">停用</el-radio></el-radio-group></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="运营说明"><el-input v-model="crowdRuleForm.description" type="textarea" :rows="2" maxlength="300" /></el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer><el-button @click="crowdRuleDialogVisible = false">取消</el-button><el-button type="primary" :loading="crowdRuleSaving" @click="saveCrowdRule">保存</el-button></template>
    </el-dialog>

    <el-card shadow="hover" class="mb-4">
      <template #header>
        <div class="card-header">
          <div>
            <div class="section-title">南京本地企业四级分层</div>
            <div class="section-note">按企业 ID 维护推荐增益；只写推荐旁路表，不修改企业资料和岗位状态</div>
          </div>
          <div class="count-tags">
            <el-button icon="Refresh" :loading="companyTierLoading" @click="loadCompanyTierRules">刷新</el-button>
            <el-button type="primary" @click="openCompanyTierDialog()">新增企业分层</el-button>
          </div>
        </div>
      </template>
      <el-alert
        title="企业分层默认关闭；开启后只是精排小幅增益，不会改变岗位发布、审核、投递流程。"
        type="info"
        :closable="false"
        show-icon
        class="mb-3"
      />
      <el-table v-loading="companyTierLoading" :data="companyTierRules" border stripe>
        <el-table-column label="企业ID" prop="companyId" width="140" align="center" />
        <el-table-column label="层级" width="190">
          <template #default="{ row }">{{ companyTierLabel(row.tierCode) }}</template>
        </el-table-column>
        <el-table-column label="层级名称" prop="tierName" min-width="150" />
        <el-table-column label="精排增益" prop="scoreBoost" width="110" align="center" />
        <el-table-column label="多样性分桶" prop="diversityBucket" min-width="130">
          <template #default="{ row }">{{ row.diversityBucket || '-' }}</template>
        </el-table-column>
        <el-table-column label="维护依据" prop="reason" min-width="240" show-overflow-tooltip />
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }"><el-tag :type="row.status === '0' ? 'success' : 'info'">{{ row.status === '0' ? '启用' : '停用' }}</el-tag></template>
        </el-table-column>
        <el-table-column label="操作" width="90" fixed="right" align="center">
          <template #default="{ row }"><el-button link type="primary" @click="openCompanyTierDialog(row)">编辑</el-button></template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="companyTierDialogVisible" :title="companyTierForm.ruleId ? '编辑企业分层' : '新增企业分层'" width="640px" append-to-body>
      <el-form :model="companyTierForm" label-width="110px">
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="企业ID" required><el-input-number v-model="companyTierForm.companyId" :min="1" controls-position="right" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="企业层级" required><el-select v-model="companyTierForm.tierCode" style="width: 100%"><el-option label="L1 南京重点/专精特新" value="L1" /><el-option label="L2 园区规上重点" value="L2" /><el-option label="L3 普通中小企业" value="L3" /><el-option label="L4 小微/门店企业" value="L4" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="层级名称" required><el-input v-model="companyTierForm.tierName" maxlength="64" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="精排增益" required><el-input-number v-model="companyTierForm.scoreBoost" :min="0" :max="0.2" :step="0.01" :precision="2" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="分桶"><el-input v-model="companyTierForm.diversityBucket" maxlength="32" placeholder="可选，预留给打散" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="状态"><el-radio-group v-model="companyTierForm.status"><el-radio value="0">启用</el-radio><el-radio value="1">停用</el-radio></el-radio-group></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="维护依据"><el-input v-model="companyTierForm.reason" type="textarea" :rows="2" maxlength="500" /></el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer><el-button @click="companyTierDialogVisible = false">取消</el-button><el-button type="primary" :loading="companyTierSaving" @click="saveCompanyTierRule">保存</el-button></template>
    </el-dialog>

    <el-card shadow="hover" class="mb-4">
      <template #header>
        <div class="card-header">
          <div>
            <div class="section-title">南京高校应届生冷启动规则</div>
            <div class="section-note">用已有教育经历文本识别高校，不新增简历必填项，不改变求职者端提交流程</div>
          </div>
          <div class="count-tags">
            <el-button icon="Refresh" :loading="universityRuleLoading" @click="loadUniversityRules">刷新</el-button>
            <el-button type="primary" @click="openUniversityRuleDialog()">新增高校规则</el-button>
          </div>
        </div>
      </template>
      <el-alert
        title="高校冷启动默认关闭；开启后只对工作年限较短、命中南京高校关键词的简历叠加精排增益。"
        type="info"
        :closable="false"
        show-icon
        class="mb-3"
      />
      <el-table v-loading="universityRuleLoading" :data="universityRules" border stripe>
        <el-table-column label="高校" prop="universityName" min-width="150" />
        <el-table-column label="层级" prop="universityTier" width="80" align="center" />
        <el-table-column label="匹配关键词" prop="matchKeywords" min-width="230" show-overflow-tooltip />
        <el-table-column label="优势关键词" prop="preferredKeywords" min-width="250" show-overflow-tooltip />
        <el-table-column label="园区关键词" prop="parkKeywords" min-width="180" show-overflow-tooltip />
        <el-table-column label="基础/产业/园区" width="150" align="center">
          <template #default="{ row }">{{ row.baseBoost }}/{{ row.industryBoost }}/{{ row.parkBoost }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }"><el-tag :type="row.status === '0' ? 'success' : 'info'">{{ row.status === '0' ? '启用' : '停用' }}</el-tag></template>
        </el-table-column>
        <el-table-column label="操作" width="90" fixed="right" align="center">
          <template #default="{ row }"><el-button link type="primary" @click="openUniversityRuleDialog(row)">编辑</el-button></template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="universityRuleDialogVisible" :title="universityRuleForm.ruleId ? '编辑高校规则' : '新增高校规则'" width="720px" append-to-body>
      <el-form :model="universityRuleForm" label-width="110px">
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="高校名称" required><el-input v-model="universityRuleForm.universityName" maxlength="100" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="高校层级" required><el-select v-model="universityRuleForm.universityTier" style="width: 100%"><el-option label="A 头部优势高校" value="A" /><el-option label="B 本地重点高校" value="B" /><el-option label="C 应用型高校" value="C" /><el-option label="D 其他维护高校" value="D" /></el-select></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="匹配关键词" required><el-input v-model="universityRuleForm.matchKeywords" type="textarea" :rows="2" maxlength="1000" placeholder="如 南京大学,南大,NJU" /></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="优势关键词"><el-input v-model="universityRuleForm.preferredKeywords" type="textarea" :rows="2" maxlength="1000" placeholder="岗位、产业或技能关键词，逗号分隔" /></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="园区关键词"><el-input v-model="universityRuleForm.parkKeywords" type="textarea" :rows="2" maxlength="1000" placeholder="如 软件谷,江北新区,南京经开区" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="基础增益"><el-input-number v-model="universityRuleForm.baseBoost" :min="0" :max="0.2" :step="0.01" :precision="2" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="产业增益"><el-input-number v-model="universityRuleForm.industryBoost" :min="0" :max="0.2" :step="0.01" :precision="2" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="园区增益"><el-input-number v-model="universityRuleForm.parkBoost" :min="0" :max="0.2" :step="0.01" :precision="2" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="状态"><el-radio-group v-model="universityRuleForm.status"><el-radio value="0">启用</el-radio><el-radio value="1">停用</el-radio></el-radio-group></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="维护依据"><el-input v-model="universityRuleForm.reason" type="textarea" :rows="2" maxlength="500" /></el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer><el-button @click="universityRuleDialogVisible = false">取消</el-button><el-button type="primary" :loading="universityRuleSaving" @click="saveUniversityRule">保存</el-button></template>
    </el-dialog>

    <el-card shadow="hover" class="mb-4">
      <template #header>
        <div class="card-header">
          <div>
            <div class="section-title">人岗精排动态权重</div>
            <div class="section-note">仅调整新精排层，首页流量排序与现有招聘流程不受影响</div>
          </div>
          <el-tag :type="rerankModeTagType">精排模式 {{ rerankConfig?.mode || 'OFF' }}</el-tag>
        </div>
      </template>
      <el-alert
        title="四项权重之和必须等于 1；产业标签分来自管理员为岗位维护的南京标签。"
        type="info"
        :closable="false"
        show-icon
        class="mb-3"
      />
      <el-form v-loading="rerankLoading" :model="rerankForm" label-width="110px">
        <el-form-item label="人群策略">
          <el-radio-group v-model="rerankStrategy" @change="loadRerankWeights">
            <el-radio-button value="GENERAL">通用</el-radio-button>
            <el-radio-button value="WHITE_COLLAR">白领/专业技术</el-radio-button>
            <el-radio-button value="BLUE_COLLAR">蓝领/门店</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-row :gutter="18">
          <el-col v-for="item in rerankWeightItems" :key="item.key" :xs="24" :sm="12" :lg="6">
            <el-form-item :label="item.label">
              <el-input-number
                v-model="rerankForm[item.key]"
                :min="0"
                :max="1"
                :step="0.05"
                :precision="2"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <div class="test-actions">
          <el-button type="primary" :loading="rerankSaving" :disabled="!rerankWeightValid" @click="saveRerankWeights">
            保存权重
          </el-button>
          <span class="test-hint">当前合计 {{ rerankWeightTotal.toFixed(2) }}，配置版本 {{ rerankConfig?.version || 0 }}</span>
        </div>
      </el-form>
    </el-card>

    <el-card shadow="hover" class="mb-4">
      <template #header>
        <div class="card-header">
          <div>
            <div class="section-title">南京私有产业关联图谱</div>
            <div class="section-note">维护六大产业节点和一跳互通关系；只影响精排产业分，不修改招聘主数据</div>
          </div>
          <div class="count-tags">
            <el-button icon="Refresh" :loading="graphLoading" @click="loadIndustryGraph">刷新</el-button>
            <el-button v-if="graphTab === 'nodes'" type="primary" @click="openNodeDialog()">新增节点</el-button>
            <el-button v-else-if="graphTab === 'edges'" type="primary" @click="openEdgeDialog()">新增关系</el-button>
          </div>
        </div>
      </template>
      <el-alert
        title="图谱默认关闭；节点或关系修改后只刷新服务端缓存，开启 SHADOW/ON 前不会改变当前排序。"
        type="info"
        :closable="false"
        show-icon
        class="mb-3"
      />
      <el-tabs v-model="graphTab" @tab-change="handleGraphTabChange">
        <el-tab-pane label="气泡关系图" name="chart">
          <div class="graph-chart-toolbar mb-3">
            <span class="section-note">气泡越大代表连接关系越多；线越粗代表关系权重越高。</span>
          </div>
          <div ref="industryGraphChartRef" class="industry-graph-chart"></div>
        </el-tab-pane>
        <el-tab-pane label="产业节点" name="nodes">
          <el-form :inline="true" class="mb-3">
            <el-form-item label="节点类型">
              <el-select v-model="graphQuery.nodeType" clearable placeholder="全部" style="width: 180px" @change="loadGraphNodes">
                <el-option v-for="item in graphNodeTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="关键词">
              <el-input v-model="graphQuery.keyword" clearable placeholder="节点名称或编码" @keyup.enter="loadGraphNodes" />
            </el-form-item>
            <el-form-item><el-button type="primary" icon="Search" @click="loadGraphNodes">查询</el-button></el-form-item>
          </el-form>
          <el-table v-loading="graphLoading" :data="graphNodes" border stripe max-height="520">
            <el-table-column label="节点名称" prop="nodeName" min-width="150" />
            <el-table-column label="编码" prop="nodeCode" min-width="180" />
            <el-table-column label="类型" width="130">
              <template #default="{ row }">{{ graphNodeTypeLabel(row.nodeType) }}</template>
            </el-table-column>
            <el-table-column label="所属赛道" prop="trackCode" min-width="150">
              <template #default="{ row }">{{ row.trackCode ? graphTrackLabel(row.trackCode) : '-' }}</template>
            </el-table-column>
            <el-table-column label="关键词" prop="matchKeywords" min-width="260" show-overflow-tooltip />
            <el-table-column label="状态" width="90" align="center">
              <template #default="{ row }"><el-tag :type="row.status === '0' ? 'success' : 'info'">{{ row.status === '0' ? '启用' : '停用' }}</el-tag></template>
            </el-table-column>
            <el-table-column label="版本" prop="dataVersion" width="80" align="center" />
            <el-table-column label="操作" width="90" fixed="right" align="center">
              <template #default="{ row }"><el-button link type="primary" @click="openNodeDialog(row)">编辑</el-button></template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="上下游与互通关系" name="edges">
          <el-table v-loading="graphLoading" :data="graphEdges" border stripe max-height="520">
            <el-table-column label="来源节点" prop="sourceNodeName" min-width="150" />
            <el-table-column label="关系" width="130" align="center">
              <template #default="{ row }">{{ graphRelationLabel(row.relationType) }}</template>
            </el-table-column>
            <el-table-column label="目标节点" prop="targetNodeName" min-width="150" />
            <el-table-column label="权重" prop="relationWeight" width="90" align="center" />
            <el-table-column label="方向" width="100" align="center">
              <template #default="{ row }">{{ row.bidirectional === '1' ? '双向' : '单向' }}</template>
            </el-table-column>
            <el-table-column label="跳数" prop="maxHops" width="80" align="center" />
            <el-table-column label="关系依据" prop="reason" min-width="260" show-overflow-tooltip />
            <el-table-column label="状态" width="90" align="center">
              <template #default="{ row }"><el-tag :type="row.status === '0' ? 'success' : 'info'">{{ row.status === '0' ? '启用' : '停用' }}</el-tag></template>
            </el-table-column>
            <el-table-column label="操作" width="90" fixed="right" align="center">
              <template #default="{ row }"><el-button link type="primary" @click="openEdgeDialog(row)">编辑</el-button></template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-dialog v-model="nodeDialogVisible" :title="nodeForm.nodeId ? '编辑产业节点' : '新增产业节点'" width="680px" append-to-body>
      <el-form :model="nodeForm" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="节点名称" required><el-input v-model="nodeForm.nodeName" maxlength="100" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="节点编码" required><el-input v-model="nodeForm.nodeCode" maxlength="64" placeholder="大写字母、数字、下划线" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="节点类型" required><el-select v-model="nodeForm.nodeType" style="width: 100%"><el-option v-for="item in graphNodeTypeOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="上级节点"><el-select v-model="nodeForm.parentId" clearable filterable style="width: 100%"><el-option v-for="item in graphNodeOptions" :key="String(item.value)" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="所属赛道"><el-input v-model="nodeForm.trackCode" maxlength="64" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="排序"><el-input-number v-model="nodeForm.sortOrder" :min="0" :max="100000" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="匹配关键词"><el-input v-model="nodeForm.matchKeywords" type="textarea" :rows="2" maxlength="1000" placeholder="使用逗号分隔" /></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="运营说明"><el-input v-model="nodeForm.description" type="textarea" :rows="2" maxlength="500" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="状态"><el-radio-group v-model="nodeForm.status"><el-radio value="0">启用</el-radio><el-radio value="1">停用</el-radio></el-radio-group></el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer><el-button @click="nodeDialogVisible = false">取消</el-button><el-button type="primary" :loading="graphSaving" @click="saveGraphNode">保存</el-button></template>
    </el-dialog>

    <el-dialog v-model="edgeDialogVisible" :title="edgeForm.edgeId ? '编辑产业关系' : '新增产业关系'" width="680px" append-to-body>
      <el-form :model="edgeForm" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="来源节点" required><el-select v-model="edgeForm.sourceNodeId" filterable style="width: 100%"><el-option v-for="item in graphNodeOptions" :key="`s-${item.value}`" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="目标节点" required><el-select v-model="edgeForm.targetNodeId" filterable style="width: 100%"><el-option v-for="item in graphNodeOptions" :key="`t-${item.value}`" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="关系类型" required><el-select v-model="edgeForm.relationType" style="width: 100%"><el-option v-for="item in graphRelationOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="关系权重" required><el-input-number v-model="edgeForm.relationWeight" :min="0" :max="1" :step="0.05" :precision="2" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="匹配方向"><el-radio-group v-model="edgeForm.bidirectional"><el-radio value="1">双向</el-radio><el-radio value="0">单向</el-radio></el-radio-group></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="最大跳数"><el-input-number v-model="edgeForm.maxHops" :min="1" :max="2" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="关系依据"><el-input v-model="edgeForm.reason" type="textarea" :rows="3" maxlength="500" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="状态"><el-radio-group v-model="edgeForm.status"><el-radio value="0">启用</el-radio><el-radio value="1">停用</el-radio></el-radio-group></el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer><el-button @click="edgeDialogVisible = false">取消</el-button><el-button type="primary" :loading="graphSaving" @click="saveGraphEdge">保存</el-button></template>
    </el-dialog>

    <el-card v-if="canManageOffline" shadow="hover" class="mb-4">
      <template #header>
        <div class="card-header">
          <div>
            <div class="section-title">离线批量刷新</div>
            <div class="section-note">小批量刷新存量向量，支持暂停、恢复和断点续跑</div>
          </div>
          <el-button icon="Refresh" :loading="taskLoading" @click="loadRefreshTasks">刷新任务</el-button>
        </div>
      </template>
      <el-alert
        :title="overview?.offlineRolloutReady ? '离线链路配置已就绪，可以创建小批量灰度任务。' : '离线链路尚未就绪，请先处理下方阻断项。'"
        :type="overview?.offlineRolloutReady ? 'success' : 'warning'"
        :closable="false"
        show-icon
        class="mb-3"
      />
      <el-descriptions :column="3" border class="mb-3">
        <el-descriptions-item v-for="item in offlineReadinessItems" :key="item.key" :label="item.label">
          <el-tag :type="item.ready ? 'success' : 'info'">{{ item.ready ? '已就绪' : '未就绪' }}</el-tag>
          <span v-if="item.note" class="readiness-note">{{ item.note }}</span>
        </el-descriptions-item>
      </el-descriptions>
      <div v-if="offlineBlockerLabels.length" class="blocker-list mb-3">
        <span class="section-note">当前阻断：</span>
        <el-tag v-for="label in offlineBlockerLabels" :key="label" type="warning" effect="plain">{{ label }}</el-tag>
      </div>
      <el-alert
        title="这里检查的是安全配置是否齐全；真实 MQ、模型和 ES 吞吐仍需通过小批量灰度任务验收。"
        type="info"
        :closable="false"
        show-icon
        class="mb-3"
      />
      <el-form ref="refreshFormRef" :model="refreshForm" :rules="refreshRules" :inline="true">
        <el-form-item label="刷新对象" prop="entityType">
          <el-select v-model="refreshForm.entityType" style="width: 120px">
            <el-option label="求职者" value="CANDIDATE" />
            <el-option label="岗位" value="JOB" />
          </el-select>
        </el-form-item>
        <el-form-item label="刷新方式" prop="refreshMode">
          <el-select v-model="refreshForm.refreshMode" style="width: 120px">
            <el-option label="增量刷新" value="INCREMENTAL" />
            <el-option label="全量刷新" value="FULL" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="refreshForm.refreshMode === 'INCREMENTAL'" label="变更时间" prop="changedAfter">
          <el-date-picker v-model="refreshForm.changedAfter" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" placeholder="从何时开始" />
        </el-form-item>
        <el-form-item label="单批数量" prop="batchSize">
          <el-input-number v-model="refreshForm.batchSize" :min="1" :max="200" controls-position="right" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="taskCreating" :disabled="!canCreateRefreshTask" @click="createRefreshTask">创建任务</el-button>
        </el-form-item>
      </el-form>
      <el-table v-loading="taskLoading" :data="refreshTasks" border stripe>
        <el-table-column label="任务" prop="taskId" width="100" align="center" />
        <el-table-column label="对象" width="90" align="center"
          ><template #default="{ row }">{{ entityTypeLabel(row.entityType) }}</template></el-table-column
        >
        <el-table-column label="方式" width="90" align="center"
          ><template #default="{ row }">{{ row.refreshMode === 'FULL' ? '全量' : '增量' }}</template></el-table-column
        >
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }"
            ><el-tag :type="refreshTaskStatusType(row.status)">{{ refreshTaskStatusLabel(row.status) }}</el-tag></template
          >
        </el-table-column>
        <el-table-column label="已入队" prop="enqueuedCount" width="100" align="center" />
        <el-table-column label="当前游标" prop="cursorId" min-width="150" align="center" />
        <el-table-column label="失败次数" prop="attemptCount" width="100" align="center" />
        <el-table-column label="创建时间" prop="createTime" width="170" align="center" />
        <el-table-column label="错误摘要" min-width="180" show-overflow-tooltip
          ><template #default="{ row }">{{ row.lastError || '-' }}</template></el-table-column
        >
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="{ row }">
            <el-button v-if="['PENDING', 'RUNNING'].includes(row.status)" link type="warning" @click="changeRefreshTask(row, 'pause')"
              >暂停</el-button
            >
            <el-button v-if="row.status === 'PAUSED'" link type="primary" @click="changeRefreshTask(row, 'resume')">恢复</el-button>
            <el-button v-if="['PENDING', 'RUNNING', 'PAUSED'].includes(row.status)" link type="danger" @click="changeRefreshTask(row, 'cancel')"
              >取消</el-button
            >
          </template>
        </el-table-column>
      </el-table>
      <pagination
        v-show="refreshTaskTotal > 0"
        v-model:page="refreshTaskQuery.pageNum"
        v-model:limit="refreshTaskQuery.pageSize"
        :total="refreshTaskTotal"
        @pagination="loadRefreshTasks"
      />
    </el-card>

    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <div>
            <div class="section-title">Outbox 事件</div>
            <div class="section-note">只显示当前登录租户，不包含手机号、简历正文等个人信息</div>
          </div>
          <div class="count-tags">
            <el-tag type="warning">待发布 {{ outboxCount('PENDING') }}</el-tag>
            <el-tag type="success">已发布 {{ outboxCount('PUBLISHED') }}</el-tag>
            <el-tag type="danger">死信 {{ outboxCount('DEAD') }}</el-tag>
          </div>
        </div>
      </template>

      <el-form ref="queryFormRef" :model="query" :inline="true" class="mb-3">
        <el-form-item label="处理状态" prop="status">
          <el-select v-model="query.status" clearable placeholder="全部" style="width: 130px">
            <el-option label="待发布" value="PENDING" />
            <el-option label="发布中" value="PUBLISHING" />
            <el-option label="已发布" value="PUBLISHED" />
            <el-option label="死信" value="DEAD" />
          </el-select>
        </el-form-item>
        <el-form-item label="对象类型" prop="entityType">
          <el-select v-model="query.entityType" clearable placeholder="全部" style="width: 140px">
            <el-option label="求职者" value="CANDIDATE" />
            <el-option label="岗位" value="JOB" />
          </el-select>
        </el-form-item>
        <el-form-item label="事件类型" prop="eventType">
          <el-select v-model="query.eventType" clearable placeholder="全部" style="width: 150px">
            <el-option label="新增或更新" value="VECTOR_UPSERT" />
            <el-option label="删除" value="VECTOR_DELETE" />
          </el-select>
        </el-form-item>
        <el-form-item label="对象 ID" prop="entityId">
          <el-input-number v-model="query.entityId" :min="1" controls-position="right" style="width: 160px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" :disabled="!overview?.diagnosticsEnabled" @click="handleQuery">查询</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="tableLoading" :data="outboxRows" border stripe>
        <el-table-column label="事件序号" prop="outboxId" width="120" align="center" />
        <el-table-column label="对象" min-width="150">
          <template #default="{ row }">
            <div class="object-cell">
              <el-tag size="small" effect="plain">{{ entityTypeLabel(row.entityType) }}</el-tag>
              <span>#{{ row.entityId }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="变更类型" min-width="130" align="center">
          <template #default="{ row }">{{ eventTypeLabel(row.eventType) }}</template>
        </el-table-column>
        <el-table-column label="处理状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="outboxStatusType(row.status)">{{ outboxStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="尝试次数" prop="attemptCount" width="100" align="center" />
        <el-table-column label="创建时间" prop="createTime" width="170" align="center" />
        <el-table-column label="发布时间" prop="publishedAt" width="170" align="center">
          <template #default="{ row }">{{ row.publishedAt || '-' }}</template>
        </el-table-column>
        <el-table-column label="错误摘要" prop="lastError" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">{{ row.lastError || '-' }}</template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="query.pageNum" v-model:limit="query.pageSize" :total="total" @pagination="loadOutbox" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import type { FormInstance, FormRules, TagProps } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import * as echarts from 'echarts';
import { useUserStore } from '@/store/modules/user';
import {
  cancelRecommendationRefreshTask,
  createRecommendationCompanyTierRule,
  createRecommendationCrowdRule,
  createIndustryGraphEdge,
  createIndustryGraphNode,
  createRecommendationRefreshTask,
  createRecommendationUniversityColdStartRule,
  getRecommendationSwitchSettings,
  getRecommendationMemoryStatus,
  getRecommendationDiagnosticsOverview,
  getRecommendationRerankWeights,
  listIndustryGraphEdges,
  listIndustryGraphNodes,
  listRecommendationCompanyTierRules,
  listRecommendationCrowdRules,
  listRecommendationOutbox,
  listRecommendationRefreshTasks,
  listRecommendationUniversityColdStartRules,
  pauseRecommendationRefreshTask,
  resumeRecommendationRefreshTask,
  runRecommendationSearchTest,
  updateRecommendationCompanyTierRule,
  updateRecommendationSwitchSettings,
  updateRecommendationRerankWeights,
  updateRecommendationCrowdRule,
  updateIndustryGraphEdge,
  updateIndustryGraphNode,
  updateRecommendationUniversityColdStartRule,
  type IndustryGraphEdge,
  type IndustryGraphNode,
  type IndustryGraphNodeType,
  type IndustryGraphRelationType,
  type OutboxStatus,
  type RecommendationDirection,
  type RecommendationCompanyTierRule,
  type RecommendationCrowdStrategy,
  type RecommendationCrowdMatchField,
  type RecommendationCrowdRule,
  type RecommendationDiagnosticsOverview,
  type RecommendationMemoryStatusRequest,
  type RecommendationMemoryStatusResult,
  type RecommendationRerankWeightConfig,
  type RecommendationRerankWeightRequest,
  type RecommendationSwitchSettings,
  type RecommendationRefreshTaskRequest,
  type RecommendationRefreshTaskRow,
  type RecommendationRefreshTaskStatus,
  type RecommendationOutboxQuery,
  type RecommendationOutboxRow,
  type RecommendationSearchTestRequest,
  type RecommendationSearchTestResult,
  type RecommendationUniversityColdStartRule
} from '@/api/recruitment/recommendationDiagnostics';

type TagType = TagProps['type'];

const overviewLoading = ref(false);
const switchLoading = ref(false);
const switchSaving = ref(false);
const tableLoading = ref(false);
const testLoading = ref(false);
const memoryLoading = ref(false);
const taskLoading = ref(false);
const taskCreating = ref(false);
const rerankLoading = ref(false);
const rerankSaving = ref(false);
const graphLoading = ref(false);
const graphSaving = ref(false);
const crowdRuleLoading = ref(false);
const crowdRuleSaving = ref(false);
const companyTierLoading = ref(false);
const companyTierSaving = ref(false);
const universityRuleLoading = ref(false);
const universityRuleSaving = ref(false);
const overview = ref<RecommendationDiagnosticsOverview>();
const outboxRows = ref<RecommendationOutboxRow[]>([]);
const total = ref(0);
const testResult = ref<RecommendationSearchTestResult>();
const memoryResult = ref<RecommendationMemoryStatusResult>();
const rerankConfig = ref<RecommendationRerankWeightConfig>();
const graphNodes = ref<IndustryGraphNode[]>([]);
const graphAllNodes = ref<IndustryGraphNode[]>([]);
const graphEdges = ref<IndustryGraphEdge[]>([]);
const crowdRules = ref<RecommendationCrowdRule[]>([]);
const companyTierRules = ref<RecommendationCompanyTierRule[]>([]);
const universityRules = ref<RecommendationUniversityColdStartRule[]>([]);
const graphTab = ref<'chart' | 'nodes' | 'edges'>('chart');
const nodeDialogVisible = ref(false);
const edgeDialogVisible = ref(false);
const crowdRuleDialogVisible = ref(false);
const companyTierDialogVisible = ref(false);
const universityRuleDialogVisible = ref(false);
const testFormRef = ref<FormInstance>();
const memoryFormRef = ref<FormInstance>();
const refreshFormRef = ref<FormInstance>();
const queryFormRef = ref<FormInstance>();
const industryGraphChartRef = ref<HTMLDivElement>();
const userStore = useUserStore();
let industryGraphChart: echarts.ECharts | null = null;

const query = reactive<RecommendationOutboxQuery>({
  pageNum: 1,
  pageSize: 10,
  status: '',
  entityType: '',
  eventType: '',
  entityId: undefined
});

const testForm = reactive<RecommendationSearchTestRequest>({
  direction: 'CANDIDATE_TO_JOB',
  sourceCode: '',
  k: 10,
  filters: {
    province: '',
    city: '',
    jobType: '',
    positionId: undefined
  }
});

const memoryForm = reactive<RecommendationMemoryStatusRequest>({
  direction: 'CANDIDATE_TO_JOB',
  sourceCode: ''
});

const refreshForm = reactive<RecommendationRefreshTaskRequest>({
  entityType: 'CANDIDATE',
  refreshMode: 'INCREMENTAL',
  changedAfter: '',
  batchSize: 50
});
const switchForm = reactive<RecommendationSwitchSettings>({
  diagnosticsEnabled: false,
  diagnosticsTestEnabled: false,
  onlineQueryEnabled: false,
  rerankMode: 'OFF',
  industryGraphEnabled: false,
  crowdStrategyEnabled: false,
  enhancedFormulaEnabled: false,
  companyTierEnabled: false,
  universityColdStartEnabled: false,
  rolloutMode: 'NONE',
  outboxWriteEnabled: false,
  outboxPublisherEnabled: false,
  behaviorOutboxWriteEnabled: false,
  behaviorOutboxPublisherEnabled: false,
  offlineRefreshEnabled: false,
  offlineScheduleEnabled: false
});
const refreshTasks = ref<RecommendationRefreshTaskRow[]>([]);
const refreshTaskTotal = ref(0);
const refreshTaskQuery = reactive({ pageNum: 1, pageSize: 10 });
const rerankForm = reactive<RecommendationRerankWeightRequest>({
  strategyCode: 'GENERAL',
  vectorWeight: 0.45,
  localWeight: 0.2,
  industryWeight: 0.2,
  salaryWeight: 0.15
});
const rerankStrategy = ref<RecommendationCrowdStrategy>('GENERAL');
const crowdFieldOptions: Array<{ label: string; value: RecommendationCrowdMatchField }> = [
  { label: '岗位名称', value: 'JOB_NAME' },
  { label: '岗位分类', value: 'CATEGORY' },
  { label: '岗位类型', value: 'JOB_TYPE' },
  { label: '薪资单位', value: 'SALARY_UNIT' }
];
const graphQuery = reactive<{ nodeType: IndustryGraphNodeType | ''; keyword: string }>({ nodeType: '', keyword: '' });
const graphNodeTypeOptions: Array<{ label: string; value: IndustryGraphNodeType }> = [
  { label: '核心赛道', value: 'TRACK' },
  { label: '产业链环节', value: 'CHAIN_STAGE' },
  { label: '配套服务', value: 'SUPPORT_SERVICE' },
  { label: '岗位族', value: 'POSITION_FAMILY' },
  { label: '技能能力', value: 'CAPABILITY' }
];
const graphRelationOptions: Array<{ label: string; value: IndustryGraphRelationType }> = [
  { label: '上游', value: 'UPSTREAM' },
  { label: '下游', value: 'DOWNSTREAM' },
  { label: '相邻环节', value: 'ADJACENT_STAGE' },
  { label: '配套服务', value: 'SUPPORT_SERVICE' },
  { label: '技能可迁移', value: 'SKILL_TRANSFER' },
  { label: '跨产业互通', value: 'CROSS_TRACK' }
];
const nodeForm = reactive<IndustryGraphNode>(emptyGraphNode());
const edgeForm = reactive<IndustryGraphEdge>(emptyGraphEdge());
const crowdRuleForm = reactive<RecommendationCrowdRule>(emptyCrowdRule());
const companyTierForm = reactive<RecommendationCompanyTierRule>(emptyCompanyTierRule());
const universityRuleForm = reactive<RecommendationUniversityColdStartRule>(emptyUniversityRule());
type RerankWeightKey = 'vectorWeight' | 'localWeight' | 'industryWeight' | 'salaryWeight';
const rerankWeightItems: Array<{ key: RerankWeightKey; label: string }> = [
  { key: 'vectorWeight', label: '向量相似度' },
  { key: 'localWeight', label: '南京本地化' },
  { key: 'industryWeight', label: '产业标签' },
  { key: 'salaryWeight', label: '薪资匹配' }
];

const testRules: FormRules = {
  direction: [{ required: true, message: '请选择检索方向', trigger: 'change' }],
  sourceCode: [{ required: true, message: '请输入业务编号', trigger: 'blur' }],
  k: [{ required: true, message: '请输入返回数量', trigger: 'blur' }]
};

const memoryRules: FormRules = {
  direction: [{ required: true, message: '请选择检查对象', trigger: 'change' }],
  sourceCode: [{ required: true, message: '请输入业务编号', trigger: 'blur' }]
};

const refreshRules: FormRules = {
  changedAfter: [
    {
      validator: (_rule, value, callback) => {
        if (refreshForm.refreshMode === 'INCREMENTAL' && !value) callback(new Error('请选择增量起始时间'));
        else callback();
      },
      trigger: 'change'
    }
  ]
};

const sourceCodeLabel = computed(() => (testForm.direction === 'CANDIDATE_TO_JOB' ? '求职者编号' : '岗位编号'));
const sourceCodePlaceholder = computed(() => (testForm.direction === 'CANDIDATE_TO_JOB' ? '如 SKR-...' : '如 JOB-...'));
// 结果列以实际返回方向为准，避免检索完成后切换单选项导致旧结果标题或名称语义错位。
const resultDirection = computed(() => testResult.value?.direction || testForm.direction);
const targetCodeLabel = computed(() => (resultDirection.value === 'CANDIDATE_TO_JOB' ? '岗位编号' : '求职者编号'));
const targetNameLabel = computed(() => (resultDirection.value === 'CANDIDATE_TO_JOB' ? '岗位名称' : '求职者姓名'));
const targetIdLabel = computed(() => (resultDirection.value === 'CANDIDATE_TO_JOB' ? '岗位 ID' : '求职者用户 ID'));
const memoryCodeLabel = computed(() => (memoryForm.direction === 'CANDIDATE_TO_JOB' ? '求职者编号' : '岗位编号'));
const memoryCodePlaceholder = computed(() => (memoryForm.direction === 'CANDIDATE_TO_JOB' ? '如 SKR-...' : '如 JOB-...'));
const canRunTest = computed(
  () => Boolean(overview.value?.diagnosticsEnabled && overview.value?.testEnabled && overview.value?.recommendationReachable) && !testLoading.value
);
const canCheckMemory = computed(() => Boolean(overview.value?.diagnosticsEnabled && overview.value?.recommendationReachable) && !memoryLoading.value);
const canManageOffline = computed(
  () => userStore.permissions.includes('*:*:*') || userStore.permissions.includes('recruitment:recommendation:offline-refresh')
);
const canCreateRefreshTask = computed(() => Boolean(overview.value?.offlineRolloutReady) && !taskCreating.value);
const rerankWeightTotal = computed(
  () => rerankForm.vectorWeight + rerankForm.localWeight + rerankForm.industryWeight + rerankForm.salaryWeight
);
const rerankWeightValid = computed(() => Math.abs(rerankWeightTotal.value - 1) < 0.0001 && !rerankSaving.value);
const rerankModeTagType = computed<TagType>(() => {
  if (rerankConfig.value?.mode === 'ON') return 'success';
  if (rerankConfig.value?.mode === 'SHADOW') return 'warning';
  return 'info';
});
const graphNodeOptions = computed(() =>
  graphAllNodes.value
    .filter((node) => node.status === '0' && String(node.nodeId || '') !== String(nodeForm.nodeId || ''))
    .map((node) => ({ label: `${node.nodeName}（${node.nodeCode}）`, value: node.nodeId as number | string }))
);

const graphPalette = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#13C2C2', '#9B59B6', '#64748B'];

// 灰度检查完全使用后端返回的非敏感状态，浏览器不推断也不接触 MQ、ES 或内部令牌配置。
const offlineReadinessItems = computed(() => [
  { key: 'writer', label: '业务事件写入', ready: Boolean(overview.value?.outboxWriteEnabled), note: '' },
  { key: 'publisher', label: '独立 MQ 发布', ready: Boolean(overview.value?.outboxPublisherEnabled), note: '' },
  { key: 'refresh', label: '离线任务执行', ready: Boolean(overview.value?.offlineRefreshEnabled), note: '' },
  {
    key: 'consumer',
    label: '离线消费者',
    ready: Boolean(overview.value?.offlineConsumerEnabled),
    note: overview.value?.offlineBatchSize ? `每批 ${overview.value.offlineBatchSize} 条` : ''
  },
  {
    key: 'topic',
    label: 'Topic 隔离',
    ready: Boolean(overview.value?.offlineTopicIsolated),
    note: ''
  },
  {
    key: 'service',
    label: '推荐服务检查',
    ready: Boolean(overview.value?.offlineReadinessReachable && overview.value?.offlineConfigurationReady),
    note: overview.value?.offlineThreadMaxSize ? `最多 ${overview.value.offlineThreadMaxSize} 个离线线程` : ''
  }
]);

const blockerText: Record<string, string> = {
  DIAGNOSTICS_DISABLED: '诊断功能未开启',
  READINESS_UNREACHABLE: '推荐服务检查接口不可达',
  READINESS_HTTP_401: '内部令牌不一致',
  READINESS_HTTP_403: '内部账号无权执行就绪检查',
  READINESS_HTTP_404: '推荐服务版本尚未提供就绪检查',
  READINESS_HTTP_503: '推荐服务就绪检查暂不可用',
  MODEL_DISABLED: '模型推理未开启',
  OFFLINE_CONSUMER_DISABLED: '离线消费者未开启',
  BUSINESS_SNAPSHOT_AUTH_MISSING: '业务快照令牌未配置',
  OFFLINE_TOPIC_NOT_ISOLATED: '离线 Topic 未隔离',
  OUTBOX_WRITER_DISABLED: '业务事件写入未开启',
  OUTBOX_PUBLISHER_DISABLED: 'Outbox 发布器未开启',
  OFFLINE_REFRESH_DISABLED: '离线刷新任务未开启'
};
const offlineBlockerLabels = computed(() => (overview.value?.offlineBlockers || []).map((code) => blockerText[code] || code));
const testHint = computed(() => {
  if (!overview.value?.diagnosticsEnabled) return '请先开启诊断功能';
  if (!overview.value?.testEnabled) return '当前仅开放只读监控，手动测试尚未开启';
  if (!overview.value?.recommendationReachable) return '独立推荐服务不可达，请先检查服务状态';
  return '最多同时执行少量测试，请勿用于压测';
});
const memoryHint = computed(() => {
  if (!overview.value?.diagnosticsEnabled) return '请先开启诊断功能';
  if (!overview.value?.recommendationReachable) return '独立推荐服务不可达';
  return '完成一次浏览、收藏或投递后再检查';
});
const memoryResultType = computed<'success' | 'warning' | 'error' | 'info'>(() => {
  if (!memoryResult.value?.success) return 'error';
  if (!memoryResult.value.memoryEnabled) return 'info';
  return memoryResult.value.present ? 'success' : 'warning';
});
const summaryType = computed<'success' | 'warning' | 'error' | 'info'>(() => {
  if (!overview.value?.diagnosticsEnabled) return 'info';
  if (!overview.value?.recommendationReachable || outboxCount('DEAD') > 0) return 'error';
  if (outboxCount('PENDING') + outboxCount('PUBLISHING') > 0) return 'warning';
  return 'success';
});

// 卡片值只反映后端配置和健康检查，不在前端推断 ES/MQ 的真实连接信息。
const statusCards = computed(() => [
  {
    key: 'writer',
    label: '业务事件写入',
    value: overview.value?.outboxWriteEnabled ? '运行中' : '未开启',
    tag: overview.value?.outboxWriteEnabled ? 'ON' : 'OFF',
    tagType: (overview.value?.outboxWriteEnabled ? 'success' : 'info') as TagType,
    note: `待发布 ${outboxCount('PENDING')} 条`
  },
  {
    key: 'publisher',
    label: '独立 MQ 发布',
    value: overview.value?.outboxPublisherEnabled ? '运行中' : '未开启',
    tag: overview.value?.outboxPublisherEnabled ? 'ON' : 'OFF',
    tagType: (overview.value?.outboxPublisherEnabled ? 'success' : 'info') as TagType,
    note: `发布中 ${outboxCount('PUBLISHING')} 条`
  },
  {
    key: 'service',
    label: '独立推荐服务',
    value: overview.value?.recommendationReachable ? '可访问' : '不可访问',
    tag: overview.value?.recommendationStatus || '-',
    tagType: (overview.value?.recommendationReachable ? 'success' : 'danger') as TagType,
    note: `健康检查 ${overview.value?.healthTookMillis || 0} ms`
  },
  {
    key: 'outbox',
    label: '已完成事件',
    value: `${outboxCount('PUBLISHED')} 条`,
    tag: outboxCount('DEAD') > 0 ? `死信 ${outboxCount('DEAD')}` : '无死信',
    tagType: (outboxCount('DEAD') > 0 ? 'danger' : 'success') as TagType,
    note: overview.value?.latestPublishedAt ? `最近 ${overview.value.latestPublishedAt}` : '暂无发布记录'
  }
]);

function outboxCount(status: OutboxStatus) {
  return Number(overview.value?.outboxCounts?.[status] || 0);
}

async function loadOverview() {
  overviewLoading.value = true;
  try {
    const response: any = await getRecommendationDiagnosticsOverview();
    overview.value = response.data;
  } finally {
    overviewLoading.value = false;
  }
}

async function loadSwitchSettings() {
  switchLoading.value = true;
  try {
    const response: any = await getRecommendationSwitchSettings();
    Object.assign(switchForm, response.data || {});
  } finally {
    switchLoading.value = false;
  }
}

async function saveSwitchSettings() {
  const risky = switchForm.rerankMode === 'ON' || switchForm.rolloutMode === 'ALL';
  if (risky) {
    try {
      await ElMessageBox.confirm(
        '你选择了正式重排或全量事件，保存后会影响推荐排序或增加异步处理压力。确认继续吗？',
        '确认开启推荐能力',
        { type: 'warning', confirmButtonText: '确认保存', cancelButtonText: '取消' }
      );
    } catch {
      return;
    }
  }
  switchSaving.value = true;
  try {
    const response: any = await updateRecommendationSwitchSettings({ ...switchForm });
    Object.assign(switchForm, response.data || {});
    ElMessage.success('推荐开关已保存');
    await Promise.all([loadOverview(), loadRerankWeights()]);
  } finally {
    switchSaving.value = false;
  }
}

async function loadOutbox() {
  if (!overview.value?.diagnosticsEnabled) {
    outboxRows.value = [];
    total.value = 0;
    return;
  }
  tableLoading.value = true;
  try {
    const response: any = await listRecommendationOutbox(query);
    outboxRows.value = response.rows || [];
    total.value = Number(response.total || 0);
  } finally {
    tableLoading.value = false;
  }
}

async function refreshAll() {
  await Promise.all([loadSwitchSettings(), loadOverview()]);
  await Promise.all([
    loadOutbox(),
    loadRerankWeights(),
    loadCrowdRules(),
    loadCompanyTierRules(),
    loadUniversityRules(),
    loadIndustryGraph(),
    canManageOffline.value ? loadRefreshTasks() : Promise.resolve()
  ]);
}

async function loadRerankWeights() {
  rerankLoading.value = true;
  try {
    const response: any = await getRecommendationRerankWeights(rerankStrategy.value);
    const data = response.data as RecommendationRerankWeightConfig;
    rerankConfig.value = data;
    rerankForm.strategyCode = rerankStrategy.value;
    rerankForm.vectorWeight = Number(data.vectorWeight);
    rerankForm.localWeight = Number(data.localWeight);
    rerankForm.industryWeight = Number(data.industryWeight);
    rerankForm.salaryWeight = Number(data.salaryWeight);
  } finally {
    rerankLoading.value = false;
  }
}

async function saveRerankWeights() {
  if (!rerankWeightValid.value) {
    ElMessage.warning('四项权重之和必须等于 1');
    return;
  }
  rerankSaving.value = true;
  try {
    const response: any = await updateRecommendationRerankWeights({ ...rerankForm, strategyCode: rerankStrategy.value });
    rerankConfig.value = response.data;
    ElMessage.success('精排权重已更新');
  } finally {
    rerankSaving.value = false;
  }
}

function emptyCrowdRule(): RecommendationCrowdRule {
  return {
    strategyCode: 'WHITE_COLLAR',
    matchField: 'JOB_NAME',
    matchValues: '',
    priority: 100,
    status: '0',
    description: ''
  };
}

function emptyCompanyTierRule(): RecommendationCompanyTierRule {
  return {
    companyId: undefined,
    tierCode: 'L3',
    tierName: '普通中小企业',
    scoreBoost: 0.02,
    diversityBucket: '',
    reason: '',
    status: '0'
  };
}

function emptyUniversityRule(): RecommendationUniversityColdStartRule {
  return {
    universityName: '',
    universityTier: 'B',
    matchKeywords: '',
    preferredKeywords: '',
    parkKeywords: '',
    baseBoost: 0.03,
    industryBoost: 0.03,
    parkBoost: 0.02,
    reason: '',
    status: '0'
  };
}

async function loadCrowdRules() {
  crowdRuleLoading.value = true;
  try {
    const response: any = await listRecommendationCrowdRules();
    crowdRules.value = response.data || [];
  } finally {
    crowdRuleLoading.value = false;
  }
}

function openCrowdRuleDialog(row?: RecommendationCrowdRule) {
  Object.assign(crowdRuleForm, emptyCrowdRule(), row || {});
  crowdRuleDialogVisible.value = true;
}

async function saveCrowdRule() {
  if (!crowdRuleForm.matchValues.trim()) {
    ElMessage.warning('请填写匹配值');
    return;
  }
  crowdRuleSaving.value = true;
  try {
    const payload: RecommendationCrowdRule = {
      ...crowdRuleForm,
      matchValues: crowdRuleForm.matchValues.trim()
    };
    delete payload.ruleId;
    if (crowdRuleForm.ruleId) await updateRecommendationCrowdRule(crowdRuleForm.ruleId, payload);
    else await createRecommendationCrowdRule(payload);
    crowdRuleDialogVisible.value = false;
    ElMessage.success('人群识别规则已保存');
    await loadCrowdRules();
  } finally {
    crowdRuleSaving.value = false;
  }
}

function crowdStrategyLabel(strategy: RecommendationCrowdStrategy) {
  if (strategy === 'WHITE_COLLAR') return '白领/专业技术';
  if (strategy === 'BLUE_COLLAR') return '蓝领/门店';
  return '通用';
}

function crowdFieldLabel(field: RecommendationCrowdMatchField) {
  return crowdFieldOptions.find((item) => item.value === field)?.label || field;
}

async function loadCompanyTierRules() {
  companyTierLoading.value = true;
  try {
    const response: any = await listRecommendationCompanyTierRules();
    companyTierRules.value = response.data || [];
  } finally {
    companyTierLoading.value = false;
  }
}

function openCompanyTierDialog(row?: RecommendationCompanyTierRule) {
  Object.assign(companyTierForm, emptyCompanyTierRule(), row || {});
  companyTierDialogVisible.value = true;
}

async function saveCompanyTierRule() {
  if (!companyTierForm.companyId || !companyTierForm.tierName.trim()) {
    ElMessage.warning('请填写企业ID和层级名称');
    return;
  }
  companyTierSaving.value = true;
  try {
    const payload: RecommendationCompanyTierRule = {
      ...companyTierForm,
      tierName: companyTierForm.tierName.trim()
    };
    delete payload.ruleId;
    if (companyTierForm.ruleId) await updateRecommendationCompanyTierRule(companyTierForm.ruleId, payload);
    else await createRecommendationCompanyTierRule(payload);
    companyTierDialogVisible.value = false;
    ElMessage.success('企业分层规则已保存');
    await loadCompanyTierRules();
  } finally {
    companyTierSaving.value = false;
  }
}

async function loadUniversityRules() {
  universityRuleLoading.value = true;
  try {
    const response: any = await listRecommendationUniversityColdStartRules();
    universityRules.value = response.data || [];
  } finally {
    universityRuleLoading.value = false;
  }
}

function openUniversityRuleDialog(row?: RecommendationUniversityColdStartRule) {
  Object.assign(universityRuleForm, emptyUniversityRule(), row || {});
  universityRuleDialogVisible.value = true;
}

async function saveUniversityRule() {
  if (!universityRuleForm.universityName.trim() || !universityRuleForm.matchKeywords.trim()) {
    ElMessage.warning('请填写高校名称和匹配关键词');
    return;
  }
  universityRuleSaving.value = true;
  try {
    const payload: RecommendationUniversityColdStartRule = {
      ...universityRuleForm,
      universityName: universityRuleForm.universityName.trim(),
      matchKeywords: universityRuleForm.matchKeywords.trim()
    };
    delete payload.ruleId;
    if (universityRuleForm.ruleId) await updateRecommendationUniversityColdStartRule(universityRuleForm.ruleId, payload);
    else await createRecommendationUniversityColdStartRule(payload);
    universityRuleDialogVisible.value = false;
    ElMessage.success('高校冷启动规则已保存');
    await loadUniversityRules();
  } finally {
    universityRuleSaving.value = false;
  }
}

function companyTierLabel(value: RecommendationCompanyTierRule['tierCode']) {
  const labels: Record<RecommendationCompanyTierRule['tierCode'], string> = {
    L1: 'L1 南京重点/专精特新',
    L2: 'L2 园区规上重点',
    L3: 'L3 普通中小企业',
    L4: 'L4 小微/门店企业'
  };
  return labels[value] || value;
}

function emptyGraphNode(): IndustryGraphNode {
  return {
    nodeCode: '',
    nodeName: '',
    nodeType: 'CHAIN_STAGE',
    parentId: undefined,
    trackCode: '',
    matchKeywords: '',
    description: '',
    sortOrder: 0,
    status: '0'
  };
}

function emptyGraphEdge(): IndustryGraphEdge {
  return {
    sourceNodeId: '',
    targetNodeId: '',
    relationType: 'ADJACENT_STAGE',
    relationWeight: 0.7,
    bidirectional: '1',
    maxHops: 1,
    reason: '',
    status: '0'
  };
}

async function loadIndustryGraph() {
  graphLoading.value = true;
  try {
    const [nodeResponse, edgeResponse]: any[] = await Promise.all([
      listIndustryGraphNodes(),
      listIndustryGraphEdges()
    ]);
    graphNodes.value = nodeResponse.data || [];
    graphAllNodes.value = nodeResponse.data || [];
    graphEdges.value = edgeResponse.data || [];
    renderIndustryGraphChart();
  } finally {
    graphLoading.value = false;
  }
}

async function loadGraphNodes() {
  graphLoading.value = true;
  try {
    const response: any = await listIndustryGraphNodes({
      nodeType: graphQuery.nodeType,
      keyword: graphQuery.keyword.trim()
    });
    graphNodes.value = response.data || [];
  } finally {
    graphLoading.value = false;
  }
}

function handleGraphTabChange() {
  renderIndustryGraphChart();
}

function renderIndustryGraphChart() {
  if (graphTab.value !== 'chart') return;
  nextTick(() => {
    const el = industryGraphChartRef.value;
    if (!el) return;
    if (!industryGraphChart) industryGraphChart = echarts.init(el);

    const enabledNodes = graphAllNodes.value.filter((node) => node.status === '0');
    const enabledEdges = graphEdges.value.filter((edge) => edge.status === '0');
    const degreeMap = new Map<string, number>();
    enabledEdges.forEach((edge) => {
      const source = String(edge.sourceNodeId || '');
      const target = String(edge.targetNodeId || '');
      if (source) degreeMap.set(source, (degreeMap.get(source) || 0) + 1);
      if (target) degreeMap.set(target, (degreeMap.get(target) || 0) + 1);
    });

    const categories = buildGraphCategories(enabledNodes);
    const categoryIndex = new Map(categories.map((item, index) => [item.name, index]));
    const nodes = enabledNodes.map((node) => {
      const degree = degreeMap.get(String(node.nodeId)) || 0;
      const trackKey = node.trackCode || (node.nodeType === 'TRACK' ? node.nodeCode : '未分组');
      const trackName = graphTrackLabel(trackKey);
      return {
        id: String(node.nodeId),
        name: node.nodeName,
        value: degree,
        category: categoryIndex.get(trackName) || 0,
        symbolSize: Math.min(72, 30 + degree * 8),
        draggable: true,
        label: { show: degree >= 2 || node.nodeType === 'TRACK' },
        itemStyle: {
          color: graphPalette[(categoryIndex.get(trackName) || 0) % graphPalette.length]
        },
        tooltip: {
          formatter: `${node.nodeName}<br/>编码：${node.nodeCode}<br/>赛道：${trackName}<br/>类型：${graphNodeTypeLabel(node.nodeType)}<br/>连接：${degree}`
        }
      };
    });
    const links = enabledEdges.map((edge) => {
      const weight = Number(edge.relationWeight || 0);
      return {
        source: String(edge.sourceNodeId),
        target: String(edge.targetNodeId),
        value: weight,
        label: { show: false, formatter: graphRelationLabel(edge.relationType) },
        lineStyle: {
          width: Math.max(1, weight * 5),
          curveness: edge.bidirectional === '1' ? 0.12 : 0.22,
          opacity: 0.72
        },
        tooltip: {
          formatter: `${edge.sourceNodeName || edge.sourceNodeId} → ${edge.targetNodeName || edge.targetNodeId}<br/>关系：${graphRelationLabel(edge.relationType)}<br/>权重：${weight}`
        }
      };
    });

    industryGraphChart.setOption({
      color: graphPalette,
      tooltip: { trigger: 'item' },
      legend: {
        top: 0,
        left: 'center',
        type: 'scroll',
        data: categories.map((item) => item.name)
      },
      series: [
        {
          type: 'graph',
          layout: 'force',
          roam: true,
          categories,
          data: nodes,
          links,
          top: 48,
          bottom: 16,
          left: 16,
          right: 16,
          force: {
            repulsion: 280,
            edgeLength: [90, 180],
            gravity: 0.08
          },
          edgeSymbol: ['none', 'arrow'],
          edgeSymbolSize: 8,
          label: {
            position: 'right',
            color: '#303133',
            fontSize: 12
          },
          emphasis: {
            focus: 'adjacency',
            lineStyle: { width: 4 }
          },
          lineStyle: {
            color: 'source'
          }
        }
      ]
    });
    industryGraphChart.resize();
  });
}

function buildGraphCategories(nodes: IndustryGraphNode[]) {
  const names: string[] = [];
  nodes.forEach((node) => {
    const key = node.trackCode || (node.nodeType === 'TRACK' ? node.nodeCode : '未分组');
    const name = graphTrackLabel(key);
    if (!names.includes(name)) names.push(name);
  });
  return (names.length ? names : ['未分组']).map((name) => ({ name }));
}

function graphTrackLabel(trackCode?: string) {
  const labels: Record<string, string> = {
    TRACK_IC: '集成电路',
    TRACK_BIOMED: '生物医药',
    TRACK_SOFTWARE: '软件信息',
    TRACK_SMART_MANUFACTURING: '智能制造',
    TRACK_NEW_ENERGY: '新能源',
    TRACK_FINANCE: '金融服务'
  };
  if (!trackCode) return '未分组';
  return labels[trackCode] || trackCode;
}

function openNodeDialog(row?: IndustryGraphNode) {
  Object.assign(nodeForm, emptyGraphNode(), row || {});
  nodeDialogVisible.value = true;
}

function openEdgeDialog(row?: IndustryGraphEdge) {
  Object.assign(edgeForm, emptyGraphEdge(), row || {});
  edgeDialogVisible.value = true;
}

async function saveGraphNode() {
  if (!nodeForm.nodeName.trim() || !nodeForm.nodeCode.trim()) {
    ElMessage.warning('请填写节点名称和编码');
    return;
  }
  graphSaving.value = true;
  try {
    const payload: IndustryGraphNode = { ...nodeForm, nodeCode: nodeForm.nodeCode.trim().toUpperCase() };
    delete payload.nodeId;
    delete payload.dataVersion;
    if (nodeForm.nodeId) await updateIndustryGraphNode(nodeForm.nodeId, payload);
    else await createIndustryGraphNode(payload);
    nodeDialogVisible.value = false;
    ElMessage.success('产业节点已保存');
    await loadIndustryGraph();
  } finally {
    graphSaving.value = false;
  }
}

async function saveGraphEdge() {
  if (!edgeForm.sourceNodeId || !edgeForm.targetNodeId) {
    ElMessage.warning('请选择来源节点和目标节点');
    return;
  }
  if (String(edgeForm.sourceNodeId) === String(edgeForm.targetNodeId)) {
    ElMessage.warning('来源节点和目标节点不能相同');
    return;
  }
  graphSaving.value = true;
  try {
    const payload: IndustryGraphEdge = { ...edgeForm };
    delete payload.edgeId;
    delete payload.sourceNodeName;
    delete payload.targetNodeName;
    delete payload.dataVersion;
    if (edgeForm.edgeId) await updateIndustryGraphEdge(edgeForm.edgeId, payload);
    else await createIndustryGraphEdge(payload);
    edgeDialogVisible.value = false;
    ElMessage.success('产业关系已保存');
    await loadIndustryGraph();
  } finally {
    graphSaving.value = false;
  }
}

function graphNodeTypeLabel(type: IndustryGraphNodeType) {
  return graphNodeTypeOptions.find((item) => item.value === type)?.label || type;
}

function graphRelationLabel(type: IndustryGraphRelationType) {
  return graphRelationOptions.find((item) => item.value === type)?.label || type;
}

function handleQuery() {
  query.pageNum = 1;
  loadOutbox();
}

function resetQuery() {
  queryFormRef.value?.resetFields();
  query.status = '';
  query.entityType = '';
  query.eventType = '';
  query.entityId = undefined;
  query.pageNum = 1;
  loadOutbox();
}

async function runTest() {
  const valid = await testFormRef.value?.validate().catch(() => false);
  if (!valid || !canRunTest.value) return;
  testLoading.value = true;
  testResult.value = undefined;
  try {
    const response: any = await runRecommendationSearchTest(testForm);
    testResult.value = response.data;
    if (testResult.value?.success) {
      ElMessage.success('向量检索完成');
    }
  } finally {
    testLoading.value = false;
  }
}

// 诊断只查询当前租户的记忆元数据，业务编号解析和租户隔离均由管理后端完成。
async function checkMemory() {
  const valid = await memoryFormRef.value?.validate().catch(() => false);
  if (!valid || !canCheckMemory.value) return;
  memoryLoading.value = true;
  memoryResult.value = undefined;
  try {
    const response: any = await getRecommendationMemoryStatus(memoryForm);
    memoryResult.value = response.data;
    if (memoryResult.value?.success && memoryResult.value.present) {
      ElMessage.success('已查询到行为记忆');
    }
  } finally {
    memoryLoading.value = false;
  }
}

// 离线任务只通过受权限保护的管理接口控制，页面不自动轮询，避免产生额外后台压力。
async function loadRefreshTasks() {
  if (!canManageOffline.value) return;
  taskLoading.value = true;
  try {
    const response: any = await listRecommendationRefreshTasks(refreshTaskQuery);
    refreshTasks.value = response.rows || [];
    refreshTaskTotal.value = Number(response.total || 0);
  } finally {
    taskLoading.value = false;
  }
}

async function createRefreshTask() {
  const valid = await refreshFormRef.value?.validate().catch(() => false);
  if (!valid || !canCreateRefreshTask.value) return;
  taskCreating.value = true;
  try {
    const payload: RecommendationRefreshTaskRequest = { ...refreshForm };
    if (payload.refreshMode === 'FULL') payload.changedAfter = undefined;
    await createRecommendationRefreshTask(payload);
    ElMessage.success('离线刷新任务已创建');
    refreshTaskQuery.pageNum = 1;
    await loadRefreshTasks();
  } finally {
    taskCreating.value = false;
  }
}

async function changeRefreshTask(row: RecommendationRefreshTaskRow, action: 'pause' | 'resume' | 'cancel') {
  if (action === 'cancel') {
    await ElMessageBox.confirm('取消后不能恢复；已经进入 Outbox 的数据仍会安全处理。确定取消吗？', '取消离线刷新', { type: 'warning' });
  }
  const actions = {
    pause: pauseRecommendationRefreshTask,
    resume: resumeRecommendationRefreshTask,
    cancel: cancelRecommendationRefreshTask
  };
  await actions[action](row.taskId);
  ElMessage.success(action === 'pause' ? '任务已暂停' : action === 'resume' ? '任务已恢复' : '任务已取消');
  await loadRefreshTasks();
}

function formatConfidence(value: number) {
  const safeValue = Number.isFinite(Number(value)) ? Math.min(1, Math.max(0, Number(value))) : 0;
  return `${(safeValue * 100).toFixed(0)}%`;
}

function entityTypeLabel(value: string) {
  return value === 'CANDIDATE' ? '求职者' : value === 'JOB' ? '岗位' : value || '-';
}

function eventTypeLabel(value: string) {
  return value === 'VECTOR_UPSERT' ? '新增或更新' : value === 'VECTOR_DELETE' ? '删除' : value || '-';
}

function outboxStatusLabel(value: string) {
  return ({ PENDING: '待发布', PUBLISHING: '发布中', PUBLISHED: '已发布', DEAD: '死信' } as Record<string, string>)[value] || value || '-';
}

function outboxStatusType(value: string): TagType {
  return ({ PENDING: 'warning', PUBLISHING: 'primary', PUBLISHED: 'success', DEAD: 'danger' } as Record<string, TagType>)[value] || 'info';
}

function refreshTaskStatusLabel(value: RecommendationRefreshTaskStatus) {
  const labels: Record<RecommendationRefreshTaskStatus, string> = {
    PENDING: '等待中',
    RUNNING: '运行中',
    PAUSED: '已暂停',
    COMPLETED: '入队完成',
    FAILED: '失败',
    CANCELLED: '已取消'
  };
  return labels[value];
}

function refreshTaskStatusType(value: RecommendationRefreshTaskStatus): TagType {
  const types: Record<RecommendationRefreshTaskStatus, TagType> = {
    PENDING: 'info',
    RUNNING: 'primary',
    PAUSED: 'warning',
    COMPLETED: 'success',
    FAILED: 'danger',
    CANCELLED: 'info'
  };
  return types[value];
}

function resultStatusLabel(value: string) {
  const labels: Record<string, string> = {
    SUCCESS: '成功',
    VECTOR_NOT_READY: '源向量未就绪',
    DEPENDENCY_UNAVAILABLE: '依赖不可用',
    AUTH_ERROR: '内部认证失败',
    UNREACHABLE: '服务不可达',
    TEST_DISABLED: '测试未开启',
    SOURCE_NOT_FOUND: '业务编号不存在',
    BUSY: '测试繁忙'
  };
  return labels[value] || value || '-';
}

function resizeIndustryGraphChart() {
  industryGraphChart?.resize();
}

onMounted(() => {
  refreshAll();
  window.addEventListener('resize', resizeIndustryGraphChart);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeIndustryGraphChart);
  industryGraphChart?.dispose();
  industryGraphChart = null;
});
</script>

<style scoped>
.diagnostics-page {
  min-height: calc(100vh - 84px);
  background: #f5f7fa;
}

.hero-card {
  border: 0;
  background: linear-gradient(120deg, #173b6c 0%, #2563a9 58%, #2f7fc1 100%);
  color: #fff;
}

.hero-content,
.card-header,
.status-main,
.object-cell,
.test-actions,
.count-tags {
  display: flex;
  align-items: center;
}

.hero-content,
.card-header {
  justify-content: space-between;
  gap: 16px;
}

.hero-title {
  font-size: 22px;
  font-weight: 600;
  letter-spacing: 1px;
}

.hero-subtitle {
  margin-top: 8px;
  color: rgb(255 255 255 / 78%);
}

.status-card {
  min-height: 142px;
  margin-bottom: 16px;
}

.status-label,
.section-note,
.status-note,
.test-hint {
  color: #909399;
}

.status-main {
  justify-content: space-between;
  margin: 14px 0 12px;
}

.status-value {
  color: #303133;
  font-size: 24px;
  font-weight: 600;
}

.status-note,
.section-note,
.test-hint {
  font-size: 13px;
}

.section-title {
  color: #303133;
  font-size: 17px;
  font-weight: 600;
}

.section-note {
  margin-top: 5px;
}

.filter-collapse {
  margin: 0 0 18px 112px;
}

.test-actions {
  margin-left: 112px;
  gap: 14px;
}

.memory-action {
  display: flex;
  min-height: 32px;
  align-items: center;
  gap: 12px;
}

.test-result {
  margin-top: 22px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.count-tags,
.object-cell,
.blocker-list {
  gap: 8px;
}

.blocker-list {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.readiness-note {
  margin-left: 8px;
  color: #909399;
  font-size: 12px;
}

.graph-chart-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.industry-graph-chart {
  width: 100%;
  height: 520px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background: #fff;
}

@media (max-width: 768px) {
  .hero-content,
  .card-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .filter-collapse,
  .test-actions,
  .memory-action {
    margin-left: 0;
  }

  .memory-action {
    align-items: flex-start;
    flex-direction: column;
  }

  .industry-graph-chart {
    height: 420px;
  }
}
</style>
