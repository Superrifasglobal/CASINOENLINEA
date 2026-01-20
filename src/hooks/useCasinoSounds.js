import { useEffect, useRef, useCallback } from 'react';

/**
 * useCasinoSounds - Procedural Audio Hook for Antigravity Casino
 * Uses Web Audio API for futurist space aesthetics.
 */
const useCasinoSounds = () => {
    const audioCtx = useRef(null);
    const reverbNode = useRef(null);
    const bgmSource = useRef(null);
    const bgmGain = useRef(null);

    useEffect(() => {
        // Initialize Audio Context on first interaction or mount
        const initAudio = () => {
            if (audioCtx.current) return;

            audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();

            // Create Space Reverb (Algorithmic simulation)
            reverbNode.current = audioCtx.current.createConvolver();

            // Generate a simple impulse response for spacey feel
            const sampleRate = audioCtx.current.sampleRate;
            const length = sampleRate * 2; // 2 seconds
            const impulse = audioCtx.current.createBuffer(2, length, sampleRate);
            for (let i = 0; i < 2; i++) {
                const channelData = impulse.getChannelData(i);
                for (let j = 0; j < length; j++) {
                    channelData[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / length, 2);
                }
            }
            reverbNode.current.buffer = impulse;
            reverbNode.current.connect(audioCtx.current.destination);
        };

        window.addEventListener('click', initAudio, { once: true });
        return () => window.removeEventListener('click', initAudio);
    }, []);

    const playClick = useCallback(() => {
        if (!audioCtx.current) return;
        const osc = audioCtx.current.createOscillator();
        const gain = audioCtx.current.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, audioCtx.current.currentTime);
        osc.frequency.exponentialRampToValueAtTime(110, audioCtx.current.currentTime + 0.1);

        gain.gain.setValueAtTime(0.3, audioCtx.current.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.current.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(reverbNode.current);

        osc.start();
        osc.stop(audioCtx.current.currentTime + 0.1);
    }, []);

    const playSpin = useCallback((duration = 2) => {
        if (!audioCtx.current) return;
        const osc = audioCtx.current.createOscillator();
        const gain = audioCtx.current.createGain();
        const filter = audioCtx.current.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(50, audioCtx.current.currentTime);
        // Rising magnetic pitch
        osc.frequency.exponentialRampToValueAtTime(440, audioCtx.current.currentTime + duration);

        filter.type = 'lowpass';
        filter.frequency.value = 1000;

        gain.gain.setValueAtTime(0.1, audioCtx.current.currentTime);
        gain.gain.linearRampToValueAtTime(0.2, audioCtx.current.currentTime + duration * 0.8);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.current.currentTime + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(reverbNode.current);

        osc.start();
        osc.stop(audioCtx.current.currentTime + duration);
    }, []);

    const playWin = useCallback(() => {
        if (!audioCtx.current) return;

        const now = audioCtx.current.currentTime;
        const notes = [440, 554.37, 659.25, 880]; // A major chord

        notes.forEach((freq, i) => {
            const osc = audioCtx.current.createOscillator();
            const gain = audioCtx.current.createGain();

            osc.className = 'synthwave-pad';
            osc.type = 'square';
            osc.frequency.value = freq;

            gain.gain.setValueAtTime(0, now + i * 0.1);
            gain.gain.linearRampToValueAtTime(0.1, now + i * 0.1 + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

            osc.connect(gain);
            gain.connect(reverbNode.current);

            osc.start(now + i * 0.1);
            osc.stop(now + 2);
        });
    }, []);

    const setBGMIntensity = useCallback((betSize) => {
        if (!bgmSource.current) return;

        // Dynamic playback rate based on bet (range 1.0 to 1.5)
        const intensity = Math.min(1.5, 1 + betSize / 1000);
        bgmSource.current.playbackRate.exponentialRampToValueAtTime(intensity, audioCtx.current.currentTime + 1);
    }, []);

    // Helper to start a procedural BGM if no file provided
    const startBGM = useCallback(() => {
        if (!audioCtx.current || bgmSource.current) return;

        const loopLength = 4; // 4 seconds
        const buffer = audioCtx.current.createBuffer(1, audioCtx.current.sampleRate * loopLength, audioCtx.current.sampleRate);
        const data = buffer.getChannelData(0);

        // Create a simple rhythmic pulse for BGM
        for (let i = 0; i < data.length; i++) {
            const t = i / audioCtx.current.sampleRate;
            data[i] = Math.sin(2 * Math.PI * 55 * t) * Math.exp(-10 * (t % 0.5));
        }

        const source = audioCtx.current.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        const gain = audioCtx.current.createGain();
        gain.gain.value = 0.15;

        source.connect(gain);
        gain.connect(audioCtx.current.destination);

        source.start();
        bgmSource.current = source;
        bgmGain.current = gain;
    }, []);

    return { playClick, playSpin, playWin, startBGM, setBGMIntensity };
};

export default useCasinoSounds;
