import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { ControlPanel } from './components/ControlPanel';
import { MediaDisplay } from './components/MediaDisplay';
import { loadModels, getFullFaceDescription, createFaceMatcher } from './services/faceapiService';
import type { LabeledFaceDescriptorData, FaceDetectionResult } from './types';

// This is to inform TypeScript about the face-api.js library loaded from the CDN
declare const faceapi: any;

const App: React.FC = () => {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [processingMessage, setProcessingMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  
  const [detections, setDetections] = useState<FaceDetectionResult[]>([]);
  const [registeredFaces, setRegisteredFaces] = useState<LabeledFaceDescriptorData[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const intervalRef = useRef<number | null>(null);
  const isProcessing = useRef(false);

  useEffect(() => {
    const init = async () => {
      try {
        await loadModels();
        setModelsLoaded(true);
      } catch (err) {
        setError('Failed to load AI models. Please refresh the page.');
        console.error(err);
      }
    };
    init();
  }, []);

  const clearCurrentMedia = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }
    if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
        setImageUrl(null);
    }
    setDetections([]);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    clearCurrentMedia();
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
    }
  };

  const handleWebcamToggle = async () => {
    if (mediaStream) {
      clearCurrentMedia();
    } else {
      clearCurrentMedia();
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
        setMediaStream(stream);
      } catch (err) {
        setError('Could not access webcam. Please check permissions.');
        console.error(err);
      }
    }
  };

  const processMedia = useCallback(async () => {
    if (!modelsLoaded || isProcessing.current) return;
    
    const mediaElement = imageUrl ? imageRef.current : videoRef.current;
    if (!mediaElement) return;

    isProcessing.current = true;
    setProcessingMessage('Detecting faces...');

    try {
      const faceMatcher = registeredFaces.length > 0 ? createFaceMatcher(registeredFaces) : null;
      const fullDesc = await getFullFaceDescription(mediaElement, faceMatcher);
      setDetections(fullDesc || []);
    } catch (err) {
      console.error("Error processing media:", err);
      setError("An error occurred during face detection.");
    } finally {
      setProcessingMessage(null);
      isProcessing.current = false;
    }
  }, [imageUrl, modelsLoaded, registeredFaces]);

  const onImageLoaded = () => {
    processMedia();
  };

  useEffect(() => {
    if (mediaStream && videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        intervalRef.current = window.setInterval(() => {
            processMedia();
        }, 300);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [mediaStream, processMedia]);
  
  const handleRegisterFace = async (name: string, imageFile: File): Promise<{ success: boolean; message: string; }> => {
    if (!modelsLoaded) {
      const msg = "Models not loaded yet. Please wait.";
      setError(msg);
      return { success: false, message: msg };
    }
    setProcessingMessage(`Registering ${name}...`);
    try {
      const imageSrc = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(imageFile);
      });
      
      const tempImage = document.createElement('img');
      tempImage.src = imageSrc;
      await new Promise(resolve => tempImage.onload = resolve);
      
      const detections = await faceapi.detectSingleFace(tempImage).withFaceLandmarks().withFaceDescriptor();

      if (detections) {
        setRegisteredFaces(prev => [
          ...prev, 
          { name, descriptors: [Array.from(detections.descriptor)], imageSrc }
        ]);
        return { success: true, message: `${name} registered successfully!` };
      } else {
        throw new Error("No face detected in the registration image.");
      }
    } catch (err: any) {
      const message = `Failed to register face: ${err.message}`;
      return { success: false, message };
    } finally {
      setProcessingMessage(null);
    }
  };

  const handleClearError = () => {
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4 flex flex-col lg:flex-row gap-8">
        <div className="lg:w-2/3">
          <MediaDisplay
            imageUrl={imageUrl}
            videoRef={videoRef}
            imageRef={imageRef}
            detections={detections}
            isLoading={!modelsLoaded || !!processingMessage}
            loadingMessage={!modelsLoaded ? 'Warming up AI models...' : processingMessage || ''}
            onImageLoaded={onImageLoaded}
          />
        </div>
        <div className="lg:w-1/3">
          <ControlPanel
            isWebcamOn={!!mediaStream}
            onImageUpload={handleImageUpload}
            onWebcamToggle={handleWebcamToggle}
            onRegisterFace={handleRegisterFace}
            registeredFaces={registeredFaces}
            modelsLoaded={modelsLoaded}
            error={error}
            onClearError={handleClearError}
          />
        </div>
      </main>
    </div>
  );
};

export default App;
