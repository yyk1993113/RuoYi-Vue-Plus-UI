// 运营台招聘域 —— 视图层通用纯函数（集中消除各页复制的「响应拆包 / 金额格式化 / 字符串切割」逻辑）。
// 仅承载跨多个 recruitment 视图复用、与具体业务状态枚举无关的工具；状态码→标签/颜色映射见 ./constants。
// 设计目标：行为与各视图改造前的原实现保持一致（详见各函数注释），不引入跨仓契约依赖。

/**
 * 统一列表响应拆包，返回 { rows, total }。
 * 背景：项目响应拦截器（utils/request.ts:164）直接 resolve 后端整包 body——
 *   标准分页接口（TableDataInfo）数据在顶层 res.rows / res.total；
 *   个别历史写法把数据包到 res.data.rows / res.data.total。
 * 本函数以「顶层优先、再退 data.*」兼容两种形状，取代各视图里
 * `res.data?.rows ?? res.rows ?? []` 一类散弹写法——对真实后端响应行为完全一致
 * （res.rows 存在时即取它，data.rows 分支仅作历史兜底，实际不会命中）。
 */
export function unwrapList<T = any>(res: any): { rows: T[]; total: number } {
  const rows = res?.rows ?? res?.data?.rows ?? [];
  const total = res?.total ?? res?.data?.total ?? 0;
  return { rows: Array.isArray(rows) ? rows : [], total: Number(total) || 0 };
}

/**
 * 金额展示：人民币千分位 + 固定两位小数；空值 / 非数值兜底为 '0.00'。
 * 统一 ledger.vue（toFixed + 正则千分位）与 invoice.vue（toLocaleString）两套等价实现——
 * 二者对常规金额输出一致，此处采用 toLocaleString 形式并补齐空值兜底。
 */
export function formatMoney(amount?: number | string | null): string {
  if (amount == null || amount === '' || isNaN(Number(amount))) return '0.00';
  return Number(amount).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * 把分隔字符串切成「去首尾空白、去空项」的数组，同时兼容中文逗号「，」与英文逗号「,」。
 * 取代各视图里重复的 String(x).split(',') 写法（图片地址、技能 / 福利 / 标签等多值字段）。
 */
export function splitToArray(value?: string | null): string[] {
  if (!value) return [];
  return String(value)
    .split(/[，,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}
