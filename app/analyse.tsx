import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Easing,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from './navigator';
import { analysePhoto, type Recipe } from '../services/api';
import { useFrigo } from '../hooks/useFrigo';

type Props = NativeStackScreenProps<RootStackParamList, 'Analyse'>;

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
  errorBg: '#FFF3F3',
  errorBorder: '#FFCDD2',
  errorText: '#C62828',
};

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner() {
  const rotation = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.12, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const spin = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View style={[styles.spinnerOuter, { transform: [{ scale: pulse }] }]}>
      <Animated.View style={[styles.spinnerArc, { transform: [{ rotate: spin }] }]} />
      <Text style={styles.spinnerEmoji}>🥦</Text>
    </Animated.View>
  );
}

// ─── Loading dot ──────────────────────────────────────────────────────────────
function LoadingDot({ delay }: { delay: number }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 500, delay, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return <Animated.View style={[styles.loadingDot, { opacity }]} />;
}

// ─── Recipe card ──────────────────────────────────────────────────────────────
function RecipeCard({ recipe, index }: { recipe: Recipe; index: number }) {
  const slideAnim = useRef(new Animated.Value(40)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 380,
        delay: index * 120,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 380,
        delay: index * 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[styles.recipeCard, { opacity: opacityAnim, transform: [{ translateY: slideAnim }] }]}
    >
      {/* Header */}
      <View style={styles.recipeHeader}>
        <View style={styles.recipeEmojiWrapper}>
          <Text style={styles.recipeEmoji}>{recipe.emoji}</Text>
        </View>
        <View style={styles.recipeMeta}>
          <Text style={styles.recipeName}>{recipe.name}</Text>
          <View style={styles.recipeBadges}>
            <View style={styles.badge}>
              <Text style={styles.badgeTxt}>⏱ {recipe.time}</Text>
            </View>
            <View style={[styles.badge, styles.badgeGreen]}>
              <Text style={[styles.badgeTxt, styles.badgeGreenTxt]}>{recipe.difficulty}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Description */}
      <Text style={styles.recipeDescription}>{recipe.description}</Text>

      {/* Ingredients */}
      <View style={styles.ingredientsRow}>
        {recipe.ingredients.map((ing) => (
          <View key={ing} style={styles.ingredientChip}>
            <Text style={styles.ingredientTxt}>{ing}</Text>
          </View>
        ))}
      </View>

      {/* Steps — toggled */}
      {expanded && (
        <View style={styles.stepsList}>
          {recipe.steps.map((s) => (
            <View key={s.step} style={styles.stepRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberTxt}>{s.step}</Text>
              </View>
              <Text style={styles.stepInstruction}>{s.instruction}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Toggle CTA */}
      <TouchableOpacity
        style={styles.recipeBtn}
        activeOpacity={0.8}
        onPress={() => setExpanded((v) => !v)}
      >
        <Text style={styles.recipeBtnTxt}>
          {expanded ? 'Masquer les étapes ↑' : 'Voir les étapes ↓'}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function AnalyseScreen({ route, navigation }: Props) {
  const { photoUri, ingredientText } = route.params;

  type Phase = 'loading' | 'results' | 'error';
  const [phase, setPhase] = useState<Phase>('loading');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [detectedIngredients, setDetectedIngredients] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  const { addIngredients } = useFrigo();

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const result = await analysePhoto({ photoUri, ingredientText });
        if (cancelled) return;
        setRecipes(result.recipes);
        setDetectedIngredients(result.detectedIngredients);
        setPhase('results');
        // Persist detected ingredients to the frigo
        if (result.detectedIngredients.length > 0) {
          addIngredients(result.detectedIngredients);
        }
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Une erreur inattendue est survenue.';
        setErrorMessage(message);
        setPhase('error');
      }
    }

    run();
    return () => { cancelled = true; };
  }, []);

  const handleRetake = () => navigation.goBack();

  // ── Loading ──────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar style="light" backgroundColor={COLORS.green} />

        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.previewImage} resizeMode="cover" />
        ) : (
          <View style={styles.textPreviewBox}>
            <Text style={styles.textPreviewLabel}>Ingrédients saisis</Text>
            <Text style={styles.textPreviewContent}>{ingredientText}</Text>
          </View>
        )}

        <View style={styles.loaderBox}>
          <Spinner />
          <Text style={styles.loaderTitle}>FrigoAI analyse votre frigo...</Text>
          <Text style={styles.loaderSubtitle}>
            Identification des ingrédients et recherche de recettes
          </Text>

          <View style={styles.stepsListLoader}>
            {["Analyse de l'image", 'Identification des aliments', 'Génération des recettes'].map(
              (step, i) => (
                <View key={step} style={styles.stepRowLoader}>
                  <LoadingDot delay={i * 300} />
                  <Text style={styles.stepTxt}>{step}</Text>
                </View>
              )
            )}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (phase === 'error') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" backgroundColor={COLORS.green} />

        <View style={styles.header}>
          <TouchableOpacity onPress={handleRetake} style={styles.backBtn}>
            <Text style={styles.backBtnTxt}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Erreur d'analyse</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Oups, quelque chose s'est mal passé</Text>
          <View style={styles.errorBox}>
            <Text style={styles.errorMsg}>{errorMessage}</Text>
          </View>
          <TouchableOpacity style={styles.retryBtn} onPress={handleRetake}>
            <Text style={styles.retryBtnTxt}>← Réessayer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Results ──────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" backgroundColor={COLORS.green} />

      <View style={styles.header}>
        <TouchableOpacity onPress={handleRetake} style={styles.backBtn}>
          <Text style={styles.backBtnTxt}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Recettes suggérées</Text>
          <Text style={styles.headerSubtitle}>{recipes.length} idées pour ce soir</Text>
        </View>
        <TouchableOpacity onPress={handleRetake} style={styles.retakeBtn}>
          <Text style={styles.retakeBtnTxt}>Recommencer</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Source preview */}
        {photoUri ? (
          <View style={styles.sourceCard}>
            <Image source={{ uri: photoUri }} style={styles.sourcePhoto} resizeMode="cover" />
            <View style={styles.sourceOverlay}>
              <Text style={styles.sourceLabel}>📷  Votre frigo</Text>
            </View>
          </View>
        ) : (
          <View style={styles.sourceCard}>
            <View style={styles.sourceTextBox}>
              <Text style={styles.sourceTextLabel}>✏️  Ingrédients saisis</Text>
              <Text style={styles.sourceTextContent} numberOfLines={2}>
                {ingredientText}
              </Text>
            </View>
          </View>
        )}

        {/* Detected ingredients */}
        {detectedIngredients.length > 0 && (
          <View style={styles.detectedBox}>
            <Text style={styles.detectedTitle}>🔍  Ingrédients détectés</Text>
            <View style={styles.ingredientsRow}>
              {detectedIngredients.map((ing) => (
                <View key={ing} style={[styles.ingredientChip, styles.ingredientChipDetected]}>
                  <Text style={styles.ingredientTxt}>{ing}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Count */}
        <Text style={styles.sectionTitle}>
          <Text style={styles.sectionCount}>{recipes.length}</Text> recettes trouvées
        </Text>

        {/* Recipe cards */}
        {recipes.map((recipe, i) => (
          <RecipeCard key={`${recipe.name}-${i}`} recipe={recipe} index={i} />
        ))}

        {/* Bottom CTA */}
        <TouchableOpacity style={styles.bottomRetakeBtn} onPress={handleRetake} activeOpacity={0.85}>
          <Text style={styles.bottomRetakeTxt}>📸  Analyser un autre frigo</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // ── Loading ──────────────────────────────────────────────────────────────────
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.green,
  },
  previewImage: {
    width: '100%',
    height: 220,
    opacity: 0.55,
  },
  textPreviewBox: {
    margin: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    padding: 16,
  },
  textPreviewLabel: {
    color: COLORS.greenPale,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textPreviewContent: {
    color: COLORS.white,
    fontSize: 15,
    lineHeight: 22,
  },
  loaderBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  spinnerOuter: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  spinnerArc: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: 'transparent',
    borderTopColor: COLORS.white,
    borderRightColor: 'rgba(255,255,255,0.4)',
  },
  spinnerEmoji: {
    fontSize: 30,
  },
  loaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  loaderSubtitle: {
    fontSize: 13,
    color: COLORS.greenPale,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 19,
  },
  stepsListLoader: {
    alignSelf: 'stretch',
    gap: 12,
  },
  stepRowLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.white,
  },
  stepTxt: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '500',
  },

  // ── Error ─────────────────────────────────────────────────────────────────────
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    backgroundColor: COLORS.offWhite,
  },
  errorIcon: {
    fontSize: 52,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
    textAlign: 'center',
    marginBottom: 16,
  },
  errorBox: {
    backgroundColor: COLORS.errorBg,
    borderWidth: 1,
    borderColor: COLORS.errorBorder,
    borderRadius: 12,
    padding: 16,
    alignSelf: 'stretch',
    marginBottom: 24,
  },
  errorMsg: {
    fontSize: 13,
    color: COLORS.errorText,
    lineHeight: 20,
  },
  retryBtn: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    backgroundColor: COLORS.green,
  },
  retryBtnTxt: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },

  // ── Results ───────────────────────────────────────────────────────────────────
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.green,
  },
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
  retakeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  retakeBtnTxt: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
    backgroundColor: COLORS.offWhite,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  // Source card
  sourceCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  sourcePhoto: {
    width: '100%',
    height: 140,
  },
  sourceOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 10,
  },
  sourceLabel: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
  },
  sourceTextBox: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 16,
  },
  sourceTextLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.greenMid,
    marginBottom: 6,
  },
  sourceTextContent: {
    fontSize: 14,
    color: COLORS.textDark,
    lineHeight: 20,
  },

  // Detected ingredients
  detectedBox: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  detectedTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.greenMid,
    marginBottom: 10,
  },

  // Section title
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 12,
  },
  sectionCount: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.greenMid,
  },

  // Recipe card
  recipeCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  recipeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 12,
  },
  recipeEmojiWrapper: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: COLORS.offWhite,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  recipeEmoji: {
    fontSize: 26,
  },
  recipeMeta: {
    flex: 1,
  },
  recipeName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 6,
    lineHeight: 20,
  },
  recipeBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#F0F4F0',
  },
  badgeGreen: {
    backgroundColor: COLORS.greenPale,
  },
  badgeTxt: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  badgeGreenTxt: {
    color: COLORS.greenMid,
  },
  recipeDescription: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 19,
    marginBottom: 12,
  },
  ingredientsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  ingredientChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: COLORS.offWhite,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  ingredientChipDetected: {
    backgroundColor: COLORS.greenPale,
    borderColor: COLORS.greenLight,
  },
  ingredientTxt: {
    fontSize: 12,
    color: COLORS.textDark,
    fontWeight: '500',
  },

  // Steps
  stepsList: {
    gap: 8,
    marginBottom: 14,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.green,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  stepNumberTxt: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  stepInstruction: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textDark,
    lineHeight: 20,
  },

  // CTA
  recipeBtn: {
    backgroundColor: COLORS.green,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  recipeBtnTxt: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },

  // Bottom CTA
  bottomRetakeBtn: {
    marginTop: 8,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.greenLight,
  },
  bottomRetakeTxt: {
    color: COLORS.greenMid,
    fontSize: 15,
    fontWeight: '700',
  },
});
