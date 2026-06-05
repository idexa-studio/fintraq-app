export type TypographyScale = {
  xxs: number;
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
  xxxl: number;
};

export type TypographyWeight = {
  regular: '400';
  medium: '500';
  semibold: '600';
  bold: '700';
};

export type TypographyFonts = {
  heading: 'GoogleSans_Bold';
  headingRegular: 'GoogleSans_Regular';
  regular: 'GoogleSans_Regular';
  medium: 'GoogleSans_Medium';
  semibold: 'GoogleSans_SemiBold';
  bold: 'GoogleSans_Bold';
  amountLight: 'GoogleSans_Regular';
  amountRegular: 'GoogleSans_Medium';
  amountBold: 'GoogleSans_SemiBold';
};

export type TypographyTheme = {
  sizes: TypographyScale;
  weights: TypographyWeight;
  fonts: TypographyFonts;
};

export const TYPOGRAPHY: TypographyTheme = {
  sizes: {
    xxs: 9.5,
    xs: 11,
    sm: 13,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 22,
    xxxl: 28,
  },
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  fonts: {
    heading: 'GoogleSans_Bold',
    headingRegular: 'GoogleSans_Regular',
    regular: 'GoogleSans_Regular',
    medium: 'GoogleSans_Medium',
    semibold: 'GoogleSans_SemiBold',
    bold: 'GoogleSans_Bold',
    amountLight: 'GoogleSans_Regular',
    amountRegular: 'GoogleSans_Medium',
    amountBold: 'GoogleSans_SemiBold',
  },
};
