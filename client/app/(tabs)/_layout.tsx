import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0A0A0F',
          borderTopWidth: 1,
          borderTopColor: 'rgba(0,240,255,0.1)',
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 30 : 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#FF003C',
        tabBarInactiveTintColor: '#555570',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 1,
          textTransform: 'uppercase',
        },
        tabBarIconStyle: {
          marginBottom: -4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '首页',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'home' : 'home-outline'} 
              size={24} 
              color={color} 
              style={focused ? {
                shadowColor: '#FF003C',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.5,
                shadowRadius: 6,
              } : {}}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="parse"
        options={{
          title: '链接解析',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'link' : 'link-outline'} 
              size={24} 
              color={color}
              style={focused ? {
                shadowColor: '#FF003C',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.5,
                shadowRadius: 6,
              } : {}}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: '订单',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'document-text' : 'document-text-outline'} 
              size={24} 
              color={color}
              style={focused ? {
                shadowColor: '#FF003C',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.5,
                shadowRadius: 6,
              } : {}}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '我的',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'person' : 'person-outline'} 
              size={24} 
              color={color}
              style={focused ? {
                shadowColor: '#FF003C',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.5,
                shadowRadius: 6,
              } : {}}
            />
          ),
        }}
      />
    </Tabs>
  );
}
