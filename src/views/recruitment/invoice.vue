<template>
  <div class="p-4">
    <!-- 统计卡片：数据来源 getInvoiceStatistics；点击卡片会联动列表状态筛选，便于财务快速看待处理票据。 -->
    <el-row :gutter="20" class="mb-4">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-mini-card clickable" :class="{ active: queryParams.status === '' }" @click="applyStatusFilter('')">
          <div class="stat-mini">
            <span class="label">发票总数</span>
            <span class="value">{{ statistics.totalCount || 0 }}</span>
            <span class="stat-subtitle">{{ statistics.totalCount || 0 }} 张，合计 {{ formatMoney(invoiceTotalAmount) }} 元</span>
            <span class="stat-delta" :class="deltaClass(statistics.monthDeltaCount)">本月新增 {{ statistics.monthNewCount || 0 }} 张</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card
          shadow="hover"
          class="stat-mini-card warning clickable"
          :class="{ active: queryParams.status === '0' }"
          @click="applyStatusFilter('0')"
        >
          <div class="stat-mini">
            <span class="label">未开票</span>
            <span class="value warning">{{ statistics.pendingCount || 0 }}</span>
            <span class="stat-subtitle">{{ statistics.pendingCount || 0 }} 张，合计 {{ formatMoney(invoicePendingAmount) }} 元</span>
            <span class="stat-delta" :class="deltaClass(statistics.monthDeltaCount)">较上月 {{ signedCount(statistics.monthDeltaCount) }} 单</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card
          shadow="hover"
          class="stat-mini-card success clickable"
          :class="{ active: queryParams.status === '1' }"
          @click="applyStatusFilter('1')"
        >
          <div class="stat-mini">
            <span class="label">已开票</span>
            <span class="value success">{{ statistics.issuedCount || 0 }}</span>
            <span class="stat-subtitle">{{ statistics.issuedCount || 0 }} 张，合计 {{ formatMoney(invoiceIssuedAmount) }} 元</span>
            <span class="stat-delta" :class="deltaClass(statistics.monthDeltaAmount)">较上月 {{ signedMoney(statistics.monthDeltaAmount) }}</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card
          shadow="hover"
          class="stat-mini-card muted clickable"
          :class="{ active: queryParams.status === '2' }"
          @click="applyStatusFilter('2')"
        >
          <div class="stat-mini">
            <span class="label">已作废</span>
            <span class="value muted">{{ statistics.cancelledCount || 0 }}</span>
            <span class="stat-subtitle">{{ statistics.cancelledCount || 0 }} 张，合计 {{ formatMoney(invoiceCancelledAmount) }} 元</span>
            <span class="stat-delta muted">作废票据弱化展示</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 搜索栏 -->
    <el-card shadow="hover" class="mb-4">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true" class="invoice-query-form">
        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="未开票" value="0" />
            <el-option label="已开票" value="1" />
            <el-option label="已作废" value="2" />
            <el-option label="红冲" value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="台账编号" prop="ledgerOrderNo">
          <el-input v-model="queryParams.ledgerOrderNo" placeholder="输入 ORD- 台账号" clearable style="width: 210px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="上传时间">
          <el-date-picker
            v-model="uploadDateRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            clearable
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item label="上传人" prop="createByName">
          <el-select v-model="queryParams.createByName" placeholder="全部上传人" clearable filterable style="width: 150px">
            <el-option v-for="name in uploaderOptions" :key="name" :label="name" :value="name" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button plain icon="Refresh" @click="resetQuery">重置</el-button>
          <el-button type="success" plain icon="Download" @click="handleExportFiltered">导出筛选结果</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据表格：列表数据来源 listInvoiceManage(/admin/invoice-manage/list)，含金额/上传人/绑定台账号 -->
    <el-card shadow="hover">
      <template #header>
        <div class="invoice-toolbar">
          <div class="toolbar-left">
            <el-button type="primary" icon="Upload" @click="handleUploadOpen">上传发票</el-button>
            <el-tooltip content="批量导入需后端提供 Excel 导入接口后启用" placement="top">
              <span><el-button plain icon="UploadFilled" disabled>批量导入发票</el-button></span>
            </el-tooltip>
          </div>
          <div class="toolbar-right">
            <el-button type="primary" plain icon="Refresh" @click="loadData">刷新</el-button>
            <el-button type="danger" plain icon="Delete" :disabled="!selectedRows.length" @click="handleBatchVoid">批量作废</el-button>
            <el-tooltip content="当前后端未提供批量解绑接口，先保留入口" placement="top">
              <span><el-button plain icon="Link" disabled>批量解绑台账</el-button></span>
            </el-tooltip>
          </div>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="tableData"
        border
        stripe
        row-key="invoiceId"
        :row-class-name="invoiceRowClassName"
        @selection-change="onSelectionChange"
      >
        <el-table-column type="selection" width="46" align="center" />
        <el-table-column label="发票编号" min-width="190" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleDetail(row)">{{ row.invoiceNo || '-' }}</el-button>
          </template>
        </el-table-column>
        <el-table-column label="金额(元)" width="120" align="right">
          <template #default="{ row }">
            <span v-if="row.amount != null" :class="['amount-text', { danger: Number(row.amount) < 0 || String(row.status) === '2' }]">{{
              formatMoney(row.amount)
            }}</span>
            <span v-else class="text-secondary">-</span>
          </template>
        </el-table-column>
        <el-table-column min-width="180" align="center">
          <template #header>
            <span>绑定台账</span>
            <el-tooltip content="一张台账可绑定多张发票；改绑会同步发票归属企业与金额留痕。" placement="top">
              <el-icon class="header-help"><QuestionFilled /></el-icon>
            </el-tooltip>
          </template>
          <template #default="{ row }">
            <div v-if="row.ledgerId" class="ledger-cell">
              <el-button link type="primary" @click="openRelatedLedger(row)">{{ row.ledgerOrderNo || '-' }}</el-button>
              <el-tooltip content="改绑台账" placement="top">
                <el-button link type="primary" icon="Edit" @click="handleBindOpen(row)" />
              </el-tooltip>
            </div>
            <el-button v-else link type="primary" @click="handleBindOpen(row)">绑定台账</el-button>
          </template>
        </el-table-column>
        <el-table-column label="上传人" prop="createByName" width="120" align="center">
          <template #default="{ row }">
            <span class="uploader-cell">
              <el-avatar :size="22" icon="UserFilled" />
              <span>{{ row.createByName || '-' }}</span>
            </span>
          </template>
        </el-table-column>
        <el-table-column label="票据状态" width="105" align="center">
          <template #default="{ row }">
            <el-tag :type="invoiceStatusTagType(row.status)">{{ invoiceStatusMeta(row.status).label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="发票文件" min-width="150" align="center">
          <template #default="{ row }">
            <template v-if="row.filePath">
              <el-button link type="primary" @click="previewFile(row.filePath, row)">查看</el-button>
              <el-button link type="primary" icon="Download" @click="downloadOriginalFile(row)">下载</el-button>
            </template>
            <span v-else class="text-secondary">暂无文件</span>
          </template>
        </el-table-column>
        <el-table-column label="上传时间" width="150" align="center">
          <template #default="{ row }">{{ formatMinuteTime(row.createTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <div class="row-actions">
              <el-button link type="primary" icon="View" @click="handleDetail(row)">详情</el-button>
              <el-button link type="primary" icon="Edit" @click="handleBindOpen(row)">改绑</el-button>
              <el-button
                v-if="String(row.status) !== '2'"
                v-hasPermi="['recruitment:invoice:edit']"
                link
                type="danger"
                icon="Delete"
                @click="handleStatusChange(row, '2')"
              >
                作废
              </el-button>
            </div>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="无对应发票">
            <el-button @click="resetQuery">重置筛选</el-button>
            <el-button type="primary" @click="handleUploadOpen">上传发票</el-button>
          </el-empty>
        </template>
      </el-table>

      <div class="table-footer-summary">共 {{ total }} 条，当前页合计金额：{{ formatMoney(pageTotalAmount) }} 元</div>
      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="loadData" />
    </el-card>

    <!-- 发票详情：围绕财务对账重排为基础信息、业务关联、文件预览三块；空字段不渲染，减少无效占位。 -->
    <el-dialog v-model="detailVisible" title="发票详情" width="960px" append-to-body :close-on-click-modal="true" @closed="resetDetailState">
      <div v-if="currentInvoice" class="invoice-detail">
        <section class="invoice-detail-card">
          <div class="detail-card-title">基础票据信息</div>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">发票编号</span>
              <span class="copyable-value">
                <span class="detail-strong">{{ currentInvoice.invoiceNo || '-' }}</span>
                <el-button v-if="currentInvoice.invoiceNo" link type="primary" icon="CopyDocument" @click="copyText(currentInvoice.invoiceNo)" />
              </span>
            </div>
            <div class="detail-item">
              <span class="detail-label">票据状态</span>
              <span>
                <el-tag :type="invoiceStatusTagType(currentInvoice.status)">{{ invoiceStatusMeta(currentInvoice.status).label }}</el-tag>
                <small v-if="String(currentInvoice.status) === '2' && localVoidReason" class="status-reason">作废原因：{{ localVoidReason }}</small>
              </span>
            </div>
            <div class="detail-item">
              <span class="detail-label">金额(元)</span>
              <span class="copyable-value">
                <span :class="['detail-amount', { voided: String(currentInvoice.status) === '2' }]">{{ formatMoney(currentInvoice.amount) }}</span>
                <el-button
                  v-if="currentInvoice.amount != null"
                  link
                  type="primary"
                  icon="CopyDocument"
                  @click="copyText(formatMoney(currentInvoice.amount))"
                />
              </span>
            </div>
            <div v-if="currentInvoice.createTime" class="detail-item">
              <span class="detail-label">创建时间</span>
              <el-tooltip :content="formatFullTime(currentInvoice.createTime)" placement="top">
                <span>{{ formatMinuteTime(currentInvoice.createTime) }}</span>
              </el-tooltip>
            </div>
            <div v-if="shouldShowUpdateTime" class="detail-item">
              <span class="detail-label">更新时间</span>
              <el-tooltip :content="formatFullTime(currentInvoice.updateTime)" placement="top">
                <span>{{ formatMinuteTime(currentInvoice.updateTime) }}</span>
              </el-tooltip>
            </div>
          </div>
        </section>

        <section class="invoice-detail-card">
          <div class="detail-card-title">业务关联信息</div>
          <div class="detail-grid">
            <div v-if="currentInvoice.companyName" class="detail-item">
              <span class="detail-label">企业</span>
              <el-button link type="primary" @click="openRelatedCompany(currentInvoice)">{{ currentInvoice.companyName }}</el-button>
            </div>
            <div v-if="currentInvoice.ledgerOrderNo" class="detail-item">
              <span class="detail-label">绑定台账编号</span>
              <span>
                <span class="copyable-value">
                  <el-button link type="primary" @click="openRelatedLedger(currentInvoice)">{{ currentInvoice.ledgerOrderNo }}</el-button>
                  <el-button link type="primary" icon="CopyDocument" @click="copyText(currentInvoice.ledgerOrderNo)" />
                  <el-button link type="primary" icon="Edit" @click="handleBindOpen(currentInvoice)">改绑台账</el-button>
                </span>
                <small class="detail-help">当前台账已绑定 {{ sameLedgerInvoices.length }} 张发票</small>
              </span>
            </div>
            <div v-if="currentInvoice.createByName" class="detail-item">
              <span class="detail-label">上传人</span>
              <span class="uploader-cell">
                <el-avatar :size="24" icon="UserFilled" />
                <span>{{ currentInvoice.createByName }}</span>
              </span>
            </div>
            <div class="detail-item detail-item-full">
              <span class="detail-label">备注</span>
              <span class="remark-line">
                <span :class="{ 'remark-placeholder': !detailRemarkText }">{{ detailRemarkText || '点击编辑添加对账备注' }}</span>
                <el-button link type="primary" icon="Edit" @click="openRemarkEditor">编辑备注</el-button>
              </span>
            </div>
          </div>
        </section>

        <section class="invoice-detail-card">
          <div class="detail-card-title">发票文件预览</div>
          <div v-if="currentInvoice.filePath" class="invoice-preview-box" v-loading="filePreviewLoading">
            <template v-if="!filePreviewFailed">
              <el-image
                v-if="isCurrentInvoiceImage && previewFileUrl"
                :key="filePreviewReloadKey"
                :src="previewFileUrl"
                :preview-src-list="[previewFileUrl]"
                fit="contain"
                class="invoice-preview-image"
                @load="filePreviewLoading = false"
                @error="handlePreviewError"
              />
              <iframe
                v-else-if="isCurrentInvoicePdf && previewFileUrl"
                :key="filePreviewReloadKey"
                class="invoice-preview-frame"
                :src="previewFileUrl"
                @load="filePreviewLoading = false"
              />
              <div v-else-if="filePreviewLoading" class="invoice-preview-fallback">
                <el-icon class="is-loading"><Loading /></el-icon>
                <div>发票原件加载中...</div>
              </div>
              <div v-else class="invoice-preview-fallback">
                <el-icon><Document /></el-icon>
                <div>当前文件类型不支持在线预览</div>
              </div>
            </template>
            <div v-else class="invoice-preview-fallback">
              <el-icon><WarningFilled /></el-icon>
              <div class="fallback-title">文件加载异常，无法预览发票原件</div>
              <div class="fallback-actions">
                <el-button type="primary" plain icon="Refresh" @click="reloadPreview">重新加载</el-button>
                <el-button type="primary" icon="Download" @click="downloadOriginalFile(currentInvoice)">直接下载文件</el-button>
              </div>
              <small>若持续失败，请检查文件存储或联系运维</small>
            </div>
            <div class="preview-floating-actions">
              <el-button size="small" icon="Download" @click="downloadOriginalFile(currentInvoice)">下载原件</el-button>
              <el-button size="small" icon="Printer" @click="printInvoiceFile">打印发票</el-button>
            </div>
          </div>
          <el-empty v-else description="未上传发票原件">
            <el-button type="primary" icon="Upload" @click="handleUploadOpen">补充上传附件</el-button>
          </el-empty>
        </section>
      </div>
      <template #footer>
        <div class="detail-footer">
          <div class="detail-footer-left">
            <el-button v-if="currentInvoice" type="primary" plain icon="Edit" @click="handleBindOpen(currentInvoice)">改绑台账</el-button>
            <el-button v-if="currentInvoice?.filePath" type="primary" plain icon="Download" @click="downloadOriginalFile(currentInvoice)"
              >下载发票</el-button
            >
            <el-button plain icon="Edit" @click="openRemarkEditor">编辑备注</el-button>
            <el-button
              v-if="currentInvoice && String(currentInvoice.status) !== '2'"
              v-hasPermi="['recruitment:invoice:edit']"
              type="danger"
              plain
              icon="Delete"
              @click="openVoidDialog(currentInvoice)"
            >
              作废票据
            </el-button>
          </div>
          <div>
            <el-button
              v-if="currentInvoice?.filePath"
              type="primary"
              plain
              icon="FullScreen"
              :disabled="!previewFileUrl"
              @click="fullscreenPreviewVisible = true"
              >全屏预览</el-button
            >
            <el-button @click="detailVisible = false">关闭</el-button>
          </div>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="remarkEditorVisible" title="编辑备注" width="460px" append-to-body>
      <el-input v-model="remarkDraft" type="textarea" :rows="4" maxlength="200" show-word-limit placeholder="填写对账备注、核销记录" />
      <template #footer>
        <el-button @click="remarkEditorVisible = false">取消</el-button>
        <el-button type="primary" @click="saveLocalRemark">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="voidDialogVisible" title="作废票据" width="460px" append-to-body>
      <el-alert class="mb-3" type="warning" show-icon :closable="false" title="作废后票据将弱化展示，请确认已完成财务核对。" />
      <el-input v-model="voidReasonDraft" type="textarea" :rows="3" maxlength="200" show-word-limit placeholder="请填写作废原因" />
      <template #footer>
        <el-button @click="voidDialogVisible = false">取消</el-button>
        <el-button type="danger" :loading="submitting" @click="submitVoidWithReason">确认作废</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="fullscreenPreviewVisible" title="发票全屏预览" width="92vw" append-to-body>
      <div v-if="currentInvoice?.filePath && previewFileUrl" class="fullscreen-preview">
        <el-image v-if="isCurrentInvoiceImage" :src="previewFileUrl" :preview-src-list="[previewFileUrl]" fit="contain" />
        <iframe v-else class="fullscreen-preview-frame" :src="previewFileUrl" />
      </div>
    </el-dialog>

    <!-- 上传发票对话框：提交 uploadInvoiceManage(/admin/invoice-manage/upload)。
         发票文件先传 OSS(/resource/oss/upload) 拿到 url 作为 filePath；
         若填台账ID，后端会以台账金额/归属企业为准（amount/companyId 仅作展示与留痕）。 -->
    <el-dialog
      v-model="uploadVisible"
      title="上传发票"
      width="640px"
      append-to-body
      :close-on-click-modal="true"
      :close-on-press-escape="true"
      @closed="resetUploadForm"
    >
      <el-form ref="uploadFormRef" :model="uploadForm" :rules="uploadRules" label-width="104px" status-icon>
        <el-form-item label="发票编码" prop="invoiceNo">
          <el-input v-model="uploadForm.invoiceNo" placeholder="由 code 管理自动生成" readonly>
            <template #append>
              <el-button :loading="invoiceNoLoading" @click="generateInvoiceNo">换一个</el-button>
            </template>
          </el-input>
          <div class="invoice-upload-tip">发票编码来自流水编号配置 INVOICE，提交时随发票一并保存。</div>
        </el-form-item>
        <el-form-item label="发票文件" prop="filePath">
          <el-upload
            ref="invoiceUploadRef"
            class="invoice-upload"
            :action="ossUploadUrl"
            :headers="uploadHeaders"
            :limit="1"
            :accept="invoiceAccept"
            drag
            :show-file-list="false"
            :before-upload="beforeInvoiceUpload"
            :on-progress="onInvoiceUploadProgress"
            :on-success="onInvoiceUploadSuccess"
            :on-error="onInvoiceUploadError"
            :on-remove="onInvoiceFileRemove"
            :on-exceed="onInvoiceFileExceed"
          >
            <div class="invoice-upload-drop">
              <el-icon class="invoice-upload-icon"><upload-filled /></el-icon>
              <div class="invoice-upload-title">点击或拖拽发票文件至此上传</div>
              <div class="invoice-upload-formats">
                <span class="format-badge">PDF</span>
                <span class="format-badge">JPG</span>
                <span class="format-badge">PNG</span>
              </div>
              <div class="invoice-upload-tip">选择时会校验格式与大小，单个文件不超过 10MB</div>
            </div>
          </el-upload>
          <div v-if="hasInvoiceFile" class="invoice-file-card">
            <div class="invoice-file-preview">
              <el-image
                v-if="isImageInvoiceFile && invoiceFileMeta.url"
                :src="invoiceFileMeta.url"
                :preview-src-list="[invoiceFileMeta.url]"
                fit="cover"
                class="invoice-file-thumb"
              />
              <span v-else>{{ invoiceFileExtLabel }}</span>
            </div>
            <div class="invoice-file-main">
              <el-tooltip :content="invoiceFileMeta.name" placement="top" :disabled="invoiceFileMeta.name.length < 28">
                <div class="invoice-file-name">{{ invoiceFileMeta.name }}</div>
              </el-tooltip>
              <div class="invoice-file-meta">
                <span>{{ invoiceFileSizeText }}</span>
                <span v-if="invoiceUploading">上传中...</span>
                <span v-else class="invoice-file-done">已上传</span>
              </div>
            </div>
            <el-button link type="danger" icon="Delete" @click.stop="clearInvoiceFile">删除重传</el-button>
          </div>
        </el-form-item>
        <el-form-item label="关联台账" prop="ledgerId">
          <div class="ledger-select-wrap">
            <el-tooltip :content="formatLedgerTooltip(selectedUploadLedger)" placement="top" :disabled="!selectedUploadLedger">
              <el-select
                v-model="uploadForm.ledgerId"
                filterable
                remote
                clearable
                reserve-keyword
                :remote-method="loadLedgerOptions"
                :loading="ledgerLoading"
                placeholder="输入台账编号搜索"
                style="width: 100%"
                @visible-change="handleLedgerVisibleChange"
                @change="handleUploadLedgerChange"
              >
                <el-option v-for="item in ledgerOptions" :key="item.ledgerId" :label="formatLedgerShortLabel(item)" :value="item.ledgerId">
                  <div class="ledger-option">
                    <span class="ledger-option-main">
                      <span>{{ item.orderNo || '未编号台账' }}</span>
                      <el-tag size="small" :type="ledgerStatusMeta(item.status).type">{{ ledgerStatusMeta(item.status).label }}</el-tag>
                    </span>
                    <span class="ledger-option-meta"
                      >{{ item.companyName || '企业-' }} / {{ item.amount != null ? formatMoney(item.amount) : '-' }} 元</span
                    >
                  </div>
                </el-option>
              </el-select>
            </el-tooltip>
            <div v-if="selectedUploadLedger" class="selected-ledger-meta">
              已选 {{ formatLedgerShortLabel(selectedUploadLedger) }}， {{ ledgerStatusMeta(selectedUploadLedger.status).label }}，台账金额
              {{ selectedUploadLedger.amount != null ? formatMoney(selectedUploadLedger.amount) : '-' }} 元
              <el-button link type="primary" size="small" @click="openLedgerDetail(selectedUploadLedger)">查看详情</el-button>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="金额(元)" prop="amount">
          <el-input
            v-model="uploadForm.amount"
            placeholder="请输入发票金额"
            clearable
            style="width: 100%"
            @input="handleAmountInput"
            @blur="normalizeAmountInput"
          >
            <template #prefix>￥</template>
          </el-input>
          <div v-if="isAmountOverLedger" class="amount-warning">
            当前金额已超出台账金额 {{ formatMoney(selectedUploadLedger?.amount) }} 元，提交前需再次确认。
          </div>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="uploadForm.status" placeholder="默认已开票" style="width: 100%">
            <el-option label="已开票" value="1" />
            <el-option label="作废" value="2" />
            <el-option label="红冲" value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="uploadForm.remark"
            type="textarea"
            :rows="3"
            maxlength="200"
            show-word-limit
            placeholder="填写发票备注、操作说明，内容将同步至审计日志"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="invoice-dialog-footer">
          <div class="required-tip"><span>*</span> 为必填项</div>
          <div>
            <el-button @click="uploadVisible = false">取消</el-button>
            <el-button type="primary" :loading="submitting" :disabled="!canSubmitUpload" @click="submitUpload">确定</el-button>
          </div>
        </div>
      </template>
    </el-dialog>

    <!-- 绑定/改绑台账对话框：提交 bindInvoiceManage(/admin/invoice-manage/bind)，后端同步发票归属企业为台账企业 -->
    <el-dialog v-model="bindVisible" title="绑定台账" width="460px" append-to-body @closed="resetBindForm">
      <el-form ref="bindFormRef" :model="bindForm" :rules="bindRules" label-width="100px">
        <el-form-item label="台账" prop="ledgerId">
          <el-select
            v-model="bindForm.ledgerId"
            filterable
            remote
            clearable
            reserve-keyword
            :remote-method="loadLedgerOptions"
            :loading="ledgerLoading"
            placeholder="输入台账编号搜索"
            style="width: 100%"
            @visible-change="handleLedgerVisibleChange"
          >
            <el-option v-for="item in ledgerOptions" :key="item.ledgerId" :label="formatLedgerShortLabel(item)" :value="item.ledgerId">
              <div class="ledger-option">
                <span class="ledger-option-main">
                  <span>{{ item.orderNo || '未编号台账' }}</span>
                  <el-tag size="small" :type="ledgerStatusMeta(item.status).type">{{ ledgerStatusMeta(item.status).label }}</el-tag>
                </span>
                <span class="ledger-option-meta"
                  >{{ item.companyName || '企业-' }} / {{ item.amount != null ? formatMoney(item.amount) : '-' }} 元</span
                >
              </div>
            </el-option>
          </el-select>
          <div v-if="selectedBindLedger" class="selected-ledger-meta">
            {{ selectedBindLedger.companyName || '企业-' }} / {{ ledgerStatusMeta(selectedBindLedger.status).label }} /
            {{ selectedBindLedger.amount != null ? formatMoney(selectedBindLedger.amount) : '-' }} 元
            <el-button link type="primary" size="small" @click="openLedgerDetail(selectedBindLedger)">查看详情</el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="bindVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitBind">确定</el-button>
      </template>
    </el-dialog>

    <!-- 关联台账详情：用于上传/改绑时核对已结算、待结算台账的企业、金额与发票绑定状态。 -->
    <el-dialog v-model="ledgerDetailVisible" title="台账详情" width="640px" append-to-body>
      <el-skeleton v-if="ledgerDetailLoading" :rows="5" animated />
      <el-descriptions v-else-if="currentLedger" :column="2" border>
        <el-descriptions-item label="台账编号" :span="2">{{ currentLedger.orderNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="企业">{{ currentLedger.companyName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="求职人">{{ currentLedger.userName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="结算金额">{{ currentLedger.amount != null ? formatMoney(currentLedger.amount) : '-' }} 元</el-descriptions-item>
        <el-descriptions-item label="结算状态">
          <el-tag :type="ledgerStatusMeta(currentLedger.status).type">{{ ledgerStatusMeta(currentLedger.status).label }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="发票状态">
          <el-tag :type="ledgerInvoiceStatusMeta(currentLedger.invoiceStatus).type">{{
            ledgerInvoiceStatusMeta(currentLedger.invoiceStatus).label
          }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="结算时间">{{ currentLedger.settleTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ currentLedger.createTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="结算备注" :span="2">{{ currentLedger.settleRemark || '暂无' }}</el-descriptions-item>
      </el-descriptions>
      <el-empty v-else description="暂无台账详情" />
      <template #footer>
        <el-button @click="ledgerDetailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="InvoiceManagement" lang="ts">
import { computed, ref, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules, UploadInstance, UploadProps } from 'element-plus';
import request, { download, globalHeaders } from '@/utils/request';
import {
  getInvoiceStatistics,
  getInvoice,
  getLedger,
  invoiceExportUrl,
  listInvoiceLedgerOptions,
  listInvoiceManage,
  uploadInvoiceManage,
  bindInvoiceManage,
  markInvoiceManageStatus
} from '@/api/recruitment';
import type { InvoiceManageVO, InvoiceUploadForm, LedgerVO } from '@/api/recruitment';
import { nextSerialNo } from '@/api/recruitment/serialRule';
import { unwrapList, formatMoney } from './helpers';
import { invoiceStatusMeta, ledgerInvoiceStatusMeta, ledgerStatusMeta } from './constants';

interface InvoiceFileMeta {
  name: string;
  size: number;
  type: string;
  url: string;
}

type InvoiceUploadDialogForm = Omit<InvoiceUploadForm, 'filePath' | 'companyId' | 'amount' | 'status' | 'remark'> & {
  invoiceNo: string;
  filePath: string;
  ossId?: number | string;
  fileOssId?: number | string;
  companyId?: number | string;
  amount: string;
  status: string;
  remark: string;
};
type SnowflakeId = number | string;

const loading = ref(false);
const router = useRouter();
const route = useRoute();
const submitting = ref(false);
const total = ref(0);
const tableData = ref<InvoiceManageVO[]>([]);
const detailVisible = ref(false);
const currentInvoice = ref<any>(null);
const sameLedgerInvoices = ref<InvoiceManageVO[]>([]);
const filePreviewLoading = ref(false);
const filePreviewFailed = ref(false);
const filePreviewReloadKey = ref(0);
const filePreviewObjectUrl = ref('');
const filePreviewType = ref<'image' | 'pdf' | 'file'>('file');
const fullscreenPreviewVisible = ref(false);
const remarkEditorVisible = ref(false);
const remarkDraft = ref('');
const localRemarkMap = reactive<Record<string, string>>({});
const voidDialogVisible = ref(false);
const voidReasonDraft = ref('');
const voidTarget = ref<InvoiceManageVO | null>(null);
const localVoidReasonMap = reactive<Record<string, string>>({});
const queryFormRef = ref<FormInstance>();
const ledgerOptions = ref<LedgerVO[]>([]);
const ledgerLoading = ref(false);
const invoiceNoLoading = ref(false);
const ledgerDetailVisible = ref(false);
const ledgerDetailLoading = ref(false);
const currentLedger = ref<LedgerVO | null>(null);
const selectedRows = ref<InvoiceManageVO[]>([]);
const uploadDateRange = ref<string[]>([]);

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  companyId: undefined as string | undefined,
  ledgerId: undefined as string | undefined,
  ledgerOrderNo: '',
  createByName: '',
  beginTime: '',
  endTime: '',
  status: ''
});

const statistics = reactive({
  totalCount: 0,
  pendingCount: 0,
  issuedCount: 0,
  cancelledCount: 0,
  totalAmount: undefined as number | undefined,
  pendingAmount: undefined as number | undefined,
  issuedAmount: undefined as number | undefined,
  cancelledAmount: undefined as number | undefined,
  monthNewCount: 0,
  monthNewAmount: 0,
  monthDeltaCount: 0,
  monthDeltaAmount: 0
});

// ===== OSS 上传配置（发票文件先传 OSS 拿到 url 作为 filePath）=====
const ossUploadUrl = import.meta.env.VITE_APP_BASE_API + '/resource/oss/upload';
const uploadHeaders = ref(globalHeaders());
const invoiceAccept = '.pdf,.jpg,.jpeg,.png';

// ===== 上传发票对话框 =====
const uploadVisible = ref(false);
const uploadFormRef = ref<FormInstance>();
const invoiceUploadRef = ref<UploadInstance>();
const invoiceUploading = ref(false);
const invoiceFileMeta = reactive<InvoiceFileMeta>({
  name: '',
  size: 0,
  type: '',
  url: ''
});
const uploadForm = reactive<InvoiceUploadDialogForm>({
  invoiceNo: '',
  filePath: '',
  ossId: undefined,
  fileOssId: undefined,
  ledgerId: undefined,
  companyId: undefined,
  amount: '',
  status: '1',
  remark: ''
});
const uploadRules: FormRules<InvoiceUploadDialogForm> = {
  invoiceNo: [{ required: true, message: '请先生成发票编码', trigger: 'change' }],
  filePath: [{ required: true, message: '请先上传发票文件', trigger: 'change' }],
  ledgerId: [{ required: true, message: '请选择绑定台账', trigger: 'change' }],
  amount: [
    { required: true, message: '请输入发票金额', trigger: 'blur' },
    { validator: validateInvoiceAmount, trigger: ['blur', 'change'] }
  ]
};
const selectedUploadLedger = computed(() => findLedgerOption(uploadForm.ledgerId));
const hasInvoiceFile = computed(() => Boolean(invoiceFileMeta.name));
const invoiceFileExtLabel = computed(() => getFileExt(invoiceFileMeta.name).toUpperCase() || 'FILE');
const invoiceFileSizeText = computed(() => formatFileSize(invoiceFileMeta.size));
const isImageInvoiceFile = computed(() => ['jpg', 'jpeg', 'png'].includes(getFileExt(invoiceFileMeta.name)));
const isAmountOverLedger = computed(() => {
  const ledgerAmount = Number(selectedUploadLedger.value?.amount);
  const invoiceAmount = Number(uploadForm.amount);
  return Number.isFinite(ledgerAmount) && Number.isFinite(invoiceAmount) && invoiceAmount > ledgerAmount;
});
const canSubmitUpload = computed(() =>
  Boolean(
    uploadForm.invoiceNo &&
    uploadForm.filePath &&
    uploadForm.ledgerId &&
    isValidInvoiceAmount(uploadForm.amount) &&
    !invoiceUploading.value &&
    !submitting.value
  )
);
const pageTotalAmount = computed(() => sumAmount(tableData.value));
const invoiceTotalAmount = computed(() => amountWithFallback(statistics.totalAmount, tableData.value));
const invoicePendingAmount = computed(() =>
  amountWithFallback(
    statistics.pendingAmount,
    tableData.value.filter((row) => row.status === '0')
  )
);
const invoiceIssuedAmount = computed(() =>
  amountWithFallback(
    statistics.issuedAmount,
    tableData.value.filter((row) => row.status === '1')
  )
);
const invoiceCancelledAmount = computed(() =>
  amountWithFallback(
    statistics.cancelledAmount,
    tableData.value.filter((row) => row.status === '2')
  )
);
const uploaderOptions = computed(() =>
  Array.from(new Set(tableData.value.map((row) => row.createByName).filter((name): name is string => Boolean(name)))).sort((a, b) =>
    a.localeCompare(b)
  )
);

// ===== 绑定台账对话框 =====
const bindVisible = ref(false);
const bindFormRef = ref<FormInstance>();
const bindForm = reactive<{ invoiceId?: SnowflakeId; ledgerId?: SnowflakeId }>({
  invoiceId: undefined,
  ledgerId: undefined
});
const bindRules = {
  ledgerId: [{ required: true, message: '请选择台账', trigger: 'change' }]
};
const selectedBindLedger = computed(() => findLedgerOption(bindForm.ledgerId));
const detailRemarkText = computed(() => {
  const invoiceId = idKey(currentInvoice.value?.invoiceId);
  return (invoiceId && localRemarkMap[invoiceId]) || currentInvoice.value?.remark || '';
});
const localVoidReason = computed(() => {
  const invoiceId = idKey(currentInvoice.value?.invoiceId);
  return (invoiceId && localVoidReasonMap[invoiceId]) || currentInvoice.value?.voidReason || currentInvoice.value?.cancelReason || '';
});
const shouldShowUpdateTime = computed(() => {
  const invoice = currentInvoice.value;
  return Boolean(invoice?.updateTime && invoice.updateTime !== invoice.createTime);
});
const currentFileExt = computed(() => getFileExt(currentInvoice.value?.filePath || ''));
const isCurrentInvoiceImage = computed(() => filePreviewType.value === 'image' || ['jpg', 'jpeg', 'png'].includes(currentFileExt.value));
const isCurrentInvoicePdf = computed(() => filePreviewType.value === 'pdf' || currentFileExt.value === 'pdf');
const previewFileUrl = computed(() => filePreviewObjectUrl.value);

function validateInvoiceAmount(_: unknown, value: string, callback: (error?: Error) => void) {
  if (!value) {
    callback(new Error('请输入发票金额'));
    return;
  }
  if (!isValidInvoiceAmount(value)) {
    callback(new Error('金额仅支持正数，最多两位小数'));
    return;
  }
  callback();
}

function isValidInvoiceAmount(value?: string) {
  if (!value) return false;
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return false;
  return Number(value) > 0;
}

function toAmountText(amount?: number | string | null) {
  if (amount == null || amount === '' || isNaN(Number(amount))) return '';
  return Number(amount).toFixed(2);
}

function sumAmount(rows: InvoiceManageVO[]) {
  return rows.reduce((sum, row) => sum + (Number.isFinite(Number(row.amount)) ? Number(row.amount) : 0), 0);
}

function amountWithFallback(amount: number | undefined, rows: InvoiceManageVO[]) {
  return amount != null ? amount : sumAmount(rows);
}

function signedCount(value?: number) {
  const num = Number(value || 0);
  if (num > 0) return `+${num}`;
  return String(num);
}

function signedMoney(value?: number) {
  const num = Number(value || 0);
  const sign = num > 0 ? '+' : '';
  return `${sign}${formatMoney(num)} 元`;
}

function deltaClass(value?: number) {
  const num = Number(value || 0);
  if (num > 0) return 'up';
  if (num < 0) return 'down';
  return 'muted';
}

function idKey(value?: SnowflakeId | null) {
  return value == null || value === '' ? undefined : String(value);
}

function isSameId(left?: SnowflakeId | null, right?: SnowflakeId | null) {
  const leftId = idKey(left);
  const rightId = idKey(right);
  return Boolean(leftId && rightId && leftId === rightId);
}

function sanitizeAmountInput(value: string | number) {
  let next = String(value ?? '').replace(/[^\d.]/g, '');
  const firstDotIndex = next.indexOf('.');
  if (firstDotIndex >= 0) {
    next = next.slice(0, firstDotIndex + 1) + next.slice(firstDotIndex + 1).replace(/\./g, '');
  }
  const [integer = '', decimal = ''] = next.split('.');
  const normalizedInteger = integer.replace(/^0+(?=\d)/, '') || (next.startsWith('.') ? '0' : integer);
  return next.includes('.') ? `${normalizedInteger || '0'}.${decimal.slice(0, 2)}` : normalizedInteger;
}

function handleAmountInput(value: string) {
  const sanitizedValue = sanitizeAmountInput(value);
  if (uploadForm.amount !== sanitizedValue) {
    uploadForm.amount = sanitizedValue;
  }
  uploadFormRef.value?.validateField('amount');
}

function normalizeAmountInput() {
  if (isValidInvoiceAmount(uploadForm.amount)) {
    uploadForm.amount = Number(uploadForm.amount).toFixed(2);
  }
  uploadFormRef.value?.validateField('amount');
}

function getFileExt(fileName?: string) {
  const name = fileName || '';
  const dotIndex = name.lastIndexOf('.');
  return dotIndex >= 0 ? name.slice(dotIndex + 1).toLowerCase() : '';
}

function formatFileSize(size?: number) {
  if (!size) return '0 KB';
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

function formatMinuteTime(value?: string) {
  if (!value) return '-';
  return value.replace('T', ' ').slice(0, 16);
}

function formatFullTime(value?: string) {
  if (!value) return '-';
  return value.replace('T', ' ');
}

function syncDateRangeToQuery() {
  queryParams.beginTime = uploadDateRange.value?.[0] ? `${uploadDateRange.value[0]} 00:00:00` : '';
  queryParams.endTime = uploadDateRange.value?.[1] ? `${uploadDateRange.value[1]} 23:59:59` : '';
}

function buildInvoiceQueryParams() {
  syncDateRangeToQuery();
  const params: any = {
    pageNum: queryParams.pageNum,
    pageSize: queryParams.pageSize
  };
  if (queryParams.companyId) params.companyId = queryParams.companyId;
  if (queryParams.ledgerId) params.ledgerId = queryParams.ledgerId;
  if (queryParams.ledgerOrderNo) {
    params.ledgerOrderNo = queryParams.ledgerOrderNo.trim();
    params.orderNo = queryParams.ledgerOrderNo.trim();
  }
  if (queryParams.createByName) params.createByName = queryParams.createByName;
  if (queryParams.beginTime) params.beginTime = queryParams.beginTime;
  if (queryParams.endTime) params.endTime = queryParams.endTime;
  if (queryParams.status) params.status = queryParams.status;
  return params;
}

async function loadLedgerOptions(keyword = '') {
  ledgerLoading.value = true;
  try {
    const trimmedKeyword = keyword.trim();
    const buildLedgerQueries = (baseParams: Record<string, unknown>) =>
      ['0', '1'].map((status) =>
        listInvoiceLedgerOptions({
          pageNum: 1,
          pageSize: 20,
          status,
          ...baseParams
        })
      );
    const orderNoQueries = buildLedgerQueries({ orderNo: trimmedKeyword || undefined });
    // 台账选择同时承担“按台账号”和“按企业ID”找台账，避免运营复制长台账号。
    const companyIdQueries =
      trimmedKeyword && /^\d+$/.test(trimmedKeyword)
        ? buildLedgerQueries({
            companyId: trimmedKeyword
          })
        : [];
    // 发票关联台账需要同时露出待结算与已结算，便于财务按实际开票节奏先绑后结或结后补票。
    const responses = await Promise.all([...orderNoQueries, ...companyIdQueries]);
    const rows = responses.flatMap((res) => unwrapList<LedgerVO>(res).rows);
    ledgerOptions.value = mergeLedgerOptions(ledgerOptions.value.filter(isSelectedLedger), rows);
  } catch (error) {
    console.error('加载台账列表失败:', error);
  } finally {
    ledgerLoading.value = false;
  }
}

function handleLedgerVisibleChange(visible: boolean) {
  if (visible) {
    loadLedgerOptions();
  }
}

function mergeLedgerOptions(left: LedgerVO[], right: LedgerVO[]) {
  const map = new Map<string, LedgerVO>();
  [...left, ...right].forEach((item) => {
    const ledgerId = idKey(item.ledgerId);
    if (ledgerId) {
      map.set(ledgerId, item);
    }
  });
  return Array.from(map.values()).sort(compareInvoiceLedgerOption);
}

function compareInvoiceLedgerOption(a: LedgerVO, b: LedgerVO) {
  const statusWeight = (status?: string | null) => {
    if (String(status) === '1') return 0;
    if (String(status) === '0') return 1;
    return 2;
  };
  const statusDiff = statusWeight(a.status) - statusWeight(b.status);
  if (statusDiff !== 0) return statusDiff;
  return String(b.createTime || b.orderNo || '').localeCompare(String(a.createTime || a.orderNo || ''));
}

function isSelectedLedger(item: LedgerVO) {
  return isSameId(item.ledgerId, uploadForm.ledgerId) || isSameId(item.ledgerId, bindForm.ledgerId);
}

function formatLedgerShortLabel(item?: LedgerVO | null) {
  if (!item) return '';
  return item.orderNo || '未编号台账';
}

function formatLedgerLabel(item: LedgerVO) {
  const orderNo = formatLedgerShortLabel(item);
  const company = item.companyName || '企业-';
  const amount = item.amount != null ? `${formatMoney(item.amount)}元` : '金额-';
  return `${orderNo} / ${ledgerStatusMeta(item.status).label} / ${company} / ${amount}`;
}

function formatLedgerTooltip(item?: LedgerVO | null) {
  return item ? formatLedgerLabel(item) : '';
}

function findLedgerOption(ledgerId?: number | string) {
  const targetId = idKey(ledgerId);
  if (!targetId) return undefined;
  return ledgerOptions.value.find((item) => idKey(item.ledgerId) === targetId);
}

function handleUploadLedgerChange(ledgerId?: number | string) {
  if (ledgerId == null || ledgerId === '') {
    uploadForm.companyId = undefined;
    uploadForm.amount = '';
    return;
  }
  const ledger = findLedgerOption(ledgerId);
  if (!ledger) return;
  uploadForm.companyId = ledger.companyId;
  uploadForm.amount = ledger.amount != null ? toAmountText(ledger.amount) : '';
  uploadFormRef.value?.validateField('amount');
}

async function loadData() {
  loading.value = true;
  try {
    // 仅提交有值的查询条件，避免空字符串污染后端 LambdaQueryWrapper
    const res = await listInvoiceManage(buildInvoiceQueryParams());
    const list = unwrapList<InvoiceManageVO>(res);
    tableData.value = list.rows;
    total.value = list.total;
  } catch (error) {
    console.error('加载数据失败:', error);
  } finally {
    loading.value = false;
  }
}

async function loadStatistics() {
  try {
    const res = await getInvoiceStatistics();
    Object.assign(statistics, res.data || {});
  } catch (error) {
    console.error('加载统计失败:', error);
  }
}

function handleQuery() {
  queryParams.pageNum = 1;
  loadData();
}

function applyStatusFilter(status: string) {
  queryParams.status = status;
  handleQuery();
}

function resetQuery() {
  queryFormRef.value?.resetFields();
  uploadDateRange.value = [];
  queryParams.pageNum = 1;
  queryParams.status = '';
  queryParams.companyId = undefined;
  queryParams.ledgerId = undefined;
  queryParams.ledgerOrderNo = '';
  queryParams.createByName = '';
  queryParams.beginTime = '';
  queryParams.endTime = '';
  loadData();
}

async function handleDetail(row: InvoiceManageVO) {
  currentInvoice.value = { ...row };
  resetPreviewState();
  detailVisible.value = true;
  await Promise.all([loadInvoiceDetail(row), loadSameLedgerInvoices(row)]);
}

function openRelatedLedger(row: InvoiceManageVO) {
  if (!row?.ledgerOrderNo) return;
  const { href } = router.resolve({ name: 'RecruitmentLedger', query: { orderNo: row.ledgerOrderNo } });
  window.open(href, '_blank', 'noopener');
}

function openRelatedCompany(row: InvoiceManageVO) {
  if (!row?.companyId) return;
  const { href } = router.resolve({ name: 'RecruitmentCompany', query: { companyId: String(row.companyId) } });
  window.open(href, '_blank', 'noopener');
}

async function loadInvoiceDetail(row: InvoiceManageVO) {
  const invoiceId = idKey(row.invoiceId);
  if (!invoiceId) return;
  try {
    const res = await getInvoice(invoiceId);
    currentInvoice.value = { ...row, ...(res.data || {}) };
    resetPreviewState();
  } catch (error) {
    console.warn('发票详情加载失败，使用列表快照', error);
  }
}

async function loadSameLedgerInvoices(row: InvoiceManageVO) {
  sameLedgerInvoices.value = [];
  if (!row?.ledgerId && !row?.ledgerOrderNo) return;
  try {
    const res = await listInvoiceManage({
      pageNum: 1,
      pageSize: 100,
      ledgerId: row.ledgerId,
      ledgerOrderNo: row.ledgerOrderNo,
      orderNo: row.ledgerOrderNo
    });
    sameLedgerInvoices.value = unwrapList<InvoiceManageVO>(res).rows;
  } catch (error) {
    sameLedgerInvoices.value = [];
    console.warn('同台账发票加载失败', error);
  }
}

function previewFile(filePath: string, row?: InvoiceManageVO) {
  handleDetail(row || ({ filePath } as InvoiceManageVO));
}

async function copyText(value?: string | number) {
  const text = String(value ?? '').trim();
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    ElMessage.success('已复制');
  } catch {
    const input = document.createElement('input');
    input.value = text;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    ElMessage.success('已复制');
  }
}

function getInvoiceFilePath(row?: InvoiceManageVO | any) {
  return String(row?.filePath || row?.url || '').trim();
}

function resolveInvoiceOssId(row?: InvoiceManageVO | any) {
  const directId = row?.ossId ?? row?.fileOssId ?? row?.fileId ?? row?.invoiceOssId;
  if (directId != null && directId !== '') {
    return String(directId);
  }
  const filePath = getInvoiceFilePath(row);
  const pathMatch = filePath.match(/\/resource\/oss\/download\/([^/?#]+)/i);
  if (pathMatch?.[1]) {
    return decodeURIComponent(pathMatch[1]);
  }
  const queryMatch = filePath.match(/[?&](?:ossId|fileId)=([^&#]+)/i);
  return queryMatch?.[1] ? decodeURIComponent(queryMatch[1]) : '';
}

function buildInvoiceFileDownloadUrl(row?: InvoiceManageVO | any) {
  const ossId = resolveInvoiceOssId(row);
  if (ossId) {
    return `/resource/oss/download/${encodeURIComponent(ossId)}`;
  }
  return normalizeInvoiceDownloadUrl(getInvoiceFilePath(row));
}

function normalizeInvoiceDownloadUrl(url: string) {
  if (!url) return '';
  const baseApi = String(import.meta.env.VITE_APP_BASE_API || '');
  if (baseApi && url.startsWith(baseApi + '/')) {
    return url.slice(baseApi.length);
  }
  try {
    const parsedUrl = new URL(url, window.location.origin);
    if (parsedUrl.origin === window.location.origin && baseApi && parsedUrl.pathname.startsWith(baseApi + '/')) {
      return `${parsedUrl.pathname.slice(baseApi.length)}${parsedUrl.search}`;
    }
  } catch {
    // 保留原始地址，交给 request 处理。
  }
  return url;
}

function inferInvoiceFileMime(row?: InvoiceManageVO | any) {
  const ext = getFileExt(getInvoiceFilePath(row));
  if (ext === 'pdf') return 'application/pdf';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'png') return 'image/png';
  return 'application/octet-stream';
}

function previewTypeFromMime(mime?: string) {
  if (mime?.includes('pdf')) return 'pdf';
  if (mime?.startsWith('image/')) return 'image';
  return 'file';
}

async function normalizeInvoiceFileBlob(rawBlob: Blob, row?: InvoiceManageVO | any) {
  const header = new Uint8Array(await rawBlob.slice(0, 8).arrayBuffer());
  const isPdf = header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 && header[3] === 0x46;
  const isPng = header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e && header[3] === 0x47;
  const isJpeg = header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  const mime = isPdf ? 'application/pdf' : isPng ? 'image/png' : isJpeg ? 'image/jpeg' : rawBlob.type || inferInvoiceFileMime(row);
  return rawBlob.type === mime ? rawBlob : new Blob([rawBlob], { type: mime });
}

function revokePreviewObjectUrl() {
  if (filePreviewObjectUrl.value) {
    URL.revokeObjectURL(filePreviewObjectUrl.value);
  }
  filePreviewObjectUrl.value = '';
}

function isCurrentPreviewRow(row?: InvoiceManageVO | any) {
  const current = currentInvoice.value;
  return Boolean(
    current &&
      (isSameId(row?.invoiceId, current.invoiceId) ||
        (!row?.invoiceId && !current.invoiceId && getInvoiceFilePath(row) === getInvoiceFilePath(current)))
  );
}

async function fetchInvoiceFileBlob(row?: InvoiceManageVO | any) {
  const url = buildInvoiceFileDownloadUrl(row);
  if (!url) {
    throw new Error('missing invoice file url');
  }
  // 私有 OSS 不能直接嵌入 iframe/img，必须先经过后台下载接口带上 token，再转成本地 blob 预览。
  const blob = await request.get<Blob>(url, { responseType: 'blob', silent: true } as any);
  const rawBlob = blob instanceof Blob ? blob : new Blob([blob]);
  if (!rawBlob.size || rawBlob.type.includes('text/html') || rawBlob.type.includes('application/json')) {
    throw new Error('invalid invoice file blob');
  }
  return normalizeInvoiceFileBlob(rawBlob, row);
}

async function loadPrivateOssPreview() {
  const loadKey = filePreviewReloadKey.value;
  try {
    const blob = await fetchInvoiceFileBlob(currentInvoice.value);
    const objectUrl = URL.createObjectURL(blob);
    if (loadKey !== filePreviewReloadKey.value) {
      URL.revokeObjectURL(objectUrl);
      return '';
    }
    revokePreviewObjectUrl();
    filePreviewObjectUrl.value = objectUrl;
    filePreviewType.value = previewTypeFromMime(blob.type);
    filePreviewFailed.value = false;
    return objectUrl;
  } catch (error) {
    console.warn('发票私有 OSS 预览加载失败:', error);
    filePreviewFailed.value = true;
    return '';
  } finally {
    if (loadKey === filePreviewReloadKey.value) {
      filePreviewLoading.value = false;
    }
  }
}

async function ensurePreviewObjectUrl(row: InvoiceManageVO) {
  if (isCurrentPreviewRow(row) && previewFileUrl.value) {
    return previewFileUrl.value;
  }
  const blob = await fetchInvoiceFileBlob(row);
  const objectUrl = URL.createObjectURL(blob);
  if (isCurrentPreviewRow(row)) {
    revokePreviewObjectUrl();
    filePreviewObjectUrl.value = objectUrl;
    filePreviewType.value = previewTypeFromMime(blob.type);
  } else {
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60 * 1000);
  }
  return objectUrl;
}

function resetPreviewState() {
  revokePreviewObjectUrl();
  filePreviewType.value = ['jpg', 'jpeg', 'png'].includes(currentFileExt.value) ? 'image' : currentFileExt.value === 'pdf' ? 'pdf' : 'file';
  filePreviewLoading.value = Boolean(currentInvoice.value?.filePath);
  filePreviewFailed.value = false;
  filePreviewReloadKey.value += 1;
  if (filePreviewLoading.value) {
    loadPrivateOssPreview();
  }
}

function resetDetailState() {
  sameLedgerInvoices.value = [];
  revokePreviewObjectUrl();
  filePreviewType.value = 'file';
  filePreviewLoading.value = false;
  filePreviewFailed.value = false;
  fullscreenPreviewVisible.value = false;
}

function handlePreviewError() {
  filePreviewLoading.value = false;
  filePreviewFailed.value = true;
}

function reloadPreview() {
  resetPreviewState();
}

async function printInvoiceFile() {
  if (!currentInvoice.value?.filePath) return;
  let url = '';
  try {
    url = previewFileUrl.value || (await ensurePreviewObjectUrl(currentInvoice.value));
  } catch (error) {
    console.warn('发票打印文件加载失败:', error);
    ElMessage.error('发票原件加载失败，暂时无法打印');
    return;
  }
  if (!url) return;
  const win = window.open(url, '_blank');
  if (win) {
    win.onload = () => win.print();
  }
}

async function downloadOriginalFile(row: InvoiceManageVO) {
  if (!row.filePath) return;
  let downloadUrl = '';
  try {
    downloadUrl = await ensurePreviewObjectUrl(row);
  } catch (error) {
    console.warn('发票原件下载加载失败:', error);
  }
  if (!downloadUrl) {
    ElMessage.error('发票原件加载失败，请稍后重试');
    return;
  }
  const ext = getFileExt(row.filePath) || 'file';
  const fileName = `${row.invoiceNo || '发票原件'}_${Date.now()}.${ext}`;
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function openRemarkEditor() {
  remarkDraft.value = detailRemarkText.value;
  remarkEditorVisible.value = true;
}

function saveLocalRemark() {
  const invoiceId = idKey(currentInvoice.value?.invoiceId);
  if (!invoiceId) return;
  const remark = remarkDraft.value.trim();
  localRemarkMap[invoiceId] = remark;
  currentInvoice.value = { ...(currentInvoice.value || {}), remark };
  remarkEditorVisible.value = false;
  ElMessage.success('备注已更新（当前页面即时生效）');
}

function openVoidDialog(row: InvoiceManageVO) {
  voidTarget.value = row;
  voidReasonDraft.value = '';
  voidDialogVisible.value = true;
}

async function submitVoidWithReason() {
  if (!voidTarget.value) return;
  if (!voidReasonDraft.value.trim()) {
    ElMessage.warning('请填写作废原因');
    return;
  }
  const invoiceId = idKey(voidTarget.value.invoiceId);
  if (invoiceId) {
    localVoidReasonMap[invoiceId] = voidReasonDraft.value.trim();
  }
  voidDialogVisible.value = false;
  await handleStatusChange(voidTarget.value, '2', { skipConfirm: true });
  if (currentInvoice.value && invoiceId && idKey(currentInvoice.value.invoiceId) === invoiceId) {
    currentInvoice.value = { ...currentInvoice.value, status: '2', voidReason: voidReasonDraft.value.trim() };
  }
}

function invoiceStatusTagType(status?: string | null) {
  if (String(status) === '2') return 'info';
  return invoiceStatusMeta(status).type;
}

function invoiceRowClassName({ row }: { row: InvoiceManageVO }) {
  if (String(row.status) === '2') return 'invoice-row-cancelled';
  if (String(row.status) === '0') return 'invoice-row-pending';
  return '';
}

function onSelectionChange(rows: InvoiceManageVO[]) {
  selectedRows.value = rows;
}

function handleExportFiltered() {
  const params = buildInvoiceQueryParams();
  delete params.pageNum;
  delete params.pageSize;
  download(invoiceExportUrl, params, `发票筛选结果_${new Date().getTime()}.xlsx`);
}

async function handleBatchVoid() {
  const targets = selectedRows.value.filter((row) => row.status !== '2');
  if (!targets.length) {
    ElMessage.warning('请选择未作废的发票');
    return;
  }
  try {
    await ElMessageBox.confirm(`确认将选中的 ${targets.length} 张发票标记为已作废？此操作会写入审计日志，请谨慎操作。`, '批量作废确认', {
      confirmButtonText: '确认作废',
      cancelButtonText: '取消',
      type: 'warning'
    });
    submitting.value = true;
    await Promise.all(
      targets
        .map((row) => idKey(row.invoiceId))
        .filter((invoiceId): invoiceId is string => Boolean(invoiceId))
        .map((invoiceId) => markInvoiceManageStatus({ invoiceId, status: '2' }))
    );
    ElMessage.success('批量作废成功');
    selectedRows.value = [];
    loadData();
    loadStatistics();
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('批量作废失败');
    }
  } finally {
    submitting.value = false;
  }
}

function readSerialNo(payload: any) {
  return payload?.data?.serialNo || payload?.serialNo || '';
}

async function generateInvoiceNo() {
  invoiceNoLoading.value = true;
  try {
    const res = await nextSerialNo('INVOICE');
    uploadForm.invoiceNo = readSerialNo(res);
    uploadFormRef.value?.validateField('invoiceNo');
  } catch (error) {
    console.error('生成发票编码失败:', error);
    ElMessage.error('生成发票编码失败，请检查 code 管理中的 INVOICE 规则');
  } finally {
    invoiceNoLoading.value = false;
  }
}

async function openLedgerDetail(row?: LedgerVO | null) {
  const ledgerId = idKey(row?.ledgerId);
  if (!ledgerId) return;
  ledgerDetailVisible.value = true;
  ledgerDetailLoading.value = true;
  currentLedger.value = row;
  try {
    const res = await getLedger(ledgerId);
    currentLedger.value = res.data || row;
  } catch (error) {
    console.error('加载台账详情失败:', error);
    ElMessage.error('加载台账详情失败');
  } finally {
    ledgerDetailLoading.value = false;
  }
}

// ===== 上传发票流程 =====
function handleUploadOpen() {
  uploadVisible.value = true;
  generateInvoiceNo();
  loadLedgerOptions();
}

function resetUploadForm() {
  uploadFormRef.value?.resetFields();
  invoiceUploadRef.value?.clearFiles();
  uploadForm.invoiceNo = '';
  uploadForm.filePath = '';
  uploadForm.ossId = undefined;
  uploadForm.fileOssId = undefined;
  uploadForm.ledgerId = undefined;
  uploadForm.companyId = undefined;
  uploadForm.amount = '';
  uploadForm.status = '1';
  uploadForm.remark = '';
  clearInvoiceFileMeta();
}

function clearInvoiceFileMeta() {
  invoiceUploading.value = false;
  invoiceFileMeta.name = '';
  invoiceFileMeta.size = 0;
  invoiceFileMeta.type = '';
  invoiceFileMeta.url = '';
}

function clearInvoiceFile() {
  invoiceUploadRef.value?.clearFiles();
  uploadForm.filePath = '';
  uploadForm.ossId = undefined;
  uploadForm.fileOssId = undefined;
  clearInvoiceFileMeta();
  uploadFormRef.value?.validateField('filePath');
}

function resolveUploadFailureMessage(error?: any) {
  const message = error?.message || error?.msg || error?.response?.data?.msg || '';
  if (/格式|类型|type|format/i.test(message)) return '文件格式不支持，请上传 PDF、JPG、PNG 或 JPEG 格式发票。';
  if (/大小|过大|10MB|size/i.test(message)) return '文件超过 10MB，请压缩或重新选择后上传。';
  if (/损坏|无法读取|解析失败|corrupt|broken/i.test(message)) return '文件损坏或无法读取，请重新导出发票原件后上传。';
  return message || '文件上传失败，请检查文件是否损坏后重试。';
}

function resolveSubmitFailureMessage(error?: any) {
  const message = error?.message || error?.msg || error?.response?.data?.msg || '';
  if (/大小|过大|10MB|size/i.test(message)) return '文件过大：请上传 10MB 以内的发票文件。';
  if (/金额|amount|不匹配|超出/i.test(message)) return '金额不匹配：请核对发票金额与所选台账应收金额。';
  if (/台账|ledger|不存在|not found/i.test(message)) return '台账不存在或无权限：请重新选择有效台账后再提交。';
  return message || '上传失败，请稍后重试或联系管理员查看接口错误。';
}

// OSS 上传前校验：文件格式、大小与展示元信息分层处理，避免模糊的“上传失败”。
const beforeInvoiceUpload: UploadProps['beforeUpload'] = (file) => {
  const ext = getFileExt(file.name);
  const okType = ['pdf', 'jpg', 'jpeg', 'png'].includes(ext);
  if (!okType) {
    ElMessageBox.alert('文件格式不支持，请上传 PDF、JPG、PNG 或 JPEG 格式发票。', '格式不支持', { type: 'error' });
    return false;
  }
  const isLtOrEq = file.size <= 10 * 1024 * 1024;
  if (!isLtOrEq) {
    ElMessageBox.alert('当前文件超过 10MB，请压缩或重新选择后上传。', '文件过大', { type: 'warning' });
    return false;
  }
  invoiceUploading.value = true;
  invoiceFileMeta.name = file.name;
  invoiceFileMeta.size = file.size;
  invoiceFileMeta.type = file.type || ext;
  invoiceFileMeta.url = '';
  return true;
};

const onInvoiceUploadProgress: UploadProps['onProgress'] = () => {
  invoiceUploading.value = true;
};

// OSS 上传成功：取返回 url 作为发票 filePath（与列表/详情的 filePath 直链语义一致）
const onInvoiceUploadSuccess: UploadProps['onSuccess'] = (res: any, uploadFile) => {
  invoiceUploading.value = false;
  if (res.code === 200 && res.data?.url) {
    const uploadedOssId = res.data.ossId ?? res.data.fileOssId ?? res.data.fileId;
    uploadForm.ossId = uploadedOssId;
    uploadForm.fileOssId = uploadedOssId;
    uploadForm.filePath = uploadedOssId ? buildInvoiceFileDownloadUrl({ ossId: uploadedOssId }) : res.data.url;
    invoiceFileMeta.name = uploadFile.name || invoiceFileMeta.name;
    invoiceFileMeta.size = uploadFile.size || invoiceFileMeta.size;
    invoiceFileMeta.type = uploadFile.raw?.type || invoiceFileMeta.type;
    invoiceFileMeta.url = res.data.url;
    // 触发表单校验，清掉「请先上传发票文件」提示
    uploadFormRef.value?.validateField('filePath');
    ElMessage.success('文件上传成功');
  } else {
    clearInvoiceFile();
    ElMessageBox.alert(resolveUploadFailureMessage(res), /损坏|无法读取|解析失败/.test(res?.msg || '') ? '文件损坏' : '上传失败', { type: 'error' });
  }
};

const onInvoiceUploadError: UploadProps['onError'] = (error) => {
  clearInvoiceFile();
  const message = resolveUploadFailureMessage(error);
  ElMessageBox.alert(message, /损坏|无法读取|解析失败/.test(message) ? '文件损坏' : '上传失败', { type: 'error' });
};

function onInvoiceFileRemove() {
  uploadForm.filePath = '';
  uploadForm.ossId = undefined;
  uploadForm.fileOssId = undefined;
  clearInvoiceFileMeta();
}

function onInvoiceFileExceed() {
  ElMessageBox.alert('仅允许上传 1 个发票文件，请先删除当前文件后重新上传。', '请先删除当前文件', { type: 'warning' });
}

function buildUploadConfirmMessage() {
  const ledger = selectedUploadLedger.value;
  if (ledger) {
    return `确认上传该企业发票文件并绑定台账「${formatLedgerShortLabel(ledger)}」？`;
  }
  return '请先选择绑定台账后再上传发票。';
}

async function submitUpload() {
  if (!uploadFormRef.value) return;
  try {
    await uploadFormRef.value.validate();
  } catch {
    return;
  }
  try {
    if (isAmountOverLedger.value) {
      await ElMessageBox.confirm(
        `当前发票金额 ${formatMoney(uploadForm.amount)} 元已超出台账金额 ${formatMoney(selectedUploadLedger.value?.amount)} 元，确认继续上传？`,
        '金额超出台账',
        {
          confirmButtonText: '继续上传',
          cancelButtonText: '返回修改',
          type: 'warning'
        }
      );
    }
    await ElMessageBox.confirm(buildUploadConfirmMessage(), '确认上传发票', {
      confirmButtonText: '确定上传',
      cancelButtonText: '取消',
      type: 'warning'
    });
  } catch {
    return;
  }

  submitting.value = true;
  try {
    // 组装请求体：文件 URL 来自 OSS；台账/企业/金额按当前表单快照提交，便于后端写审计。
    const payload: InvoiceUploadForm = {
      invoiceNo: uploadForm.invoiceNo,
      filePath: uploadForm.filePath,
      status: uploadForm.status
    };
    if (uploadForm.ossId) payload.ossId = uploadForm.ossId;
    if (uploadForm.fileOssId) payload.fileOssId = uploadForm.fileOssId;
    const ledgerId = idKey(uploadForm.ledgerId);
    const companyId = idKey(uploadForm.companyId);
    if (ledgerId) payload.ledgerId = ledgerId;
    if (companyId) payload.companyId = companyId;
    if (uploadForm.amount) payload.amount = Number(uploadForm.amount);
    if (uploadForm.remark) payload.remark = uploadForm.remark.trim();
    await uploadInvoiceManage(payload);
    ElMessage.success('上传成功');
    uploadVisible.value = false;
    loadData();
    loadStatistics();
  } catch (error) {
    console.error('上传发票失败:', error);
    ElMessageBox.alert(resolveSubmitFailureMessage(error), '上传失败', { type: 'error' });
  } finally {
    submitting.value = false;
  }
}

// ===== 绑定/改绑台账流程 =====
function handleBindOpen(row: InvoiceManageVO) {
  bindForm.invoiceId = row.invoiceId;
  bindForm.ledgerId = row.ledgerId;
  if (row.ledgerId != null && !findLedgerOption(row.ledgerId)) {
    ledgerOptions.value.unshift({
      ledgerId: row.ledgerId,
      orderNo: row.ledgerOrderNo,
      companyId: row.companyId,
      amount: row.amount
    });
  }
  bindVisible.value = true;
  loadLedgerOptions();
}

function resetBindForm() {
  bindFormRef.value?.resetFields();
  bindForm.invoiceId = undefined;
  bindForm.ledgerId = undefined;
}

async function submitBind() {
  if (!bindFormRef.value) return;
  await bindFormRef.value.validate(async (valid) => {
    if (!valid) return;
    const invoiceId = idKey(bindForm.invoiceId);
    const ledgerId = idKey(bindForm.ledgerId);
    if (!invoiceId || !ledgerId) return;
    submitting.value = true;
    try {
      await bindInvoiceManage({
        invoiceId,
        ledgerId
      });
      ElMessage.success('绑定成功');
      bindVisible.value = false;
      loadData();
    } catch (error) {
      console.error('绑定台账失败:', error);
    } finally {
      submitting.value = false;
    }
  });
}

// ===== 标记开票状态：走 markInvoiceManageStatus(/admin/invoice-manage/markStatus) =====
async function handleStatusChange(row: InvoiceManageVO, status: string, options: { skipConfirm?: boolean } = {}) {
  const statusText = invoiceStatusMeta(status).label;
  const invoiceId = idKey(row.invoiceId);
  if (!invoiceId) return;
  try {
    if (!options.skipConfirm) {
      await ElMessageBox.confirm(`确认要将该发票标记为"${statusText}"吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      });
    }
    await markInvoiceManageStatus({ invoiceId, status });
    ElMessage.success('更新成功');
    loadData();
    loadStatistics();
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('更新失败');
    }
  }
}

onMounted(() => {
  const qLedgerOrderNo = route.query.ledgerOrderNo || route.query.orderNo;
  const qLedgerId = route.query.ledgerId;
  if (typeof qLedgerOrderNo === 'string' && qLedgerOrderNo) {
    queryParams.ledgerOrderNo = qLedgerOrderNo;
  }
  if (typeof qLedgerId === 'string' && qLedgerId) {
    queryParams.ledgerId = qLedgerId;
  }
  loadData();
  loadStatistics();
});
</script>

<style scoped>
.mb-4 {
  margin-bottom: 16px;
}

.mt-4 {
  margin-top: 16px;
}

.mb-2 {
  margin-bottom: 8px;
}

.stat-mini-card {
  text-align: center;
  border: 1px solid #ebeef5;
  transition:
    border-color 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.stat-mini-card.clickable {
  cursor: pointer;
}

.stat-mini-card.clickable:hover,
.stat-mini-card.active {
  border-color: #409eff;
  transform: translateY(-1px);
}

.stat-mini-card.warning.active,
.stat-mini-card.warning:hover {
  border-color: #e6a23c;
}

.stat-mini-card.success.active,
.stat-mini-card.success:hover {
  border-color: #67c23a;
}

.stat-mini-card.muted.active,
.stat-mini-card.muted:hover {
  border-color: #909399;
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

.stat-mini .value.success {
  color: #67c23a;
}

.stat-mini .value.danger {
  color: #f56c6c;
}

.stat-mini .value.warning {
  color: #e6a23c;
}

.stat-mini .value.muted {
  color: #909399;
}

.stat-subtitle {
  margin-top: 4px;
  color: #606266;
  font-size: 12px;
}

.stat-delta {
  margin-top: 4px;
  font-size: 12px;
}

.stat-delta.up {
  color: #67c23a;
}

.stat-delta.down {
  color: #f56c6c;
}

.stat-delta.muted {
  color: #909399;
}

.invoice-query-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.invoice-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.toolbar-left,
.toolbar-right,
.row-actions,
.ledger-cell,
.uploader-cell {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.amount-text {
  color: #2b7fff;
  font-weight: 600;
}

.amount-text.danger {
  color: #f56c6c;
}

.text-secondary {
  color: #909399;
  font-size: 12px;
}

.header-help {
  margin-left: 4px;
  color: #909399;
  vertical-align: -2px;
}

.table-footer-summary {
  margin-top: 12px;
  color: #606266;
  font-size: 13px;
}

:deep(.invoice-row-pending) {
  --el-table-tr-bg-color: #fff8ec;
}

:deep(.invoice-row-cancelled) {
  --el-table-tr-bg-color: #f5f7fa;
  color: #909399;
}

:deep(.el-table__row:hover .row-actions .el-button) {
  font-weight: 600;
}

.ledger-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.ledger-option-main {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
}

.ledger-option-meta {
  color: #909399;
  font-size: 12px;
}

.invoice-upload {
  width: 100%;
}

.invoice-upload :deep(.el-upload) {
  width: 100%;
}

.invoice-upload :deep(.el-upload-dragger) {
  width: 100%;
  padding: 22px 16px;
  border-color: #8bb8ff;
  background: #f7fbff;
}

.invoice-upload-drop {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.invoice-upload-icon {
  font-size: 30px;
  color: #409eff;
}

.invoice-upload-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.invoice-upload-formats {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.format-badge {
  min-width: 44px;
  padding: 3px 8px;
  border: 1px solid #d9ecff;
  border-radius: 4px;
  background: #ffffff;
  color: #2b7fff;
  font-size: 12px;
  font-weight: 600;
  line-height: 18px;
}

.invoice-upload-tip,
.selected-ledger-meta,
.invoice-file-meta {
  color: #909399;
  font-size: 12px;
}

.invoice-file-card {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  margin-top: 10px;
  padding: 10px 12px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background: #ffffff;
}

.invoice-file-preview {
  display: flex;
  flex: 0 0 48px;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 6px;
  background: #eef5ff;
  color: #2b7fff;
  font-size: 12px;
  font-weight: 700;
}

.invoice-file-thumb {
  width: 48px;
  height: 48px;
  border-radius: 6px;
}

.invoice-file-main {
  min-width: 0;
  flex: 1;
}

.invoice-file-name {
  overflow: hidden;
  color: #303133;
  font-weight: 600;
  line-height: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.invoice-file-meta {
  display: flex;
  gap: 10px;
  margin-top: 4px;
}

.invoice-file-done {
  color: #67c23a;
}

.ledger-select-wrap {
  width: 100%;
}

.selected-ledger-meta {
  margin-top: 6px;
  line-height: 18px;
}

.amount-warning {
  margin-top: 6px;
  color: #e6a23c;
  font-size: 12px;
  line-height: 18px;
}

.invoice-dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.required-tip {
  color: #909399;
  font-size: 12px;
}

.required-tip span {
  color: #f56c6c;
  font-weight: 700;
}

.invoice-detail {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.invoice-detail-card {
  padding: 14px 16px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background: #ffffff;
}

.detail-card-title {
  margin-bottom: 12px;
  color: #303133;
  font-size: 15px;
  font-weight: 700;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 20px;
}

.detail-item {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  align-items: start;
  min-height: 28px;
  color: #303133;
  line-height: 28px;
}

.detail-item-full {
  grid-column: 1 / -1;
}

.detail-label {
  color: #909399;
}

.detail-strong {
  color: #2b7fff;
  font-weight: 700;
}

.copyable-value,
.remark-line {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 6px;
}

.detail-amount {
  color: #2b7fff;
  font-size: 22px;
  font-weight: 800;
}

.detail-amount.voided {
  color: #909399;
  text-decoration: line-through;
}

.status-reason,
.detail-help {
  display: block;
  margin-top: 2px;
  color: #909399;
  font-size: 12px;
  line-height: 18px;
}

.remark-placeholder {
  color: #909399;
}

.invoice-preview-box {
  position: relative;
  display: flex;
  min-height: 280px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px dashed #dcdfe6;
  border-radius: 6px;
  background: #f8fafc;
}

.invoice-preview-image {
  width: 100%;
  max-height: 420px;
}

.invoice-preview-frame {
  width: 100%;
  height: 420px;
  border: 0;
  background: #ffffff;
}

.invoice-preview-fallback {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 260px;
  color: #909399;
  text-align: center;
}

.invoice-preview-fallback .el-icon {
  font-size: 36px;
  color: #e6a23c;
}

.fallback-title {
  color: #303133;
  font-weight: 700;
}

.fallback-actions {
  display: flex;
  gap: 8px;
}

.preview-floating-actions {
  position: absolute;
  right: 12px;
  bottom: 12px;
  display: flex;
  gap: 8px;
  padding: 6px;
  border-radius: 6px;
  background: rgb(255 255 255 / 92%);
  box-shadow: 0 2px 10px rgb(0 0 0 / 10%);
}

.detail-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.detail-footer-left {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.fullscreen-preview {
  display: flex;
  min-height: 70vh;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
}

.fullscreen-preview :deep(.el-image) {
  max-width: 100%;
  max-height: 78vh;
}

.fullscreen-preview-frame {
  width: 100%;
  height: 78vh;
  border: 0;
  background: #ffffff;
}
</style>
