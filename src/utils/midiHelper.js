import { useEffect, useState, useCallback, useRef } from 'react';
import { WebMidi } from "webmidi";
import * as Tone from 'tone';
import { Midi } from '@tonejs/midi';



const sampler = new Tone.Sampler({
    urls: {
        C2: "/samples/piano/c2.wav",
        C3: "/samples/piano/c3.wav",
        C4: "/samples/piano/c4.wav",
        C5: "/samples/piano/c5.wav",
    },
    release: 1,
    onload: () => {
        console.log("Piano Sampler Loaded and Ready");
    }
}).toDestination();

const drumSampler = new Tone.Sampler({
    urls: {
        C1: "/drums/kicks/kick00.mp3",
        D1: "/drums/snares/snare01.mp3",
        E1: "/drums/highHats/highHat01.mp3",
        F1: "/drums/highHats/highHat00.mp3",
        G1: "/drums/tom/tom01.mp3",
        A1: "/drums/tom/tom00.mp3",
        B1: "/drums/cymbal/cymbal01.mp3",
    },
    release: 1.0,
    onload: () => {
        console.log("Drum Sampler Loaded and Ready");
    }
}).toDestination();



/**
 * Global playSound function
 * @param {number} midiNumber - The MIDI note number (e.g., 60 for C4)
 * @param {boolean} isDown - True to start note, False to release
 */
export const playSound = (midiNumber, isDown) => {

    if (Tone.context.state !== 'running') {
        Tone.start();
    }

    const note = Tone.Frequency(midiNumber, "midi").toNote();

    if (isDown) {
        // triggerAttack plays the note immediately
        sampler.triggerAttack(note);
    } else {
        // triggerRelease allows the note to fade out naturally
        sampler.triggerRelease(note);
    }
};


const drumMap = {
    'i': 'C1',  // kick
    'o': 'D1',  // snare
    'p': 'E1',  // hihat-closed
    '[': 'F1',  // hihat-open
    'l': 'G1',  // tom1
    ';': 'A1',  // tom2
    "'": 'B1',  // tom3
};


/**
 * Play drum sound
 * @param {string} drumNote - The drum note (e.g., 'C1', 'D1')
 */
export const playDrum = (drumNote) => {
    if (Tone.context.state !== 'running') {
        Tone.start();
    }
    drumSampler.triggerAttackRelease(drumNote, "8n");
};

export const useMidiController = (numKeys = 48, startNote = 36) => {
    // This is the binary array (0s and 1s) for the shader
    const [noteStates, setNoteStates] = useState(new Array(numKeys).fill(0));
    const [drumStates, setDrumStates] = useState(new Array(7).fill(0));

    // Helper to toggle a note based on MIDI number
    const setNote = useCallback((midiNumber, isDown) => {
        const index = midiNumber - startNote;
        if (index >= 0 && index < numKeys) {
            playSound(midiNumber, isDown);
            setNoteStates(prev => {
                const next = [...prev];
                next[index] = isDown ? 1 : 0;
                return next;
            });
        }
    }, [numKeys, startNote]);

    // Helper to trigger drums
    const triggerDrum = useCallback((drumKey) => {
        const drumNote = drumMap[drumKey];
        if (drumNote) {
            playDrum(drumNote);
            const drumIndex = Object.keys(drumMap).indexOf(drumKey);
            setDrumStates(prev => {
                const next = [...prev];
                next[drumIndex] = 1;
                return next;
            });
            // Reset drum state after short delay
            setTimeout(() => {
                setDrumStates(prev => {
                    const next = [...prev];
                    next[drumIndex] = 0;
                    return next;
                });
            }, 100);
        }
    }, []);

    // --- 1. PHYSICAL MIDI INPUT ---
    useEffect(() => {
        WebMidi.enable().then(() => {
            WebMidi.inputs.forEach(input => {
                // Add listener for Note On
                input.addListener("noteon", e => {
                    const channel = e.message.channel;

                    if (channel === 10) {
                        // Logic for Drum Pads (Channel 10)
                        console.log("Drum Hit:", e.note.number);
                        playDrum('C1'); // Or map MIDI drum notes to your drum samples
                    }
                    else if (channel === 1) {
                        // Logic for Piano Keys (Channel 1)
                        setNote(e.note.number, true);
                    }
                });

                // Add listener for Note Off
                input.addListener("noteoff", e => {
                    const channel = e.message.channel;

                    if (channel === 1) {
                        setNote(e.note.number, false);
                    }
                    // Drums usually don't need a noteoff, but you can add it if needed
                });
            });
        });

        return () => WebMidi.disable();
    }, [setNote]);

    // --- 2. COMPUTER KEYBOARD MAPPING ---
    useEffect(() => {
        const keyMap = {
            // --- BOTTOM ROW (Octave 3: C3 to B3) ---
            'z': 48, // C3
            's': 49, // C#3 (Black Key)
            'x': 50, // D3
            'd': 51, // D#3 (Black Key)
            'c': 52, // E3
            'v': 53, // F3
            'g': 54, // F#3 (Black Key)
            'b': 55, // G3
            'h': 56, // G#3 (Black Key)
            'n': 57, // A3
            'j': 58, // A#3 (Black Key)
            'm': 59, // B3
            ',': 60, // C4 (Transition point)

            // --- TOP ROW (Octave 4: C4 to B4) ---
            'q': 60, // C4
            '2': 61, // C#4 (Black Key)
            'w': 62, // D4
            '3': 63, // D#4 (Black Key)
            'e': 64, // E4
            'r': 65, // F4
            '5': 66, // F#4 (Black Key)
            't': 67, // G4
            '6': 68, // G#4 (Black Key)
            'y': 69, // A4
            '7': 70, // A#4 (Black Key)
            'u': 71, // B4
        };


        const handleKeyDown = (e) => {
            // Check if it's a drum key
            if (drumMap[e.key] && !e.repeat) {
                triggerDrum(e.key);
            }
            // Otherwise check if it's a piano key
            else if (keyMap[e.key] && !e.repeat) {
                setNote(keyMap[e.key], true);
            }
        };
        const handleKeyUp = (e) => {
            if (keyMap[e.key]) setNote(keyMap[e.key], false);
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [setNote, triggerDrum]);

    return { noteStates, drumStates };
};

/**
 * Play a MIDI file with specified BPM
 * @param {string|File} midiFile - URL to MIDI file or File object
 * @param {number} bpm - Beats per minute for playback
 * @param {Function} onNoteStateChange - Callback when note states change
 * @returns {Object} - Object with playback controls and noteStates
 */
export const useMidiFilePlayer = (midiFile, bpm, onNoteStateChange) => {
    const [noteStates, setNoteStates] = useState(new Array(48).fill(0));
    const [drumStates, setDrumStates] = useState(new Array(7).fill(0));
    const [isPlaying, setIsPlaying] = useState(false);
    const [midiData, setMidiData] = useState(null);
    const startNoteRef = useRef(36);

    // Parse MIDI file on load
    useEffect(() => {
        const parseMidiFile = async () => {
            try {
                let midiBuffer;

                if (typeof midiFile === 'string') {
                    // URL
                    console.log("Fetching MIDI file from:", midiFile);
                    const response = await fetch(midiFile);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    midiBuffer = await response.arrayBuffer();
                    console.log("MIDI file fetched successfully, buffer size:", midiBuffer.byteLength);
                } else if (midiFile instanceof File) {
                    // File object
                    console.log("Reading MIDI file from File object:", midiFile.name);
                    midiBuffer = await midiFile.arrayBuffer();
                    console.log("MIDI file read successfully, buffer size:", midiBuffer.byteLength);
                } else {
                    console.error('Invalid MIDI file input:', midiFile);
                    return;
                }

                const midi = new Midi(midiBuffer);
                setMidiData(midi);
                console.log("MIDI File Loaded Successfully:", midi);
                console.log("Total tracks:", midi.tracks.length);
                midi.tracks.forEach((track, idx) => {
                    console.log(`Track ${idx}: ${track.notes.length} notes`);
                });
            } catch (error) {
                console.error("Error loading MIDI file:", error);
            }
        };

        if (midiFile) {
            parseMidiFile();
        }
    }, [midiFile]);

    // Schedule and play MIDI
    // Inside useMidiFilePlayer
    const playMidiFile = useCallback(() => {
        if (!midiData) return;

        if (Tone.context.state !== 'running') Tone.start();

        Tone.Transport.cancel();
        Tone.Transport.stop();

        // 1. Set the BPM to the MIDI file's native tempo (or your custom one)
        Tone.Transport.bpm.value = bpm || midiData.header.tempos[0].bpm;

        midiData.tracks.forEach((track) => {
            // 2. Use Tone.Part for better performance than individual schedules
            new Tone.Part((time, note) => {
                const index = note.midi - startNoteRef.current;

                // Trigger sound
                sampler.triggerAttackRelease(note.name, note.duration, time, note.velocity);

                // 3. Handle Visuals (Note On)
                Tone.Draw.schedule(() => {
                    if (index >= 0 && index < 48) {
                        setNoteStates(prev => {
                            const next = [...prev];
                            next[index] = 1;
                            return next;
                        });
                    }
                }, time);

                // 4. Handle Visuals (Note Off)
                Tone.Draw.schedule(() => {
                    if (index >= 0 && index < 48) {
                        setNoteStates(prev => {
                            const next = [...prev];
                            next[index] = 0;
                            return next;
                        });
                    }
                }, time + note.duration);

            }, track.notes).start(0);
        });

        Tone.Transport.start();
        setIsPlaying(true);
    }, [midiData, bpm]);

    // Stop playback
    const stopMidiFile = useCallback(() => {
        Tone.Transport.stop();
        Tone.Transport.cancel();
        setIsPlaying(false);
        setNoteStates(new Array(48).fill(0));
        setDrumStates(new Array(7).fill(0));
    }, []);

    return {
        noteStates,
        drumStates,
        isPlaying,
        play: playMidiFile,
        stop: stopMidiFile,
        midiData
    };
};




