import request from '@/utils/request';
import { NoticeForm, NoticePushHistoryQuery, NoticePushHistoryStatistics, NoticePushHistoryVO, NoticeQuery, NoticeVO } from './types';
import { AxiosPromise } from 'axios';
// 查询公告列表
export function listNotice(query: NoticeQuery): AxiosPromise<NoticeVO[]> {
  return request({
    url: '/system/notice/list',
    method: 'get',
    params: query
  });
}

// 查询公告详细
export function getNotice(noticeId: string | number): AxiosPromise<NoticeVO> {
  return request({
    url: '/system/notice/' + noticeId,
    method: 'get'
  });
}

// 新增公告
export function addNotice(data: NoticeForm | Record<string, any>) {
  return request({
    url: '/system/notice',
    method: 'post',
    data: data
  });
}

// 新增周期数据推送
export function addPeriodNotice(data: NoticeForm | Record<string, any>) {
  return request({
    url: '/system/notice/period',
    method: 'post',
    data: data
  });
}

// 修改公告
export function updateNotice(data: NoticeForm | Record<string, any>) {
  return request({
    url: '/system/notice',
    method: 'put',
    data: data
  });
}

// 删除公告
export function delNotice(noticeId: string | number | Array<string | number>) {
  return request({
    url: '/system/notice/' + noticeId,
    method: 'delete'
  });
}

// 撤回已发布公告，后端限制发布时间 5 分钟内可撤回
export function withdrawNotice(noticeId: string | number, withdrawReason?: string) {
  return request({
    url: '/system/notice/withdraw/' + noticeId,
    method: 'put',
    data: { withdrawReason }
  });
}

// 撤回后重新发送；如存在未来定时发布时间，后端按定时任务发布
export function resendNotice(noticeId: string | number) {
  return request({
    url: '/system/notice/resend/' + noticeId,
    method: 'post'
  });
}

// 终止周期数据推送
export function stopPeriodNotice(noticeId: string | number) {
  return request({
    url: '/system/notice/period/stop/' + noticeId,
    method: 'put'
  });
}

// 暂停或恢复周期数据推送
export function updatePeriodNoticeStatus(noticeId: string | number, periodStatus: 'running' | 'paused') {
  return request({
    url: '/system/notice/period/status/' + noticeId,
    method: 'put',
    data: { periodStatus }
  });
}

// 立即执行一次周期推送，不改变自动任务开关
export function pushPeriodNoticeNow(noticeId: string | number) {
  return request({
    url: '/system/notice/period/push-now/' + noticeId,
    method: 'post'
  });
}

// 批量立即执行周期推送
export function pushPeriodNoticesNow(noticeIds: Array<string | number>) {
  return request({
    url: '/system/notice/period/push-now/batch',
    method: 'post',
    data: noticeIds
  });
}

// 推送历史完全读取独立审计表，不与通知公告列表接口混用。
export function listNoticePushHistory(query: NoticePushHistoryQuery) {
  return request<any, { rows: NoticePushHistoryVO[]; total: number }>({
    url: '/system/notice/push-history/list',
    method: 'get',
    params: query
  });
}

export function getNoticePushHistory(historyId: string | number) {
  return request<any, { data: NoticePushHistoryVO }>({
    url: `/system/notice/push-history/${historyId}`,
    method: 'get'
  });
}

export function getNoticePushHistoryStatistics() {
  return request<any, { data: NoticePushHistoryStatistics }>({
    url: '/system/notice/push-history/statistics',
    method: 'get'
  });
}
