/**
 * @fileoverview Sound parameter definitions for Karate Blackjack.
 *
 * Defines all 17 retro arcade-style karate sound effects using Web Audio API
 * synthesis parameters. Each sound is designed to evoke classic 8-bit fighting
 * game aesthetics.
 *
 * @module audio/soundDefinitions
 * @version 1.0.0
 */

import { WAVEFORMS, playArpeggio, playNoise, playSweep, playTone } from './SoundSynthesizer.js'

// =============================================================================
// SOUND DEFINITIONS
// =============================================================================

/**
 * All sound effect definitions with their synthesis parameters.
 * Each function takes (ctx, masterGain) and synthesizes the sound.
 *
 * @type {Object<string, Function>}
 */
export const SOUNDS = {
  // ===========================================================================
  // CARD SOUNDS
  // ===========================================================================

  /**
   * Card deal - Karate chop swoosh + impact
   * A quick downward frequency sweep followed by a short impact noise
   */
  cardDeal: (ctx, masterGain) => {
    // Swoosh - fast downward sweep
    playSweep(ctx, masterGain, {
      waveform: WAVEFORMS.SAWTOOTH,
      startFreq: 800,
      endFreq: 200,
      envelope: { attack: 0.01, decay: 0.05, sustain: 0.2, release: 0.05 },
      volume: 0.15
    })

    // Impact thud - short noise burst
    setTimeout(() => {
      playNoise(ctx, masterGain, {
        envelope: { attack: 0.005, decay: 0.03, sustain: 0, release: 0.02 },
        filterFreq: 800,
        volume: 0.12
      })
    }, 60)
  },

  /**
   * Chip place - Metallic clink + power-up tone
   * Classic arcade coin/chip sound
   */
  chipPlace: (ctx, masterGain) => {
    // Metallic clink - high frequency triangle wave
    playTone(ctx, masterGain, {
      waveform: WAVEFORMS.TRIANGLE,
      frequency: 1800,
      envelope: { attack: 0.005, decay: 0.06, sustain: 0, release: 0.08 },
      volume: 0.18
    })

    // Power-up undertone
    playTone(ctx, masterGain, {
      waveform: WAVEFORMS.SQUARE,
      frequency: 600,
      envelope: { attack: 0.01, decay: 0.04, sustain: 0.1, release: 0.04 },
      volume: 0.08
    })
  },

  // ===========================================================================
  // ACTION SOUNDS
  // ===========================================================================

  /**
   * Hit - Quick punch sound
   * Fast attack with slight frequency drop
   */
  hit: (ctx, masterGain) => {
    // Punch impact
    playSweep(ctx, masterGain, {
      waveform: WAVEFORMS.SQUARE,
      startFreq: 400,
      endFreq: 150,
      envelope: { attack: 0.01, decay: 0.04, sustain: 0, release: 0.03 },
      volume: 0.2
    })

    // Impact noise
    playNoise(ctx, masterGain, {
      envelope: { attack: 0.005, decay: 0.02, sustain: 0, release: 0.02 },
      filterFreq: 1200,
      volume: 0.12
    })
  },

  /**
   * Stand - Defensive block sound
   * Solid, firm tone indicating stability
   */
  stand: (ctx, masterGain) => {
    // Block sound - firm tone
    playTone(ctx, masterGain, {
      waveform: WAVEFORMS.SQUARE,
      frequency: 220,
      envelope: { attack: 0.01, decay: 0.08, sustain: 0.2, release: 0.05 },
      volume: 0.15
    })

    // Resonance
    playTone(ctx, masterGain, {
      waveform: WAVEFORMS.TRIANGLE,
      frequency: 440,
      envelope: { attack: 0.02, decay: 0.06, sustain: 0, release: 0.04 },
      volume: 0.08
    })
  },

  /**
   * Double Down - Power-up charge + impact
   * Building energy followed by release
   */
  doubleDown: (ctx, masterGain) => {
    // Charge up sweep
    playSweep(ctx, masterGain, {
      waveform: WAVEFORMS.SAWTOOTH,
      startFreq: 200,
      endFreq: 800,
      envelope: { attack: 0.08, decay: 0.02, sustain: 0.3, release: 0.02 },
      volume: 0.15
    })

    // Power release
    setTimeout(() => {
      playTone(ctx, masterGain, {
        waveform: WAVEFORMS.SQUARE,
        frequency: 523, // C5
        envelope: { attack: 0.01, decay: 0.05, sustain: 0.2, release: 0.05 },
        volume: 0.2
      })
    }, 100)
  },

  /**
   * Split - Slicing/chopping sound
   * Sharp downward sweep with impact
   */
  split: (ctx, masterGain) => {
    // Slice sweep
    playSweep(ctx, masterGain, {
      waveform: WAVEFORMS.SAWTOOTH,
      startFreq: 1200,
      endFreq: 300,
      envelope: { attack: 0.01, decay: 0.06, sustain: 0, release: 0.04 },
      volume: 0.18
    })

    // Chop impact
    setTimeout(() => {
      playNoise(ctx, masterGain, {
        envelope: { attack: 0.005, decay: 0.03, sustain: 0, release: 0.02 },
        filterFreq: 2000,
        volume: 0.15
      })
    }, 50)

    // Second slice (splitting into two)
    setTimeout(() => {
      playSweep(ctx, masterGain, {
        waveform: WAVEFORMS.SAWTOOTH,
        startFreq: 900,
        endFreq: 400,
        envelope: { attack: 0.01, decay: 0.04, sustain: 0, release: 0.03 },
        volume: 0.12
      })
    }, 80)
  },

  // ===========================================================================
  // RESULT SOUNDS
  // ===========================================================================

  /**
   * Win - Victory fanfare (ascending arpeggio)
   * Classic 8-bit victory jingle
   */
  win: (ctx, masterGain) => {
    // Victory arpeggio - C major chord ascending
    playArpeggio(ctx, masterGain, {
      waveform: WAVEFORMS.SQUARE,
      frequencies: [523, 659, 784, 1047], // C5, E5, G5, C6
      noteLength: 0.1,
      volume: 0.18
    })

    // Harmony layer
    setTimeout(() => {
      playArpeggio(ctx, masterGain, {
        waveform: WAVEFORMS.TRIANGLE,
        frequencies: [262, 330, 392, 523], // C4, E4, G4, C5
        noteLength: 0.1,
        volume: 0.08
      })
    }, 20)
  },

  /**
   * Blackjack - Special victory with flourish
   * Extended victory fanfare with extra flair
   */
  blackjack: (ctx, masterGain) => {
    // Dramatic opening
    playTone(ctx, masterGain, {
      waveform: WAVEFORMS.SQUARE,
      frequency: 440, // A4
      envelope: { attack: 0.01, decay: 0.05, sustain: 0.3, release: 0.05 },
      volume: 0.15
    })

    // Victory arpeggio with more notes
    setTimeout(() => {
      playArpeggio(ctx, masterGain, {
        waveform: WAVEFORMS.SQUARE,
        frequencies: [523, 659, 784, 880, 1047], // C5, E5, G5, A5, C6
        noteLength: 0.08,
        volume: 0.2
      })
    }, 80)

    // Flourish high note
    setTimeout(() => {
      playTone(ctx, masterGain, {
        waveform: WAVEFORMS.TRIANGLE,
        frequency: 1319, // E6
        envelope: { attack: 0.01, decay: 0.15, sustain: 0.1, release: 0.1 },
        volume: 0.12
      })
    }, 450)
  },

  /**
   * Push - Neutral draw tone
   * Even, balanced sound indicating tie
   */
  push: (ctx, masterGain) => {
    // Neutral chord
    playTone(ctx, masterGain, {
      waveform: WAVEFORMS.TRIANGLE,
      frequency: 440,
      envelope: { attack: 0.02, decay: 0.1, sustain: 0.2, release: 0.1 },
      volume: 0.12
    })

    playTone(ctx, masterGain, {
      waveform: WAVEFORMS.TRIANGLE,
      frequency: 330,
      envelope: { attack: 0.02, decay: 0.1, sustain: 0.2, release: 0.1 },
      volume: 0.1
    })
  },

  /**
   * Bust - Defeat thud + descending tone
   * Heavy impact followed by sad descending notes
   */
  bust: (ctx, masterGain) => {
    // Heavy thud
    playNoise(ctx, masterGain, {
      envelope: { attack: 0.01, decay: 0.08, sustain: 0, release: 0.05 },
      filterFreq: 400,
      volume: 0.2
    })

    // Descending doom tones
    setTimeout(() => {
      playArpeggio(ctx, masterGain, {
        waveform: WAVEFORMS.SQUARE,
        frequencies: [330, 262, 220], // E4, C4, A3
        noteLength: 0.12,
        volume: 0.15
      })
    }, 100)
  },

  /**
   * Lose - KO sound effect
   * Classic fighting game knockout sound
   */
  lose: (ctx, masterGain) => {
    // KO impact
    playNoise(ctx, masterGain, {
      envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.05 },
      filterFreq: 300,
      volume: 0.18
    })

    // Sad descending sweep
    playSweep(ctx, masterGain, {
      waveform: WAVEFORMS.SAWTOOTH,
      startFreq: 400,
      endFreq: 80,
      envelope: { attack: 0.02, decay: 0.2, sustain: 0.1, release: 0.1 },
      volume: 0.12
    })

    // Final thud
    setTimeout(() => {
      playTone(ctx, masterGain, {
        waveform: WAVEFORMS.SQUARE,
        frequency: 65,
        envelope: { attack: 0.01, decay: 0.15, sustain: 0, release: 0.05 },
        volume: 0.15
      })
    }, 250)
  },

  // ===========================================================================
  // DEALER SOUNDS
  // ===========================================================================

  /**
   * Dealer Reveal - Dramatic reveal
   * Tension-building reveal sound
   */
  dealerReveal: (ctx, masterGain) => {
    // Tension sweep up
    playSweep(ctx, masterGain, {
      waveform: WAVEFORMS.SAWTOOTH,
      startFreq: 150,
      endFreq: 600,
      envelope: { attack: 0.1, decay: 0.05, sustain: 0.2, release: 0.05 },
      volume: 0.12
    })

    // Reveal accent
    setTimeout(() => {
      playTone(ctx, masterGain, {
        waveform: WAVEFORMS.SQUARE,
        frequency: 880,
        envelope: { attack: 0.01, decay: 0.05, sustain: 0.1, release: 0.05 },
        volume: 0.15
      })
    }, 150)
  },

  // ===========================================================================
  // ROUND SOUNDS
  // ===========================================================================

  /**
   * New Round - "FIGHT!" energy
   * Arcade game round start sound
   */
  newRound: (ctx, masterGain) => {
    // Power up sweep
    playSweep(ctx, masterGain, {
      waveform: WAVEFORMS.SAWTOOTH,
      startFreq: 100,
      endFreq: 500,
      envelope: { attack: 0.1, decay: 0.02, sustain: 0.2, release: 0.02 },
      volume: 0.12
    })

    // Ready tones
    setTimeout(() => {
      playTone(ctx, masterGain, {
        waveform: WAVEFORMS.SQUARE,
        frequency: 440,
        envelope: { attack: 0.01, decay: 0.08, sustain: 0, release: 0.02 },
        volume: 0.15
      })
    }, 120)

    setTimeout(() => {
      playTone(ctx, masterGain, {
        waveform: WAVEFORMS.SQUARE,
        frequency: 659,
        envelope: { attack: 0.01, decay: 0.1, sustain: 0.1, release: 0.05 },
        volume: 0.18
      })
    }, 200)
  },

  // ===========================================================================
  // INSURANCE SOUNDS
  // ===========================================================================

  /**
   * Insurance Offer - Alert tone
   * Attention-grabbing alert
   */
  insuranceOffer: (ctx, masterGain) => {
    // Alert beep
    playTone(ctx, masterGain, {
      waveform: WAVEFORMS.SQUARE,
      frequency: 880,
      envelope: { attack: 0.01, decay: 0.05, sustain: 0.3, release: 0.02 },
      volume: 0.12
    })

    // Second beep
    setTimeout(() => {
      playTone(ctx, masterGain, {
        waveform: WAVEFORMS.SQUARE,
        frequency: 880,
        envelope: { attack: 0.01, decay: 0.05, sustain: 0.3, release: 0.02 },
        volume: 0.12
      })
    }, 150)

    // Question mark tone
    setTimeout(() => {
      playSweep(ctx, masterGain, {
        waveform: WAVEFORMS.TRIANGLE,
        startFreq: 660,
        endFreq: 880,
        envelope: { attack: 0.02, decay: 0.1, sustain: 0.1, release: 0.05 },
        volume: 0.1
      })
    }, 300)
  },

  /**
   * Insurance Accept - Confirmation beep
   * Positive confirmation sound
   */
  insuranceAccept: (ctx, masterGain) => {
    // Confirm beep - ascending
    playArpeggio(ctx, masterGain, {
      waveform: WAVEFORMS.SQUARE,
      frequencies: [523, 659], // C5, E5
      noteLength: 0.08,
      volume: 0.15
    })
  },

  /**
   * Insurance Decline - Cancel sound
   * Negative/cancel indication
   */
  insuranceDecline: (ctx, masterGain) => {
    // Cancel beep - descending
    playArpeggio(ctx, masterGain, {
      waveform: WAVEFORMS.SQUARE,
      frequencies: [523, 392], // C5, G4
      noteLength: 0.08,
      volume: 0.12
    })
  },

  // ===========================================================================
  // UI SOUNDS
  // ===========================================================================

  /**
   * Button Click - Quick UI blip
   * Subtle feedback for button interactions
   */
  buttonClick: (ctx, masterGain) => {
    playTone(ctx, masterGain, {
      waveform: WAVEFORMS.SQUARE,
      frequency: 1000,
      envelope: { attack: 0.005, decay: 0.02, sustain: 0, release: 0.01 },
      volume: 0.08
    })
  }
}

/**
 * List of all available sound names.
 * @type {string[]}
 */
export const SOUND_NAMES = Object.keys(SOUNDS)
