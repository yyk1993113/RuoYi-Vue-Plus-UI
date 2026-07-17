export type PromoterPostCategoryCode = '0' | '1' | '2';

/** 岗位类别编码与渠道推广身份共用同一套编码，避免两个页面的筛选口径漂移。 */
export const promoterPostCategoryOptions = [
  { label: '内部渠道', value: '0' },
  { label: '外部渠道', value: '1' },
  { label: '合伙人', value: '2' }
] as const;

const promoterPostCategoryLabelMap = Object.fromEntries(promoterPostCategoryOptions.map((item) => [item.value, item.label]));

export function promoterPostCategoryLabel(value?: string) {
  return (value && promoterPostCategoryLabelMap[value]) || value || '-';
}
