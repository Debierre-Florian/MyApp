import { useRef, useState, useCallback } from 'react';
import { useCameraPermissions } from 'expo-camera';
import type { CameraViewRef, CameraCapturedPicture } from 'expo-camera';

export type CameraState = 'idle' | 'active' | 'captured';

export function useCamera() {
  const cameraRef = useRef<CameraViewRef | null>(null);
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

  const takePicture = useCallback(async () => {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePicture({ quality: 0.8 });
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
