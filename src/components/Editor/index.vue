<template>
  <div>
    <el-upload
      v-if="type"
      action=""
      :before-upload="handleBeforeUpload"
      :http-request="handleUploadRequest"
      class="editor-img-uploader"
      name="file"
      :show-file-list="false"
    >
      <i ref="uploadRef"></i>
    </el-upload>
  </div>
  <div class="editor">
    <quill-editor
      ref="quillEditorRef"
      v-model:content="content"
      content-type="html"
      :options="options"
      :style="styles"
      @text-change="handleTextChange"
    />
  </div>
</template>

<script setup lang="ts">
import '@vueup/vue-quill/dist/vue-quill.snow.css';

import { QuillEditor, Quill } from '@vueup/vue-quill';
import { propTypes } from '@/utils/propTypes';
import request from '@/utils/request';
import type { UploadRequestHandler, UploadRequestOptions } from 'element-plus';

const emit = defineEmits(['update:modelValue']);

const props = defineProps({
  /* 编辑器的内容 */
  modelValue: propTypes.string,
  /* 高度 */
  height: propTypes.number.def(400),
  /* 最小高度 */
  minHeight: propTypes.number.def(400),
  /* 只读 */
  readOnly: propTypes.bool.def(false),
  /* 上传文件大小限制(MB) */
  fileSize: propTypes.number.def(5),
  /* 类型（base64格式、url格式） */
  type: propTypes.string.def('base64')
});

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const quillEditorRef = ref();
const uploadRef = ref<HTMLDivElement>();
const CONTENT_IMAGE_PATH = '/api/content/oss/image/';
const contentImagePathPattern = /^(?:https?:\/\/[^/]+)?(?:\/(?:dev-api|prod-api))?(\/api\/content\/oss\/image\/[^"'<\s]+)$/i;
const uploadedPreviewUrlMap = new Map<string, string>();

const options = ref<any>({
  theme: 'snow',
  bounds: document.body,
  debug: 'warn',
  modules: {
    // 工具栏配置
    toolbar: {
      container: [
        ['bold', 'italic', 'underline', 'strike'], // 加粗 斜体 下划线 删除线
        ['blockquote', 'code-block'], // 引用  代码块
        [{ list: 'ordered' }, { list: 'bullet' }], // 有序、无序列表
        [{ indent: '-1' }, { indent: '+1' }], // 缩进
        [{ size: ['small', false, 'large', 'huge'] }], // 字体大小
        [{ header: [1, 2, 3, 4, 5, 6, false] }], // 标题
        [{ color: [] }, { background: [] }], // 字体颜色、字体背景颜色
        [{ align: [] }], // 对齐方式
        ['clean'], // 清除文本格式
        ['link', 'image', 'video'] // 链接、图片、视频
      ],
      handlers: {
        image: (value: boolean) => {
          if (value) {
            // 调用element图片上传
            uploadRef.value.click();
          } else {
            Quill.format('image', true);
          }
        }
      }
    }
  },
  placeholder: '请输入内容',
  readOnly: props.readOnly
});

const styles = computed(() => {
  const style: any = {};
  if (props.minHeight) {
    style.minHeight = `${props.minHeight}px`;
  }
  if (props.height) {
    style.height = `${props.height}px`;
  }
  return style;
});

const content = ref('');

const buildPortableContentImageUrl = (ossId: string | number) => `${CONTENT_IMAGE_PATH}${ossId}`;

const buildPreviewContentImageUrl = (portableUrl: string) => `${import.meta.env.VITE_APP_BASE_API}${portableUrl}`;

const decodeHtmlAttribute = (value: string) => {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = value;
  return textarea.value;
};

const extractPortableContentImagePath = (url: string) => {
  const matched = String(url || '').match(contentImagePathPattern);
  return matched ? matched[1] : '';
};

const normalizeContentImageUrl = (url: string, mode: 'preview' | 'portable') => {
  const portablePath = extractPortableContentImagePath(url);
  if (portablePath) {
    return mode === 'preview' ? buildPreviewContentImageUrl(portablePath) : portablePath;
  }
  if (mode === 'portable') {
    const decodedUrl = decodeHtmlAttribute(url);
    const portablePreviewUrl = uploadedPreviewUrlMap.get(url) || uploadedPreviewUrlMap.get(decodedUrl);
    if (portablePreviewUrl) {
      return portablePreviewUrl;
    }
  }
  return url;
};

// 富文本公告图片入库用稳定业务路径；编辑器预览时再补后台代理前缀，避免把 dev/prod 代理路径写进业务表。
const rewriteContentImageUrls = (html: string, mode: 'preview' | 'portable') =>
  String(html || '').replace(/(<img\b[^>]*?\bsrc\s*=\s*)(["'])(.*?)\2/gi, (_match, prefix, quote, src) => {
    return `${prefix}${quote}${normalizeContentImageUrl(src, mode)}${quote}`;
  });

const toEditorContent = (html: string) => (props.type === 'url' ? rewriteContentImageUrls(html, 'preview') : html);

const toModelContent = (html: string) => (props.type === 'url' ? rewriteContentImageUrls(html, 'portable') : html);

watch(
  () => props.modelValue,
  (v: string) => {
    const next = toEditorContent(v || '<p></p>');
    if (next !== content.value) {
      content.value = next;
    }
  },
  { immediate: true }
);

const insertImageToEditor = (url: string) => {
  const quill = toRaw(quillEditorRef.value)?.getQuill();
  if (!quill) {
    throw new Error('editor not ready');
  }
  const range = quill.selection?.savedRange;
  const length = range ? range.index : quill.getLength();
  quill.insertEmbed(length, 'image', url);
  quill.setSelection(length + 1);
};

const handleTextChange = () => {
  emit('update:modelValue', toModelContent(content.value));
};

// 图片上传前拦截
const handleBeforeUpload = (file: any) => {
  const type = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg', 'image/svg+xml'];
  const isJPG = type.includes(file.type);
  //检验文件格式
  if (!isJPG) {
    proxy?.$modal.msgError(`图片格式错误!`);
    return false;
  }
  // 校检文件大小
  if (props.fileSize) {
    const isLt = file.size / 1024 / 1024 < props.fileSize;
    if (!isLt) {
      proxy?.$modal.msgError(`上传文件大小不能超过 ${props.fileSize} MB!`);
      return false;
    }
  }
  proxy?.$modal.loading('正在上传文件，请稍候...');
  return true;
};

// 图片插入策略：默认保持历史 base64 行为；公告等运营内容可用 type=url 上传 OSS 后插入图片 URL。
const handleUploadRequest: UploadRequestHandler = (options: UploadRequestOptions) => {
  return new Promise<void>((resolve, reject) => {
    const file = options.file as File;
    if (props.type === 'url') {
      const formData = new FormData();
      formData.append('file', file);
      request
        .post('/resource/oss/upload', formData)
        .then((res: any) => {
          const ossId = res?.data?.ossId;
          const previewUrl = res?.data?.url;
          if (!previewUrl) {
            throw new Error('empty image url');
          }
          if (ossId) {
            uploadedPreviewUrlMap.set(previewUrl, buildPortableContentImageUrl(ossId));
          }
          insertImageToEditor(previewUrl);
          proxy?.$modal.closeLoading();
          options.onSuccess?.({ url: previewUrl });
          resolve();
        })
        .catch((err: any) => {
          proxy?.$modal.msgError('图片上传失败');
          proxy?.$modal.closeLoading();
          options.onError?.(err as any);
          reject(err);
        });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const base64 = reader.result as string;
        insertImageToEditor(base64);
        proxy?.$modal.closeLoading();
        options.onSuccess?.({ url: base64 });
        resolve();
      } catch (err: any) {
        proxy?.$modal.msgError('图片插入失败');
        proxy?.$modal.closeLoading();
        options.onError?.(err as any);
        reject(err);
      }
    };
    reader.onerror = () => {
      proxy?.$modal.msgError('图片插入失败');
      proxy?.$modal.closeLoading();
      const err = Object.assign(new Error('read image failed'), {
        status: 0,
        method: 'POST',
        url: options.action || ''
      });
      options.onError?.(err as any);
      reject(err);
    };
    reader.readAsDataURL(file);
  });
};
</script>

<style>
.editor-img-uploader {
  display: none;
}
.editor,
.ql-toolbar {
  white-space: pre-wrap !important;
  line-height: normal !important;
}
.quill-img {
  display: none;
}
.ql-snow .ql-tooltip[data-mode='link']::before {
  content: '请输入链接地址:';
}
.ql-snow .ql-tooltip.ql-editing a.ql-action::after {
  border-right: 0;
  content: '保存';
  padding-right: 0;
}
.ql-snow .ql-tooltip[data-mode='video']::before {
  content: '请输入视频地址:';
}
.ql-snow .ql-picker.ql-size .ql-picker-label::before,
.ql-snow .ql-picker.ql-size .ql-picker-item::before {
  content: '14px';
}
.ql-snow .ql-picker.ql-size .ql-picker-label[data-value='small']::before,
.ql-snow .ql-picker.ql-size .ql-picker-item[data-value='small']::before {
  content: '10px';
}
.ql-snow .ql-picker.ql-size .ql-picker-label[data-value='large']::before,
.ql-snow .ql-picker.ql-size .ql-picker-item[data-value='large']::before {
  content: '18px';
}
.ql-snow .ql-picker.ql-size .ql-picker-label[data-value='huge']::before,
.ql-snow .ql-picker.ql-size .ql-picker-item[data-value='huge']::before {
  content: '32px';
}
.ql-snow .ql-picker.ql-header .ql-picker-label::before,
.ql-snow .ql-picker.ql-header .ql-picker-item::before {
  content: '文本';
}
.ql-snow .ql-picker.ql-header .ql-picker-label[data-value='1']::before,
.ql-snow .ql-picker.ql-header .ql-picker-item[data-value='1']::before {
  content: '标题1';
}
.ql-snow .ql-picker.ql-header .ql-picker-label[data-value='2']::before,
.ql-snow .ql-picker.ql-header .ql-picker-item[data-value='2']::before {
  content: '标题2';
}
.ql-snow .ql-picker.ql-header .ql-picker-label[data-value='3']::before,
.ql-snow .ql-picker.ql-header .ql-picker-item[data-value='3']::before {
  content: '标题3';
}
.ql-snow .ql-picker.ql-header .ql-picker-label[data-value='4']::before,
.ql-snow .ql-picker.ql-header .ql-picker-item[data-value='4']::before {
  content: '标题4';
}
.ql-snow .ql-picker.ql-header .ql-picker-label[data-value='5']::before,
.ql-snow .ql-picker.ql-header .ql-picker-item[data-value='5']::before {
  content: '标题5';
}
.ql-snow .ql-picker.ql-header .ql-picker-label[data-value='6']::before,
.ql-snow .ql-picker.ql-header .ql-picker-item[data-value='6']::before {
  content: '标题6';
}
.ql-snow .ql-picker.ql-font .ql-picker-label::before,
.ql-snow .ql-picker.ql-font .ql-picker-item::before {
  content: '标准字体';
}
.ql-snow .ql-picker.ql-font .ql-picker-label[data-value='serif']::before,
.ql-snow .ql-picker.ql-font .ql-picker-item[data-value='serif']::before {
  content: '衬线字体';
}
.ql-snow .ql-picker.ql-font .ql-picker-label[data-value='monospace']::before,
.ql-snow .ql-picker.ql-font .ql-picker-item[data-value='monospace']::before {
  content: '等宽字体';
}
</style>
