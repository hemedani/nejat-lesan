import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Banner } from '@/components/ui/banner';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { ListRow } from '@/components/ui/list-row';
import { AppTheme, Estedad, Radius } from '@/constants/theme';
import type { HelpSection } from '@/content/help-content';

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

function faNumber(value: number): string {
  return String(value)
    .split('')
    .map(char => (char >= '0' && char <= '9' ? FA_DIGITS[Number(char)] : char))
    .join('');
}

export function HelpSectionCard({ section }: { section: HelpSection }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function toggle() {
    setOpen(current => !current);
  }

  return (
    <Card variant="default" style={styles.card}>
      <Pressable
        accessibilityLabel={section.title}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={toggle}
        style={({ pressed }) => [styles.header, pressed && styles.headerPressed]}
      >
        <View style={styles.iconBadge}>
          <Icon color={AppTheme.colors.primaryStrong} family={section.iconFamily} name={section.icon} size={20} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>{section.title}</Text>
          {section.intro ? (
            <Text numberOfLines={2} style={styles.intro}>
              {section.intro}
            </Text>
          ) : null}
        </View>
        <Icon color={AppTheme.colors.textFaint} name={open ? 'chevron-up' : 'chevron-down'} size={18} />
      </Pressable>

      {open ? (
        <View style={styles.body}>
          {section.paragraphs?.map(paragraph => (
            <Text key={paragraph} style={styles.paragraph}>
              {paragraph}
            </Text>
          ))}

          {section.steps?.map((step, index) => (
            <View key={step} style={styles.stepRow}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepNumber}>{faNumber(index + 1)}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}

          {section.callouts?.map(callout => (
            <Banner key={callout.text} message={callout.text} style={styles.callout} tone={callout.tone} />
          ))}

          {section.links?.map(link => (
            <View key={link.route} style={styles.linkRow}>
              <ListRow
                onPress={() =>
                  link.navigate
                    ? router.navigate(link.route as Parameters<typeof router.navigate>[0])
                    : router.push(link.route as Parameters<typeof router.push>[0])
                }
                showChevron
                title={link.label}
              />
            </View>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: 12,
    minHeight: 48,
  },
  headerPressed: {
    opacity: 0.75,
  },
  iconBadge: {
    alignItems: 'center',
    backgroundColor: AppTheme.colors.primarySoft,
    borderRadius: 12,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: AppTheme.colors.textStrong,
    fontFamily: Estedad.semiBold,
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'right',
  },
  intro: {
    color: AppTheme.colors.textSecondary,
    fontFamily: Estedad.regular,
    fontSize: 12.5,
    lineHeight: 19,
    textAlign: 'right',
  },
  body: {
    borderTopColor: AppTheme.colors.hairline,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
  },
  paragraph: {
    color: AppTheme.colors.textBody,
    fontFamily: Estedad.regular,
    fontSize: 13.5,
    lineHeight: 23,
    textAlign: 'right',
  },
  stepRow: {
    alignItems: 'flex-start',
    flexDirection: 'row-reverse',
    gap: 10,
  },
  stepBadge: {
    alignItems: 'center',
    backgroundColor: AppTheme.colors.surfaceSunken,
    borderRadius: Radius.pill,
    height: 24,
    justifyContent: 'center',
    marginTop: 1,
    width: 24,
  },
  stepNumber: {
    color: AppTheme.colors.primaryStrong,
    fontFamily: Estedad.bold,
    fontSize: 12,
    lineHeight: 18,
  },
  stepText: {
    color: AppTheme.colors.textBody,
    flex: 1,
    fontFamily: Estedad.regular,
    fontSize: 13,
    lineHeight: 22,
    textAlign: 'right',
  },
  callout: {
    marginTop: 2,
  },
  linkRow: {
    borderTopColor: AppTheme.colors.hairline,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 2,
    paddingTop: 2,
  },
});
