import { createNavigationContainerRef, NavigationContainerRef } from '@react-navigation/native';
import { HomeStackParamList } from '../app/navigator';

// Typed on HomeStackParamList so navigate('RecetteDetail', ...) is valid
// from any navigator depth.
export const navigationRef =
  createNavigationContainerRef<HomeStackParamList>() as NavigationContainerRef<HomeStackParamList>;
