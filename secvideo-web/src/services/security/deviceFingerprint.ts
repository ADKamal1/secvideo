import FingerprintJS from '@fingerprintjs/fingerprintjs';
import type { DeviceInfo } from '@/types';

/**
 * Device Fingerprinting Service
 * Creates a unique identifier for the user's device to enforce single-device policy
 */
class DeviceFingerprintService {
  private fpPromise: Promise<ReturnType<typeof FingerprintJS.load>> | null = null;
  private cachedFingerprint: DeviceInfo | null = null;
  private cachedHash: string | null = null;

  /**
   * Initialize the fingerprint library
   */
  async initialize(): Promise<void> {
    if (!this.fpPromise) {
      this.fpPromise = FingerprintJS.load();
    }
  }

  /**
   * Get detailed device fingerprint information
   */
  async getFingerprint(): Promise<DeviceInfo> {
    if (this.cachedFingerprint) {
      return this.cachedFingerprint;
    }

    await this.initialize();
    
    const fp = await this.fpPromise!;
    const result = await fp.get();

    // Collect additional browser/device info
    const deviceInfo: DeviceInfo = {
      visitorId: result.visitorId,
      components: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        colorDepth: screen.colorDepth,
        screenResolution: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        platform: navigator.platform,
        hardwareConcurrency: navigator.hardwareConcurrency || 0,
        deviceMemory: (navigator as Navigator & { deviceMemory?: number }).deviceMemory,
      },
    };

    this.cachedFingerprint = deviceInfo;
    return deviceInfo;
  }

  /**
   * Generate a consistent hash from the device fingerprint
   * This hash is sent to the server for device verification
   */
  async getDeviceHash(): Promise<string> {
    if (this.cachedHash) {
      return this.cachedHash;
    }

    const info = await this.getFingerprint();
    
    // Create a stable string from device info
    const stableData = {
      visitorId: info.visitorId,
      platform: info.components.platform,
      hardwareConcurrency: info.components.hardwareConcurrency,
      colorDepth: info.components.colorDepth,
      timezone: info.components.timezone,
    };

    const dataStr = JSON.stringify(stableData);
    const encoder = new TextEncoder();
    const data = encoder.encode(dataStr);
    
    // Generate SHA-256 hash
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    this.cachedHash = hash;
    return hash;
  }

  /**
   * Clear cached fingerprint data
   */
  clearCache(): void {
    this.cachedFingerprint = null;
    this.cachedHash = null;
  }

  /**
   * Check if the device fingerprint matches a given hash
   */
  async verifyDeviceHash(expectedHash: string): Promise<boolean> {
    const currentHash = await this.getDeviceHash();
    return currentHash === expectedHash;
  }

  /**
   * Get a summary of device info for display purposes
   */
  async getDeviceSummary(): Promise<string> {
    const info = await this.getFingerprint();
    const ua = info.components.userAgent;
    
    // Parse browser and OS from user agent
    let browser = 'Unknown Browser';
    let os = 'Unknown OS';

    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';

    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iOS')) os = 'iOS';

    return `${browser} on ${os}`;
  }
}

export const deviceFingerprintService = new DeviceFingerprintService();

