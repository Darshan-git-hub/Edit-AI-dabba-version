import React from 'react';

interface VideoPlayerProps {
  videoUrl: string;
  fileId: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, fileId }) => {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = videoUrl;
    link.download = `converted_video_${fileId}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Video Player */}
      <div className="bg-black rounded-lg overflow-hidden">
        <video
          controls
          className="w-full max-h-96 object-contain"
          preload="metadata"
        >
          <source src={videoUrl} type="video/mp4" />
          <source src={videoUrl} type="video/webm" />
          <source src={videoUrl} type="video/quicktime" />
          Your browser does not support the video tag.
        </video>
      </div>

      {/* Download Button */}
      <div className="flex justify-center">
        <button
          onClick={handleDownload}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Download Black & White Video</span>
        </button>
      </div>

      {/* Info */}
      <div className="text-center text-sm text-gray-500">
        <p>Your converted video is ready! You can preview it above or download it to your device.</p>
      </div>
    </div>
  );
};

export default VideoPlayer;