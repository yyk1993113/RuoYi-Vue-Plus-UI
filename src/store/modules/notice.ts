import { defineStore } from 'pinia';
import { reactive } from 'vue';

interface NoticeItem {
  title?: string;
  read: boolean;
  message: any;
  time: string;
}

export const useNoticeStore = defineStore('notice', () => {
  const state = reactive({
    notices: [] as NoticeItem[],
    todoReadBaseline: 0
  });

  const addNotice = (notice: NoticeItem) => {
    state.notices.push(notice);
  };

  const removeNotice = (notice: NoticeItem) => {
    state.notices.splice(state.notices.indexOf(notice), 1);
  };

  //实现全部已读
  const readAll = (todoTotal = 0) => {
    state.notices.forEach((item: any) => {
      item.read = true;
    });
    state.todoReadBaseline = Math.max(state.todoReadBaseline, Number(todoTotal) || 0);
  };

  const normalizeTodoReadBaseline = (todoTotal = 0) => {
    const total = Number(todoTotal) || 0;
    if (total < state.todoReadBaseline) {
      state.todoReadBaseline = total;
    }
  };

  const clearNotice = () => {
    state.notices = [];
    state.todoReadBaseline = 0;
  };
  return {
    state,
    addNotice,
    removeNotice,
    readAll,
    normalizeTodoReadBaseline,
    clearNotice
  };
});
