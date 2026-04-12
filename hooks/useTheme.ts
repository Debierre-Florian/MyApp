import { useColorScheme } from 'react-native';

interface Theme {
  background: string;
  text: string;
  primary: string;
  isDark: boolean;
}

const lightTheme: Theme = {
  background: '#ffffff',
  text: '#000000',
  primary: '#007AFF',
  isDark: false,
};

const darkTheme: Theme = {
  background: '#000000',
  text: '#ffffff',
  primary: '#0A84FF',
  isDark: true,
};

export function useTheme(): Theme {
  const colorScheme = useColorScheme();
  return colorScheme === 'dark' ? darkTheme : lightTheme;
}
