import express from "express";
import cors from "cors";

// 路由
import authRoutes from "./routes/auth.js";
import productsRoutes from "./routes/products.js";
import rushRoutes from "./routes/rush.js";
import ordersRoutes from "./routes/orders.js";

const app = express();
const port = process.env.PORT || 9091;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 健康检查
app.get('/api/v1/health', (req, res) => {
  console.log('Health check success');
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 认证相关路由
app.use('/api/v1/auth', authRoutes);

// 商品相关路由
app.use('/api/v1/products', productsRoutes);

// 代抢相关路由
app.use('/api/v1/rush', rushRoutes);

// 订单相关路由
app.use('/api/v1/orders', ordersRoutes);

// 404处理
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// 错误处理
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}/`);
  console.log(`API endpoints:`);
  console.log(`  - GET  /api/v1/health`);
  console.log(`  - POST /api/v1/auth/qrcode`);
  console.log(`  - GET  /api/v1/auth/login-status`);
  console.log(`  - POST /api/v1/products/parse`);
  console.log(`  - POST /api/v1/rush/start`);
  console.log(`  - POST /api/v1/rush/execute`);
  console.log(`  - GET  /api/v1/orders`);
});
