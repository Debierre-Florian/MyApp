import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './index';
import AnalyseScreen from './analyse';
import FrigoScreen from './frigo';
import RecetteScreen from './recette';
import PreferencesScreen from './preferences';
import ProfilScreen from './profil';
import TicketScreen from './ticket';
import OnboardingScreen from './onboarding';
import { Recipe } from '../services/api';

export type RootStackParamList = {
  Onboarding: undefined;
  Home: undefined;
  Analyse: {
    photoUri?: string;
    ingredientText?: string;
  };
  Frigo: undefined;
  RecetteDetail: {
    recipe: Recipe;
  };
  Preferences: undefined;
  Profil: undefined;
  Ticket: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function Navigator({ initialRoute }: { initialRoute: 'Onboarding' | 'Home' }) {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
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
        <Stack.Screen
          name="RecetteDetail"
          component={RecetteScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="Preferences"
          component={PreferencesScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="Profil"
          component={ProfilScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="Ticket"
          component={TicketScreen}
          options={{ animation: 'slide_from_right' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
