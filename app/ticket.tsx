import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { CameraView } from 'expo-camera';
import { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCamera } from '../hooks/useCamera';
import { useFrigo } from '../hooks/useFrigo';
import { scanTicket } from '../services/api';
import { RootStackParamList } from './navigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Ticket'>;

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
  red: '#C62828',
};

export default function TicketScreen({ navigation }: Props) {
  const { cameraRef, permission, cameraState, capturedPhoto, openCamera, closeCamera, takePicture, retake } =
    useCamera();
  const { addIngredients } = useFrigo();

  const [scanning, setScanning] = useState(false);
  const [addedProducts, setAddedProducts] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Start camera on mount if no photo yet
  const handleStart = () => {
    openCamera();
  };

  const handleScan = async (uri: string) => {
    closeCamera();
    setScanning(true);
    setError(null);
    try {
      const products = await scanTicket(uri);
      await addIngredients(products);
      setAddedProducts(products);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue');
    } finally {
      setScanning(false);
    }
  };

  // ─── Camera active ──────────────────────────────────────────────────────────
  if (cameraState === 'active') {
    return (
      <View style={styles.cameraContainer}>
        <StatusBar style="light" />
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />

        <SafeAreaView style={styles.cameraTopBar}>
          <TouchableOpacity onPress={closeCamera} style={styles.cameraCloseBtn}>
            <Text style={styles.cameraCloseTxt}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.cameraHint}>Cadrez votre ticket de caisse</Text>
          <View style={{ width: 44 }} />
        </SafeAreaView>

        <SafeAreaView style={styles.shutterBar}>
          <TouchableOpacity onPress={takePicture} style={styles.shutterBtn}>
            <View style={styles.shutterInner} />
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  // ─── Photo captured ─────────────────────────────────────────────────────────
  if (cameraState === 'captured' && capturedPhoto) {
    return (
      <View style={styles.cameraContainer}>
        <StatusBar style="light" />
        <Image source={{ uri: capturedPhoto.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />

        <SafeAreaView style={styles.captureOverlay}>
          <Text style={styles.captureTitle}>Photo prise !</Text>
          <Text style={styles.captureSubtitle}>Analyser ce ticket de caisse ?</Text>

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

  // ─── Scanning ────────────────────────────────────────────────────────────────
  if (scanning) {
    return (
      <SafeAreaView style={styles.centeredScreen}>
        <StatusBar style="light" backgroundColor={COLORS.green} />
        <ActivityIndicator size="large" color={COLORS.green} />
        <Text style={styles.loadingText}>Analyse du ticket en cours...</Text>
      </SafeAreaView>
    );
  }

  // ─── Results ─────────────────────────────────────────────────────────────────
  if (addedProducts !== null) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" backgroundColor={COLORS.green} />

        <View style={styles.header}>
          <Text style={styles.headerTitle}>Ticket scanné !</Text>
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.successBadge}>
            <Text style={styles.successEmoji}>🧾</Text>
            <Text style={styles.successTitle}>{addedProducts.length} produit{addedProducts.length > 1 ? 's' : ''} ajouté{addedProducts.length > 1 ? 's' : ''} au frigo</Text>
          </View>

          {addedProducts.map((product) => (
            <View key={product} style={styles.productRow}>
              <Text style={styles.productCheck}>✓</Text>
              <Text style={styles.productName}>{product}</Text>
            </View>
          ))}

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('Frigo')}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnTxt}>Voir mon frigo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('Home')}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryBtnTxt}>Retour à l'accueil</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Error ───────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <SafeAreaView style={styles.centeredScreen}>
        <StatusBar style="light" backgroundColor={COLORS.green} />
        <Text style={styles.errorEmoji}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleStart}>
          <Text style={styles.primaryBtnTxt}>Réessayer</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.secondaryBtnTxt}>Retour à l'accueil</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ─── Intro / permission ──────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" backgroundColor={COLORS.green} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnTxt}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scanner un ticket</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.body}>
        <View style={styles.introCard}>
          <Text style={styles.introEmoji}>🧾</Text>
          <Text style={styles.introTitle}>Scanner votre ticket de caisse</Text>
          <Text style={styles.introSubtitle}>
            Prenez votre ticket de caisse en photo et FrigoAI détectera automatiquement les produits pour les ajouter à votre frigo.
          </Text>
        </View>

        {permission && !permission.granted && !permission.canAskAgain ? (
          <Text style={styles.permissionText}>
            Autorisez l'accès à la caméra dans les réglages pour utiliser cette fonctionnalité.
          </Text>
        ) : (
          <TouchableOpacity style={styles.primaryBtn} onPress={handleStart} activeOpacity={0.85}>
            <Text style={styles.primaryBtnEmoji}>📷</Text>
            <Text style={styles.primaryBtnTxt}>Ouvrir la caméra</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
          <Text style={styles.secondaryBtnTxt}>Annuler</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.green,
  },
  centeredScreen: {
    flex: 1,
    backgroundColor: COLORS.offWhite,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  header: {
    backgroundColor: COLORS.green,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnTxt: {
    color: COLORS.white,
    fontSize: 30,
    lineHeight: 34,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
  },
  body: {
    flex: 1,
    backgroundColor: COLORS.offWhite,
    padding: 20,
  },
  introCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  introEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textDark,
    textAlign: 'center',
    marginBottom: 10,
  },
  introSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 21,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.green,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    gap: 10,
    shadowColor: COLORS.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryBtnEmoji: {
    fontSize: 20,
  },
  primaryBtnTxt: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  secondaryBtn: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
  },
  secondaryBtnTxt: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  permissionText: {
    fontSize: 14,
    color: COLORS.red,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 20,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 15,
    color: COLORS.red,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  successBadge: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  successEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.green,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  productCheck: {
    fontSize: 16,
    color: COLORS.greenLight,
    fontWeight: '700',
  },
  productName: {
    fontSize: 15,
    color: COLORS.textDark,
    fontWeight: '500',
    textTransform: 'capitalize',
  },

  // Camera
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
  shutterBar: {
    alignItems: 'center',
    paddingBottom: 36,
    zIndex: 10,
    marginTop: 'auto',
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
});
