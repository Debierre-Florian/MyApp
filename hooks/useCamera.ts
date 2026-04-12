import { useRef, useState, useCallback, useEffect } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import type { CameraCapturedPicture } from 'expo-camera';

export type CameraState = 'idle' | 'active' | 'captured';

export function useCamera() {
  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraState, setCameraState] = useState<CameraState>('idle');
  const [capturedPhoto, setCapturedPhoto] = useState<CameraCapturedPicture | null>(null);

  const openCamera = useCallback(async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) return;
    }
    setCameraState('active');
  }, [permission, requestPermission]);

  const closeCamera = useCallback(() => {
    setCameraState('idle');
    setCapturedPhoto(null);
  }, []);

  useEffect(() => {
    console.log('[useCamera] capturedPhoto changed:', capturedPhoto?.uri ?? null);
  }, [capturedPhoto]);

  const takePicture = useCallback(async () => {
    console.log('[useCamera] takePicture called, cameraRef.current:', !!cameraRef.current);
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
    console.log('[useCamera] photo result:', photo?.uri ?? 'null');
    if (photo) {
      setCapturedPhoto(photo);
      setCameraState('captured');
    }
  }, []);

  const retake = useCallback(() => {
    setCapturedPhoto(null);
    setCameraState('active');
  }, []);

  return {
    cameraRef,
    permission,
    cameraState,
    capturedPhoto,
    openCamera,
    closeCamera,
    takePicture,
    retake,
  };
}
