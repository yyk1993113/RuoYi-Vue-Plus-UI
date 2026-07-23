import { defineStore } from 'pinia';
import router, { constantRoutes, dynamicRoutes } from '@/router';
import store from '@/store';
import { getRouters } from '@/api/menu';
import auth from '@/plugins/auth';
import { useUserStore } from '@/store/modules/user';
import { RouteRecordRaw } from 'vue-router';
import Layout from '@/layout/index.vue';
import ParentView from '@/components/ParentView/index.vue';
import InnerLink from '@/layout/components/InnerLink/index.vue';
import { defineComponent, h, ref } from 'vue';
import { createCustomNameComponent } from '@/utils/createCustomNameComponent';
import { hasOperationsManagerRole } from '@/utils/role';
import { ElNotification } from 'element-plus/es';

// 匹配views里面所有的.vue文件
const modules = import.meta.glob('./../../views/**/*.vue');
// 运营主管需要保留平台首页；其他非管理角色仍落到其首个获授权业务页面。
const canViewPlatformHome = () => {
  const { roles } = useUserStore();
  return roles.some((role) => ['superadmin', 'admin'].includes(role)) || hasOperationsManagerRole(roles);
};
const filterNonAdminConstantRoutes = (source: RouteRecordRaw[]): RouteRecordRaw[] => {
  return source.reduce<RouteRecordRaw[]>((result, route) => {
    if (route.path === '/index' || route.name === 'Index') {
      return result;
    }
    const nextRoute: RouteRecordRaw = { ...route };
    if (route.children) {
      nextRoute.children = filterNonAdminConstantRoutes(route.children);
      if (!nextRoute.children.length && !route.hidden) {
        return result;
      }
    }
    result.push(nextRoute);
    return result;
  }, []);
};
const getVisibleConstantRoutes = () => (canViewPlatformHome() ? constantRoutes : filterNonAdminConstantRoutes(constantRoutes));

export const usePermissionStore = defineStore('permission', () => {
  const routes = ref<RouteRecordRaw[]>([]);
  const addRoutes = ref<RouteRecordRaw[]>([]);
  const defaultRoutes = ref<RouteRecordRaw[]>([]);
  const topbarRouters = ref<RouteRecordRaw[]>([]);
  const sidebarRouters = ref<RouteRecordRaw[]>([]);

  const getRoutes = (): RouteRecordRaw[] => {
    return routes.value as RouteRecordRaw[];
  };
  const getDefaultRoutes = (): RouteRecordRaw[] => {
    return defaultRoutes.value as RouteRecordRaw[];
  };
  const getSidebarRoutes = (): RouteRecordRaw[] => {
    return sidebarRouters.value as RouteRecordRaw[];
  };
  const getTopbarRoutes = (): RouteRecordRaw[] => {
    return topbarRouters.value as RouteRecordRaw[];
  };

  const setRoutes = (newRoutes: RouteRecordRaw[]): void => {
    addRoutes.value = newRoutes;
    routes.value = getVisibleConstantRoutes().concat(newRoutes);
  };
  const setDefaultRoutes = (routes: RouteRecordRaw[]): void => {
    defaultRoutes.value = getVisibleConstantRoutes().concat(routes);
  };
  const setTopbarRoutes = (routes: RouteRecordRaw[]): void => {
    topbarRouters.value = routes;
  };
  const setSidebarRouters = (routes: RouteRecordRaw[]): void => {
    sidebarRouters.value = routes;
  };
  const generateRoutes = async (): Promise<RouteRecordRaw[]> => {
    const res = await getRouters();
    const { data } = res;
    // 结构化克隆比 JSON.parse(JSON.stringify()) 更快
    const clone = structuredClone ? structuredClone(data) : JSON.parse(JSON.stringify(data));
    const sdata = structuredClone ? structuredClone(clone) : JSON.parse(JSON.stringify(clone));
    const rdata = structuredClone ? structuredClone(clone) : JSON.parse(JSON.stringify(clone));
    const defaultData = clone;
    const sidebarRoutes = filterAsyncRouter(sdata);
    const rewriteRoutes = filterAsyncRouter(rdata, undefined, true);
    const defaultRoutes = filterAsyncRouter(defaultData);
    const asyncRoutes = filterDynamicRoutes(dynamicRoutes);
    asyncRoutes.forEach((route) => {
      router.addRoute(route);
    });
    setRoutes(rewriteRoutes);
    setSidebarRouters(getVisibleConstantRoutes().concat(sidebarRoutes));
    setDefaultRoutes(sidebarRoutes);
    setTopbarRoutes(defaultRoutes);
    // 路由name重复检查
    duplicateRouteChecker(asyncRoutes, sidebarRoutes);
    return new Promise<RouteRecordRaw[]>((resolve) => resolve(rewriteRoutes));
  };

  /**
   * 遍历后台传来的路由字符串，转换为组件对象
   * @param asyncRouterMap 后台传来的路由字符串
   * @param lastRouter 上一级路由
   * @param type 是否是重写路由
   */
  const filterAsyncRouter = (asyncRouterMap: RouteRecordRaw[], lastRouter?: RouteRecordRaw, type = false): RouteRecordRaw[] => {
    return asyncRouterMap.filter((route) => {
      if (type && route.children) {
        route.children = filterChildren(route.children, undefined);
      }
      // Layout ParentView 组件特殊处理
      if (route.component?.toString() === 'Layout') {
        route.component = Layout;
      } else if (route.component?.toString() === 'ParentView') {
        route.component = ParentView;
      } else if (route.component?.toString() === 'InnerLink') {
        route.component = InnerLink;
      } else {
        route.component = loadView(route.component, route.name as string);
      }
      if (route.children != null && route.children && route.children.length) {
        route.children = filterAsyncRouter(route.children, route, type);
      } else {
        delete route.children;
        delete route.redirect;
      }
      return true;
    });
  };
  const filterChildren = (childrenMap: RouteRecordRaw[], lastRouter?: RouteRecordRaw): RouteRecordRaw[] => {
    let children: RouteRecordRaw[] = [];
    childrenMap.forEach((el) => {
      el.path = lastRouter ? lastRouter.path + '/' + el.path : el.path;
      if (el.children && el.children.length && el.component?.toString() === 'ParentView') {
        children = children.concat(filterChildren(el.children, el));
      } else {
        children.push(el);
      }
    });
    return children;
  };
  return {
    routes,
    topbarRouters,
    sidebarRouters,
    defaultRoutes,

    getRoutes,
    getDefaultRoutes,
    getSidebarRoutes,
    getTopbarRoutes,

    setRoutes,
    generateRoutes,
    setSidebarRouters
  };
});

// 动态路由遍历，验证是否具备权限
export const filterDynamicRoutes = (routes: RouteRecordRaw[]) => {
  const res: RouteRecordRaw[] = [];
  routes.forEach((route) => {
    const tmp = { ...route };
    if (tmp.children) {
      tmp.children = filterDynamicRoutes(tmp.children);
    }

    let hasAccess = true;
    if (tmp.permissions) {
      hasAccess = auth.hasPermiOr(tmp.permissions);
    } else if (tmp.roles) {
      hasAccess = auth.hasRoleOr(tmp.roles);
    }

    if (hasAccess) {
      res.push(tmp);
    } else if (tmp.children && tmp.children.length > 0 && !route.permissions && !route.roles) {
      res.push(tmp);
    }
  });
  return res;
};

export const loadView = (view: any, name: string) => {
  let res;
  // 后端菜单可能只传目录路径；同时尝试 index.vue，避免新增目录页被误判为资源不存在。
  const normalizedView = String(view || '').replace(/^\/+|\/+$/g, '');
  const candidates = [normalizedView, `${normalizedView}/index`].filter(Boolean);
  for (const path in modules) {
    const viewsIndex = path.indexOf('/views/');
    let dir = path.substring(viewsIndex + 7);
    dir = dir.substring(0, dir.lastIndexOf('.vue'));
    if (candidates.includes(dir)) {
      res = createCustomNameComponent(modules[path], { name });
      return res;
    }
  }
  // 动态菜单依赖后端 component 字段映射到 src/views 下的真实文件。
  // 若新增页面后未重启 Vite、或数据库 component 写错，原逻辑会返回 undefined 并造成内容区白屏。
  console.error(`[permission] Cannot resolve route component: ${view}, route name: ${name}`);
  return createMissingRouteComponent(view, name);
};

const createMissingRouteComponent = (view: any, name: string) =>
  defineComponent({
    name: `MissingRoute_${name || 'Unknown'}`,
    setup() {
      return () =>
        h(
          'div',
          {
            style: {
              padding: '24px',
              color: '#606266'
            }
          },
          [
            h(
              'div',
              {
                style: {
                  maxWidth: '720px',
                  padding: '20px 24px',
                  border: '1px solid #dcdfe6',
                  borderRadius: '6px',
                  background: '#fff'
                }
              },
              [
                h('h3', { style: { margin: '0 0 12px', color: '#303133', fontSize: '18px' } }, '页面组件加载失败'),
                h('p', { style: { margin: '0 0 8px' } }, `路由组件：${view || '-'}`),
                h('p', { style: { margin: '0' } }, '请检查菜单 component 是否与 src/views 下的 Vue 文件路径一致，新增页面后需要重启前端开发服务。')
              ]
            )
          ]
        );
    }
  });

// 非setup
export const usePermissionStoreHook = () => {
  return usePermissionStore(store);
};

interface Route {
  name?: string | symbol;
  path: string;
  children?: Route[];
}

/**
 * 检查路由name是否重复
 * @param localRoutes 本地路由
 * @param routes 动态路由
 */
function duplicateRouteChecker(localRoutes: Route[], routes: Route[]) {
  // 展平
  function flatRoutes(routes: Route[]) {
    const res: Route[] = [];
    routes.forEach((route) => {
      if (route.children) {
        res.push(...flatRoutes(route.children));
      } else {
        res.push(route);
      }
    });
    return res;
  }

  const allRoutes = flatRoutes([...localRoutes, ...routes]);

  const nameList: string[] = [];
  allRoutes.forEach((route) => {
    const name = route.name.toString();
    if (name && nameList.includes(name)) {
      const message = `路由名称: [${name}] 重复, 会造成 404`;
      console.error(message);
      ElNotification({
        title: '路由名称重复',
        message,
        type: 'error'
      });
      return;
    }
    nameList.push(route.name.toString());
  });
}
