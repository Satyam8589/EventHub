"use client";
import { useRef, useEffect, useState } from "react";
import QrScanner from "qr-scanner";

export default function QRCameraScanner({
  onScan,
  onError,
  isActive = false,
  className = "",
}) {
  const videoRef = useRef(null);
  const qrScannerRef = useRef(null);
  const [hasCamera, setHasCamera] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if camera is available
    const checkCamera = async () => {
      try {
        const hasCamera = await QrScanner.hasCamera();
        setHasCamera(hasCamera);

        if (!hasCamera) {
          setError("No camera found on this device");
        }
      } catch (err) {
        console.error("Error checking camera:", err);
        setError("Failed to access camera");
      } finally {
        setIsLoading(false);
      }
    };

    checkCamera();
  }, []);

  useEffect(() => {
    if (!isActive || !hasCamera || !videoRef.current) return;

    const initScanner = async () => {
      try {
        // Create QR scanner instance
        qrScannerRef.current = new QrScanner(
          videoRef.current,
          (result) => {
            if (onScan) {
              onScan(result.data);
            }
          },
          {
            returnDetailedScanResult: true,
            highlightScanRegion: true,
            highlightCodeOutline: true,
          }
        );

        // Start scanning
        await qrScannerRef.current.start();
        setError(null);
      } catch (err) {
        console.error("Error starting QR scanner:", err);
        setError("Failed to start camera scanner");
        if (onError) {
          onError(err);
        }
      }
    };

    initScanner();

    // Cleanup function
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
        qrScannerRef.current = null;
      }
    };
  }, [isActive, hasCamera, onScan, onError]);

  if (isLoading) {
    return (
      <div
        className={`flex items-center justify-center p-8 bg-gray-800 rounded-lg ${className}`}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-300">Checking camera...</p>
        </div>
      </div>
    );
  }

  if (error || !hasCamera) {
    return (
      <div
        className={`flex items-center justify-center p-8 bg-red-500/10 border border-red-500/20 rounded-lg ${className}`}
      >
        <div className="text-center">
          <div className="text-4xl mb-4">📷</div>
          <p className="text-red-300 mb-2">{error || "Camera not available"}</p>
          <p className="text-sm text-gray-400">
            Please ensure camera permissions are granted or try manual entry
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <video
        ref={videoRef}
        className="w-full h-64 bg-black rounded-lg object-cover"
        playsInline
        muted
      />
      {isActive && (
        <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none">
          <div className="absolute top-4 left-4 w-6 h-6 border-t-4 border-l-4 border-blue-500"></div>
          <div className="absolute top-4 right-4 w-6 h-6 border-t-4 border-r-4 border-blue-500"></div>
          <div className="absolute bottom-4 left-4 w-6 h-6 border-b-4 border-l-4 border-blue-500"></div>
          <div className="absolute bottom-4 right-4 w-6 h-6 border-b-4 border-r-4 border-blue-500"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white bg-black/50 px-3 py-1 rounded-full text-sm">
              Point camera at QR code
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
