<!--
  岗位名称选择器（BOSS 直聘式职位类目级联选择）—— 自 findwordmanager 同名组件移植到运营总后台「代发岗位」。
  - 数据源：GET /api/app/jobCategory/tree（@SaIgnore 公开），结构 JobCategoryTreeVO[]：
      顶级类别 → children 子类别 → positions 职位标签{id,name}；positions 也可直接挂在类别上。
      数据由运营台「岗位类别管理」(job_category/job_position) 维护，仅返回启用态。
  - 交互：
      · 点击输入框弹浮窗，左=一级分类、右=该分类下职位（子分类可折叠，默认展开），不跳转页面。
      · 浮窗顶部搜索框：实时过滤匹配职位（大小写不敏感子串；真·中文拼音需引入 pinyin-pro，见 matchKeyword 注释）。
      · 「热门」分组固定置顶，与普通分组隔离。
      · 双向联动：选中职位回填岗位名称；当前值在职位库中则有效，否则失焦标红「请选择下拉内标准职位类目」(经 valid-change 透传父级校验)。
      · 键盘：↑↓ 切换、Enter 选中、ESC 关闭；点击浮窗外自动收起（el-popover trigger=click）。
      · 选中后输入框内以可关闭标签展示（× 职位名）。
  - v-model 绑定「职位名称字符串」(与后端 Job.jobName 同口径)。
-->
<template>
  <el-popover
    :visible="visible"
    :width="popoverWidth"
    placement="bottom-start"
    trigger="click"
    :teleported="true"
    popper-class="jp-popover"
    @show="onShow"
    @hide="visible = false"
  >
    <template #reference>
      <div
        ref="referenceRef"
        class="jp-reference"
        :class="{ 'is-invalid': showInvalid, 'is-active': visible }"
        @click="toggle"
      >
        <el-tag v-if="modelValue" closable type="primary" disable-transitions @close.stop="clearSelection">{{ modelValue }}</el-tag>
        <span v-else class="jp-placeholder">{{ placeholder }}</span>
        <el-icon class="jp-arrow" :class="{ 'is-open': visible }"><ArrowDown /></el-icon>
      </div>
    </template>

    <div class="jp-panel" @keydown="onKeydown">
      <!-- 顶部搜索框 -->
      <div class="jp-search">
        <el-input
          ref="searchInputRef"
          v-model="keyword"
          placeholder="输入关键词筛选职位（如 go / 后端）"
          clearable
          :prefix-icon="Search"
          @input="onSearchInput"
        />
      </div>

      <div v-loading="loading" class="jp-body">
        <!-- 搜索模式：扁平命中列表 -->
        <el-scrollbar v-if="isSearching" height="300px" class="jp-search-list">
          <div v-if="!searchResults.length" class="jp-empty">无匹配职位</div>
          <div
            v-for="(p, idx) in searchResults"
            :key="p.id + '-' + idx"
            class="jp-option"
            :class="{ 'is-active': idx === activeIndex, 'is-selected': p.name === modelValue }"
            @mouseenter="activeIndex = idx"
            @click="choose(p.name)"
          >
            <span v-html="highlight(p.name)" />
            <span class="jp-option-path">{{ p.categoryName }}</span>
          </div>
        </el-scrollbar>

        <!-- 浏览模式：左分类 / 右职位 -->
        <div v-else class="jp-cascade">
          <el-scrollbar height="300px" class="jp-cats">
            <div
              v-for="(cat, i) in topCategories"
              :key="cat.id"
              class="jp-cat"
              :class="{ 'is-active': i === activeCatIndex, 'is-hot': cat.isHot }"
              @click="activeCatIndex = i"
              @mouseenter="activeCatIndex = i"
            >
              <span class="jp-cat-name">{{ cat.name }}</span>
              <el-tag v-if="cat.isHot" size="small" type="danger" effect="plain" class="jp-hot-tag">热门</el-tag>
              <el-icon class="jp-cat-arrow"><ArrowRight /></el-icon>
            </div>
          </el-scrollbar>

          <el-scrollbar height="300px" class="jp-positions">
            <template v-if="activeCat">
              <!-- 直接挂在类别下的职位 -->
              <div v-if="activeCat.positions.length" class="jp-pos-group">
                <div
                  v-for="p in activeCat.positions"
                  :key="p.id"
                  class="jp-option"
                  :class="{ 'is-active': isNavActive(p), 'is-selected': p.name === modelValue }"
                  @mouseenter="setNavActive(p)"
                  @click="choose(p.name)"
                >
                  {{ p.name }}
                </div>
              </div>
              <!-- 子分类：可折叠分组 -->
              <div v-for="sub in activeCat.children" :key="sub.id" class="jp-pos-group">
                <div class="jp-group-head" @click="toggleCollapse(sub.id)">
                  <el-icon class="jp-group-arrow" :class="{ 'is-open': !collapsed.has(sub.id) }"><ArrowRight /></el-icon>
                  <span>{{ sub.name }}</span>
                  <span class="jp-group-count">{{ sub.positions.length }}</span>
                </div>
                <template v-if="!collapsed.has(sub.id)">
                  <div
                    v-for="p in sub.positions"
                    :key="p.id"
                    class="jp-option"
                    :class="{ 'is-active': isNavActive(p), 'is-selected': p.name === modelValue }"
                    @mouseenter="setNavActive(p)"
                    @click="choose(p.name)"
                  >
                    {{ p.name }}
                  </div>
                </template>
              </div>
              <div v-if="!activeCat.positions.length && !activeCat.children.length" class="jp-empty">该分类暂无职位</div>
            </template>
          </el-scrollbar>
        </div>
      </div>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { ArrowDown, ArrowRight, Search } from '@element-plus/icons-vue';
import { getJobPositionTree } from '@/api/recruitment/jobCategory';

interface Pos {
  id: number | string;
  name: string;
  categoryName?: string;
}
interface SubGroup {
  id: number | string;
  name: string;
  positions: Pos[];
}
interface TopCat {
  id: number | string;
  name: string;
  isHot: boolean;
  positions: Pos[];
  children: SubGroup[];
}

const props = withDefaults(defineProps<{ modelValue?: string; placeholder?: string }>(), {
  modelValue: '',
  placeholder: '输入联想或下拉选择职位（来自职位类目库）'
});
const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void;
  (e: 'change', v: string): void;
  // 当前值是否为「职位库内标准职位」，供父级 el-form 自定义校验联动
  (e: 'valid-change', v: boolean): void;
  // 选中职位时抛出其「一级类目」，供父级把职位类目与岗位名称联动带入
  (e: 'pick', payload: { name: string; category: string }): void;
  // 职位类目树加载完成后抛出「一级类目列表」，供父级作为职位类目下拉数据源（与岗位名称同源）
  (e: 'categories-loaded', cats: { id: number | string; name: string }[]): void;
}>();

const visible = ref(false);
const loading = ref(false);
const keyword = ref('');
const referenceRef = ref<HTMLElement>();
const searchInputRef = ref();
const activeCatIndex = ref(0);
const activeIndex = ref(0); // 搜索模式下命中项导航下标
const activeNavKey = ref<string | number>(''); // 浏览模式下当前导航职位 id
const collapsed = ref<Set<string | number>>(new Set());

const topCategories = ref<TopCat[]>([]);
const allPositionNames = ref<Set<string>>(new Set());

const popoverWidth = computed(() => Math.max(referenceRef.value?.offsetWidth || 480, 480));
const isSearching = computed(() => keyword.value.trim().length > 0);
const activeCat = computed(() => topCategories.value[activeCatIndex.value]);

// 当前值是否为标准职位（用于失焦标红 + 父级校验）
const isStandard = computed(() => !props.modelValue || allPositionNames.value.has(props.modelValue));
const showInvalid = computed(() => !!props.modelValue && !isStandard.value);

// ===== 数据加载与转换 =====
onMounted(loadTree);
async function loadTree() {
  loading.value = true;
  try {
    const res = await getJobPositionTree();
    const list: any[] = (res as any)?.data || [];
    const names = new Set<string>();
    const cats: TopCat[] = list.map((node) => buildTopCat(node, names));
    // 「热门」分组置顶
    cats.sort((a, b) => Number(b.isHot) - Number(a.isHot));
    topCategories.value = cats;
    allPositionNames.value = names;
    // 抛出一级类目列表给父级（职位类目下拉与岗位名称同源）
    emit(
      'categories-loaded',
      cats.map((c) => ({ id: c.id, name: c.name }))
    );
    emitValid();
  } catch (e) {
    console.error('加载职位类目树失败', e);
  } finally {
    loading.value = false;
  }
}

function buildTopCat(node: any, names: Set<string>): TopCat {
  const directPositions: Pos[] = (node.positions || []).map((p: any) => collectPos(p, node.name, names));
  const children: SubGroup[] = (node.children || []).map((sub: any) => ({
    id: sub.id,
    name: sub.name,
    // 子分类的职位 = 直接职位 + 其更深子分类的职位拍平（容错多级），category 路径记到顶/子名
    positions: flattenPositions(sub, node.name + ' / ' + sub.name, names)
  }));
  return {
    id: node.id,
    name: node.name,
    isHot: String(node.name || '').includes('热门'),
    positions: directPositions,
    children
  };
}
function collectPos(p: any, categoryName: string, names: Set<string>): Pos {
  if (p?.name) names.add(p.name);
  return { id: p.id, name: p.name, categoryName };
}
function flattenPositions(node: any, path: string, names: Set<string>): Pos[] {
  const out: Pos[] = (node.positions || []).map((p: any) => collectPos(p, path, names));
  for (const sub of node.children || []) {
    out.push(...flattenPositions(sub, path + ' / ' + sub.name, names));
  }
  return out;
}

// ===== 搜索 =====
// matchKeyword：当前为大小写不敏感子串匹配（"go" 命中 "Go后端"）。
// 如需真·中文拼音/首字母（"houduan"/"hd" 命中 "后端"），引入 pinyin-pro 后在此扩展即可。
function matchKeyword(name: string, kw: string): boolean {
  return name.toLowerCase().includes(kw);
}
const searchResults = computed<Pos[]>(() => {
  const kw = keyword.value.trim().toLowerCase();
  if (!kw) return [];
  const seen = new Set<string>();
  const out: Pos[] = [];
  for (const cat of topCategories.value) {
    const pools = [...cat.positions, ...cat.children.flatMap((s) => s.positions)];
    for (const p of pools) {
      if (p.name && !seen.has(p.name) && matchKeyword(p.name, kw)) {
        seen.add(p.name);
        out.push(p);
      }
    }
  }
  return out;
});
function highlight(name: string): string {
  const kw = keyword.value.trim();
  if (!kw) return escapeHtml(name);
  const safe = escapeHtml(name);
  const re = new RegExp('(' + kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig');
  return safe.replace(re, '<span class="jp-hl">$1</span>');
}
function escapeHtml(s: string): string {
  return String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string
  );
}
function onSearchInput() {
  activeIndex.value = 0;
}

// ===== 浏览模式导航辅助 =====
// 当前右栏按显示顺序拍平的职位（受折叠影响），用于键盘上下导航
const browsePositions = computed<Pos[]>(() => {
  if (!activeCat.value) return [];
  const out: Pos[] = [...activeCat.value.positions];
  for (const sub of activeCat.value.children) {
    if (!collapsed.value.has(sub.id)) out.push(...sub.positions);
  }
  return out;
});
function isNavActive(p: Pos): boolean {
  return activeNavKey.value === p.id;
}
function setNavActive(p: Pos) {
  activeNavKey.value = p.id;
}
function toggleCollapse(id: string | number) {
  const s = new Set(collapsed.value);
  s.has(id) ? s.delete(id) : s.add(id);
  collapsed.value = s;
}

// ===== 选择 / 清除 =====
function choose(name: string) {
  emit('update:modelValue', name);
  emit('change', name);
  // 同步抛出该职位的一级类目，供父级把「职位类目」自动带入
  emit('pick', { name, category: topCategoryOf(name) });
  visible.value = false;
  keyword.value = '';
}

// 按职位名定位其所属「一级类目」名称（直接挂类别下或挂在子分类下都能命中）
function topCategoryOf(name: string): string {
  const cat = topCategories.value.find(
    (c) => c.positions.some((p) => p.name === name) || c.children.some((s) => s.positions.some((p) => p.name === name))
  );
  return cat?.name || '';
}
function clearSelection() {
  emit('update:modelValue', '');
  emit('change', '');
}
function toggle() {
  visible.value = !visible.value;
}
function onShow() {
  keyword.value = '';
  activeIndex.value = 0;
  // 定位到已选项所在分类
  if (props.modelValue) {
    const idx = topCategories.value.findIndex(
      (c) => c.positions.some((p) => p.name === props.modelValue) || c.children.some((s) => s.positions.some((p) => p.name === props.modelValue))
    );
    if (idx >= 0) activeCatIndex.value = idx;
  }
  nextTick(() => searchInputRef.value?.focus?.());
}

// ===== 键盘 =====
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    visible.value = false;
    return;
  }
  if (isSearching.value) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex.value = Math.min(activeIndex.value + 1, searchResults.value.length - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex.value = Math.max(activeIndex.value - 1, 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const p = searchResults.value[activeIndex.value];
      if (p) choose(p.name);
    }
    return;
  }
  // 浏览模式：上下在右栏职位间移动
  const list = browsePositions.value;
  if (!list.length) return;
  let cur = list.findIndex((p) => p.id === activeNavKey.value);
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    cur = Math.min(cur + 1, list.length - 1);
    activeNavKey.value = list[cur]?.id ?? activeNavKey.value;
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    cur = Math.max(cur - 1, 0);
    activeNavKey.value = list[cur]?.id ?? activeNavKey.value;
  } else if (e.key === 'Enter') {
    e.preventDefault();
    const p = list[cur >= 0 ? cur : 0];
    if (p) choose(p.name);
  }
}

// ===== 校验联动 =====
function emitValid() {
  emit('valid-change', isStandard.value);
}
watch(() => props.modelValue, emitValid);
</script>

<style scoped>
.jp-reference {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 32px;
  padding: 0 30px 0 11px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  cursor: pointer;
  position: relative;
  transition: border-color 0.2s;
  background: var(--el-fill-color-blank);
}
.jp-reference:hover {
  border-color: var(--el-border-color-hover);
}
.jp-reference.is-active {
  border-color: var(--el-color-primary);
}
.jp-reference.is-invalid {
  border-color: var(--el-color-danger);
}
.jp-placeholder {
  color: var(--el-text-color-placeholder);
  font-size: 14px;
}
.jp-arrow {
  position: absolute;
  right: 9px;
  color: var(--el-text-color-placeholder);
  transition: transform 0.2s;
}
.jp-arrow.is-open {
  transform: rotate(180deg);
}

.jp-panel {
  outline: none;
}
.jp-search {
  margin-bottom: 8px;
}
.jp-cascade {
  display: flex;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  overflow: hidden;
}
.jp-cats {
  width: 40%;
  border-right: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-light);
}
.jp-positions {
  width: 60%;
}
.jp-cat {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  font-size: 13px;
  cursor: pointer;
}
.jp-cat:hover,
.jp-cat.is-active {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}
.jp-cat-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.jp-cat.is-hot .jp-cat-name {
  font-weight: 600;
}
.jp-hot-tag {
  flex-shrink: 0;
}
.jp-cat-arrow {
  color: var(--el-text-color-placeholder);
  font-size: 12px;
}
.jp-group-head {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  background: var(--el-fill-color-lighter);
}
.jp-group-arrow {
  transition: transform 0.2s;
}
.jp-group-arrow.is-open {
  transform: rotate(90deg);
}
.jp-group-count {
  margin-left: auto;
  color: var(--el-text-color-placeholder);
}
.jp-option {
  padding: 7px 14px;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.jp-option:hover,
.jp-option.is-active {
  background: var(--el-color-primary-light-9);
}
.jp-option.is-selected {
  color: var(--el-color-primary);
  font-weight: 600;
}
.jp-option-path {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  flex-shrink: 0;
}
.jp-empty {
  padding: 20px;
  text-align: center;
  color: var(--el-text-color-placeholder);
  font-size: 13px;
}
:deep(.jp-hl) {
  color: var(--el-color-primary);
  font-weight: 600;
}
</style>
