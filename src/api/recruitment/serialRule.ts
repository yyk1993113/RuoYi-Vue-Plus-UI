import request from '@/utils/request';

const baseUrl = '/admin/serial-rule';

// 流水编号规则字段与后端 SerialNoRule 对齐；0 表示启用/是，1 表示停用/否。
export interface SerialNoRuleVO {
  ruleId?: string | number;
  businessCode?: string;
  businessName?: string;
  prefix?: string;
  datePattern?: 'yyyyMMdd' | 'yyyyMM' | string;
  seqLength?: number;
  separator?: string;
  checksumEnabled?: string;
  dailyReset?: string;
  status?: string;
  remark?: string;
  previewNo?: string;
  createTime?: string;
  updateTime?: string;
}

export interface SerialNoRuleQuery {
  pageNum?: number;
  pageSize?: number;
  businessCode?: string;
  businessName?: string;
  prefix?: string;
  status?: string;
}

export function listSerialRule(query: SerialNoRuleQuery) {
  return request.get<any>(`${baseUrl}/list`, { params: query });
}

export function getSerialRule(ruleId: string | number) {
  return request.get<SerialNoRuleVO>(`${baseUrl}/${ruleId}`);
}

export function addSerialRule(data: SerialNoRuleVO) {
  return request.post(`${baseUrl}`, data);
}

export function updateSerialRule(data: SerialNoRuleVO) {
  return request.put(`${baseUrl}`, data);
}

export function delSerialRule(ruleIds: Array<string | number> | string | number) {
  const ids = Array.isArray(ruleIds) ? ruleIds.join(',') : ruleIds;
  return request.delete(`${baseUrl}/${ids}`);
}

export function changeSerialRuleStatus(ruleId: string | number, status: string) {
  return request.post(`${baseUrl}/changeStatus`, { ruleId, status });
}

export function previewSerialRule(data: SerialNoRuleVO) {
  return request.post<{ serialNo: string }>(`${baseUrl}/preview`, data);
}

export function nextSerialNo(businessCode: string) {
  return request.post<{ serialNo: string }>(`${baseUrl}/next/${businessCode}`);
}
