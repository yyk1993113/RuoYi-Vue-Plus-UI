import { createWebHistory, createRouter, RouteRecordRaw } from 'vue-router';
/* Layout */
import Layout from '@/layout/index.vue';

/**
 * Note: 路由配置项
 *
 * hidden: true                     // 当设置 true 的时候该路由不会再侧边栏出现 如401，login等页面，或者如一些编辑页面/edit/1
 * alwaysShow: true                 // 当你一个路由下面的 children 声明的路由大于1个时，自动会变成嵌套的模式--如组件页面
 *                                  // 只有一个时，会将那个子路由当做根路由显示在侧边栏--如引导页面
 *                                  // 若你想不管路由下面的 children 声明的个数都显示你的根路由
 *                                  // 你可以设置 alwaysShow: true，这样它就会忽略之前定义的规则，一直显示根路由
 * redirect: noRedirect             // 当设置 noRedirect 的时候该路由在面包屑导航中不可被点击
 * name:'router-name'               // 设定路由的名字，一定要填写不然使用<keep-alive>时会出现各种问题
 * query: '{"id": 1, "name": "ry"}' // 访问路由的默认传递参数
 * roles: ['admin', 'common']       // 访问路由的角色权限
 * permissions: ['a:a:a', 'b:b:b']  // 访问路由的菜单权限
 * meta : {
    noCache: true                   // 如果设置为true，则不会被 <keep-alive> 缓存(默认 false)
    title: 'title'                  // 设置该路由在侧边栏和面包屑中展示的名字
    icon: 'svg-name'                // 设置该路由的图标，对应路径src/assets/icons/svg
    breadcrumb: false               // 如果设置为false，则不会在breadcrumb面包屑中显示
    activeMenu: '/organization/user' // 当路由设置了该属性，则会高亮相对应的侧边栏。
  }
 */

// 公共路由
export const constantRoutes: RouteRecordRaw[] = [
  {
    path: '/redirect',
    component: Layout,
    hidden: true,
    children: [
      {
        path: '/redirect/:path(.*)',
        component: () => import('@/views/redirect/index.vue')
      }
    ]
  },
  {
    path: '/social-callback',
    hidden: true,
    component: () => import('@/layout/components/SocialCallback/index.vue')
  },
  {
    path: '/login',
    component: () => import('@/views/login.vue'),
    hidden: true
  },
  {
    path: '/register',
    component: () => import('@/views/register.vue'),
    hidden: true
  },
  {
    path: '/:pathMatch(.*)*',
    component: () => import('@/views/error/404.vue'),
    hidden: true
  },
  {
    path: '/401',
    component: () => import('@/views/error/401.vue'),
    hidden: true
  },
  {
    path: '',
    component: Layout,
    redirect: '/index',
    children: [
      {
        path: '/index',
        component: () => import('@/views/index.vue'),
        name: 'Index',
        meta: { title: '首页', icon: 'dashboard', affix: true }
      }
    ]
  },
  {
    path: '/user',
    component: Layout,
    hidden: true,
    redirect: 'noredirect',
    children: [
      {
        path: 'profile',
        component: () => import('@/views/system/user/profile/index.vue'),
        name: 'Profile',
        meta: { title: '个人中心', icon: 'user' }
      }
    ]
  }
];

// 动态路由，基于用户权限动态去加载
export const dynamicRoutes: RouteRecordRaw[] = [
  {
    path: '/recruitment',
    component: Layout,
    name: 'Recruitment',
    meta: { title: '招聘管理', icon: 'peoples' },
    children: [
      {
        path: 'index',
        component: () => import('@/views/recruitment/index.vue'),
        name: 'RecruitmentOverview',
        meta: { title: '招聘概览', icon: 'chart' }
      },
      {
        path: 'company',
        component: () => import('@/views/recruitment/company.vue'),
        name: 'RecruitmentCompany',
        meta: { title: '企业管理', icon: 'company' }
      },
      {
        path: 'promoter',
        component: () => import('@/views/recruitment/promoter.vue'),
        name: 'RecruitmentPromoter',
        meta: { title: '推广管理', icon: 'peoples' }
      },
      {
        path: 'job',
        component: () => import('@/views/recruitment/job.vue'),
        name: 'RecruitmentJob',
        meta: { title: '岗位管理', icon: 'job' }
      },
      {
        // 后台菜单通过数据库将该页面排在“岗位管理”之后；这里保留同一路由供动态路由加载页面组件。
        path: 'finance-task',
        component: () => import('@/views/recruitment/finance-task.vue'),
        name: 'RecruitmentFinanceTask',
        permissions: ['recruitment:financeTask:list'],
        meta: { title: '财税任务审核', icon: 'job' }
      },
      {
        // 代发岗位整页：不在侧栏展示，从「岗位管理」的新增/复制发布入口进入；复制发布走 query.copyFrom=jobId
        path: 'job-publish',
        component: () => import('@/views/recruitment/job-publish.vue'),
        name: 'RecruitmentJobPublish',
        meta: { title: '代发岗位', icon: 'job', activeMenu: '/recruitment/job' },
        hidden: true
      },
      {
        path: 'user',
        component: () => import('@/views/recruitment/user.vue'),
        name: 'RecruitmentUser',
        meta: { title: '求职者管理', icon: 'user' }
      },
      {
        path: 'apply',
        component: () => import('@/views/recruitment/apply.vue'),
        name: 'RecruitmentApply',
        meta: { title: '投递管理', icon: 'list' }
      },
      {
        path: 'task',
        component: () => import('@/views/recruitment/task.vue'),
        name: 'RecruitmentTask',
        meta: { title: '履约管理', icon: 'my-task' }
      },
      {
        path: 'ledger',
        component: () => import('@/views/recruitment/ledger.vue'),
        name: 'RecruitmentLedger',
        permissions: ['recruitment:ledger:list'],
        meta: { title: '台账管理', icon: 'money' }
      },
      {
        path: 'invoice',
        component: () => import('@/views/recruitment/invoice.vue'),
        name: 'RecruitmentInvoice',
        meta: { title: '发票管理', icon: 'pdf' }
      },
      {
        path: 'serialRule',
        component: () => import('@/views/recruitment/serialRule/index.vue'),
        name: 'RecruitmentSerialRule',
        permissions: ['recruitment:serialRule:list'],
        meta: { title: '流水编号规则', icon: 'dict' }
      },
      {
        path: 'promotion-reward',
        component: () => import('@/views/recruitment/promotion-reward.vue'),
        name: 'RecruitmentPromotionReward',
        permissions: ['recruitment:promotionReward:list'],
        meta: { title: '推广奖励', icon: 'money' }
      }
    ]
  }
];

/**
 * 创建路由
 */
const router = createRouter({
  history: createWebHistory(import.meta.env.VITE_APP_CONTEXT_PATH),
  routes: constantRoutes,
  // 刷新时，滚动条位置还原
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }
    return { top: 0 };
  }
});

export default router;
