import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useSafeRouter } from '@/hooks/useSafeRouter';

interface RushTask {
  id: string;
  productName: string;
  productImage: string;
  price: string;
  originalPrice: string;
  rushTime: string;
  status: 'waiting' | 'rushing' | 'success' | 'failed';
  skuId: string;
}

const mockTasks: RushTask[] = [
  {
    id: '1',
    productName: 'iPhone 15 Pro Max 256GB 深空黑',
    productImage: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=200',
    price: '¥9999',
    originalPrice: '¥11999',
    rushTime: '2024-12-12 10:00:00',
    status: 'waiting',
    skuId: '100012043478',
  },
  {
    id: '2',
    productName: 'Apple Watch Series 9 GPS版',
    productImage: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=200',
    price: '¥2999',
    originalPrice: '¥3999',
    rushTime: '2024-12-12 10:00:00',
    status: 'rushing',
    skuId: '100012044562',
  },
  {
    id: '3',
    productName: 'AirPods Pro 2 代',
    productImage: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=200',
    price: '¥1699',
    originalPrice: '¥1999',
    rushTime: '2024-12-11 20:00:00',
    status: 'success',
    skuId: '100012043892',
  },
];

const statusColors: Record<RushTask['status'], string> = {
  waiting: '#FDCB6E',
  rushing: '#00F0FF',
  success: '#00FF88',
  failed: '#FF003C',
};

const statusLabels: Record<RushTask['status'], string> = {
  waiting: '待开始',
  rushing: '抢购中',
  success: '已抢到',
  failed: '已失败',
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useSafeRouter();
  const [tasks, setTasks] = useState<RushTask[]>(mockTasks);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total: 12,
    success: 3,
    pending: 5,
    failed: 4,
  });

  useFocusEffect(
    useCallback(() => {
      // 刷新数据
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const getStatusIcon = (status: RushTask['status']) => {
    switch (status) {
      case 'waiting':
        return 'time-outline';
      case 'rushing':
        return 'flash';
      case 'success':
        return 'checkmark-circle';
      case 'failed':
        return 'close-circle';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <LinearGradient
          colors={['#1A0A0F', '#0A0A0F']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>京东代抢</Text>
            <Text style={styles.headerSubtitle}>智能抢购 · 极速下单</Text>
          </View>
          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => router.push('/login')}
          >
            <Ionicons name="qr-code-outline" size={28} color="#FF003C" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <LinearGradient
          colors={['rgba(255,0,60,0.15)', 'rgba(0,240,255,0.08)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.statsGradient}
        />
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>总任务</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#00FF88' }]}>{stats.success}</Text>
            <Text style={styles.statLabel}>成功</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#FDCB6E' }]}>{stats.pending}</Text>
            <Text style={styles.statLabel}>待开始</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#FF003C' }]}>{stats.failed}</Text>
            <Text style={styles.statLabel}>失败</Text>
          </View>
        </View>
      </View>

      {/* Quick Action */}
      <View style={styles.quickAction}>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => router.push('/(tabs)/parse')}
        >
          <LinearGradient
            colors={['#FF003C', '#FF4466']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.quickActionGradient}
          >
            <Ionicons name="flash" size={24} color="#FFFFFF" />
            <Text style={styles.quickActionText}>添加代抢</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Tasks List */}
      <ScrollView
        style={styles.tasksContainer}
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
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>代抢任务</Text>
          <Text style={styles.sectionCount}>{tasks.length} 个任务</Text>
        </View>

        {tasks.map((task) => (
          <TouchableOpacity
            key={task.id}
            style={styles.taskCard}
            onPress={() => router.push('/product', {
              id: task.id,
              skuId: task.skuId,
              name: task.productName,
              price: task.price,
              image: task.productImage,
            })}
          >
            <View style={styles.taskCardInner}>
              <Image source={{ uri: task.productImage }} style={styles.productImage} />
              <View style={styles.taskInfo}>
                <Text style={styles.productName} numberOfLines={2}>{task.productName}</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.price}>{task.price}</Text>
                  <Text style={styles.originalPrice}>{task.originalPrice}</Text>
                </View>
                <View style={styles.timeRow}>
                  <Ionicons name="time-outline" size={14} color="#555570" />
                  <Text style={styles.rushTime}>{task.rushTime}</Text>
                </View>
              </View>
              <View style={styles.statusContainer}>
                <View style={[styles.statusBadge, { backgroundColor: `${statusColors[task.status]}20` }]}>
                  <Ionicons
                    name={getStatusIcon(task.status) as any}
                    size={16}
                    color={statusColors[task.status]}
                  />
                  <Text style={[styles.statusText, { color: statusColors[task.status] }]}>
                    {statusLabels[task.status]}
                  </Text>
                </View>
              </View>
            </View>
            {task.status === 'rushing' && (
              <View style={styles.rushingIndicator}>
                <LinearGradient
                  colors={['#00F0FF', '#00FF88']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.rushingGradient}
                />
              </View>
            )}
          </TouchableOpacity>
        ))}
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
    backgroundColor: '#0A0A0F',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#EAEAEA',
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#555570',
    marginTop: 4,
    letterSpacing: 1,
  },
  scanButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,0,60,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,0,60,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    backgroundColor: '#12121A',
    borderWidth: 1,
    borderColor: 'rgba(0,240,255,0.12)',
    overflow: 'hidden',
  },
  statsGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  statsRow: {
    flexDirection: 'row',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#EAEAEA',
    fontFamily: 'monospace',
  },
  statLabel: {
    fontSize: 11,
    color: '#555570',
    marginTop: 4,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(0,240,255,0.1)',
    marginVertical: 4,
  },
  quickAction: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  quickActionButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  quickActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  quickActionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  tasksContainer: {
    flex: 1,
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EAEAEA',
    letterSpacing: 1,
  },
  sectionCount: {
    fontSize: 12,
    color: '#555570',
    letterSpacing: 1,
  },
  taskCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#12121A',
    borderWidth: 1,
    borderColor: 'rgba(0,240,255,0.12)',
    overflow: 'hidden',
  },
  taskCardInner: {
    flexDirection: 'row',
    padding: 14,
    alignItems: 'center',
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#1A1A24',
  },
  taskInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EAEAEA',
    lineHeight: 20,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FF003C',
    fontFamily: 'monospace',
  },
  originalPrice: {
    fontSize: 12,
    color: '#555570',
    textDecorationLine: 'line-through',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  rushTime: {
    fontSize: 12,
    color: '#555570',
  },
  statusContainer: {
    marginLeft: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
  },
  rushingIndicator: {
    height: 3,
    overflow: 'hidden',
  },
  rushingGradient: {
    height: 3,
    width: '60%',
  },
});
