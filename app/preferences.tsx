import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from './navigator';
import {
  usePreferences,
  DIET_OPTIONS,
  ALLERGY_OPTIONS,
  type DietType,
  type AllergyType,
} from '../hooks/usePreferences';

type Props = NativeStackScreenProps<RootStackParamList, 'Preferences'>;

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
  danger: '#C62828',
  dangerBg: '#FFEBEE',
  dangerBorder: '#FFCDD2',
};

// ─── Chip ─────────────────────────────────────────────────────────────────────
function Chip({
  label,
  selected,
  onPress,
  color = COLORS.greenMid,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  color?: string;
}) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && { backgroundColor: color, borderColor: color }]}
      activeOpacity={0.75}
      onPress={onPress}
    >
      <Text style={[styles.chipTxt, selected && styles.chipTxtSelected]}>
        {selected ? '✓ ' : ''}{label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Tag (ingrédient ajouté) ──────────────────────────────────────────────────
function Tag({
  label,
  onRemove,
  color,
  bg,
}: {
  label: string;
  onRemove: () => void;
  color: string;
  bg: string;
}) {
  return (
    <View style={[styles.tag, { backgroundColor: bg, borderColor: color + '55' }]}>
      <Text style={[styles.tagTxt, { color }]}>{label}</Text>
      <TouchableOpacity onPress={onRemove} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
        <Text style={[styles.tagRemove, { color }]}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Ingredient input section ─────────────────────────────────────────────────
function IngredientInput({
  items,
  onAdd,
  onRemove,
  placeholder,
  tagColor,
  tagBg,
}: {
  items: string[];
  onAdd: (v: string) => void;
  onRemove: (v: string) => void;
  placeholder: string;
  tagColor: string;
  tagBg: string;
}) {
  const [value, setValue] = useState('');

  const submit = () => {
    if (!value.trim()) return;
    onAdd(value.trim());
    setValue('');
  };

  return (
    <View>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.textInput}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          value={value}
          onChangeText={setValue}
          onSubmitEditing={submit}
          returnKeyType="done"
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={[styles.addBtn, !value.trim() && styles.addBtnDisabled]}
          onPress={submit}
          disabled={!value.trim()}
        >
          <Text style={styles.addBtnTxt}>+</Text>
        </TouchableOpacity>
      </View>
      {items.length > 0 && (
        <View style={styles.tagList}>
          {items.map((item) => (
            <Tag
              key={item}
              label={item}
              onRemove={() => onRemove(item)}
              color={tagColor}
              bg={tagBg}
            />
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function PreferencesScreen({ navigation }: Props) {
  const {
    preferences,
    loading,
    updatePreferences,
    toggleAllergy,
    addFavorite,
    removeFavorite,
    addDisliked,
    removeDisliked,
  } = usePreferences();

  if (loading) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" backgroundColor={COLORS.green} />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnTxt}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Préférences</Text>
          <Text style={styles.headerSubtitle}>Personnalise tes recettes</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Prénom ────────────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤  Mon prénom</Text>
          <TextInput
            style={styles.nameInput}
            placeholder="Comment tu t'appelles ?"
            placeholderTextColor={COLORS.textMuted}
            value={preferences.firstName}
            onChangeText={(v) => updatePreferences({ firstName: v })}
            autoCapitalize="words"
            returnKeyType="done"
          />
        </View>

        {/* ── Régime alimentaire ────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🥗  Régime alimentaire</Text>
          <Text style={styles.sectionHint}>Un seul choix possible</Text>
          <View style={styles.chipList}>
            {DIET_OPTIONS.map((diet) => (
              <Chip
                key={diet}
                label={diet}
                selected={preferences.diet === diet}
                onPress={() => updatePreferences({ diet: diet as DietType })}
              />
            ))}
          </View>
        </View>

        {/* ── Allergies ─────────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚠️  Allergies</Text>
          <Text style={styles.sectionHint}>Plusieurs choix possibles</Text>
          <View style={styles.chipList}>
            {ALLERGY_OPTIONS.map((allergy) => (
              <Chip
                key={allergy}
                label={allergy}
                selected={preferences.allergies.includes(allergy as AllergyType)}
                onPress={() => toggleAllergy(allergy as AllergyType)}
                color={COLORS.danger}
              />
            ))}
          </View>
        </View>

        {/* ── Ingrédients favoris ───────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>❤️  Ingrédients favoris</Text>
          <Text style={styles.sectionHint}>Claude les privilégiera dans les recettes</Text>
          <IngredientInput
            items={preferences.favoriteIngredients}
            onAdd={addFavorite}
            onRemove={removeFavorite}
            placeholder="Ex: ail, basilic, parmesan..."
            tagColor={COLORS.greenMid}
            tagBg={COLORS.greenPale}
          />
        </View>

        {/* ── Ingrédients détestés ──────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚫  Ingrédients détestés</Text>
          <Text style={styles.sectionHint}>Claude les évitera dans les recettes</Text>
          <IngredientInput
            items={preferences.dislikedIngredients}
            onAdd={addDisliked}
            onRemove={removeDisliked}
            placeholder="Ex: coriandre, anchois, câpres..."
            tagColor={COLORS.danger}
            tagBg={COLORS.dangerBg}
          />
        </View>
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

  // Header
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

  // Scroll
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

  // Section
  section: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
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
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 12,
  },

  // Name input
  nameInput: {
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 15,
    color: COLORS.textDark,
    backgroundColor: COLORS.offWhite,
  },

  // Chips
  chipList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
    backgroundColor: COLORS.offWhite,
  },
  chipTxt: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  chipTxtSelected: {
    color: COLORS.white,
  },

  // Ingredient input
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  textInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 11 : 9,
    fontSize: 14,
    color: COLORS.textDark,
    backgroundColor: COLORS.offWhite,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDisabled: {
    opacity: 0.35,
  },
  addBtnTxt: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '300',
    lineHeight: 26,
  },

  // Tags
  tagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  tagTxt: {
    fontSize: 13,
    fontWeight: '600',
  },
  tagRemove: {
    fontSize: 11,
    fontWeight: '700',
  },
});
