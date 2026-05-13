import { View, Text, StyleSheet } from 'react-native';

export default function EscalationsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Escalations</Text>
      <Text style={styles.subtext}>Coming Soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f4f5',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#006875',
  },
  subtext: {
    fontSize: 16,
    color: '#6b7a7d',
    marginTop: 8,
  },
});
