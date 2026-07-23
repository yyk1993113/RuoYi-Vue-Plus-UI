<template>
  <div class="fair-poster-upload">
    <!-- 线下招聘会海报必须产出固定 3:1 横幅，保证小程序卡片 aspectFill 时不再裁掉主体。 -->
    <div v-if="modelValue" class="poster-preview">
      <el-image :src="modelValue" fit="cover" class="poster-image" :preview-src-list="[modelValue]" preview-teleported>
        <template #error>
          <div class="poster-placeholder">海报加载失败</div>
        </template>
      </el-image>
      <el-button link type="danger" icon="Delete" @click="clearPoster">删除</el-button>
    </div>

    <el-upload action="#" :show-file-list="false" :http-request="noopUpload" :before-upload="beforeSelectImage" accept=".png,.jpg,.jpeg">
      <el-button type="primary" plain icon="Upload">{{ modelValue ? '重新裁切上传' : '上传并裁切' }}</el-button>
    </el-upload>

    <div class="el-upload__tip">
      请上传并裁切为 <b>3:1 横版海报</b>，推荐 <b>900×300</b> 或 <b>1200×400</b>，大小不超过 <b>5MB</b>，格式为
      <b>png/jpg/jpeg</b>。
    </div>

    <el-dialog
      v-model="cropDialogVisible"
      title="裁切线下招聘会海报"
      width="min(1080px, 92vw)"
      top="5vh"
      append-to-body
      class="fair-poster-crop-dialog"
      @opened="handleCropDialogOpened"
      @closed="closeCropDialog"
    >
      <div class="crop-guide">
        <div>
          <div class="guide-title">固定输出 3:1 横版海报</div>
          <div class="guide-desc">拖动或缩放图片，把人物和文字完整放进蓝色裁切框。裁切框已限制在图片内部，不会生成空白边。</div>
        </div>
        <el-tag type="primary" effect="plain">推荐 900×300 / 1200×400</el-tag>
      </div>

      <div class="crop-shell">
        <div class="crop-panel">
          <div class="panel-heading">
            <span>裁切区域</span>
            <span>蓝框内即最终保存范围</span>
          </div>
          <div class="cropper-stage">
            <vue-cropper
              v-if="cropperVisible"
              ref="cropperRef"
              :img="cropSource"
              :auto-crop="true"
              :auto-crop-width="660"
              :auto-crop-height="220"
              :center-box="true"
              :fixed="true"
              :fixed-number="[3, 1]"
              :fixed-box="false"
              :info="false"
              :enlarge="2"
              output-type="jpeg"
              @real-time="handlePreview"
            />
          </div>
        </div>
        <div class="preview-panel">
          <div>
            <div class="preview-title">小程序卡片预览</div>
            <div class="preview-subtitle">与小程序列表海报同为 3:1</div>
          </div>
          <div class="preview-card">
            <div class="preview-box">
              <img v-if="previewUrl" :src="previewUrl" alt="裁切预览" />
              <div v-else class="preview-placeholder">调整左侧蓝框后生成预览</div>
            </div>
            <div class="preview-caption">最终横幅效果</div>
          </div>
          <div class="preview-tip">如果主体被截掉，请缩小图片或移动到蓝框内。竖图通常只能截取局部，更适合先换成横版设计稿。</div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <div class="crop-tools">
            <span class="tool-label">调整图片</span>
            <el-button-group>
              <el-button icon="Minus" title="缩小" @click="changeScale(-1)">缩小</el-button>
              <el-button icon="Plus" title="放大" @click="changeScale(1)">放大</el-button>
            </el-button-group>
            <el-button-group>
              <el-button icon="RefreshLeft" title="向左旋转" @click="rotateLeft">左转</el-button>
              <el-button icon="RefreshRight" title="向右旋转" @click="rotateRight">右转</el-button>
            </el-button-group>
          </div>
          <div class="footer-actions">
            <el-button @click="cropDialogVisible = false">取消</el-button>
            <el-button type="primary" :loading="uploading" @click="uploadCroppedPoster">应用裁切并上传</el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import 'vue-cropper/dist/index.css';
import { VueCropper } from 'vue-cropper';
import request from '@/utils/request';
import { ElMessage } from 'element-plus';
import type { UploadRawFile } from 'element-plus';

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:modelValue']);

const cropperRef = ref<any>();
const cropDialogVisible = ref(false);
const cropperVisible = ref(false);
const uploading = ref(false);
const cropSource = ref('');
const sourceFileName = ref('fair-poster.jpg');
const previewUrl = ref('');
const previewTimer = ref<ReturnType<typeof setTimeout>>();

const modelValue = computed(() => props.modelValue);

const noopUpload = () => {};

const beforeSelectImage = (file: UploadRawFile) => {
  const allowedTypes = ['image/png', 'image/jpeg'];
  const allowedExtensions = ['png', 'jpg', 'jpeg'];
  const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
  if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
    ElMessage.error('文件格式不正确，请上传 png/jpg/jpeg 图片');
    return false;
  }
  if (file.size / 1024 / 1024 > 5) {
    ElMessage.error('上传图片大小不能超过 5MB');
    return false;
  }
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => {
    cropSource.value = String(reader.result || '');
    sourceFileName.value = normalizeFileName(file.name);
    cropDialogVisible.value = true;
  };
  return false;
};

const normalizeFileName = (fileName: string) => {
  const baseName = fileName.replace(/\.[^.]+$/, '').replace(/,/g, '-');
  return `${baseName || 'fair-poster'}-3x1.jpg`;
};

const handleCropDialogOpened = () => {
  cropperVisible.value = true;
  scheduleCropPreview();
};

const clearPoster = () => {
  emit('update:modelValue', '');
};

const handlePreview = () => {
  scheduleCropPreview();
};

const scheduleCropPreview = () => {
  if (previewTimer.value) {
    clearTimeout(previewTimer.value);
  }
  // vue-cropper 的 CSS 实时预览需要按原裁切框尺寸缩放，右侧固定卡片会错位；
  // 这里直接读取最终裁切结果，保证预览和上传内容同源。
  previewTimer.value = setTimeout(() => {
    cropperRef.value?.getCropData((data: string) => {
      previewUrl.value = data;
    });
  }, 120);
};

const changeScale = (num: number) => {
  cropperRef.value?.changeScale(num || 1);
};

const rotateLeft = () => {
  cropperRef.value?.rotateLeft();
};

const rotateRight = () => {
  cropperRef.value?.rotateRight();
};

const uploadCroppedPoster = () => {
  if (!cropperRef.value) return;
  uploading.value = true;
  cropperRef.value.getCropBlob(async (blob: Blob) => {
    try {
      // 复用既有上传接口，仅把前端裁切后的 3:1 图片作为文件源提交。
      const formData = new FormData();
      formData.append('file', blob, sourceFileName.value);
      const res = await request.post('/api/company/upload', formData);
      const url = res?.data?.url;
      if (!url) {
        throw new Error('上传接口未返回图片URL');
      }
      emit('update:modelValue', url);
      cropDialogVisible.value = false;
      ElMessage.success('海报已裁切并上传');
    } catch (e) {
      ElMessage.error('海报上传失败');
    } finally {
      uploading.value = false;
    }
  });
};

const closeCropDialog = () => {
  if (previewTimer.value) {
    clearTimeout(previewTimer.value);
    previewTimer.value = undefined;
  }
  cropperVisible.value = false;
  cropSource.value = '';
  previewUrl.value = '';
};
</script>

<style scoped>
.fair-poster-upload {
  width: 100%;
}

.poster-preview {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  margin-bottom: 12px;
}

.poster-image,
.poster-placeholder {
  width: 270px;
  height: 90px;
  border-radius: 6px;
  border: 1px solid #dcdfe6;
}

.poster-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  background: #f5f7fa;
}

.crop-guide {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  margin-bottom: 16px;
  border: 1px solid #d9ecff;
  border-radius: 8px;
  background: #f4f9ff;
}

.guide-title {
  margin-bottom: 4px;
  font-weight: 600;
  color: #303133;
}

.guide-desc {
  font-size: 13px;
  line-height: 1.6;
  color: #606266;
}

.crop-shell {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 24px;
}

.crop-panel {
  min-width: 0;
}

.panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 13px;
  color: #909399;
}

.panel-heading span:first-child {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.cropper-stage {
  height: 440px;
  overflow: hidden;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  background: #f5f7fa;
}

.preview-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.preview-title {
  font-weight: 600;
  color: #303133;
}

.preview-subtitle {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
}

.preview-card {
  padding: 12px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #fff;
}

.preview-box {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 1;
  overflow: hidden;
  border-radius: 6px;
  border: 1px solid #dcdfe6;
  background: #f5f7fa;
}

.preview-box img {
  display: block;
  width: 100%;
  height: 100%;
  max-width: none;
  object-fit: cover;
}

.preview-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 12px;
  color: #909399;
}

.preview-caption {
  margin-top: 8px;
  text-align: center;
  font-size: 12px;
  color: #909399;
}

.preview-tip {
  padding: 12px;
  border-radius: 8px;
  font-size: 12px;
  line-height: 1.5;
  color: #606266;
  background: #f5f7fa;
}

.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
}

.crop-tools,
.footer-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.tool-label {
  font-size: 13px;
  color: #909399;
}

@media (max-width: 900px) {
  .crop-guide,
  .dialog-footer {
    align-items: stretch;
    flex-direction: column;
  }

  .crop-shell {
    grid-template-columns: 1fr;
  }

  .cropper-stage {
    height: 360px;
  }

  .footer-actions {
    justify-content: flex-end;
  }
}
</style>
