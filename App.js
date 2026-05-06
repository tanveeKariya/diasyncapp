// Root app entry — navigation, database init, notification setup
import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen       from './src/screens/HomeScreen';
import AddGlucoseScreen from './src/screens/AddGlucoseScreen';
import AddInsulinScreen from './src/screens/AddInsulinScreen';
import AddFoodScreen    from './src/screens/AddFoodScreen';
import HistoryScreen    from './src/screens/HistoryScreen';
import SettingsScreen   from './src/screens/SettingsScreen';

import { initDB } from './src/database/db';
import { COLORS } from './src/constants/themes';
import { scheduleReminders } from './src/utils/notifications';

const Tab = createBottomTabNavigator();

const ICONS = {
  Dashboard: { active: 'grid',        inactive: 'grid-outline'        },
  Glucose:   { active: 'water',       inactive: 'water-outline'       },
  Insulin:   { active: 'medical',     inactive: 'medical-outline'     },
  Food:      { active: 'restaurant',  inactive: 'restaurant-outline'  },
  History:   { active: 'time',        inactive: 'time-outline'        },
  Settings:  { active: 'settings',    inactive: 'settings-outline'    },
};

export default function App() {
  useEffect(() => {
    (async () => {
      await initDB();
      try {
        if (Platform.OS !== 'web') {
          await scheduleReminders();
        }
      } catch {}
    })();
  }, []);

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerStyle: {
            backgroundColor: COLORS.primary,
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: COLORS.white,
          headerTitleStyle: { fontWeight: '800', fontSize: 18, letterSpacing: -0.3 },
          tabBarActiveTintColor:   COLORS.primary,
          tabBarInactiveTintColor: COLORS.placeholder,
          tabBarStyle: {
            backgroundColor: COLORS.white,
            borderTopColor: COLORS.divider,
            borderTopWidth: 1,
            paddingBottom: Platform.OS === 'ios' ? 20 : 6,
            paddingTop: 6,
            height: Platform.OS === 'ios' ? 80 : 58,
          },
          tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginTop: 2, letterSpacing: 0.3 },
          tabBarIcon: ({ focused, color, size }) => {
            const icons = ICONS[route.name] || { active: 'ellipse', inactive: 'ellipse-outline' };
            return (
              <Ionicons
                name={focused ? icons.active : icons.inactive}
                size={focused ? size + 2 : size}
                color={color}
              />
            );
          },
        })}
      >
        <Tab.Screen name="Dashboard" component={HomeScreen}       options={{ title: 'Dashboard' }} />
        <Tab.Screen name="Glucose"   component={AddGlucoseScreen} options={{ title: 'Glucose'   }} />
        <Tab.Screen name="Insulin"   component={AddInsulinScreen} options={{ title: 'Insulin'   }} />
        <Tab.Screen name="Food"      component={AddFoodScreen}    options={{ title: 'Food'      }} />
        <Tab.Screen name="History"   component={HistoryScreen}    options={{ title: 'History'   }} />
        <Tab.Screen name="Settings"  component={SettingsScreen}   options={{ title: 'Settings'  }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
