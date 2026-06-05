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

router.beforeEach(async (to, from, next) => {
  NProgress.start();
  if (getToken()) {
    to.meta.title && useSettingsStore().setTitle(to.meta.title as string);
    /* has token*/
    if (to.path === '/login') {
      next({ path: '/' });
      NProgress.done();
    } else if (isWhiteList(to.path)) {
      next();
    } else {
      if (useUserStore().roles.length === 0) {
        isRelogin.show = true;
        try {
          // getInfo 与 generateRoutes 互不依赖（getRouters 已在后端按权限过滤），并行拉取以减少首屏等待
          const [, accessRoutes] = await Promise.all([
            useUserStore().getInfo(),
            usePermissionStore().generateRoutes(),
          ]);
          // 根据后端返回的路由表动态添加可访问路由
          accessRoutes.forEach((route: any) => {
            if (!isHttp(route.path)) {
              router.addRoute(route); // 动态添加可访问路由表
            }
          });
          // @ts-expect-error hack方法 确保addRoutes已完成
          next({ path: to.path, replace: true, params: to.params, query: to.query, hash: to.hash, name: to.name as string }); // hack方法 确保addRoutes已完成
        } catch (err) {
          // 任一请求失败（最常见 token 失效 401）→ 登出并跳登录页，避免导航抛错导致白屏
          await useUserStore().logout();
          ElMessage.error(err instanceof Error ? err.message : String(err));
          next(`/login?redirect=${encodeURIComponent(to.fullPath)}`);
        } finally {
          isRelogin.show = false; // 两分支重复的复位收敛到 finally
        }
      } else {
        next();
      }
    }
  } else {
    // 没有token
    if (isWhiteList(to.path)) {
      // 在免登录白名单，直接进入
      next();
    } else {
      const redirect = encodeURIComponent(to.fullPath || '/');
      next(`/login?redirect=${redirect}`); // 否则全部重定向到登录页
      NProgress.done();
    }
  }
});

router.afterEach(() => {
  NProgress.done();
});
