import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from './navigator';
import { COLORS, FONTS } from '../constants/theme';
import { usePromos } from '../hooks/usePromos';
import type { Promo } from '../services/promos';

type Props = NativeStackScreenProps<RootStackParamList, 'Promos'>;

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function PromoCard({ promo, highlight }: { promo: Promo; highlight?: boolean }) {
  return (
    <View style={[styles.card, highlight && styles.cardHighlight]}>
      {highlight && (
        <View style={styles.badge}>
          <Text style={styles.badgeTxt}>−{promo.reduction}%</Text>
        </View>
      )}
      <View style={styles.cardHeader}>
        <Text style={styles.productName}>{promo.productName}</Text>
        <Text style={styles.enseigne}>{promo.enseigne.toUpperCase()}</Text>
      </View>
      <View style={styles.priceRow}>
        <Text style={styles.prixNormal}>{promo.prixNormal.toFixed(2)} €</Text>
        <Text style={styles.prixPromo}>{promo.prixPromo.toFixed(2)} €</Text>
        {!highlight && (
          <View style={styles.badgeSmall}>
            <Text style={styles.badgeSmallTxt}>−{promo.reduction}%</Text>
          </View>
        )}
      </View>
      <Text style={styles.validUntil}>jusqu'au {formatDate(promo.validUntil)}</Text>
    </View>
  );
}

export default function PromosScreen({ navigation }: Props) {
  const { pertinentes, autres, loading } = usePromos();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor={COLORS.cream} />

      {/* ── Header ────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerKicker}>— bons plans —</Text>
          <Text style={styles.headerTitle}>Promotions</Text>
        </View>
      </View>

      <View style={styles.rule} />

      {loading ? (
        <View style={styles.loaderWrapper}>
          <ActivityIndicator color={COLORS.terracotta} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

          {/* ── Pour vous ────────────────────────────────────────── */}
          {pertinentes.length > 0 && (
            <>
              <View style={styles.sectionHead}>
                <Text style={styles.sectionDot}>●</Text>
                <Text style={styles.sectionLabel}>POUR VOUS</Text>
              </View>
              <Text style={styles.sectionSub}>
                {pertinentes.length} promo{pertinentes.length > 1 ? 's' : ''}{' '}
                <Text style={styles.sectionSubItalic}>correspondant à votre profil</Text>
              </Text>
              {pertinentes.map((promo) => (
                <PromoCard key={promo.id} promo={promo} highlight />
              ))}
            </>
          )}

          {/* ── Toutes les promos ────────────────────────────────── */}
          <View style={[styles.sectionHead, pertinentes.length > 0 && { marginTop: 24 }]}>
            <Text style={styles.sectionDot}>●</Text>
            <Text style={styles.sectionLabel}>TOUTES LES PROMOS</Text>
          </View>
          {autres.length === 0 && pertinentes.length > 0 ? (
            <Text style={styles.emptyTxt}>Toutes les promos sont déjà sélectionnées pour vous.</Text>
          ) : (
            (autres.length > 0 ? autres : pertinentes).map((promo) => (
              <PromoCard key={promo.id} promo={promo} />
            ))
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.cream },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 16,
  },
  backArrow: {
    fontSize: 22,
    color: COLORS.ink,
    fontFamily: FONTS.serif,
  },
  headerKicker: {
    fontFamily: FONTS.serifItalic,
    fontStyle: 'italic',
    color: COLORS.terracotta,
    fontSize: 13,
    marginBottom: 2,
  },
  headerTitle: {
    fontFamily: FONTS.serif,
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.ink,
    letterSpacing: -1,
  },

  rule: {
    height: 1,
    backgroundColor: COLORS.ink,
    marginHorizontal: 24,
    marginBottom: 4,
  },

  loaderWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  body: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },

  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  sectionDot: {
    color: COLORS.terracotta,
    fontSize: 10,
  },
  sectionLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    color: COLORS.inkSoft,
  },
  sectionSub: {
    fontFamily: FONTS.serif,
    fontSize: 18,
    color: COLORS.ink,
    marginBottom: 14,
  },
  sectionSubItalic: {
    fontFamily: FONTS.serifItalic,
    fontStyle: 'italic',
    color: COLORS.terracotta,
  },
  emptyTxt: {
    fontFamily: FONTS.serifItalic,
    fontStyle: 'italic',
    fontSize: 14,
    color: COLORS.muted,
    marginBottom: 16,
  },

  // Cards
  card: {
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.rule,
    borderRadius: 4,
    padding: 16,
    marginBottom: 10,
  },
  cardHighlight: {
    backgroundColor: COLORS.terracottaBg,
    borderColor: COLORS.terracottaSoft,
  },

  badge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.terracotta,
    borderRadius: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 10,
  },
  badgeTxt: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.cream,
    letterSpacing: 0.5,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  productName: {
    fontFamily: FONTS.serif,
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.ink,
    flex: 1,
    marginRight: 8,
  },
  enseigne: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    letterSpacing: 1.5,
    color: COLORS.olive,
    marginTop: 4,
  },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  prixNormal: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.muted,
    textDecorationLine: 'line-through',
  },
  prixPromo: {
    fontFamily: FONTS.mono,
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.terracotta,
  },
  badgeSmall: {
    backgroundColor: COLORS.terracotta,
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 'auto',
  },
  badgeSmallTxt: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.cream,
  },

  validUntil: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 1,
    color: COLORS.muted,
  },
});
