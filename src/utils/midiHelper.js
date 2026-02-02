import { useEffect, useState, useCallback } from 'react';
import { WebMidi } from "webmidi";
import * as Tone from 'tone';



const sampler = new Tone.Sampler({
    urls: {
        C4: "/samples/piano-c4.wav", // Ensure this file is in your public folder
    },
    release: 1,
    onload: () => {
        console.log("Piano Sampler Loaded and Ready");
    }
}).toDestination();


const setDrumState = ()=>{
    
}

/**
 * Global playSound function
 * @param {number} midiNumber - The MIDI note number (e.g., 60 for C4)
 * @param {boolean} isDown - True to start note, False to release
 */
export const playSound = (midiNumber, isDown) => {
    // Start Audio Context on first user interaction (Browser Requirement)
    if (Tone.context.state !== 'running') {
        Tone.start();
    }

    // Convert MIDI number to Note Name (60 -> "C4")
    const note = Tone.Frequency(midiNumber, "midi").toNote();

    if (isDown) {
        // triggerAttack plays the note immediately
        sampler.triggerAttack(note);
    } else {
        // triggerRelease allows the note to fade out naturally
        sampler.triggerRelease(note);
    }
};

export const useMidiController = (numKeys = 48, startNote = 36) => {
    // This is the binary array (0s and 1s) for the shader
    const [noteStates, setNoteStates] = useState(new Array(numKeys).fill(0));

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
                    // You could call a different function here like setDrumState(e.note.number, true)
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
            if (keyMap[e.key] && !e.repeat) setNote(keyMap[e.key], true);
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
    }, [setNote]);

    return noteStates;
};




