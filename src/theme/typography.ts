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
  heading: 'MuseoModerno_Bold';
  headingRegular: 'MuseoModerno_Regular';
  regular: 'MuseoModerno_Regular';
  medium: 'MuseoModerno_Medium';
  semibold: 'MuseoModerno_SemiBold';
  bold: 'MuseoModerno_Bold';
  amountLight: 'MuseoModerno_Regular';
  amountRegular: 'MuseoModerno_Medium';
  amountBold: 'MuseoModerno_SemiBold';
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
    heading: 'MuseoModerno_Bold',
    headingRegular: 'MuseoModerno_Regular',
    regular: 'MuseoModerno_Regular',
    medium: 'MuseoModerno_Medium',
    semibold: 'MuseoModerno_SemiBold',
    bold: 'MuseoModerno_Bold',
    amountLight: 'MuseoModerno_Regular',
    amountRegular: 'MuseoModerno_Medium',
    amountBold: 'MuseoModerno_SemiBold',
  },
};
