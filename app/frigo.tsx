import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { TabParamList } from './navigator';
import { useFrigo, type FrigoIngredient } from '../hooks/useFrigo';

type Props = BottomTabScreenProps<TabParamList, 'Frigo'>;

// ─── Design tokens ────────────────────────────────────────────────────────────

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
  fresh: '#2E7D32',
  freshBg: '#E8F5E9',
  warn: '#E65100',
  warnBg: '#FFF3E0',
  danger: '#C62828',
  dangerBg: '#FFEBEE',
};

// ─── Freshness helpers ────────────────────────────────────────────────────────

function getDaysOld(addedAt: string): number {
  const now = new Date();
  const added = new Date(addedAt);
  const diffMs = now.getTime() - added.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

type Freshness = 'fresh' | 'warn' | 'danger';

function getFreshness(daysOld: number): Freshness {
  if (daysOld >= 10) return 'danger';
  if (daysOld >= 5) return 'warn';
  return 'fresh';
}

const FRESHNESS_CONFIG: Record<
  Freshness,
  { color: string; bg: string; label: string; dot: string }
> = {
  fresh: { color: COLORS.fresh, bg: COLORS.freshBg, label: 'Frais', dot: '#4CAF50' },
  warn: { color: COLORS.warn, bg: COLORS.warnBg, label: 'À utiliser', dot: '#FF9800' },
  danger: { color: COLORS.danger, bg: COLORS.dangerBg, label: 'À vérifier', dot: '#F44336' },
};

// ─── Ingredient card ──────────────────────────────────────────────────────────

function IngredientCard({
  item,
  onDelete,
}: {
  item: FrigoIngredient;
  onDelete: (id: string) => void;
}) {
  const daysOld = getDaysOld(item.addedAt);
  const freshness = getFreshness(daysOld);
  const config = FRESHNESS_CONFIG[freshness];

  const addedDate = new Date(item.addedAt).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });

  const ageLabel =
    daysOld === 0
      ? "Ajouté aujourd'hui"
      : daysOld === 1
      ? 'Ajouté hier'
      : `Ajouté il y a ${daysOld} jours`;

  return (
    <View style={styles.card}>
      {/* Freshness dot */}
      <View style={[styles.freshnessBar, { backgroundColor: config.dot }]} />

      {/* Content */}
      <View style={styles.cardBody}>
        <Text style={styles.ingredientName}>{item.name}</Text>
        <View style={styles.cardMeta}>
          <Text style={styles.dateText}>{addedDate} · {ageLabel}</Text>
        </View>
      </View>

      {/* Badge */}
      <View style={[styles.freshnessbadge, { backgroundColor: config.bg }]}>
        <Text style={[styles.freshnessBadgeTxt, { color: config.color }]}>{config.label}</Text>
      </View>

      {/* Delete */}
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => onDelete(item.id)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.deleteTxt}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function FrigoScreen({ navigation }: Props) {
  const { ingredients, loading, removeIngredient } = useFrigo();

  // Sort newest first
  const sorted = [...ingredients].sort(
    (a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
  );

  const freshCount = sorted.filter((i) => getFreshness(getDaysOld(i.addedAt)) === 'fresh').length;
  const warnCount = sorted.filter((i) => getFreshness(getDaysOld(i.addedAt)) === 'warn').length;
  const dangerCount = sorted.filter((i) => getFreshness(getDaysOld(i.addedAt)) === 'danger').length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" backgroundColor={COLORS.green} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnTxt}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Mon Frigo</Text>
          <Text style={styles.headerSubtitle}>
            {ingredients.length} ingrédient{ingredients.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Stats bar */}
      {ingredients.length > 0 && (
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <View style={[styles.statDot, { backgroundColor: '#4CAF50' }]} />
            <Text style={styles.statTxt}>{freshCount} frais</Text>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statDot, { backgroundColor: '#FF9800' }]} />
            <Text style={styles.statTxt}>{warnCount} à utiliser</Text>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statDot, { backgroundColor: '#F44336' }]} />
            <Text style={styles.statTxt}>{dangerCount} à vérifier</Text>
          </View>
        </View>
      )}

      {/* Content */}
      {loading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator color={COLORS.greenMid} size="large" />
        </View>
      ) : ingredients.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={styles.emptyTitle}>Votre frigo est vide</Text>
          <Text style={styles.emptySubtitle}>
            Prenez votre frigo en photo ou saisissez vos ingrédients depuis l'accueil — ils
            apparaîtront ici automatiquement.
          </Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.emptyBtnTxt}>← Retour à l'accueil</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <IngredientCard item={item} onDelete={removeIngredient} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.green,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.green,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnTxt: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '300',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: COLORS.greenPale,
    fontSize: 12,
    marginTop: 1,
  },

  // Stats bar
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    backgroundColor: COLORS.greenMid,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statTxt: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '500',
  },

  // List
  listContent: {
    backgroundColor: COLORS.offWhite,
    padding: 16,
    paddingBottom: 40,
    flexGrow: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },

  // Ingredient card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  freshnessBar: {
    width: 4,
    alignSelf: 'stretch',
  },
  cardBody: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  ingredientName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 3,
    textTransform: 'capitalize',
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  freshnessbage: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  freshnessbadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  freshnessBadgeTxt: {
    fontSize: 11,
    fontWeight: '600',
  },
  deleteBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  deleteTxt: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },

  // Empty state
  emptyState: {
    flex: 1,
    backgroundColor: COLORS.offWhite,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
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
