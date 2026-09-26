import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import StudioScreen from '../src/features/verification/StudioScreen';
import { Backdrop } from '../src/components/experience/Backdrop';
import { AnimatedContent } from '../src/components/experience/AnimatedContent';
import { GlassAction } from '../src/components/experience/GlassAction';
import { TabayyanLogo } from '../src/components/brand/TabayyanLogo';
import { palette } from '../src/components/experience/theme';

// Show the welcome once per app session; incoming verification links bypass it.
let enteredStudio = false;
export default function Home() {
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [entered, setEntered] = useState(enteredStudio);
  const incoming = ['url', 'q', 'uri', 'mode', 'id'].some(key => !!params[key]);
  if (entered || incoming) return <StudioScreen />;
  return (
    <View style={s.root}>
      <Backdrop />
      <ScrollView contentContainerStyle={[s.content, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 }]}>
        <AnimatedContent style={s.hero}>
          <View style={s.logo}><TabayyanLogo width={132} height={110} color={palette.mint} /></View>
          <Text style={s.name}>تبيّن</Text>
          <View style={s.line} />
          <Text style={s.title}>للكلمة أصل.</Text>
          <Text style={s.subtitle}>ومن هنا، تصل إليه.</Text>
          <Text style={s.description}>آية، حديث، صورة أو مقطع.{'\n'}ابدأ بما لديك، وارجع إلى المصدر.</Text>
        </AnimatedContent>
        <AnimatedContent delay={120} style={s.bottom}>
          <View style={s.action}>
            <GlassAction primary label="ابدأ التحقّق" icon="check" onPress={() => { enteredStudio = true; setEntered(true); }} style={{ minHeight: 62, width: '100%' }} />
          </View>
          <Text style={s.note}>النصوص والأحكام من مصادرها.{'\n'}والذكاء الصناعي يساعدك على الوصول إليها.</Text>
        </AnimatedContent>
      </ScrollView>
    </View>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg },
  content: { flexGrow: 1, paddingHorizontal: 28, justifyContent: 'space-between', gap: 32 },
  hero: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 28 },
  logo: { padding: 20, marginBottom: 12 },
  name: { color: palette.text, fontSize: 48, fontWeight: '600', textAlign: 'center', lineHeight: 70 },
  line: { width: 32, height: 1, backgroundColor: palette.green, opacity: .6, marginVertical: 28 },
  title: { color: palette.text, fontSize: 38, fontWeight: '500', textAlign: 'center', lineHeight: 56 },
  subtitle: { color: palette.mint, fontSize: 23, textAlign: 'center', lineHeight: 38 },
  description: { color: palette.muted, fontSize: 15, lineHeight: 28, textAlign: 'center', marginTop: 22 },
  bottom: { alignItems: 'center', gap: 20 },
  action: { width: '100%', maxWidth: 380 },
  note: { color: palette.muted, fontSize: 11, lineHeight: 20, textAlign: 'center' },
});
