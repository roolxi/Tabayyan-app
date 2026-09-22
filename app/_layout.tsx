import React, { useEffect, useState } from "react";
import { AccessibilityInfo, StyleSheet, Text, View } from "react-native";
import { Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GlassDock } from "../src/components/glass/GlassDock";
import { ScanProvider } from "../src/context/ScanContext";
import { isConfigured } from "../src/api/client";
import { colors } from "../src/theme/colors";
import { spacing } from "../src/theme/spacing";
import { PendingShareListener } from "../src/components/PendingShareListener";

export default function RootLayout() {
  const pathname = usePathname();
  const configured = isConfigured();
  const [reduceMotion, setReduceMotion] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (active) setReduceMotion(enabled);
      })
      .catch(() => {});

    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", (enabled) => {
      setReduceMotion(enabled);
    });

    return () => {
      active = false;
      sub.remove();
    };
  }, []);

  // Hide the dock on the scanning progress screen or ceremonial screens if needed
  const hideDock = pathname === "/result" || pathname === "/handle-share";

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <ScanProvider>
          <StatusBar style="light" />

          {!configured && (
            <View style={styles.configBanner} accessible accessibilityRole="alert">
              <Text style={styles.configBannerTitle}>تنبيه ضبط الخادم (Development)</Text>
              <Text style={styles.configBannerText}>
                لم يتم ضبط عنوان الخادم في EXPO_PUBLIC_API_BASE_URL داخل ملف .env.
                انسخ .env.example إلى .env وضع عنوان IP المحلي لجهازك (مثال: http://192.168.1.100:8000).
              </Text>
            </View>
          )}

          <Stack
            screenOptions={({ route }) => {
              const tabDirection = (route.params as Record<string, any> | undefined)?.__tabDirection;
              let animation: "slide_from_right" | "slide_from_left" | "none" = "slide_from_right";

              if (reduceMotion) {
                animation = "none";
              } else if (tabDirection === "left") {
                animation = "slide_from_left";
              } else if (tabDirection === "right") {
                animation = "slide_from_right";
              }

              return {
                headerShown: false,
                contentStyle: { backgroundColor: colors.obsidian },
                animation,
                animationDuration: 280,
                animationTypeForReplace: "push",
                freezeOnBlur: false,
              };
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="search" />
            <Stack.Screen name="scan" />
            <Stack.Screen name="result" />
            <Stack.Screen name="about" />
            <Stack.Screen name="handle-share" />
          </Stack>
          <PendingShareListener />

          {!hideDock && <GlassDock />}
        </ScanProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.obsidian,
  },
  configBanner: {
    position: "absolute",
    top: 50,
    left: 16,
    right: 16,
    zIndex: 999,
    backgroundColor: "rgba(239, 68, 68, 0.95)",
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFF",
  },
  configBannerTitle: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 14,
    textAlign: "right",
    marginBottom: 4,
  },
  configBannerText: {
    color: "#FFF",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "right",
  },
});
