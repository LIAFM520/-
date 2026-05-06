import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

interface RushConfig {
  skuId: string;
  quantity: number;
  rushTime: Date;
  addressId: string;
  payType?: 'online' | 'cod';
}

const mockAddresses = [
  { id: '1', name: '张三', phone: '138****8888', address: '北京市朝阳区建国路88号SOHO现代城', isDefault: true },
  { id: '2', name: '李四', phone: '139****9999', address: '上海市浦东新区世纪大道100号', isDefault: false },
];

export default function ProductScreen() {
  const insets = useSafeAreaInsets();
  const router = useSafeRouter();
  const params = useSafeSearchParams<{
    id?: string;
    skuId: string;
    name: string;
    price: string;
    image: string;
    shop?: string;
  }>();

  const [rushConfig, setRushConfig] = useState<RushConfig>({
    skuId: params.skuId || '',
    quantity: 1,
    rushTime: new Date(Date.now() + 3600000), // 默认1小时后
    addressId: '1',
  });
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showAddressPicker, setShowAddressPicker] = useState(false);
  const [isRushing, setIsRushing] = useState(false);
  const [rushStatus, setRushStatus] = useState<'idle' | 'preparing' | 'rushing' | 'success' | 'failed'>('idle');
  const rushTimerRef = useRef<NodeJS.Timeout | null>(null);

  const selectedAddress = mockAddresses.find(a => a.id === rushConfig.addressId) || mockAddresses[0];

  useEffect(() => {
    return () => {
      if (rushTimerRef.current) {
        clearInterval(rushTimerRef.current);
      }
    };
  }, []);

  const handleTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowTimePicker(false);
    if (event.type === 'set' && selectedDate) {
      setRushConfig(prev => ({ ...prev, rushTime: selectedDate }));
    }
  };

  const formatTime = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
  };

  const getTimeUntilRush = () => {
    const now = new Date();
    const diff = rushConfig.rushTime.getTime() - now.getTime();
    if (diff <= 0) return '00:00:00';
    
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const handleStartRush = async () => {
    if (!params.skuId) {
      Alert.alert('错误', '商品信息不完整');
      return;
    }

    setIsRushing(true);
    setRushStatus('preparing');

    try {
      /**
       * 服务端文件：server/src/routes/rush.ts
       * 接口：POST /api/v1/rush/start
       * Body 参数：skuId: string, quantity: number, rushTime: string, addressId: string
       */
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/rush/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skuId: rushConfig.skuId,
          quantity: rushConfig.quantity,
          rushTime: formatTime(rushConfig.rushTime),
          addressId: rushConfig.addressId,
        }),
      });

      if (!response.ok) throw new Error('创建代抢任务失败');
      
      const data = await response.json();
      setRushStatus('rushing');
      
      // 开始倒计时
      startRushCountdown(data.taskId);
    } catch (error) {
      // 模拟成功（演示用）
      setRushStatus('rushing');
      startRushCountdown('mock-task-123');
    }
  };

  const startRushCountdown = (taskId: string) => {
    const checkRushTime = () => {
      const now = new Date();
      const diff = rushConfig.rushTime.getTime() - now.getTime();
      
      if (diff <= 100 && diff > -1000) {
        // 到达抢购时间
        setRushStatus('rushing');
        performRush(taskId);
        if (rushTimerRef.current) {
          clearInterval(rushTimerRef.current);
        }
      }
    };

    rushTimerRef.current = setInterval(checkRushTime, 100);
  };

  const performRush = async (taskId: string) => {
    try {
      /**
       * 服务端文件：server/src/routes/rush.ts
       * 接口：POST /api/v1/rush/execute
       * Body 参数：taskId: string
       */
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/rush/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId }),
      });

      const data = await response.json();
      if (data.success) {
        setRushStatus('success');
        Alert.alert('抢购成功', '商品已成功下单，请前往京东APP完成支付', [
          { text: '查看订单', onPress: () => router.push('/(tabs)/orders') },
          { text: '确定' },
        ]);
      } else {
        setRushStatus('failed');
        Alert.alert('抢购失败', data.message || '手速慢了一步，下次更快一些~');
      }
    } catch (error) {
      // 模拟结果（演示用）
      setTimeout(() => {
        const success = Math.random() > 0.5;
        if (success) {
          setRushStatus('success');
          Alert.alert('抢购成功', '商品已成功下单，请前往京东APP完成支付', [
            { text: '查看订单', onPress: () => router.push('/(tabs)/orders') },
            { text: '确定' },
          ]);
        } else {
          setRushStatus('failed');
          Alert.alert('抢购失败', '手速慢了一步，下次更快一些~');
        }
      }, 2000);
    }
  };

  const handleCancelRush = () => {
    if (rushTimerRef.current) {
      clearInterval(rushTimerRef.current);
    }
    setIsRushing(false);
    setRushStatus('idle');
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Product Info */}
        <View style={styles.productCard}>
          <Image source={{ uri: params.image }} style={styles.productImage} />
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{params.name}</Text>
            <View style={styles.priceRow}>
              <Text style={styles.price}>{params.price}</Text>
              {params.shop && (
                <View style={styles.shopRow}>
                  <Ionicons name="storefront-outline" size={12} color="#555570" />
                  <Text style={styles.shopName}>{params.shop}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Rush Status */}
        {rushStatus !== 'idle' && (
          <View style={styles.statusCard}>
            <LinearGradient
              colors={
                rushStatus === 'success'
                  ? ['rgba(0,255,136,0.15)', 'rgba(0,255,136,0.05)']
                  : rushStatus === 'failed'
                  ? ['rgba(255,0,60,0.15)', 'rgba(255,0,60,0.05)']
                  : ['rgba(0,240,255,0.15)', 'rgba(0,240,255,0.05)']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.statusGradient}
            />
            <View style={styles.statusContent}>
              {rushStatus === 'preparing' && (
                <>
                  <Ionicons name="hourglass-outline" size={24} color="#00F0FF" />
                  <Text style={styles.statusText}>等待抢购开始...</Text>
                </>
              )}
              {rushStatus === 'rushing' && (
                <>
                  <Ionicons name="flash" size={24} color="#00F0FF" />
                  <Text style={styles.statusText}>正在抢购中...</Text>
                </>
              )}
              {rushStatus === 'success' && (
                <>
                  <Ionicons name="checkmark-circle" size={24} color="#00FF88" />
                  <Text style={[styles.statusText, { color: '#00FF88' }]}>抢购成功！</Text>
                </>
              )}
              {rushStatus === 'failed' && (
                <>
                  <Ionicons name="close-circle" size={24} color="#FF003C" />
                  <Text style={[styles.statusText, { color: '#FF003C' }]}>抢购失败</Text>
                </>
              )}
            </View>
          </View>
        )}

        {/* Rush Config */}
        {!isRushing && (
          <>
            {/* Quantity */}
            <View style={styles.configCard}>
              <Text style={styles.configTitle}>购买数量</Text>
              <View style={styles.quantityRow}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => setRushConfig(prev => ({ ...prev, quantity: Math.max(1, prev.quantity - 1) }))}
                >
                  <Ionicons name="remove" size={20} color="#EAEAEA" />
                </TouchableOpacity>
                <View style={styles.quantityDisplay}>
                  <Text style={styles.quantityText}>{rushConfig.quantity}</Text>
                </View>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => setRushConfig(prev => ({ ...prev, quantity: Math.min(5, prev.quantity + 1) }))}
                >
                  <Ionicons name="add" size={20} color="#EAEAEA" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Rush Time */}
            <TouchableOpacity
              style={styles.configCard}
              onPress={() => setShowTimePicker(true)}
            >
              <View style={styles.configHeader}>
                <View style={styles.configLabel}>
                  <Ionicons name="time-outline" size={18} color="#FF003C" />
                  <Text style={styles.configTitle}>抢购时间</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#555570" />
              </View>
              <Text style={styles.rushTimeText}>{formatTime(rushConfig.rushTime)}</Text>
            </TouchableOpacity>

            {/* Address */}
            <TouchableOpacity
              style={styles.configCard}
              onPress={() => setShowAddressPicker(true)}
            >
              <View style={styles.configHeader}>
                <View style={styles.configLabel}>
                  <Ionicons name="location-outline" size={18} color="#FF003C" />
                  <Text style={styles.configTitle}>收货地址</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#555570" />
              </View>
              <View style={styles.addressInfo}>
                <Text style={styles.addressName}>{selectedAddress.name} {selectedAddress.phone}</Text>
                <Text style={styles.addressText} numberOfLines={1}>{selectedAddress.address}</Text>
              </View>
            </TouchableOpacity>

            {/* Countdown Display */}
            <View style={styles.countdownCard}>
              <Text style={styles.countdownLabel}>距抢购开始</Text>
              <Text style={styles.countdownText}>{getTimeUntilRush()}</Text>
            </View>
          </>
        )}

        {/* Rush Result */}
        {isRushing && rushStatus !== 'idle' && (
          <View style={styles.resultCard}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancelRush}>
              <Text style={styles.cancelButtonText}>取消任务</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Bottom Action */}
      {!isRushing && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity style={styles.startButton} onPress={handleStartRush}>
            <LinearGradient
              colors={['#FF003C', '#FF4466']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.startButtonGradient}
            >
              <Ionicons name="flash" size={22} color="#FFFFFF" />
              <Text style={styles.startButtonText}>开始代抢</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Time Picker Modal */}
      {showTimePicker && (
        <DateTimePicker
          value={rushConfig.rushTime}
          mode="datetime"
          display="spinner"
          onChange={handleTimeChange}
          minimumDate={new Date()}
          textColor="#EAEAEA"
        />
      )}

      {/* Address Picker Modal */}
      <Modal
        visible={showAddressPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddressPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAddressPicker(false)}
        >
          <View style={[styles.addressPicker, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>选择收货地址</Text>
              <TouchableOpacity onPress={() => setShowAddressPicker(false)}>
                <Ionicons name="close" size={24} color="#EAEAEA" />
              </TouchableOpacity>
            </View>
            {mockAddresses.map((addr) => (
              <TouchableOpacity
                key={addr.id}
                style={[
                  styles.addressItem,
                  addr.id === rushConfig.addressId && styles.addressItemSelected,
                ]}
                onPress={() => {
                  setRushConfig(prev => ({ ...prev, addressId: addr.id }));
                  setShowAddressPicker(false);
                }}
              >
                <View style={styles.addressDetail}>
                  <Text style={styles.addressItemName}>{addr.name} {addr.phone}</Text>
                  <Text style={styles.addressItemText}>{addr.address}</Text>
                </View>
                {addr.id === rushConfig.addressId && (
                  <Ionicons name="checkmark-circle" size={22} color="#FF003C" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  content: {
    flex: 1,
  },
  productCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#12121A',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,240,255,0.12)',
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#1A1A24',
  },
  productInfo: {
    flex: 1,
    marginLeft: 14,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#EAEAEA',
    lineHeight: 22,
  },
  priceRow: {
    marginTop: 8,
  },
  price: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FF003C',
    fontFamily: 'monospace',
  },
  shopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  shopName: {
    fontSize: 12,
    color: '#555570',
  },
  statusCard: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: '#12121A',
    borderWidth: 1,
    overflow: 'hidden',
  },
  statusGradient: {
    height: 3,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00F0FF',
    letterSpacing: 1,
  },
  configCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    backgroundColor: '#12121A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,240,255,0.12)',
  },
  configHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  configLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  configTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EAEAEA',
    letterSpacing: 1,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 16,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0A0A0F',
    borderWidth: 1,
    borderColor: 'rgba(0,240,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityDisplay: {
    minWidth: 60,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#0A0A0F',
    borderRadius: 8,
  },
  quantityText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#EAEAEA',
    fontFamily: 'monospace',
  },
  rushTimeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00F0FF',
    marginTop: 10,
    fontFamily: 'monospace',
  },
  addressInfo: {
    marginTop: 10,
  },
  addressName: {
    fontSize: 14,
    color: '#EAEAEA',
    fontWeight: '600',
  },
  addressText: {
    fontSize: 13,
    color: '#555570',
    marginTop: 4,
  },
  countdownCard: {
    marginHorizontal: 16,
    marginTop: 20,
    padding: 24,
    backgroundColor: '#12121A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,0,60,0.3)',
    alignItems: 'center',
  },
  countdownLabel: {
    fontSize: 13,
    color: '#555570',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  countdownText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FF003C',
    marginTop: 8,
    fontFamily: 'monospace',
    letterSpacing: 4,
  },
  resultCard: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  cancelButton: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,0,60,0.3)',
  },
  cancelButtonText: {
    fontSize: 15,
    color: '#FF003C',
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: '#0A0A0F',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,240,255,0.1)',
  },
  startButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  addressPicker: {
    backgroundColor: '#12121A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,240,255,0.1)',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#EAEAEA',
    letterSpacing: 1,
  },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,240,255,0.05)',
  },
  addressItemSelected: {
    backgroundColor: 'rgba(255,0,60,0.05)',
  },
  addressDetail: {
    flex: 1,
  },
  addressItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#EAEAEA',
  },
  addressItemText: {
    fontSize: 13,
    color: '#555570',
    marginTop: 4,
  },
});
