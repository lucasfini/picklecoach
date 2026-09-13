import { ImageSourcePropType } from 'react-native';
import { PracticeType } from '@/src/domain/practice';

export const practiceImages: Record<PracticeType, ImageSourcePropType> = {
  serve: require('../../assets/images/practice-serve.jpg'),
  dink: require('../../assets/images/practice-dink.jpg'),
  drive: require('../../assets/images/practice-drive.jpg'),
};

export const homeHeroImage: ImageSourcePropType = require('../../assets/images/home-hero.jpg');
