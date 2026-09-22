import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { SymbolView } from "expo-symbols";

import { AmbientBackground } from "../src/components/motion/AmbientBackground";
import { AdaptiveGlass } from "../src/components/glass/AdaptiveGlass";
import { GlassButton } from "../src/components/glass/GlassButton";
import { ScanProgress } from "../src/components/motion/ScanProgress";
import { useScanContext } from "../src/context/ScanContext";
import {
  extractSupportedUrlFromText,
  isSupportedMediaUrl,
  pollUrlJob,
  submitUrlJob,
} from "../src/api/urlMedia";
import { getPendingSharedPayload, clearPendingSharedPayload } from "../src/native/shareBridge";
import { MediaExtractResponse, UrlJobStatusResponse } from "../src/api/types";
import { colors } from "../src/theme/colors";
import { radii, spacing } from "../src/theme/spacing";
import { typography } from "../src/theme/typography";
import { shadows } from "../src/theme/shadows";

export default function HandleShareScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setScanResult } = useScanContext();
  const params = useLocalSearchParams<{ url?: string; source?: string; id?: string }>();

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [currentStageMessage, setCurrentStageMessage] = useState<string>(
    "جارٍ استلام المحتوى المشارك..."
  );
  const [pendingResult, setPendingResult] = useState<MediaExtractResponse | null>(null);

  const hasProcessedRef = useRef<boolean>(false);
  const processedUrlRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const pendingIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    let active = true;
    processedUrlRef.current = null;

    const resolveAndProcess = async () => {
      let candidateUrl: string | null = null;

      // 1. First priority: direct query parameter from custom scheme
      if (params.url && typeof params.url === "string") {
        // Expo Router has already decoded route parameters.
        candidateUrl = params.url;
      }
      const appGroupPayload = await getPendingSharedPayload();
      if (!active) return;
      if (appGroupPayload && (!candidateUrl || candidateUrl === appGroupPayload.url)) {
        pendingIdRef.current = appGroupPayload.id;
      }

      // 2. Second priority: App Group shared container fallback
      if (!candidateUrl) {
        if (appGroupPayload && appGroupPayload.url) {
          candidateUrl = appGroupPayload.url;
        }
      }

      if (!candidateUrl) {
        setIsError(true);
        setErrorMessage("لم يتم العثور على رابط صالح في المحتوى المشارك.");
        return;
      }

      const extracted = extractSupportedUrlFromText(candidateUrl);
      if (!extracted || !isSupportedMediaUrl(extracted)) {
        setIsError(true);
        setErrorMessage(
          "المحتوى المشارك لا يحتوي على رابط مدعوم من يوتيوب (بما فيها Shorts) أو تيك توك أو إنستغرام (Reels)."
        );
        return;
      }

      // Deduplicate: avoid re-triggering for identical URL within same mount
      if (processedUrlRef.current === extracted) {
        return;
      }

      hasProcessedRef.current = true;
      processedUrlRef.current = extracted;

      await startProcessingUrl(extracted);
    };

    resolveAndProcess();
    return () => { active = false; abortControllerRef.current?.abort(); };
  }, [params.url, params.id]);

  const startProcessingUrl = async (url: string) => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setPendingResult(null);
    setIsProcessing(true);
    setIsError(false);
    setIsComplete(false);
    setErrorMessage("");
    setCurrentStageMessage("جارٍ التحقق من الرابط المشارك...");

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const submitRes = await submitUrlJob(url, controller.signal);
      if (controller.signal.aborted) return;
      if (pendingIdRef.current) {
        await clearPendingSharedPayload(pendingIdRef.current);
        pendingIdRef.current = undefined;
      }

      const jobResult: UrlJobStatusResponse = await pollUrlJob(submitRes.jobId, {
        signal: controller.signal,
        onProgress: (status) => {
          if (controller.signal.aborted) return;
          if (status.message) {
            setCurrentStageMessage(status.message);
          }
        },
      });
      if (controller.signal.aborted) return;

      if (
        jobResult.result &&
        jobResult.result.status === "candidates" &&
        jobResult.result.results.length > 0
      ) {
        setPendingResult(jobResult.result);
        setIsComplete(true);
      } else if (jobResult.result && jobResult.result.status === "not_found") {
        setIsProcessing(false);
        setIsError(true);
        setErrorMessage("لم نتمكن من العثور على آية أو حديث موثّق يطابق المحتوى.");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } else {
        setIsProcessing(false);
        setIsError(true);
        setErrorMessage(jobResult.result?.message || "تعذر العثور على نتائج موثقة للمقطع.");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    } catch (err: any) {
      if (controller.signal.aborted) return;
      setIsProcessing(false);
      setIsError(true);
      setErrorMessage(err.message || "تعذر إكمال فحص الرابط المشارك.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleIrisOpened = () => {
    if (pendingResult) {
      try {
        setScanResult(pendingResult);
        router.replace("/result" as unknown as never);
      } catch (navErr) {
        console.error("Navigation error from handle-share to result:", navErr);
      }
    }
  };

  const handleGoHome = () => {
    Haptics.selectionAsync();
    router.replace("/" as unknown as never);
  };

  const handleGoScan = () => {
    Haptics.selectionAsync();
    router.replace("/scan" as unknown as never);
  };

  return (
    <AmbientBackground>
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top + spacing.sm,
            paddingBottom: insets.bottom + spacing.md,
          },
        ]}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <Pressable
            onPress={handleGoHome}
            accessible
            accessibilityRole="button"
            accessibilityLabel="العودة إلى الرئيسية"
            hitSlop={12}
            style={styles.navButton}
          >
            <AdaptiveGlass borderRadius={radii.full} style={styles.navGlassCircle}>
              {Platform.OS === "ios" ? (
                <SymbolView name="chevron.backward" size={16} tintColor={colors.ivory} />
              ) : (
                <Text style={styles.navFallbackText}>←</Text>
              )}
            </AdaptiveGlass>
          </Pressable>

          <Text style={styles.screenHeaderTitle}>فحص المحتوى المشارك</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Content */}
        <View style={styles.contentArea}>
          {isProcessing || isComplete ? (
            <View style={styles.centerContainer}>
              <ScanProgress
                mediaType="video"
                isComplete={isComplete}
                isError={isError}
                errorMessage={errorMessage}
                onIrisOpened={handleIrisOpened}
              />
              <Text style={styles.stageMessageText}>{currentStageMessage}</Text>
            </View>
          ) : isError ? (
            <AdaptiveGlass
              borderRadius={radii.xl}
              style={[styles.statusCard, shadows.glassCard]}
              highlightBorder
            >
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorTitle}>تعذر إكمال الفحص</Text>
              <Text style={styles.errorMessage}>{errorMessage}</Text>

              <View style={styles.actionButtons}>
                {processedUrlRef.current && (
                  <GlassButton label="إعادة المحاولة" variant="primary"
                    onPress={() => void startProcessingUrl(processedUrlRef.current!)} style={styles.fullButton} />
                )}
                <GlassButton
                  label="الانتقال إلى الفحص اليدوي"
                  variant="primary"
                  onPress={handleGoScan}
                  style={styles.fullButton}
                />
                <GlassButton
                  label="الرئيسية"
                  variant="secondary"
                  onPress={handleGoHome}
                  style={styles.fullButton}
                />
              </View>
            </AdaptiveGlass>
          ) : (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.warmGold} />
              <Text style={styles.loadingText}>جارٍ قراءة المشاركة...</Text>
            </View>
          )}
        </View>
      </View>
    </AmbientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  headerRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  navButton: {
    width: 36,
    height: 36,
  },
  navGlassCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(7, 26, 20, 0.5)",
  },
  navFallbackText: {
    color: colors.ivory,
    fontSize: 16,
  },
  screenHeaderTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.ivory,
  },
  headerSpacer: {
    width: 36,
  },
  contentArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  centerContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  stageMessageText: {
    marginTop: spacing.xl,
    fontSize: 15,
    color: colors.warmGold,
    fontWeight: "600",
    textAlign: "center",
  },
  statusCard: {
    width: "100%",
    padding: spacing.xl,
    alignItems: "center",
  },
  errorIcon: {
    fontSize: 38,
    marginBottom: spacing.sm,
  },
  errorTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: colors.ivory,
    marginBottom: spacing.xs,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 14,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  actionButtons: {
    width: "100%",
    gap: spacing.sm,
  },
  fullButton: {
    width: "100%",
  },
  loadingContainer: {
    alignItems: "center",
    gap: spacing.md,
  },
  loadingText: {
    fontSize: 15,
    color: colors.muted,
  },
});
