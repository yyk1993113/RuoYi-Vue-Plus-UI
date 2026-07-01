/**
 * 岗位表单（编辑弹窗 job.vue / 代发整页 job-publish.vue）共用的字典选项与构造器。
 * 抽出此处避免两端各维护一份枚举导致口径漂移。所有 value 口径与后端字典一致：
 *  - jobType 0全职/1兼职/2临时工/3项目制
 *  - salaryUnit 0元/天 1元/月 2元/次 3元/小时（无「面议」——面议=不填薪资，由读取方渲染）
 *  - experience 0-4 / education 0-7
 *  - category 由标准职位库随 positionId 自动带出，不再维护本地硬编码类目。
 */
import { REGIONS } from '@/utils/region-data';

// 用工性质：块状单选卡片选项
export const jobTypeOptions = [
  { value: '0', label: '全职' },
  { value: '1', label: '兼职' },
  { value: '2', label: '临时工' },
  { value: '3', label: '项目制' }
];

// 经验要求 0-4
export const experienceOptions = [
  { value: '0', label: '经验不限' },
  { value: '1', label: '应届/1年以内' },
  { value: '2', label: '1-3年' },
  { value: '3', label: '3-5年' },
  { value: '4', label: '5年以上' }
];

// 学历要求 0-7
export const educationOptions = [
  { value: '0', label: '学历不限' },
  { value: '1', label: '初中及以下' },
  { value: '2', label: '高中' },
  { value: '3', label: '中专/技校' },
  { value: '4', label: '大专' },
  { value: '5', label: '本科' },
  { value: '6', label: '硕士' },
  { value: '7', label: '博士' }
];

// 薪资单位
export const salaryUnitOptions = [
  { value: '1', label: '元/月' },
  { value: '0', label: '元/天' },
  { value: '3', label: '元/小时' },
  { value: '2', label: '元/次' }
];

// 快捷薪资标签：固定按「元/月」(salaryUnit=1)填充常用区间
export const salaryQuickOptions = [
  { label: '3k-5k', min: 3000, max: 5000 },
  { label: '5k-8k', min: 5000, max: 8000 },
  { label: '8k-12k', min: 8000, max: 12000 },
  { label: '12k-20k', min: 12000, max: 20000 }
];

// 招聘人数快捷标签（单值，避免「2-5人」区间歧义）
export const recruitQuickOptions = [1, 2, 5, 10];

// 快捷福利标签（点击以「、」追加进纯文本福利框）
export const benefitQuickOptions = ['五险一金', '双休', '年终奖', '弹性工作制', '带薪年假', '餐补', '交通补贴', '定期体检'];

// 极低薪提示阈值：按单位区分合理下限，低于阈值给出友好提醒
export const salaryLowThreshold: Record<string, number> = {
  '1': 1000, // 元/月
  '0': 50, // 元/天
  '3': 10, // 元/小时
  '2': 10 // 元/次
};

// 岗位描述分段引导占位
export const descriptionPlaceholder = ['【岗位职责】', '1. ', '', '【任职要求】', '1. ', '', '【福利待遇】', '1. '].join('\n');

// 岗位描述三段式纯文本模板（非富文本，保持 description 落库为纯文本）
export const descTemplates = [
  {
    key: 'tech',
    label: '技术岗模板',
    text: [
      '一、岗位职责',
      '1. 负责核心模块的设计、开发与维护；',
      '2. 参与技术方案评审，保障代码质量与系统稳定性；',
      '3. 配合团队完成需求迭代与线上问题排查。',
      '',
      '二、任职要求',
      '1. 计算机相关专业，扎实的数据结构与算法基础；',
      '2. 熟悉主流开发框架，有良好的编码习惯；',
      '3. 具备较强的学习能力与团队协作意识。',
      '',
      '三、员工福利',
      '五险一金、双休、年终奖、定期团建、技术成长体系。'
    ].join('\n')
  },
  {
    key: 'sales',
    label: '销售岗模板',
    text: [
      '一、岗位职责',
      '1. 负责目标客户开发与维护，完成销售业绩指标；',
      '2. 挖掘客户需求，制定并推进销售方案；',
      '3. 维护客户关系，提升客户满意度与复购率。',
      '',
      '二、任职要求',
      '1. 具备良好的沟通表达与谈判能力；',
      '2. 有销售相关经验者优先，结果导向、抗压能力强；',
      '3. 认同公司文化，有强烈的目标达成意愿。',
      '',
      '三、员工福利',
      '底薪 + 高提成、五险一金、双休、销售冠军激励。'
    ].join('\n')
  },
  {
    key: 'function',
    label: '职能岗模板',
    text: [
      '一、岗位职责',
      '1. 负责本职能模块的日常运转与流程执行；',
      '2. 协同各部门推进工作落地，输出阶段性成果；',
      '3. 持续优化工作流程，提升协作效率。',
      '',
      '二、任职要求',
      '1. 相关专业背景，工作细致、责任心强；',
      '2. 熟练使用办公软件，具备良好的统筹能力；',
      '3. 沟通顺畅，能适应多任务并行的工作节奏。',
      '',
      '三、员工福利',
      '五险一金、双休、节日福利、带薪年假。'
    ].join('\n')
  }
];

// 三级省市区级联数据源（与编辑弹窗同源）
export const regionOptions = REGIONS.map((province: any) => ({
  label: province.name,
  value: province.name,
  children: (province.cities || []).map((city: any) => ({
    label: city.name,
    value: city.name,
    children: (city.areas || []).map((area: string) => ({
      label: area,
      value: area
    }))
  }))
}));

// 标签译名：value → label
export function labelOf(options: { value: string; label: string }[], value?: string): string {
  if (value == null || value === '') return '';
  return options.find((o) => o.value === String(value))?.label || '';
}
