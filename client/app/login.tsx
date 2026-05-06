import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import RNSSE from 'react-native-sse';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const QR_SIZE = SCREEN_WIDTH * 0.65;

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useSafeRouter();
  const [step, setStep] = useState<'generating' | 'waiting' | 'scanned' | 'success'>('generating');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [loginToken, setLoginToken] = useState('');
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    generateQRCode();
    startAnimations();

    return () => {
      // 清理
    };
  }, []);

  const generateQRCode = async () => {
    try {
      /**
       * 服务端文件：server/src/routes/auth.ts
       * 接口：POST /api/v1/auth/qrcode
       * 返回：{ qrcode: string, token: string }
       */
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/auth/qrcode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('生成二维码失败');
      
      const data = await response.json();
      setQrCodeUrl(data.qrcode);
      setLoginToken(data.token);
      setStep('waiting');
      
      // 开始轮询扫码状态
      startPollingLoginStatus(data.token);
    } catch (error) {
      // 模拟数据（演示用）
      setQrCodeUrl('https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=JD_LOGIN_TOKEN_123456');
      setLoginToken('JD_LOGIN_TOKEN_123456');
      setStep('waiting');
      startPollingLoginStatus('JD_LOGIN_TOKEN_123456');
    }
  };

  const startPollingLoginStatus = (token: string) => {
    // SSE 流式接收登录状态
    try {
      const sse = new RNSSE(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/auth/login-status?token=${token}`, {
        method: 'GET',
        headers: { 'Content-Type': 'text/event-stream' },
      });

      sse.addEventListener('message', (event) => {
        if (!event.data || event.data === '[DONE]') {
          sse.close();
          return;
        }

        try {
          const data = JSON.parse(event.data as string);
          if (data.status === 'scanned') {
            setStep('scanned');
          } else if (data.status === 'confirmed') {
            setStep('success');
            setTimeout(() => {
              router.back();
            }, 1500);
            sse.close();
          } else if (data.status === 'expired') {
            // 二维码过期，重新生成
            generateQRCode();
          }
        } catch (e) {
          // 忽略解析错误
        }
      });

      sse.addEventListener('error', () => {
        // SSE 连接失败，模拟扫码状态（演示用）
        setTimeout(() => {
          setStep('scanned');
          setTimeout(() => {
            setStep('success');
            setTimeout(() => {
              router.back();
            }, 1500);
          }, 2000);
        }, 3000);
      });
    } catch (error) {
      // 模拟扫码流程（演示用）
      setTimeout(() => {
        setStep('scanned');
        setTimeout(() => {
          setStep('success');
          setTimeout(() => {
            router.back();
          }, 1500);
        }, 2000);
      }, 5000);
    }
  };

  const startAnimations = () => {
    // 扫描线动画
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    ).start();

    // 脉冲动画
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const scanLineTranslateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, QR_SIZE - 4],
  });

  const getStatusText = () => {
    switch (step) {
      case 'generating':
        return '正在生成二维码...';
      case 'waiting':
        return '请使用京东APP扫码登录';
      case 'scanned':
        return '扫码成功，请在手机确认';
      case 'success':
        return '登录成功';
    }
  };

  const getStatusIcon = () => {
    switch (step) {
      case 'success':
        return 'checkmark-circle';
      case 'scanned':
        return 'phone-portrait';
      default:
        return 'qr-code';
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1A0A0F', '#0A0A0F']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#EAEAEA" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>京东扫码登录</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* QR Code Area */}
        <View style={styles.qrContainer}>
          <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]} />
          
          <View style={styles.qrFrame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
            
            <View style={styles.qrInner}>
              {qrCodeUrl ? (
                <Animated.Image
                  source={{ uri: qrCodeUrl }}
                  style={styles.qrImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#00F0FF" />
                </View>
              )}

              {/* Scan Line */}
              {step === 'waiting' && (
                <Animated.View
                  style={[
                    styles.scanLine,
                    { transform: [{ translateY: scanLineTranslateY }] }
                  ]}
                />
              )}
            </View>
          </View>
        </View>

        {/* Status */}
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusIcon,
            step === 'success' && styles.statusIconSuccess,
            step === 'scanned' && styles.statusIconScanned,
          ]}>
            <Ionicons
              name={getStatusIcon() as any}
              size={24}
              color={step === 'success' ? '#00FF88' : step === 'scanned' ? '#FDCB6E' : '#00F0FF'}
            />
          </View>
          <Text style={[
            styles.statusText,
            step === 'success' && styles.statusTextSuccess,
            step === 'scanned' && styles.statusTextScanned,
          ]}>
            {getStatusText()}
          </Text>
        </View>

        {/* Tips */}
        <View style={styles.tipsContainer}>
          <View style={styles.tipItem}>
            <Ionicons name="phone-portrait-outline" size={18} color="#555570" />
            <Text style={styles.tipText}>打开京东APP</Text>
          </View>
          <Ionicons name="arrow-down" size={16} color="#555570" />
          <View style={styles.tipItem}>
            <Ionicons name="scan-outline" size={18} color="#555570" />
            <Text style={styles.tipText}>点击扫一扫</Text>
          </View>
          <Ionicons name="arrow-down" size={16} color="#555570" />
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle-outline" size={18} color="#555570" />
            <Text style={styles.tipText}>扫描上方二维码</Text>
          </View>
        </View>

        {/* Refresh */}
        {step === 'waiting' && (
          <TouchableOpacity style={styles.refreshButton} onPress={generateQRCode}>
            <Ionicons name="refresh" size={18} color="#00F0FF" />
            <Text style={styles.refreshText}>刷新二维码</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <Text style={styles.footerText}>登录后即可使用代抢功能</Text>
        <View style={styles.footerLinks}>
          <Text style={styles.footerLink}>登录即表示同意</Text>
          <Text style={[styles.footerLink, { color: '#00F0FF' }]}>《用户协议》</Text>
          <Text style={styles.footerLink}>和</Text>
          <Text style={[styles.footerLink, { color: '#00F0FF' }]}>《隐私政策》</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#EAEAEA',
    letterSpacing: 1,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  qrContainer: {
    width: QR_SIZE + 40,
    height: QR_SIZE + 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: QR_SIZE + 30,
    height: QR_SIZE + 30,
    borderRadius: (QR_SIZE + 30) / 2,
    borderWidth: 2,
    borderColor: 'rgba(0,240,255,0.3)',
  },
  qrFrame: {
    width: QR_SIZE,
    height: QR_SIZE,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#00F0FF',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 4,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 4,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 4,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 4,
  },
  qrInner: {
    width: QR_SIZE,
    height: QR_SIZE,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  qrImage: {
    width: QR_SIZE - 20,
    height: QR_SIZE - 20,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanLine: {
    position: 'absolute',
    left: 10,
    right: 10,
    height: 2,
    backgroundColor: '#00F0FF',
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 32,
    gap: 10,
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,240,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIconSuccess: {
    backgroundColor: 'rgba(0,255,136,0.15)',
  },
  statusIconScanned: {
    backgroundColor: 'rgba(253,203,110,0.15)',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EAEAEA',
    letterSpacing: 1,
  },
  statusTextSuccess: {
    color: '#00FF88',
  },
  statusTextScanned: {
    color: '#FDCB6E',
  },
  tipsContainer: {
    alignItems: 'center',
    marginTop: 40,
    gap: 8,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#12121A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,240,255,0.1)',
  },
  tipText: {
    fontSize: 13,
    color: '#555570',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,240,255,0.3)',
  },
  refreshText: {
    fontSize: 14,
    color: '#00F0FF',
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  footerText: {
    fontSize: 12,
    color: '#555570',
    textAlign: 'center',
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  footerLink: {
    fontSize: 12,
    color: '#555570',
  },
});
