import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeScreen from './src/screens/HomeScreen';
import AddGlucoseScreen from './src/screens/AddGlucoseScreen';
import AddInsulinScreen from './src/screens/AddInsulinScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import { initDB } from './src/database/db';
import { COLORS } from './src/constants/themes';

const Tab = createBottomTabNavigator();

export default function App() {
  useEffect(() => {
    const setup = async () => {
      await initDB();
    };
    setup();
  }, []);

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: COLORS.primary },
          headerTintColor: '#fff',
          tabBarActiveTintColor: COLORS.primary,
        }}
      >
        <Tab.Screen name="Dashboard" component={HomeScreen} />
        <Tab.Screen name="Glucose" component={AddGlucoseScreen} />
        <Tab.Screen name="Insulin" component={AddInsulinScreen} />
        <Tab.Screen name="History" component={HistoryScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}