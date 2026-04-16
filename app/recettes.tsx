import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList, TabParamList } from './navigator';
import { useHistorique, HistoriqueEntry } from '../hooks/useHistorique';
import { navigationRef } from '../services/navigationRef';

export const RECIPES_HISTORY_KEY = '@recipes_history';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Recettes'>,
  NativeStackScreenProps<HomeStackParamList>
>;

const COLORS = {
  green: '#1B5E20',
  greenMid: '#2E7D32',
  greenLight: '#43A047',
  greenPale: '#C8E6C9',
  white: '#FFFFFF',
  offWhite: '#F9FBF9',
  textDark: '#1A1A1A',
  textMuted: '#6B7F6B',
  cardBorder: '#E8F0E8',
  danger: '#C62828',
};

function formatViewedAt(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);

  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  if (diffH < 24) return `Il y a ${diffH}h`;
  if (diffD === 1) return 'Hier';
  if (diffD < 7) return `Il y a ${diffD} jours`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function RecettesScreen({ navigation }: Props) {
  const { historique, load, clearHistorique } = useHistorique();

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleClear = () => {
    Alert.alert(
      'Vider l\'historique',
      'Supprimer toutes les recettes consultées ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Vider', style: 'destructive', onPress: clearHistorique },
      ]
    );
  };

  const renderItem = ({ item }: { item: HistoriqueEntry }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => navigationRef.navigate('RecetteDetail', { recipe: item.recipe })}
    >
      <Text style={styles.cardEmoji}>{item.recipe.emoji}</Text>
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={1}>{item.recipe.name}</Text>
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeTxt}>⏱ {item.recipe.time}</Text>
          </View>
          <View style={[styles.badge, styles.badgeGreen]}>
            <Text style={[styles.badgeTxt, styles.badgeGreenTxt]}>{item.recipe.difficulty}</Text>
          </View>
        </View>
        <Text style={styles.viewedAt}>Consulté · {formatViewedAt(item.viewedAt)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" backgroundColor={COLORS.green} />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Mes recettes</Text>
          <Text style={styles.headerSub}>
            {historique.length} recette{historique.length !== 1 ? 's' : ''} consultée{historique.length !== 1 ? 's' : ''}
          </Text>
        </View>
        {historique.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearBtn} activeOpacity={0.7}>
            <Text style={styles.clearBtnTxt}>Vider</Text>
          </TouchableOpacity>
        )}
      </View>

      {historique.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🍽️</Text>
          <Text style={styles.emptyTitle}>Aucune recette consultée pour l'instant</Text>
          <Text style={styles.emptyDesc}>
            Analysez votre frigo et ouvrez une recette pour la retrouver ici.
          </Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('HomeStack', { screen: 'Home' })}
          >
            <Text style={styles.emptyBtnTxt}>← Retour à l'accueil</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={historique}
          renderItem={renderItem}
          keyExtractor={(item, i) => `${item.recipe.name}-${i}`}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.green,
  },
  headerLeft: {
    flex: 1,
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
  clearBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  clearBtnTxt: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
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
  viewedAt: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
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
    marginBottom: 28,
  },
  emptyBtn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: COLORS.green,
    borderRadius: 14,
  },
  emptyBtnTxt: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 15,
  },
});
