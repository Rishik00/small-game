let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3) {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch (e) {
    console.log('Audio not available');
  }
}

export function playMoveSound() {
  playTone(600, 0.1, 'sine', 0.2);
}

export function playWinSound() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  
  [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
    setTimeout(() => {
      playTone(freq, 0.2, 'sine', 0.25);
    }, i * 100);
  });
}

export function playDrawSound() {
  playTone(300, 0.3, 'triangle', 0.15);
  setTimeout(() => playTone(250, 0.3, 'triangle', 0.15), 150);
}

export function playClickSound() {
  playTone(800, 0.05, 'square', 0.1);
}
