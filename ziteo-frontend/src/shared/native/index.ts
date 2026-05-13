import { Capacitor } from '@capacitor/core';

export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform(); // 'ios' | 'android' | 'web'

// Geolocation — used by RepartidorApp RadarScreen
export { Geolocation } from '@capacitor/geolocation';

// Camera — for profile photo uploads
export { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

// Preferences — key-value storage (native equivalent of localStorage)
export { Preferences } from '@capacitor/preferences';

// StatusBar — hide/show native status bar
export { StatusBar, Style as StatusBarStyle } from '@capacitor/status-bar';
