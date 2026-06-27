<!--
  自定义 Excel 导出弹窗（可复用、配置化）
  - 职责：把「已按页面查询过滤好的扁平数据」按用户自定义规则导出成 xlsx / csv。
  - 一期(纯前端)能力：
      列配置：业务分组折叠 + 灰底分层、显隐/反选/全选、拖拽与↑↓排序、自定义列名(别名)、列宽自定义、
              字段 hover 说明 + 指标说明弹窗、无数据字段自动置灰、显示(全部/仅已勾选/仅未勾选)筛选。
      导出选项：按维度拆分多 Sheet + 二级分组筛选 + Sheet 命名预览 + 过多提示；
              高级过滤(关键字/数值区间/维度单选)；合计行(可选指标+自定义文字)；
              汇总目录页、千分位、自动筛选器、水印备注、手机号脱敏、xlsx/csv 切换。
              （注：冻结表头需 zip 后处理，社区版 SheetJS 不支持，暂不提供）
      预览：实时联动、模拟合计行、查看全部预览(分页)、空数据占位、统计信息。
      模板：本地多模板(我的模板) 保存/另存/删除/设默认；公共模板与后台异步导出为后端扩展点(见下)。
  - 后端扩展点(二期，未就绪时优雅降级，不报错)：
      公共模板：传入 :server-templates 即展示；onSaveTemplate/onAsyncExport 由父级注入处理器，缺省则提示「二期开放」。
  - 技术：动态 import xlsx(SheetJS) + file-saver，与本模块既有导出一致，不依赖后端。
-->
<template>
  <el-dialog v-model="visible" :title="title" :width="dialogWidth" top="5vh" append-to-body draggable class="custom-export-dialog" @open="handleOpen">
    <!-- 模板栏：我的模板(本地) + 公共模板(后端，可选) -->
    <div class="ce-template-bar">
      <span class="ce-tpl-label">模板</span>
      <el-select v-model="currentTemplate" clearable placeholder="选择已保存模板" style="width: 240px" @change="applyTemplate">
        <el-option-group v-if="myTemplateNames.length" label="我的模板">
          <el-option v-for="n in myTemplateNames" :key="'my-' + n" :label="defaultTemplate === n ? `${n}（默认）` : n" :value="n" />
        </el-option-group>
        <el-option-group label="公共模板">
          <el-option v-for="t in serverTemplates" :key="'pub-' + t.name" :label="t.name" :value="'pub::' + t.name" />
          <el-option v-if="!serverTemplates.length" label="暂无公共模板（管理员可预设）" value="" disabled />
        </el-option-group>
      </el-select>
      <el-button-group>
        <el-button :disabled="!currentTemplate || currentTemplate.startsWith('pub::')" @click="saveCurrentTemplate">保存</el-button>
        <el-button @click="saveAsTemplate">另存</el-button>
        <el-button :disabled="!currentTemplate" @click="deleteCurrentTemplate">删除</el-button>
        <el-button :disabled="!currentTemplate || currentTemplate.startsWith('pub::')" @click="setDefaultTemplate">设为默认</el-button>
      </el-button-group>
      <!-- 存为公共模板：管理员把当前配置沉淀为全员可选的公共模板 -->
      <el-button type="primary" plain @click="saveAsPublicTemplate">存为公共</el-button>
    </div>

    <div class="ce-layout" :style="{ width: bodyWidth }">
      <!-- 左：列配置 -->
      <div class="ce-cols">
        <div class="ce-section-head">
          <span>列配置</span>
          <div class="ce-col-actions">
            <el-select v-model="fieldFilter" size="small" style="width: 116px">
              <el-option label="全部字段" value="all" />
              <el-option label="仅已勾选" value="checked" />
              <el-option label="仅未勾选" value="unchecked" />
            </el-select>
            <el-tooltip content="勾选全部可导出字段" placement="top">
              <el-button link type="primary" @click="toggleAll(true)">全选</el-button>
            </el-tooltip>
            <el-tooltip content="取消所有勾选" placement="top">
              <el-button link @click="toggleAll(false)">全不选</el-button>
            </el-tooltip>
            <el-tooltip content="反转勾选状态：已选取消、未选选中" placement="top">
              <el-button link @click="invertSelection">反选</el-button>
            </el-tooltip>
            <el-tooltip content="恢复系统预设导出列，丢弃自定义排序/勾选/列名" placement="top">
              <el-button link type="warning" @click="resetTemplate">重置默认</el-button>
            </el-tooltip>
            <el-tooltip content="查看全部指标含义" placement="top">
              <el-button link :icon="QuestionFilled" @click="glossaryVisible = true" />
            </el-tooltip>
          </div>
        </div>
        <div class="ce-group-toolbar">
          <el-button link size="small" @click="setAllGroups(true)">展开全部</el-button>
          <el-button link size="small" @click="setAllGroups(false)">折叠全部</el-button>
          <span class="ce-sel-tip">
            <template v-if="selectedKeys.size > 1">已选 {{ selectedKeys.size }} 列，↑↓ 整块移动 ·</template>
            点行选中，Shift 连选 / Ctrl 多选
          </span>
        </div>

        <div class="ce-col-list">
          <div v-for="grp in displayGroups" :key="grp.key" class="ce-group">
            <!-- 分组标题：灰底分层 + 折叠 + 三态分组勾选 + 计数 -->
            <div class="ce-group-head" @click="toggleGroup(grp.key)">
              <el-icon class="ce-caret" :class="{ open: expandedGroups.has(grp.key) }"><CaretRight /></el-icon>
              <el-checkbox
                :model-value="groupCheckState(grp).all"
                :indeterminate="groupCheckState(grp).some && !groupCheckState(grp).all"
                @change="(v: any) => toggleGroupAll(grp, v)"
                @click.stop
              />
              <span class="ce-group-title">{{ grp.label }}</span>
              <span class="ce-group-count">{{ groupCheckState(grp).checked }}/{{ grp.items.length }}</span>
            </div>
            <div v-show="expandedGroups.has(grp.key)" class="ce-group-body">
              <div
                v-for="col in grp.items"
                :key="col.key"
                class="ce-col-item"
                :class="{
                  'is-dragging': dragKey === col.key,
                  'is-checked': col.visible,
                  'is-hover': hoverKey === col.key,
                  'is-selected': selectedKeys.has(col.key)
                }"
                draggable="true"
                @click="onRowClick(col.key, $event)"
                @dragstart="onDragStart(col.key)"
                @dragover.prevent="onDragOver(col.key)"
                @dragend="onDragEnd"
              >
                <el-icon class="ce-drag-handle" title="拖拽排序"><Rank /></el-icon>
                <el-tooltip :disabled="!disabledReason(col.key)" :content="disabledReason(col.key)" placement="top">
                  <el-checkbox v-model="col.visible" :disabled="!!disabledReason(col.key)" />
                </el-tooltip>
                <el-tooltip :disabled="!hintOf(col.key)" :content="hintOf(col.key)" placement="top">
                  <span class="ce-col-key">{{ defaultLabelOf(col.key) }}</span>
                </el-tooltip>
                <el-input v-model="col.label" size="small" class="ce-col-label" :placeholder="defaultLabelOf(col.key)" title="自定义导出表头" />
                <el-input-number
                  v-model="col.width"
                  size="small"
                  :min="0"
                  :max="80"
                  :step="2"
                  controls-position="right"
                  class="ce-col-width"
                  placeholder="自适应"
                  title="导出列宽(字符数)，留空自适应"
                />
                <div class="ce-col-move">
                  <el-button link :disabled="!canMoveRow(col.key, -1)" title="上移(多选时整块移动)" @click.stop="onMoveRow(col.key, -1)"
                    ><el-icon><Top /></el-icon
                  ></el-button>
                  <el-button link :disabled="!canMoveRow(col.key, 1)" title="下移(多选时整块移动)" @click.stop="onMoveRow(col.key, 1)"
                    ><el-icon><Bottom /></el-icon
                  ></el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右：导出选项（按功能分 5 个模块，模块间分割线分层，减少堆砌） -->
      <div class="ce-options">
        <div class="ce-section-head"><span>导出选项</span></div>
        <el-form label-width="92px" class="ce-form" size="small">
          <!-- 模块1：文件拆分设置 -->
          <div class="ce-module">
            <div class="ce-module-title">文件拆分设置</div>
            <el-form-item label="拆分 Sheet">
              <el-select v-model="splitBy" style="width: 100%" @change="handleSplitChange">
                <el-option label="不拆分（单表）" value="none" />
                <el-option v-for="opt in splitOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-select>
            </el-form-item>
            <el-form-item v-if="splitBy !== 'none'" label="包含分组">
              <el-select v-model="selectedGroups" multiple collapse-tags collapse-tags-tooltip placeholder="默认全部分组" style="width: 100%">
                <el-option v-for="g in groupValues" :key="g" :label="`${g}（${groupCountMap[g] || 0}）`" :value="g" />
              </el-select>
            </el-form-item>
            <el-form-item v-if="splitBy !== 'none'" label=" ">
              <div class="ce-split-hint">
                将生成：{{ sheetNamePreview }}
                <span v-if="sheetPlan.length > 20" class="ce-warn">· 拆分维度过多({{ sheetPlan.length }})会生成大量工作表，建议缩小筛选范围</span>
              </div>
            </el-form-item>
            <el-form-item label="汇总目录页">
              <el-tooltip content="多 Sheet 时，第一个工作表生成目录，便于切换" placement="top">
                <el-checkbox v-model="includeSummary" :disabled="splitBy === 'none'">多 Sheet 时生成目录页</el-checkbox>
              </el-tooltip>
            </el-form-item>
          </div>

          <!-- 模块2：数据过滤（高级过滤折叠面板） -->
          <div class="ce-module">
            <div class="ce-module-title">数据过滤</div>
            <el-form-item label="高级过滤">
              <el-button link type="primary" size="small" @click="advancedOpen = !advancedOpen">
                {{ advancedOpen ? '收起' : '展开' }}高级过滤
                <el-tag v-if="activeFilterCount" size="small" type="warning" effect="plain" style="margin-left: 6px">{{ activeFilterCount }}</el-tag>
              </el-button>
            </el-form-item>
            <template v-if="advancedOpen">
              <el-form-item label="关键字">
                <el-input v-model="keyword" clearable placeholder="在可见文本列中模糊匹配" style="width: 100%" />
              </el-form-item>
              <el-form-item label="数值区间">
                <div class="ce-range-row">
                  <el-select v-model="numFilter.key" clearable placeholder="选数值列" style="width: 130px">
                    <el-option v-for="c in numericCols" :key="c.key" :label="c.label || defaultLabelOf(c.key)" :value="c.key" />
                  </el-select>
                  <el-input-number v-model="numFilter.min" :controls="false" placeholder="≥ 最小" class="ce-range-num" />
                  <span>~</span>
                  <el-input-number v-model="numFilter.max" :controls="false" placeholder="≤ 最大" class="ce-range-num" />
                </div>
              </el-form-item>
              <el-form-item v-if="splitOptions.length" label="维度筛选">
                <div class="ce-range-row">
                  <el-select v-model="dimFilter.value" clearable placeholder="选维度" style="width: 130px" @change="dimFilter.val = ''">
                    <el-option v-for="o in splitOptions" :key="o.value" :label="o.label" :value="o.value" />
                  </el-select>
                  <el-select v-model="dimFilter.val" clearable filterable placeholder="选取值" style="width: 150px" :disabled="!dimFilter.value">
                    <el-option v-for="v in dimFilterValues" :key="v" :label="v" :value="v" />
                  </el-select>
                </div>
              </el-form-item>
            </template>
          </div>

          <!-- 模块3：报表合计设置 -->
          <div class="ce-module">
            <div class="ce-module-title">报表合计设置</div>
            <el-form-item label="合计行">
              <el-checkbox v-model="includeTotals">各表底部合计行</el-checkbox>
            </el-form-item>
            <template v-if="includeTotals">
              <el-form-item label="求和指标">
                <el-select v-model="totalKeys" multiple collapse-tags collapse-tags-tooltip placeholder="默认全部数值列" style="width: 100%">
                  <el-option v-for="c in numericCols" :key="c.key" :label="c.label || defaultLabelOf(c.key)" :value="c.key" />
                </el-select>
              </el-form-item>
              <el-form-item label="合计文字">
                <el-input v-model="totalLabel" placeholder="合计" maxlength="10" style="width: 140px" />
              </el-form-item>
            </template>
          </div>

          <!-- 模块4：附加格式开关 -->
          <div class="ce-module">
            <div class="ce-module-title">附加格式开关</div>
            <el-form-item label="报表大标题">
              <el-input v-model="reportTitle" clearable maxlength="50" placeholder="如 2026年5月推广绩效汇总，留空不加" style="width: 100%" />
              <div class="ce-split-hint">在每个数据表顶部插入一行合并大标题（跨所有导出列）</div>
            </el-form-item>
            <el-form-item label="格式开关">
              <div class="ce-extra-grid">
                <el-checkbox v-model="thousands">数字千分位</el-checkbox>
                <el-tooltip content="表头自带 Excel 筛选下拉按钮" placement="top">
                  <el-checkbox v-model="autoFilter">自动筛选器</el-checkbox>
                </el-tooltip>
                <el-checkbox v-model="watermarkOn">导出时间/操作人备注</el-checkbox>
                <el-tooltip v-if="sensitiveKeys.length" content="对手机号等敏感字段做 176****7382 脱敏" placement="top">
                  <el-checkbox v-model="desensitize">敏感字段脱敏</el-checkbox>
                </el-tooltip>
              </div>
            </el-form-item>
            <el-form-item v-if="watermarkOn" label="备注文字">
              <el-input v-model="watermarkText" placeholder="可留空，仅写时间/操作人" maxlength="60" style="width: 100%" />
            </el-form-item>
          </div>

          <!-- 模块5：导出格式 -->
          <div class="ce-module">
            <div class="ce-module-title">导出格式</div>
            <el-form-item label="文件格式">
              <el-radio-group v-model="exportFormat">
                <el-radio-button value="xlsx">Excel(.xlsx)</el-radio-button>
                <el-radio-button value="csv">CSV(.csv)</el-radio-button>
              </el-radio-group>
            </el-form-item>
          </div>
        </el-form>
      </div>
    </div>

    <!-- 预览（全宽） -->
    <div class="ce-preview-block" :style="{ width: bodyWidth }">
      <div class="ce-section-head ce-preview-head">
        <span>预览</span>
        <div class="ce-preview-stats">
          <el-tag size="small" effect="plain">共筛选 {{ filteredRows.length }} 条</el-tag>
          <el-tag size="small" effect="plain" type="success">勾选 {{ visibleCols.length }} 列</el-tag>
          <el-tag size="small" effect="plain" type="warning">{{ exportFormat === 'csv' ? '单文件(CSV)' : `拆分 ${sheetPlan.length} Sheet` }}</el-tag>
          <el-button link type="primary" size="small" :disabled="!filteredRows.length" @click="fullPreviewVisible = true">查看全部预览</el-button>
        </div>
      </div>
      <div class="ce-preview">
        <!-- 大标题预览：与导出顶部合并标题一致 -->
        <div v-if="reportTitle.trim() && visibleCols.length && filteredRows.length" class="ce-report-title">{{ reportTitle.trim() }}</div>
        <el-table v-if="visibleCols.length && filteredRows.length" :data="previewRows" border size="small" max-height="300">
          <el-table-column v-for="col in visibleCols" :key="col.key" :align="col.numeric ? 'right' : 'left'" min-width="110" show-overflow-tooltip>
            <template #header>
              <span class="ce-pv-th" @mouseenter="hoverKey = col.key" @mouseleave="hoverKey = ''">{{ col.label || defaultLabelOf(col.key) }}</span>
            </template>
            <template #default="{ row }">{{ cellDisplay(row, col) }}</template>
          </el-table-column>
        </el-table>
        <el-empty v-else-if="!visibleCols.length" description="请至少勾选一列" :image-size="60" />
        <el-empty v-else description="暂无匹配数据，请调整过滤条件" :image-size="60" />
        <!-- 模拟合计行 -->
        <div v-if="includeTotals && visibleCols.length && filteredRows.length" class="ce-preview-total">
          <span v-for="col in visibleCols" :key="col.key" :style="{ textAlign: col.numeric ? 'right' : 'left' }">
            {{ totalCellText(col) }}
          </span>
        </div>
      </div>
    </div>

    <template #footer>
      <span class="ce-footer-tip">
        {{ exportFormat === 'csv' ? 'CSV 单文件导出' : `共 ${sheetPlan.length} 个工作表将生成` }}
      </span>
      <el-button @click="visible = false">取消</el-button>
      <el-tooltip :disabled="canExport" content="请至少选择一列导出字段" placement="top">
        <span>
          <el-button type="primary" :loading="exporting" :disabled="!canExport" @click="handleExportClick">导出</el-button>
        </span>
      </el-tooltip>
    </template>

    <!-- 指标说明弹窗 -->
    <el-dialog v-model="glossaryVisible" title="指标说明" width="520px" append-to-body>
      <el-descriptions :column="1" border size="small">
        <el-descriptions-item v-for="c in columns" :key="c.key" :label="c.label">
          {{ hintOf(c.key) || '—' }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- 查看全部预览（分页） -->
    <el-dialog v-model="fullPreviewVisible" title="全部预览" width="80%" top="6vh" append-to-body>
      <el-table :data="fullPreviewPage" border size="small" max-height="60vh">
        <el-table-column type="index" label="#" width="55" :index="(i: number) => (fullPreviewPageNum - 1) * fullPreviewPageSize + i + 1" />
        <el-table-column
          v-for="col in visibleCols"
          :key="col.key"
          :label="col.label || defaultLabelOf(col.key)"
          :align="col.numeric ? 'right' : 'left'"
          min-width="110"
          show-overflow-tooltip
        >
          <template #default="{ row }">{{ cellDisplay(row, col) }}</template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="fullPreviewPageNum"
        :page-size="fullPreviewPageSize"
        :total="filteredRows.length"
        layout="total, prev, pager, next"
        small
        style="margin-top: 10px; justify-content: flex-end"
      />
    </el-dialog>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Rank, Top, Bottom, CaretRight, QuestionFilled } from '@element-plus/icons-vue';
import { useUserStore } from '@/store/modules/user';

interface ExportColumn {
  key: string;
  label: string;
  numeric?: boolean;
}
interface SplitOption {
  value: string;
  label: string;
  getGroup: (row: Record<string, any>) => string;
}
interface ColumnGroup {
  key: string;
  label: string;
  columnKeys: string[];
}
interface ServerTemplate {
  name: string;
  config: any;
}
// 列运行时状态：可见/自定义列名/列宽
interface ColState {
  key: string;
  label: string;
  visible: boolean;
  numeric?: boolean;
  width?: number;
}

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    columns: ExportColumn[];
    rows: Record<string, any>[];
    splitOptions?: SplitOption[];
    storageKey: string;
    fileName?: string;
    title?: string;
    groups?: ColumnGroup[];
    hints?: Record<string, string>;
    sensitiveKeys?: string[];
    disabledKeys?: Record<string, string>;
    serverTemplates?: ServerTemplate[];
  }>(),
  {
    splitOptions: () => [],
    fileName: '导出数据',
    title: '自定义导出',
    groups: () => [],
    hints: () => ({}),
    sensitiveKeys: () => [],
    disabledKeys: () => ({}),
    serverTemplates: () => []
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void;
  // 存为公共模板：把当前配置快照交父级落库（父级知道 scene=storageKey）
  (e: 'save-public', payload: { name: string; config: any }): void;
  // 删除公共模板：按名称交父级处理（父级从已加载列表解析 templateId）
  (e: 'delete-public', name: string): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v)
});

const userStore = useUserStore();
const STORAGE_PREFIX = 'promoter-custom-export:';
const storageId = computed(() => STORAGE_PREFIX + props.storageKey);

// ===== 配置状态 =====
const colState = ref<ColState[]>([]);
const splitBy = ref('none');
const selectedGroups = ref<string[]>([]);
const keyword = ref('');
const numFilter = reactive<{ key: string; min?: number; max?: number }>({ key: '', min: undefined, max: undefined });
const dimFilter = reactive<{ value: string; val: string }>({ value: '', val: '' });
const advancedOpen = ref(false);
const includeTotals = ref(true);
const totalKeys = ref<string[]>([]);
const totalLabel = ref('合计');
const includeSummary = ref(true);
// 报表大标题：非空时在每个数据表顶部插入一行合并大标题(跨所有可见列)
const reportTitle = ref('');
const thousands = ref(false);
const autoFilter = ref(false);
const watermarkOn = ref(false);
const watermarkText = ref('');
const desensitize = ref(true);
const exportFormat = ref<'xlsx' | 'csv'>('xlsx');
const exporting = ref(false);

// ===== 交互状态 =====
const fieldFilter = ref<'all' | 'checked' | 'unchecked'>('all');
const expandedGroups = ref<Set<string>>(new Set());
const dragKey = ref('');
const hoverKey = ref('');
// 多选(批量上下移动)：选中列 key 集合 + Shift 连选锚点
const selectedKeys = ref<Set<string>>(new Set());
const selectionAnchor = ref('');
const glossaryVisible = ref(false);
const fullPreviewVisible = ref(false);
const fullPreviewPageNum = ref(1);
const fullPreviewPageSize = 20;

// ===== 模板状态（本地多模板） =====
const currentTemplate = ref('');
const defaultTemplate = ref('');
const myTemplates = ref<Record<string, any>>({});
const myTemplateNames = computed(() => Object.keys(myTemplates.value));

// 弹窗宽度：字段多时给更宽（可在弹窗右下角横向拖拽进一步拉伸，见 .custom-export-dialog 样式）
const dialogWidth = computed(() => (props.columns.length > 12 ? '1280px' : '1120px'));
const bodyWidth = '100%';

function defaultLabelOf(key: string) {
  return props.columns.find((c) => c.key === key)?.label || key;
}
function hintOf(key: string) {
  return props.hints?.[key] || '';
}
// 字段禁用原因：父级显式传入(无权限) 或 自动检测(当前筛选下整列无数据)
function disabledReason(key: string): string {
  if (props.disabledKeys?.[key]) return props.disabledKeys[key];
  return '';
}

function buildDefaultColState(): ColState[] {
  // 按分组顺序排列，保证「分组内连续」；不在任何分组的列归到末尾
  const inGroup = new Set<string>();
  const ordered: ExportColumn[] = [];
  for (const g of props.groups || []) {
    for (const k of g.columnKeys) {
      const c = props.columns.find((x) => x.key === k);
      if (c && !inGroup.has(k)) {
        ordered.push(c);
        inGroup.add(k);
      }
    }
  }
  for (const c of props.columns) if (!inGroup.has(c.key)) ordered.push(c);
  return ordered.map((c) => ({ key: c.key, label: c.label, visible: true, numeric: c.numeric, width: undefined }));
}

// 列所属分组 key（用于约束拖拽/上下移动只在组内）
function groupKeyOf(colKey: string): string {
  for (const g of props.groups || []) if (g.columnKeys.includes(colKey)) return g.key;
  return '__ungrouped__';
}

// ===== 配置快照 / 应用 =====
function snapshot() {
  return {
    cols: colState.value.map((c) => ({ key: c.key, label: c.label, visible: c.visible, width: c.width })),
    splitBy: splitBy.value,
    includeTotals: includeTotals.value,
    totalKeys: totalKeys.value,
    totalLabel: totalLabel.value,
    includeSummary: includeSummary.value,
    reportTitle: reportTitle.value,
    thousands: thousands.value,
    autoFilter: autoFilter.value,
    watermarkOn: watermarkOn.value,
    watermarkText: watermarkText.value,
    desensitize: desensitize.value,
    exportFormat: exportFormat.value
  };
}

function applyConfig(cfg: any) {
  const def = buildDefaultColState();
  let cols = def;
  if (cfg && Array.isArray(cfg.cols)) {
    const byKey = new Map(def.map((c) => [c.key, c]));
    const merged: ColState[] = [];
    for (const s of cfg.cols) {
      const d = byKey.get(s.key);
      if (d) {
        merged.push({ key: d.key, label: s.label ?? d.label, visible: s.visible !== false, numeric: d.numeric, width: s.width });
        byKey.delete(s.key);
      }
    }
    for (const d of byKey.values()) merged.push(d); // 新列追加
    if (merged.length) cols = merged;
  }
  colState.value = cols;
  if (cfg) {
    splitBy.value = (props.splitOptions || []).some((o) => o.value === cfg.splitBy) ? cfg.splitBy : 'none';
    includeTotals.value = cfg.includeTotals !== false;
    totalKeys.value = Array.isArray(cfg.totalKeys) ? cfg.totalKeys : [];
    totalLabel.value = cfg.totalLabel || '合计';
    includeSummary.value = cfg.includeSummary !== false;
    reportTitle.value = cfg.reportTitle || '';
    thousands.value = !!cfg.thousands;
    autoFilter.value = !!cfg.autoFilter;
    watermarkOn.value = !!cfg.watermarkOn;
    watermarkText.value = cfg.watermarkText || '';
    desensitize.value = cfg.desensitize !== false;
    exportFormat.value = cfg.exportFormat === 'csv' ? 'csv' : 'xlsx';
  }
}

// ===== 本地存储：{ templates, default, last } =====
function readStore(): { templates: Record<string, any>; default: string; last: any } {
  try {
    const raw = localStorage.getItem(storageId.value);
    if (raw) {
      const o = JSON.parse(raw);
      return { templates: o.templates || {}, default: o.default || '', last: o.last || null };
    }
  } catch {
    /* ignore */
  }
  return { templates: {}, default: '', last: null };
}
function writeStore(patch: Partial<{ templates: Record<string, any>; default: string; last: any }>) {
  try {
    const cur = readStore();
    localStorage.setItem(storageId.value, JSON.stringify({ ...cur, ...patch }));
  } catch {
    /* localStorage 不可用时静默忽略 */
  }
}

function loadOnOpen() {
  const store = readStore();
  myTemplates.value = store.templates;
  defaultTemplate.value = store.default;
  if (store.default && store.templates[store.default]) {
    currentTemplate.value = store.default;
    applyConfig(store.templates[store.default]);
  } else {
    currentTemplate.value = '';
    applyConfig(store.last); // last 为空则等于默认
  }
  // 默认展开全部分组
  expandedGroups.value = new Set(displayGroupsRaw().map((g) => g.key));
}

// 模板操作
function applyTemplate(name: string) {
  if (!name) return;
  if (name.startsWith('pub::')) {
    const t = props.serverTemplates.find((x) => 'pub::' + x.name === name);
    if (t) applyConfig(t.config);
    return;
  }
  if (myTemplates.value[name]) applyConfig(myTemplates.value[name]);
}
function saveCurrentTemplate() {
  if (!currentTemplate.value || currentTemplate.value.startsWith('pub::')) return;
  myTemplates.value[currentTemplate.value] = snapshot();
  writeStore({ templates: myTemplates.value });
  ElMessage.success('模板已保存');
}
async function saveAsTemplate() {
  try {
    const { value } = await ElMessageBox.prompt('输入模板名称', '另存模板', { inputPattern: /\S+/, inputErrorMessage: '名称不能为空' });
    const name = value.trim();
    myTemplates.value = { ...myTemplates.value, [name]: snapshot() };
    currentTemplate.value = name;
    writeStore({ templates: myTemplates.value });
    ElMessage.success('模板已保存');
  } catch {
    /* 取消 */
  }
}
async function deleteCurrentTemplate() {
  if (!currentTemplate.value) return;
  // 公共模板：交父级走后端删除
  if (currentTemplate.value.startsWith('pub::')) {
    const pubName = currentTemplate.value.slice(5);
    try {
      await ElMessageBox.confirm(`确认删除公共模板「${pubName}」？该操作影响全员。`, '删除公共模板', { type: 'warning' });
      emit('delete-public', pubName);
      currentTemplate.value = '';
    } catch {
      /* 取消 */
    }
    return;
  }
  const name = currentTemplate.value;
  await ElMessageBox.confirm(`确认删除模板「${name}」？`, '删除模板', { type: 'warning' });
  const next = { ...myTemplates.value };
  delete next[name];
  myTemplates.value = next;
  if (defaultTemplate.value === name) defaultTemplate.value = '';
  currentTemplate.value = '';
  writeStore({ templates: myTemplates.value, default: defaultTemplate.value });
  ElMessage.success('已删除');
}
function setDefaultTemplate() {
  if (!currentTemplate.value || currentTemplate.value.startsWith('pub::')) return;
  defaultTemplate.value = currentTemplate.value;
  writeStore({ default: defaultTemplate.value });
  ElMessage.success(`已将「${currentTemplate.value}」设为默认`);
}
// 存为公共模板：输入名称后把当前配置快照交父级落库
async function saveAsPublicTemplate() {
  try {
    const { value } = await ElMessageBox.prompt('输入公共模板名称（全员可见）', '存为公共模板', {
      inputPattern: /\S+/,
      inputErrorMessage: '名称不能为空'
    });
    emit('save-public', { name: value.trim(), config: snapshot() });
  } catch {
    /* 取消 */
  }
}

async function resetTemplate() {
  await ElMessageBox.confirm('重置将清空当前所有自定义列配置（勾选/排序/列名/列宽），是否继续？', '重置默认', { type: 'warning' });
  applyConfig(null);
  splitBy.value = 'none';
  selectedGroups.value = [];
  keyword.value = '';
  numFilter.key = '';
  numFilter.min = undefined;
  numFilter.max = undefined;
  dimFilter.value = '';
  dimFilter.val = '';
  includeTotals.value = true;
  totalKeys.value = [];
  totalLabel.value = '合计';
  includeSummary.value = true;
  reportTitle.value = '';
  thousands.value = false;
  autoFilter.value = false;
  watermarkOn.value = false;
  watermarkText.value = '';
  exportFormat.value = 'xlsx';
  currentTemplate.value = '';
}

// ===== 列勾选/排序 =====
function toggleAll(v: boolean) {
  colState.value.forEach((c) => {
    if (!disabledReason(c.key)) c.visible = v;
  });
}
function invertSelection() {
  colState.value.forEach((c) => {
    if (!disabledReason(c.key)) c.visible = !c.visible;
  });
}
// 组内相邻交换，保证「分组连续」不被破坏
function indexOfKey(key: string) {
  return colState.value.findIndex((c) => c.key === key);
}
function canMove(key: string, delta: number) {
  const i = indexOfKey(key);
  const t = i + delta;
  if (t < 0 || t >= colState.value.length) return false;
  return groupKeyOf(colState.value[t].key) === groupKeyOf(key);
}
function move(key: string, delta: number) {
  if (!canMove(key, delta)) return;
  const i = indexOfKey(key);
  const list = colState.value.slice();
  const [item] = list.splice(i, 1);
  list.splice(i + delta, 0, item);
  colState.value = list;
}
function onDragStart(key: string) {
  dragKey.value = key;
}
function onDragOver(overKey: string) {
  if (!dragKey.value || dragKey.value === overKey) return;
  if (groupKeyOf(dragKey.value) !== groupKeyOf(overKey)) return; // 仅组内拖拽
  const from = indexOfKey(dragKey.value);
  const to = indexOfKey(overKey);
  const list = colState.value.slice();
  const [item] = list.splice(from, 1);
  list.splice(to, 0, item);
  colState.value = list;
}
function onDragEnd() {
  dragKey.value = '';
}

// ===== 多选 + 整块上下移动（Shift 连选 / Ctrl 多选）=====
// 点行选中；按住 Shift 在同组内连选区间；Ctrl/Cmd 切换单个；普通点击单选。
// 点在勾选框/输入框/数字框/按钮等交互控件上时不触发选中。
function onRowClick(key: string, e: MouseEvent) {
  const el = e.target as HTMLElement;
  if (el.closest('.el-checkbox, .el-input, .el-input-number, .el-button')) return;
  if (e.shiftKey && selectionAnchor.value && groupKeyOf(selectionAnchor.value) === groupKeyOf(key)) {
    // 同组内按当前显示顺序连选 anchor..key
    const items = displayGroupsRaw().find((g) => g.items.some((c) => c.key === key))?.items || [];
    const a = items.findIndex((c) => c.key === selectionAnchor.value);
    const b = items.findIndex((c) => c.key === key);
    if (a > -1 && b > -1) {
      const [lo, hi] = a < b ? [a, b] : [b, a];
      selectedKeys.value = new Set(items.slice(lo, hi + 1).map((c) => c.key));
    }
  } else if (e.ctrlKey || e.metaKey) {
    const s = new Set(selectedKeys.value);
    s.has(key) ? s.delete(key) : s.add(key);
    selectedKeys.value = s;
    selectionAnchor.value = key;
  } else {
    selectedKeys.value = new Set([key]);
    selectionAnchor.value = key;
  }
}
// 整块移动：把所有选中项在组内整体上/下移一格（处理非连续选择，保持相对顺序，遇组边界/已选邻居停）
function moveSelected(delta: number) {
  const list = colState.value.slice();
  const order = delta < 0 ? [...list.keys()] : [...list.keys()].reverse();
  for (const i of order) {
    const cur = list[i];
    if (!selectedKeys.value.has(cur.key)) continue;
    const t = i + delta;
    if (t < 0 || t >= list.length) continue;
    const neighbor = list[t];
    if (selectedKeys.value.has(neighbor.key)) continue; // 邻居也在选中块内，跳过
    if (groupKeyOf(neighbor.key) !== groupKeyOf(cur.key)) continue; // 不跨组
    [list[i], list[t]] = [list[t], list[i]];
  }
  colState.value = list;
}
// 选中块能否整体移动：至少有一个选中项的相邻位同组且非选中
function canMoveSelected(delta: number) {
  return colState.value.some((c, i) => {
    if (!selectedKeys.value.has(c.key)) return false;
    const t = i + delta;
    if (t < 0 || t >= colState.value.length) return false;
    const nb = colState.value[t];
    return !selectedKeys.value.has(nb.key) && groupKeyOf(nb.key) === groupKeyOf(c.key);
  });
}
// 行内 ↑↓：该行属于多选块则整块移动，否则单行移动
function onMoveRow(key: string, delta: number) {
  if (selectedKeys.value.size > 1 && selectedKeys.value.has(key)) moveSelected(delta);
  else move(key, delta);
}
function canMoveRow(key: string, delta: number) {
  if (selectedKeys.value.size > 1 && selectedKeys.value.has(key)) return canMoveSelected(delta);
  return canMove(key, delta);
}

// ===== 分组显示 =====
function displayGroupsRaw() {
  const groups = props.groups || [];
  const result: { key: string; label: string; items: ColState[] }[] = [];
  if (!groups.length) {
    result.push({ key: '__all__', label: '全部字段', items: colState.value.slice() });
    return result;
  }
  for (const g of groups) {
    const items = colState.value.filter((c) => g.columnKeys.includes(c.key));
    if (items.length) result.push({ key: g.key, label: g.label, items });
  }
  const ungrouped = colState.value.filter((c) => groupKeyOf(c.key) === '__ungrouped__');
  if (ungrouped.length) result.push({ key: '__ungrouped__', label: '其他', items: ungrouped });
  return result;
}
// 叠加「显示筛选(全部/仅已勾选/仅未勾选)」
const displayGroups = computed(() => {
  const raw = displayGroupsRaw();
  if (fieldFilter.value === 'all') return raw;
  const want = fieldFilter.value === 'checked';
  return raw.map((g) => ({ ...g, items: g.items.filter((c) => c.visible === want) })).filter((g) => g.items.length);
});
function toggleGroup(key: string) {
  const s = new Set(expandedGroups.value);
  s.has(key) ? s.delete(key) : s.add(key);
  expandedGroups.value = s;
}
function setAllGroups(open: boolean) {
  expandedGroups.value = open ? new Set(displayGroupsRaw().map((g) => g.key)) : new Set();
}
function groupCheckState(grp: { items: ColState[] }) {
  const checkable = grp.items.filter((c) => !disabledReason(c.key));
  const checked = checkable.filter((c) => c.visible).length;
  return { checked, all: checkable.length > 0 && checked === checkable.length, some: checked > 0 };
}
function toggleGroupAll(grp: { items: ColState[] }, v: boolean) {
  grp.items.forEach((c) => {
    if (!disabledReason(c.key)) c.visible = v;
  });
}

// ===== 可见列 / 数值列 =====
const visibleCols = computed(() => colState.value.filter((c) => c.visible && !disabledReason(c.key)));
const numericCols = computed(() => colState.value.filter((c) => c.numeric));

// ===== 取值 / 脱敏 =====
function maskPhone(v: string) {
  const s = String(v);
  return s.length >= 7 ? s.replace(/(\d{3})\d+(\d{4})/, '$1****$2') : s;
}
function cellRaw(row: Record<string, any>, col: ColState) {
  const v = row[col.key];
  if (col.numeric) return Number(v || 0);
  if (desensitize.value && props.sensitiveKeys.includes(col.key) && v) return maskPhone(v);
  return v === undefined || v === null || v === '' ? '-' : v;
}
function cellDisplay(row: Record<string, any>, col: ColState) {
  const v = cellRaw(row, col);
  if (col.numeric && thousands.value) return Number(v).toLocaleString('en-US');
  return String(v);
}

// ===== 过滤 =====
const keywordFilteredRows = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  if (!kw) return props.rows;
  const textCols = visibleCols.value.filter((c) => !c.numeric);
  return props.rows.filter((row) =>
    textCols.some((c) =>
      String(row[c.key] ?? '')
        .toLowerCase()
        .includes(kw)
    )
  );
});
// 数值区间 + 维度单选
const advancedFilteredRows = computed(() => {
  let rows = keywordFilteredRows.value;
  if (numFilter.key && (numFilter.min != null || numFilter.max != null)) {
    rows = rows.filter((r) => {
      const n = Number(r[numFilter.key] || 0);
      if (numFilter.min != null && n < numFilter.min) return false;
      if (numFilter.max != null && n > numFilter.max) return false;
      return true;
    });
  }
  if (dimFilter.value && dimFilter.val) {
    const opt = (props.splitOptions || []).find((o) => o.value === dimFilter.value);
    if (opt) rows = rows.filter((r) => (opt.getGroup(r) || '未分组') === dimFilter.val);
  }
  return rows;
});
const activeFilterCount = computed(() => {
  let n = 0;
  if (keyword.value.trim()) n++;
  if (numFilter.key && (numFilter.min != null || numFilter.max != null)) n++;
  if (dimFilter.value && dimFilter.val) n++;
  return n;
});
const dimFilterValues = computed(() => {
  const opt = (props.splitOptions || []).find((o) => o.value === dimFilter.value);
  if (!opt) return [];
  const set = new Set<string>();
  for (const r of keywordFilteredRows.value) set.add(opt.getGroup(r) || '未分组');
  return [...set];
});

// ===== 拆分 Sheet =====
const activeSplit = computed(() => (props.splitOptions || []).find((o) => o.value === splitBy.value) || null);
const groupValues = computed(() => {
  if (!activeSplit.value) return [];
  const set = new Set<string>();
  for (const r of advancedFilteredRows.value) set.add(activeSplit.value.getGroup(r) || '未分组');
  return [...set];
});
const groupCountMap = computed(() => {
  const m: Record<string, number> = {};
  if (!activeSplit.value) return m;
  for (const r of advancedFilteredRows.value) {
    const g = activeSplit.value.getGroup(r) || '未分组';
    m[g] = (m[g] || 0) + 1;
  }
  return m;
});
// 最终行：拆分时仅保留勾选分组
const filteredRows = computed(() => {
  if (!activeSplit.value || !selectedGroups.value.length) return advancedFilteredRows.value;
  const set = new Set(selectedGroups.value);
  return advancedFilteredRows.value.filter((r) => set.has(activeSplit.value!.getGroup(r) || '未分组'));
});
const sheetPlan = computed<{ name: string; rows: Record<string, any>[] }[]>(() => {
  if (!activeSplit.value) return [{ name: '数据', rows: filteredRows.value }];
  const groups = selectedGroups.value.length ? selectedGroups.value : groupValues.value;
  return groups.map((g) => ({ name: g, rows: filteredRows.value.filter((r) => (activeSplit.value!.getGroup(r) || '未分组') === g) }));
});
const sheetNamePreview = computed(() => {
  const names = sheetPlan.value.map((s) => s.name);
  return names.length <= 6 ? names.join('、') : `${names.slice(0, 6).join('、')}… 等 ${names.length} 个`;
});
function handleSplitChange() {
  selectedGroups.value = [];
}

// ===== 预览 =====
const previewRows = computed(() => filteredRows.value.slice(0, 8));
const fullPreviewPage = computed(() => {
  const start = (fullPreviewPageNum.value - 1) * fullPreviewPageSize;
  return filteredRows.value.slice(start, start + fullPreviewPageSize);
});
// 求和的数值键：用户未指定则全部数值列
const effectiveTotalKeys = computed(() => (totalKeys.value.length ? totalKeys.value : numericCols.value.map((c) => c.key)));
function totalCellText(col: ColState) {
  if (col.numeric && effectiveTotalKeys.value.includes(col.key)) {
    const sum = filteredRows.value.reduce((s, r) => s + Number(r[col.key] || 0), 0);
    return thousands.value ? sum.toLocaleString('en-US') : String(sum);
  }
  // 第一列放合计文字
  return visibleCols.value[0]?.key === col.key ? totalLabel.value || '合计' : '';
}

const canExport = computed(() => visibleCols.value.length > 0 && filteredRows.value.length > 0);

// ===== 导出 =====
async function handleExportClick() {
  if (!canExport.value) return;
  // 大数据二次确认（异步导出为二期后端能力，缺省提示）
  if (filteredRows.value.length > 10000) {
    try {
      await ElMessageBox.confirm(
        `当前筛选数据共 ${filteredRows.value.length} 条，数据量较大。建议使用后台异步导出（二期，完成后站内信通知）。是否继续同步导出？`,
        '数据量较大',
        { confirmButtonText: '同步导出', cancelButtonText: '取消', type: 'warning' }
      );
    } catch {
      return;
    }
  }
  await doExport();
}

function sanitizeSheetName(name: string, used: Set<string>) {
  const base =
    (name || '未命名')
      .replace(/[\\/?*[\]:]/g, ' ')
      .trim()
      .slice(0, 28) || '未命名';
  let candidate = base;
  let i = 1;
  while (used.has(candidate)) candidate = `${base}_${i++}`.slice(0, 31);
  used.add(candidate);
  return candidate;
}
function buildAoa(rows: Record<string, any>[]) {
  const cols = visibleCols.value;
  const header = cols.map((c) => c.label || defaultLabelOf(c.key));
  const body = rows.map((row) => cols.map((c) => cellRaw(row, c)));
  const aoa: any[][] = [];
  // 报表大标题：置于首行（导出时合并跨列）；CSV 下即为首行文字
  if (reportTitle.value.trim()) aoa.push([reportTitle.value.trim()]);
  aoa.push(header, ...body);
  if (includeTotals.value) {
    const totalRow = cols.map((c, idx) => {
      if (c.numeric && effectiveTotalKeys.value.includes(c.key)) return rows.reduce((s, row) => s + Number(row[c.key] || 0), 0);
      return idx === 0 ? totalLabel.value || '合计' : '';
    });
    aoa.push(totalRow);
  }
  // 水印/备注行（时间/操作人/备注），追加在末尾，避免影响表头与筛选范围
  if (watermarkOn.value) {
    const oper = userStore.nickname || (userStore as any).name || '';
    const stamp = new Date().toLocaleString('zh-CN');
    aoa.push([]);
    aoa.push([`导出时间：${stamp}`]);
    if (oper) aoa.push([`操作人：${oper}`]);
    if (watermarkText.value.trim()) aoa.push([`备注：${watermarkText.value.trim()}`]);
  }
  return aoa;
}
function colWidths() {
  const cols = visibleCols.value;
  const charWidth = (v: any) => {
    const s = String(v ?? '');
    let w = 0;
    for (const ch of s) w += ch.charCodeAt(0) > 255 ? 2 : 1;
    return w;
  };
  return cols.map((c) => {
    if (c.width && c.width > 0) return { wch: c.width }; // 用户自定义列宽
    const headW = charWidth(c.label || defaultLabelOf(c.key));
    const bodyW = filteredRows.value.slice(0, 200).reduce((mx, r) => Math.max(mx, charWidth(cellRaw(r, c))), 0);
    return { wch: Math.min(40, Math.max(8, headW, bodyW)) };
  });
}

async function doExport() {
  exporting.value = true;
  try {
    const XLSX = await import('xlsx');
    const { saveAs } = await import('file-saver');
    const stamp = new Date().toISOString().slice(0, 10);

    // CSV：单文件，不拆 Sheet（含表头 + 合计），UTF-8 BOM 防中文乱码
    if (exportFormat.value === 'csv') {
      const aoa = buildAoa(filteredRows.value);
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      const csv = XLSX.utils.sheet_to_csv(ws);
      const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
      saveAs(blob, `${props.fileName}_${stamp}.csv`);
      persistLast();
      ElMessage.success('导出成功');
      visible.value = false;
      return;
    }

    const wb = XLSX.utils.book_new();
    const used = new Set<string>();
    // 千分位需要定位「数值列」的列下标
    const numericColIdx = visibleCols.value.map((c, i) => ({ i, numeric: !!c.numeric }));

    if (includeSummary.value && activeSplit.value) {
      const ws = XLSX.utils.aoa_to_sheet(buildSummaryAoa());
      XLSX.utils.book_append_sheet(wb, ws, sanitizeSheetName('汇总', used));
    }

    // 报表大标题占用的首行偏移：有标题时所有数据行下移 1 行
    const titleOffset = reportTitle.value.trim() ? 1 : 0;
    const lastColIdx = Math.max(0, visibleCols.value.length - 1);
    for (const sheet of sheetPlan.value) {
      if (!sheet.rows.length) continue;
      const aoa = buildAoa(sheet.rows);
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      ws['!cols'] = colWidths();
      const headerCount = 1;
      const dataLen = sheet.rows.length;
      // 大标题：合并首行跨所有列 + 加高行高 + 居中加粗(社区版可能忽略字体样式，合并/行高有效)
      if (titleOffset) {
        ws['!merges'] = [...(ws['!merges'] || []), { s: { r: 0, c: 0 }, e: { r: 0, c: lastColIdx } }];
        ws['!rows'] = [{ hpt: 26 }];
        const titleCell = ws['A1'];
        if (titleCell) titleCell.s = { font: { bold: true, sz: 14 }, alignment: { horizontal: 'center', vertical: 'center' } };
      }
      // 自动筛选器（仅覆盖表头+数据，不含标题/合计/水印行）
      if (autoFilter.value) {
        const endCol = XLSX.utils.encode_col(lastColIdx);
        ws['!autofilter'] = { ref: `A${titleOffset + 1}:${endCol}${titleOffset + headerCount + dataLen}` };
      }
      // 千分位数字格式（按标题偏移定位数据行）
      if (thousands.value) {
        const start = titleOffset + headerCount;
        for (let r = start; r < start + dataLen + (includeTotals.value ? 1 : 0); r++) {
          for (const nc of numericColIdx) {
            if (!nc.numeric) continue;
            const addr = XLSX.utils.encode_cell({ r, c: nc.i });
            const cell = ws[addr];
            if (cell && typeof cell.v === 'number') cell.z = '#,##0';
          }
        }
      }
      XLSX.utils.book_append_sheet(wb, ws, sanitizeSheetName(sheet.name, used));
    }

    if (!wb.SheetNames.length) {
      ElMessage.warning('没有可导出的数据');
      return;
    }
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array', cellStyles: true });
    const blob = new Blob([buffer], { type: 'application/octet-stream' });
    saveAs(blob, `${props.fileName}_${stamp}.xlsx`);
    persistLast();
    ElMessage.success('导出成功');
    visible.value = false;
  } catch (e) {
    console.error('自定义导出失败:', e);
    ElMessage.error('导出失败，请重试');
  } finally {
    exporting.value = false;
  }
}

function buildSummaryAoa() {
  const numCols = visibleCols.value.filter((c) => c.numeric);
  const header = ['工作表', '数据行数', ...numCols.map((c) => c.label || defaultLabelOf(c.key))];
  const body = sheetPlan.value.map((s) => [s.name, s.rows.length, ...numCols.map((c) => s.rows.reduce((sum, r) => sum + Number(r[c.key] || 0), 0))]);
  const grand = ['总计', filteredRows.value.length, ...numCols.map((c) => filteredRows.value.reduce((sum, r) => sum + Number(r[c.key] || 0), 0))];
  return [header, ...body, grand];
}

// 记住「上次配置」（未命名），下次打开自动复用
function persistLast() {
  writeStore({ last: snapshot() });
}

// ===== 生命周期 =====
function handleOpen() {
  loadOnOpen();
  fullPreviewPageNum.value = 1;
  // 一次性过滤条件每次打开清空（不随模板/上次配置记忆）
  selectedGroups.value = [];
  keyword.value = '';
  numFilter.key = '';
  numFilter.min = undefined;
  numFilter.max = undefined;
  dimFilter.value = '';
  dimFilter.val = '';
  fieldFilter.value = 'all';
  selectedKeys.value = new Set();
  selectionAnchor.value = '';
}
// 配置变化时即记忆 last（仅弹窗打开时）
watch(
  [
    colState,
    splitBy,
    includeTotals,
    totalKeys,
    totalLabel,
    includeSummary,
    reportTitle,
    thousands,
    autoFilter,
    watermarkOn,
    watermarkText,
    desensitize,
    exportFormat
  ],
  () => {
    if (visible.value) persistLast();
  },
  { deep: true }
);
// 切换显示筛选/拆分时，full preview 回到第 1 页
watch([filteredRows], () => {
  if (fullPreviewPageNum.value > Math.ceil(filteredRows.value.length / fullPreviewPageSize)) fullPreviewPageNum.value = 1;
});

onMounted(() => {
  if (props.modelValue) handleOpen();
});
</script>

<style scoped>
/* 弹窗：支持右下角横向/纵向拖拽拉伸，字段多时拉宽以同屏展示更多列与预览 */
.custom-export-dialog {
  resize: horizontal;
  overflow: auto;
  min-width: 900px;
  max-width: 98vw;
}
/* 统一操作反馈：输入框/下拉/数字框/按钮 hover 轻微阴影 + 平滑过渡 */
.custom-export-dialog :deep(.el-input__wrapper),
.custom-export-dialog :deep(.el-select__wrapper),
.custom-export-dialog :deep(.el-input-number),
.custom-export-dialog :deep(.el-button),
.custom-export-dialog :deep(.el-checkbox__inner) {
  transition:
    box-shadow 0.2s ease,
    border-color 0.2s ease,
    background-color 0.2s ease,
    transform 0.12s ease;
}
.custom-export-dialog :deep(.el-input__wrapper:hover),
.custom-export-dialog :deep(.el-select__wrapper:hover),
.custom-export-dialog :deep(.el-input-number:hover),
.custom-export-dialog :deep(.el-button:not(.is-link):hover) {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}
/* 勾选/多选切换动画：选中时勾选框轻微放大回弹 */
.custom-export-dialog :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  transform: scale(1.12);
}

.ce-template-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 8px;
  margin-bottom: 8px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.ce-tpl-label {
  font-weight: 600;
  color: var(--el-text-color-regular);
}
.ce-layout {
  display: flex;
  gap: 14px;
}
.ce-cols {
  width: 480px;
  flex-shrink: 0;
}
.ce-options {
  flex: 1;
  min-width: 0;
}
/* 导出选项模块化：每个模块顶部一条分割线 + 标题，弱化堆砌感；首个模块不重复描边 */
.ce-module-title {
  font-weight: 600;
  font-size: 13px;
  color: var(--el-color-primary);
  margin: 6px 0 8px;
  padding-top: 8px;
  border-top: 1px dashed var(--el-border-color);
}
.ce-module:first-child .ce-module-title {
  margin-top: 0;
  padding-top: 0;
  border-top: none;
}
/* 压缩留白：表单项间距收紧，配置尽量一屏展示 */
.ce-form :deep(.el-form-item) {
  margin-bottom: 8px;
}
.ce-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  margin-bottom: 8px;
}
.ce-col-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}
.ce-group-toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 6px;
}
.ce-col-list {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  max-height: 460px;
  overflow-y: auto;
}
/* 分组标题：浅橙底 + 橙色左条，与字段行的蓝/白底分层区分 */
.ce-group-head {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: var(--el-color-warning-light-9);
  border-left: 3px solid var(--el-color-warning);
  cursor: pointer;
  position: sticky;
  top: 0;
  z-index: 1;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.ce-caret {
  transition: transform 0.2s;
  color: var(--el-text-color-secondary);
}
.ce-caret.open {
  transform: rotate(90deg);
}
.ce-group-title {
  font-weight: 600;
  font-size: 13px;
  color: var(--el-color-warning-dark-2);
}
.ce-group-count {
  margin-left: auto;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.ce-col-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  transition: background 0.15s;
}
.ce-col-item.is-checked {
  background: var(--el-color-primary-light-9);
}
.ce-col-item.is-selected {
  background: var(--el-color-primary-light-8);
  box-shadow: inset 3px 0 0 var(--el-color-primary);
}
.ce-sel-tip {
  margin-left: auto;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}
.ce-col-item.is-hover {
  outline: 1px dashed var(--el-color-primary);
}
.ce-col-item.is-dragging {
  background: #fdf6d8;
  opacity: 0.9;
}
.ce-drag-handle {
  cursor: grab;
  color: var(--el-text-color-secondary);
  flex-shrink: 0;
}
.ce-col-key {
  width: 84px;
  flex-shrink: 0;
  font-size: 13px;
  color: var(--el-text-color-regular);
  cursor: help;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ce-col-label {
  flex: 1;
  min-width: 90px;
}
.ce-col-width {
  width: 88px;
  flex-shrink: 0;
}
.ce-col-move {
  display: flex;
  flex-shrink: 0;
}
.ce-col-move :deep(.el-button) {
  padding: 2px;
  margin: 0;
}
.ce-split-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
}
.ce-split-hint .ce-warn {
  color: var(--el-color-warning);
}
.ce-range-row {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
}
.ce-range-num {
  width: 110px;
}
.ce-extra-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
}
.ce-preview-block {
  margin-top: 10px;
  border-top: 1px solid var(--el-border-color-lighter);
  padding-top: 8px;
}
.ce-preview-head {
  margin-bottom: 6px;
}
.ce-preview-stats {
  display: flex;
  align-items: center;
  gap: 8px;
}
.ce-pv-th {
  cursor: help;
}
/* 大标题预览：模拟导出顶部合并大标题 */
.ce-report-title {
  text-align: center;
  font-size: 15px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  padding: 8px 0;
  border: 1px solid var(--el-border-color-lighter);
  border-bottom: 0;
  background: var(--el-fill-color-lighter);
}
.ce-preview-total {
  display: flex;
  border: 1px solid var(--el-border-color-lighter);
  border-top: 0;
  background: var(--el-fill-color-lighter);
  font-weight: 600;
  font-size: 13px;
}
.ce-preview-total > span {
  flex: 1;
  min-width: 110px;
  padding: 6px 10px;
  border-right: 1px solid var(--el-border-color-lighter);
}
.ce-footer-tip {
  float: left;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 32px;
}
</style>
