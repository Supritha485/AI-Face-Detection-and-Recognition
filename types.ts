// This is to inform TypeScript about the face-api.js library loaded from the CDN
declare const faceapi: any;

export interface LabeledFaceDescriptorData {
  name: string;
  descriptors: number[][];
  imageSrc: string;
}

export interface FaceDetectionResult {
  detection: any; // faceapi.WithFaceDescriptor<faceapi.WithFaceLandmarks<{ detection: faceapi.Detection; }, faceapi.FaceLandmarks68>>
  expression: string;
  age: number;
  gender: 'male' | 'female';
  genderProbability: number;
  match: {
    label: string;
    distance: number;
  } | null;
}
