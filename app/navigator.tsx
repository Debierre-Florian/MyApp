import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './index';
import AnalyseScreen from './analyse';
import FrigoScreen from './frigo';

export type RootStackParamList = {
  Home: undefined;
  Analyse: {
    photoUri?: string;
    ingredientText?: string;
  };
  Frigo: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function Navigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen
          name="Analyse"
          component={AnalyseScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="Frigo"
          component={FrigoScreen}
          options={{ animation: 'slide_from_right' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
