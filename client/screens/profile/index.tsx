import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Switch,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeRouter } from '@/hooks/useSafeRouter';

interface MenuItem {
  id: string;
  icon: string;
  title: string;
  subtitle?: string;
  type: 'navigate' | 'toggle' | 'action';
  value?: boolean;
  route?: string;
}

const menuGroups: { title: string; items: MenuItem[] }[] = [
  {
    title: '账号设置',
    items: [
      { id: 'login', icon: 'qr-code-outline', title: '京东账号', subtitle: '未登录', type: 'navigate', route: '/login' },
      { id: 'notifications', icon: 'notifications-outline', title: '抢购提醒', subtitle: '开抢前5分钟通知', type: 'toggle', value: true },
    ],
  },
  {
    title: '功能设置',
    items: [
      { id: 'auto_pay', icon: 'card-outline', title: '自动支付', subtitle: '抢到后自动完成支付', type: 'toggle', value: false },
      { id: 'sound', icon: 'volume-medium-outline', title: '声音提示', subtitle: '抢购结果语音播报', type: 'toggle', value: true },
      { id: 'vibration', icon: 'phone-portrait-outline', title: '震动反馈', subtitle: '操作时震动提醒', type: 'toggle', value: true },
    ],
  },
  {
    title: '其他',
    items: [
      { id: 'history', icon: 'time-outline', title: '操作记录', type: 'navigate' },
      { id: 'help', icon: 'help-circle-outline', title: '使用帮助', type: 'navigate' },
      { id: 'about', icon: 'information-circle-outline', title: '关于我们', type: 'navigate' },
    ],
  },
];

const mockUser = {
  nickname: '京东用户',
  avatar: '',
  isLoggedIn: false,
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useSafeRouter();
  const [user, setUser] = useState(mockUser);
  const [settings, setSettings] = useState<Record<string, boolean>>({
    notifications: true,
    auto_pay: false,
    sound: true,
    vibration: true,
  });

  const handleMenuPress = (item: MenuItem) => {
    if (item.type === 'navigate' && item.route) {
      router.push(item.route as any);
    }
  };

  const handleToggle = (id: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [id]: value }));
    
    if (id === 'auto_pay' && value) {
      Alert.alert(
        '自动支付',
        '开启后，系统将在抢到商品后自动使用默认支付方式完成支付，请确保账户余额充足。',
        [{ text: '我知道了' }]
      );
    }
  };

  const handleLogout = () => {
    Alert.alert(
      '退出登录',
      '确定要退出当前京东账号吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: () => {
            setUser({ ...mockUser, isLoggedIn: false });
            Alert.alert('已退出登录', '期待下次再见~');
          },
        },
      ]
    );
  };

  const getMenuIconColor = (item: MenuItem) => {
    if (['login', 'notifications', 'auto_pay'].includes(item.id)) {
      return '#FF003C';
    }
    if (['sound', 'vibration'].includes(item.id)) {
      return '#00F0FF';
    }
    return '#555570';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <LinearGradient
          colors={['#1A0A0F', '#0A0A0F']}
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.headerTitle}>我的</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* User Card */}
        <TouchableOpacity
          style={styles.userCard}
          onPress={() => router.push('/login')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['rgba(255,0,60,0.15)', 'rgba(0,240,255,0.08)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.userCardGradient}
          />
          <View style={styles.userCardInner}>
            <View style={styles.avatarContainer}>
              {user.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={32} color="#555570" />
                </View>
              )}
              {user.isLoggedIn && <View style={styles.loginBadge} />}
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {user.isLoggedIn ? user.nickname : '点击登录京东账号'}
              </Text>
              <Text style={styles.userSubtitle}>
                {user.isLoggedIn ? '已连接京东账号' : '登录后可使用代抢功能'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#555570" />
          </View>
        </TouchableOpacity>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>代抢任务</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#00FF88' }]}>5</Text>
            <Text style={styles.statLabel}>成功</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#FDCB6E' }]}>3</Text>
            <Text style={styles.statLabel}>进行中</Text>
          </View>
        </View>

        {/* Menu Groups */}
        {menuGroups.map((group, groupIndex) => (
          <View key={group.title} style={styles.menuGroup}>
            <Text style={styles.menuGroupTitle}>{group.title}</Text>
            <View style={styles.menuCard}>
              {group.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.menuItem,
                    itemIndex < group.items.length - 1 && styles.menuItemBorder,
                  ]}
                  onPress={() => handleMenuPress(item)}
                  disabled={item.type === 'toggle'}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuItemLeft}>
                    <View style={[styles.menuIcon, { backgroundColor: `${getMenuIconColor(item)}15` }]}>
                      <Ionicons
                        name={item.icon as any}
                        size={20}
                        color={getMenuIconColor(item)}
                      />
                    </View>
                    <View style={styles.menuItemInfo}>
                      <Text style={styles.menuItemTitle}>{item.title}</Text>
                      {item.subtitle && (
                        <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                      )}
                    </View>
                  </View>
                  {item.type === 'toggle' ? (
                    <Switch
                      value={settings[item.id] || false}
                      onValueChange={(value) => handleToggle(item.id, value)}
                      trackColor={{ false: '#333340', true: '#FF003C80' }}
                      thumbColor={settings[item.id] ? '#FF003C' : '#555570'}
                    />
                  ) : (
                    <Ionicons name="chevron-forward" size={20} color="#333340" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Logout */}
        {user.isLoggedIn && (
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>退出登录</Text>
          </TouchableOpacity>
        )}

        {/* Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>版本 1.0.0</Text>
        </View>
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
  content: {
    flex: 1,
  },
  userCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#12121A',
    borderWidth: 1,
    borderColor: 'rgba(0,240,255,0.12)',
    overflow: 'hidden',
  },
  userCardGradient: {
    height: 3,
  },
  userCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0A0A0F',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,240,255,0.2)',
  },
  loginBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#00FF88',
    borderWidth: 2,
    borderColor: '#12121A',
  },
  userInfo: {
    flex: 1,
    marginLeft: 14,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#EAEAEA',
  },
  userSubtitle: {
    fontSize: 13,
    color: '#555570',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 16,
    backgroundColor: '#12121A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,240,255,0.12)',
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
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(0,240,255,0.1)',
  },
  menuGroup: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  menuGroupTitle: {
    fontSize: 12,
    color: '#555570',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginLeft: 4,
  },
  menuCard: {
    backgroundColor: '#12121A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,240,255,0.12)',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,240,255,0.05)',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  menuItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#EAEAEA',
  },
  menuItemSubtitle: {
    fontSize: 12,
    color: '#555570',
    marginTop: 2,
  },
  logoutButton: {
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#12121A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,0,60,0.3)',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF003C',
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  versionText: {
    fontSize: 12,
    color: '#333340',
    letterSpacing: 1,
  },
});
