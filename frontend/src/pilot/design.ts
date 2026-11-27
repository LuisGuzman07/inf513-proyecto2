import type { ThemeConfig } from 'antd';
import { getAntdThemeConfig } from '../theme/antd-theme';
import { institutionalColors as colors } from './identity';

const templateTheme = getAntdThemeConfig('clean', 'light', {
  primaryLight: colors.primary,
  borderRadius: 8,
});

// Proposed visual palette, not an official UAGRM identity.
export const institutionalTheme: ThemeConfig = {
  ...templateTheme,
  inherit: false,
  token: {
    ...templateTheme.token,
    colorPrimary: colors.primary,
    colorLink: colors.primary,
    colorInfo: colors.blue,
    colorBgLayout: colors.background,
    colorBgContainer: colors.surface,
    colorText: colors.text,
    colorTextSecondary: colors.secondary,
    // Form hints and Typography secondary use this alias in AntD 6.
    colorTextDescription: colors.secondary,
    colorTextTertiary: colors.secondary,
    colorSuccessText: colors.successText,
    colorWarningText: colors.warningText,
    colorErrorText: colors.primary,
    colorBorder: colors.border,
    colorBorderSecondary: colors.border,
    // Informational surfaces use the light institutional blue instead of the
    // gray tone antd derives from a dark `colorInfo`.
    colorInfoBg: colors.infoSurface,
    colorInfoBorder: colors.infoBorder,
    fontFamily:
      "Lato, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: 16,
    fontSizeHeading1: 32,
    fontSizeHeading2: 24,
    fontSizeHeading3: 20,
    borderRadius: 8,
    controlHeight: 40,
    padding: 16,
    paddingLG: 24,
    margin: 16,
    marginLG: 24,
  },
  components: {
    ...templateTheme.components,
    Table: {
      ...templateTheme.components?.Table,
      headerBg: colors.background,
      headerColor: colors.blue,
      cellPaddingBlock: 16,
      cellPaddingInline: 16,
      rowHoverBg: colors.background,
    },
    Card: { ...templateTheme.components?.Card, bodyPadding: 24 },
    Menu: { ...templateTheme.components?.Menu, itemBorderRadius: 8 },
    Form: {
      ...templateTheme.components?.Form,
      colorError: colors.primary,
      colorWarning: colors.warningText,
    },
    Tag: {
      ...templateTheme.components?.Tag,
      // Status Tag text uses these colors rather than the *Text aliases.
      colorWarning: colors.warningText,
      colorSuccess: colors.successText,
      colorError: colors.primary,
      colorInfo: colors.blue,
    },
  },
};
