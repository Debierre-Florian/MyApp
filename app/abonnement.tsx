import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from './navigator';
import { COLORS, FONTS } from '../constants/theme';
import { useAbonnement, PlanId, PLAN_RANK, PLAN_MAX_PROFILS } from '../hooks/useAbonnement';
import { useProfils } from '../hooks/useProfils';

type Props = NativeStackScreenProps<RootStackParamList, 'Abonnement'>;

type Plan = {
  id: PlanId;
  label: string;
  price: string;
  features: string[];
};

const PLANS: Plan[] = [
  {
    id: 'gratuit',
    label: 'Gratuit',
    price: '0 €/mois',
    features: [
      '3 analyses / semaine',
      'Pas de promos personnalisées',
      '1 profil',
    ],
  },
  {
    id: 'essentiel',
    label: 'Essentiel',
    price: '4,99 €/mois',
    features: [
      'Analyses illimitées',
      'Promos basiques',
      '2 profils',
    ],
  },
  {
    id: 'premium',
    label: 'Premium',
    price: '9,99 €/mois',
    features: [
      'Analyses illimitées',
      'Promos personnalisées',
      '5 profils',
      'Priorité IA',
    ],
  },
];

export default function AbonnementScreen({ navigation }: Props) {
  const { plan: currentPlan, savePlan } = useAbonnement();
  const { profils, trimProfilsToMax } = useProfils();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const isDowngrade = selectedPlan
    ? PLAN_RANK[selectedPlan.id] < PLAN_RANK[currentPlan]
    : false;

  const excessCount = selectedPlan
    ? Math.max(0, profils.length - PLAN_MAX_PROFILS[selectedPlan.id])
    : 0;

  const handleConfirm = async () => {
    if (!selectedPlan) return;
    const max = PLAN_MAX_PROFILS[selectedPlan.id];
    if (profils.length > max) {
      trimProfilsToMax(max);
    }
    await savePlan(selectedPlan.id);
    setSelectedPlan(null);
    Alert.alert('Abonnement activé', 'Stripe sera intégré prochainement.');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor={COLORS.cream} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backTxt}>← RETOUR</Text>
        </TouchableOpacity>

        <Text style={styles.header}>CHOISIR{'\n'}UN PLAN</Text>
        <View style={styles.rule} />

        {PLANS.map((p) => {
          const isActive = p.id === currentPlan;
          return (
            <View
              key={p.id}
              style={[styles.card, isActive && styles.cardActive]}
            >
              {isActive && (
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeTxt}>PLAN ACTUEL</Text>
                </View>
              )}
              <View style={styles.cardHeader}>
                <Text style={styles.planLabel}>{p.label}</Text>
                <Text style={styles.planPrice}>{p.price}</Text>
              </View>
              <View style={styles.featureList}>
                {p.features.map((f) => (
                  <View key={f} style={styles.featureRow}>
                    <Text style={styles.featureDot}>·</Text>
                    <Text style={styles.featureTxt}>{f}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity
                style={[styles.chooseBtn, isActive && styles.chooseBtnActive]}
                onPress={() => setSelectedPlan(p)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chooseBtnTxt, isActive && styles.chooseBtnTxtActive]}>
                  Choisir ce plan
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>

      {/* Bottom sheet confirmation */}
      <Modal
        visible={!!selectedPlan}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedPlan(null)}
      >
        <View style={styles.sheetOverlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetKicker}>RÉCAPITULATIF</Text>
            {selectedPlan && (
              <>
                <Text style={styles.sheetTitle}>{selectedPlan.label}</Text>
                <Text style={styles.sheetPrice}>{selectedPlan.price}</Text>
                <View style={styles.sheetFeatures}>
                  {selectedPlan.features.map((f) => (
                    <Text key={f} style={styles.sheetFeatureTxt}>· {f}</Text>
                  ))}
                </View>
                {isDowngrade && excessCount > 0 && (
                  <View style={styles.downgradeWarning}>
                    <Text style={styles.downgradeWarningTxt}>
                      ⚠️ Attention : passer en {selectedPlan.label} supprimera{' '}
                      {excessCount} profil{excessCount > 1 ? 's' : ''} supplémentaire{excessCount > 1 ? 's' : ''}.
                    </Text>
                  </View>
                )}
              </>
            )}
            <View style={styles.sheetActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setSelectedPlan(null)}
              >
                <Text style={styles.cancelBtnTxt}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleConfirm}
              >
                <Text style={styles.confirmBtnTxt}>Confirmer →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.cream },
  scroll: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 48 },

  backBtn: { marginBottom: 20 },
  backTxt: {
    fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 1.3, color: COLORS.inkSoft,
  },

  header: {
    fontFamily: FONTS.serif,
    fontSize: 48, lineHeight: 52,
    color: COLORS.ink, fontWeight: '700', letterSpacing: -1,
    textTransform: 'uppercase',
  },
  rule: { height: 1, backgroundColor: COLORS.ink, marginTop: 14, marginBottom: 24 },

  card: {
    backgroundColor: COLORS.paper,
    borderWidth: 1, borderColor: COLORS.rule,
    borderRadius: 4, padding: 20, marginBottom: 14,
  },
  cardActive: {
    borderColor: COLORS.terracotta,
    borderWidth: 2,
  },
  activeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.terracotta,
    borderRadius: 3,
    paddingHorizontal: 8, paddingVertical: 3,
    marginBottom: 12,
  },
  activeBadgeTxt: {
    fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.4, color: COLORS.cream,
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
    marginBottom: 14,
  },
  planLabel: {
    fontFamily: FONTS.serif, fontSize: 24, fontWeight: '700', color: COLORS.ink,
  },
  planPrice: {
    fontFamily: FONTS.mono, fontSize: 14, color: COLORS.terracotta, letterSpacing: 0.5,
  },
  featureList: { marginBottom: 18, gap: 6 },
  featureRow: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  featureDot: { fontFamily: FONTS.mono, fontSize: 14, color: COLORS.muted, lineHeight: 20 },
  featureTxt: { fontFamily: FONTS.serif, fontSize: 15, color: COLORS.inkSoft, flex: 1 },

  chooseBtn: {
    borderWidth: 1, borderColor: COLORS.ink,
    borderRadius: 4, paddingVertical: 12,
    alignItems: 'center',
  },
  chooseBtnActive: {
    backgroundColor: COLORS.terracotta, borderColor: COLORS.terracotta,
  },
  chooseBtnTxt: {
    fontFamily: FONTS.sans, fontSize: 13, fontWeight: '700',
    letterSpacing: 0.8, color: COLORS.ink,
  },
  chooseBtnTxtActive: { color: COLORS.cream },

  // Bottom sheet
  sheetOverlay: {
    flex: 1, justifyContent: 'flex-end', backgroundColor: COLORS.overlay,
  },
  sheet: {
    backgroundColor: COLORS.cream,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: COLORS.rule,
    alignSelf: 'center', marginBottom: 20,
  },
  sheetKicker: {
    fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1.5,
    color: COLORS.terracotta, marginBottom: 4,
  },
  sheetTitle: {
    fontFamily: FONTS.serif, fontSize: 30, fontWeight: '700',
    color: COLORS.ink, marginBottom: 4,
  },
  sheetPrice: {
    fontFamily: FONTS.mono, fontSize: 16, color: COLORS.terracotta,
    letterSpacing: 0.5, marginBottom: 16,
  },
  sheetFeatures: { marginBottom: 12, gap: 6 },
  sheetFeatureTxt: {
    fontFamily: FONTS.serif, fontSize: 15, color: COLORS.inkSoft,
  },
  downgradeWarning: {
    backgroundColor: '#FDE8E8',
    borderWidth: 1, borderColor: '#E57373',
    borderRadius: 4, padding: 12, marginBottom: 16,
  },
  downgradeWarningTxt: {
    fontFamily: FONTS.serif, fontSize: 14, color: '#C62828', lineHeight: 20,
  },
  sheetActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1, paddingVertical: 15, borderRadius: 4,
    alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.rule,
  },
  cancelBtnTxt: {
    fontFamily: FONTS.sans, color: COLORS.inkSoft,
    fontWeight: '600', fontSize: 13, letterSpacing: 1,
  },
  confirmBtn: {
    flex: 2, paddingVertical: 15, borderRadius: 4,
    alignItems: 'center', backgroundColor: COLORS.terracotta,
  },
  confirmBtnTxt: {
    fontFamily: FONTS.sans, color: COLORS.cream,
    fontWeight: '700', fontSize: 13, letterSpacing: 1,
  },
});
