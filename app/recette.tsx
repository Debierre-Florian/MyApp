import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from './navigator';
import { useFrigo } from '../hooks/useFrigo';
import { useHistorique } from '../hooks/useHistorique';
import { COLORS, FONTS } from '../constants/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'RecetteDetail'>;

export default function RecetteScreen({ route, navigation }: Props) {
  const { recipe } = route.params;
  const { ingredients: frigoIngredients } = useFrigo();
  const { addToHistorique, rateRecipe, historique } = useHistorique();

  useEffect(() => { addToHistorique(recipe); }, []);

  const existing = historique.find((e) => e.recipe.name === recipe.name);
  const [selectedRating, setSelectedRating] = useState<number>(existing?.rating ?? 0);
  const [comment, setComment] = useState<string>(existing?.comment ?? '');
  const [ratingSaved, setRatingSaved] = useState<boolean>(!!existing?.rating);

  const handleSaveRating = async () => {
    if (selectedRating === 0) return;
    await rateRecipe(recipe.name, selectedRating, comment.trim() || undefined);
    setRatingSaved(true);
    Alert.alert('Avis enregistré', 'Merci ! Vos préférences influenceront les prochaines suggestions.');
  };

  const frigoNames = new Set(frigoIngredients.map((i) => i.name.toLowerCase()));
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const toggleStep = (n: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  };

  const available = recipe.ingredients.filter((ing) => frigoNames.has(ing.toLowerCase()));
  const missing = recipe.ingredients.filter((ing) => !frigoNames.has(ing.toLowerCase()));
  const progress = recipe.steps.length > 0 ? checked.size / recipe.steps.length : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor={COLORS.cream} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnTxt}>←</Text>
        </TouchableOpacity>
        <Text style={styles.kicker}>RECETTE</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.emoji}>{recipe.emoji}</Text>
        <Text style={styles.title}>{recipe.name}</Text>
        <View style={styles.rule} />

        <View style={styles.badgesRow}>
          <Text style={styles.badgeTime}>⏱ {recipe.time.toUpperCase()}</Text>
          <Text style={styles.badgeDot}>·</Text>
          <Text style={styles.badgeDifficulty}>{recipe.difficulty}</Text>
          <Text style={styles.badgeDot}>·</Text>
          <Text style={styles.badgeProgress}>{checked.size}/{recipe.steps.length} ÉTAPES</Text>
        </View>

        <Text style={styles.description}>{recipe.description}</Text>

        {recipe.steps.length > 0 && (
          <View style={styles.progressSection}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` as any }]} />
            </View>
            {progress === 1 && (
              <Text style={styles.progressDone}>Recette terminée.</Text>
            )}
          </View>
        )}

        {/* Ingrédients */}
        <Text style={styles.sectionLabel}>INGRÉDIENTS</Text>
        <View style={styles.ingredientBlock}>
          {available.length > 0 && (
            <View>
              <Text style={styles.groupLabel}>DANS TON FRIGO</Text>
              {available.map((ing) => (
                <View key={ing} style={[styles.ingredientRow, styles.ingredientAvailable]}>
                  <Text style={styles.ingredientAvailDot}>—</Text>
                  <Text style={[styles.ingredientName, { color: COLORS.olive }]}>{ing}</Text>
                </View>
              ))}
            </View>
          )}
          {missing.length > 0 && (
            <View style={{ marginTop: available.length > 0 ? 14 : 0 }}>
              <Text style={styles.groupLabel}>À ACHETER</Text>
              {missing.map((ing) => (
                <View key={ing} style={[styles.ingredientRow, styles.ingredientMissing]}>
                  <Text style={styles.ingredientMissDot}>+</Text>
                  <Text style={[styles.ingredientName, { color: COLORS.terracotta }]}>{ing}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Étapes */}
        <Text style={styles.sectionLabel}>PRÉPARATION</Text>
        <View style={styles.stepsBlock}>
          {recipe.steps.map((s) => {
            const done = checked.has(s.step);
            return (
              <TouchableOpacity
                key={s.step}
                style={[styles.stepRow, done && styles.stepRowDone]}
                activeOpacity={0.7}
                onPress={() => toggleStep(s.step)}
              >
                <View style={[styles.stepNumberBox, done && styles.stepNumberBoxDone]}>
                  <Text style={[styles.stepNumber, done && styles.stepNumberDone]}>
                    {s.step < 10 ? `0${s.step}` : s.step}
                  </Text>
                </View>
                <Text style={[styles.stepInstruction, done && styles.stepInstructionDone]}>
                  {s.instruction}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {checked.size > 0 && (
          <TouchableOpacity
            style={styles.resetBtn}
            activeOpacity={0.8}
            onPress={() => setChecked(new Set())}
          >
            <Text style={styles.resetBtnTxt}>RECOMMENCER LA RECETTE</Text>
          </TouchableOpacity>
        )}

        {/* Section notation */}
        <View style={styles.ratingSection}>
          <Text style={styles.sectionLabel}>VOTRE AVIS</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => { setSelectedRating(star); setRatingSaved(false); }}
                activeOpacity={0.7}
                style={styles.starBtn}
              >
                <Text style={[styles.starIcon, selectedRating >= star && styles.starIconActive]}>
                  ★
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={styles.commentInput}
            placeholder="Un commentaire ?"
            placeholderTextColor={COLORS.muted}
            value={comment}
            onChangeText={(t) => { setComment(t); setRatingSaved(false); }}
            multiline
            numberOfLines={2}
          />
          <TouchableOpacity
            style={[styles.saveRatingBtn, selectedRating === 0 && styles.saveRatingBtnDisabled]}
            activeOpacity={0.8}
            onPress={handleSaveRating}
            disabled={selectedRating === 0}
          >
            <Text style={[styles.saveRatingBtnTxt, ratingSaved && styles.saveRatingBtnTxtSaved]}>
              {ratingSaved ? '✓ AVIS ENREGISTRÉ' : 'ENREGISTRER MON AVIS'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.cream },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backBtnTxt: { color: COLORS.ink, fontSize: 24, fontFamily: FONTS.serif },
  kicker: { fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1.5, color: COLORS.inkSoft },

  scrollContent: { padding: 24, paddingTop: 8, paddingBottom: 48 },

  emoji: { fontSize: 48, marginBottom: 6 },
  title: {
    fontFamily: FONTS.serif, fontSize: 36, lineHeight: 40,
    color: COLORS.ink, fontWeight: '700', letterSpacing: -1,
  },
  rule: { height: 1, backgroundColor: COLORS.ink, marginTop: 14, marginBottom: 14 },

  badgesRow: {
    flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap',
    gap: 6, marginBottom: 14,
  },
  badgeTime: {
    fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 1.2,
    color: COLORS.terracotta,
  },
  badgeDot: { color: COLORS.muted },
  badgeDifficulty: {
    fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1,
    color: COLORS.olive,
    paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 1, borderColor: COLORS.oliveSoft, borderRadius: 3,
  },
  badgeProgress: {
    fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1,
    color: COLORS.inkSoft,
  },
  description: {
    fontFamily: FONTS.serif, fontSize: 15,
    color: COLORS.inkSoft, lineHeight: 22, marginBottom: 16,
    fontStyle: 'italic',
  },

  progressSection: { marginBottom: 20 },
  progressTrack: {
    height: 4, borderRadius: 2,
    backgroundColor: COLORS.creamDeep, overflow: 'hidden',
  },
  progressFill: { height: 4, borderRadius: 2, backgroundColor: COLORS.olive },
  progressDone: {
    marginTop: 8, fontFamily: FONTS.serifItalic, fontStyle: 'italic',
    fontSize: 14, color: COLORS.olive, textAlign: 'center',
  },

  sectionLabel: {
    fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1.5,
    color: COLORS.olive, marginTop: 8, marginBottom: 8,
  },
  ingredientBlock: {
    backgroundColor: COLORS.paper,
    borderWidth: 1, borderColor: COLORS.rule,
    borderRadius: 4, padding: 14, marginBottom: 20,
  },
  groupLabel: {
    fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.3,
    color: COLORS.muted, marginBottom: 6,
  },
  ingredientRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 6, gap: 10,
  },
  ingredientAvailable: {},
  ingredientMissing: {},
  ingredientAvailDot: {
    fontFamily: FONTS.mono, color: COLORS.olive, width: 14, textAlign: 'center',
  },
  ingredientMissDot: {
    fontFamily: FONTS.mono, color: COLORS.terracotta, width: 14, textAlign: 'center',
    fontWeight: '700',
  },
  ingredientName: {
    fontFamily: FONTS.serif, fontSize: 15, flex: 1,
    textTransform: 'capitalize',
  },

  stepsBlock: {
    backgroundColor: COLORS.paper,
    borderWidth: 1, borderColor: COLORS.rule,
    borderRadius: 4, padding: 14, marginBottom: 20,
  },
  stepRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.rule,
  },
  stepRowDone: { opacity: 0.5 },
  stepNumberBox: {
    width: 32, height: 32, borderRadius: 4,
    borderWidth: 1, borderColor: COLORS.terracotta,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.cream,
  },
  stepNumberBoxDone: {
    backgroundColor: COLORS.olive, borderColor: COLORS.olive,
  },
  stepNumber: {
    fontFamily: FONTS.mono, fontSize: 13,
    color: COLORS.terracotta, fontWeight: '700', letterSpacing: 0.5,
  },
  stepNumberDone: { color: COLORS.cream },
  stepInstruction: {
    flex: 1, fontFamily: FONTS.serif,
    fontSize: 14, color: COLORS.ink, lineHeight: 22, paddingTop: 6,
  },
  stepInstructionDone: {
    textDecorationLine: 'line-through', color: COLORS.muted,
  },

  resetBtn: {
    paddingVertical: 12, borderRadius: 4,
    borderWidth: 1, borderColor: COLORS.rule, alignItems: 'center',
  },
  resetBtnTxt: {
    color: COLORS.inkSoft, fontFamily: FONTS.mono,
    fontSize: 11, letterSpacing: 1.5,
  },

  ratingSection: {
    marginTop: 28,
    paddingTop: 20,
    borderTopWidth: 1, borderTopColor: COLORS.rule,
  },
  starsRow: {
    flexDirection: 'row', gap: 6, marginBottom: 16,
  },
  starBtn: { padding: 4 },
  starIcon: {
    fontSize: 32, color: COLORS.rule,
  },
  starIconActive: {
    color: COLORS.terracotta,
  },
  commentInput: {
    backgroundColor: COLORS.paper,
    borderWidth: 1, borderColor: COLORS.rule,
    borderRadius: 4, padding: 12,
    fontFamily: FONTS.serif, fontSize: 14, color: COLORS.ink,
    lineHeight: 20, marginBottom: 14,
    minHeight: 60, textAlignVertical: 'top',
  },
  saveRatingBtn: {
    paddingVertical: 12, borderRadius: 4,
    backgroundColor: COLORS.terracotta, alignItems: 'center',
  },
  saveRatingBtnDisabled: {
    backgroundColor: COLORS.creamDeep,
  },
  saveRatingBtnTxt: {
    color: COLORS.cream, fontFamily: FONTS.mono,
    fontSize: 11, letterSpacing: 1.5,
  },
  saveRatingBtnTxtSaved: {
    color: COLORS.olive,
  },
});
