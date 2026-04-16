import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList, TabParamList } from './navigator';
import { Recipe } from '../services/api';

export const RECIPES_HISTORY_KEY = '@recipes_history';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Recettes'>,
  NativeStackScreenProps<HomeStackParamList>
>;

const COLORS = {
  green: '#1B5E20',
  greenMid: '#2E7D32',
  greenPale: '#C8E6C9',
  white: '#FFFFFF',
  offWhite: '#F9FBF9',
  textDark: '#1A1A1A',
  textMuted: '#6B7F6B',
  cardBorder: '#E8F0E8',
};

export default function RecettesScreen({ navigation }: Props) {
  const [history, setHistory] = useState<Recipe[]>([]);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(RECIPES_HISTORY_KEY).then((raw) => {
        setHistory(raw ? (JSON.parse(raw) as Recipe[]) : []);
      });
    }, [])
  );

  const renderItem = ({ item }: { item: Recipe }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => navigation.navigate('RecetteDetail', { recipe: item })}
    >
      <Text style={styles.cardEmoji}>{item.emoji}</Text>
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeTxt}>⏱ {item.time}</Text>
          </View>
          <View style={[styles.badge, styles.badgeGreen]}>
            <Text style={[styles.badgeTxt, styles.badgeGreenTxt]}>{item.difficulty}</Text>
          </View>
        </View>
        <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" backgroundColor={COLORS.green} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes recettes</Text>
        <Text style={styles.headerSub}>
          {history.length} recette{history.length !== 1 ? 's' : ''} sauvegardée{history.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {history.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🍽️</Text>
          <Text style={styles.emptyTitle}>Aucune recette pour l'instant</Text>
          <Text style={styles.emptyDesc}>
            Analysez votre frigo depuis l'accueil pour recevoir des recettes personnalisées.
          </Text>
        </View>
      ) : (
        <FlatList
          data={history}
          renderItem={renderItem}
          keyExtractor={(item, i) => `${item.name}-${i}`}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.green,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.green,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '800',
  },
  headerSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    marginTop: 2,
  },
  list: {
    backgroundColor: COLORS.offWhite,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 32,
    flexGrow: 1,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardEmoji: {
    fontSize: 36,
    alignSelf: 'center',
  },
  cardBody: {
    flex: 1,
    gap: 4,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    backgroundColor: '#F0F4F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeTxt: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  badgeGreen: {
    backgroundColor: COLORS.greenPale,
  },
  badgeGreenTxt: {
    color: COLORS.greenMid,
  },
  cardDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 17,
  },
  empty: {
    flex: 1,
    backgroundColor: COLORS.offWhite,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
    textAlign: 'center',
    marginBottom: 10,
  },
  emptyDesc: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 21,
  },
});
