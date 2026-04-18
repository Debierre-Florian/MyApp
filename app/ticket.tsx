import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { CameraView } from 'expo-camera';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCamera } from '../hooks/useCamera';
import { useFrigo } from '../hooks/useFrigo';
import { scanTicket } from '../services/api';
import { RootStackParamList } from './navigator';
import { COLORS, FONTS } from '../constants/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Ticket'>;

export default function TicketScreen({ navigation }: Props) {
  const { cameraRef, permission, cameraState, capturedPhoto, openCamera, closeCamera, takePicture, retake } =
    useCamera();
  const { addIngredient, addIngredients } = useFrigo();

  const [scanning, setScanning] = useState(false);
  const [addedProducts, setAddedProducts] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');

  const handleScan = async (uri: string) => {
    closeCamera();
    setScanning(true);
    setError(null);
    try {
      const products = await scanTicket(uri);
      await addIngredients(products);
      setAddedProducts(products);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue');
    } finally {
      setScanning(false);
    }
  };

  const handlePickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      await handleScan(result.assets[0].uri);
    }
  };

  const handleAddManual = async () => {
    const trimmed = manualInput.trim();
    if (!trimmed) return;
    await addIngredient(trimmed);
    setAddedProducts((prev) => (prev ? [...prev, trimmed] : [trimmed]));
    setManualInput('');
  };

  // Camera
  if (cameraState === 'active') {
    return (
      <View style={styles.cameraContainer}>
        <StatusBar style="light" />
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
        <SafeAreaView style={styles.cameraTopBar}>
          <TouchableOpacity onPress={closeCamera} style={styles.cameraCloseBtn}>
            <Text style={styles.cameraCloseTxt}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.cameraHint}>Cadrez votre ticket</Text>
          <View style={{ width: 44 }} />
        </SafeAreaView>
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
          <Text style={styles.captureSubtitle}>Analyser ce ticket ?</Text>
          <View style={styles.captureActions}>
            <TouchableOpacity onPress={retake} style={styles.captureSecondaryBtn}>
              <Text style={styles.captureSecondaryTxt}>Reprendre</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleScan(capturedPhoto.uri)}
              style={styles.capturePrimaryBtn}
            >
              <Text style={styles.capturePrimaryTxt}>Scanner</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (scanning) {
    return (
      <SafeAreaView style={styles.centered}>
        <StatusBar style="dark" backgroundColor={COLORS.cream} />
        <Text style={styles.loadingKicker}>EN COURS</Text>
        <Text style={styles.loadingTitle}>
          <Text style={styles.italic}>Analyse</Text>{'\n'}du ticket…
        </Text>
        <ActivityIndicator size="large" color={COLORS.terracotta} style={{ marginTop: 20 }} />
      </SafeAreaView>
    );
  }

  if (addedProducts !== null) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" backgroundColor={COLORS.cream} />
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView contentContainerStyle={styles.scrollBody} keyboardShouldPersistTaps="handled">
            <Text style={styles.kicker}>TICKET · {addedProducts.length} PRODUITS</Text>
            <Text style={styles.title}>
              Ajoutés au <Text style={styles.italic}>frigo</Text>.
            </Text>
            <View style={styles.rule} />

            {addedProducts.map((product, i) => (
              <View key={`${product}-${i}`} style={styles.productRow}>
                <Text style={styles.productCheck}>—</Text>
                <Text style={styles.productName}>{product}</Text>
              </View>
            ))}

            <Text style={styles.sectionLabel}>AJOUTER MANUELLEMENT</Text>
            <View style={styles.manualRow}>
              <TextInput
                style={styles.manualInput}
                placeholder="fromage, pain..."
                placeholderTextColor={COLORS.muted}
                value={manualInput}
                onChangeText={setManualInput}
                returnKeyType="done"
                onSubmitEditing={handleAddManual}
              />
              <TouchableOpacity
                style={[styles.manualAddBtn, !manualInput.trim() && { opacity: 0.4 }]}
                onPress={handleAddManual}
                disabled={!manualInput.trim()}
              >
                <Text style={styles.manualAddBtnTxt}>+</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => navigation.navigate('Main', { screen: 'Frigo' })}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnTxt}>VOIR MON FRIGO →</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => navigation.navigate('Main', { screen: 'Home' })}
            >
              <Text style={styles.secondaryBtnTxt}>← RETOUR À L'ACCUEIL</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centered}>
        <StatusBar style="dark" backgroundColor={COLORS.cream} />
        <Text style={styles.loadingKicker}>ERREUR</Text>
        <Text style={styles.errorTxt}>{error}</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={openCamera}>
          <Text style={styles.primaryBtnTxt}>RÉESSAYER</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('Main', { screen: 'Home' })}>
          <Text style={styles.secondaryBtnTxt}>← RETOUR À L'ACCUEIL</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Intro
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor={COLORS.cream} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnTxt}>←</Text>
        </TouchableOpacity>
        <Text style={styles.kicker}>SCANNER UN TICKET</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.introBody}>
        <Text style={styles.title}>
          Ticket de <Text style={styles.italic}>caisse</Text>.
        </Text>
        <View style={styles.rule} />
        <Text style={styles.introText}>
          Prenez votre ticket en photo — FrigoAI détectera les produits et les ajoutera au frigo.
        </Text>

        {permission && !permission.granted && !permission.canAskAgain ? (
          <Text style={styles.permissionText}>
            Autorisez l'accès à la caméra dans les réglages.
          </Text>
        ) : (
          <TouchableOpacity style={styles.primaryBtn} onPress={openCamera} activeOpacity={0.85}>
            <Text style={styles.primaryBtnTxt}>◉ OUVRIR LA CAMÉRA</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.secondaryBtn} onPress={handlePickFromGallery} activeOpacity={0.85}>
          <Text style={styles.secondaryBtnTxt}>🖼 CHOISIR UNE PHOTO</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.cream },
  centered: {
    flex: 1, backgroundColor: COLORS.cream,
    alignItems: 'center', justifyContent: 'center', padding: 32,
  },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backBtnTxt: { color: COLORS.ink, fontSize: 24, fontFamily: FONTS.serif },
  kicker: { fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1.5, color: COLORS.inkSoft },

  introBody: { flex: 1, padding: 24 },
  scrollBody: { padding: 24, paddingBottom: 48 },

  title: {
    fontFamily: FONTS.serif, fontSize: 42, lineHeight: 46,
    color: COLORS.ink, fontWeight: '700', letterSpacing: -1,
  },
  italic: { fontFamily: FONTS.serifItalic, fontStyle: 'italic', color: COLORS.terracotta },
  rule: { height: 1, backgroundColor: COLORS.ink, marginTop: 14, marginBottom: 16 },

  introText: {
    fontFamily: FONTS.serif, fontSize: 15,
    color: COLORS.inkSoft, lineHeight: 22, marginBottom: 24,
  },

  loadingKicker: {
    fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 1.5,
    color: COLORS.terracotta, marginBottom: 12,
  },
  loadingTitle: {
    fontFamily: FONTS.serif, fontSize: 32, lineHeight: 36,
    color: COLORS.ink, textAlign: 'center', fontWeight: '700', letterSpacing: -1,
  },
  errorTxt: {
    fontFamily: FONTS.serif, fontSize: 15, color: COLORS.ink,
    textAlign: 'center', marginBottom: 24, lineHeight: 22,
  },

  sectionLabel: {
    fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1.5,
    color: COLORS.olive, marginTop: 16, marginBottom: 8,
  },
  productRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, paddingHorizontal: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.rule,
  },
  productCheck: {
    fontFamily: FONTS.mono, color: COLORS.olive, width: 14,
  },
  productName: {
    fontFamily: FONTS.serif, fontSize: 15, color: COLORS.ink,
    textTransform: 'capitalize', flex: 1,
  },

  manualRow: {
    flexDirection: 'row', gap: 8, marginBottom: 24,
  },
  manualInput: {
    flex: 1, borderWidth: 1, borderColor: COLORS.rule, borderRadius: 4,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: COLORS.ink,
    backgroundColor: COLORS.paper,
    fontFamily: FONTS.serif,
  },
  manualAddBtn: {
    width: 44, height: 44, borderRadius: 4,
    backgroundColor: COLORS.ink,
    alignItems: 'center', justifyContent: 'center',
  },
  manualAddBtnTxt: { color: COLORS.cream, fontSize: 22 },

  primaryBtn: {
    backgroundColor: COLORS.ink, borderRadius: 4,
    paddingVertical: 15, alignItems: 'center', marginBottom: 10,
  },
  primaryBtnTxt: {
    color: COLORS.cream, fontFamily: FONTS.mono,
    fontSize: 12, letterSpacing: 1.5, fontWeight: '700',
  },
  secondaryBtn: {
    paddingVertical: 14, borderRadius: 4,
    borderWidth: 1, borderColor: COLORS.ink, alignItems: 'center',
  },
  secondaryBtnTxt: {
    color: COLORS.ink, fontFamily: FONTS.mono,
    fontSize: 12, letterSpacing: 1.5,
  },
  permissionText: {
    fontFamily: FONTS.serif, fontSize: 14, color: COLORS.terracotta,
    textAlign: 'center', lineHeight: 21, marginBottom: 20,
  },

  // Camera
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  cameraTopBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 8, zIndex: 10,
  },
  cameraCloseBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  cameraCloseTxt: { color: COLORS.white, fontSize: 18, fontWeight: '600' },
  cameraHint: { color: COLORS.white, fontSize: 15, fontWeight: '600' },
  shutterBar: {
    alignItems: 'center', paddingBottom: 36, zIndex: 10, marginTop: 'auto',
  },
  shutterBtn: {
    width: 74, height: 74, borderRadius: 37,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: COLORS.white,
  },
  shutterInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.white },
  galleryFab: {
    position: 'absolute', bottom: 52, right: 16,
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center', justifyContent: 'center', zIndex: 20,
  },
  galleryFabIcon: { fontSize: 22 },
  captureOverlay: {
    flex: 1, justifyContent: 'flex-end', padding: 24,
    backgroundColor: COLORS.overlay,
  },
  captureTitle: {
    fontFamily: FONTS.serif, fontSize: 32,
    color: COLORS.cream, textAlign: 'center', marginBottom: 6,
  },
  captureSubtitle: {
    fontFamily: FONTS.serifItalic, fontStyle: 'italic',
    fontSize: 15, color: 'rgba(245,240,232,0.8)',
    textAlign: 'center', marginBottom: 28,
  },
  captureActions: { flexDirection: 'row', gap: 12 },
  captureSecondaryBtn: {
    flex: 1, paddingVertical: 16, borderRadius: 4,
    backgroundColor: 'rgba(245,240,232,0.15)',
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(245,240,232,0.4)',
  },
  captureSecondaryTxt: { color: COLORS.cream, fontWeight: '700', fontSize: 13, letterSpacing: 1 },
  capturePrimaryBtn: {
    flex: 1, paddingVertical: 16, borderRadius: 4,
    backgroundColor: COLORS.terracotta, alignItems: 'center',
  },
  capturePrimaryTxt: { color: COLORS.cream, fontWeight: '700', fontSize: 13, letterSpacing: 1 },
});
