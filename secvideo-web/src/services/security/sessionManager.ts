import { io, Socket } from 'socket.io-client';
import type { SecurityEvent } from '@/types';

type SessionEventCallback = (event: string, data?: unknown) => void;

/**
 * Session Manager Service
 * Manages WebSocket connection for real-time session heartbeat and security events
 */
class SessionManager {
  private socket: Socket | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private eventCallbacks: Map<string, SessionEventCallback[]> = new Map();
  
  private readonly HEARTBEAT_INTERVAL = 5000; // 5 seconds
  private readonly RECONNECT_DELAY = 3000; // 3 seconds

  /**
   * Connect to the WebSocket server
   */
  connect(token: string): void {
    if (this.socket?.connected) {
      console.log('[SessionManager] Already connected');
      return;
    }

    const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:5000';

    this.socket = io(wsUrl, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.RECONNECT_DELAY,
    });

    this.setupEventListeners();
  }

  /**
   * Set up WebSocket event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[SessionManager] Connected');
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.emit('connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[SessionManager] Disconnected:', reason);
      this.stopHeartbeat();
      this.emit('disconnected', { reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('[SessionManager] Connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.emit('connection_failed');
      }
    });

    // Server-initiated session termination
    this.socket.on('session:killed', (data: { reason: string }) => {
      console.warn('[SessionManager] Session killed:', data.reason);
      this.handleSessionKilled(data.reason);
    });

    // Device mismatch detection
    this.socket.on('security:device_mismatch', () => {
      console.warn('[SessionManager] Device mismatch detected');
      this.emit('device_mismatch');
    });

    // Another login detected
    this.socket.on('session:another_login', () => {
      console.warn('[SessionManager] Another login detected');
      this.handleSessionKilled('Another login detected on a different device or browser');
    });

    // Heartbeat acknowledgment
    this.socket.on('heartbeat:ack', (data: { serverTime: number }) => {
      // Can be used to detect time manipulation
      const drift = Math.abs(Date.now() - data.serverTime);
      if (drift > 60000) { // More than 1 minute drift
        this.reportSecurityEvent('time_drift_detected', { drift });
      }
    });
  }

  /**
   * Start sending heartbeat signals
   */
  private startHeartbeat(): void {
    this.stopHeartbeat(); // Clear any existing interval
    
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('heartbeat', {
          timestamp: Date.now(),
          tabVisible: document.visibilityState === 'visible',
        });
      }
    }, this.HEARTBEAT_INTERVAL);
  }

  /**
   * Stop sending heartbeat signals
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Handle session termination
   */
  private handleSessionKilled(reason: string): void {
    this.disconnect();
    this.emit('session_killed', { reason });
    
    // Redirect to session blocked page
    const currentPath = window.location.pathname;
    if (!currentPath.includes('/session-blocked')) {
      window.location.href = `/session-blocked?reason=${encodeURIComponent(reason)}`;
    }
  }

  /**
   * Report a security event to the server
   */
  reportSecurityEvent(eventType: string, details: Record<string, unknown> = {}): void {
    if (!this.socket?.connected) {
      console.warn('[SessionManager] Cannot report event - not connected');
      return;
    }

    const event: SecurityEvent = {
      type: eventType,
      details,
      timestamp: Date.now(),
    };

    this.socket.emit('security:event', event);
    console.log('[SessionManager] Security event reported:', eventType);
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    this.stopHeartbeat();
    
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.reconnectAttempts = 0;
    console.log('[SessionManager] Disconnected and cleaned up');
  }

  /**
   * Check if connected to the server
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Subscribe to session events
   */
  on(event: string, callback: SessionEventCallback): void {
    const callbacks = this.eventCallbacks.get(event) || [];
    callbacks.push(callback);
    this.eventCallbacks.set(event, callbacks);
  }

  /**
   * Unsubscribe from session events
   */
  off(event: string, callback: SessionEventCallback): void {
    const callbacks = this.eventCallbacks.get(event) || [];
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
      this.eventCallbacks.set(event, callbacks);
    }
  }

  /**
   * Emit an event to registered callbacks
   */
  private emit(event: string, data?: unknown): void {
    const callbacks = this.eventCallbacks.get(event) || [];
    callbacks.forEach(callback => callback(event, data));
  }

  /**
   * Request video playback permission from server
   */
  async requestPlayback(videoId: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.socket?.connected) {
        resolve(false);
        return;
      }

      this.socket.emit('playback:request', { videoId }, (response: { allowed: boolean }) => {
        resolve(response.allowed);
      });
    });
  }

  /**
   * Report video playback progress
   */
  reportPlaybackProgress(videoId: string, position: number, duration: number): void {
    if (!this.socket?.connected) return;

    this.socket.emit('playback:progress', {
      videoId,
      position,
      duration,
      timestamp: Date.now(),
    });
  }
}

export const sessionManager = new SessionManager();

