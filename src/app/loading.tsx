"use client";

import React from "react";
import { ClipLoader } from "react-spinners";

interface LoadingSpinnerProps {
  size?: number;
  color?: string;
}

const LoadingSpinner = ({ size = 50, color = "#123abc" }: LoadingSpinnerProps) => {
  return (
    <div className="spinner-container flex items-center justify-center min-h-screen">
      <ClipLoader size={size} color={color} />

      {/* スタイル */}
      <style jsx>{`
        .spinner-container {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;
