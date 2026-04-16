import { NavigationContainer, NavigatorScreenParams } from '@react-navigation/native';
import { navigationRef } from '../services/navigationRef';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from './index';
import AnalyseScreen from './analyse';
import FrigoScreen from './frigo';
import RecetteScreen from './recette';
import RecettesScreen from './recettes';
import PreferencesScreen from './preferences';
import ProfilScreen from './profil';
import TicketScreen from './ticket';
import OnboardingScreen from './onboarding';
import { Recipe } from '../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Onglets de la barre du bas — écrans directs, sans stack imbriqué */
export type TabParamList = {
  Home: undefined;
  Frigo: undefined;
  Recettes: undefined;
  Profil: undefined;
};

/** Stack racine — tabs + tous les écrans secondaires au même niveau */
export type RootStackParamList = {
  Main: NavigatorScreenParams<TabParamList> | undefined;
  Onboarding: undefined;
  Analyse: {
    photoUri?: string;
    ingredientText?: string;
  };
  RecetteDetail: {
    recipe: Recipe;
  };
  Ticket: undefined;
  Preferences: undefined;
};

// ─── Tab navigator ────────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator<TabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.15,
          shadowRadius: 6,
        },
        tabBarActiveTintColor: '#2D6A4F',
        tabBarInactiveTintColor: '#999999',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: 4,
        },
        tabBarIcon: ({ color, size, focused }) => {
          let iconName: React.ComponentProps<typeof Ionicons>['name'];

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Frigo') {
            iconName = focused ? 'cube' : 'cube-outline';
          } else if (route.name === 'Recettes') {
            iconName = focused ? 'book' : 'book-outline';
          } else {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: 'Accueil' }}
      />
      <Tab.Screen
        name="Frigo"
        component={FrigoScreen}
        options={{ tabBarLabel: 'Frigo' }}
      />
      <Tab.Screen
        name="Recettes"
        component={RecettesScreen}
        options={{ tabBarLabel: 'Recettes' }}
      />
      <Tab.Screen
        name="Profil"
        component={ProfilScreen}
        options={{ tabBarLabel: 'Profil' }}
      />
    </Tab.Navigator>
  );
}

// ─── Root stack ───────────────────────────────────────────────────────────────

const RootStack = createNativeStackNavigator<RootStackParamList>();

export default function Navigator({ initialRoute }: { initialRoute: 'Onboarding' | 'Main' }) {
  return (
    <NavigationContainer ref={navigationRef as any}>
      <RootStack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}
      >
        <RootStack.Screen name="Main" component={MainTabs} />
        <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
        <RootStack.Screen
          name="Analyse"
          component={AnalyseScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
        <RootStack.Screen
          name="RecetteDetail"
          component={RecetteScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <RootStack.Screen
          name="Ticket"
          component={TicketScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <RootStack.Screen
          name="Preferences"
          component={PreferencesScreen}
          options={{ animation: 'slide_from_right' }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
