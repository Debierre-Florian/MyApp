import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from './navigator';
import { useFrigo } from '../hooks/useFrigo';

type Props = NativeStackScreenProps<HomeStackParamList, 'RecetteDetail'>;

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
  available: '#2E7D32',
  availableBg: '#E8F5E9',
  availableBorder: '#A5D6A7',
  missing: '#C62828',
  missingBg: '#FFEBEE',
  missingBorder: '#FFCDD2',
  checked: '#43A047',
  unchecked: '#D0D5D0',
};

export default function RecetteScreen({ route, navigation }: Props) {
  const { recipe } = route.params;
  const { ingredients: frigoIngredients } = useFrigo();

  // Set of frigo ingredient names (lowercase) for O(1) lookup
  const frigoNames = new Set(frigoIngredients.map((i) => i.name.toLowerCase()));

  // Track which steps are checked
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const toggleStep = (stepNum: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(stepNum)) {
        next.delete(stepNum);
      } else {
        next.add(stepNum);
      }
      return next;
    });
  };

  const available = recipe.ingredients.filter((ing) => frigoNames.has(ing.toLowerCase()));
  const missing = recipe.ingredients.filter((ing) => !frigoNames.has(ing.toLowerCase()));
  const progress = recipe.steps.length > 0 ? checked.size / recipe.steps.length : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" backgroundColor={COLORS.green} />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnTxt}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerEmoji}>{recipe.emoji}</Text>
          <Text style={styles.headerTitle} numberOfLines={2}>
            {recipe.name}
          </Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Badges ────────────────────────────────────────────────────────── */}
        <View style={styles.badgesRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeTxt}>⏱ {recipe.time}</Text>
          </View>
          <View style={[styles.badge, styles.badgeGreen]}>
            <Text style={[styles.badgeTxt, styles.badgeGreenTxt]}>{recipe.difficulty}</Text>
          </View>
          <View style={[styles.badge, styles.badgeProgress]}>
            <Text style={[styles.badgeTxt, styles.badgeProgressTxt]}>
              {checked.size}/{recipe.steps.length} étapes
            </Text>
          </View>
        </View>

        {/* ── Description ───────────────────────────────────────────────────── */}
        <Text style={styles.description}>{recipe.description}</Text>

        {/* ── Progress bar ──────────────────────────────────────────────────── */}
        {recipe.steps.length > 0 && (
          <View style={styles.progressSection}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` as any }]} />
            </View>
            {progress === 1 && (
              <Text style={styles.progressDone}>Recette terminée ! 🎉</Text>
            )}
          </View>
        )}

        {/* ── Ingrédients ───────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛒  Ingrédients</Text>

          {available.length > 0 && (
            <View style={styles.ingredientGroup}>
              <Text style={styles.ingredientGroupLabel}>Dans ton frigo</Text>
              {available.map((ing) => (
                <View key={ing} style={[styles.ingredientRow, styles.ingredientAvailable]}>
                  <Text style={styles.ingredientDot}>✓</Text>
                  <Text style={[styles.ingredientName, styles.ingredientNameAvailable]}>{ing}</Text>
                </View>
              ))}
            </View>
          )}

          {missing.length > 0 && (
            <View style={styles.ingredientGroup}>
              <Text style={styles.ingredientGroupLabel}>À acheter</Text>
              {missing.map((ing) => (
                <View key={ing} style={[styles.ingredientRow, styles.ingredientMissing]}>
                  <Text style={styles.ingredientDotMissing}>✗</Text>
                  <Text style={[styles.ingredientName, styles.ingredientNameMissing]}>{ing}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── Étapes ────────────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👨‍🍳  Étapes</Text>

          {recipe.steps.map((s) => {
            const done = checked.has(s.step);
            return (
              <TouchableOpacity
                key={s.step}
                style={[styles.stepRow, done && styles.stepRowDone]}
                activeOpacity={0.7}
                onPress={() => toggleStep(s.step)}
              >
                <View style={[styles.checkbox, done && styles.checkboxDone]}>
                  {done && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepNum}>Étape {s.step}</Text>
                  <Text style={[styles.stepInstruction, done && styles.stepInstructionDone]}>
                    {s.instruction}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Reset ─────────────────────────────────────────────────────────── */}
        {checked.size > 0 && (
          <TouchableOpacity
            style={styles.resetBtn}
            activeOpacity={0.8}
            onPress={() => setChecked(new Set())}
          >
            <Text style={styles.resetBtnTxt}>Recommencer la recette</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.green,
  },

  // ── Header ──────────────────────────────────────────────────────────────────
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
    paddingHorizontal: 8,
  },
  headerEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 22,
  },

  // ── Scroll ──────────────────────────────────────────────────────────────────
  scroll: {
    flex: 1,
    backgroundColor: COLORS.offWhite,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 48,
  },

  // ── Badges ──────────────────────────────────────────────────────────────────
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#F0F4F0',
  },
  badgeGreen: {
    backgroundColor: COLORS.greenPale,
  },
  badgeProgress: {
    backgroundColor: '#E3F2FD',
  },
  badgeTxt: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  badgeGreenTxt: {
    color: COLORS.greenMid,
  },
  badgeProgressTxt: {
    color: '#1565C0',
  },

  // ── Description ─────────────────────────────────────────────────────────────
  description: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 21,
    marginBottom: 16,
  },

  // ── Progress ────────────────────────────────────────────────────────────────
  progressSection: {
    marginBottom: 20,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D0D5D0',
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.greenLight,
  },
  progressDone: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.greenMid,
    textAlign: 'center',
  },

  // ── Section ─────────────────────────────────────────────────────────────────
  section: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
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

  // ── Ingredients ─────────────────────────────────────────────────────────────
  ingredientGroup: {
    marginBottom: 12,
  },
  ingredientGroupLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 6,
    gap: 10,
  },
  ingredientAvailable: {
    backgroundColor: COLORS.availableBg,
    borderWidth: 1,
    borderColor: COLORS.availableBorder,
  },
  ingredientMissing: {
    backgroundColor: COLORS.missingBg,
    borderWidth: 1,
    borderColor: COLORS.missingBorder,
  },
  ingredientDot: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.available,
    width: 18,
    textAlign: 'center',
  },
  ingredientDotMissing: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.missing,
    width: 18,
    textAlign: 'center',
  },
  ingredientName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  ingredientNameAvailable: {
    color: COLORS.available,
  },
  ingredientNameMissing: {
    color: COLORS.missing,
  },

  // ── Steps ───────────────────────────────────────────────────────────────────
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  stepRowDone: {
    opacity: 0.55,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: COLORS.unchecked,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  checkboxDone: {
    backgroundColor: COLORS.checked,
    borderColor: COLORS.checked,
  },
  checkmark: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },
  stepContent: {
    flex: 1,
  },
  stepNum: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.greenMid,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  stepInstruction: {
    fontSize: 14,
    color: COLORS.textDark,
    lineHeight: 21,
  },
  stepInstructionDone: {
    textDecorationLine: 'line-through',
    color: COLORS.textMuted,
  },

  // ── Reset ────────────────────────────────────────────────────────────────────
  resetBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
  },
  resetBtnTxt: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
});
