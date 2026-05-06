import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

interface Order {
  id: string;
  orderNo: string;
  productName: string;
  productImage: string;
  price: string;
  quantity: number;
  status: 'pending_payment' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  createTime: string;
  payTime?: string;
}

const statusConfig: Record<Order['status'], { label: string; color: string; icon: string }> = {
  pending_payment: { label: '待支付', color: '#FDCB6E', icon: 'time-outline' },
  paid: { label: '已支付', color: '#00F0FF', icon: 'checkmark-circle-outline' },
  shipped: { label: '已发货', color: '#00F0FF', icon: 'airplane-outline' },
  delivered: { label: '已完成', color: '#00FF88', icon: 'checkmark-done-outline' },
  cancelled: { label: '已取消', color: '#FF003C', icon: 'close-circle-outline' },
};

const mockOrders: Order[] = [
  {
    id: '1',
    orderNo: 'JD202412120001',
    productName: 'iPhone 15 Pro Max 256GB 深空黑钛金属',
    productImage: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=200',
    price: '¥9999',
    quantity: 1,
    status: 'pending_payment',
    createTime: '2024-12-12 09:59:30',
  },
  {
    id: '2',
    orderNo: 'JD202412110002',
    productName: 'Apple Watch Series 9 GPS版',
    productImage: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=200',
    price: '¥2999',
    quantity: 1,
    status: 'shipped',
    createTime: '2024-12-11 10:00:15',
    payTime: '2024-12-11 10:00:25',
  },
  {
    id: '3',
    orderNo: 'JD202412100003',
    productName: 'AirPods Pro 2 代',
    productImage: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=200',
    price: '¥1699',
    quantity: 1,
    status: 'delivered',
    createTime: '2024-12-10 10:00:05',
    payTime: '2024-12-10 10:00:12',
  },
];

const tabs = [
  { key: 'all', label: '全部' },
  { key: 'pending_payment', label: '待支付' },
  { key: 'shipped', label: '待收货' },
  { key: 'delivered', label: '已完成' },
];

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('all');
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [activeTab])
  );

  const fetchOrders = async () => {
    try {
      /**
       * 服务端文件：server/src/routes/orders.ts
       * 接口：GET /api/v1/orders
       * Query 参数：status?: string
       */
      const params = activeTab !== 'all' ? `?status=${activeTab}` : '';
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/orders${params}`);
      
      if (!response.ok) throw new Error('获取订单失败');
      
      const data = await response.json();
      setOrders(data.orders || mockOrders);
    } catch (error) {
      // 使用模拟数据
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const filteredOrders = activeTab === 'all'
    ? orders
    : orders.filter(o => o.status === activeTab);

  const handlePay = (order: Order) => {
    // 跳转支付
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <LinearGradient
          colors={['#1A0A0F', '#0A0A0F']}
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.headerTitle}>我的订单</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <LinearGradient
          colors={['#1A0A0F', '#0A0A0F']}
          style={StyleSheet.absoluteFill}
        />
        <View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContent}
          >
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                  {tab.label}
                </Text>
                {activeTab === tab.key && <View style={styles.tabIndicator} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Orders List */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#00F0FF"
            colors={['#FF003C']}
          />
        }
      >
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#333340" />
            <Text style={styles.emptyText}>暂无订单</Text>
            <Text style={styles.emptySubtext}>快去抢购心仪商品吧</Text>
          </View>
        ) : (
          filteredOrders.map((order) => (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <Text style={styles.orderNo}>订单号: {order.orderNo}</Text>
                <View style={[styles.statusBadge, { backgroundColor: `${statusConfig[order.status].color}15` }]}>
                  <Ionicons
                    name={statusConfig[order.status].icon as any}
                    size={14}
                    color={statusConfig[order.status].color}
                  />
                  <Text style={[styles.statusText, { color: statusConfig[order.status].color }]}>
                    {statusConfig[order.status].label}
                  </Text>
                </View>
              </View>

              <View style={styles.orderContent}>
                <Image source={{ uri: order.productImage }} style={styles.productImage} />
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>
                    {order.productName}
                  </Text>
                  <View style={styles.orderMeta}>
                    <Text style={styles.price}>{order.price}</Text>
                    <Text style={styles.quantity}>x{order.quantity}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.orderFooter}>
                <View style={styles.timeInfo}>
                  <Ionicons name="time-outline" size={12} color="#555570" />
                  <Text style={styles.timeText}>
                    {order.status === 'pending_payment' ? `下单: ${order.createTime}` : `支付: ${order.payTime}`}
                  </Text>
                </View>
                {order.status === 'pending_payment' && (
                  <TouchableOpacity style={styles.payButton} onPress={() => handlePay(order)}>
                    <LinearGradient
                      colors={['#FF003C', '#FF4466']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.payButtonGradient}
                    >
                      <Text style={styles.payButtonText}>立即支付</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#EAEAEA',
    letterSpacing: 1,
  },
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,240,255,0.1)',
  },
  tabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 24,
  },
  tab: {
    paddingBottom: 8,
    alignItems: 'center',
  },
  tabActive: {},
  tabText: {
    fontSize: 15,
    color: '#555570',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#EAEAEA',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 24,
    height: 3,
    backgroundColor: '#FF003C',
    borderRadius: 2,
  },
  content: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555570',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#333340',
    marginTop: 8,
  },
  orderCard: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#12121A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,240,255,0.12)',
    overflow: 'hidden',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,240,255,0.05)',
  },
  orderNo: {
    fontSize: 12,
    color: '#555570',
    fontFamily: 'monospace',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
  },
  orderContent: {
    flexDirection: 'row',
    padding: 14,
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#1A1A24',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EAEAEA',
    lineHeight: 20,
  },
  orderMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FF003C',
    fontFamily: 'monospace',
  },
  quantity: {
    fontSize: 13,
    color: '#555570',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,240,255,0.05)',
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    color: '#555570',
  },
  payButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  payButtonGradient: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  payButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
});
