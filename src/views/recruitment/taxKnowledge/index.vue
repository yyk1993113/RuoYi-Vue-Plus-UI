<template>
  <div class="p-4 tax-knowledge-page">
    <el-card shadow="never" class="mb-4">
      <div class="page-head">
        <div>
          <div class="page-title">知识库管理</div>
          <div class="page-desc">查询和维护结算机器人知识文档，并查看去重聊天人数。</div>
        </div>
        <el-button icon="Refresh" :loading="loading || statsLoading" @click="refreshPage">刷新</el-button>
      </div>
    </el-card>

    <el-row :gutter="16" class="mb-4">
      <el-col :xs="24" :sm="8">
        <el-card v-loading="statsLoading" shadow="never" class="stat-card">
          <el-statistic title="聊过人数" :value="stats.chatterCount || 0" />
          <div class="stat-note">按登录账号去重，自统计功能上线后累计</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="8">
        <el-card v-loading="statsLoading" shadow="never" class="stat-card">
          <el-statistic title="累计提问" :value="stats.questionCount || 0" />
          <div class="stat-note">最近聊天：{{ stats.lastChatTime || '-' }}</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="8">
        <el-card shadow="never" class="stat-card">
          <el-statistic title="当前查询文档" :value="total" />
          <div class="stat-note">知识正文保存在 Elasticsearch</div>
        </el-card>
      </el-col>
    </el-row>

    <el-alert v-if="statsError" :title="statsError" type="warning" show-icon :closable="false" class="mb-4" />

    <el-card shadow="never" class="mb-4">
      <template #header>
        <span>知识文档</span>
      </template>

      <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="84px" class="mb-3">
        <el-form-item label="文档名称" prop="documentName">
          <el-input v-model.trim="queryParams.documentName" clearable placeholder="请输入文档名称" style="width: 240px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" clearable placeholder="全部" style="width: 150px">
            <el-option label="处理中" value="PROCESSING" />
            <el-option label="待审核" value="REVIEW" />
            <el-option label="已发布" value="PUBLISHED" />
            <el-option label="失败" value="FAILED" />
            <el-option label="已归档" value="ARCHIVED" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">查询</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <el-alert v-if="listError" :title="listError" type="error" show-icon :closable="false" class="mb-3">
        <template #default>
          <el-button link type="primary" @click="getList">重新加载</el-button>
        </template>
      </el-alert>

      <el-table v-loading="loading" :data="documentList" border stripe :empty-text="listError ? '数据加载失败' : '暂无知识库数据'">
        <el-table-column label="文档名称" prop="documentName" min-width="220" show-overflow-tooltip />
        <el-table-column label="版本" prop="documentVersion" width="120" align="center" show-overflow-tooltip />
        <el-table-column label="状态" width="110" align="center">
          <template #default="{ row }">
            <el-tooltip v-if="row.status === 'FAILED' && row.errorMessage" :content="row.errorMessage" placement="top">
              <el-tag :type="statusMeta(row.status).type">{{ statusMeta(row.status).label }}</el-tag>
            </el-tooltip>
            <el-tag v-else :type="statusMeta(row.status).type">{{ statusMeta(row.status).label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="知识块" prop="chunkCount" width="90" align="center">
          <template #default="{ row }">{{ row.chunkCount ?? 0 }}</template>
        </el-table-column>
        <el-table-column label="格式" prop="actualFormat" width="110" align="center" show-overflow-tooltip />
        <el-table-column label="文件大小" width="110" align="right">
          <template #default="{ row }">{{ formatFileSize(row.fileSize) }}</template>
        </el-table-column>
        <el-table-column label="政策来源" min-width="130" align="center">
          <template #default="{ row }">
            <el-link v-if="row.sourceUrl" type="primary" :href="row.sourceUrl" target="_blank">打开来源</el-link>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="导入时间" prop="createTime" width="170" align="center" />
        <el-table-column label="操作" width="150" align="center" fixed="right">
          <template #default="{ row }">
            <el-button v-hasPermi="['recruitment:taxKnowledge:edit']" link type="primary" icon="Edit" @click="openEdit(row)">修改</el-button>
            <el-button v-hasPermi="['recruitment:taxKnowledge:remove']" link type="danger" icon="Delete" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <div v-hasPermi="['recruitment:taxKnowledge:upload']">
      <el-card shadow="never" class="mb-4">
        <template #header>
          <div class="card-header">
            <span>导入 Word 文档</span>
            <el-tag type="warning" effect="plain">仅支持 doc / docx，单文件不超过 20MB</el-tag>
          </div>
        </template>

        <el-row :gutter="16">
          <el-col :xs="24" :lg="15">
            <el-form ref="importFormRef" :model="importForm" :rules="importRules" label-width="112px" status-icon>
              <el-form-item label="Word 文档" prop="file">
                <el-upload
                  ref="uploadRef"
                  class="knowledge-upload"
                  accept=".doc,.docx"
                  :limit="1"
                  :auto-upload="false"
                  :disabled="uploading"
                  :on-change="handleFileChange"
                  :on-remove="handleFileRemove"
                  :on-exceed="handleFileExceed"
                  :before-upload="beforeUpload"
                  drag
                >
                  <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
                  <div class="el-upload__text">将 Word 文件拖到此处，或<em>点击选择</em></div>
                  <template #tip>
                    <div class="el-upload__tip">后端会解析正文、生成知识块并写入 Elasticsearch。</div>
                  </template>
                </el-upload>
              </el-form-item>
              <el-form-item label="文档名称" prop="documentName">
                <el-input v-model.trim="importForm.documentName" maxlength="255" show-word-limit placeholder="可不填，默认读取文件标题" />
              </el-form-item>
              <el-form-item label="政策版本" prop="documentVersion">
                <el-input v-model.trim="importForm.documentVersion" maxlength="64" placeholder="例如 V1、2026-07" />
              </el-form-item>
              <el-form-item label="政策来源" prop="sourceUrl">
                <el-input v-model.trim="importForm.sourceUrl" maxlength="1000" placeholder="可不填；填写时必须是 http 或 https 地址" />
              </el-form-item>
              <el-form-item label="直接发布">
                <el-switch v-model="importForm.publish" active-text="发布" inactive-text="待审核" inline-prompt :disabled="uploading" />
                <span class="publish-tip">仅超级管理员可以直接发布。</span>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" icon="UploadFilled" :loading="uploading" @click="submitImport">开始导入</el-button>
                <el-button :disabled="uploading" @click="resetImportForm">重置</el-button>
              </el-form-item>
            </el-form>
          </el-col>

          <el-col :xs="24" :lg="9">
            <el-empty v-if="!lastResult" description="暂无本次导入结果" />
            <el-descriptions v-else :column="1" border>
              <el-descriptions-item label="文档名称">{{ lastResult.documentName || '-' }}</el-descriptions-item>
              <el-descriptions-item label="政策版本">{{ lastResult.documentVersion || '-' }}</el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag :type="statusMeta(lastResult.status).type">{{ statusMeta(lastResult.status).label }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="知识块数">{{ lastResult.chunkCount ?? '-' }}</el-descriptions-item>
              <el-descriptions-item label="向量模型">{{ formatEmbedding(lastResult) }}</el-descriptions-item>
              <el-descriptions-item label="索引名称">
                <span class="index-name">{{ lastResult.esIndexName || '-' }}</span>
              </el-descriptions-item>
            </el-descriptions>
          </el-col>
        </el-row>
      </el-card>
    </div>

    <el-dialog v-model="editDialog.visible" title="修改知识文档" width="560px" append-to-body>
      <el-alert title="这里只修改名称、版本和来源；正文内容变更请删除后重新导入。" type="info" show-icon :closable="false" class="mb-4" />
      <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-width="90px">
        <el-form-item label="文档名称" prop="documentName">
          <el-input v-model.trim="editForm.documentName" maxlength="255" show-word-limit />
        </el-form-item>
        <el-form-item label="政策版本" prop="documentVersion">
          <el-input v-model.trim="editForm.documentVersion" maxlength="64" />
        </el-form-item>
        <el-form-item label="政策来源" prop="sourceUrl">
          <el-input v-model.trim="editForm.sourceUrl" maxlength="1000" placeholder="可留空；填写时必须是 http 或 https 地址" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="editSubmitting" @click="submitEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
// 运营台知识库管理页：文档正文只存在 ES，列表只展示可维护元数据；聊天统计不返回问题内容或用户身份明细。
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules, type UploadFile, type UploadInstance, type UploadRawFile } from 'element-plus';
import { UploadFilled } from '@element-plus/icons-vue';
import {
  deleteTaxKnowledgeDocument,
  getTaxKnowledgeStats,
  importTaxKnowledgeDocument,
  listTaxKnowledgeDocuments,
  updateTaxKnowledgeDocument,
  type TaxKnowledgeDocumentQuery,
  type TaxKnowledgeDocumentUpdate,
  type TaxKnowledgeDocumentVO,
  type TaxKnowledgeImportVO,
  type TaxKnowledgeStatsVO
} from '@/api/recruitment/taxKnowledge';

defineOptions({ name: 'recruitment/taxKnowledge/index' });

interface ImportForm {
  file: UploadRawFile | null;
  documentName: string;
  documentVersion: string;
  sourceUrl: string;
  publish: boolean;
}

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const loading = ref(false);
const statsLoading = ref(false);
const uploading = ref(false);
const editSubmitting = ref(false);
const listError = ref('');
const statsError = ref('');
const total = ref(0);
const documentList = ref<TaxKnowledgeDocumentVO[]>([]);
const stats = reactive<TaxKnowledgeStatsVO>({ chatterCount: 0, questionCount: 0, lastChatTime: '' });
const lastResult = ref<TaxKnowledgeImportVO | null>(null);

const queryFormRef = ref<FormInstance>();
const importFormRef = ref<FormInstance>();
const editFormRef = ref<FormInstance>();
const uploadRef = ref<UploadInstance>();

const queryParams = reactive<TaxKnowledgeDocumentQuery>({
  pageNum: 1,
  pageSize: 10,
  documentName: '',
  status: ''
});

const importForm = reactive<ImportForm>({
  file: null,
  documentName: '',
  documentVersion: 'V1',
  sourceUrl: '',
  publish: false
});

const editDialog = reactive({ visible: false });
const editForm = reactive<TaxKnowledgeDocumentUpdate & { documentId?: number | string }>({
  documentId: undefined,
  documentName: '',
  documentVersion: '',
  sourceUrl: ''
});

const validateSourceUrl = (_: unknown, value: string, callback: (error?: Error) => void) => {
  const text = (value || '').trim();
  if (!text || /^https?:\/\//i.test(text)) {
    callback();
    return;
  }
  callback(new Error('政策来源必须是 http 或 https 地址'));
};

const importRules: FormRules<ImportForm> = {
  file: [{ required: true, message: '请选择要导入的 Word 文档', trigger: 'change' }],
  documentVersion: [{ required: true, message: '请输入政策版本', trigger: 'blur' }],
  sourceUrl: [{ validator: validateSourceUrl, trigger: 'blur' }]
};

const editRules: FormRules = {
  documentName: [{ required: true, message: '请输入文档名称', trigger: 'blur' }],
  documentVersion: [{ required: true, message: '请输入政策版本', trigger: 'blur' }],
  sourceUrl: [{ validator: validateSourceUrl, trigger: 'blur' }]
};

const getList = async () => {
  loading.value = true;
  listError.value = '';
  try {
    const response = await listTaxKnowledgeDocuments(queryParams);
    documentList.value = response?.rows || [];
    total.value = Number(response?.total || 0);
  } catch (error) {
    documentList.value = [];
    total.value = 0;
    listError.value = readableError(error, '知识文档加载失败');
  } finally {
    loading.value = false;
  }
};

const loadStats = async () => {
  statsLoading.value = true;
  statsError.value = '';
  try {
    const response = await getTaxKnowledgeStats();
    const data = (response?.data || response || {}) as TaxKnowledgeStatsVO;
    Object.assign(stats, {
      chatterCount: Number(data.chatterCount || 0),
      questionCount: Number(data.questionCount || 0),
      lastChatTime: data.lastChatTime || ''
    });
  } catch (error) {
    statsError.value = readableError(error, '聊天人数统计加载失败');
  } finally {
    statsLoading.value = false;
  }
};

const refreshPage = async () => {
  await Promise.all([getList(), loadStats()]);
};

const handleQuery = () => {
  queryParams.pageNum = 1;
  getList();
};

const resetQuery = () => {
  Object.assign(queryParams, { pageNum: 1, pageSize: 10, documentName: '', status: '' });
  queryFormRef.value?.resetFields();
  getList();
};

const openEdit = (row: TaxKnowledgeDocumentVO) => {
  Object.assign(editForm, {
    documentId: row.documentId,
    documentName: row.documentName || '',
    documentVersion: row.documentVersion || '',
    sourceUrl: row.sourceUrl || ''
  });
  editDialog.visible = true;
  editFormRef.value?.clearValidate();
};

const submitEdit = async () => {
  if (!editFormRef.value || editForm.documentId == null) return;
  await editFormRef.value.validate();
  editSubmitting.value = true;
  try {
    await updateTaxKnowledgeDocument(editForm.documentId, {
      documentName: editForm.documentName.trim(),
      documentVersion: editForm.documentVersion.trim(),
      sourceUrl: editForm.sourceUrl?.trim() || ''
    });
    ElMessage.success('知识文档已修改');
    editDialog.visible = false;
    await getList();
  } finally {
    editSubmitting.value = false;
  }
};

const handleDelete = async (row: TaxKnowledgeDocumentVO) => {
  if (row.documentId == null) return;
  await ElMessageBox.confirm(`确认删除“${row.documentName || '该知识文档'}”吗？对应 Elasticsearch 知识块也会删除。`, '删除确认', {
    type: 'warning',
    confirmButtonText: '删除',
    cancelButtonText: '取消'
  });
  await deleteTaxKnowledgeDocument(row.documentId);
  ElMessage.success('知识文档已删除');
  if (documentList.value.length === 1 && Number(queryParams.pageNum || 1) > 1) {
    queryParams.pageNum = Number(queryParams.pageNum) - 1;
  }
  await getList();
};

const handleFileChange = (uploadFile: UploadFile) => {
  const raw = uploadFile.raw;
  if (!raw) return;
  if (!validateFile(raw)) {
    importForm.file = null;
    uploadRef.value?.clearFiles();
    return;
  }
  importForm.file = raw;
  if (!importForm.documentName) importForm.documentName = raw.name.replace(/\.(doc|docx)$/i, '');
  importFormRef.value?.validateField('file');
};

const handleFileRemove = () => {
  importForm.file = null;
  importFormRef.value?.validateField('file');
};

const handleFileExceed = () => ElMessage.warning('一次只能导入一个 Word 文档');
const beforeUpload = (file: UploadRawFile) => validateFile(file);

const validateFile = (file: UploadRawFile) => {
  if (!/\.(doc|docx)$/i.test(file.name || '')) {
    ElMessage.warning('仅支持上传 doc 或 docx 文件');
    return false;
  }
  if (file.size > MAX_FILE_SIZE) {
    ElMessage.warning('Word 文档不能超过 20MB');
    return false;
  }
  return true;
};

const buildFormData = () => {
  const data = new FormData();
  data.append('file', importForm.file as Blob, importForm.file?.name || 'tax-policy.doc');
  data.append('documentVersion', importForm.documentVersion.trim() || 'V1');
  data.append('publish', String(importForm.publish));
  if (importForm.documentName.trim()) data.append('documentName', importForm.documentName.trim());
  if (importForm.sourceUrl.trim()) data.append('sourceUrl', importForm.sourceUrl.trim());
  return data;
};

const submitImport = async () => {
  if (!importFormRef.value) return;
  await importFormRef.value.validate();
  if (!importForm.file) return;
  uploading.value = true;
  try {
    const response = await importTaxKnowledgeDocument(buildFormData());
    const result = (response?.data || response) as TaxKnowledgeImportVO;
    lastResult.value = result;
    ElMessage.success(`导入完成，生成 ${result.chunkCount ?? 0} 个知识块`);
    uploadRef.value?.clearFiles();
    importForm.file = null;
    await getList();
  } finally {
    uploading.value = false;
  }
};

const resetImportForm = () => {
  importFormRef.value?.resetFields();
  uploadRef.value?.clearFiles();
  Object.assign(importForm, { file: null, documentName: '', documentVersion: 'V1', sourceUrl: '', publish: false });
};

const statusMeta = (status?: string) => {
  const map: Record<string, { label: string; type: 'success' | 'warning' | 'info' | 'danger' }> = {
    PROCESSING: { label: '处理中', type: 'warning' },
    REVIEW: { label: '待审核', type: 'warning' },
    PUBLISHED: { label: '已发布', type: 'success' },
    FAILED: { label: '失败', type: 'danger' },
    ARCHIVED: { label: '已归档', type: 'info' }
  };
  return map[status || ''] || { label: status || '-', type: 'info' };
};

const formatEmbedding = (result: TaxKnowledgeImportVO) => {
  const dimension = result.embeddingDimension ? `${result.embeddingDimension}维` : '';
  return [result.embeddingProvider, result.embeddingModel, dimension].filter(Boolean).join(' / ') || '-';
};

const formatFileSize = (size?: number) => {
  if (!size) return '-';
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
};

const readableError = (error: unknown, fallback: string) => (error instanceof Error && error.message ? error.message : fallback);

onMounted(refreshPage);
</script>

<style scoped>
.mb-3 {
  margin-bottom: 12px;
}

.mb-4 {
  margin-bottom: 16px;
}

.page-head,
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.page-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.page-desc,
.stat-note {
  margin-top: 6px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.stat-card {
  min-height: 112px;
}

.knowledge-upload,
.knowledge-upload :deep(.el-upload),
.knowledge-upload :deep(.el-upload-dragger) {
  width: 100%;
}

.publish-tip {
  margin-left: 12px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.index-name {
  word-break: break-all;
}

@media (max-width: 768px) {
  .page-head,
  .card-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .stat-card {
    margin-bottom: 12px;
  }

  .publish-tip {
    display: block;
    margin: 8px 0 0;
  }
}
</style>
