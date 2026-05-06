import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import * as Clipboard from 'expo-clipboard';

interface ParsedProduct {
  skuId: string;
  name: string;
  price: string;
  image: string;
  shop: string;
}

export default function ParseScreen() {
  const insets = useSafeAreaInsets();
  const router = useSafeRouter();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsedProduct, setParsedProduct] = useState<ParsedProduct | null>(null);
  const [error, setError] = useState('');

  const isValidJDLink = (link: string): boolean => {
    return (
      link.includes('jd.com') ||
      link.includes('item.jd.com') ||
      link.includes('cart.jd.com') ||
      link.includes('u.jd.com')
    );
  };

  const extractSkuId = (link: string): string | null => {
    const patterns = [
      /(\d{6,13})\.html/,
      /sku=(\d+)/,
      /id=(\d+)/,
      /\/(\d{6,13})\//,
    ];
    for (const pattern of patterns) {
      const match = link.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const handlePaste = async () => {
    const text = await Clipboard.getStringAsync();
    if (text) {
      setUrl(text);
      setError('');
    }
  };

  const handleParse = async () => {
    if (!url.trim()) {
      setError('请输入京东商品链接');
      return;
    }

    if (!isValidJDLink(url)) {
      setError('请输入有效的京东商品链接');
      return;
    }

    setLoading(true);
    setError('');
    setParsedProduct(null);

    try {
      /**
       * 服务端文件：server/src/routes/products.ts
       * 接口：POST /api/v1/products/parse
       * Body 参数：url: string
       */
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/products/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error('解析失败');
      }

      const data = await response.json();
      setParsedProduct(data);
    } catch (err) {
      // 模拟数据（演示用）
      const skuId = extractSkuId(url);
      if (skuId) {
        setParsedProduct({
          skuId: skuId,
          name: 'iPhone 15 Pro Max 256GB 深空黑钛金属',
          price: '¥9999',
          image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400',
          shop: 'Apple官方旗舰店',
        });
      } else {
        setError('无法解析该链接，请确认是否为京东商品链接');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRush = () => {
    if (parsedProduct) {
      router.push('/product', {
          skuId: parsedProduct.skuId,
          name: parsedProduct.name,
          price: parsedProduct.price,
          image: parsedProduct.image,
          shop: parsedProduct.shop,
        });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <LinearGradient
          colors={['#1A0A0F', '#0A0A0F']}
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.headerTitle}>链接解析</Text>
        <Text style={styles.headerSubtitle}>粘贴京东商品链接进行解析</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Input Card */}
        <View style={styles.inputCard}>
          <View style={styles.inputHeader}>
            <Ionicons name="link" size={20} color="#FF003C" />
            <Text style={styles.inputLabel}>京东链接</Text>
          </View>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="粘贴京东商品链接..."
              placeholderTextColor="#555570"
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              autoCorrect={false}
              multiline
            />
            <TouchableOpacity style={styles.pasteButton} onPress={handlePaste}>
              <Ionicons name="clipboard-outline" size={20} color="#00F0FF" />
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color="#FF003C" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.parseButton, loading && styles.parseButtonDisabled]}
            onPress={handleParse}
            disabled={loading}
          >
            <LinearGradient
              colors={loading ? ['#555570', '#444460'] : ['#FF003C', '#FF4466']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.parseButtonGradient}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="search" size={18} color="#FFFFFF" />
                  <Text style={styles.parseButtonText}>解析链接</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Parsed Product */}
        {parsedProduct && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Ionicons name="checkmark-circle" size={20} color="#00FF88" />
              <Text style={styles.resultTitle}>解析成功</Text>
            </View>

            <View style={styles.productCard}>
              <Image source={{ uri: parsedProduct.image }} style={styles.productImage} />
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>
                  {parsedProduct.name}
                </Text>
                <Text style={styles.productPrice}>{parsedProduct.price}</Text>
                <View style={styles.shopRow}>
                  <Ionicons name="storefront-outline" size={14} color="#555570" />
                  <Text style={styles.shopName}>{parsedProduct.shop}</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.rushButton} onPress={handleRush}>
              <LinearGradient
                colors={['#FF003C', '#FF4466']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.rushButtonGradient}
              >
                <Ionicons name="flash" size={20} color="#FFFFFF" />
                <Text style={styles.rushButtonText}>立即代抢</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>使用提示</Text>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle-outline" size={16} color="#00F0FF" />
            <Text style={styles.tipText}>支持京东商品详情页链接</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle-outline" size={16} color="#00F0FF" />
            <Text style={styles.tipText}>从京东APP分享的链接同样有效</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle-outline" size={16} color="#00F0FF" />
            <Text style={styles.tipText}>解析后可直接设置抢购时间</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle-outline" size={16} color="#00F0FF" />
            <Text style={styles.tipText}>建议提前登录京东账号</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  },
  content: {
    flex: 1,
  },
  inputCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#12121A',
    borderWidth: 1,
    borderColor: 'rgba(0,240,255,0.12)',
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EAEAEA',
    letterSpacing: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#0A0A0F',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,240,255,0.15)',
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 14,
    color: '#EAEAEA',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pasteButton: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(0,240,255,0.15)',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  errorText: {
    fontSize: 12,
    color: '#FF003C',
  },
  parseButton: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  parseButtonDisabled: {
    opacity: 0.7,
  },
  parseButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  parseButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  resultCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#12121A',
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.2)',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00FF88',
    letterSpacing: 1,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#0A0A0F',
    borderRadius: 12,
    padding: 12,
  },
  productImage: {
    width: 80,
    height: 80,
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
  productPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FF003C',
    marginTop: 8,
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
  rushButton: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  rushButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  rushButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  tipsCard: {
    marginHorizontal: 16,
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#12121A',
    borderWidth: 1,
    borderColor: 'rgba(0,240,255,0.1)',
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EAEAEA',
    marginBottom: 12,
    letterSpacing: 1,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  tipText: {
    fontSize: 13,
    color: '#555570',
    flex: 1,
  },
});
