<template>
  <div v-loading="state.loading" class="layout-navbars-breadcrumb-user-news">
    <div class="head-box">
      <div class="head-box-title">运营待办</div>
      <div class="head-box-btn" @click="readAll">全部已读</div>
    </div>
    <div v-loading="state.loading" class="content-box">
      <template v-if="todoItems.length > 0">
        <div v-for="item in todoItems" :key="item.type" class="content-box-item todo-item" @click="goTodo(item.path)">
          <div class="item-conten">
            <div class="todo-title">{{ item.title }}</div>
            <div class="content-box-msg">{{ item.desc }}</div>
          </div>
          <span class="el-tag el-tag--danger el-tag--mini read">{{ item.count }}</span>
        </div>
      </template>
      <div v-if="todoItems.length && newsList.length" class="content-divider"></div>
      <template v-if="newsList.length > 0">
        <div class="notice-section-title">通知公告</div>
        <div v-for="(v, k) in newsList" :key="k" class="content-box-item" @click="onNewsClick(k)">
          <div class="item-conten">
            <div>{{ v.message }}</div>
            <div class="content-box-msg"></div>
            <div class="content-box-time">{{ v.time }}</div>
          </div>
          <!-- 已读/未读 -->
          <span v-if="v.read" class="el-tag el-tag--success el-tag--mini read">已读</span>
          <span v-else class="el-tag el-tag--danger el-tag--mini read">未读</span>
        </div>
      </template>
      <el-empty v-if="!todoItems.length && !newsList.length" :description="'暂无待办'"></el-empty>
    </div>
  </div>
</template>

<script setup lang="ts" name="layoutBreadcrumbUserNews">
import { useNoticeStore } from '@/store/modules/notice';
import { getWorklist } from '@/api/recruitment';
import router from '@/router';

const noticeStore = useNoticeStore();
const { readAll } = useNoticeStore();

// 定义变量内容
const state = reactive({
  loading: false
});
const newsList = ref([]) as any;
const pendingCompanies = ref(0);
const pendingJobs = ref(0);
const todoItems = computed(() =>
  [
    {
      type: 'company',
      title: '企业待审核',
      desc: `有 ${pendingCompanies.value} 个 B 端企业申请待处理`,
      count: pendingCompanies.value,
      path: '/recruitment/company?status=0'
    },
    {
      type: 'job',
      title: '岗位待审核',
      desc: `有 ${pendingJobs.value} 个岗位发布申请待处理`,
      count: pendingJobs.value,
      path: '/recruitment/job?status=0'
    }
  ].filter((item) => item.count > 0)
);

/**
 * 初始化数据
 * @returns
 */
const getTableData = async () => {
  state.loading = true;
  try {
    const res = await getWorklist({ silent: true });
    const data = res.data || {};
    pendingCompanies.value = Number(data.pendingCompanies || 0);
    pendingJobs.value = Number(data.pendingJobs || 0);
    newsList.value = noticeStore.state.notices;
  } catch (error) {
    console.warn('加载运营待办失败', error);
    newsList.value = noticeStore.state.notices;
  } finally {
    state.loading = false;
  }
};

//点击消息，写入已读
const onNewsClick = (item: any) => {
  newsList.value[item].read = true;
  //并且写入pinia
  noticeStore.state.notices = newsList.value;
};

const goTodo = (path: string) => {
  router.push(path);
};

onMounted(() => {
  nextTick(() => {
    getTableData();
  });
});
</script>

<style lang="scss" scoped>
.layout-navbars-breadcrumb-user-news {
  .head-box {
    display: flex;
    border-bottom: 1px solid var(--el-border-color-lighter);
    box-sizing: border-box;
    color: var(--el-text-color-primary);
    justify-content: space-between;
    height: 35px;
    align-items: center;
    .head-box-btn {
      color: var(--el-color-primary);
      font-size: 13px;
      cursor: pointer;
      opacity: 0.8;
      &:hover {
        opacity: 1;
      }
    }
  }
  .content-box {
    height: 300px;
    overflow: auto;
    font-size: 13px;
    .content-box-item {
      padding-top: 12px;
      display: flex;
      cursor: pointer;
      &:last-of-type {
        padding-bottom: 12px;
      }
      .content-box-msg {
        color: var(--el-text-color-secondary);
        margin-top: 5px;
        margin-bottom: 5px;
      }
      .content-box-time {
        color: var(--el-text-color-secondary);
      }
      .item-conten {
        width: 100%;
        display: flex;
        flex-direction: column;
      }
    }
    .todo-item {
      align-items: flex-start;
    }
    .todo-title {
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
    .content-divider {
      height: 1px;
      margin: 8px 0 2px;
      background: var(--el-border-color-lighter);
    }
    .notice-section-title {
      padding-top: 10px;
      color: var(--el-text-color-secondary);
      font-size: 12px;
    }
  }
  .foot-box {
    height: 35px;
    color: var(--el-color-primary);
    font-size: 13px;
    cursor: pointer;
    opacity: 0.8;
    display: flex;
    align-items: center;
    justify-content: center;
    border-top: 1px solid var(--el-border-color-lighter);
    &:hover {
      opacity: 1;
    }
  }
  :deep(.el-empty__description p) {
    font-size: 13px;
  }
}
</style>
