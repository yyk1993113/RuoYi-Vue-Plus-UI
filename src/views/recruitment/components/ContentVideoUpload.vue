<template>
  <div class="content-video-upload">
    <!-- 内容视频直传 OSS：后端只签名并登记 ossId，课程表长期保存 videoOssId。 -->
    <el-upload
      :http-request="uploadVideo"
      :before-upload="beforeUpload"
      :show-file-list="false"
      accept=".mp4"
      :disabled="uploading"
    >
      <el-button type="primary" plain :loading="uploading" icon="Upload">上传视频</el-button>
    </el-upload>
    <div class="upload-tip">仅支持 mp4，大小不超过 200MB</div>
    <div v-if="fileName || modelValue" class="video-file">
      <el-icon><VideoPlay /></el-icon>
      <el-link v-if="previewUrl" :href="previewUrl" target="_blank" :underline="false">{{ fileName || '查看视频' }}</el-link>
      <span v-else>{{ fileName || `视频 OSS ID：${modelValue}` }}</span>
      <el-button link type="danger" :disabled="uploading" @click="clearVideo">移除</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import axios from 'axios';
import { ElMessage } from 'element-plus';
import { VideoPlay } from '@element-plus/icons-vue';
import { listByIds } from '@/api/system/oss';
import { presignContentMedia } from '@/api/recruitment/content';

const props = defineProps<{ modelValue?: string | number | null }>();
const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number | ''): void;
  (e: 'uploaded', value: { fileSize?: number; contentType?: string; originalName?: string }): void;
}>();

const uploading = ref(false);
const fileName = ref('');
const previewUrl = ref('');

watch(
  () => props.modelValue,
  async (value) => {
    if (!value) {
      fileName.value = '';
      previewUrl.value = '';
      return;
    }
    try {
      const res = await listByIds(value);
      const oss = res.data?.[0];
      fileName.value = oss?.originalName || '';
      previewUrl.value = oss?.url || '';
    } catch {
      fileName.value = '';
      previewUrl.value = '';
    }
  },
  { immediate: true }
);

function beforeUpload(file: File) {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext !== 'mp4') {
    ElMessage.error('视频仅支持 mp4 格式');
    return false;
  }
  if (file.size > 200 * 1024 * 1024) {
    ElMessage.error('视频大小不能超过 200MB');
    return false;
  }
  return true;
}

async function uploadVideo(options: any) {
  const file = options.file as File;
  uploading.value = true;
  try {
    const presign = await presignContentMedia({
      mediaType: 'video',
      fileName: file.name,
      contentType: file.type || 'video/mp4',
      fileSize: file.size
    });
    const data = presign.data;
    await axios.put(data.uploadUrl, file, {
      headers: {
        'Content-Type': file.type || 'video/mp4'
      }
    });
    fileName.value = data.originalName || file.name;
    previewUrl.value = data.url || '';
    emit('update:modelValue', data.ossId);
    emit('uploaded', { fileSize: data.fileSize, contentType: data.contentType, originalName: data.originalName });
    ElMessage.success('视频上传成功');
    options.onSuccess?.(data);
  } catch (error) {
    ElMessage.error('视频上传失败，请检查 OSS 跨域配置或稍后重试');
    options.onError?.(error);
  } finally {
    uploading.value = false;
  }
}

function clearVideo() {
  fileName.value = '';
  previewUrl.value = '';
  emit('update:modelValue', '');
}
</script>

<style scoped>
.content-video-upload {
  width: 100%;
}

.upload-tip {
  margin-top: 6px;
  color: #909399;
  font-size: 12px;
  line-height: 1.4;
}

.video-file {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  color: #606266;
}
</style>
