import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  ListRenderItemInfo,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './navigator';
import { COLORS, FONTS } from '../constants/theme';

const { width } = Dimensions.get('window');
const ONBOARDING_KEY = 'hasSeenOnboarding';

type Slide = {
  id: string;
  kicker: string;
  title: string;
  titleItalic: string;
  description: string;
};

const slides: Slide[] = [
  {
    id: '1',
    kicker: '№ 01 · PHOTO',
    title: 'Photographiez',
    titleItalic: 'votre frigo.',
    description:
      "Prenez une photo de votre frigo ou saisissez vos ingrédients à la main. FrigoAI détecte tout automatiquement.",
  },
  {
    id: '2',
    kicker: '№ 02 · RECETTES',
    title: 'Des recettes',
    titleItalic: 'personnalisées.',
    description:
      "En quelques secondes, obtenez des recettes adaptées à ce que vous avez, à vos goûts et à vos préférences.",
  },
  {
    id: '3',
    kicker: '№ 03 · ANTI-GASPI',
    title: 'Ne gaspillez',
    titleItalic: 'plus rien.',
    description:
      "Utilisez chaque ingrédient avant qu'il ne se périme. Cuisinez mieux, gaspillez moins, économisez plus.",
  },
];

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;

export default function OnboardingScreen() {
  const navigation = useNavigation<NavProp>();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<Slide>>(null);

  const handleScroll = (event: { nativeEvent: { contentOffset: { x: number } } }) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveIndex(index);
  };

  const handleStart = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    navigation.replace('Main');
  };

  const renderItem = ({ item, index }: ListRenderItemInfo<Slide>) => (
    <View style={styles.slide}>
      <Text style={styles.kicker}>{item.kicker}</Text>
      <Text style={styles.title}>
        {item.title}{'\n'}
        <Text style={styles.italic}>{item.titleItalic}</Text>
      </Text>
      <View style={styles.rule} />
      <Text style={styles.description}>{item.description}</Text>
      {index === slides.length - 1 && (
        <TouchableOpacity style={styles.button} onPress={handleStart}>
          <Text style={styles.buttonText}>COMMENCER →</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      />
      <View style={styles.pagination}>
        {slides.map((_, i) => (
          <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  slide: {
    width,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 80,
  },
  kicker: {
    fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 1.5,
    color: COLORS.terracotta, marginBottom: 16,
  },
  title: {
    fontFamily: FONTS.serif, fontSize: 52, lineHeight: 56,
    color: COLORS.ink, fontWeight: '700', letterSpacing: -2,
  },
  italic: { fontFamily: FONTS.serifItalic, fontStyle: 'italic', color: COLORS.terracotta },
  rule: { height: 1, backgroundColor: COLORS.ink, marginTop: 20, marginBottom: 20 },
  description: {
    fontFamily: FONTS.serif, fontSize: 17,
    color: COLORS.inkSoft, lineHeight: 26,
  },
  button: {
    marginTop: 32, alignSelf: 'flex-start',
    paddingVertical: 15, paddingHorizontal: 28,
    backgroundColor: COLORS.ink, borderRadius: 4,
  },
  buttonText: {
    color: COLORS.cream, fontFamily: FONTS.mono,
    fontSize: 12, letterSpacing: 1.5, fontWeight: '700',
  },
  pagination: {
    position: 'absolute', bottom: 32, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', gap: 6,
  },
  dot: {
    width: 24, height: 2, backgroundColor: COLORS.rule,
  },
  dotActive: { backgroundColor: COLORS.terracotta },
});
