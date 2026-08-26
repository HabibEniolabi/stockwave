import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { getTypography } from '../../theme/typography';

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Market</Text>

        <Text style={styles.subtitle}>Market UI goes here.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.other.white,
  },

  container: {
    flex: 1,
    padding: spacing[4],
  },

  title: {
    ...getTypography('heading4', 'bold'),
    color: colors.neutral[900],
  },

  subtitle: {
    ...getTypography('bodyMedium'),
    marginTop: spacing[2],
    color: colors.neutral[500],
  },
});
