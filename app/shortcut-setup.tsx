import React, { useState } from 'react';
import { Linking, Platform, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassAction } from '../src/components/experience/GlassAction';
import { Glass } from '../src/components/experience/Glass';
import { palette } from '../src/components/experience/theme';
import { buildShortcutDeepLink, SHORTCUT_PREFIX, SHORTCUT_STEPS, shortcutInstallURL } from '../src/sharing/shortcut';

export default function ShortcutSetup() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ error?: string }>();
  const [error, setError] = useState(
    params.error
      ? 'المشاركة لا تحتوي رابط مقطع مدعومًا. تأكد من مشاركة رابط عام من إنستغرام أو تيك توك أو يوتيوب.'
      : ''
  );
  const [sample, setSample] = useState('');
  const [showManualHelp, setShowManualHelp] = useState(false);

  // Defaults to the official iCloud shortcut link in source, overridable via EXPO_PUBLIC_SHORTCUT_INSTALL_URL
  const installURL = shortcutInstallURL();

  const open = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      setError('تعذّر فتح الرابط. تأكد أن تطبيق «الاختصارات» مثبت على الآيفون.');
    }
  };

  const manualInstructions =
    SHORTCUT_STEPS.map(([title, body]) => title + '\n' + body).join('\n\n') +
    '\n\nالبادئة المستخدمة:\n' +
    SHORTCUT_PREFIX +
    '[URL Encoded Text]';

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={[
        s.content,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
      ]}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
    >
      <GlassAction
        label="رجوع"
        icon="close"
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        style={{ alignSelf: 'flex-start' }}
      />

      <Text style={s.title}>تبيّن من قائمة المشاركة</Text>
      <Text style={s.body}>
        تحقّق من مقاطع إنستغرام وتيك توك ويوتيوب مباشرة من قائمة المشاركة في iOS بنفس المصادر والنتائج.
      </Text>

      {/* Main Ready-to-Install Shortcut Card */}
      <Glass radius={24} style={s.card}>
        <Text style={s.heading}>إضافة الاختصار إلى الآيفون</Text>
        <Text style={s.body}>
          ١. اضغط الزر أدناه لإضافة الاختصار الجاهز «تحقّق عبر تبيّن» إلى جهازك مرة واحدة.
        </Text>
        <Text style={s.body}>
          ٢. من أي مقطع في إنستغرام، تيك توك، أو يوتيوب؛ افتح قائمة المشاركة في iOS واختر «تحقّق عبر تبيّن» ليبدأ التحقق فوراً.
        </Text>
        <Text style={s.hint}>
          قد يطلب تطبيق «الاختصارات» (Apple Shortcuts) تأكيد إضافة الاختصار (Add Shortcut)، كما قد يطلب نظام iOS الإذن لفتح تطبيق «تبيّن» في المرة الأولى.
        </Text>

        <GlassAction
          primary
          label="إضافة اختصار تبيّن"
          icon="link"
          disabled={Platform.OS !== 'ios'}
          onPress={() => void open(installURL)}
        />
      </Glass>

      {/* Secondary Testing & Troubleshooting Card */}
      <Glass radius={24} style={s.card}>
        <Text style={s.heading}>اختبار استقبال الرابط في التطبيق</Text>
        <Text style={s.body}>
          ألصق رابط مقطع واضغط زر الفحص للتأكد من قدرة التطبيق على استقبال الروابط وبدء التحقق عبر الخادم.
        </Text>
        <TextInput
          accessibilityLabel="رابط مقطع للاختبار"
          value={sample}
          onChangeText={setSample}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="https://…"
          placeholderTextColor={palette.dim}
          style={s.input}
        />
        <GlassAction
          label="اختبار استقبال الرابط"
          icon="check"
          disabled={!sample.trim()}
          onPress={() => {
            try {
              void open(buildShortcutDeepLink(sample));
            } catch (e) {
              setError((e as Error).message);
            }
          }}
        />

        <View style={s.rule} />

        <GlassAction
          label={showManualHelp ? 'إخفاء المساعدة والتعليمات اليدوية' : 'تعليمات إضافية وحل المشكلات'}
          icon="info"
          onPress={() => setShowManualHelp(!showManualHelp)}
        />

        {showManualHelp && (
          <View style={s.manualHelp}>
            <Text style={s.heading}>إذا لم يظهر الاختصار في قائمة المشاركة:</Text>
            <Text style={s.body}>
              من نافذة المشاركة في iOS، انزل إلى أسفل القائمة واختر «تحرير الإجراءات» (Edit Actions)، ثم فعّل خيار «تحقّق عبر تبيّن» ليكون متاحاً دائماً.
            </Text>

            <Text style={[s.heading, { marginTop: 10 }]}>بادئة الرابط المباشر (Deep Link):</Text>
            <Text selectable style={s.code}>
              {SHORTCUT_PREFIX}
            </Text>
            <Text style={s.hint}>البادئة التي يستقبل عبرها تطبيق تبيّن الروابط من الاختصارات.</Text>

            <GlassAction
              label="مشاركة التعليمات اليدوية"
              icon="source"
              onPress={() => {
                void Share.share({ message: manualInstructions }).catch(() =>
                  setError('تعذّرت مشاركة التعليمات.')
                );
              }}
              style={{ marginTop: 8 }}
            />
          </View>
        )}
      </Glass>

      {!!error && (
        <Text accessibilityRole="alert" style={[s.body, { color: palette.danger }]}>
          {error}
        </Text>
      )}

      <Text style={s.hint}>
        تأكد من استخدام قائمة مشاركة نظام iOS وليس قائمة الرسائل الخاصة داخل التطبيق. يتطلب التحقق اتصالاً نشطاً بخادم تبيّن.
      </Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg },
  content: { paddingHorizontal: 22, gap: 18 },
  title: { color: palette.text, fontSize: 25, fontWeight: '700', textAlign: 'right', marginTop: 14 },
  heading: { color: palette.mint, fontSize: 16, fontWeight: '600', textAlign: 'right' },
  body: { color: palette.muted, fontSize: 14, textAlign: 'right', lineHeight: 25 },
  hint: { color: palette.dim, fontSize: 12, textAlign: 'right', lineHeight: 22 },
  card: { padding: 20, gap: 14 },
  rule: { height: 1, backgroundColor: palette.edge, marginVertical: 4 },
  manualHelp: { gap: 10, paddingTop: 4 },
  code: {
    color: palette.mint,
    fontSize: 12,
    lineHeight: 20,
    writingDirection: 'ltr',
    textAlign: 'left',
    padding: 10,
    backgroundColor: 'rgba(7, 26, 20, 0.6)',
    borderRadius: 8,
  },
  input: {
    borderColor: palette.edge,
    borderWidth: 1,
    borderRadius: 14,
    color: palette.text,
    padding: 14,
    minHeight: 48,
    textAlign: 'left',
    writingDirection: 'ltr',
  },
});
