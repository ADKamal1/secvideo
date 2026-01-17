import React, { useState, useEffect, useMemo } from 'react';
import { clsx } from 'clsx';

interface WatermarkOverlayProps {
  userId: string;
  userEmail: string;
  sessionId: string;
  enabled?: boolean;
}

type Position = { x: number; y: number };

const POSITIONS: Position[] = [
  { x: 15, y: 15 },   // Top left
  { x: 85, y: 15 },   // Top right
  { x: 15, y: 85 },   // Bottom left
  { x: 85, y: 85 },   // Bottom right
  { x: 50, y: 50 },   // Center
  { x: 50, y: 15 },   // Top center
  { x: 50, y: 85 },   // Bottom center
  { x: 15, y: 50 },   // Left center
  { x: 85, y: 50 },   // Right center
];

export const WatermarkOverlay: React.FC<WatermarkOverlayProps> = ({
  userId,
  userEmail,
  sessionId,
  enabled = true,
}) => {
  const [position, setPosition] = useState<Position>(POSITIONS[0]);
  const [timestamp, setTimestamp] = useState(new Date().toISOString());

  // Change position every 30 seconds
  useEffect(() => {
    if (!enabled) return;

    const updatePosition = () => {
      const randomIndex = Math.floor(Math.random() * POSITIONS.length);
      setPosition(POSITIONS[randomIndex]);
      setTimestamp(new Date().toISOString());
    };

    updatePosition(); // Initial position

    const interval = setInterval(updatePosition, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [enabled]);

  // Generate unique display values
  const displayValues = useMemo(() => ({
    shortId: userId.slice(0, 8),
    shortSession: sessionId.slice(0, 6),
    maskedEmail: userEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
    formattedTime: timestamp.split('T')[1]?.split('.')[0] || '',
    formattedDate: timestamp.split('T')[0] || '',
  }), [userId, sessionId, userEmail, timestamp]);

  if (!enabled) return null;

  return (
    <>
      {/* Primary watermark - moves around */}
      <div
        className={clsx(
          'absolute pointer-events-none select-none z-40',
          'transition-all duration-1000 ease-in-out'
        )}
        style={{
          left: `${position.x}%`,
          top: `${position.y}%`,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div
          className="watermark-text text-center"
          style={{
            opacity: 0.35,
            fontSize: '11px',
            lineHeight: '1.4',
            textShadow: '0 1px 2px rgba(0,0,0,0.8)',
          }}
        >
          <div>{displayValues.maskedEmail}</div>
          <div>ID: {displayValues.shortId}</div>
          <div>S: {displayValues.shortSession}</div>
          <div>{displayValues.formattedTime}</div>
        </div>
      </div>

      {/* Secondary watermark - diagonal pattern for extra security */}
      <div className="absolute inset-0 pointer-events-none select-none z-30 overflow-hidden">
        {/* Diagonal watermarks across the video */}
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute whitespace-nowrap"
            style={{
              left: `${-20 + i * 35}%`,
              top: `${10 + i * 20}%`,
              transform: 'rotate(-25deg)',
              opacity: 0.08,
              fontSize: '14px',
              color: 'white',
              letterSpacing: '2px',
              userSelect: 'none',
            }}
          >
            {displayValues.maskedEmail} • {displayValues.shortId} • {displayValues.formattedDate}
          </div>
        ))}
      </div>

      {/* Corner indicators - subtle but trackable */}
      <div className="absolute inset-0 pointer-events-none select-none z-20">
        {/* Top-left corner */}
        <div
          className="absolute top-2 left-2"
          style={{
            width: '30px',
            height: '30px',
            borderTop: '2px solid rgba(255,255,255,0.1)',
            borderLeft: '2px solid rgba(255,255,255,0.1)',
          }}
        />
        {/* Top-right corner */}
        <div
          className="absolute top-2 right-2"
          style={{
            width: '30px',
            height: '30px',
            borderTop: '2px solid rgba(255,255,255,0.1)',
            borderRight: '2px solid rgba(255,255,255,0.1)',
          }}
        />
        {/* Bottom-left corner */}
        <div
          className="absolute bottom-2 left-2"
          style={{
            width: '30px',
            height: '30px',
            borderBottom: '2px solid rgba(255,255,255,0.1)',
            borderLeft: '2px solid rgba(255,255,255,0.1)',
          }}
        />
        {/* Bottom-right corner */}
        <div
          className="absolute bottom-2 right-2"
          style={{
            width: '30px',
            height: '30px',
            borderBottom: '2px solid rgba(255,255,255,0.1)',
            borderRight: '2px solid rgba(255,255,255,0.1)',
          }}
        />
      </div>

      {/* Invisible forensic watermark - embedded user ID */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Ctext x='10' y='50' fill='white' fill-opacity='0.01' font-size='8'%3E${displayValues.shortId}%3C/text%3E%3C/svg%3E")`,
        }}
      />
    </>
  );
};

