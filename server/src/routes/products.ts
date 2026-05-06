import { Router } from 'express';

const router = Router();

interface ParsedProduct {
  skuId: string;
  name: string;
  price: string;
  originalPrice: string;
  image: string;
  shop: string;
  stock: 'in_stock' | 'out_of_stock' | 'limited';
  promotion?: string;
}

// 解析京东商品链接
router.post('/parse', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Missing URL' });
    }

    // 提取SKU ID
    const skuIdMatch = url.match(/(\d{6,13})/);
    if (!skuIdMatch) {
      return res.status(400).json({ error: 'Invalid JD URL' });
    }

    const skuId = skuIdMatch[1];

    // 实际应调用京东API或爬取页面获取商品信息
    // 这里模拟返回数据
    const mockProducts: Record<string, ParsedProduct> = {
      '100012043478': {
        skuId: '100012043478',
        name: 'iPhone 15 Pro Max 256GB 深空黑钛金属',
        price: '¥9999',
        originalPrice: '¥11999',
        image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400',
        shop: 'Apple官方旗舰店',
        stock: 'in_stock',
        promotion: '限时有优惠',
      },
      '100012044562': {
        skuId: '100012044562',
        name: 'Apple Watch Series 9 GPS版',
        price: '¥2999',
        originalPrice: '¥3999',
        image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400',
        shop: 'Apple官方旗舰店',
        stock: 'limited',
      },
      '100012043892': {
        skuId: '100012043892',
        name: 'AirPods Pro 2 代',
        price: '¥1699',
        originalPrice: '¥1999',
        image: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400',
        shop: 'Apple官方旗舰店',
        stock: 'in_stock',
      },
    };

    // 检查是否有预设的mock数据
    if (mockProducts[skuId]) {
      return res.json(mockProducts[skuId]);
    }

    // 默认返回模拟数据
    res.json({
      skuId,
      name: '京东商品',
      price: '¥999',
      originalPrice: '¥1299',
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
      shop: '京东自营店',
      stock: 'in_stock',
    });
  } catch (error) {
    console.error('Parse error:', error);
    res.status(500).json({ error: 'Failed to parse URL' });
  }
});

// 获取商品详情
router.get('/:skuId', async (req, res) => {
  try {
    const { skuId } = req.params;

    // 实际应调用京东API获取商品详情
    res.json({
      skuId,
      name: '京东商品',
      price: '¥999',
      originalPrice: '¥1299',
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
      shop: '京东自营店',
      stock: 'in_stock',
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to get product' });
  }
});

// 获取商品库存
router.get('/:skuId/stock', async (req, res) => {
  try {
    const { skuId } = req.params;
    const { addressId } = req.query;

    // 实际应调用京东API获取实时库存
    res.json({
      skuId,
      stock: Math.random() > 0.3 ? 'in_stock' : 'out_of_stock',
      deliveryTime: '1-3天',
    });
  } catch (error) {
    console.error('Get stock error:', error);
    res.status(500).json({ error: 'Failed to get stock' });
  }
});

export default router;
