import React, { useState, useRef } from 'react';
import axios from 'axios';

interface TrimData {
  startTime: number;
  endTime: number;
  duration: number;
}

interface VideoUploaderProps {
  onFileSelected: (file: File) => void;
  onConversionComplete: (result: { fileId: string; downloadUrl: string }) => void;
  onConversionStart: () => void;
  isConverting: boolean;
  selectedFile: File | null;
  trimData: TrimData | null;
}

const VideoUploader: React.FC<VideoUploaderProps> = ({
  onFileSelected,
  onConversionComplete,
  onConversionStart,
  isConverting,
  selectedFile,
  trimData
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/quicktime', 'video/x-msvideo', 'video/webm'];

    if (!allowedTypes.includes(file.type)) {
      setError('Please select a valid video file (MP4, AVI, MOV, WebM)');
      return;
    }

    if (file.size > 100 * 1024 * 1024) { // 100MB limit
      setError('File size must be less than 100MB');
      return;
    }

    onFileSelected(file);
    setError('');
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleConvert = async () => {
    if (!selectedFile) return;

    onConversionStart();
    setError('');

    const formData = new FormData();
    formData.append('video', selectedFile);

    // Add trim data if available
    if (trimData) {
      formData.append('startTime', trimData.startTime.toString());
      formData.append('endTime', trimData.endTime.toString());
    }

    try {
      const response = await axios.post('http://localhost:5000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        const downloadUrl = `http://localhost:5000/download/${response.data.file_id}`;
        onConversionComplete({
          fileId: response.data.file_id,
          downloadUrl
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Conversion failed. Please try again.');
      onConversionStart(); // Reset converting state
    }
  };

  const handleTrimOnly = async () => {
    if (!selectedFile || !trimData) return;

    onConversionStart();
    setError('');

    const formData = new FormData();
    formData.append('video', selectedFile);
    formData.append('startTime', trimData.startTime.toString());
    formData.append('endTime', trimData.endTime.toString());

    try {
      const response = await axios.post('http://localhost:5000/trim', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        const downloadUrl = `http://localhost:5000/download/${response.data.file_id}`;
        onConversionComplete({
          fileId: response.data.file_id,
          downloadUrl
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Trimming failed. Please try again.');
      onConversionStart(); // Reset converting state
    }
  };

  return (
    <div className="space-y-6">
      {/* File Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive
          ? 'border-blue-400 bg-blue-50'
          : 'border-gray-300 hover:border-gray-400'
          }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="space-y-4">
          <div className="text-6xl text-gray-400">📹</div>

          {selectedFile ? (
            <div>
              <p className="text-lg font-medium text-gray-700">
                Selected: {selectedFile.name}
              </p>
              <p className="text-sm text-gray-500 mb-3">
                Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors text-sm"
              >
                Choose Different File
              </button>
            </div>
          ) : (
            <div>
              <p className="text-lg text-gray-600 mb-2">
                Drag and drop your video here, or
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Choose File
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      {selectedFile && (
        <div className="text-center space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleConvert}
              disabled={isConverting}
              className={`px-6 py-3 rounded-lg font-medium text-white transition-colors ${isConverting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600'
                }`}
            >
              {isConverting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Converting to Black & White...
                </span>
              ) : (
                'Convert to Black & White'
              )}
            </button>

            <button
              onClick={handleTrimOnly}
              disabled={isConverting || !trimData}
              className={`px-6 py-3 rounded-lg font-medium text-white transition-colors ${isConverting || !trimData
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'
                }`}
            >
              {isConverting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Trimming Video...
                </span>
              ) : (
                'Trim Only'
              )}
            </button>
          </div>

          {trimData && (
            <p className="text-sm text-gray-600">
              {trimData.startTime > 0 || trimData.endTime < trimData.duration
                ? `Will process ${Math.round(trimData.endTime - trimData.startTime)}s of ${Math.round(trimData.duration)}s total`
                : 'Processing entire video'
              }
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoUploader;