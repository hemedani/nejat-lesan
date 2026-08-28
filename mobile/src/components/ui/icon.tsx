import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { type IconFamily, type IconName, type IonName, type FeName, type MdName } from '@/constants/icon-map';

export type IconProps = {
  family?: IconFamily;
  name: IconName;
  size?: number;
  color?: string;
};

export function Icon({ family = 'ion', name, size = 22, color }: IconProps) {
  if (family === 'md') {
    return <MaterialCommunityIcons color={color} name={name as MdName} size={size} />;
  }
  if (family === 'feather') {
    return <Feather color={color} name={name as FeName} size={size} />;
  }
  return <Ionicons color={color} name={name as IonName} size={size} />;
}
