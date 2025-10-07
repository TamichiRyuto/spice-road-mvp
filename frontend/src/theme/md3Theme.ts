import { createTheme, alpha } from '@mui/material/styles';

// Material Design 3 theme with Spice Curry color palette
// 現在の暖色系（#d2691e, #8b4513等）を維持しながらMD3の原則を適用

const md3Theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#d2691e', // チョコレート色（現在のメイン色）
      light: '#e89456',
      dark: '#a0501a',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#8b4513', // サドルブラウン（現在のアクセント色）
      light: '#b87951',
      dark: '#5d2e0b',
      contrastText: '#ffffff',
    },
    tertiary: {
      main: '#c68642',
      light: '#d9a567',
      dark: '#9c6631',
      contrastText: '#ffffff',
    },
    error: {
      main: '#ba1a1a',
      light: '#de3730',
      dark: '#93000a',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#ff6f00',
      light: '#ffa040',
      dark: '#c43e00',
      contrastText: '#ffffff',
    },
    success: {
      main: '#2e7d32',
      light: '#60ad5e',
      dark: '#005005',
      contrastText: '#ffffff',
    },
    background: {
      default: '#fef7ef', // 現在の背景色を維持
      paper: '#ffffff',
    },
    surface: {
      main: '#fef7ef',
      variant: '#f5ebe0',
    },
    text: {
      primary: '#2d1810',
      secondary: alpha('#2d1810', 0.7),
      disabled: alpha('#2d1810', 0.38),
    },
    divider: alpha('#8b4513', 0.12),
  },

  // MD3 Typography System
  typography: {
    fontFamily: '"Noto Sans JP", "Roboto", "Helvetica", "Arial", sans-serif',

    // Display styles
    displayLarge: {
      fontFamily: '"Noto Sans JP", sans-serif',
      fontSize: '3.5rem',
      fontWeight: 400,
      lineHeight: 1.12,
      letterSpacing: '-0.25px',
    },
    displayMedium: {
      fontFamily: '"Noto Sans JP", sans-serif',
      fontSize: '2.8rem',
      fontWeight: 400,
      lineHeight: 1.16,
      letterSpacing: 0,
    },
    displaySmall: {
      fontFamily: '"Noto Sans JP", sans-serif',
      fontSize: '2.25rem',
      fontWeight: 400,
      lineHeight: 1.22,
      letterSpacing: 0,
    },

    // Headline styles
    h1: {
      fontSize: '2rem',
      fontWeight: 700,
      lineHeight: 1.25,
      letterSpacing: 0,
    },
    h2: {
      fontSize: '1.75rem',
      fontWeight: 700,
      lineHeight: 1.29,
      letterSpacing: 0,
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.33,
      letterSpacing: 0,
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
      letterSpacing: '0.25px',
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.4,
      letterSpacing: 0,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.5,
      letterSpacing: '0.15px',
    },

    // Body styles
    body1: {
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: '0.5px',
    },
    body2: {
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: 1.43,
      letterSpacing: '0.25px',
    },

    // Label styles
    button: {
      fontSize: '0.875rem',
      fontWeight: 700,
      lineHeight: 1.43,
      letterSpacing: '0.5px',
      textTransform: 'none',
    },
    caption: {
      fontSize: '0.75rem',
      fontWeight: 400,
      lineHeight: 1.33,
      letterSpacing: '0.4px',
    },
    overline: {
      fontSize: '0.75rem',
      fontWeight: 500,
      lineHeight: 1.33,
      letterSpacing: '1px',
      textTransform: 'uppercase',
    },
  },

  // MD3 Shape System
  shape: {
    borderRadius: 12, // MD3の丸みを適用
  },

  // MD3 Elevation System (tonal elevation)
  shadows: [
    'none',
    '0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15)',
    '0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 2px 6px 2px rgba(0, 0, 0, 0.15)',
    '0px 1px 3px 0px rgba(0, 0, 0, 0.3), 0px 4px 8px 3px rgba(0, 0, 0, 0.15)',
    '0px 2px 3px 0px rgba(0, 0, 0, 0.3), 0px 6px 10px 4px rgba(0, 0, 0, 0.15)',
    '0px 4px 4px 0px rgba(0, 0, 0, 0.3), 0px 8px 12px 6px rgba(0, 0, 0, 0.15)',
    '0px 6px 10px 0px rgba(139, 69, 19, 0.2), 0px 1px 18px 0px rgba(139, 69, 19, 0.12)',
    '0px 8px 10px 1px rgba(139, 69, 19, 0.14), 0px 3px 14px 2px rgba(139, 69, 19, 0.12)',
    '0px 8px 10px 1px rgba(139, 69, 19, 0.14), 0px 3px 14px 2px rgba(139, 69, 19, 0.12)',
    '0px 8px 10px 1px rgba(139, 69, 19, 0.14), 0px 3px 14px 2px rgba(139, 69, 19, 0.12)',
    '0px 8px 10px 1px rgba(139, 69, 19, 0.14), 0px 3px 14px 2px rgba(139, 69, 19, 0.12)',
    '0px 8px 10px 1px rgba(139, 69, 19, 0.14), 0px 3px 14px 2px rgba(139, 69, 19, 0.12)',
    '0px 8px 10px 1px rgba(139, 69, 19, 0.14), 0px 3px 14px 2px rgba(139, 69, 19, 0.12)',
    '0px 8px 10px 1px rgba(139, 69, 19, 0.14), 0px 3px 14px 2px rgba(139, 69, 19, 0.12)',
    '0px 8px 10px 1px rgba(139, 69, 19, 0.14), 0px 3px 14px 2px rgba(139, 69, 19, 0.12)',
    '0px 8px 10px 1px rgba(139, 69, 19, 0.14), 0px 3px 14px 2px rgba(139, 69, 19, 0.12)',
    '0px 8px 10px 1px rgba(139, 69, 19, 0.14), 0px 3px 14px 2px rgba(139, 69, 19, 0.12)',
    '0px 8px 10px 1px rgba(139, 69, 19, 0.14), 0px 3px 14px 2px rgba(139, 69, 19, 0.12)',
    '0px 8px 10px 1px rgba(139, 69, 19, 0.14), 0px 3px 14px 2px rgba(139, 69, 19, 0.12)',
    '0px 8px 10px 1px rgba(139, 69, 19, 0.14), 0px 3px 14px 2px rgba(139, 69, 19, 0.12)',
    '0px 8px 10px 1px rgba(139, 69, 19, 0.14), 0px 3px 14px 2px rgba(139, 69, 19, 0.12)',
    '0px 8px 10px 1px rgba(139, 69, 19, 0.14), 0px 3px 14px 2px rgba(139, 69, 19, 0.12)',
    '0px 8px 10px 1px rgba(139, 69, 19, 0.14), 0px 3px 14px 2px rgba(139, 69, 19, 0.12)',
    '0px 8px 10px 1px rgba(139, 69, 19, 0.14), 0px 3px 14px 2px rgba(139, 69, 19, 0.12)',
    '0px 8px 10px 1px rgba(139, 69, 19, 0.14), 0px 3px 14px 2px rgba(139, 69, 19, 0.12)',
  ],

  // MD3 Component customizations
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 20, // MD3 pill shape for buttons
          textTransform: 'none',
          fontWeight: 600,
          padding: '10px 24px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 2px 6px 2px rgba(0, 0, 0, 0.15)',
          },
        },
        outlined: {
          borderWidth: '1px',
          '&:hover': {
            borderWidth: '1px',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16, // MD3 medium shape
          boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15)',
          transition: 'box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: '0px 2px 3px 0px rgba(0, 0, 0, 0.3), 0px 6px 10px 4px rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
        elevation1: {
          boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15)',
        },
        elevation2: {
          boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 2px 6px 2px rgba(0, 0, 0, 0.15)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
        },
      },
    },
  },
});

// Type augmentation for custom palette properties
declare module '@mui/material/styles' {
  interface Palette {
    surface: {
      main: string;
      variant: string;
    };
    tertiary: Palette['primary'];
  }
  interface PaletteOptions {
    surface?: {
      main: string;
      variant: string;
    };
    tertiary?: PaletteOptions['primary'];
  }
  interface TypographyVariants {
    displayLarge: React.CSSProperties;
    displayMedium: React.CSSProperties;
    displaySmall: React.CSSProperties;
  }
  interface TypographyVariantsOptions {
    displayLarge?: React.CSSProperties;
    displayMedium?: React.CSSProperties;
    displaySmall?: React.CSSProperties;
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    displayLarge: true;
    displayMedium: true;
    displaySmall: true;
  }
}

export default md3Theme;
