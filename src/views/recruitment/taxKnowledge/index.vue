<template>
  <div class="p-4 tax-knowledge-page">
    <el-card shadow="never" class="mb-4">
      <div class="page-head">
        <div>
          <div class="page-title">税务知识库数据导入</div>
          <div class="page-desc">导入税务政策 Word 文档，生成知识块并写入检索索引，用于结算助手政策问答。</div>
        </div>
        <el-tag type="warning" effect="plain">仅支持 doc / docx，单文件不超过 20MB</el-tag>
      </div>
    </el-card>

    <el-row :gutter="16">
      <el-col :xs="24" :lg="15">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>上传文档</span>
              <el-button type="primary" plain icon="Refresh" :disabled="uploading" @click="resetForm">重置</el-button>
            </div>
          </template>

          <el-form ref="formRef" :model="form" :rules="rules" label-width="112px" status-icon>
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
                  <div class="el-upload__tip">文件名后缀必须为 .doc 或 .docx；后端会按文档内容自动识别标题和政策来源。</div>
                </template>
              </el-upload>
            </el-form-item>

            <el-form-item label="文档名称" prop="documentName">
              <el-input v-model.trim="form.documentName" maxlength="255" show-word-limit placeholder="可不填，后端会优先使用 Word 中识别到的标题" />
            </el-form-item>
            <el-form-item label="政策版本" prop="documentVersion">
              <el-input v-model.trim="form.documentVersion" maxlength="64" placeholder="例如 V1、2026-07 或政策发文字号" />
            </el-form-item>
            <el-form-item label="政策来源" prop="sourceUrl">
              <el-input v-model.trim="form.sourceUrl" maxlength="1000" placeholder="可不填；填写时必须是 http 或 https 地址" />
            </el-form-item>
            <el-form-item label="直接发布">
              <el-switch
                v-model="form.publish"
                active-text="发布"
                inactive-text="待审核"
                inline-prompt
                :disabled="uploading"
              />
              <span class="publish-tip">直接发布仅超级管理员可用；普通导入会进入待审核状态。</span>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" icon="UploadFilled" :loading="uploading" @click="submitImport">开始导入</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="9">
        <el-card shadow="never" class="mb-4">
          <template #header>
            <span>导入结果</span>
          </template>
          <el-empty v-if="!lastResult" description="暂无导入结果" />
          <el-descriptions v-else :column="1" border>
            <el-descriptions-item label="文档 ID">{{ lastResult.documentId || '-' }}</el-descriptions-item>
            <el-descriptions-item label="文档名称">{{ lastResult.documentName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="政策版本">{{ lastResult.documentVersion || '-' }}</el-descriptions-item>
            <el-descriptions-item label="解析格式">{{ lastResult.actualFormat || '-' }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="statusMeta(lastResult.status).type">{{ statusMeta(lastResult.status).label }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="知识块数">{{ lastResult.chunkCount ?? '-' }}</el-descriptions-item>
            <el-descriptions-item label="向量模型">{{ formatEmbedding(lastResult) }}</el-descriptions-item>
            <el-descriptions-item label="索引名称">
              <span class="index-name">{{ lastResult.esIndexName || '-' }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="政策来源">
              <el-link v-if="lastResult.sourceUrl" type="primary" :href="lastResult.sourceUrl" target="_blank">打开来源</el-link>
              <span v-else>-</span>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card shadow="never">
          <template #header>
            <span>处理说明</span>
          </template>
          <el-steps direction="vertical" :active="activeStep" finish-status="success">
            <el-step title="读取 Word" description="校验文件类型和大小，解析标题、来源和正文结构。" />
            <el-step title="生成知识块" description="按章节切分政策内容，保留可追溯的文档版本信息。" />
            <el-step title="写入索引" description="生成向量并写入 Elasticsearch，供结算助手检索引用。" />
          </el-steps>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup name="RecruitmentTaxKnowledge" lang="ts">
// 运营台税务知识库导入页：对接 /admin/recruitment/tax-knowledge/documents/import，同步触发 Word 解析、分块、向量化和索引入库。
// 当前后端只开放导入接口，因此页面只承接上传和结果展示，不预置列表、发布、归档等未落地操作。
import { computed, reactive, ref } from 'vue';
import { ElMessage, type FormInstance, type FormRules, type UploadFile, type UploadInstance, type UploadRawFile } from 'element-plus';
import { UploadFilled } from '@element-plus/icons-vue';
import { importTaxKnowledgeDocument, type TaxKnowledgeImportVO } from '@/api/recruitment/taxKnowledge';

interface ImportForm {
  file: UploadRawFile | null;
  documentName: string;
  documentVersion: string;
  sourceUrl: string;
  publish: boolean;
}

const MAX_FILE_SIZE = 20 * 1024 * 1024;

const formRef = ref<FormInstance>();
const uploadRef = ref<UploadInstance>();
const uploading = ref(false);
const lastResult = ref<TaxKnowledgeImportVO | null>(null);

const form = reactive<ImportForm>({
  file: null,
  documentName: '',
  documentVersion: 'V1',
  sourceUrl: '',
  publish: false
});

const rules: FormRules<ImportForm> = {
  file: [{ required: true, message: '请选择要导入的 Word 文档', trigger: 'change' }],
  documentVersion: [{ required: true, message: '请输入政策版本', trigger: 'blur' }],
  sourceUrl: [{ validator: validateSourceUrl, trigger: 'blur' }]
};

const activeStep = computed(() => (lastResult.value ? 3 : uploading.value ? 1 : 0));

function validateSourceUrl(_: unknown, value: string, callback: (error?: Error) => void) {
  const text = (value || '').trim();
  if (!text || /^https?:\/\//i.test(text)) {
    callback();
    return;
  }
  callback(new Error('政策来源必须是 http 或 https 地址'));
}

function handleFileChange(uploadFile: UploadFile) {
  const raw = uploadFile.raw;
  if (!raw) return;
  if (!validateFile(raw)) {
    form.file = null;
    uploadRef.value?.clearFiles();
    return;
  }
  form.file = raw;
  if (!form.documentName) {
    form.documentName = raw.name.replace(/\.(doc|docx)$/i, '');
  }
  formRef.value?.validateField('file');
}

function handleFileRemove() {
  form.file = null;
  formRef.value?.validateField('file');
}

function handleFileExceed() {
  ElMessage.warning('一次只能导入一个 Word 文档');
}

function beforeUpload(file: UploadRawFile) {
  return validateFile(file);
}

function validateFile(file: UploadRawFile) {
  if (!/\.(doc|docx)$/i.test(file.name || '')) {
    ElMessage.warning('仅支持上传 doc 或 docx 文件');
    return false;
  }
  if (file.size > MAX_FILE_SIZE) {
    ElMessage.warning('Word 文档不能超过 20MB');
    return false;
  }
  return true;
}

function buildFormData() {
  const data = new FormData();
  data.append('file', form.file as Blob, form.file?.name || 'tax-policy.doc');
  data.append('documentVersion', form.documentVersion.trim() || 'V1');
  data.append('publish', String(form.publish));
  if (form.documentName.trim()) data.append('documentName', form.documentName.trim());
  if (form.sourceUrl.trim()) data.append('sourceUrl', form.sourceUrl.trim());
  return data;
}

async function submitImport() {
  if (!formRef.value) return;
  await formRef.value.validate();
  if (!form.file) {
    ElMessage.warning('请选择要导入的 Word 文档');
    return;
  }
  uploading.value = true;
  try {
    const response = await importTaxKnowledgeDocument(buildFormData());
    const result = (response?.data || response) as TaxKnowledgeImportVO;
    lastResult.value = result;
    ElMessage.success(`导入完成，生成 ${result.chunkCount ?? 0} 个知识块`);
    uploadRef.value?.clearFiles();
    form.file = null;
  } finally {
    uploading.value = false;
  }
}

function resetForm() {
  formRef.value?.resetFields();
  uploadRef.value?.clearFiles();
  form.file = null;
  form.documentName = '';
  form.documentVersion = 'V1';
  form.sourceUrl = '';
  form.publish = false;
}

function statusMeta(status?: string) {
  const map: Record<string, { label: string; type: 'success' | 'warning' | 'info' | 'danger' }> = {
    PROCESSING: { label: '处理中', type: 'warning' },
    REVIEW: { label: '待审核', type: 'warning' },
    PUBLISHED: { label: '已发布', type: 'success' },
    FAILED: { label: '失败', type: 'danger' },
    ARCHIVED: { label: '已归档', type: 'info' }
  };
  return map[status || ''] || { label: status || '-', type: 'info' };
}

function formatEmbedding(result: TaxKnowledgeImportVO) {
  const model = result.embeddingModel || '-';
  const dimension = result.embeddingDimension ? `${result.embeddingDimension}维` : '';
  return [result.embeddingProvider, model, dimension].filter(Boolean).join(' / ');
}
</script>

<style scoped>
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

.page-desc {
  margin-top: 6px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.knowledge-upload {
  width: 100%;
}

.knowledge-upload :deep(.el-upload) {
  width: 100%;
}

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

  .publish-tip {
    display: block;
    margin: 8px 0 0;
  }
}
</style>
