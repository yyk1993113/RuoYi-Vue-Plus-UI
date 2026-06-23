import { getToken } from '@/utils/auth';
import { useNoticeStore } from '@/store/modules/notice';

const buildRealtimeAuthUrl = (url: string) => {
  const params = new URLSearchParams({
    Authorization: `Bearer ${getToken() || ''}`,
    clientid: import.meta.env.VITE_APP_CLIENT_ID || ''
  });
  return `${url}${url.includes('?') ? '&' : '?'}${params.toString()}`;
};

// 初始化socket
export const initWebSocket = (url: any) => {
  if (import.meta.env.VITE_APP_WEBSOCKET === 'false') {
    return;
  }
  if (!getToken()) {
    return;
  }
  url = buildRealtimeAuthUrl(url);
  useWebSocket(url, {
    autoReconnect: {
      // 重连最大次数
      retries: 3,
      // 重连间隔
      delay: 1000,
      onFailed() {
        console.log('websocket重连失败');
      }
    },
    heartbeat: {
      message: 'ping',
      // 发送心跳的间隔
      interval: 10000,
      // 接收到心跳response的超时时间
      pongTimeout: 2000
    },
    onConnected() {
      console.log('websocket已经连接');
    },
    onDisconnected() {
      console.log('websocket已经断开');
    },
    onMessage: (_, e) => {
      if (e.data === 'pong') {
        return;
      }
      useNoticeStore().addNotice({
        message: e.data,
        read: false,
        time: new Date().toLocaleString()
      });
    }
  });
};
