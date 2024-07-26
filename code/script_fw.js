/*
 * Author: DM1AR
 * Date: 2024-07-24
 * License: MIT License
 */

// Morse code dictionary using ITU standard
const MORSE_CODE = {
  'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.', 
  'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..', 
  'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.', 
  'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-', 
  'Y': '-.--', 'Z': '--..', 
  '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....', 
  '6': '-....', '7': '--...', '8': '---..', '9': '----.', '0': '-----', 
  '.': '.-.-.-', ',': '--..--', '?': '..--..', '\'': '.----.', '!': '-.-.--', 
  '/': '-..-.', '(': '-.--.', ')': '-.--.-', '&': '.-...', ':': '---...', 
  ';': '-.-.-.', '=': '-...-', '+': '.-.-.', '-': '-....-', '_': '..--.-', 
  '"': '.-..-.', '$': '...-..-', '@': '.--.-.', ' ': ' '
};

// Main class for Morse code player
class MorseCodePlayer {
  constructor() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.isPlaying = false;
    this.init();
  }

  // Initialize event listeners
  init() {
    document.getElementById('play-button').addEventListener('click', () => this.play());
    document.getElementById('stop-button').addEventListener('click', () => this.stop());
    document.getElementById('frequency-slider').addEventListener('input', (event) => this.updateFrequency(event));
    document.getElementById('speed-slider').addEventListener('input', (event) => this.updateSpeed(event));
    document.getElementById('farnsworth-slider').addEventListener('input', (event) => this.updateFarnsworth(event));
    document.getElementById('file-drop').addEventListener('dragover', (event) => this.handleDragOver(event));
    document.getElementById('file-drop').addEventListener('drop', (event) => this.handleFileDrop(event));
  }

  // Handle drag over event
  handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }

  // Handle file drop event
  handleFileDrop(event) {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (e) => {
        document.getElementById('ascii-input').value = e.target.result;
      };
      reader.readAsText(file);
    } else {
      alert('Bitte eine gültige Textdatei ziehen.');
    }
  }

  // Convert ASCII text to Morse code
  textToMorse(text) {
    return text.toUpperCase().split('').map(char => MORSE_CODE[char] || '').join(' ');
  }

  // Play Morse code audio
  async play() {
    if (this.isPlaying) return;
    this.isPlaying = true;

    const text = document.getElementById('ascii-input').value;
    const morse = this.textToMorse(text);
    const frequency = parseInt(document.getElementById('frequency-slider').value);
    const wpm = parseInt(document.getElementById('speed-slider').value);
    const farnsworthWpm = parseInt(document.getElementById('farnsworth-slider').value);
    const dotDuration = 1200 / wpm;
    const farnsworthDuration = 1200 / farnsworthWpm;

    for (let char of morse) {
      if (!this.isPlaying) break;
      if (char === '.') {
        await this.playTone(frequency, dotDuration);
      } else if (char === '-') {
        await this.playTone(frequency, 3 * dotDuration);
      } else if (char === ' ') {
        await this.sleep(farnsworthDuration);
      }
      await this.sleep(dotDuration);
    }

    this.isPlaying = false;
  }

  // Stop Morse code playback
  stop() {
    this.isPlaying = false;
  }

  // Play a tone for the given duration
  playTone(frequency, duration) {
    return new Promise((resolve) => {
      const oscillator = this.audioContext.createOscillator();
      oscillator.frequency.value = frequency;
      oscillator.connect(this.audioContext.destination);
      oscillator.start();

      setTimeout(() => {
        oscillator.stop();
        resolve();
      }, duration);
    });
  }

  // Sleep for the given duration
  sleep(duration) {
    return new Promise(resolve => setTimeout(resolve, duration));
  }

  // Update frequency display
  updateFrequency(event) {
    document.getElementById('frequency-value').innerText = event.target.value;
  }

  // Update speed display
  updateSpeed(event) {
    document.getElementById('speed-value').innerText = event.target.value;
  }

  // Update Farnsworth speed display
  updateFarnsworth(event) {
    document.getElementById('farnsworth-value').innerText = event.target.value;
  }
}

// Instantiate MorseCodePlayer on page load
document.addEventListener('DOMContentLoaded', () => new MorseCodePlayer());
