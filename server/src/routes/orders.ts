import { Router } from 'express';

const router = Router();

interface Order {
  id: string;
  orderNo: string;
  orderId: string;
  skuId: string;
  productName: string;
  productImage: string;
  price: string;
  quantity: number;
  totalPrice: string;
  status: 'pending_payment' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  address: {
    name: string;
    phone: string;
    address: string;
  };
  createTime: string;
  payTime?: string;
  shipTime?: string;
  deliverTime?: string;
  userId: string;
}

// 内存存储（生产环境应使用数据库）
const orders = new Map<string, Order>();

// 初始化一些mock订单
const mockOrders: Order[] = [
  {
    id: '1',
    orderNo: 'JD202412120001',
    orderId: 'JD202412120001',
    skuId: '100012043478',
    productName: 'iPhone 15 Pro Max 256GB 深空黑钛金属',
    productImage: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=200',
    price: '¥9999',
    quantity: 1,
    totalPrice: '¥9999',
    status: 'pending_payment',
    address: {
      name: '张三',
      phone: '138****8888',
      address: '北京市朝阳区建国路88号SOHO现代城',
    },
    createTime: '2024-12-12 09:59:30',
    userId: 'demo_user',
  },
  {
    id: '2',
    orderNo: 'JD202412110002',
    orderId: 'JD202412110002',
    skuId: '100012044562',
    productName: 'Apple Watch Series 9 GPS版',
    productImage: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=200',
    price: '¥2999',
    quantity: 1,
    totalPrice: '¥2999',
    status: 'shipped',
    address: {
      name: '张三',
      phone: '138****8888',
      address: '北京市朝阳区建国路88号SOHO现代城',
    },
    createTime: '2024-12-11 10:00:15',
    payTime: '2024-12-11 10:00:25',
    shipTime: '2024-12-11 15:30:00',
    userId: 'demo_user',
  },
  {
    id: '3',
    orderNo: 'JD202412100003',
    orderId: 'JD202412100003',
    skuId: '100012043892',
    productName: 'AirPods Pro 2 代',
    productImage: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=200',
    price: '¥1699',
    quantity: 1,
    totalPrice: '¥1699',
    status: 'delivered',
    address: {
      name: '张三',
      phone: '138****8888',
      address: '北京市朝阳区建国路88号SOHO现代城',
    },
    createTime: '2024-12-10 10:00:05',
    payTime: '2024-12-10 10:00:12',
    shipTime: '2024-12-10 14:00:00',
    deliverTime: '2024-12-12 09:30:00',
    userId: 'demo_user',
  },
];

mockOrders.forEach(order => orders.set(order.id, order));

// 获取订单列表
router.get('/', async (req, res) => {
  try {
    const userId = String(req.headers['x-user-id'] || 'demo_user');
    const { status } = req.query;

    let orderList = Array.from(orders.values())
      .filter(o => o.userId === userId);

    if (status && typeof status === 'string') {
      orderList = orderList.filter(o => o.status === status);
    }

    // 按创建时间倒序
    orderList.sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime());

    res.json({
      orders: orderList,
      total: orderList.length,
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to get orders' });
  }
});

// 获取订单详情
router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = orders.get(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ order });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to get order' });
  }
});

// 取消订单
router.post('/:orderId/cancel', async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = orders.get(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'pending_payment') {
      return res.status(400).json({ error: 'Cannot cancel this order' });
    }

    order.status = 'cancelled';
    res.json({ success: true });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

// 确认收货
router.post('/:orderId/confirm', async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = orders.get(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'shipped') {
      return res.status(400).json({ error: 'Cannot confirm this order' });
    }

    order.status = 'delivered';
    order.deliverTime = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
    res.json({ success: true });
  } catch (error) {
    console.error('Confirm order error:', error);
    res.status(500).json({ error: 'Failed to confirm order' });
  }
});

export default router;
