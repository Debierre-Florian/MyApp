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
import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, TabParamList } from './navigator';
import { usePreferences } from '../hooks/usePreferences';
import { useFrigo } from '../hooks/useFrigo';
import { useScore } from '../hooks/useScore';
import { useProfils, PROFILE_COLORS } from '../hooks/useProfils';
import { COLORS, FONTS } from '../constants/theme';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Profil'>,
  NativeStackScreenProps<RootStackParamList>
>;

export default function ProfilScreen({ navigation }: Props) {
  const { preferences, reload: reloadPrefs } = usePreferences();
  const { ingredients, reload: reloadFrigo } = useFrigo();
  const score = useScore();
  const { profils, activeProfil, activeId, deleteProfil } = useProfils();

  useFocusEffect(useCallback(() => {
    reloadPrefs();
    reloadFrigo();
  }, [reloadPrefs, reloadFrigo]));

  const displayName = activeProfil.firstName.trim() || 'Utilisateur';
  const initial = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const avatarColor = PROFILE_COLORS[activeProfil.color];
  const canDelete = profils.length > 1;

  const handleDelete = () => {
    Alert.alert(
      `Supprimer ${displayName} ?`,
      'Ce profil et toutes ses préférences seront effacés.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => deleteProfil(activeId),
        },
      ]
    );
  };

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
          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarTxt}>{initial}</Text>
          </View>
          {canDelete ? (
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.8}>
              <Text style={styles.deleteBtnTxt}>SUPPRIMER CE PROFIL</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.soloChip}>
              <Text style={styles.soloChipTxt}>PROFIL UNIQUE</Text>
            </View>
          )}
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
          {preferences.favoriteIngredients.length > 0 && (
            <>
              <View style={styles.prefDivider} />
              <View style={styles.prefRow}>
                <Text style={styles.prefLabel}>FAVORIS</Text>
                <Text style={styles.prefValue}>{preferences.favoriteIngredients.join(', ')}</Text>
              </View>
            </>
          )}
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

        {/* Other profiles */}
        {profils.length > 1 && (
          <>
            <Text style={styles.sectionLabel}>AUTRES PROFILS</Text>
            <View style={styles.profilsList}>
              {profils
                .filter((p) => p.id !== activeId)
                .map((p) => {
                  const pInitial = (p.firstName.trim()[0] || '?').toUpperCase();
                  return (
                    <View key={p.id} style={styles.profilRow}>
                      <View style={[styles.profilAvatar, { backgroundColor: PROFILE_COLORS[p.color] }]}>
                        <Text style={styles.profilAvatarTxt}>{pInitial}</Text>
                      </View>
                      <Text style={styles.profilName}>{p.firstName || 'Sans nom'}</Text>
                      <Text style={styles.profilDiet}>{p.diet}</Text>
                    </View>
                  );
                })}
            </View>
          </>
        )}
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
    alignItems: 'center', justifyContent: 'center',
  },
  avatarTxt: {
    fontFamily: FONTS.serif, fontSize: 22, color: '#fff', fontWeight: '700',
  },
  deleteBtn: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: COLORS.terracotta, borderRadius: 4,
  },
  deleteBtnTxt: {
    fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1.3,
    color: COLORS.terracotta,
  },
  soloChip: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 4, backgroundColor: COLORS.mustardBg,
    borderWidth: 1, borderColor: COLORS.mustardSoft,
  },
  soloChipTxt: {
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

  profilsList: {
    backgroundColor: COLORS.paper, borderWidth: 1, borderColor: COLORS.rule,
    borderRadius: 4, overflow: 'hidden', marginBottom: 24,
  },
  profilRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.rule,
  },
  profilAvatar: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  profilAvatarTxt: {
    fontFamily: FONTS.serif, fontSize: 13, fontWeight: '700', color: '#fff',
  },
  profilName: {
    flex: 1, fontFamily: FONTS.serif, fontSize: 15, color: COLORS.ink,
  },
  profilDiet: {
    fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1, color: COLORS.muted,
  },
});
