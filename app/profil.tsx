import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, TabParamList } from './navigator';
import { usePreferences } from '../hooks/usePreferences';
import { useFrigo } from '../hooks/useFrigo';
import { useScore } from '../hooks/useScore';
import { COLORS, FONTS } from '../constants/theme';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Profil'>,
  NativeStackScreenProps<RootStackParamList>
>;

type PlanId = 'free' | 'essential' | 'premium';

interface Plan {
  id: PlanId;
  name: string;
  price: string;
  period: string;
  features: string[];
  highlight?: boolean;
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Gratuit',
    price: '0€',
    period: 'pour toujours',
    features: ['3 analyses par jour', 'Recettes basiques', 'Gestion du frigo'],
  },
  {
    id: 'essential',
    name: 'Essentiel',
    price: '4,99€',
    period: 'par mois',
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
    features: [
      'Tout Essentiel inclus',
      'Planification de menus',
      'Liste de courses auto',
      'Support prioritaire',
    ],
  },
];

function PlanCard({ plan, active, onChoose }: { plan: Plan; active: boolean; onChoose: () => void }) {
  return (
    <View style={[styles.planCard, active && styles.planCardActive]}>
      {plan.highlight && !active && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularBadgeTxt}>POPULAIRE</Text>
        </View>
      )}
      <Text style={[styles.planKicker, active && styles.planKickerActive]}>
        {plan.name.toUpperCase()}
      </Text>
      <View style={styles.priceRow}>
        <Text style={[styles.price, active && styles.priceActive]}>{plan.price}</Text>
        <Text style={[styles.period, active && styles.periodActive]}>/{plan.period}</Text>
      </View>
      <View style={styles.featureList}>
        {plan.features.map((f) => (
          <View key={f} style={styles.featureRow}>
            <Text style={[styles.featureCheck, active && styles.featureCheckActive]}>—</Text>
            <Text style={[styles.featureTxt, active && styles.featureTxtActive]}>{f}</Text>
          </View>
        ))}
      </View>
      {active ? (
        <View style={styles.activeBtn}>
          <Text style={styles.activeBtnTxt}>PLAN ACTUEL</Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.chooseBtn} onPress={onChoose} activeOpacity={0.8}>
          <Text style={styles.chooseBtnTxt}>CHOISIR →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function ProfilScreen({ navigation }: Props) {
  const { preferences, reload: reloadPrefs } = usePreferences();
  const { ingredients, reload: reloadFrigo } = useFrigo();
  const score = useScore();

  useFocusEffect(useCallback(() => {
    reloadPrefs();
    reloadFrigo();
  }, [reloadPrefs, reloadFrigo]));

  const [activePlan, setActivePlan] = useState<PlanId>('free');

  const handleChoose = (plan: Plan) => {
    Alert.alert('Bientôt disponible', `L'abonnement ${plan.name} sera disponible prochainement.`);
  };

  const displayName = preferences.firstName.trim() || 'Utilisateur';
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor={COLORS.cream} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Text style={styles.kicker}>MON PROFIL</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Preferences')} style={styles.editBtn}>
            <Text style={styles.editBtnTxt}>MODIFIER</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.title}>
          Bonjour,{'\n'}
          <Text style={styles.titleItalic}>{displayName}</Text>.
        </Text>
        <View style={styles.rule} />

        {/* Identity */}
        <View style={styles.identityRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTxt}>{initials}</Text>
          </View>
          <View style={styles.planChip}>
            <Text style={styles.planChipTxt}>
              PLAN {PLANS.find((p) => p.id === activePlan)?.name.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Score tile */}
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>SCORE ANTI-GASPI · SEMAINE {score.weekNumber}</Text>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreValue}>{score.score}</Text>
            <Text style={styles.scoreOutOf}>/100</Text>
          </View>
          <View style={styles.scoreTrack}>
            <View style={[styles.scoreFill, { width: `${score.score}%` as any }]} />
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statTile, styles.statOlive]}>
            <Text style={styles.statValue}>{ingredients.length}</Text>
            <Text style={styles.statLabel}>FRIGO</Text>
          </View>
          <View style={[styles.statTile, styles.statMustard]}>
            <Text style={styles.statValue}>{preferences.favoriteIngredients.length}</Text>
            <Text style={styles.statLabel}>FAVORIS</Text>
          </View>
          <View style={[styles.statTile, styles.statTerra]}>
            <Text style={[styles.statValue, { color: COLORS.cream }]}>
              {preferences.allergies.length}
            </Text>
            <Text style={[styles.statLabel, { color: COLORS.cream }]}>ALLERGIES</Text>
          </View>
        </View>

        {/* Preferences summary */}
        <Text style={styles.sectionLabel}>MES PRÉFÉRENCES</Text>
        <View style={styles.prefCard}>
          <View style={styles.prefRow}>
            <Text style={styles.prefLabel}>RÉGIME</Text>
            <Text style={styles.prefValue}>{preferences.diet}</Text>
          </View>
          <View style={styles.prefDivider} />
          <View style={styles.prefRow}>
            <Text style={styles.prefLabel}>ALLERGIES</Text>
            <Text style={styles.prefValue}>
              {preferences.allergies.length > 0 ? preferences.allergies.join(', ') : 'Aucune'}
            </Text>
          </View>
          {preferences.dislikedIngredients.length > 0 && (
            <>
              <View style={styles.prefDivider} />
              <View style={styles.prefRow}>
                <Text style={styles.prefLabel}>ÉVITÉS</Text>
                <Text style={styles.prefValue}>{preferences.dislikedIngredients.join(', ')}</Text>
              </View>
            </>
          )}
        </View>

        {/* Plans */}
        <Text style={styles.sectionLabel}>ABONNEMENT</Text>
        <Text style={styles.plansSubtitle}>
          <Text style={styles.titleItalic}>Débloquez</Text> tout le potentiel de FrigoAI.
        </Text>

        {PLANS.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            active={activePlan === plan.id}
            onChoose={() => handleChoose(plan)}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.cream },
  scroll: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 48 },

  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 8,
  },
  kicker: {
    fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1.5,
    color: COLORS.inkSoft,
  },
  editBtn: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: COLORS.ink, borderRadius: 4,
  },
  editBtnTxt: {
    fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1.3, color: COLORS.ink,
  },
  title: {
    fontFamily: FONTS.serif, fontSize: 40, lineHeight: 44,
    color: COLORS.ink, fontWeight: '700', letterSpacing: -1,
  },
  titleItalic: { fontFamily: FONTS.serifItalic, fontStyle: 'italic', color: COLORS.terracotta },
  rule: { height: 1, backgroundColor: COLORS.ink, marginTop: 14, marginBottom: 16 },

  identityRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginBottom: 20,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    borderWidth: 2, borderColor: COLORS.terracotta,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.paper,
  },
  avatarTxt: {
    fontFamily: FONTS.serif, fontSize: 22, color: COLORS.ink, fontWeight: '700',
  },
  planChip: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 4, backgroundColor: COLORS.mustardBg,
    borderWidth: 1, borderColor: COLORS.mustardSoft,
  },
  planChipTxt: {
    fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1.3,
    color: COLORS.ink,
  },

  scoreCard: {
    backgroundColor: COLORS.paper, borderWidth: 1, borderColor: COLORS.rule,
    borderRadius: 4, padding: 16, marginBottom: 12,
  },
  scoreLabel: {
    fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1.4, color: COLORS.olive, marginBottom: 6,
  },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 10 },
  scoreValue: {
    fontFamily: FONTS.mono, fontSize: 52, fontWeight: '700',
    color: COLORS.ink, letterSpacing: -2,
  },
  scoreOutOf: {
    fontFamily: FONTS.mono, fontSize: 18, color: COLORS.muted, marginLeft: 4,
  },
  scoreTrack: { height: 5, backgroundColor: COLORS.creamDeep, borderRadius: 3, overflow: 'hidden' },
  scoreFill: { height: 5, backgroundColor: COLORS.olive, borderRadius: 3 },

  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  statTile: { flex: 1, borderRadius: 4, padding: 12, borderWidth: 1, minHeight: 70 },
  statOlive: { backgroundColor: COLORS.oliveBg, borderColor: COLORS.oliveSoft },
  statMustard: { backgroundColor: COLORS.mustardBg, borderColor: COLORS.mustardSoft },
  statTerra: { backgroundColor: COLORS.terracotta, borderColor: COLORS.terracotta },
  statValue: {
    fontFamily: FONTS.serif, fontSize: 26, fontWeight: '700',
    color: COLORS.ink, letterSpacing: -1,
  },
  statLabel: {
    fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.3, color: COLORS.olive, marginTop: 4,
  },

  sectionLabel: {
    fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1.5,
    color: COLORS.olive, marginBottom: 6, marginTop: 8,
  },
  prefCard: {
    backgroundColor: COLORS.paper, borderWidth: 1, borderColor: COLORS.rule,
    borderRadius: 4, padding: 16, marginBottom: 24,
  },
  prefRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  prefLabel: {
    fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1.3,
    color: COLORS.muted, width: 80, paddingTop: 2,
  },
  prefValue: {
    flex: 1, fontFamily: FONTS.serif, fontSize: 15, color: COLORS.ink,
    textTransform: 'capitalize',
  },
  prefDivider: { height: 1, backgroundColor: COLORS.rule, marginVertical: 10 },

  plansSubtitle: {
    fontFamily: FONTS.serif, fontSize: 20,
    color: COLORS.ink, marginBottom: 14,
  },

  planCard: {
    backgroundColor: COLORS.paper, borderWidth: 1, borderColor: COLORS.rule,
    borderRadius: 4, padding: 18, marginBottom: 12,
    position: 'relative',
  },
  planCardActive: {
    borderColor: COLORS.terracotta, borderWidth: 2,
    backgroundColor: COLORS.terracottaBg,
  },
  popularBadge: {
    position: 'absolute', top: -9, left: 16,
    backgroundColor: COLORS.mustard,
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 3,
  },
  popularBadgeTxt: {
    fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.4,
    color: COLORS.ink, fontWeight: '700',
  },
  planKicker: {
    fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 1.5,
    color: COLORS.inkSoft, marginBottom: 6,
  },
  planKickerActive: { color: COLORS.terracotta },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 12 },
  price: {
    fontFamily: FONTS.serif, fontSize: 32, fontWeight: '700',
    color: COLORS.ink, letterSpacing: -1,
  },
  priceActive: { color: COLORS.terracotta },
  period: {
    fontFamily: FONTS.serifItalic, fontStyle: 'italic',
    fontSize: 13, color: COLORS.muted, marginLeft: 4,
  },
  periodActive: { color: COLORS.inkSoft },
  featureList: { gap: 6, marginBottom: 14 },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  featureCheck: {
    fontFamily: FONTS.mono, fontSize: 13, color: COLORS.terracotta, width: 12,
  },
  featureCheckActive: { color: COLORS.terracotta },
  featureTxt: { flex: 1, fontFamily: FONTS.serif, fontSize: 14, color: COLORS.inkSoft },
  featureTxtActive: { color: COLORS.ink },
  activeBtn: {
    paddingVertical: 12, borderRadius: 4,
    backgroundColor: COLORS.terracotta, alignItems: 'center',
  },
  activeBtnTxt: {
    color: COLORS.cream, fontFamily: FONTS.mono,
    fontSize: 11, letterSpacing: 1.5, fontWeight: '700',
  },
  chooseBtn: {
    paddingVertical: 12, borderRadius: 4,
    borderWidth: 1, borderColor: COLORS.ink, alignItems: 'center',
  },
  chooseBtnTxt: {
    color: COLORS.ink, fontFamily: FONTS.mono,
    fontSize: 11, letterSpacing: 1.5, fontWeight: '700',
  },
});
