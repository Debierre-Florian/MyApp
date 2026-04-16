import { NavigationContainer, NavigatorScreenParams } from '@react-navigation/native';
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

/** Écrans du stack "accueil" — tab bar cachée quand on y navigue */
export type HomeStackParamList = {
  Home: undefined;
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

/** Onglets de la barre du bas */
export type TabParamList = {
  HomeStack: NavigatorScreenParams<HomeStackParamList> | undefined;
  Frigo: undefined;
  Recettes: undefined;
  Profil: undefined;
};

/** Root stack — uniquement Onboarding + MainTabs */
export type RootStackParamList = {
  Onboarding: undefined;
  MainTabs: NavigatorScreenParams<TabParamList> | undefined;
};

// ─── Home stack ───────────────────────────────────────────────────────────────

const HomeStack = createNativeStackNavigator<HomeStackParamList>();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen
        name="Analyse"
        component={AnalyseScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
      <HomeStack.Screen
        name="RecetteDetail"
        component={RecetteScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <HomeStack.Screen
        name="Ticket"
        component={TicketScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <HomeStack.Screen
        name="Preferences"
        component={PreferencesScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </HomeStack.Navigator>
  );
}

// ─── Tab navigator ────────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator<TabParamList>();

const TAB_GREEN = '#1B5E20';

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: TAB_GREEN,
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.15,
          shadowRadius: 6,
        },
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#A5D6A7',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: 4,
        },
        tabBarIcon: ({ color, size, focused }) => {
          let iconName: React.ComponentProps<typeof Ionicons>['name'];

          if (route.name === 'HomeStack') {
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
        name="HomeStack"
        component={HomeStackNavigator}
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

export default function Navigator({ initialRoute }: { initialRoute: 'Onboarding' | 'MainTabs' }) {
  return (
    <NavigationContainer>
      <RootStack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
        <RootStack.Screen name="MainTabs" component={MainTabs} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
