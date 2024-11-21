// utils/audioManager.ts
class AudioManager {
    private audio: HTMLAudioElement | null = null;
  
    // Singleton instance
    private static instance: AudioManager;
  
    private constructor() {}
  
    // Static method to get the instance of AudioManager (Singleton pattern)
    public static getInstance(): AudioManager {
      if (!AudioManager.instance) {
        AudioManager.instance = new AudioManager();
      }
      return AudioManager.instance;
    }
  
    // Initialize audio object (only in client-side environment)
    public init(url: string): void {
      if (typeof window !== 'undefined') {
        this.audio = new Audio(url);
      } else {
        console.warn('AudioManager: Audio cannot be initialized on the server-side');
      }
    }
  
    // Play audio
    public play(): void {
      if (this.audio) {
        this.audio.play();
      } else {
        console.error('AudioManager: Audio not initialized');
      }
    }
  
    // Pause audio
    public pause(): void {
      if (this.audio) {
        this.audio.pause();
      } else {
        console.error('AudioManager: Audio not initialized');
      }
    }
  
    // Stop audio
    public stop(): void {
      if (this.audio) {
        this.audio.pause();
        this.audio.currentTime = 0;
      } else {
        console.error('AudioManager: Audio not initialized');
      }
    }
  
    // Get current time of the audio
    public getCurrentTime(): number {
      return this.audio ? this.audio.currentTime : 0;
    }
  }
  
  export default AudioManager;
  