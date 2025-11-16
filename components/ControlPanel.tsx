import React, { useState, useRef } from 'react';
import { UploadIcon, WebcamIcon, UserPlusIcon, CloseIcon } from './icons';
import type { LabeledFaceDescriptorData } from '../types';

interface ControlPanelProps {
  isWebcamOn: boolean;
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onWebcamToggle: () => void;
  onRegisterFace: (name: string, imageFile: File) => Promise<{ success: boolean; message: string; }>;
  registeredFaces: LabeledFaceDescriptorData[];
  modelsLoaded: boolean;
  error: string | null;
  onClearError: () => void;
}

const RegisterFaceForm: React.FC<{ onRegister: (name: string, imageFile: File) => Promise<{ success: boolean; message: string; }> }> = ({ onRegister }) => {
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !file) return;

    setIsSubmitting(true);
    setStatus(null);

    const result = await onRegister(name, file);
    
    setStatus({ message: result.message, type: result.success ? 'success' : 'error' });
    setTimeout(() => setStatus(null), 5000);

    setIsSubmitting(false);

    if (result.success) {
      setName('');
      setFile(null);
      if(fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Person's Name"
        className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
        required
      />
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        accept="image/*"
        className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-700"
        required
      />
      <button
        type="submit"
        disabled={!name || !file || isSubmitting}
        className="w-full flex justify-center items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-500 text-white font-bold py-2 px-4 rounded-md transition-colors"
      >
        <UserPlusIcon />
        {isSubmitting ? 'Registering...' : 'Add Face to Recognition'}
      </button>
       {status && (
        <div className={`p-2 rounded-md text-sm text-center ${status.type === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
          {status.message}
        </div>
      )}
    </form>
  );
};


export const ControlPanel: React.FC<ControlPanelProps> = ({
  isWebcamOn,
  onImageUpload,
  onWebcamToggle,
  onRegisterFace,
  registeredFaces,
  modelsLoaded,
  error,
  onClearError
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6 space-y-6 h-full flex flex-col">
      <h2 className="text-xl font-semibold text-cyan-400 border-b border-gray-700 pb-2">Controls</h2>
      
      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-300 p-3 rounded-md flex justify-between items-center">
          <span>{error}</span>
          <button onClick={onClearError} className="text-red-300 hover:text-white transition-colors">
            <CloseIcon />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input
          type="file"
          ref={fileInputRef}
          onChange={onImageUpload}
          accept="image/*"
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={!modelsLoaded}
          className="flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md transition-colors"
        >
          <UploadIcon />
          Upload Image
        </button>
        <button
          onClick={onWebcamToggle}
          disabled={!modelsLoaded}
          className={`flex items-center justify-center gap-2 font-bold py-2 px-4 rounded-md transition-colors ${
            isWebcamOn
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-blue-600 hover:bg-blue-700'
          } disabled:bg-gray-600 disabled:cursor-not-allowed`}
        >
          <WebcamIcon />
          {isWebcamOn ? 'Stop Webcam' : 'Start Webcam'}
        </button>
      </div>

      <div className="flex-grow">
        <h3 className="text-lg font-semibold text-cyan-400 border-b border-gray-700 pb-2 mb-4">Face Recognition</h3>
        <div className="space-y-4">
          <RegisterFaceForm onRegister={onRegisterFace} />
          <div>
            <h4 className="font-semibold mb-2">Registered Faces:</h4>
            {registeredFaces.length > 0 ? (
              <ul className="space-y-2 max-h-48 overflow-y-auto bg-gray-700/50 p-3 rounded-md">
                {registeredFaces.map((face, index) => (
                  <li key={index} className="bg-gray-900/50 p-2 rounded-md text-gray-300 flex items-center gap-3">
                    <img src={face.imageSrc} alt={face.name} className="w-10 h-10 rounded-full object-cover border-2 border-cyan-500" />
                    <span className="font-medium">{face.name}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 italic text-sm">No faces registered yet. Add one above to enable recognition.</p>
            )}
          </div>
        </div>
      </div>
      
      {!modelsLoaded && <p className="text-center text-yellow-400 text-sm animate-pulse">Initializing AI models, please wait...</p>}
    </div>
  );
};
