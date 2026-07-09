import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Colors } from "@/theme/colors";
import { Typography } from "@/theme/typography";

interface Props {
  children: React.ReactNode;
  colorScheme?: "light" | "dark";
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleReset = () => this.setState({ hasError: false, error: undefined });

  render() {
    if (!this.state.hasError) return this.props.children;

    const c = Colors[this.props.colorScheme ?? "light"];
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <Text style={[styles.title, { color: c.foreground, fontFamily: Typography.fontFamily.bold }]}>
          Bir hata oluştu
        </Text>
        <Text style={[styles.message, { color: c.mutedForeground, fontFamily: Typography.fontFamily.regular }]}>
          {this.state.error?.message ?? "Beklenmeyen bir hata meydana geldi."}
        </Text>
        <TouchableOpacity
          onPress={this.handleReset}
          style={[styles.button, { backgroundColor: c.primary }]}
          accessibilityRole="button"
          accessibilityLabel="Tekrar dene"
        >
          <Text style={[styles.buttonText, { color: c.primaryForeground, fontFamily: Typography.fontFamily.semiBold }]}>
            Tekrar Dene
          </Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  title:     { fontSize: 20, marginBottom: 12, textAlign: "center" },
  message:   { fontSize: 14, textAlign: "center", marginBottom: 28, lineHeight: 22 },
  button:    { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 10 },
  buttonText:{ fontSize: 16 },
});
