import { Router } from 'express';

const router = Router();

interface RushTask {
  id: string;
  skuId: string;
  productName: string;
  productImage: string;
  price: string;
  quantity: number;
  rushTime: string;
  addressId: string;
  status: 'waiting' | 'preparing' | 'rushing' | 'success' | 'failed';
  userId: string;
  createdAt: number;
}

// 内存存储（生产环境应使用数据库）
const rushTasks = new Map<string, RushTask>();

// 创建代抢任务
router.post('/start', async (req, res) => {
  try {
    const { skuId, quantity, rushTime, addressId } = req.body;
    const userId = String(req.headers['x-user-id'] || 'demo_user');

    if (!skuId || !rushTime) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const taskId = `rush_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const task: RushTask = {
      id: taskId,
      skuId,
      productName: '京东商品',
      productImage: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
      price: '¥999',
      quantity: quantity || 1,
      rushTime,
      addressId: addressId || '1',
      status: 'waiting',
      userId,
      createdAt: Date.now(),
    };

    rushTasks.set(taskId, task);

    // 计算距抢购时间，提前5秒进入准备状态
    const rushTimestamp = new Date(rushTime).getTime();
    const now = Date.now();
    const prepareDelay = rushTimestamp - now - 5000;

    if (prepareDelay > 0) {
      setTimeout(() => {
        const t = rushTasks.get(taskId);
        if (t && t.status === 'waiting') {
          t.status = 'preparing';
        }
      }, prepareDelay);
    }

    res.json({
      success: true,
      taskId,
      task,
    });
  } catch (error) {
    console.error('Start rush error:', error);
    res.status(500).json({ error: 'Failed to create rush task' });
  }
});

// 执行抢购
router.post('/execute', async (req, res) => {
  try {
    const { taskId } = req.body;

    const task = rushTasks.get(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    task.status = 'rushing';

    // 模拟抢购结果（实际应调用京东下单API）
    // 成功率受库存、并发等因素影响
    const successRate = 0.3; // 30%成功率模拟
    const isSuccess = Math.random() < successRate;

    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    if (isSuccess) {
      task.status = 'success';
      res.json({
        success: true,
        message: '抢购成功',
        orderId: `JD${Date.now()}`,
        orderNo: `JD${Date.now()}`,
      });
    } else {
      task.status = 'failed';
      res.json({
        success: false,
        message: '手速慢了一步，商品已被抢完',
      });
    }
  } catch (error) {
    console.error('Execute rush error:', error);
    res.status(500).json({ error: 'Failed to execute rush' });
  }
});

// 获取任务状态
router.get('/status/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = rushTasks.get(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({
      taskId: task.id,
      status: task.status,
      rushTime: task.rushTime,
    });
  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

// 取消代抢任务
router.post('/cancel', async (req, res) => {
  try {
    const { taskId } = req.body;

    const task = rushTasks.get(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (task.status === 'rushing' || task.status === 'success') {
      return res.status(400).json({ error: 'Cannot cancel this task' });
    }

    task.status = 'failed';
    res.json({ success: true });
  } catch (error) {
    console.error('Cancel rush error:', error);
    res.status(500).json({ error: 'Failed to cancel task' });
  }
});

// 获取用户的代抢任务列表
router.get('/tasks', async (req, res) => {
  try {
    const userId = String(req.headers['x-user-id'] || 'demo_user');

    const tasks = Array.from(rushTasks.values())
      .filter(t => t.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt);

    res.json({ tasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Failed to get tasks' });
  }
});

export default router;
