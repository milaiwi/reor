import { createTamagui, Theme } from '@tamagui/core'
import { shorthands } from '@tamagui/shorthands'
import { createTokens } from '@tamagui/web'
import { animations } from './config/animations'
import { bodyFont, editorBody, headingFont, monoFont } from './config/fonts'
import { media, mediaQueryDefaultActive } from './config/media'
import { radius } from './themes/token-radius'
import { size } from './themes/token-size'
import { space } from './themes/token-space'
import { zIndex } from './themes/token-z-index'

import * as themes from './themes/themes-generated'
import { color } from './themes/token-colors'

type ThemeWithDisplayName = typeof themes.themes[keyof typeof themes.themes] & { displayName: string };

const themesWithDisplayName = Object.keys(themes.themes).reduce((acc, key) => {
  const typedKey = key as keyof typeof themes.themes;

  acc[typedKey] = {
    ...themes.themes[typedKey], // Spread the existing theme properties
    displayName: key.charAt(0).toUpperCase() + key.slice(1), // Add the displayName
  } as ThemeWithDisplayName; // Ensure it's cast to the extended type

  return acc;
}, {} as Record<keyof typeof themes.themes, ThemeWithDisplayName>);


console.log(`themesWithDisplayName:`, themesWithDisplayName)

const conf = {
  themes: themesWithDisplayName,
  defaultFont: 'body',
  animations,
  shouldAddPrefersColorThemes: true,
  themeClassNameOnRoot: true,
  shorthands,
  fonts: {
    heading: headingFont,
    body: bodyFont,
    mono: monoFont,
    editorBody,
  },
  tokens: createTokens({
    color,
    radius,
    zIndex,
    space,
    size,
    opacity: {
      low: 0.4,
      medium: 0.6,
      high: 0.8,
      full: 1.0,
    },
  }),
  media,
  settings: {
    webContainerType: 'inherit',
  },
} satisfies Parameters<typeof createTamagui>['0']

// @ts-ignore - passing this directly breaks TS types
conf.mediaQueryDefaultActive = mediaQueryDefaultActive

export const config = createTamagui(conf)
