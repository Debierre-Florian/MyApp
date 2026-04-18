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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { analysePhoto, type Recipe } from '../services/api';
import { useFrigo } from '../hooks/useFrigo';
import { usePreferences } from '../hooks/usePreferences';
import { RECIPES_HISTORY_KEY } from './recettes';
import { COLORS, FONTS } from '../constants/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Analyse'>;

function LoadingDot({ delay }: { delay: number }) {
  const opacity = useRef(new Animated.Value(0.2)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 500, delay, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.2, duration: 500, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return <Animated.View style={[styles.loadingDot, { opacity }]} />;
}

function RecipeCard({
  recipe, index, onPress,
}: {
  recipe: Recipe; index: number; onPress: () => void;
}) {
  const slide = useRef(new Animated.Value(30)).current;
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(slide, {
        toValue: 0, duration: 380, delay: index * 100,
        easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
      Animated.timing(fade, { toValue: 1, duration: 380, delay: index * 100, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.recipeCard, { opacity: fade, transform: [{ translateY: slide }] }]}>
      <View style={styles.recipeHead}>
        <View style={styles.recipeEmojiBox}>
          <Text style={styles.recipeEmoji}>{recipe.emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.recipeName}>{recipe.name}</Text>
          <View style={styles.recipeMeta}>
            <Text style={styles.recipeTime}>⏱ {recipe.time.toUpperCase()}</Text>
            <Text style={styles.recipeDot}>·</Text>
            <Text style={styles.recipeDifficulty}>{recipe.difficulty}</Text>
          </View>
        </View>
      </View>
      <Text style={styles.recipeDesc}>{recipe.description}</Text>
      <View style={styles.ingredientsRow}>
        {recipe.ingredients.map((ing) => (
          <View key={ing} style={styles.ingredientChip}>
            <Text style={styles.ingredientTxt}>{ing}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity style={styles.recipeBtn} activeOpacity={0.85} onPress={onPress}>
        <Text style={styles.recipeBtnTxt}>VOIR LA RECETTE →</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function AnalyseScreen({ route, navigation }: Props) {
  const { photoUri, ingredientText } = route.params;
  type Phase = 'loading' | 'results' | 'error';
  const [phase, setPhase] = useState<Phase>('loading');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [detected, setDetected] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const { addIngredients } = useFrigo();
  const { preferences } = usePreferences();

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const result = await analysePhoto({ photoUri, ingredientText, preferences });
        if (cancelled) return;
        setRecipes(result.recipes);
        setDetected(result.detectedIngredients);
        setPhase('results');
        if (result.detectedIngredients.length > 0) {
          addIngredients(result.detectedIngredients);
        }
        if (result.recipes.length > 0) {
          const raw = await AsyncStorage.getItem(RECIPES_HISTORY_KEY);
          const existing: Recipe[] = raw ? JSON.parse(raw) : [];
          const merged = [...result.recipes, ...existing].slice(0, 50);
          await AsyncStorage.setItem(RECIPES_HISTORY_KEY, JSON.stringify(merged));
        }
      } catch (err) {
        if (cancelled) return;
        setErrorMessage(err instanceof Error ? err.message : 'Une erreur inattendue est survenue.');
        setPhase('error');
      }
    }
    run();
    return () => { cancelled = true; };
  }, []);

  const handleRetake = () => navigation.goBack();

  if (phase === 'loading') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" backgroundColor={COLORS.cream} />
        <View style={styles.loadingBox}>
          <Text style={styles.loadingKicker}>EN COURS D'ANALYSE</Text>
          <Text style={styles.loadingTitle}>
            <Text style={styles.loadingItalic}>Identification</Text>{'\n'}des ingrédients…
          </Text>
          <View style={styles.stepsList}>
            {["Analyse de l'image", 'Identification des aliments', 'Génération des recettes'].map(
              (step, i) => (
                <View key={step} style={styles.stepRow}>
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

  if (phase === 'error') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" backgroundColor={COLORS.cream} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorKicker}>ERREUR</Text>
          <Text style={styles.errorTitle}>
            Oups, <Text style={styles.loadingItalic}>quelque chose</Text>{'\n'}s'est mal passé.
          </Text>
          <View style={styles.errorBox}>
            <Text style={styles.errorMsg}>{errorMessage}</Text>
          </View>
          <TouchableOpacity style={styles.retryBtn} onPress={handleRetake}>
            <Text style={styles.retryBtnTxt}>← RÉESSAYER</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor={COLORS.cream} />

      <View style={styles.header}>
        <TouchableOpacity onPress={handleRetake} style={styles.backBtn}>
          <Text style={styles.backBtnTxt}>←</Text>
        </TouchableOpacity>
        <Text style={styles.kicker}>RECETTES · {recipes.length} IDÉES</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>
          Pour <Text style={styles.loadingItalic}>ce soir</Text>.
        </Text>
        <View style={styles.rule} />

        {photoUri ? (
          <View style={styles.sourceCard}>
            <Image source={{ uri: photoUri }} style={styles.sourcePhoto} resizeMode="cover" />
            <View style={styles.sourceOverlay}>
              <Text style={styles.sourceLabel}>PRISE AUJOURD'HUI</Text>
            </View>
          </View>
        ) : (
          <View style={styles.sourceTextBox}>
            <Text style={styles.sourceTextKicker}>INGRÉDIENTS SAISIS</Text>
            <Text style={styles.sourceTextContent} numberOfLines={2}>{ingredientText}</Text>
          </View>
        )}

        {detected.length > 0 && (
          <View style={styles.detectedBox}>
            <Text style={styles.detectedKicker}>◉ INGRÉDIENTS DÉTECTÉS</Text>
            <View style={styles.ingredientsRow}>
              {detected.map((ing) => (
                <View key={ing} style={[styles.ingredientChip, styles.ingredientChipDetected]}>
                  <Text style={styles.ingredientTxt}>{ing}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <Text style={styles.sectionLabel}>{recipes.length} RECETTES TROUVÉES</Text>

        {recipes.map((recipe, i) => (
          <RecipeCard
            key={`${recipe.name}-${i}`}
            recipe={recipe}
            index={i}
            onPress={() => navigation.navigate('RecetteDetail', { recipe })}
          />
        ))}

        <TouchableOpacity style={styles.retakeBtn} onPress={handleRetake} activeOpacity={0.85}>
          <Text style={styles.retakeBtnTxt}>◉ ANALYSER UN AUTRE FRIGO</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.cream },

  // Loading
  loadingBox: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  loadingKicker: {
    fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 1.5,
    color: COLORS.terracotta, marginBottom: 12,
  },
  loadingTitle: {
    fontFamily: FONTS.serif, fontSize: 36, lineHeight: 40,
    color: COLORS.ink, textAlign: 'center', fontWeight: '700', letterSpacing: -1,
    marginBottom: 28,
  },
  loadingItalic: {
    fontFamily: FONTS.serifItalic, fontStyle: 'italic', color: COLORS.terracotta,
  },
  stepsList: { alignSelf: 'stretch', gap: 12 },
  stepRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.paper,
    borderWidth: 1, borderColor: COLORS.rule,
    borderRadius: 4, paddingVertical: 12, paddingHorizontal: 14,
  },
  loadingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.terracotta },
  stepTxt: { fontFamily: FONTS.serif, fontSize: 14, color: COLORS.ink },

  // Error
  errorContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28,
  },
  errorKicker: {
    fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 1.5,
    color: COLORS.terracotta, marginBottom: 12,
  },
  errorTitle: {
    fontFamily: FONTS.serif, fontSize: 32, lineHeight: 36,
    color: COLORS.ink, textAlign: 'center', fontWeight: '700', marginBottom: 20,
  },
  errorBox: {
    backgroundColor: COLORS.terracottaBg,
    borderWidth: 1, borderColor: COLORS.terracotta,
    borderRadius: 4, padding: 16,
    alignSelf: 'stretch', marginBottom: 24,
  },
  errorMsg: {
    fontFamily: FONTS.serif, fontSize: 14, color: COLORS.ink, lineHeight: 20,
  },
  retryBtn: {
    paddingVertical: 12, paddingHorizontal: 24,
    borderWidth: 1, borderColor: COLORS.ink, borderRadius: 4,
  },
  retryBtnTxt: {
    color: COLORS.ink, fontFamily: FONTS.mono,
    fontSize: 11, letterSpacing: 1.5,
  },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backBtnTxt: { color: COLORS.ink, fontSize: 24, fontFamily: FONTS.serif },
  kicker: { fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1.5, color: COLORS.inkSoft },

  scrollContent: { padding: 24, paddingTop: 0, paddingBottom: 48 },

  title: {
    fontFamily: FONTS.serif, fontSize: 42, lineHeight: 46,
    color: COLORS.ink, fontWeight: '700', letterSpacing: -1,
  },
  rule: { height: 1, backgroundColor: COLORS.ink, marginTop: 14, marginBottom: 20 },

  sectionLabel: {
    fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1.5,
    color: COLORS.olive, marginBottom: 10, marginTop: 8,
  },

  // Source
  sourceCard: {
    borderRadius: 4, overflow: 'hidden', marginBottom: 16,
    borderWidth: 1, borderColor: COLORS.rule,
  },
  sourcePhoto: { width: '100%', height: 160 },
  sourceOverlay: {
    position: 'absolute', bottom: 8, left: 8,
    backgroundColor: 'rgba(30,27,22,0.85)',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 3,
  },
  sourceLabel: {
    color: COLORS.cream, fontFamily: FONTS.mono,
    fontSize: 9, letterSpacing: 1.3,
  },
  sourceTextBox: {
    backgroundColor: COLORS.paper,
    borderWidth: 1, borderColor: COLORS.rule,
    borderRadius: 4, padding: 14, marginBottom: 16,
  },
  sourceTextKicker: {
    fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1.3,
    color: COLORS.terracotta, marginBottom: 6,
  },
  sourceTextContent: {
    fontFamily: FONTS.serif, fontSize: 15, color: COLORS.ink, lineHeight: 22,
  },

  detectedBox: {
    backgroundColor: COLORS.oliveBg,
    borderWidth: 1, borderColor: COLORS.oliveSoft,
    borderRadius: 4, padding: 14, marginBottom: 16,
  },
  detectedKicker: {
    fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1.3,
    color: COLORS.olive, marginBottom: 10,
  },

  // Recipe card
  recipeCard: {
    backgroundColor: COLORS.paper,
    borderWidth: 1, borderColor: COLORS.rule,
    borderRadius: 4, padding: 16, marginBottom: 12,
  },
  recipeHead: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  recipeEmojiBox: {
    width: 48, height: 48, borderRadius: 4,
    backgroundColor: COLORS.creamDeep,
    alignItems: 'center', justifyContent: 'center',
  },
  recipeEmoji: { fontSize: 26 },
  recipeName: {
    fontFamily: FONTS.serif, fontSize: 17,
    color: COLORS.ink, marginBottom: 4, lineHeight: 22,
  },
  recipeMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  recipeTime: {
    fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1, color: COLORS.terracotta,
  },
  recipeDot: { color: COLORS.muted },
  recipeDifficulty: {
    fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 0.8, color: COLORS.olive,
    paddingHorizontal: 5, paddingVertical: 1,
    borderWidth: 1, borderColor: COLORS.oliveSoft, borderRadius: 3,
  },
  recipeDesc: {
    fontFamily: FONTS.serif, fontSize: 14,
    color: COLORS.inkSoft, lineHeight: 20, marginBottom: 12,
  },
  ingredientsRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14,
  },
  ingredientChip: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 3,
    backgroundColor: COLORS.cream,
    borderWidth: 1, borderColor: COLORS.rule,
  },
  ingredientChipDetected: {
    backgroundColor: COLORS.paper, borderColor: COLORS.oliveSoft,
  },
  ingredientTxt: {
    fontFamily: FONTS.serif, fontSize: 12, color: COLORS.ink,
  },

  recipeBtn: {
    backgroundColor: COLORS.ink, borderRadius: 4,
    paddingVertical: 11, alignItems: 'center',
  },
  recipeBtnTxt: {
    color: COLORS.cream, fontFamily: FONTS.mono,
    fontSize: 11, letterSpacing: 1.5, fontWeight: '700',
  },

  retakeBtn: {
    marginTop: 8, paddingVertical: 14,
    borderRadius: 4, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.ink,
  },
  retakeBtnTxt: {
    color: COLORS.ink, fontFamily: FONTS.mono,
    fontSize: 11, letterSpacing: 1.5, fontWeight: '700',
  },
});
