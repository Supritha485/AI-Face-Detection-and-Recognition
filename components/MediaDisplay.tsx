import React, { useRef, useEffect } from 'react';
import type { FaceDetectionResult } from '../types';

declare const faceapi: any;

interface MediaDisplayProps {
  imageUrl: string | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  imageRef: React.RefObject<HTMLImageElement>;
  detections: FaceDetectionResult[];
  isLoading: boolean;
  loadingMessage: string;
  onImageLoaded: () => void;
}

export const MediaDisplay: React.FC<MediaDisplayProps> = ({
  imageUrl,
  videoRef,
  imageRef,
  detections,
  isLoading,
  loadingMessage,
  onImageLoaded
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const media = imageUrl ? imageRef.current : videoRef.current;
    if (canvas && media) {
      const displaySize = { width: media.clientWidth, height: media.clientHeight };
      faceapi.matchDimensions(canvas, displaySize);
      
      const context = canvas.getContext('2d');
      if (!context) return;
      
      context.clearRect(0, 0, canvas.width, canvas.height);

      if (detections.length > 0) {
        const resizedDetections = detections.map(d => 
          faceapi.resizeResults(d.detection, displaySize)
        );

        resizedDetections.forEach((resizedDetection, i) => {
            const detectionData = detections[i];
            const { box } = resizedDetection.detection;
            
            const nameLabel = detectionData.match
              ? `${detectionData.match.label} (${detectionData.match.distance.toFixed(2)})`
              : 'Unknown';

            const drawBox = new faceapi.draw.DrawBox(box, { 
                label: nameLabel,
                boxColor: '#06b6d4' // cyan-500
            });
            drawBox.draw(canvas);

            const details = [
                detectionData.expression,
                `~${detectionData.age}y, ${detectionData.gender} (${(detectionData.genderProbability * 100).toFixed(0)}%)`
            ];

            new faceapi.draw.DrawTextField(
                details,
                { x: box.bottomLeft.x, y: box.bottomLeft.y + 5 },
                {
                    textColor: 'rgba(255, 255, 255, 1)',
                    backgroundColor: 'rgba(6, 182, 212, 0.5)'
                }
            ).draw(canvas);
        });
      }
    }
  }, [detections, imageUrl, imageRef, videoRef]);

  return (
    <div className="relative w-full aspect-video bg-gray-800 rounded-lg shadow-lg overflow-hidden flex items-center justify-center">
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-20">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-400"></div>
          <p className="mt-4 text-lg font-semibold">{loadingMessage}</p>
        </div>
      )}

      {!imageUrl && !videoRef.current?.srcObject && (
         <div className="text-gray-400 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <p className="mt-2">Upload an image or start your webcam</p>
         </div>
      )}

      {imageUrl && <img ref={imageRef} src={imageUrl} className="absolute top-0 left-0 w-full h-full object-contain" alt="input" crossOrigin="anonymous" onLoad={onImageLoaded} />}
      
      <video ref={videoRef} autoPlay muted playsInline className="absolute top-0 left-0 w-full h-full object-contain" />
      
      <canvas ref={canvasRef} className="absolute top-0 left-0" />
    </div>
  );
};