
import type { LabeledFaceDescriptorData, FaceDetectionResult } from '../types';

// This is to inform TypeScript about the face-api.js library loaded from the CDN
declare const faceapi: any;

const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';

export async function loadModels() {
  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
    faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL)
  ]);
}

export async function getFullFaceDescription(
  input: HTMLImageElement | HTMLVideoElement,
  faceMatcher: any | null
): Promise<FaceDetectionResult[] | null> {
  const detections = await faceapi
    .detectAllFaces(input)
    .withFaceLandmarks()
    .withFaceDescriptors()
    .withFaceExpressions()
    .withAgeAndGender();

  if (!detections.length) {
    return null;
  }

  return detections.map((fd: any) => {
    // find best expression
    const expressions = fd.expressions;
    const bestExpression = Object.keys(expressions).reduce((a, b) => (expressions[a] > expressions[b] ? a : b));

    let match = null;
    if (faceMatcher) {
      const bestMatch = faceMatcher.findBestMatch(fd.descriptor);
      // a distance of < 0.4 is a good match
      if (bestMatch.distance < 0.4) {
        match = { label: bestMatch.label, distance: bestMatch.distance };
      }
    }

    return {
      detection: fd,
      expression: bestExpression,
      age: Math.round(fd.age),
      gender: fd.gender,
      genderProbability: fd.genderProbability,
      match: match
    };
  });
}

export function createFaceMatcher(labeledDescriptors: LabeledFaceDescriptorData[]): any {
  const labeledFaceDescriptors = labeledDescriptors.map(
    ({ name, descriptors }) =>
      new faceapi.LabeledFaceDescriptors(
        name,
        descriptors.map(d => new Float32Array(d))
      )
  );
  return new faceapi.FaceMatcher(labeledFaceDescriptors);
}
