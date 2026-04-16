import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,

  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList, TabParamList } from './navigator';
import { usePreferences } from '../hooks/usePreferences';
import { useFrigo } from '../hooks/useFrigo';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Profil'>,
  NativeStackScreenProps<HomeStackParamList>
>;

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
  gold: '#F9A825',
  goldBg: '#FFFDE7',
  goldBorder: '#F9A825',
  danger: '#C62828',
  dangerBg: '#FFEBEE',
};

// ─── Plans ────────────────────────────────────────────────────────────────────
type PlanId = 'free' | 'essential' | 'premium';

interface Plan {
  id: PlanId;
  name: string;
  price: string;
  period: string;
  emoji: string;
  features: string[];
  highlight?: boolean;
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Gratuit',
    price: '0€',
    period: 'pour toujours',
    emoji: '🌱',
    features: [
      '3 analyses par jour',
      'Recettes basiques',
      'Gestion du frigo',
    ],
  },
  {
    id: 'essential',
    name: 'Essentiel',
    price: '4,99€',
    period: 'par mois',
    emoji: '⭐',
    features: [
      'Analyses illimitées',
      'Recettes personnalisées',
      'Préférences alimentaires',
      'Historique des recettes',
    ],
    highlight: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '9,99€',
    period: 'par mois',
    emoji: '👑',
    features: [
      'Tout Essentiel inclus',
      'Planification de menus',
      'Liste de courses auto',
      'Support prioritaire',
    ],
  },
];

// ─── Plan card ────────────────────────────────────────────────────────────────
function PlanCard({
  plan,
  active,
  onChoose,
}: {
  plan: Plan;
  active: boolean;
  onChoose: () => void;
}) {
  const isHighlighted = plan.highlight && !active;

  return (
    <View
      style={[
        styles.planCard,
        active && styles.planCardActive,
        isHighlighted && styles.planCardHighlighted,
      ]}
    >
      {plan.highlight && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularBadgeTxt}>Populaire</Text>
        </View>
      )}

      {/* Header */}
      <View style={styles.planHeader}>
        <Text style={styles.planEmoji}>{plan.emoji}</Text>
        <View style={styles.planHeaderText}>
          <Text style={[styles.planName, active && styles.planNameActive]}>{plan.name}</Text>
          <View style={styles.planPriceRow}>
            <Text style={[styles.planPrice, active && styles.planPriceActive]}>{plan.price}</Text>
            <Text style={[styles.planPeriod, active && styles.planPeriodActive]}>
              {' '}/ {plan.period}
            </Text>
          </View>
        </View>
        {active && (
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeTxt}>Actif</Text>
          </View>
        )}
      </View>

      {/* Features */}
      <View style={styles.featureList}>
        {plan.features.map((feat) => (
          <View key={feat} style={styles.featureRow}>
            <Text style={[styles.featureCheck, active && styles.featureCheckActive]}>✓</Text>
            <Text style={[styles.featureTxt, active && styles.featureTxtActive]}>{feat}</Text>
          </View>
        ))}
      </View>

      {/* CTA */}
      {active ? (
        <View style={styles.planActiveBtn}>
          <Text style={styles.planActiveBtnTxt}>Plan actuel</Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.planChooseBtn} activeOpacity={0.8} onPress={onChoose}>
          <Text style={styles.planChooseBtnTxt}>Choisir {plan.name}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function ProfilScreen({ navigation }: Props) {
  const { preferences, reload: reloadPrefs } = usePreferences();
  const { ingredients, reload: reloadFrigo } = useFrigo();

  useFocusEffect(
    useCallback(() => {
      reloadPrefs();
      reloadFrigo();
    }, [reloadPrefs, reloadFrigo])
  );

  // Active plan state — "free" par défaut, sans logique de paiement
  const [activePlan, setActivePlan] = useState<PlanId>('free');

  const handleChoose = (plan: Plan) => {
    Alert.alert(
      'Bientôt disponible',
      `L'abonnement ${plan.name} sera disponible prochainement. Reste connecté !`,
      [{ text: 'OK' }]
    );
  };

  const displayName = preferences.firstName.trim() || 'Utilisateur';
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const freshCount = ingredients.length;
  const hasAllergies = preferences.allergies.length > 0;

  return (
    <View style={styles.safeArea}>
      <StatusBar style="light" backgroundColor={COLORS.green} />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnTxt}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Mon profil</Text>
        </View>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => navigation.navigate('Preferences')}
        >
          <Text style={styles.editBtnTxt}>Modifier</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Identité ──────────────────────────────────────────────────────── */}
        <View style={styles.identityCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTxt}>{initials}</Text>
          </View>
          <Text style={styles.displayName}>{displayName}</Text>
          <View style={styles.planChip}>
            <Text style={styles.planChipTxt}>
              {PLANS.find((p) => p.id === activePlan)?.emoji}{' '}
              Plan {PLANS.find((p) => p.id === activePlan)?.name}
            </Text>
          </View>
        </View>

        {/* ── Stats ─────────────────────────────────────────────────────────── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{freshCount}</Text>
            <Text style={styles.statLabel}>
              Ingrédient{freshCount !== 1 ? 's' : ''}{'\n'}dans le frigo
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{preferences.favoriteIngredients.length}</Text>
            <Text style={styles.statLabel}>Ingrédient{preferences.favoriteIngredients.length !== 1 ? 's' : ''}{'\n'}favoris</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{preferences.allergies.length}</Text>
            <Text style={styles.statLabel}>
              Allergie{preferences.allergies.length !== 1 ? 's' : ''}{'\n'}déclarée{preferences.allergies.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        {/* ── Résumé préférences ────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🥗  Mes préférences</Text>

          <View style={styles.prefRow}>
            <Text style={styles.prefLabel}>Régime</Text>
            <View style={styles.prefChip}>
              <Text style={styles.prefChipTxt}>{preferences.diet}</Text>
            </View>
          </View>

          <View style={styles.prefRow}>
            <Text style={styles.prefLabel}>Allergies</Text>
            {hasAllergies ? (
              <View style={styles.prefChipList}>
                {preferences.allergies.map((a) => (
                  <View key={a} style={[styles.prefChip, styles.prefChipDanger]}>
                    <Text style={[styles.prefChipTxt, styles.prefChipTxtDanger]}>{a}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.prefNone}>Aucune</Text>
            )}
          </View>

          {preferences.dislikedIngredients.length > 0 && (
            <View style={styles.prefRow}>
              <Text style={styles.prefLabel}>Évités</Text>
              <View style={styles.prefChipList}>
                {preferences.dislikedIngredients.map((d) => (
                  <View key={d} style={[styles.prefChip, styles.prefChipMuted]}>
                    <Text style={[styles.prefChipTxt, styles.prefChipTxtMuted]}>{d}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* ── Abonnement ────────────────────────────────────────────────────── */}
        <Text style={styles.plansTitle}>Abonnement</Text>
        <Text style={styles.plansSubtitle}>Débloque tout le potentiel de FrigoAI</Text>

        {PLANS.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            active={activePlan === plan.id}
            onChoose={() => handleChoose(plan)}
          />
        ))}
      </ScrollView>
    </View>
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
  editBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  editBtnTxt: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
  },

  // Scroll
  scroll: {
    flex: 1,
    backgroundColor: COLORS.offWhite,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 60,
  },

  // Identity card
  identityCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.green,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarTxt: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: '700',
  },
  displayName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 10,
  },
  planChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: COLORS.greenPale,
  },
  planChipTxt: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.greenMid,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.greenMid,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 15,
    fontWeight: '500',
  },

  // Preferences section
  section: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 14,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 10,
  },
  prefLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '600',
    width: 68,
    paddingTop: 4,
  },
  prefChipList: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  prefChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: COLORS.greenPale,
  },
  prefChipTxt: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.greenMid,
  },
  prefChipDanger: {
    backgroundColor: COLORS.dangerBg,
  },
  prefChipTxtDanger: {
    color: COLORS.danger,
  },
  prefChipMuted: {
    backgroundColor: '#F0F4F0',
  },
  prefChipTxtMuted: {
    color: COLORS.textMuted,
  },
  prefNone: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    paddingTop: 4,
  },

  // Plans
  plansTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 4,
  },
  plansSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 14,
  },
  planCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    position: 'relative',
  },
  planCardActive: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },
  planCardHighlighted: {
    borderColor: COLORS.gold,
    borderWidth: 2,
  },
  popularBadge: {
    position: 'absolute',
    top: -11,
    alignSelf: 'center',
    backgroundColor: COLORS.gold,
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 20,
  },
  popularBadgeTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
  },
  planEmoji: {
    fontSize: 28,
  },
  planHeaderText: {
    flex: 1,
  },
  planName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  planNameActive: {
    color: COLORS.white,
  },
  planPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.greenMid,
  },
  planPriceActive: {
    color: COLORS.greenPale,
  },
  planPeriod: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  planPeriodActive: {
    color: 'rgba(255,255,255,0.6)',
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  activeBadgeTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
  },
  featureList: {
    gap: 8,
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureCheck: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.greenLight,
    width: 16,
  },
  featureCheckActive: {
    color: COLORS.greenPale,
  },
  featureTxt: {
    fontSize: 13,
    color: COLORS.textMuted,
    flex: 1,
  },
  featureTxtActive: {
    color: 'rgba(255,255,255,0.85)',
  },
  planActiveBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
  },
  planActiveBtnTxt: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  planChooseBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.green,
    alignItems: 'center',
  },
  planChooseBtnTxt: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
});
