"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";

export default function QRScanner() {
  const [qrData, setQrData] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  const handleScan = async () => {
    if (!qrData.trim()) {
      toast.error("Please enter QR code data");
      return;
    }

    setIsScanning(true);
    setScanResult(null);

    try {
      const response = await fetch("/api/qr-scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ qrData: qrData.trim() }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        setScanResult({
          type: "success",
          ...result.data,
          message: result.message,
        });
      } else {
        toast.error(result.message);
        setScanResult({
          type: "error",
          message: result.message,
          error: result.error,
          scannedAt: result.scannedAt,
        });
      }
    } catch (error) {
      console.error("Scan error:", error);
      toast.error("Failed to process QR scan");
      setScanResult({
        type: "error",
        message: "Failed to process QR scan",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!qrData.trim()) {
      toast.error("Please enter a booking ID");
      return;
    }

    // Extract booking ID from QR data
    let bookingId = qrData.trim();
    if (bookingId.includes("_DAY_")) {
      bookingId = bookingId.split("_DAY_")[0];
    }

    try {
      const response = await fetch(`/api/qr-scan?bookingId=${bookingId}`);
      const result = await response.json();

      if (response.ok) {
        setScanResult({
          type: "status",
          ...result,
        });
      } else {
        toast.error(result.error || "Failed to fetch status");
      }
    } catch (error) {
      console.error("Status check error:", error);
      toast.error("Failed to check status");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            QR Code Scanner
          </h1>
          <p className="text-slate-300">Scan event tickets to verify entry</p>
        </div>

        {/* Scanner Interface */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                QR Code Data or Booking ID
              </label>
              <input
                type="text"
                value={qrData}
                onChange={(e) => setQrData(e.target.value)}
                placeholder="Enter QR data or booking ID..."
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleScan}
                disabled={isScanning}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isScanning ? "Scanning..." : "Scan QR Code"}
              </button>

              <button
                onClick={handleCheckStatus}
                className="flex-1 bg-gradient-to-r from-slate-600 to-slate-700 text-white px-6 py-3 rounded-lg font-medium hover:from-slate-700 hover:to-slate-800 transition-all"
              >
                Check Status
              </button>
            </div>
          </div>
        </div>

        {/* Scan Result */}
        {scanResult && (
          <div
            className={`rounded-2xl border p-6 ${
              scanResult.type === "success"
                ? "bg-green-500/10 border-green-500/30 text-green-100"
                : scanResult.type === "error"
                ? "bg-red-500/10 border-red-500/30 text-red-100"
                : "bg-blue-500/10 border-blue-500/30 text-blue-100"
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    scanResult.type === "success"
                      ? "bg-green-400"
                      : scanResult.type === "error"
                      ? "bg-red-400"
                      : "bg-blue-400"
                  }`}
                />
                <h3 className="font-semibold text-lg">
                  {scanResult.type === "success"
                    ? "Entry Confirmed"
                    : scanResult.type === "error"
                    ? "Entry Denied"
                    : "Status Information"}
                </h3>
              </div>

              <p className="text-sm opacity-90">{scanResult.message}</p>

              {/* Special handling for date validation errors */}
              {scanResult.error === "FUTURE_DAY_QR" && scanResult.validDate && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mt-3">
                  <div className="flex items-center gap-2 text-yellow-100 text-sm">
                    <div className="w-4 h-4 rounded-full bg-yellow-400 flex-shrink-0"></div>
                    <span className="font-medium">Date Restriction</span>
                  </div>
                  <p className="text-yellow-200 text-xs mt-1">
                    This QR code will be valid on:{" "}
                    {new Date(scanResult.validDate).toLocaleDateString()}
                  </p>
                  {scanResult.currentEventDay && (
                    <p className="text-yellow-200 text-xs">
                      Current event day: {scanResult.currentEventDay}
                    </p>
                  )}
                </div>
              )}

              {(scanResult.error === "EVENT_NOT_STARTED" ||
                scanResult.error === "EVENT_ENDED") && (
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 mt-3">
                  <div className="flex items-center gap-2 text-orange-100 text-sm">
                    <div className="w-4 h-4 rounded-full bg-orange-400 flex-shrink-0"></div>
                    <span className="font-medium">Event Timing Issue</span>
                  </div>
                  <p className="text-orange-200 text-xs mt-1">
                    {scanResult.error === "EVENT_NOT_STARTED"
                      ? "Event hasn't started yet"
                      : "Event has ended"}
                  </p>
                </div>
              )}

              {scanResult.bookingId && (
                <div className="grid grid-cols-2 gap-4 text-sm bg-white/5 rounded-lg p-3">
                  <div>
                    <span className="text-slate-400">Booking ID:</span>
                    <br />
                    <span className="font-mono">{scanResult.bookingId}</span>
                  </div>

                  {scanResult.eventTitle && (
                    <div>
                      <span className="text-slate-400">Event:</span>
                      <br />
                      <span>{scanResult.eventTitle}</span>
                    </div>
                  )}

                  {scanResult.dayNumber && (
                    <div>
                      <span className="text-slate-400">Day:</span>
                      <br />
                      <span>
                        {scanResult.dayNumber} of {scanResult.totalDays}
                      </span>
                    </div>
                  )}

                  {scanResult.scannedAt && (
                    <div>
                      <span className="text-slate-400">Scanned At:</span>
                      <br />
                      <span>
                        {new Date(scanResult.scannedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                      </span>
                    </div>
                  )}

                  {scanResult.totalScannedDays !== undefined && (
                    <div>
                      <span className="text-slate-400">Progress:</span>
                      <br />
                      <span>
                        {scanResult.totalScannedDays} / {scanResult.totalDays}{" "}
                        days used
                      </span>
                    </div>
                  )}

                  {scanResult.remainingDays !== undefined &&
                    scanResult.remainingDays > 0 && (
                      <div>
                        <span className="text-slate-400">Remaining:</span>
                        <br />
                        <span>{scanResult.remainingDays} days left</span>
                      </div>
                    )}
                </div>
              )}

              {/* Show scanned QRs for status check */}
              {scanResult.type === "status" &&
                scanResult.scannedQRs &&
                scanResult.scannedQRs.length > 0 && (
                  <div className="bg-white/5 rounded-lg p-3">
                    <h4 className="font-medium mb-2">Scanned Days:</h4>
                    <div className="space-y-1 text-sm">
                      {scanResult.scannedQRs.map((scan, index) => (
                        <div key={index} className="flex justify-between">
                          <span>Day {scan.dayNumber}</span>
                          <span className="text-slate-400">
                            {new Date(scan.scannedAt).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6 mt-6">
          <h3 className="text-white font-semibold mb-3">How to use:</h3>
          <ul className="text-slate-300 space-y-2 text-sm">
            <li>• Enter the QR code data from a ticket</li>
            <li>• For single-day events: use the booking ID</li>
            <li>
              • For multi-day events: use the day-specific QR data (e.g.,
              "booking123_DAY_1_OF_3")
            </li>
            <li>• Click "Scan QR Code" to mark entry as used</li>
            <li>• Click "Check Status" to see which days have been scanned</li>
            <li>• Once scanned, a QR code cannot be used again</li>
            <li className="text-yellow-300">
              • <strong>Date Validation:</strong> Day-specific QR codes only
              work on their designated day
            </li>
            <li className="text-yellow-300">
              • <strong>Example:</strong> Day 2 QR code cannot be scanned on Day
              1 of the event
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
