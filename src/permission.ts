import router from './router';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import { getToken } from '@/utils/auth';
import { isHttp, isPathMatch } from '@/utils/validate';
import { isRelogin } from '@/utils/request';
import { useUserStore } from '@/store/modules/user';
import { useSettingsStore } from '@/store/modules/settings';
import { usePermissionStore } from '@/store/modules/permission';
import { ElMessage } from 'element-plus/es';

NProgress.configure({ showSpinner: false });
const whiteList = ['/login', '/register', '/social-callback', '/register*', '/register/*'];

const isWhiteList = (path: string) => {
  return whiteList.some((pattern) => isPathMatch(pattern, path));
};

const isInvalidSessionError = (err: unknown) => String(err).includes('无效的会话') || String(err).includes('会话已过期');

router.beforeEach(async (to) => {
  NProgress.start();
  if (getToken()) {
    const userStore = useUserStore();
    to.meta.title && useSettingsStore().setTitle(to.meta.title as string);
    /* has token*/
    if (to.path === '/login') {
      NProgress.done();
      // 登录页是重新建立会话的入口；只有已验证过用户信息的会话才允许跳回首页。
      if (userStore.roles.length > 0) {
        return { path: '/' };
      }
      userStore.clearSession();
      return true;
    } else if (isWhiteList(to.path)) {
      return true;
    } else {
      if (userStore.roles.length === 0) {
        isRelogin.show = true;
        try {
          // getInfo 与 generateRoutes 互不依赖（getRouters 已在后端按权限过滤），并行拉取以减少首屏等待
          const [, accessRoutes] = await Promise.all([userStore.getInfo(), usePermissionStore().generateRoutes()]);
          // 根据后端返回的路由表动态添加可访问路由
          accessRoutes.forEach((route: any) => {
            if (!isHttp(route.path)) {
              router.addRoute(route); // 动态添加可访问路由表
            }
          });
          // 动态路由添加完成后重进当前地址，确保本次导航能命中新注册的页面组件。
          return to.name
            ? { name: to.name, replace: true, params: to.params, query: to.query, hash: to.hash }
            : { path: to.path, replace: true, query: to.query, hash: to.hash };
        } catch (err) {
          // 任一请求失败（最常见 token 失效 401）→ 登出并跳登录页，避免导航抛错导致白屏
          userStore.clearSession();
          if (!isInvalidSessionError(err)) {
            ElMessage.error(err instanceof Error ? err.message : String(err));
          }
          return `/login?redirect=${encodeURIComponent(to.fullPath)}`;
        } finally {
          isRelogin.show = false; // 两分支重复的复位收敛到 finally
        }
      } else {
        return true;
      }
    }
  } else {
    // 没有token
    if (isWhiteList(to.path)) {
      // 在免登录白名单，直接进入
      return true;
    } else {
      const redirect = encodeURIComponent(to.fullPath || '/');
      NProgress.done();
      return `/login?redirect=${redirect}`; // 否则全部重定向到登录页
    }
  }
});

router.afterEach(() => {
  NProgress.done();
});
