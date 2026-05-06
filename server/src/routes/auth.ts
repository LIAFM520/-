import { Router } from 'express';

const router = Router();

// 存储登录状态的内存缓存（生产环境应使用Redis）
const loginTokens = new Map<string, {
  status: 'pending' | 'scanned' | 'confirmed' | 'expired';
  qrcode: string;
  userId?: string;
  createdAt: number;
}>();

// 生成二维码
router.post('/qrcode', (req, res) => {
  const token = `JD_LOGIN_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  const qrcode = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(token)}`;
  
  loginTokens.set(token, {
    status: 'pending',
    qrcode,
    createdAt: Date.now(),
  });

  // 15分钟过期
  setTimeout(() => {
    const tokenData = loginTokens.get(token);
    if (tokenData && tokenData.status === 'pending') {
      tokenData.status = 'expired';
    }
  }, 15 * 60 * 1000);

  res.json({ token, qrcode });
});

// 获取登录状态 (SSE流式)
router.get('/login-status', (req, res) => {
  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Missing token' });
  }

  const tokenData = loginTokens.get(token);
  if (!tokenData) {
    return res.status(404).json({ error: 'Token not found' });
  }

  // SSE响应头设置
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-store, no-transform, must-revalidate');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  const sendStatus = () => {
    if (tokenData.status === 'confirmed') {
      res.write(`data: ${JSON.stringify({ status: 'confirmed', userId: tokenData.userId })}\n\n`);
      res.write(`data: [DONE]\n\n`);
      loginTokens.delete(token);
      return true;
    } else if (tokenData.status === 'expired') {
      res.write(`data: ${JSON.stringify({ status: 'expired' })}\n\n`);
      res.write(`data: [DONE]\n\n`);
      loginTokens.delete(token);
      return true;
    }
    return false;
  };

  // 立即发送初始状态
  res.write(`data: ${JSON.stringify({ status: tokenData.status })}\n\n`);

  // 轮询状态变化（实际生产环境应使用WebSocket或更高效的推送机制）
  const interval = setInterval(() => {
    const done = sendStatus();
    if (done) {
      clearInterval(interval);
      res.end();
    }
  }, 1000);

  // 30秒超时
  setTimeout(() => {
    clearInterval(interval);
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ status: 'expired' })}\n\n`);
      res.write(`data: [DONE]\n\n`);
      res.end();
    }
    loginTokens.delete(token);
  }, 30000);

  req.on('close', () => {
    clearInterval(interval);
    loginTokens.delete(token);
  });
});

// 模拟扫码回调（京东APP扫码后调用）
router.post('/scan-callback', (req, res) => {
  const { token, action } = req.body;

  if (!token || !loginTokens.has(token)) {
    return res.status(404).json({ error: 'Token not found' });
  }

  const tokenData = loginTokens.get(token)!;

  if (action === 'scan') {
    tokenData.status = 'scanned';
  } else if (action === 'confirm') {
    tokenData.status = 'confirmed';
    tokenData.userId = `user_${Date.now()}`;
  }

  res.json({ success: true });
});

// 获取当前登录用户
router.get('/me', (req, res) => {
  // 实际应从session/token中获取用户信息
  const userId = req.headers['x-user-id'];
  
  if (!userId) {
    return res.status(401).json({ error: 'Not logged in' });
  }

  res.json({
    userId,
    nickname: '京东用户',
    avatar: '',
  });
});

// 退出登录
router.post('/logout', (req, res) => {
  res.json({ success: true });
});

export default router;
