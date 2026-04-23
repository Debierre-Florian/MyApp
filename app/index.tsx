import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { CameraView } from 'expo-camera';
import { useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useFrigo } from '../hooks/useFrigo';
import { usePreferences } from '../hooks/usePreferences';
import { useScore } from '../hooks/useScore';
import { initNotifications } from '../services/notifications';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCamera } from '../hooks/useCamera';
import { RootStackParamList, TabParamList } from './navigator';
import { COLORS, FONTS } from '../constants/theme';
import { useProfils, PROFILE_COLORS, COLOR_OPTIONS, type ProfileColor } from '../hooks/useProfils';
import { useHistorique } from '../hooks/useHistorique';
import { useAbonnement } from '../hooks/useAbonnement';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

const { width } = Dimensions.get('window');

const DAYS = ['DIMANCHE', 'LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];

function daysOld(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

export default function HomeScreen({ navigation }: Props) {
  const { cameraRef, permission, cameraState, capturedPhoto, openCamera, closeCamera, takePicture, retake } =
    useCamera();
  const { ingredients, checkExpiringIngredients } = useFrigo();
  const { historique } = useHistorique();
  const { preferences } = usePreferences();
  const score = useScore();
  const { profils, activeId, setActiveId, addProfil } = useProfils();
  const { plan } = useAbonnement();

  useEffect(() => {
    initNotifications(checkExpiringIngredients());
  }, [checkExpiringIngredients]);

  useEffect(() => {
    if (cameraState === 'active' || cameraState === 'captured') {
      navigation.setOptions({ tabBarStyle: { display: 'none' } });
    } else {
      navigation.setOptions({ tabBarStyle: undefined });
    }
  }, [cameraState, navigation]);

  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [ingredientText, setIngredientText] = useState('');
  const [addProfilVisible, setAddProfilVisible] = useState(false);
  const [newFirstName, setNewFirstName] = useState('');
  const [newColor, setNewColor] = useState<ProfileColor>('terracotta');

  const handleAddProfil = () => {
    if (!newFirstName.trim()) return;
    addProfil(newFirstName, newColor);
    setAddProfilVisible(false);
    setNewFirstName('');
    setNewColor('terracotta');
  };

  const handlePickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      navigation.navigate('Analyse', { photoUri: result.assets[0].uri });
    }
  };

  const handleManualSubmit = () => {
    if (!ingredientText.trim()) return;
    setManualModalVisible(false);
    navigation.navigate('Analyse', { ingredientText });
    setIngredientText('');
  };

  // ─── Camera active ────────────────────────────────────────────────────────
  if (cameraState === 'active') {
    return (
      <View style={styles.cameraContainer}>
        <StatusBar style="light" />
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
        <SafeAreaView style={styles.cameraTopBar}>
          <TouchableOpacity onPress={closeCamera} style={styles.cameraCloseBtn}>
            <Text style={styles.cameraCloseTxt}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.cameraHint}>Cadrez votre frigo</Text>
          <View style={{ width: 44 }} />
        </SafeAreaView>
        <View style={styles.viewfinderWrapper}>
          <View style={styles.viewfinder}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
        </View>
        <SafeAreaView style={styles.shutterBar}>
          <TouchableOpacity onPress={takePicture} style={styles.shutterBtn}>
            <View style={styles.shutterInner} />
          </TouchableOpacity>
        </SafeAreaView>
        <TouchableOpacity onPress={handlePickFromGallery} style={styles.galleryFab}>
          <Text style={styles.galleryFabIcon}>🖼️</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (cameraState === 'captured' && capturedPhoto) {
    return (
      <View style={styles.cameraContainer}>
        <StatusBar style="light" />
        <Image source={{ uri: capturedPhoto.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <SafeAreaView style={styles.captureOverlay}>
          <Text style={styles.captureTitle}>Photo prise.</Text>
          <Text style={styles.captureSubtitle}>Analyser ce frigo ?</Text>
          <View style={styles.captureActions}>
            <TouchableOpacity onPress={retake} style={styles.captureSecondaryBtn}>
              <Text style={styles.captureSecondaryTxt}>Reprendre</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                const uri = capturedPhoto.uri;
                closeCamera();
                navigation.navigate('Analyse', { photoUri: uri });
              }}
              style={styles.capturePrimaryBtn}
            >
              <Text style={styles.capturePrimaryTxt}>Analyser</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (permission && !permission.granted && !permission.canAskAgain) {
    return (
      <SafeAreaView style={styles.permissionScreen}>
        <StatusBar style="dark" />
        <Text style={styles.permissionIcon}>◉</Text>
        <Text style={styles.permissionTitle}>Accès caméra refusé</Text>
        <Text style={styles.permissionText}>
          Autorisez l'accès à la caméra dans les réglages de votre appareil.
        </Text>
      </SafeAreaView>
    );
  }

  // ─── Home ─────────────────────────────────────────────────────────────────
  const now = new Date();
  const dayLabel = DAYS[now.getDay()];
  const urgent = ingredients
    .map((i) => ({ ...i, days: daysOld(i.addedAt) }))
    .filter((i) => i.days >= 5)
    .sort((a, b) => b.days - a.days)
    .slice(0, 3);
  const freshCount = ingredients.filter((i) => daysOld(i.addedAt) < 5).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor={COLORS.cream} />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* ── Top bar ──────────────────────────────────────────────────── */}
        <View style={styles.topBar}>
          <Text style={styles.topBarKicker}>
            № {score.weekNumber} · {dayLabel}
          </Text>
          <View style={styles.avatarsRow}>
            {profils.map((p) => {
              const initial = (p.firstName.trim()[0] || '?').toUpperCase();
              const isActive = p.id === activeId;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.avatarBtn,
                    { backgroundColor: PROFILE_COLORS[p.color] },
                    isActive && styles.avatarBtnActive,
                  ]}
                  onPress={() => setActiveId(p.id)}
                  hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                >
                  <Text style={styles.avatarTxt}>{initial}</Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={styles.addProfilBtn}
              onPress={() => setAddProfilVisible(true)}
              hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
            >
              <Text style={styles.addProfilBtnTxt}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Masthead ─────────────────────────────────────────────────── */}
        <Text style={styles.kicker}>— journal du frigo —</Text>
        <Text style={styles.masthead}>
          Larder<Text style={styles.mastheadDot}>.</Text>
        </Text>
        <View style={styles.mastheadRule} />
        <View style={styles.mastheadMeta}>
          <Text style={styles.mastheadMetaTxt}>
            {ingredients.length} PRODUIT{ingredients.length !== 1 ? 'S' : ''} · FRAIS
          </Text>
          <Text style={styles.mastheadMetaTxt}>
            {urgent.length} À UTILISER
          </Text>
        </View>

        {/* ── Score card ───────────────────────────────────────────────── */}
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>
            SCORE ANTI-GASPI · SEMAINE {score.weekNumber}
          </Text>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreValue}>{score.score}</Text>
            <Text style={styles.scoreOutOf}>/100</Text>
          </View>
          <View style={styles.scoreTrack}>
            <View style={[styles.scoreFill, { width: `${score.score}%` as any }]} />
          </View>
        </View>

        {/* ── Twin tiles ───────────────────────────────────────────────── */}
        <View style={styles.tilesRow}>
          <View style={[styles.tile, styles.tileOlive]}>
            <Text style={styles.tileValue}>
              {score.savedKg.toFixed(1)}
              <Text style={styles.tileUnit}>kg</Text>
            </Text>
            <Text style={styles.tileLabel}>SAUVÉS · 7 JOURS</Text>
          </View>
          <View style={[styles.tile, styles.tileTerra]}>
            <Text style={[styles.tileValue, styles.tileValueLight]}>
              {score.savedEuros.toFixed(0)}
              <Text style={styles.tileUnit}>€</Text>
            </Text>
            <Text style={[styles.tileLabel, styles.tileLabelLight]}>ÉCONOMISÉS</Text>
          </View>
        </View>

        {/* ── Primary CTA ──────────────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={openCamera}
          activeOpacity={0.88}
        >
          <View style={styles.primaryBtnCircle}>
            <Text style={styles.primaryBtnCircleTxt}>◉</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.primaryBtnTitle}>PRENDRE LA PHOTO</Text>
            <Text style={styles.primaryBtnSub}>analyse · 2 secondes</Text>
          </View>
          <Text style={styles.primaryBtnArrow}>→</Text>
        </TouchableOpacity>

        {/* ── Secondary CTAs ───────────────────────────────────────────── */}
        <View style={styles.secondaryRow}>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => setManualModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryBtnTxt}>SAISIR</Text>
            <Text style={styles.secondaryBtnSub}>à la main</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('Ticket')}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryBtnTxt}>TICKET</Text>
            <Text style={styles.secondaryBtnSub}>de caisse</Text>
          </TouchableOpacity>
        </View>

        {/* ── Promotions ───────────────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.promosBtn}
          onPress={() => navigation.navigate('Promos')}
          activeOpacity={0.8}
        >
          <Text style={styles.promosBtnIcon}>🏷️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.promosBtnTxt}>PROMOTIONS</Text>
            <Text style={styles.promosBtnSub}>bons plans du moment</Text>
          </View>
          <Text style={styles.promosArrow}>→</Text>
        </TouchableOpacity>

        {/* ── À utiliser d'abord ───────────────────────────────────────── */}
        {urgent.length > 0 && (
          <>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionDot}>●</Text>
              <Text style={styles.sectionLabel}>À UTILISER D'ABORD</Text>
            </View>
            <Text style={styles.sectionTitle}>
              {urgent.length} ingrédient{urgent.length > 1 ? 's' : ''},{' '}
              <Text style={styles.sectionTitleItalic}>cette semaine</Text>
            </Text>
            <View style={styles.chipsRow}>
              {urgent.map((i) => {
                const isRed = i.days >= 8;
                return (
                  <View
                    key={i.id}
                    style={[
                      styles.urgentChip,
                      isRed ? styles.urgentChipRed : styles.urgentChipOrange,
                    ]}
                  >
                    <Text style={styles.urgentChipName}>{i.name}</Text>
                    <Text style={[styles.urgentChipDays, isRed && styles.urgentChipDaysRed]}>
                      {i.days}j
                    </Text>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* ── Frigo CTA ────────────────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => navigation.navigate('Frigo')}
          activeOpacity={0.7}
        >
          <Text style={styles.linkTxt}>DANS LE FRIGO · {ingredients.length} ITEMS</Text>
          <Text style={styles.linkArrow}>→</Text>
        </TouchableOpacity>

        {/* ── Recette du soir ──────────────────────────────────────────── */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionDot}>●</Text>
          <Text style={styles.sectionLabel}>RECETTE DU SOIR</Text>
        </View>
        {historique.length > 0 ? (
          <TouchableOpacity
            style={styles.recipeCard}
            onPress={() => navigation.navigate('RecetteDetail', { recipe: historique[0].recipe })}
            activeOpacity={0.82}
          >
            <Text style={styles.recipeCardKicker}>DERNIÈRE CONSULTÉE</Text>
            <Text style={styles.recipeCardName}>{historique[0].recipe.name}</Text>
            <Text style={styles.recipeCardTime}>{historique[0].recipe.time}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.recipeCardEmpty}>
            <Text style={styles.recipeCardEmptyTxt}>
              Analysez votre frigo pour découvrir une recette
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ── Banner Premium ───────────────────────────────────────────── */}
      {plan === 'gratuit' && (
        <TouchableOpacity
          style={styles.premiumBanner}
          onPress={() => navigation.navigate('Abonnement')}
          activeOpacity={0.85}
        >
          <Text style={styles.premiumBannerTxt}>
            Passez Premium pour débloquer les promos personnalisées →
          </Text>
        </TouchableOpacity>
      )}

      {/* ── Add profil modal ─────────────────────────────────────────── */}
      <Modal
        visible={addProfilVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setAddProfilVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalKicker}>NOUVEAU PROFIL</Text>
            <Text style={styles.modalTitle}>Qui cuisine ?</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Prénom..."
              placeholderTextColor={COLORS.muted}
              value={newFirstName}
              onChangeText={setNewFirstName}
              autoCapitalize="words"
              returnKeyType="done"
              autoFocus
            />
            <Text style={styles.colorLabel}>COULEUR</Text>
            <View style={styles.colorRow}>
              {COLOR_OPTIONS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorDot,
                    { backgroundColor: PROFILE_COLORS[c] },
                    newColor === c && styles.colorDotSelected,
                  ]}
                  onPress={() => setNewColor(c)}
                />
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => {
                  setAddProfilVisible(false);
                  setNewFirstName('');
                  setNewColor('terracotta');
                }}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelTxt}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddProfil}
                style={[styles.modalSubmitBtn, !newFirstName.trim() && styles.modalSubmitDisabled]}
                disabled={!newFirstName.trim()}
              >
                <Text style={styles.modalSubmitTxt}>Créer →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Manual modal ─────────────────────────────────────────────── */}
      <Modal
        visible={manualModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setManualModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalKicker}>SAISIR À LA MAIN</Text>
            <Text style={styles.modalTitle}>Mes ingrédients</Text>
            <Text style={styles.modalSubtitle}>
              Séparés par des virgules ou à la ligne.
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder="carottes, poulet, courgettes..."
              placeholderTextColor={COLORS.muted}
              multiline
              numberOfLines={5}
              value={ingredientText}
              onChangeText={setIngredientText}
              textAlignVertical="top"
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => {
                  setManualModalVisible(false);
                  setIngredientText('');
                }}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelTxt}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleManualSubmit}
                style={[styles.modalSubmitBtn, !ingredientText.trim() && styles.modalSubmitDisabled]}
                disabled={!ingredientText.trim()}
              >
                <Text style={styles.modalSubmitTxt}>Trouver des recettes →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const CORNER_SIZE = 24;
const CORNER_BORDER = 3;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.cream },
  body: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    paddingTop: 8,
    backgroundColor: COLORS.cream,
    flexGrow: 1,
  },

  // Top bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 16,
  },
  topBarKicker: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    letterSpacing: 1.5,
    color: COLORS.inkSoft,
  },
  avatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  avatarBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.65,
  },
  avatarBtnActive: {
    opacity: 1,
    borderWidth: 2,
    borderColor: COLORS.ink,
  },
  avatarTxt: {
    fontFamily: FONTS.serif,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
  addProfilBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: COLORS.rule,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.paper,
  },
  addProfilBtnTxt: {
    fontFamily: FONTS.sans,
    fontSize: 20,
    color: COLORS.inkSoft,
    lineHeight: 22,
    marginTop: -1,
  },
  colorLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    color: COLORS.olive,
    marginBottom: 10,
    marginTop: 4,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  colorDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    opacity: 0.65,
  },
  colorDotSelected: {
    opacity: 1,
    borderWidth: 3,
    borderColor: COLORS.ink,
  },

  // Masthead
  kicker: {
    fontFamily: FONTS.serifItalic,
    fontStyle: 'italic',
    color: COLORS.terracotta,
    fontSize: 15,
    marginBottom: 4,
  },
  masthead: {
    fontFamily: FONTS.serif,
    fontSize: 72,
    lineHeight: 76,
    color: COLORS.ink,
    fontWeight: '700',
    letterSpacing: -2,
  },
  mastheadDot: { color: COLORS.terracotta },
  mastheadRule: {
    height: 1,
    backgroundColor: COLORS.ink,
    marginTop: 14,
    marginBottom: 10,
  },
  mastheadMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  mastheadMetaTxt: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    color: COLORS.inkSoft,
  },

  // Score card
  scoreCard: {
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.rule,
    borderRadius: 4,
    padding: 18,
    marginBottom: 12,
  },
  scoreLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    color: COLORS.olive,
    marginBottom: 8,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  scoreValue: {
    fontFamily: FONTS.mono,
    fontSize: 68,
    lineHeight: 72,
    color: COLORS.ink,
    fontWeight: '700',
    letterSpacing: -2,
  },
  scoreOutOf: {
    fontFamily: FONTS.mono,
    fontSize: 24,
    color: COLORS.muted,
    marginLeft: 4,
  },
  scoreTrack: {
    height: 6,
    backgroundColor: COLORS.creamDeep,
    borderRadius: 3,
    overflow: 'hidden',
  },
  scoreFill: {
    height: 6,
    backgroundColor: COLORS.olive,
    borderRadius: 3,
  },

  // Tiles
  tilesRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  tile: {
    flex: 1,
    borderRadius: 4,
    padding: 16,
    borderWidth: 1,
    minHeight: 96,
    justifyContent: 'space-between',
  },
  tileOlive: {
    backgroundColor: COLORS.oliveBg,
    borderColor: COLORS.oliveSoft,
  },
  tileTerra: {
    backgroundColor: COLORS.terracotta,
    borderColor: COLORS.terracotta,
  },
  tileValue: {
    fontFamily: FONTS.serif,
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.ink,
    letterSpacing: -1,
  },
  tileValueLight: { color: COLORS.cream },
  tileUnit: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    fontWeight: '400',
  },
  tileLabel: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    letterSpacing: 1.4,
    color: COLORS.olive,
  },
  tileLabelLight: { color: COLORS.cream, opacity: 0.9 },

  // Primary CTA
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.ink,
    borderRadius: 4,
    padding: 18,
    marginBottom: 10,
    gap: 14,
  },
  primaryBtnCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.mustard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnCircleTxt: {
    fontSize: 22,
    color: COLORS.ink,
  },
  primaryBtnTitle: {
    fontFamily: FONTS.sans,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1,
    color: COLORS.cream,
  },
  primaryBtnSub: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 1,
    color: COLORS.muted,
    marginTop: 2,
  },
  primaryBtnArrow: {
    fontSize: 20,
    color: COLORS.cream,
  },

  // Secondary
  secondaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.ink,
    borderRadius: 4,
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: COLORS.cream,
  },
  secondaryBtnTxt: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    color: COLORS.ink,
  },
  secondaryBtnSub: {
    fontFamily: FONTS.serifItalic,
    fontStyle: 'italic',
    fontSize: 12,
    color: COLORS.inkSoft,
    marginTop: 2,
  },

  // Promotions
  promosBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.terracottaSoft,
    backgroundColor: COLORS.terracottaBg,
    borderRadius: 4,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  promosBtnIcon: { fontSize: 22 },
  promosBtnTxt: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    color: COLORS.terracotta,
  },
  promosBtnSub: {
    fontFamily: FONTS.serifItalic,
    fontStyle: 'italic',
    fontSize: 12,
    color: COLORS.inkSoft,
    marginTop: 2,
  },
  promosArrow: { fontSize: 16, color: COLORS.terracotta },

  // Section
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
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
  sectionTitle: {
    fontFamily: FONTS.serif,
    fontSize: 22,
    color: COLORS.ink,
    marginBottom: 12,
  },
  sectionTitleItalic: {
    fontFamily: FONTS.serifItalic,
    fontStyle: 'italic',
    color: COLORS.terracotta,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  urgentChip: {
    flex: 1,
    minWidth: 90,
    borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  urgentChipOrange: {
    borderColor: '#E07B39',
    backgroundColor: '#FDF3EB',
  },
  urgentChipRed: {
    borderColor: '#C0392B',
    backgroundColor: '#FDECEA',
  },
  urgentChipName: {
    fontFamily: FONTS.serif,
    fontSize: 14,
    color: COLORS.ink,
    textTransform: 'capitalize',
  },
  urgentChipDays: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: '#E07B39',
    marginTop: 2,
    letterSpacing: 0.8,
  },
  urgentChipDaysRed: {
    color: '#C0392B',
  },

  // Recipe du soir
  recipeCard: {
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.rule,
    borderRadius: 4,
    padding: 20,
    marginBottom: 8,
  },
  recipeCardKicker: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    letterSpacing: 1.5,
    color: COLORS.olive,
    marginBottom: 8,
  },
  recipeCardName: {
    fontFamily: FONTS.serifItalic,
    fontStyle: 'italic',
    fontWeight: '700',
    fontSize: 22,
    color: COLORS.ink,
    marginBottom: 10,
    lineHeight: 28,
  },
  recipeCardTime: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.inkSoft,
    letterSpacing: 0.8,
  },
  recipeCardEmpty: {
    borderWidth: 1,
    borderColor: COLORS.rule,
    borderRadius: 4,
    borderStyle: 'dashed',
    padding: 20,
    marginBottom: 8,
    alignItems: 'center',
  },
  recipeCardEmptyTxt: {
    fontFamily: FONTS.serifItalic,
    fontStyle: 'italic',
    fontSize: 15,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Link row
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.rule,
  },
  linkTxt: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    letterSpacing: 1.5,
    color: COLORS.ink,
  },
  linkArrow: { fontSize: 16, color: COLORS.ink },

  // Premium banner
  premiumBanner: {
    backgroundColor: COLORS.terracottaBg,
    borderTopWidth: 1, borderTopColor: COLORS.terracottaSoft,
    paddingVertical: 10, paddingHorizontal: 20,
    alignItems: 'center',
  },
  premiumBannerTxt: {
    fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 0.8,
    color: COLORS.terracotta, textAlign: 'center',
  },

  // ─── Camera (shared) ──────────────────────────────────────────────
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  cameraTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    zIndex: 10,
  },
  cameraCloseBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraCloseTxt: { color: COLORS.white, fontSize: 18, fontWeight: '600' },
  cameraHint: { color: COLORS.white, fontSize: 15, fontWeight: '600' },
  viewfinderWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  viewfinder: { width: width * 0.78, height: width * 0.78 * 1.1, position: 'relative' },
  corner: { position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE },
  cornerTL: {
    top: 0, left: 0,
    borderTopWidth: CORNER_BORDER,
    borderLeftWidth: CORNER_BORDER,
    borderColor: COLORS.white,
    borderTopLeftRadius: 6,
  },
  cornerTR: {
    top: 0, right: 0,
    borderTopWidth: CORNER_BORDER,
    borderRightWidth: CORNER_BORDER,
    borderColor: COLORS.white,
    borderTopRightRadius: 6,
  },
  cornerBL: {
    bottom: 0, left: 0,
    borderBottomWidth: CORNER_BORDER,
    borderLeftWidth: CORNER_BORDER,
    borderColor: COLORS.white,
    borderBottomLeftRadius: 6,
  },
  cornerBR: {
    bottom: 0, right: 0,
    borderBottomWidth: CORNER_BORDER,
    borderRightWidth: CORNER_BORDER,
    borderColor: COLORS.white,
    borderBottomRightRadius: 6,
  },
  shutterBar: { alignItems: 'center', paddingBottom: 36, zIndex: 10 },
  galleryFab: {
    position: 'absolute',
    bottom: 52, right: 16,
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 20,
  },
  galleryFabIcon: { fontSize: 22 },
  shutterBtn: {
    width: 74, height: 74, borderRadius: 37,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: COLORS.white,
  },
  shutterInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.white },

  // Capture review
  captureOverlay: {
    flex: 1, justifyContent: 'flex-end', padding: 24,
    backgroundColor: COLORS.overlay,
  },
  captureTitle: {
    fontFamily: FONTS.serif,
    fontSize: 32, color: COLORS.cream, textAlign: 'center', marginBottom: 6,
  },
  captureSubtitle: {
    fontFamily: FONTS.serifItalic, fontStyle: 'italic',
    fontSize: 15, color: 'rgba(245,240,232,0.8)', textAlign: 'center', marginBottom: 28,
  },
  captureActions: { flexDirection: 'row', gap: 12 },
  captureSecondaryBtn: {
    flex: 1, paddingVertical: 16, borderRadius: 4,
    backgroundColor: 'rgba(245,240,232,0.15)',
    alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(245,240,232,0.4)',
  },
  captureSecondaryTxt: { color: COLORS.cream, fontWeight: '700', fontSize: 13, letterSpacing: 1 },
  capturePrimaryBtn: {
    flex: 1, paddingVertical: 16, borderRadius: 4,
    backgroundColor: COLORS.terracotta, alignItems: 'center',
  },
  capturePrimaryTxt: { color: COLORS.cream, fontWeight: '700', fontSize: 13, letterSpacing: 1 },

  // Permission
  permissionScreen: {
    flex: 1, backgroundColor: COLORS.cream,
    alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  permissionIcon: { fontSize: 56, color: COLORS.terracotta, marginBottom: 16 },
  permissionTitle: {
    fontFamily: FONTS.serif,
    fontSize: 24, color: COLORS.ink, marginBottom: 12, textAlign: 'center',
  },
  permissionText: {
    fontFamily: FONTS.serif,
    fontSize: 15, color: COLORS.inkSoft, textAlign: 'center', lineHeight: 22,
  },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: COLORS.overlay },
  modalSheet: {
    backgroundColor: COLORS.cream,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: COLORS.rule,
    alignSelf: 'center', marginBottom: 20,
  },
  modalKicker: {
    fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1.5,
    color: COLORS.terracotta, marginBottom: 4,
  },
  modalTitle: {
    fontFamily: FONTS.serif, fontSize: 28,
    color: COLORS.ink, marginBottom: 6,
  },
  modalSubtitle: {
    fontFamily: FONTS.serifItalic, fontStyle: 'italic',
    fontSize: 14, color: COLORS.inkSoft, marginBottom: 16,
  },
  textInput: {
    borderWidth: 1, borderColor: COLORS.rule, borderRadius: 4,
    padding: 14, fontSize: 15, color: COLORS.ink,
    backgroundColor: COLORS.paper,
    minHeight: 110, marginBottom: 20,
    fontFamily: FONTS.serif,
  },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalCancelBtn: {
    flex: 1, paddingVertical: 15, borderRadius: 4,
    alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.rule,
  },
  modalCancelTxt: {
    color: COLORS.inkSoft, fontWeight: '600', fontSize: 13, letterSpacing: 1,
    fontFamily: FONTS.sans,
  },
  modalSubmitBtn: {
    flex: 2, paddingVertical: 15, borderRadius: 4,
    alignItems: 'center', backgroundColor: COLORS.terracotta,
  },
  modalSubmitDisabled: { opacity: 0.45 },
  modalSubmitTxt: {
    color: COLORS.cream, fontWeight: '700', fontSize: 13, letterSpacing: 1,
    fontFamily: FONTS.sans,
  },
});
