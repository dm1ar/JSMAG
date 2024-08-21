/*
Autor: DM1AR
Datum: 12. August 2024
Lizenz: MIT-Lizenz
*/

class MorseCodePlayer {
    constructor() {
        this.morseCodeMap = this.createMorseCodeMap();
        this.prosigns = ['AR', 'SK', 'BT', 'KN', 'SN', 'AS', 'VE', 'HH', 'CT', 'SOS'];
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.oscillator = null;
        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.setValueAtTime(0.8, this.audioContext.currentTime); // Set initial volume
        this.isPlaying = false;
        this.isLooping = false;
        this.frequency = 750;
        this.speed = 20;
        this.farnsworthSpeed = 20;
        this.volume = 0.8;
        this.unitTime = 1200 / this.speed; // Zeit in ms für einen Punkt bei gegebener Geschwindigkeit
        this.initializeUI();
        this.updateDiagnostics();
    }

    // Initialisiert die UI-Elemente und deren Event-Handler
    initializeUI() {
        document.getElementById('playButton').addEventListener('click', () => this.playMorseCode());
        document.getElementById('stopButton').addEventListener('click', () => this.stopMorseCode());
        document.getElementById('loopButton').addEventListener('click', () => this.toggleLoop());
        document.getElementById('clearButton').addEventListener('click', () => this.clearInput());

        document.getElementById('frequencySlider').addEventListener('input', (event) => {
            this.frequency = event.target.value;
            document.getElementById('frequencyValue').innerText = `${this.frequency} Hz`;
        });

        document.getElementById('speedSlider').addEventListener('input', (event) => {
            this.speed = event.target.value;
            this.unitTime = 1200 / this.speed;
            document.getElementById('speedValue').innerText = `${this.speed} WPM`;
            this.updateDiagnostics();
        });

        document.getElementById('volumeSlider').addEventListener('input', (event) => {
            this.volume = event.target.value;
            this.gainNode.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
            document.getElementById('volumeValue').innerText = this.volume;
        });

        document.getElementById('farnsworthSlider').addEventListener('input', (event) => {
            this.farnsworthSpeed = event.target.value;
            document.getElementById('farnsworthValue').innerText = `${this.farnsworthSpeed} WPM`;
            this.updateDiagnostics();
        });

        document.getElementById('inputText').addEventListener('input', () => {
            this.updateDiagnostics();
        });

        this.initializeDropArea();
    }

    // Initialisiert das Drop-File-Event für die Drop-Area
    initializeDropArea() {
        const dropArea = document.getElementById('dropArea');
        
        dropArea.addEventListener('dragover', (event) => {
            event.preventDefault();
            dropArea.style.backgroundColor = '#e9e9e9';
        });

        dropArea.addEventListener('dragleave', () => {
            dropArea.style.backgroundColor = '#f9f9f9';
        });

        dropArea.addEventListener('drop', (event) => {
            event.preventDefault();
            dropArea.style.backgroundColor = '#f9f9f9';
            const files = event.dataTransfer.files;
            if (files.length > 0 && files[0].type === 'text/plain') {
                this.readFile(files[0]);
            } else {
                alert('Bitte laden Sie eine gültige .txt-Datei hoch.');
            }
        });
    }

    // Liest den Inhalt der hochgeladenen Datei und setzt ihn in das Eingabefeld
    readFile(file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target.result;
            document.getElementById('inputText').innerText = text;
            this.updateDiagnostics();
        };
        reader.readAsText(file);
    }

    // Erzeugt die Morsecode-Tabelle, einschließlich Prosigns
    createMorseCodeMap() {
        return {
            'A': '.-',    'B': '-...',  'C': '-.-.',  'D': '-..',   'E': '.',
            'F': '..-.',  'G': '--.',   'H': '....',  'I': '..',    'J': '.---',
            'K': '-.-',   'L': '.-..',  'M': '--',    'N': '-.',    'O': '---',
            'P': '.--.',  'Q': '--.-',  'R': '.-.',   'S': '...',   'T': '-',
            'U': '..-',   'V': '...-',  'W': '.--',   'X': '-..-',  'Y': '-.--',
            'Z': '--..',  '1': '.----', '2': '..---', '3': '...--', '4': '....-',
            '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
            '0': '-----', '.': '.-.-.-', ',': '--..--', '?': '..--..', '\'': '.----.',
            '!': '-.-.--', '/': '-..-.',  '(': '-.--.',  ')': '-.--.-', '&': '.-...',
            ':': '---...', ';': '-.-.-.', '=': '-...-',  '+': '.-.-.',  '-': '-....-',
            '_': '..--.-', '"': '.-..-.', '$': '...-..-', '@': '.--.-.', ' ': '/',
            'AR': '.-.-.', 'SK': '...-.-', 'BT': '-...-', 'KN': '-.-.', 'SN': '...-.', 
            'AS': '.-...', 'VE': '...-.', 'HH': '........', 'CT': '-.-.', 'SOS': '...---...'
        };
    }

    // Wandelt ASCII in Morsecode um
    convertToMorse(text) {
        return text.toUpperCase()
            .replace(/\s+/g, ' ') // Normalize spaces
            .split(' ')
            .map(word => word.split('')
            .map(char => this.morseCodeMap[char] || '')
            .join(' '))
            .join(' / ');
    }

    // Hebt das aktuelle Zeichen hervor
    highlightCurrentChar(index) {
        const inputText = document.getElementById('inputText');
        const text = inputText.innerText;
        const beforeChar = text.slice(0, index);
        const currentChar = text[index];
        const afterChar = text.slice(index + 1);

        inputText.innerHTML = beforeChar + `<span class="highlighted">${currentChar}</span>` + afterChar;
    }

    // Setzt das hervorgehobene Zeichen zurück
    resetHighlighting() {
        const inputText = document.getElementById('inputText');
        inputText.innerHTML = inputText.innerText; // Entfernt alle HTML-Tags
    }

    // Spielt das Morsecode-Audio ab
    async playMorseCode() {
        if (this.isPlaying) return;
        this.isPlaying = true;

        const text = document.getElementById('inputText').innerText;
        const morseCode = this.convertToMorse(text);
        
        do {
            let i = 0;
            while (i < text.length) {
                if (!this.isPlaying) break;

                this.highlightCurrentChar(i);
                let char = text[i].toUpperCase();
                let symbol = this.morseCodeMap[char] || '';
                let isProsign = false;

                if (i < text.length - 1) {
                    let nextChar = text[i + 1].toUpperCase();
                    if (this.prosigns.includes(char + nextChar)) {
                        char += nextChar;
                        symbol = this.morseCodeMap[char];
                        isProsign = true;
                        i++; // Skip the next character as it's part of the prosign
                    }
                }

                for (const tone of symbol) {
                    if (!this.isPlaying) break;

                    switch (tone) {
                        case '.':
                            await this.playTone(this.unitTime);  // Ein Punkt (1 "dit")
                            await this.pause(this.unitTime);     // Pause zwischen Signalen im gleichen Buchstaben (1 "dit")
                            break;
                        case '-':
                            await this.playTone(this.unitTime * 3); // Ein Strich (3 "dits")
                            await this.pause(this.unitTime);        // Pause zwischen Signalen im gleichen Buchstaben (1 "dit")
                            break;
                    }
                }

                if (!isProsign) {
                    await this.pause(this.unitTime * 3);  // Pause zwischen Buchstaben (3 "dits")
                } else {
                    await this.pause(this.unitTime);  // Nur 1 "dit" Pause zwischen Buchstaben in Prosigns
                }

                if (symbol === '/') {
                    const wordPause = this.calculateWordPause();
                    await this.pause(wordPause);
                }

                i++;
            }
        } while (this.isLooping && this.isPlaying);

        this.resetHighlighting();
        this.isPlaying = false;
    }

    // Berechnet die richtige Pause zwischen Wörtern unter Berücksichtigung der Farnsworth-Geschwindigkeit
    calculateWordPause() {
        const standardWordPause = this.unitTime * 7;  // Standard-Pause (7 "dits" nach normaler Geschwindigkeit)
        const farnsworthUnitTime = 1200 / this.farnsworthSpeed;
        const farnsworthWordPause = farnsworthUnitTime * 7; // Farnsworth-Pause (7 "dits" nach Farnsworth-Speed)
        return farnsworthWordPause > standardWordPause ? farnsworthWordPause : standardWordPause;
    }

    // Stoppt die Wiedergabe
    stopMorseCode() {
        this.isPlaying = false;
        this.isLooping = false;
        if (this.oscillator) {
            this.oscillator.stop();
        }
        this.resetHighlighting();
    }

    // Schaltet das Endlos-Wiedergabe
    toggleLoop() {
        this.isLooping = !this.isLooping;
        if (this.isLooping) {
            this.playMorseCode();
        }
    }

    // Löscht das Eingabefeld und die Diagnostik
    clearInput() {
        document.getElementById('inputText').innerText = '';
        this.updateDiagnostics();
    }

    // Spielt einen Ton ab
    playTone(duration) {
        return new Promise(resolve => {
            this.oscillator = this.audioContext.createOscillator();
            this.oscillator.frequency.setValueAtTime(this.frequency, this.audioContext.currentTime);
            this.oscillator.connect(this.gainNode);
            this.gainNode.connect(this.audioContext.destination);
            this.oscillator.start();
            setTimeout(() => {
                this.oscillator.stop();
                resolve();
            }, duration);
        });
    }

    // Führt eine Pause durch
    pause(duration) {
        return new Promise(resolve => setTimeout(resolve, duration));
    }

    // Aktualisiert die diagnostischen Informationen
    updateDiagnostics() {
        const text = document.getElementById('inputText').innerText.trim();
        const morseCode = this.convertToMorse(text);
        const charCount = morseCode.replace(/\s+/g, '').length;
        
        // Calculate word spaces based on Farnsworth speed
        const wordCount = (text.match(/\s+/g) || []).length;
        const totalWordPause = wordCount * this.calculateWordPause();
        
        // Calculate transmission duration
        const transmissionDuration = ((charCount * this.unitTime) + totalWordPause) / 1000;

        const shannonEntropy = this.calculateShannonEntropy(text);

        document.getElementById('charCount').innerText = `Anzahl der Morse-Zeichen (dits & dahs & Pausen): ${charCount}`;
        document.getElementById('transmissionDuration').innerText = `Dauer der Übertragung: ${transmissionDuration.toFixed(2)} Sekunden`;
        document.getElementById('shannonEntropy').innerText = `Shannon-Entropie (Informationsgehalt): ${shannonEntropy.toFixed(2)}`;
    }

    // Berechnet die Shannon-Entropie
    calculateShannonEntropy(text) {
        const freq = {};
        const len = text.length;

        for (let i = 0; i < len; i++) {
            const char = text[i];
            if (!freq[char]) {
                freq[char] = 0;
            }
            freq[char]++;
        }

        let entropy = 0;
        for (let char in freq) {
            const p = freq[char] / len;
            entropy -= p * Math.log2(p);
        }

        return entropy;
    }
}

// Initialisiert den MorseCodePlayer nach dem Laden der Seite
window.addEventListener('DOMContentLoaded', () => {
    new MorseCodePlayer();
});
