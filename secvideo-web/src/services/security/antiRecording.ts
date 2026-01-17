type SecurityEventCallback = (event: string, details?: Record<string, unknown>) => void;

/**
 * Anti-Recording Service
 * Implements multiple layers of protection against screen recording and screenshots
 */
class AntiRecordingService {
  private isActive = false;
  private eventCallback: SecurityEventCallback | null = null;
  private devToolsCheckInterval: ReturnType<typeof setInterval> | null = null;
  private wasDevToolsOpen = false;
  private blurTimeout: ReturnType<typeof setTimeout> | null = null;

  /**
   * Start anti-recording protection
   */
  start(callback: SecurityEventCallback): void {
    if (this.isActive) return;
    
    this.isActive = true;
    this.eventCallback = callback;

    this.disableContextMenu();
    this.disableKeyboardShortcuts();
    this.detectDevTools();
    this.monitorScreenCapture();
    this.monitorVisibility();
    this.preventDragAndDrop();
    this.setupCSSProtection();
    
    console.log('[AntiRecording] Protection enabled');
  }

  /**
   * Stop anti-recording protection
   */
  stop(): void {
    this.isActive = false;
    this.eventCallback = null;

    if (this.devToolsCheckInterval) {
      clearInterval(this.devToolsCheckInterval);
      this.devToolsCheckInterval = null;
    }

    if (this.blurTimeout) {
      clearTimeout(this.blurTimeout);
      this.blurTimeout = null;
    }

    // Remove event listeners would require storing references
    // For simplicity, we'll keep them but they'll check isActive
    
    console.log('[AntiRecording] Protection disabled');
  }

  /**
   * Disable right-click context menu on video area
   */
  private disableContextMenu(): void {
    document.addEventListener('contextmenu', (e) => {
      if (!this.isActive) return;
      
      const target = e.target as HTMLElement;
      const isVideoArea = target.closest('#secure-video-container') ||
                          target.closest('.video-js') ||
                          target.tagName === 'VIDEO';
      
      if (isVideoArea) {
        e.preventDefault();
        this.reportEvent('context_menu_blocked');
      }
    });
  }

  /**
   * Block keyboard shortcuts used for DevTools, saving, printing
   */
  private disableKeyboardShortcuts(): void {
    document.addEventListener('keydown', (e) => {
      if (!this.isActive) return;

      const blockedKeys = [
        // DevTools
        { key: 'F12' },
        { key: 'I', ctrl: true, shift: true },
        { key: 'J', ctrl: true, shift: true },
        { key: 'C', ctrl: true, shift: true },
        // Save page
        { key: 's', ctrl: true },
        { key: 'S', ctrl: true },
        // Print
        { key: 'p', ctrl: true },
        { key: 'P', ctrl: true },
        // View source
        { key: 'u', ctrl: true },
        { key: 'U', ctrl: true },
        // Screenshot (Mac)
        { key: '3', ctrl: true, shift: true },
        { key: '4', ctrl: true, shift: true },
        { key: '5', ctrl: true, shift: true },
      ];

      for (const shortcut of blockedKeys) {
        const keyMatch = e.key === shortcut.key || e.key.toUpperCase() === shortcut.key;
        const ctrlMatch = !shortcut.ctrl || (e.ctrlKey || e.metaKey);
        const shiftMatch = !shortcut.shift || e.shiftKey;

        if (keyMatch && ctrlMatch && shiftMatch) {
          e.preventDefault();
          e.stopPropagation();
          this.reportEvent('keyboard_shortcut_blocked', { key: e.key });
          return;
        }
      }

      // PrintScreen detection
      if (e.key === 'PrintScreen') {
        this.handleScreenshotAttempt();
      }
    });

    // Clear clipboard on keyup for PrintScreen
    document.addEventListener('keyup', (e) => {
      if (!this.isActive) return;
      
      if (e.key === 'PrintScreen') {
        navigator.clipboard.writeText('Screenshot disabled for security').catch(() => {});
        this.reportEvent('printscreen_clipboard_cleared');
      }
    });
  }

  /**
   * Detect DevTools opening using multiple methods
   */
  private detectDevTools(): void {
    // Method 1: Window size difference
    const checkWindowSize = () => {
      if (!this.isActive) return;
      
      const threshold = 160;
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;
      
      const isOpen = widthDiff > threshold || heightDiff > threshold;
      
      if (isOpen && !this.wasDevToolsOpen) {
        this.wasDevToolsOpen = true;
        this.reportEvent('devtools_opened');
        this.blurVideoElement();
      } else if (!isOpen && this.wasDevToolsOpen) {
        this.wasDevToolsOpen = false;
        this.unblurVideoElement();
      }
    };

    this.devToolsCheckInterval = setInterval(checkWindowSize, 1000);

    // Method 2: Console detection via getter
    const element = new Image();
    let devToolsDetected = false;
    
    Object.defineProperty(element, 'id', {
      get: () => {
        if (!devToolsDetected && this.isActive) {
          devToolsDetected = true;
          this.reportEvent('devtools_console_detected');
          this.blurVideoElement();
          
          // Reset after a while
          setTimeout(() => { devToolsDetected = false; }, 10000);
        }
        return '';
      }
    });

    // This logs the element which triggers the getter when DevTools console is open
    setInterval(() => {
      if (this.isActive) {
        console.log('%c', element);
        console.clear();
      }
    }, 1000);

    // Method 3: Debugger detection
    const detectDebugger = () => {
      if (!this.isActive) return;
      
      const start = performance.now();
      // eslint-disable-next-line no-debugger
      debugger;
      const end = performance.now();
      
      // If debugger was triggered and paused, time difference will be significant
      if (end - start > 100) {
        this.reportEvent('debugger_detected');
        this.blurVideoElement();
      }
    };

    // Only check occasionally to avoid performance impact
    setInterval(detectDebugger, 5000);
  }

  /**
   * Monitor for screen capture API usage
   */
  private monitorScreenCapture(): void {
    // Override getDisplayMedia to prevent browser-based screen capture
    if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
      const originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia.bind(navigator.mediaDevices);
      
      navigator.mediaDevices.getDisplayMedia = async (constraints?: DisplayMediaStreamOptions) => {
        this.reportEvent('screen_capture_attempted');
        this.blurVideoElement();
        
        // Still allow but report it
        return originalGetDisplayMedia(constraints);
      };
    }

    // Detect if screen is being shared via Picture-in-Picture
    if ('pictureInPictureEnabled' in document) {
      document.addEventListener('enterpictureinpicture', () => {
        if (this.isActive) {
          this.reportEvent('pip_entered');
          // Exit PiP for video elements
          if (document.pictureInPictureElement) {
            document.exitPictureInPicture().catch(() => {});
          }
        }
      });
    }
  }

  /**
   * Monitor tab/window visibility changes
   */
  private monitorVisibility(): void {
    // Tab visibility
    document.addEventListener('visibilitychange', () => {
      if (!this.isActive) return;
      
      if (document.hidden) {
        this.reportEvent('tab_hidden');
        // Optionally pause video
        const video = document.querySelector('#secure-video-container video') as HTMLVideoElement;
        if (video && !video.paused) {
          // Store paused state but don't auto-pause to avoid UX issues
          this.reportEvent('tab_hidden_while_playing');
        }
      } else {
        this.reportEvent('tab_visible');
      }
    });

    // Window blur/focus
    window.addEventListener('blur', () => {
      if (this.isActive) {
        this.reportEvent('window_blur');
      }
    });

    window.addEventListener('focus', () => {
      if (this.isActive) {
        this.reportEvent('window_focus');
      }
    });
  }

  /**
   * Prevent drag and drop of video content
   */
  private preventDragAndDrop(): void {
    document.addEventListener('dragstart', (e) => {
      if (!this.isActive) return;
      
      const target = e.target as HTMLElement;
      if (target.tagName === 'VIDEO' || target.closest('#secure-video-container')) {
        e.preventDefault();
        this.reportEvent('drag_prevented');
      }
    });
  }

  /**
   * Set up CSS-based protection
   */
  private setupCSSProtection(): void {
    const style = document.createElement('style');
    style.textContent = `
      #secure-video-container {
        user-select: none !important;
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        pointer-events: auto;
      }
      
      #secure-video-container video {
        pointer-events: none;
      }
      
      #secure-video-container .video-controls {
        pointer-events: auto;
      }
      
      /* Prevent video download */
      video::-webkit-media-controls-enclosure {
        display: none !important;
      }
      
      video::-webkit-media-controls-panel {
        display: none !important;
      }
      
      /* Prevent selection in video area */
      #secure-video-container::selection {
        background: transparent;
      }
      
      #secure-video-container *::selection {
        background: transparent;
      }
    `;
    
    document.head.appendChild(style);
  }

  /**
   * Handle screenshot attempt
   */
  private handleScreenshotAttempt(): void {
    this.reportEvent('screenshot_attempt');
    this.blurVideoElement();
    
    // Clear clipboard
    navigator.clipboard.writeText('Screenshot disabled for security').catch(() => {});
  }

  /**
   * Apply blur effect to video element
   */
  blurVideoElement(): void {
    const container = document.getElementById('secure-video-container');
    if (container) {
      container.style.filter = 'blur(30px)';
      container.style.transition = 'filter 0.1s ease-out';
      
      // Clear any existing unblur timeout
      if (this.blurTimeout) {
        clearTimeout(this.blurTimeout);
      }
      
      // Auto-unblur after 3 seconds
      this.blurTimeout = setTimeout(() => {
        this.unblurVideoElement();
      }, 3000);
    }
  }

  /**
   * Remove blur effect from video element
   */
  unblurVideoElement(): void {
    const container = document.getElementById('secure-video-container');
    if (container) {
      container.style.filter = 'none';
    }
  }

  /**
   * Report security event
   */
  private reportEvent(event: string, details: Record<string, unknown> = {}): void {
    if (this.eventCallback) {
      this.eventCallback(event, {
        ...details,
        timestamp: Date.now(),
        url: window.location.href,
      });
    }
    console.log(`[AntiRecording] Event: ${event}`, details);
  }

  /**
   * Check if protection is currently active
   */
  isProtectionActive(): boolean {
    return this.isActive;
  }
}

export const antiRecordingService = new AntiRecordingService();

