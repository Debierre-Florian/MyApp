import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Platform,
  Switch,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from './navigator';
import {
  usePreferences,
  DIET_OPTIONS,
  ALLERGY_OPTIONS,
  type DietType,
  type AllergyType,
} from '../hooks/usePreferences';
import { useFrigo } from '../hooks/useFrigo';
import {
  getNotificationsEnabled,
  setNotificationsEnabled,
  initNotifications,
  cancelDailyNotification,
} from '../services/notifications';
import { COLORS, FONTS } from '../constants/theme';
import { useProfils, PROFILE_COLORS } from '../hooks/useProfils';
import { useRatings } from '../hooks/useRatings';
import { useHistorique } from '../hooks/useHistorique';

type Props = NativeStackScreenProps<RootStackParamList, 'Preferences'>;

function Chip({
  label, selected, onPress, tone = 'terra',
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  tone?: 'terra' | 'olive' | 'mustard';
}) {
  const activeBg =
    tone === 'olive' ? COLORS.olive : tone === 'mustard' ? COLORS.mustard : COLORS.terracotta;
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        selected && { backgroundColor: activeBg, borderColor: activeBg },
      ]}
      activeOpacity={0.75}
      onPress={onPress}
    >
      <Text style={[styles.chipTxt, selected && styles.chipTxtSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function Tag({ label, onRemove, tone }: { label: string; onRemove: () => void; tone: 'olive' | 'terra' }) {
  const color = tone === 'olive' ? COLORS.olive : COLORS.terracotta;
  const bg = tone === 'olive' ? COLORS.oliveBg : COLORS.terracottaBg;
  return (
    <View style={[styles.tag, { backgroundColor: bg, borderColor: color }]}>
      <Text style={[styles.tagTxt, { color }]}>{label}</Text>
      <TouchableOpacity onPress={onRemove} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
        <Text style={[styles.tagRemove, { color }]}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

function IngredientInput({
  items, onAdd, onRemove, placeholder, tone,
}: {
  items: string[];
  onAdd: (v: string) => void;
  onRemove: (v: string) => void;
  placeholder: string;
  tone: 'olive' | 'terra';
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
          placeholderTextColor={COLORS.muted}
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
            <Tag key={item} label={item} onRemove={() => onRemove(item)} tone={tone} />
          ))}
        </View>
      )}
    </View>
  );
}

export default function PreferencesScreen({ navigation }: Props) {
  const {
    preferences, loading, updatePreferences, toggleAllergy,
    addFavorite, removeFavorite, addDisliked, removeDisliked,
  } = usePreferences();
  const { activeProfil } = useProfils();
  const { checkExpiringIngredients } = useFrigo();
  const { likedIngredients, dislikedIngredients } = useRatings();
  const { clearRatings } = useHistorique();
  const hasLearnedPrefs = likedIngredients.length > 0 || dislikedIngredients.length > 0;
  const [notificationsEnabled, setNotifState] = useState(true);

  useEffect(() => { getNotificationsEnabled().then(setNotifState); }, []);

  const handleToggleNotif = async (value: boolean) => {
    setNotifState(value);
    await setNotificationsEnabled(value);
    if (value) {
      await initNotifications(checkExpiringIngredients());
    } else {
      await cancelDailyNotification();
    }
  };

  if (loading) return null;

  const profilInitial = (activeProfil.firstName.trim()[0] || '?').toUpperCase();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor={COLORS.cream} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnTxt}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={[styles.headerAvatar, { backgroundColor: PROFILE_COLORS[activeProfil.color] }]}>
            <Text style={styles.headerAvatarTxt}>{profilInitial}</Text>
          </View>
          <Text style={styles.kicker}>
            {activeProfil.firstName.trim() ? activeProfil.firstName.trim().toUpperCase() : 'PRÉFÉRENCES'}
          </Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>
          Tes <Text style={styles.titleItalic}>goûts</Text>.
        </Text>
        <View style={styles.rule} />

        {/* Prénom */}
        <Text style={styles.sectionLabel}>MON PRÉNOM</Text>
        <View style={styles.section}>
          <TextInput
            style={styles.nameInput}
            placeholder="Comment tu t'appelles ?"
            placeholderTextColor={COLORS.muted}
            value={preferences.firstName}
            onChangeText={(v) => updatePreferences({ firstName: v })}
            autoCapitalize="words"
            returnKeyType="done"
          />
        </View>

        {/* Régime */}
        <Text style={styles.sectionLabel}>RÉGIME ALIMENTAIRE</Text>
        <Text style={styles.sectionHint}>Un seul choix possible</Text>
        <View style={styles.section}>
          <View style={styles.chipList}>
            {DIET_OPTIONS.map((diet) => (
              <Chip
                key={diet}
                label={diet}
                selected={preferences.diet === diet}
                onPress={() => updatePreferences({ diet: diet as DietType })}
                tone="olive"
              />
            ))}
          </View>
        </View>

        {/* Allergies */}
        <Text style={styles.sectionLabel}>ALLERGIES</Text>
        <Text style={styles.sectionHint}>Plusieurs choix possibles</Text>
        <View style={styles.section}>
          <View style={styles.chipList}>
            {ALLERGY_OPTIONS.map((allergy) => (
              <Chip
                key={allergy}
                label={allergy}
                selected={preferences.allergies.includes(allergy as AllergyType)}
                onPress={() => toggleAllergy(allergy as AllergyType)}
                tone="terra"
              />
            ))}
          </View>
        </View>

        {/* Favoris */}
        <Text style={styles.sectionLabel}>INGRÉDIENTS FAVORIS</Text>
        <Text style={styles.sectionHint}>Claude les privilégiera</Text>
        <View style={styles.section}>
          <IngredientInput
            items={preferences.favoriteIngredients}
            onAdd={addFavorite}
            onRemove={removeFavorite}
            placeholder="ail, basilic, parmesan..."
            tone="olive"
          />
        </View>

        {/* Détestés */}
        <Text style={styles.sectionLabel}>INGRÉDIENTS DÉTESTÉS</Text>
        <Text style={styles.sectionHint}>Claude les évitera</Text>
        <View style={styles.section}>
          <IngredientInput
            items={preferences.dislikedIngredients}
            onAdd={addDisliked}
            onRemove={removeDisliked}
            placeholder="coriandre, anchois..."
            tone="terra"
          />
        </View>

        {/* Appris par les notes */}
        <Text style={styles.sectionLabel}>APPRIS PAR VOS NOTES</Text>
        <Text style={styles.sectionHint}>Déduit automatiquement de vos recettes notées</Text>
        <View style={styles.section}>
          {!hasLearnedPrefs ? (
            <Text style={styles.learnedEmpty}>
              Notez des recettes pour que FrigoAI apprenne vos goûts.
            </Text>
          ) : (
            <>
              {likedIngredients.length > 0 && (
                <View style={styles.learnedGroup}>
                  <Text style={styles.learnedGroupLabel}>AIMÉS</Text>
                  <View style={styles.tagList}>
                    {likedIngredients.map((ing) => (
                      <View key={ing} style={[styles.tag, styles.tagLiked]}>
                        <Text style={styles.tagStarLiked}>★</Text>
                        <Text style={[styles.tagTxt, { color: COLORS.olive }]}>{ing}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              {dislikedIngredients.length > 0 && (
                <View style={[styles.learnedGroup, likedIngredients.length > 0 && { marginTop: 14 }]}>
                  <Text style={styles.learnedGroupLabel}>ÉVITÉS</Text>
                  <View style={styles.tagList}>
                    {dislikedIngredients.map((ing) => (
                      <View key={ing} style={[styles.tag, styles.tagDisliked]}>
                        <Text style={styles.tagStarDisliked}>★</Text>
                        <Text style={[styles.tagTxt, { color: COLORS.terracotta }]}>{ing}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              <TouchableOpacity
                style={styles.resetLearnedBtn}
                activeOpacity={0.8}
                onPress={clearRatings}
              >
                <Text style={styles.resetLearnedBtnTxt}>RÉINITIALISER</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Notifications */}
        <Text style={styles.sectionLabel}>NOTIFICATIONS</Text>
        <View style={styles.section}>
          <View style={styles.notifRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.notifLabel}>Rappels d'ingrédients</Text>
              <Text style={styles.notifHint}>
                Alerte quotidienne à 18h pour les ingrédients ajoutés depuis plus de 7 jours.
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotif}
              trackColor={{ false: COLORS.rule, true: COLORS.olive }}
              thumbColor={COLORS.cream}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.cream },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4,
  },
  headerCenter: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  headerAvatar: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  headerAvatarTxt: {
    fontFamily: FONTS.serif, fontSize: 11, fontWeight: '700', color: '#fff',
  },
  backBtn: {
    width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
  },
  backBtnTxt: {
    color: COLORS.ink, fontSize: 24, fontFamily: FONTS.serif,
  },
  kicker: {
    fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1.5, color: COLORS.inkSoft,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 48 },
  title: {
    fontFamily: FONTS.serif, fontSize: 42, lineHeight: 46,
    color: COLORS.ink, fontWeight: '700', letterSpacing: -1,
  },
  titleItalic: { fontFamily: FONTS.serifItalic, fontStyle: 'italic', color: COLORS.terracotta },
  rule: { height: 1, backgroundColor: COLORS.ink, marginTop: 14, marginBottom: 20 },

  sectionLabel: {
    fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1.5,
    color: COLORS.olive, marginBottom: 4, marginTop: 4,
  },
  sectionHint: {
    fontFamily: FONTS.serifItalic, fontStyle: 'italic',
    fontSize: 12, color: COLORS.muted, marginBottom: 8,
  },
  section: {
    backgroundColor: COLORS.paper, borderWidth: 1, borderColor: COLORS.rule,
    borderRadius: 4, padding: 14, marginBottom: 18,
  },

  nameInput: {
    borderWidth: 1, borderColor: COLORS.rule, borderRadius: 4,
    paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 15, color: COLORS.ink, backgroundColor: COLORS.cream,
    fontFamily: FONTS.serif,
  },

  chipList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 4, borderWidth: 1, borderColor: COLORS.rule,
    backgroundColor: COLORS.cream,
  },
  chipTxt: {
    fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 0.8,
    color: COLORS.inkSoft, textTransform: 'uppercase',
  },
  chipTxtSelected: { color: COLORS.cream, fontWeight: '700' },

  inputRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  textInput: {
    flex: 1, borderWidth: 1, borderColor: COLORS.rule, borderRadius: 4,
    paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 11 : 9,
    fontSize: 14, color: COLORS.ink, backgroundColor: COLORS.cream,
    fontFamily: FONTS.serif,
  },
  addBtn: {
    width: 44, height: 44, borderRadius: 4,
    backgroundColor: COLORS.ink,
    alignItems: 'center', justifyContent: 'center',
  },
  addBtnDisabled: { opacity: 0.35 },
  addBtnTxt: {
    color: COLORS.cream, fontSize: 22, fontFamily: FONTS.sans,
  },

  notifRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  notifLabel: {
    fontFamily: FONTS.serif, fontSize: 15, color: COLORS.ink, marginBottom: 3,
  },
  notifHint: {
    fontFamily: FONTS.serifItalic, fontStyle: 'italic',
    fontSize: 12, color: COLORS.inkSoft, lineHeight: 17,
  },

  tagList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 4, borderWidth: 1, gap: 6,
  },
  tagTxt: {
    fontFamily: FONTS.serif, fontSize: 13, fontWeight: '600',
  },
  tagRemove: {
    fontSize: 11, fontWeight: '700', fontFamily: FONTS.mono,
  },

  learnedEmpty: {
    fontFamily: FONTS.serifItalic, fontStyle: 'italic',
    fontSize: 13, color: COLORS.muted, lineHeight: 20,
  },
  learnedGroup: {},
  learnedGroupLabel: {
    fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.3,
    color: COLORS.muted, marginBottom: 8,
  },
  tagLiked: {
    backgroundColor: COLORS.oliveBg, borderColor: COLORS.olive,
  },
  tagDisliked: {
    backgroundColor: COLORS.terracottaBg, borderColor: COLORS.terracotta,
  },
  tagStarLiked: {
    fontSize: 11, color: COLORS.olive,
  },
  tagStarDisliked: {
    fontSize: 11, color: COLORS.terracotta,
  },
  resetLearnedBtn: {
    marginTop: 16, paddingVertical: 10, borderRadius: 4,
    borderWidth: 1, borderColor: COLORS.rule, alignItems: 'center',
  },
  resetLearnedBtnTxt: {
    fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1.5,
    color: COLORS.inkSoft,
  },
});
