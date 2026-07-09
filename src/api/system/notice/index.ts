import request from '@/utils/request';
import { NoticeForm, NoticeQuery, NoticeVO } from './types';
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
