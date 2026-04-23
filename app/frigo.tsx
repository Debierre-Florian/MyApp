import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useState } from 'react';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { StatusBar } from 'expo-status-bar';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { TabParamList } from './navigator';
import { useFrigo, type FrigoIngredient } from '../hooks/useFrigo';
import { COLORS, FONTS } from '../constants/theme';

type Props = BottomTabScreenProps<TabParamList, 'Frigo'>;

function getDaysOld(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

function daysUntilExpiry(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

type Freshness = 'fresh' | 'warn' | 'danger';
function getFreshness(item: FrigoIngredient): Freshness {
  if (item.expiresAt) {
    const d = daysUntilExpiry(item.expiresAt);
    if (d <= 0) return 'danger';
    if (d <= 3) return 'warn';
    return 'fresh';
  }
  const d = getDaysOld(item.addedAt);
  if (d >= 10) return 'danger';
  if (d >= 5) return 'warn';
  return 'fresh';
}

function formatExpiry(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `Expire le ${day}/${month}`;
}

const FRESHNESS: Record<Freshness, { bar: string; label: string }> = {
  fresh: { bar: COLORS.olive, label: 'FRAIS' },
  warn: { bar: COLORS.mustard, label: 'À UTILISER' },
  danger: { bar: COLORS.terracotta, label: 'À VÉRIFIER' },
};

function IngredientCard({
  item,
  onDelete,
  onUpdateExpiry,
}: {
  item: FrigoIngredient;
  onDelete: (id: string) => void;
  onUpdateExpiry: (id: string, date: Date) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const f = getFreshness(item);
  const cfg = FRESHNESS[f];
  const days = getDaysOld(item.addedAt);
  const ageLabel =
    days === 0 ? "AJOUTÉ AUJOURD'HUI" : days === 1 ? 'IL Y A 1 JOUR' : `IL Y A ${days} JOURS`;

  const expiryDate = item.expiresAt ? new Date(item.expiresAt) : new Date();

  function handlePickerChange(_: DateTimePickerEvent, date?: Date) {
    setShowPicker(false);
    if (date) onUpdateExpiry(item.id, date);
  }

  return (
    <View style={styles.card}>
      <View style={[styles.cardBar, { backgroundColor: cfg.bar }]} />
      <View style={styles.cardBody}>
        <Text style={styles.cardName}>{item.name}</Text>
        <Text style={styles.cardAge}>{ageLabel}</Text>
        <View style={styles.expiryRow}>
          <Text style={styles.expiryTxt}>
            {item.expiresAt ? formatExpiry(item.expiresAt) : 'Date inconnue'}
          </Text>
          <TouchableOpacity
            onPress={() => setShowPicker(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.pencilTxt}>✏️</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Text style={[styles.cardStatus, { color: cfg.bar }]}>{cfg.label}</Text>
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => onDelete(item.id)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.deleteTxt}>✕</Text>
      </TouchableOpacity>
      {showPicker && (
        <DateTimePicker
          value={expiryDate}
          mode="date"
          display="default"
          onChange={handlePickerChange}
        />
      )}
    </View>
  );
}

export default function FrigoScreen({ navigation }: Props) {
  const { ingredients, loading, removeIngredient, updateExpiresAt } = useFrigo();

  const sorted = [...ingredients].sort(
    (a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
  );

  const freshCount = sorted.filter((i) => getFreshness(i) === 'fresh').length;
  const warnCount = sorted.filter((i) => getFreshness(i) === 'warn').length;
  const dangerCount = sorted.filter((i) => getFreshness(i) === 'danger').length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor={COLORS.cream} />

      <View style={styles.header}>
        <Text style={styles.kicker}>№ {ingredients.length < 10 ? `0${ingredients.length}` : ingredients.length} · DANS LE FRIGO</Text>
        <Text style={styles.title}>
          Le <Text style={styles.titleItalic}>garde-manger</Text>.
        </Text>
        <View style={styles.rule} />
      </View>

      {ingredients.length > 0 && (
        <View style={styles.statsRow}>
          <View style={[styles.statTile, styles.statOlive]}>
            <Text style={styles.statValue}>{freshCount}</Text>
            <Text style={styles.statLabel}>FRAIS</Text>
          </View>
          <View style={[styles.statTile, styles.statMustard]}>
            <Text style={styles.statValue}>{warnCount}</Text>
            <Text style={styles.statLabel}>À UTILISER</Text>
          </View>
          <View style={[styles.statTile, styles.statTerra]}>
            <Text style={[styles.statValue, styles.statValueLight]}>{dangerCount}</Text>
            <Text style={[styles.statLabel, styles.statLabelLight]}>À VÉRIFIER</Text>
          </View>
        </View>
      )}

      {loading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator color={COLORS.terracotta} size="large" />
        </View>
      ) : ingredients.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Frigo vide.</Text>
          <Text style={styles.emptySubtitle}>
            Prenez votre frigo en photo depuis l'accueil — les ingrédients apparaîtront ici.
          </Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('Home' as never)}>
            <Text style={styles.emptyBtnTxt}>← RETOUR</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <IngredientCard item={item} onDelete={removeIngredient} onUpdateExpiry={updateExpiresAt} />}
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

  statsRow: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: 24, paddingVertical: 16,
  },
  statTile: {
    flex: 1, borderRadius: 4, padding: 12,
    borderWidth: 1, minHeight: 70,
  },
  statOlive: { backgroundColor: COLORS.oliveBg, borderColor: COLORS.oliveSoft },
  statMustard: { backgroundColor: COLORS.mustardBg, borderColor: COLORS.mustardSoft },
  statTerra: { backgroundColor: COLORS.terracotta, borderColor: COLORS.terracotta },
  statValue: {
    fontFamily: FONTS.serif, fontSize: 28, fontWeight: '700',
    color: COLORS.ink, letterSpacing: -1,
  },
  statValueLight: { color: COLORS.cream },
  statLabel: {
    fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.3,
    color: COLORS.olive, marginTop: 4,
  },
  statLabelLight: { color: COLORS.cream, opacity: 0.9 },

  listContent: {
    paddingHorizontal: 24, paddingTop: 8, paddingBottom: 40,
  },

  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.paper,
    borderRadius: 4, marginBottom: 8,
    overflow: 'hidden',
    borderWidth: 1, borderColor: COLORS.rule,
    minHeight: 64,
  },
  cardBar: { width: 4, alignSelf: 'stretch' },
  cardBody: { flex: 1, paddingVertical: 12, paddingHorizontal: 14 },
  cardName: {
    fontFamily: FONTS.serif, fontSize: 16, color: COLORS.ink,
    textTransform: 'capitalize', marginBottom: 2,
  },
  cardAge: {
    fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.2,
    color: COLORS.muted,
  },
  expiryRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3,
  },
  expiryTxt: {
    fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.2,
    color: COLORS.terracotta,
  },
  pencilTxt: {
    fontSize: 11,
  },
  cardStatus: {
    fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1.3,
    marginRight: 8,
  },
  deleteBtn: {
    width: 40, height: 40,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 4,
  },
  deleteTxt: {
    color: COLORS.muted, fontSize: 14, fontFamily: FONTS.mono,
  },

  emptyState: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  emptyTitle: {
    fontFamily: FONTS.serif, fontSize: 32,
    color: COLORS.ink, marginBottom: 12, textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: FONTS.serifItalic, fontStyle: 'italic',
    fontSize: 15, color: COLORS.inkSoft,
    textAlign: 'center', lineHeight: 22, marginBottom: 28,
  },
  emptyBtn: {
    paddingVertical: 12, paddingHorizontal: 24,
    borderWidth: 1, borderColor: COLORS.ink,
    borderRadius: 4,
  },
  emptyBtnTxt: {
    color: COLORS.ink, fontFamily: FONTS.mono,
    fontSize: 11, letterSpacing: 1.5,
  },
});
