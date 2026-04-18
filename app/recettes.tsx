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
import { RootStackParamList, TabParamList } from './navigator';
import { useHistorique, HistoriqueEntry } from '../hooks/useHistorique';
import { COLORS, FONTS } from '../constants/theme';

export const RECIPES_HISTORY_KEY = '@recipes_history';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Recettes'>,
  NativeStackScreenProps<RootStackParamList>
>;

function formatViewedAt(iso: string): string {
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  const diffMin = Math.floor(diff / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);
  if (diffMin < 1) return "À L'INSTANT";
  if (diffMin < 60) return `IL Y A ${diffMin} MIN`;
  if (diffH < 24) return `IL Y A ${diffH}H`;
  if (diffD === 1) return 'HIER';
  if (diffD < 7) return `IL Y A ${diffD} JOURS`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }).toUpperCase();
}

export default function RecettesScreen({ navigation }: Props) {
  const { historique, load, clearHistorique } = useHistorique();

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleClear = () => {
    Alert.alert(
      "Vider l'historique",
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
      activeOpacity={0.85}
      onPress={() => navigation.navigate('RecetteDetail', { recipe: item.recipe })}
    >
      <View style={styles.cardEmojiBox}>
        <Text style={styles.cardEmoji}>{item.recipe.emoji}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={2}>{item.recipe.name}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaTime}>⏱ {item.recipe.time.toUpperCase()}</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaDifficulty}>{item.recipe.difficulty}</Text>
        </View>
        <Text style={styles.viewedAt}>{formatViewedAt(item.viewedAt)}</Text>
      </View>
      <Text style={styles.arrow}>→</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor={COLORS.cream} />

      <View style={styles.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.kicker}>
              № {historique.length < 10 ? `0${historique.length}` : historique.length} · HISTORIQUE
            </Text>
            <Text style={styles.title}>
              Mes <Text style={styles.titleItalic}>recettes</Text>.
            </Text>
          </View>
          {historique.length > 0 && (
            <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
              <Text style={styles.clearBtnTxt}>VIDER</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.rule} />
      </View>

      {historique.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Aucune recette.</Text>
          <Text style={styles.emptyDesc}>
            Analysez votre frigo et ouvrez une recette pour la retrouver ici.
          </Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Home' as never)}
          >
            <Text style={styles.emptyBtnTxt}>← RETOUR À L'ACCUEIL</Text>
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
  safeArea: { flex: 1, backgroundColor: COLORS.cream },
  header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12 },
  kicker: {
    fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1.5,
    color: COLORS.inkSoft, marginBottom: 8,
  },
  title: {
    fontFamily: FONTS.serif, fontSize: 42, lineHeight: 46,
    color: COLORS.ink, fontWeight: '700', letterSpacing: -1,
  },
  titleItalic: { fontFamily: FONTS.serifItalic, fontStyle: 'italic', color: COLORS.terracotta },
  rule: { height: 1, backgroundColor: COLORS.ink, marginTop: 14 },
  clearBtn: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: COLORS.ink, borderRadius: 4,
  },
  clearBtnTxt: {
    fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1.5,
    color: COLORS.ink,
  },
  list: { padding: 24, paddingTop: 16, paddingBottom: 40 },
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.paper,
    borderRadius: 4, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: COLORS.rule,
    alignItems: 'center',
    gap: 12,
  },
  cardEmojiBox: {
    width: 52, height: 52, borderRadius: 4,
    backgroundColor: COLORS.creamDeep,
    alignItems: 'center', justifyContent: 'center',
  },
  cardEmoji: { fontSize: 28 },
  cardBody: { flex: 1, gap: 4 },
  cardName: {
    fontFamily: FONTS.serif, fontSize: 17, color: COLORS.ink,
    lineHeight: 22,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaTime: {
    fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1.2,
    color: COLORS.terracotta,
  },
  metaDot: { color: COLORS.muted, fontSize: 10 },
  metaDifficulty: {
    fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1,
    color: COLORS.olive,
    paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 1, borderColor: COLORS.oliveSoft, borderRadius: 3,
  },
  viewedAt: {
    fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.2,
    color: COLORS.muted,
  },
  arrow: { fontSize: 18, color: COLORS.ink },
  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40,
  },
  emptyTitle: {
    fontFamily: FONTS.serif, fontSize: 32,
    color: COLORS.ink, textAlign: 'center', marginBottom: 10,
  },
  emptyDesc: {
    fontFamily: FONTS.serifItalic, fontStyle: 'italic',
    fontSize: 15, color: COLORS.inkSoft,
    textAlign: 'center', lineHeight: 22, marginBottom: 28,
  },
  emptyBtn: {
    paddingVertical: 12, paddingHorizontal: 24,
    borderWidth: 1, borderColor: COLORS.ink, borderRadius: 4,
  },
  emptyBtnTxt: {
    color: COLORS.ink, fontFamily: FONTS.mono,
    fontSize: 11, letterSpacing: 1.5,
  },
});
