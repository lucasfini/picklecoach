import Ionicons from '@expo/vector-icons/Ionicons';
import { ComponentProps } from 'react';
import { ColorValue } from 'react-native';

export type AppIconName = ComponentProps<typeof Ionicons>['name'];

type AppIconProps = {
  color: ColorValue;
  name: AppIconName;
  size?: number;
};

export function AppIcon({ color, name, size = 22 }: AppIconProps) {
  return (
    <Ionicons
      accessibilityElementsHidden
      accessible={false}
      color={color}
      importantForAccessibility="no"
      name={name}
      size={size}
    />
  );
}
