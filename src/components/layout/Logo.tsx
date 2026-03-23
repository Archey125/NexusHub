import { Icon } from '@chakra-ui/react';
import { useThemeStore } from '../../store/themeStore';


export const Logo = () => {
  const { accentColor } = useThemeStore();

  return (
    <Icon marginX={2}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900">
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={accentColor} />
            <stop offset="100%" stopColor={accentColor} />
          </linearGradient>
        </defs>

        <path
          fill="url(#logoGradient)"
          d="
      M 0 900 
      V 0 
      H 428.8 
      L 700 488.2 
      V 0 
      H 900 
      V 350 
      H 1400 
      V 0 
      H 1600 
      V 900 
      H 1400 
      V 550 
      H 900 
      V 900 
      H 700 
      L 200 0 
      V 900 
      Z"
        />
      </svg>
    </Icon >
  );
};