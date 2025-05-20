import React from "react";

const LoadingAnimation: React.FC = () => (
  <div className="notion-loading-container">
    <div className="notion-loading-dot" />
    <div className="notion-loading-dot" />
    <div className="notion-loading-dot" />
    <style>{`
      .notion-loading-container {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
        min-height: 120px;
        gap: 8px;
      }
      .notion-loading-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #b3b8c2;
        animation: notion-bounce 1.2s infinite ease-in-out both;
      }
      .notion-loading-dot:nth-child(2) {
        animation-delay: 0.2s;
      }
      .notion-loading-dot:nth-child(3) {
        animation-delay: 0.4s;
      }
      @keyframes notion-bounce {
        0%, 80%, 100% {
          transform: scale(0.7);
          opacity: 0.5;
        }
        40% {
          transform: scale(1.2);
          opacity: 1;
        }
      }
    `}</style>
  </div>
);

export default LoadingAnimation; 