<template>
  <div class="p-4">
    <!--
      运营台·内容配置页
      职责：统一运营首页七类内容位（轮播图 / 六大金刚区 / 平台公告 / 线下招聘会 / 技能课程 / 求职干货 / 求职服务）。
      数据来源：后端 AdminContentController（/admin/content/<type>/...），七类接口同构。
      实现策略：用 TAB_CONFIGS 描述每个 tab 的“主键字段 / 列定义 / 表单字段 / API 方法”，
                el-table + 新增编辑弹窗 + 上下架开关 + 排序 这套交互只写一份，按当前 tab 取配置渲染。
    -->
    <el-card shadow="never">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane v-for="cfg in tabConfigs" :key="cfg.key" :label="cfg.label" :name="cfg.key" />
      </el-tabs>

      <!-- 查询 + 操作条 -->
      <el-form ref="queryFormRef" :model="queryParams" :inline="true" class="mb-2">
        <el-form-item v-if="currentConfig.keywordField" :label="currentConfig.nameLabel" prop="keyword">
          <el-input
            v-model="queryParams.keyword"
            :placeholder="`请输入${currentConfig.nameLabel}`"
            clearable
            style="width: 200px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 140px">
            <el-option :label="currentConfig.statusOnText" value="1" />
            <el-option :label="currentConfig.statusOffText" value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <el-row :gutter="10" class="mb-2">
        <el-col :span="1.5">
          <el-button type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button type="danger" plain icon="Delete" :disabled="selectedIds.length === 0" @click="handleDelete()"> 删除 </el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button plain icon="Refresh" @click="loadData">刷新</el-button>
        </el-col>
      </el-row>

      <!-- 数据表格：动态列由 currentConfig.columns 驱动 -->
      <el-table :key="activeTab" v-loading="loading" :data="tableData" border stripe @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column
          v-for="col in currentConfig.columns"
          :key="col.prop"
          :label="col.label"
          :prop="col.prop"
          :width="col.width"
          :min-width="col.minWidth"
          :align="col.align || 'center'"
          :show-overflow-tooltip="col.type === 'text' || col.type === 'id'"
        >
          <template #default="{ row }">
            <!-- 图片列 -->
            <el-image
              v-if="col.type === 'image'"
              :src="row[col.prop]"
              :preview-src-list="row[col.prop] ? [row[col.prop]] : []"
              preview-teleported
              fit="cover"
              style="width: 56px; height: 56px; border-radius: 6px"
            >
              <template #error>
                <div class="img-placeholder">无图</div>
              </template>
            </el-image>
            <!-- 价格列（0 显示免费） -->
            <span v-else-if="col.type === 'price'">
              <el-tag v-if="!row[col.prop] || Number(row[col.prop]) === 0" type="success">免费</el-tag>
              <span v-else>¥{{ row[col.prop] }}</span>
            </span>
            <!-- 标签列（逗号分隔渲染成 tag） -->
            <template v-else-if="col.type === 'tags'">
              <el-tag v-for="t in splitToArray(row[col.prop])" :key="t" size="small" class="tag-item">{{ t }}</el-tag>
              <span v-if="!splitToArray(row[col.prop]).length">-</span>
            </template>
            <!-- 公告类型列：后端存稳定枚举值，后台显示运营可读中文 -->
            <el-tag v-else-if="col.type === 'noticeType'" :type="formatNoticeType(row[col.prop]).tagType">
              {{ formatNoticeType(row[col.prop]).label }}
            </el-tag>
            <!-- 公告点击动作：后台用结构化枚举，不再让运营手写小程序 URL -->
            <el-tag v-else-if="col.type === 'targetType'" :type="formatNoticeTarget(row[col.prop]).tagType">
              {{ formatNoticeTarget(row[col.prop]).label }}
            </el-tag>
            <el-tag v-else-if="col.type === 'featured'" :type="row[col.prop] === '1' ? 'success' : 'info'">
              {{ row[col.prop] === '1' ? '精选' : '普通' }}
            </el-tag>
            <el-tag v-else-if="col.type === 'video'" :type="row.videoOssId ? 'success' : 'info'">
              {{ row.videoOssId ? '已上传' : '未上传' }}
            </el-tag>
            <!-- 首页展示：公告首页最多 3 条，由后端最终校验，避免多端绕过前端限制。 -->
            <template v-else-if="col.type === 'homeVisible'">
              <el-switch
                v-if="canRenderHomeVisibleSwitch(row)"
                :key="buildHomeVisibleSwitchKey(row)"
                :model-value="row.homeVisible"
                active-value="1"
                inactive-value="0"
                active-text="展示"
                inactive-text="隐藏"
                inline-prompt
                @change="(val) => handleHomeVisibleChange(row, val as string)"
              />
              <span v-else>-</span>
            </template>
            <!-- 上下架/显隐开关：只有当前 tab 的完整业务行才绑定切换事件，避免异步切 tab 时误触发 -->
            <template v-else-if="col.type === 'status'">
              <el-switch
                v-if="canRenderStatusSwitch(row)"
                :key="buildStatusSwitchKey(row)"
                :model-value="row.status"
                active-value="1"
                inactive-value="0"
                :active-text="currentConfig.statusOnText"
                :inactive-text="currentConfig.statusOffText"
                inline-prompt
                @change="(val) => handleStatusChange(row, val as string)"
              />
              <span v-else>-</span>
            </template>
            <!-- 长 ID 使用 tabular figures 且禁止换行，避免雪花 ID 被表格挤成多行。 -->
            <span v-else-if="col.type === 'id'" class="cell-id">{{ row[col.prop] ?? '-' }}</span>
            <!-- 普通文本 -->
            <span v-else>{{ row[col.prop] ?? '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" icon="Edit" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" icon="Delete" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="activeTab === 'notice'" class="notice-home-tip">
        首页最多展示 3 条；开启“首页展示”会同步设为显示，关闭公告状态会自动取消首页展示。
      </div>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="loadData" />
    </el-card>

    <!-- 新增/编辑弹窗：表单字段由 currentConfig.fields 驱动 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" :width="activeTab === 'notice' ? '760px' : '640px'" append-to-body @closed="resetForm">
      <el-form ref="formRef" :model="form" :rules="currentConfig.rules" label-width="100px">
        <template v-for="field in currentConfig.fields" :key="field.prop">
          <el-form-item :label="field.label" :prop="field.prop">
            <!-- 图片上传 -->
            <image-upload v-if="field.type === 'image'" v-model="form[field.prop]" :limit="1" :value-type="field.valueType || 'url'" />
            <!-- 课程视频：PC 端直传 OSS，表单只保存 videoOssId，播放 URL 由后端读取时签发。 -->
            <content-video-upload v-else-if="field.type === 'video'" v-model="form[field.prop]" @uploaded="handleVideoUploaded" />
            <!-- 招聘会海报专用:上传后固定裁切成 3:1 横幅,保证小程序卡片铺满且不裁主体。 -->
            <fair-poster-crop-upload v-else-if="field.type === 'fairPoster'" v-model="form[field.prop]" />
            <!-- 数字 -->
            <el-input-number
              v-else-if="field.type === 'number'"
              v-model="form[field.prop]"
              :min="field.min ?? 0"
              :precision="field.precision ?? 0"
              :step="field.step ?? 1"
              controls-position="right"
              style="width: 200px"
            />
            <!-- 多行文本 -->
            <el-input
              v-else-if="field.type === 'textarea'"
              v-model="form[field.prop]"
              type="textarea"
              :rows="4"
              :placeholder="field.placeholder || `请输入${field.label}`"
              :maxlength="field.maxlength"
              :show-word-limit="!!field.maxlength"
            />
            <!-- 富文本：用于平台公告正文，图片走 OSS URL，不把大图 base64 存进业务表。 -->
            <editor
              v-else-if="field.type === 'editor'"
              v-model="form[field.prop]"
              class="notice-editor"
              type="url"
              :height="field.height || 260"
              :min-height="field.minHeight || 260"
            />
            <!-- 下拉选项：用于公告类型等枚举字段，避免运营输入非约定值 -->
            <el-select v-else-if="field.type === 'select'" v-model="form[field.prop]" :placeholder="field.placeholder || `请选择${field.label}`">
              <el-option v-for="option in field.options || []" :key="option.value" :label="option.label" :value="option.value" />
            </el-select>
            <!-- 生效窗口：后端按 beginTime/endTime 过滤 C 端可见公告 -->
            <el-date-picker
              v-else-if="field.type === 'datetime'"
              v-model="form[field.prop]"
              type="datetime"
              value-format="YYYY-MM-DD HH:mm:ss"
              :placeholder="field.placeholder || `请选择${field.label}`"
              style="width: 240px"
            />
            <!-- 状态开关 -->
            <el-switch
              v-else-if="field.type === 'status'"
              v-model="form[field.prop]"
              active-value="1"
              inactive-value="0"
              :active-text="currentConfig.statusOnText"
              :inactive-text="currentConfig.statusOffText"
              inline-prompt
            />
            <el-switch
              v-else-if="field.type === 'switch'"
              v-model="form[field.prop]"
              active-value="1"
              inactive-value="0"
              :active-text="field.activeText || '是'"
              :inactive-text="field.inactiveText || '否'"
              inline-prompt
            />
            <!-- 普通文本输入 -->
            <el-input v-else v-model="form[field.prop]" :placeholder="field.placeholder || `请输入${field.label}`" :maxlength="field.maxlength" />
            <div v-if="field.tip" class="form-tip">{{ field.tip }}</div>
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="RecruitmentContent" lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormRules } from 'element-plus';
import {
  // 轮播图
  listBanner,
  getBanner,
  addBanner,
  updateBanner,
  delBanner,
  changeBannerStatus,
  // 金刚区
  listKingkong,
  getKingkong,
  addKingkong,
  updateKingkong,
  delKingkong,
  changeKingkongStatus,
  // 平台公告
  listHomeNotice,
  getHomeNotice,
  addHomeNotice,
  updateHomeNotice,
  delHomeNotice,
  changeHomeNoticeStatus,
  changeHomeNoticeHomeVisible,
  // 线下招聘会
  listFairEvent,
  getFairEvent,
  addFairEvent,
  updateFairEvent,
  delFairEvent,
  changeFairEventStatus,
  // 技能课程
  listCourse,
  getCourse,
  addCourse,
  updateCourse,
  delCourse,
  changeCourseStatus,
  // 求职干货
  listArticle,
  getArticle,
  addArticle,
  updateArticle,
  delArticle,
  changeArticleStatus,
  // 求职服务
  listJobService,
  getJobService,
  addJobService,
  updateJobService,
  delJobService,
  changeJobServiceStatus
} from '@/api/recruitment/content';
import { unwrapList, splitToArray } from './helpers';
import FairPosterCropUpload from './components/FairPosterCropUpload.vue';
import ContentVideoUpload from './components/ContentVideoUpload.vue';

// 列定义：type 决定单元格渲染方式（image/price/tags/status/text/缺省纯文本）
interface ColumnDef {
  prop: string;
  label: string;
  width?: number | string;
  minWidth?: number | string;
  align?: string;
  type?: 'image' | 'price' | 'tags' | 'noticeType' | 'targetType' | 'featured' | 'video' | 'homeVisible' | 'status' | 'id' | 'text';
}
// 下拉选项定义：value 是后端稳定枚举，label 是后台展示文案
interface FieldOption {
  label: string;
  value: string;
}
// 表单字段定义：type 决定控件类型；keyword 列名映射到查询字段
interface FieldDef {
  prop: string;
  label: string;
  type?: 'image' | 'fairPoster' | 'video' | 'number' | 'textarea' | 'editor' | 'select' | 'datetime' | 'status' | 'switch' | 'text';
  valueType?: 'ossId' | 'url';
  placeholder?: string;
  maxlength?: number;
  min?: number;
  step?: number;
  precision?: number;
  height?: number;
  minHeight?: number;
  tip?: string;
  activeText?: string;
  inactiveText?: string;
  options?: FieldOption[];
}
// 单个 tab 的全量配置：主键名 / 查询关键字字段 / 列 / 表单字段 / 校验 / 状态文案 / 六个 API 方法
interface TabConfig {
  key: string;
  label: string;
  idKey: string; // 主键字段名，如 bannerId
  keywordField?: 'title' | 'name'; // 列表查询时关键字写入的实体字段；Banner 图片已自带文案，不再做标题检索
  nameLabel: string; // 查询框/默认标题用的名称标签
  statusOnText: string; // status=1 文案（显示/上架）
  statusOffText: string; // status=0 文案（隐藏/下架）
  columns: ColumnDef[];
  fields: FieldDef[];
  rules: FormRules;
  defaults: Record<string, any>; // 新增时的初始值
  api: {
    list: (q: any) => Promise<any>;
    get: (id: number) => Promise<any>;
    add: (d: any) => Promise<any>;
    update: (d: any) => Promise<any>;
    del: (ids: number | number[]) => Promise<any>;
    changeStatus: (d: any) => Promise<any>;
    changeHomeVisible?: (d: any) => Promise<any>;
  };
}

const ROW_TAB_KEY = '__contentTabKey';

// 公共列：排序 / 状态开关 / 创建时间（各内容位共用，避免重复书写）
const sortColumn: ColumnDef = { prop: 'sort', label: '排序', width: 80 };
const statusColumn: ColumnDef = { prop: 'status', label: '状态', width: 110, type: 'status' };
const createTimeColumn: ColumnDef = { prop: 'createTime', label: '创建时间', width: 165 };
// 公共表单字段：排序 + 状态
const sortField: FieldDef = { prop: 'sort', label: '排序', type: 'number', tip: '值越小越靠前' };
const statusField: FieldDef = { prop: 'status', label: '状态', type: 'status' };

const noticeTypeOptions: FieldOption[] = [
  { label: '公告', value: 'notice' },
  { label: '活动', value: 'activity' },
  { label: '提醒', value: 'reminder' }
];

const noticeTypeMap: Record<string, { label: string; tagType: 'primary' | 'success' | 'warning' | 'info' | 'danger' }> = {
  notice: { label: '公告', tagType: 'primary' },
  activity: { label: '活动', tagType: 'warning' },
  reminder: { label: '提醒', tagType: 'info' }
};

const noticeTargetOptions: FieldOption[] = [
  { label: '查看详情', value: 'detail' },
  { label: '仅展示不跳转', value: 'none' }
];

const noticeTargetMap: Record<string, { label: string; tagType: 'primary' | 'success' | 'warning' | 'info' | 'danger' }> = {
  detail: { label: '查看详情', tagType: 'success' },
  none: { label: '不跳转', tagType: 'info' }
};

// 七类内容位配置表（顺序即 tab 顺序）
const tabConfigs: TabConfig[] = [
  // ---------- 轮播图 ----------
  {
    key: 'banner',
    label: 'Banner',
    idKey: 'bannerId',
    nameLabel: 'Banner',
    statusOnText: '显示',
    statusOffText: '隐藏',
    columns: [
      { prop: 'bannerId', label: 'ID', width: 80 },
      { prop: 'imageUrl', label: '图片', width: 90, type: 'image' },
      { prop: 'linkUrl', label: '跳转链接', minWidth: 180, align: 'left', type: 'text' },
      sortColumn,
      statusColumn,
      createTimeColumn
    ],
    fields: [
      { prop: 'imageUrl', label: '图片', type: 'image', tip: '建议尺寸 750×300' },
      { prop: 'linkUrl', label: '跳转链接', placeholder: '页面路由或外部 URL，可留空' },
      sortField,
      statusField
    ],
    rules: {
      imageUrl: [{ required: true, message: '请上传图片', trigger: 'change' }]
    },
    defaults: { sort: 0, status: '1' },
    api: { list: listBanner, get: getBanner, add: addBanner, update: updateBanner, del: delBanner, changeStatus: changeBannerStatus }
  },
  // ---------- 六大金刚区 ----------
  {
    key: 'kingkong',
    label: '六大金刚区',
    idKey: 'kingkongId',
    keywordField: 'name',
    nameLabel: '名称',
    statusOnText: '显示',
    statusOffText: '隐藏',
    columns: [
      { prop: 'kingkongKey', label: '坑位Key', width: 120, align: 'left' },
      { prop: 'name', label: '名称', width: 110 },
      { prop: 'subtitle', label: '副标题', minWidth: 120, align: 'left', type: 'text' },
      { prop: 'coreValue', label: '核心价值', minWidth: 140, align: 'left', type: 'text' },
      { prop: 'iconUrl', label: '图标', width: 80, type: 'image' },
      sortColumn,
      statusColumn
    ],
    fields: [
      { prop: 'kingkongKey', label: '坑位Key', placeholder: '业务唯一标识，如 resume/job/training', maxlength: 50 },
      { prop: 'name', label: '名称', maxlength: 20 },
      { prop: 'subtitle', label: '副标题', maxlength: 30 },
      { prop: 'coreValue', label: '核心价值', placeholder: '一句话卖点', maxlength: 50 },
      { prop: 'description', label: '释义', type: 'textarea', maxlength: 200 },
      { prop: 'iconUrl', label: '图标', type: 'image' },
      { prop: 'linkUrl', label: '跳转链接', placeholder: '页面路由或外部 URL，可留空' },
      sortField,
      statusField
    ],
    rules: {
      kingkongKey: [{ required: true, message: '请输入坑位Key', trigger: 'blur' }],
      name: [{ required: true, message: '请输入名称', trigger: 'blur' }]
    },
    defaults: { sort: 0, status: '1' },
    api: { list: listKingkong, get: getKingkong, add: addKingkong, update: updateKingkong, del: delKingkong, changeStatus: changeKingkongStatus }
  },
  // ---------- 平台公告 ----------
  {
    key: 'notice',
    label: '平台公告',
    idKey: 'noticeId',
    keywordField: 'title',
    nameLabel: '标题',
    statusOnText: '显示',
    statusOffText: '隐藏',
    columns: [
      { prop: 'noticeId', label: 'ID', width: 180, type: 'id' },
      { prop: 'noticeType', label: '类型', width: 90, type: 'noticeType' },
      { prop: 'title', label: '标题', minWidth: 180, align: 'left', type: 'text' },
      { prop: 'summary', label: '摘要', minWidth: 220, align: 'left', type: 'text' },
      { prop: 'homeVisible', label: '首页展示', width: 120, type: 'homeVisible' },
      { prop: 'targetType', label: '点击动作', width: 120, type: 'targetType' },
      { prop: 'beginTime', label: '生效时间', width: 165 },
      { prop: 'endTime', label: '失效时间', width: 165 },
      sortColumn,
      statusColumn
    ],
    fields: [
      { prop: 'noticeType', label: '类型', type: 'select', options: noticeTypeOptions },
      { prop: 'title', label: '公告标题', maxlength: 80 },
      { prop: 'summary', label: '首页摘要', placeholder: '不填默认使用标题，建议 20-40 字', maxlength: 120 },
      { prop: 'content', label: '公告正文', type: 'editor', height: 280, minHeight: 260 },
      { prop: 'targetType', label: '点击动作', type: 'select', options: noticeTargetOptions },
      { prop: 'beginTime', label: '生效时间', type: 'datetime', placeholder: '不填表示立即生效' },
      { prop: 'endTime', label: '失效时间', type: 'datetime', placeholder: '不填表示长期有效' },
      sortField,
      statusField
    ],
    rules: {
      noticeType: [{ required: true, message: '请选择类型', trigger: 'change' }],
      title: [{ required: true, message: '请输入公告标题', trigger: 'blur' }],
      content: [{ required: true, message: '请输入公告正文', trigger: 'blur' }],
      targetType: [{ required: true, message: '请选择点击动作', trigger: 'change' }]
    },
    defaults: { sort: 0, status: '1', noticeType: 'notice', targetType: 'detail', homeVisible: '0' },
    api: {
      list: listHomeNotice,
      get: getHomeNotice,
      add: addHomeNotice,
      update: updateHomeNotice,
      del: delHomeNotice,
      changeStatus: changeHomeNoticeStatus,
      changeHomeVisible: changeHomeNoticeHomeVisible
    }
  },
  // ---------- 线下招聘会 ----------
  {
    key: 'fair',
    label: '线下招聘会',
    idKey: 'fairId',
    keywordField: 'title',
    nameLabel: '标题',
    statusOnText: '上架',
    statusOffText: '下架',
    columns: [
      { prop: 'fairId', label: 'ID', width: 180, type: 'id' },
      { prop: 'title', label: '标题', minWidth: 180, align: 'left', type: 'text' },
      { prop: 'posterUrl', label: '海报', width: 90, type: 'image' },
      { prop: 'startTime', label: '开始时间', width: 165 },
      { prop: 'endTime', label: '结束时间', width: 165 },
      { prop: 'venue', label: '场馆', minWidth: 160, align: 'left', type: 'text' },
      { prop: 'address', label: '地址', minWidth: 200, align: 'left', type: 'text' },
      sortColumn,
      statusColumn,
      createTimeColumn
    ],
    fields: [
      { prop: 'title', label: '标题', maxlength: 80 },
      { prop: 'posterUrl', label: '海报', type: 'fairPoster' },
      { prop: 'startTime', label: '开始时间', type: 'datetime' },
      { prop: 'endTime', label: '结束时间', type: 'datetime', placeholder: '不填表示长期展示' },
      { prop: 'venue', label: '举办场馆', maxlength: 100 },
      { prop: 'address', label: '详细地址', maxlength: 200 },
      { prop: 'summary', label: '活动摘要', type: 'textarea', maxlength: 300 },
      { prop: 'content', label: '活动详情', type: 'textarea', maxlength: 2000 },
      sortField,
      statusField
    ],
    rules: {
      title: [{ required: true, message: '请输入招聘会标题', trigger: 'blur' }],
      posterUrl: [{ required: true, message: '请上传招聘会海报', trigger: 'change' }],
      startTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
      venue: [{ required: true, message: '请输入举办场馆', trigger: 'blur' }]
    },
    defaults: { sort: 0, status: '1' },
    api: {
      list: listFairEvent,
      get: getFairEvent,
      add: addFairEvent,
      update: updateFairEvent,
      del: delFairEvent,
      changeStatus: changeFairEventStatus
    }
  },
  // ---------- 技能课程 ----------
  {
    key: 'course',
    label: '技能课程',
    idKey: 'courseId',
    keywordField: 'title',
    nameLabel: '标题',
    statusOnText: '上架',
    statusOffText: '下架',
    columns: [
      { prop: 'courseId', label: 'ID', width: 80 },
      { prop: 'title', label: '标题', minWidth: 160, align: 'left' },
      { prop: 'coverUrl', label: '封面', width: 90, type: 'image' },
      { prop: 'videoOssId', label: '视频', width: 90, type: 'video' },
      { prop: 'tags', label: '标签', minWidth: 140, align: 'left', type: 'tags' },
      { prop: 'lessonCount', label: '节数', width: 70 },
      { prop: 'studyCount', label: '学习人数', width: 90 },
      { prop: 'price', label: '价格', width: 90, type: 'price' },
      { prop: 'featured', label: '精选', width: 80, type: 'featured' },
      { prop: 'featuredSort', label: '精选排序', width: 90 },
      { prop: 'viewCount', label: '观看', width: 80 },
      sortColumn,
      statusColumn
    ],
    fields: [
      { prop: 'title', label: '标题', maxlength: 50 },
      { prop: 'summary', label: '摘要', type: 'textarea', maxlength: 300 },
      { prop: 'coverOssId', label: '封面图', type: 'image', valueType: 'ossId', tip: '建议尺寸 4:3' },
      { prop: 'videoOssId', label: '课程视频', type: 'video', tip: '精选课程必须上传视频' },
      { prop: 'tags', label: '标签', placeholder: '多个标签用英文逗号分隔' },
      { prop: 'lessonCount', label: '节数', type: 'number' },
      { prop: 'studyCount', label: '学习人数', type: 'number' },
      { prop: 'price', label: '价格(元)', type: 'number', precision: 2, step: 1, tip: '0 表示免费' },
      { prop: 'content', label: '课程内容', type: 'textarea', maxlength: 2000 },
      { prop: 'featured', label: '精选展示', type: 'switch', activeText: '精选', inactiveText: '普通', tip: '首页最多展示 3 个精选课程' },
      { prop: 'featuredSort', label: '精选排序', type: 'number', tip: '精选列表内值越小越靠前' },
      sortField,
      statusField
    ],
    rules: {
      title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
      coverOssId: [{ required: true, message: '请上传封面图', trigger: 'change' }]
    },
    defaults: { sort: 0, status: '1', featured: '0', featuredSort: 0, lessonCount: 0, studyCount: 0, price: 0, viewCount: 0 },
    api: { list: listCourse, get: getCourse, add: addCourse, update: updateCourse, del: delCourse, changeStatus: changeCourseStatus }
  },
  // ---------- 求职干货 ----------
  {
    key: 'article',
    label: '求职干货',
    idKey: 'articleId',
    keywordField: 'title',
    nameLabel: '标题',
    statusOnText: '上架',
    statusOffText: '下架',
    columns: [
      { prop: 'articleId', label: 'ID', width: 80 },
      { prop: 'title', label: '标题', minWidth: 180, align: 'left' },
      { prop: 'coverUrl', label: '封面', width: 90, type: 'image' },
      { prop: 'tags', label: '标签', minWidth: 140, align: 'left', type: 'tags' },
      { prop: 'readCount', label: '阅读数', width: 90 },
      { prop: 'featured', label: '精选', width: 80, type: 'featured' },
      { prop: 'featuredSort', label: '精选排序', width: 90 },
      sortColumn,
      statusColumn
    ],
    fields: [
      { prop: 'title', label: '标题', maxlength: 60 },
      { prop: 'summary', label: '摘要', type: 'textarea', maxlength: 300 },
      { prop: 'coverOssId', label: '封面图', type: 'image', valueType: 'ossId', tip: '建议尺寸 16:9' },
      { prop: 'tags', label: '标签', placeholder: '多个标签用英文逗号分隔' },
      { prop: 'readCount', label: '阅读数', type: 'number' },
      { prop: 'content', label: '正文内容', type: 'editor', height: 320, minHeight: 260 },
      { prop: 'featured', label: '精选展示', type: 'switch', activeText: '精选', inactiveText: '普通', tip: '首页最多展示 3 篇精选文章' },
      { prop: 'featuredSort', label: '精选排序', type: 'number', tip: '精选列表内值越小越靠前' },
      sortField,
      statusField
    ],
    rules: {
      title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
      content: [{ required: true, message: '请输入正文内容', trigger: 'blur' }]
    },
    defaults: { sort: 0, status: '1', featured: '0', featuredSort: 0, readCount: 0 },
    api: { list: listArticle, get: getArticle, add: addArticle, update: updateArticle, del: delArticle, changeStatus: changeArticleStatus }
  },
  // ---------- 求职服务 ----------
  {
    key: 'jobService',
    label: '求职服务',
    idKey: 'serviceId',
    keywordField: 'name',
    nameLabel: '名称',
    statusOnText: '显示',
    statusOffText: '隐藏',
    columns: [
      { prop: 'serviceId', label: 'ID', width: 80 },
      { prop: 'name', label: '名称', width: 140, align: 'left' },
      { prop: 'description', label: '描述', minWidth: 200, align: 'left', type: 'text' },
      { prop: 'iconUrl', label: '图标', width: 80, type: 'image' },
      { prop: 'linkUrl', label: '跳转链接', minWidth: 160, align: 'left', type: 'text' },
      sortColumn,
      statusColumn
    ],
    fields: [
      { prop: 'name', label: '名称', maxlength: 30 },
      { prop: 'description', label: '描述', type: 'textarea', maxlength: 200 },
      { prop: 'iconUrl', label: '图标', type: 'image' },
      { prop: 'linkUrl', label: '跳转链接', placeholder: '页面路由或外部 URL，可留空' },
      sortField,
      statusField
    ],
    rules: {
      name: [{ required: true, message: '请输入名称', trigger: 'blur' }]
    },
    defaults: { sort: 0, status: '1' },
    api: {
      list: listJobService,
      get: getJobService,
      add: addJobService,
      update: updateJobService,
      del: delJobService,
      changeStatus: changeJobServiceStatus
    }
  }
];

const activeTab = ref('banner');
const currentConfig = computed(() => tabConfigs.find((c) => c.key === activeTab.value) || tabConfigs[0]);

const loading = ref(false);
const submitting = ref(false);
const total = ref(0);
const tableData = ref<any[]>([]);
const selectedIds = ref<number[]>([]);
const dialogVisible = ref(false);
const isEdit = ref(false);
const queryFormRef = ref();
const formRef = ref();

// 查询参数：keyword 在请求时按当前 tab 的 keywordField 映射到 title 或 name
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  keyword: '',
  status: ''
});

const form = reactive<Record<string, any>>({});

const dialogTitle = computed(() => `${isEdit.value ? '编辑' : '新增'}${currentConfig.value.label}`);

// 组装列表请求参数：把通用 keyword 落到指定 tab 对应的实体字段。
function buildQuery(cfg = currentConfig.value) {
  const params: Record<string, any> = {
    pageNum: queryParams.pageNum,
    pageSize: queryParams.pageSize,
    status: queryParams.status || undefined
  };
  if (cfg.keywordField && queryParams.keyword) {
    params[cfg.keywordField] = queryParams.keyword;
  }
  return params;
}

function formatNoticeType(type: string) {
  return noticeTypeMap[type] || { label: type || '-', tagType: 'info' };
}

function formatNoticeTarget(type: string) {
  return noticeTargetMap[type] || { label: type || '-', tagType: 'info' };
}

// 行数据在 loadData 时会打上来源 tab；状态/批量操作必须按行来源取主键，不能只看当前激活 tab。
function getRowConfig(row: any) {
  return tabConfigs.find((c) => c.key === row?.[ROW_TAB_KEY]);
}

function getRowId(row: any, cfg = getRowConfig(row)) {
  return cfg ? row?.[cfg.idKey] : undefined;
}

function hasRowId(row: any, cfg = getRowConfig(row)) {
  const id = getRowId(row, cfg);
  return id !== null && id !== undefined && id !== '';
}

function canRenderStatusSwitch(row: any) {
  const cfg = getRowConfig(row);
  return !!cfg && cfg.key === activeTab.value && hasRowId(row, cfg);
}

function buildStatusSwitchKey(row: any) {
  const cfg = getRowConfig(row);
  return `${cfg?.key || activeTab.value}-${getRowId(row, cfg) || 'missing'}-${row?.status || ''}`;
}

function canRenderHomeVisibleSwitch(row: any) {
  const cfg = getRowConfig(row);
  return !!cfg && cfg.key === 'notice' && cfg.key === activeTab.value && hasRowId(row, cfg);
}

function buildHomeVisibleSwitchKey(row: any) {
  const cfg = getRowConfig(row);
  return `home-${cfg?.key || activeTab.value}-${getRowId(row, cfg) || 'missing'}-${row?.homeVisible || ''}`;
}

async function loadData() {
  // 冻结本次请求对应的 tab，避免切 tab 期间旧请求回包覆盖新 tab 表格。
  const cfg = currentConfig.value;
  loading.value = true;
  try {
    const res = await cfg.api.list(buildQuery(cfg));
    if (activeTab.value !== cfg.key) {
      return;
    }
    const list = unwrapList(res);
    tableData.value = list.rows.map((row) => ({
      ...row,
      // 行所属 tab 用于状态切换，避免异步切换时拿错主键字段造成后端“参数错误”。
      [ROW_TAB_KEY]: cfg.key
    }));
    total.value = list.total;
  } catch (e) {
    ElMessage.error('加载数据失败');
  } finally {
    loading.value = false;
  }
}

function handleQuery() {
  queryParams.pageNum = 1;
  loadData();
}

function resetQuery() {
  queryParams.keyword = '';
  queryParams.status = '';
  queryParams.pageNum = 1;
  loadData();
}

// 切 tab：清空查询/选择，重新拉数据
function handleTabChange() {
  queryParams.keyword = '';
  queryParams.status = '';
  queryParams.pageNum = 1;
  selectedIds.value = [];
  total.value = 0;
  tableData.value = [];
  loadData();
}

function handleSelectionChange(rows: any[]) {
  const idKey = currentConfig.value.idKey;
  selectedIds.value = rows.map((r) => r[idKey]).filter((id) => id !== null && id !== undefined && id !== '');
}

// 用当前 tab 的字段集 + 默认值重建表单（保证切 tab 后字段干净）
function buildEmptyForm() {
  const cfg = currentConfig.value;
  // 切换 tab 时先清空当前表单字段
  Object.keys(form).forEach((k) => delete form[k]);
  cfg.fields.forEach((f) => {
    form[f.prop] = '';
  });
  Object.assign(form, cfg.defaults);
}

function handleAdd() {
  isEdit.value = false;
  buildEmptyForm();
  dialogVisible.value = true;
}

async function handleEdit(row: any) {
  isEdit.value = true;
  buildEmptyForm();
  try {
    // 拉详情回填（含主键，update 时需要）
    const res = await currentConfig.value.api.get(row[currentConfig.value.idKey]);
    Object.assign(form, res.data || row);
  } catch (e) {
    Object.assign(form, row);
  }
  hydrateLegacyMediaFields();
  dialogVisible.value = true;
}

function resetForm() {
  formRef.value?.clearValidate();
}

async function submitForm() {
  await formRef.value?.validate();
  submitting.value = true;
  try {
    const cfg = currentConfig.value;
    const payload = buildSubmitPayload();
    if (isEdit.value) {
      await cfg.api.update(payload);
      ElMessage.success('修改成功');
    } else {
      await cfg.api.add(payload);
      ElMessage.success('新增成功');
    }
    dialogVisible.value = false;
    loadData();
  } catch (e) {
    ElMessage.error(isEdit.value ? '修改失败' : '新增失败');
  } finally {
    submitting.value = false;
  }
}

function isDirectUrlValue(value: any) {
  return typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/'));
}

// 历史内容可能只有 coverUrl，没有 coverOssId；编辑时用旧 URL 预览，提交时再拆回 coverUrl 兼容。
function hydrateLegacyMediaFields() {
  if ((activeTab.value === 'course' || activeTab.value === 'article') && !form.coverOssId && form.coverUrl) {
    form.coverOssId = form.coverUrl;
  }
}

function buildSubmitPayload() {
  const payload = { ...form };
  if ((activeTab.value === 'course' || activeTab.value === 'article') && isDirectUrlValue(payload.coverOssId)) {
    payload.coverUrl = payload.coverOssId;
    delete payload.coverOssId;
  }
  if (payload.coverOssId === '') delete payload.coverOssId;
  if (payload.videoOssId === '') delete payload.videoOssId;
  return payload;
}

function handleVideoUploaded(file: { fileSize?: number; contentType?: string }) {
  form.videoSize = file.fileSize;
  form.videoContentType = file.contentType || 'video/mp4';
}

// 上下架/显隐开关：调用对应 changeStatus，失败时回滚（重新拉表）
async function handleStatusChange(row: any, val: string) {
  const cfg = getRowConfig(row);
  const id = getRowId(row, cfg);
  if (!cfg || cfg.key !== activeTab.value || !hasRowId(row, cfg)) {
    loadData();
    return;
  }
  try {
    await cfg.api.changeStatus({ [cfg.idKey]: id, status: val });
    row.status = val;
    if (cfg.key === 'notice' && val === '0') {
      row.homeVisible = '0';
    }
    ElMessage.success('状态已更新');
  } catch (e) {
    ElMessage.error('状态更新失败');
    loadData();
  }
}

// 首页展示是公告独有状态：B 端只负责触发，最多 3 条由后端统一校验并返回明确错误。
async function handleHomeVisibleChange(row: any, val: string) {
  const cfg = getRowConfig(row);
  const id = getRowId(row, cfg);
  if (!cfg || cfg.key !== 'notice' || cfg.key !== activeTab.value || !cfg.api.changeHomeVisible || !hasRowId(row, cfg)) {
    loadData();
    return;
  }
  try {
    await cfg.api.changeHomeVisible({ noticeId: id, homeVisible: val });
    row.homeVisible = val;
    if (val === '1') {
      row.status = '1';
    }
    ElMessage.success('首页展示已更新');
  } catch (e) {
    loadData();
  }
}

// 删除：传 row 删单条；不传则批量删已选
async function handleDelete(row?: any) {
  const cfg = currentConfig.value;
  const ids: number[] = row ? [row[cfg.idKey]] : selectedIds.value;
  if (!ids.length) return;
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${ids.length} 条${cfg.label}吗？`, '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    });
    await cfg.api.del(ids);
    ElMessage.success('删除成功');
    loadData();
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error('删除失败');
    }
  }
}

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.mb-2 {
  margin-bottom: 12px;
}

.img-placeholder {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #c0c4cc;
  background: #f5f7fa;
  border-radius: 6px;
}

.tag-item {
  margin: 2px 4px 2px 0;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
}

.notice-home-tip {
  margin-top: 12px;
  padding: 10px 12px;
  color: #606266;
  background: #f5f9ff;
  border: 1px solid #d8e8ff;
  border-radius: 6px;
  font-size: 13px;
}

.cell-id {
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.notice-editor {
  width: 100%;
}

/* 主色贴近后台规范 #2b7fff */
:deep(.el-tabs__item.is-active) {
  color: #2b7fff;
}

:deep(.el-tabs__active-bar) {
  background-color: #2b7fff;
}
</style>
