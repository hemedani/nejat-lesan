import { StyleSheet, Text, View } from 'react-native';

import { AppTheme, Estedad } from '@/constants/theme';

import { IconButton } from './icon-button';

export function ScreenHeader({
  title,
  onBack,
  action,
}: {
  title: string;
  onBack?: () => void;
  action?: React.ReactNode;
}) {
  return (
    <View style={styles.container}>
      {onBack ? (
        <IconButton accessibilityLabel="بازگشت" icon="arrow-forward" onPress={onBack} />
      ) : (
        <View style={styles.spacer} />
      )}
      <Text numberOfLines={1} style={styles.title}>
        {title}
      </Text>
      {action ?? <View style={styles.spacer} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: AppTheme.colors.surface,
    borderBottomColor: AppTheme.colors.hairline,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row-reverse',
    gap: 8,
    minHeight: 56,
    paddingHorizontal: 12,
  },
  spacer: {
    width: 48,
  },
  title: {
    color: AppTheme.colors.textStrong,
    flex: 1,
    fontFamily: Estedad.bold,
    fontSize: 17,
    lineHeight: 26,
    textAlign: 'center',
  },
});
