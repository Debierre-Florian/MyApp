import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './index';
import AnalyseScreen from './analyse';
import FrigoScreen from './frigo';
import RecetteScreen from './recette';
import PreferencesScreen from './preferences';
import ProfilScreen from './profil';
import TicketScreen from './ticket';
import { Recipe } from '../services/api';

export type RootStackParamList = {
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
