import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Text, View, useColorScheme } from 'react-native';

const colors = {
  light: { background: '#F3F4F6', surface: '#FFFFFF', text: '#0F172A', muted: '#64748B' },
  dark: { background: '#0B1220', surface: '#111C2E', text: '#EDF3FF', muted: '#9AAAC1' },
};

export default function App() {
  const scheme = useColorScheme();
  const palette = scheme === 'dark' ? colors.dark : colors.light;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: palette.background }]}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />
      <View style={[styles.card, { backgroundColor: palette.surface }]}>
        <View style={styles.mark}><Text style={styles.markText}>⌂</Text></View>
        <Text style={[styles.title, { color: palette.text }]}>Apna <Text style={styles.green}>Ghar</Text></Text>
        <Text style={[styles.subtitle, { color: palette.muted }]}>Find a place to call home.</Text>
        <View style={styles.pill}><Text style={styles.pillText}>MOBILE FOUNDATION</Text></View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'center', padding: 24 },
  card: { alignItems: 'center', padding: 32, borderRadius: 24, elevation: 2 },
  mark: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  markText: { color: '#FFFFFF', fontSize: 38, fontWeight: '700' },
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.8 },
  green: { color: '#10B981' },
  subtitle: { marginTop: 8, fontSize: 15 },
  pill: { marginTop: 24, borderRadius: 999, backgroundColor: '#10B9811A', paddingHorizontal: 14, paddingVertical: 8 },
  pillText: { color: '#059669', fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
});
