import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Dimensions,
  ImageBackground,
  ScrollView,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useTheme } from "../utils/theme";
import type { AppStackParamList } from "../navigation/AppNavigator";

const { width } = Dimensions.get("window");
const CARD_PADDING = 16;

type Props = NativeStackScreenProps<AppStackParamList, "SupportScreen">;

const SupportScreen: React.FC<Props> = () => {
  const { colors, typography, backgroundImage } = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ImageBackground
        source={backgroundImage}
        style={styles.background}
        imageStyle={styles.bgImage}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "flex-start",
            alignItems: "center",
          }}
        >
          <View style={styles.header}>
            <Text
              style={[
                styles.pageTitle,
                {
                  fontSize: typography.fontSize + 6,
                  fontWeight: "700",
                  color: typography.textColor,
                  fontFamily: "Raleway",
                },
              ]}
            >
              Support
            </Text>
          </View>
          <View style={[styles.heroCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
            <Text
              style={{
                fontSize: typography.fontSize + 2,
                fontWeight: "700",
                color: typography.textColor,
                textAlign: "center",
                marginBottom: 6,
                fontFamily: "Raleway",
              }}
            >
              We’re here to help!
            </Text>
            <Text
              style={{
                fontSize: typography.fontSize,
                color: colors.textSecondary,
                textAlign: "center",
                marginBottom: 16,
                fontFamily: "Raleway",
              }}
            >
              This is a school project — but we want your experience to be smooth.
            </Text>
            <View style={{ marginTop: 8 }}>
              <Text
                style={{
                  fontWeight: "700",
                  color: colors.primary,
                  fontSize: typography.fontSize,
                  marginBottom: 6,
                  fontFamily: "Raleway",
                }}
              >
                Frequently Asked Questions
              </Text>
              <Text
                style={{
                  fontWeight: "700",
                  fontSize: typography.fontSize,
                  color: typography.textColor,
                  fontFamily: "Raleway",
                }}
              >
                Q: Is EverCare a real service?
              </Text>
              <Text
                style={{
                  marginLeft: 8,
                  marginBottom: 8,
                  color: colors.textSecondary,
                  fontSize: typography.fontSize,
                  fontFamily: "Raleway",
                }}
              >
                A: Not yet! This app is a student project — but we hope to make it awesome.
              </Text>
              <Text
                style={{
                  fontWeight: "700",
                  fontSize: typography.fontSize,
                  color: typography.textColor,
                  fontFamily: "Raleway",
                }}
              >
                Q: How can I contact support?
              </Text>
              <Text
                style={{
                  marginLeft: 8,
                  color: colors.textSecondary,
                  fontSize: typography.fontSize,
                  fontFamily: "Raleway",
                }}
              >
                A: Support is not live yet. When we launch, you’ll be able to email, call, or chat with us directly.
              </Text>
            </View>
            <View style={{ marginTop: 18 }}>
              <Text
                style={{
                  fontWeight: "700",
                  color: colors.primary,
                  fontSize: typography.fontSize,
                  marginBottom: 10,
                  fontFamily: "Raleway",
                }}
              >
                Contact Us (Coming Soon)
              </Text>
              <View style={[styles.fakeButton, { backgroundColor: colors.surface }]}>
                <Ionicons name="mail-outline" size={22} color={colors.textSecondary} style={{ marginRight: 8 }} />
                <Text style={[styles.fakeButtonText, { color: colors.textSecondary }]}>support@evercare.com</Text>
              </View>
              <View style={[styles.fakeButton, { backgroundColor: colors.surface }]}>
                <Ionicons name="call-outline" size={22} color={colors.textSecondary} style={{ marginRight: 8 }} />
                <Text style={[styles.fakeButtonText, { color: colors.textSecondary }]}>+1 (800) 123-4567</Text>
              </View>
            </View>
          </View>
          <Text
            style={{
              marginTop: 24,
              fontSize: typography.fontSize - 2,
              color: colors.textSecondary,
              textAlign: "center",
              fontFamily: "Raleway",
            }}
          >
            This page is a placeholder for future support features.
          </Text>
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  background: { flex: 1, width },
  bgImage: { opacity: 0.6, resizeMode: "cover" },
  header: { padding: CARD_PADDING, marginTop: CARD_PADDING, alignItems: "center" },
  pageTitle: {},
  heroCard: {
    margin: CARD_PADDING,
    padding: CARD_PADDING,
    borderRadius: 12,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    alignItems: "center",
    width: width - CARD_PADDING * 2,
  },
  fakeButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    borderRadius: 12,
    padding: 10,
    opacity: 0.6,
    alignSelf: "flex-start",
  },
  fakeButtonText: {
    fontSize: 16,
    fontFamily: "Raleway",
  },
});

export default SupportScreen;
