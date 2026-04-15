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
import { initNotifications } from '../services/notifications';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCamera } from '../hooks/useCamera';
import { RootStackParamList, TabParamList } from './navigator';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

const { width, height } = Dimensions.get('window');

const COLORS = {
  green: '#1B5E20',
  greenMid: '#2E7D32',
  greenLight: '#43A047',
  greenPale: '#C8E6C9',
  white: '#FFFFFF',
  offWhite: '#F9FBF9',
  textDark: '#1A1A1A',
  textMuted: '#6B7F6B',
  overlay: 'rgba(0,0,0,0.55)',
  cardBorder: '#E8F0E8',
};

export default function HomeScreen({ navigation }: Props) {
  const { cameraRef, permission, cameraState, capturedPhoto, openCamera, closeCamera, takePicture, retake } =
    useCamera();
  const { checkExpiringIngredients } = useFrigo();

  useEffect(() => {
    initNotifications(checkExpiringIngredients());
  }, [checkExpiringIngredients]);

  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [ingredientText, setIngredientText] = useState('');

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

  console.log('[HomeScreen] render — cameraState:', cameraState, '| capturedPhoto:', capturedPhoto?.uri ?? null);

  // ─── Camera active ────────────────────────────────────────────────────────
  if (cameraState === 'active') {
    return (
      <View style={styles.cameraContainer}>
        <StatusBar style="light" />
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />

        {/* Top bar */}
        <SafeAreaView style={styles.cameraTopBar}>
          <TouchableOpacity onPress={closeCamera} style={styles.cameraCloseBtn}>
            <Text style={styles.cameraCloseTxt}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.cameraHint}>Cadrez votre frigo</Text>
          <View style={{ width: 44 }} />
        </SafeAreaView>

        {/* Viewfinder frame */}
        <View style={styles.viewfinderWrapper}>
          <View style={styles.viewfinder}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
        </View>

        {/* Shutter */}
        <SafeAreaView style={styles.shutterBar}>
          <TouchableOpacity onPress={takePicture} style={styles.shutterBtn}>
            <View style={styles.shutterInner} />
          </TouchableOpacity>
        </SafeAreaView>

        {/* Gallery FAB */}
        <TouchableOpacity onPress={handlePickFromGallery} style={styles.galleryFab}>
          <Text style={styles.galleryFabIcon}>🖼️</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── Photo captured ───────────────────────────────────────────────────────
  if (cameraState === 'captured' && capturedPhoto) {
    return (
      <View style={styles.cameraContainer}>
        <StatusBar style="light" />
        <Image source={{ uri: capturedPhoto.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />

        <SafeAreaView style={styles.captureOverlay}>
          <Text style={styles.captureTitle}>Photo prise !</Text>
          <Text style={styles.captureSubtitle}>Voulez-vous analyser ce frigo ?</Text>

          <View style={styles.captureActions}>
            <TouchableOpacity onPress={retake} style={styles.captureSecondaryBtn}>
              <Text style={styles.captureSecondaryTxt}>Reprendre</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                console.log('[HomeScreen] Analyser pressed — capturedPhoto:', capturedPhoto?.uri ?? null);
                const uri = capturedPhoto.uri;
                console.log('[HomeScreen] uri extracted:', uri);
                closeCamera();
                console.log('[HomeScreen] closeCamera() called, navigating to Analyse...');
                navigation.navigate('Analyse', { photoUri: uri });
                console.log('[HomeScreen] navigation.navigate() called');
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

  // ─── Permission denied ────────────────────────────────────────────────────
  if (permission && !permission.granted && !permission.canAskAgain) {
    return (
      <SafeAreaView style={styles.permissionScreen}>
        <StatusBar style="light" />
        <Text style={styles.permissionIcon}>📷</Text>
        <Text style={styles.permissionTitle}>Accès caméra refusé</Text>
        <Text style={styles.permissionText}>
          Autorisez l'accès à la caméra dans les réglages de votre appareil pour prendre votre frigo en photo.
        </Text>
      </SafeAreaView>
    );
  }

  // ─── Home screen ──────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" backgroundColor={COLORS.green} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => navigation.navigate('Preferences')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.settingsBtnTxt}>⚙️</Text>
        </TouchableOpacity>
        <View style={styles.logoWrapper}>
          <Text style={styles.logoEmoji}>🥦</Text>
        </View>
        <Text style={styles.appName}>FrigoAI</Text>
        <Text style={styles.appTagline}>Cuisine ce que tu as</Text>
      </View>

      {/* Main content */}
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Hero card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Qu'est-ce qu'il y a dans ton frigo ?</Text>
          <Text style={styles.heroSubtitle}>
            Prends une photo ou liste tes ingrédients, FrigoAI te propose des recettes adaptées.
          </Text>
        </View>

        {/* Primary CTA — camera */}
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={openCamera}
          activeOpacity={0.85}
        >
          <View style={styles.primaryBtnIcon}>
            <Text style={styles.primaryBtnEmoji}>📸</Text>
          </View>
          <View style={styles.primaryBtnText}>
            <Text style={styles.primaryBtnTitle}>Photographier mon frigo</Text>
            <Text style={styles.primaryBtnSub}>Analyse automatique des ingrédients</Text>
          </View>
          <Text style={styles.primaryBtnArrow}>›</Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>ou</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Secondary CTA — manual */}
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => setManualModalVisible(true)}
          activeOpacity={0.85}
        >
          <Text style={styles.secondaryBtnEmoji}>✏️</Text>
          <Text style={styles.secondaryBtnTxt}>Saisir les ingrédients manuellement</Text>
        </TouchableOpacity>

        {/* Frigo CTA */}
        <TouchableOpacity
          style={styles.frigoBtn}
          onPress={() => navigation.navigate('Frigo')}
          activeOpacity={0.85}
        >
          <Text style={styles.frigoBtnEmoji}>🧊</Text>
          <Text style={styles.frigoBtnTxt}>Voir le contenu de mon frigo</Text>
          <Text style={styles.frigoBtnArrow}>›</Text>
        </TouchableOpacity>

        {/* Profil CTA */}
        <TouchableOpacity
          style={styles.frigoBtn}
          onPress={() => navigation.navigate('Profil')}
          activeOpacity={0.85}
        >
          <Text style={styles.frigoBtnEmoji}>👤</Text>
          <Text style={styles.frigoBtnTxt}>Mon profil</Text>
          <Text style={styles.frigoBtnArrow}>›</Text>
        </TouchableOpacity>

        {/* Ticket CTA */}
        <TouchableOpacity
          style={styles.frigoBtn}
          onPress={() => navigation.navigate('Ticket')}
          activeOpacity={0.85}
        >
          <Text style={styles.frigoBtnEmoji}>🧾</Text>
          <Text style={styles.frigoBtnTxt}>Scanner un ticket de caisse</Text>
          <Text style={styles.frigoBtnArrow}>›</Text>
        </TouchableOpacity>

        {/* Info tiles */}
        <View style={styles.tilesRow}>
          {[
            { icon: '🍽️', label: 'Recettes\npersonnalisées' },
            { icon: '⚡', label: 'Analyse\ninstantanée' },
            { icon: '♻️', label: 'Zéro\ngaspillage' },
          ].map((tile) => (
            <View key={tile.label} style={styles.tile}>
              <Text style={styles.tileIcon}>{tile.icon}</Text>
              <Text style={styles.tileLabel}>{tile.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Manual input modal */}
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
            <Text style={styles.modalTitle}>Mes ingrédients</Text>
            <Text style={styles.modalSubtitle}>
              Liste tes ingrédients séparés par des virgules ou à la ligne.
            </Text>

            <TextInput
              style={styles.textInput}
              placeholder="Ex: carottes, poulet, courgettes, riz..."
              placeholderTextColor={COLORS.textMuted}
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
                <Text style={styles.modalSubmitTxt}>Trouver des recettes</Text>
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
  // ── Layout ─────────────────────────────────────────────────────────────────
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.green,
  },
  body: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    backgroundColor: COLORS.offWhite,
    flexGrow: 1,
  },

  // ── Header ─────────────────────────────────────────────────────────────────
  header: {
    backgroundColor: COLORS.green,
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 28,
    position: 'relative',
  },
  settingsBtn: {
    position: 'absolute',
    top: 20,
    right: 16,
    zIndex: 1,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsBtnTxt: {
    fontSize: 22,
  },
  logoWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
  logoEmoji: {
    fontSize: 36,
  },
  appName: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 1,
  },
  appTagline: {
    fontSize: 13,
    color: COLORS.greenPale,
    marginTop: 4,
    letterSpacing: 0.4,
  },

  // ── Hero ────────────────────────────────────────────────────────────────────
  heroCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 21,
  },

  // ── Primary button ─────────────────────────────────────────────────────────
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.green,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    shadowColor: COLORS.green,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryBtnIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.greenMid,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  primaryBtnEmoji: {
    fontSize: 26,
  },
  primaryBtnText: {
    flex: 1,
  },
  primaryBtnTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 3,
  },
  primaryBtnSub: {
    fontSize: 12,
    color: COLORS.greenPale,
  },
  primaryBtnArrow: {
    fontSize: 28,
    color: COLORS.greenLight,
    fontWeight: '300',
  },

  // ── Divider ─────────────────────────────────────────────────────────────────
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#D8E8D8',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
  },

  // ── Frigo button ─────────────────────────────────────────────────────────────
  frigoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  frigoBtnEmoji: {
    fontSize: 22,
  },
  frigoBtnTxt: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  frigoBtnArrow: {
    fontSize: 22,
    color: COLORS.textMuted,
    fontWeight: '300',
  },

  // ── Secondary button ────────────────────────────────────────────────────────
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 28,
    borderWidth: 1.5,
    borderColor: COLORS.greenLight,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  secondaryBtnEmoji: {
    fontSize: 22,
  },
  secondaryBtnTxt: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.greenMid,
  },

  // ── Info tiles ───────────────────────────────────────────────────────────────
  tilesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  tile: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tileIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  tileLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    fontWeight: '500',
  },

  // ── Camera ──────────────────────────────────────────────────────────────────
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
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
  cameraCloseTxt: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
  cameraHint: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
  },

  // Viewfinder
  viewfinderWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewfinder: {
    width: width * 0.78,
    height: width * 0.78 * 1.1,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_BORDER,
    borderLeftWidth: CORNER_BORDER,
    borderColor: COLORS.white,
    borderTopLeftRadius: 6,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_BORDER,
    borderRightWidth: CORNER_BORDER,
    borderColor: COLORS.white,
    borderTopRightRadius: 6,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_BORDER,
    borderLeftWidth: CORNER_BORDER,
    borderColor: COLORS.white,
    borderBottomLeftRadius: 6,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_BORDER,
    borderRightWidth: CORNER_BORDER,
    borderColor: COLORS.white,
    borderBottomRightRadius: 6,
  },

  // Shutter
  shutterBar: {
    alignItems: 'center',
    paddingBottom: 36,
    zIndex: 10,
  },
  galleryFab: {
    position: 'absolute',
    bottom: 52,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  galleryFabIcon: {
    fontSize: 22,
  },
  shutterBtn: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.white,
  },

  // ── Capture review ──────────────────────────────────────────────────────────
  captureOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 24,
    backgroundColor: COLORS.overlay,
  },
  captureTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  captureSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 28,
  },
  captureActions: {
    flexDirection: 'row',
    gap: 12,
  },
  captureSecondaryBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  captureSecondaryTxt: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 15,
  },
  capturePrimaryBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: COLORS.green,
    alignItems: 'center',
  },
  capturePrimaryTxt: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 15,
  },

  // ── Permission denied ────────────────────────────────────────────────────────
  permissionScreen: {
    flex: 1,
    backgroundColor: COLORS.green,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  permissionIcon: {
    fontSize: 56,
    marginBottom: 20,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 14,
    color: COLORS.greenPale,
    textAlign: 'center',
    lineHeight: 22,
  },

  // ── Manual modal ─────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: COLORS.overlay,
  },
  modalSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D0D5D0',
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 16,
    lineHeight: 19,
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: COLORS.greenLight,
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    color: COLORS.textDark,
    backgroundColor: COLORS.offWhite,
    minHeight: 110,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#F0F4F0',
  },
  modalCancelTxt: {
    color: COLORS.textMuted,
    fontWeight: '600',
    fontSize: 15,
  },
  modalSubmitBtn: {
    flex: 2,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: COLORS.green,
  },
  modalSubmitDisabled: {
    opacity: 0.45,
  },
  modalSubmitTxt: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 15,
  },
});
