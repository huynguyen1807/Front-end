const token = (name: string) => `var(--ff-${name})`;

export const COLORS = {
  background: token("background"),
  surface: token("surface"),
  surfaceContainer: token("surface-container"),
  surfaceContainerHigh: token("surface-container-high"),
  surfaceContainerHighest: token("surface-container-highest"),
  surfaceContainerLowest: token("surface-container-lowest"),
  primary: token("primary"),
  primaryContainer: token("primary-container"),
  onPrimary: token("on-primary"),
  onPrimaryContainer: token("on-primary-container"),
  secondary: token("secondary"),
  secondaryContainer: token("secondary-container"),
  onSecondaryContainer: token("on-secondary-container"),
  tertiary: token("tertiary"),
  tertiaryFixed: token("tertiary-fixed"),
  onTertiary: token("on-tertiary"),
  onTertiaryFixed: token("on-tertiary-fixed"),
  outlineVariant: token("outline-variant"),
  onSurface: token("on-surface"),
  onSurfaceVariant: token("on-surface-variant"),
  error: token("error"),
  alpha: (color: string, opacity: string) => {
    const match = /^var\(--ff-(.+)\)$/.exec(color);
    return match ? `var(--ff-${match[1]}-alpha-${opacity})` : color;
  },
};
