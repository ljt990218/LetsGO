import {
  onBeforeUnmount,
  shallowRef
} from 'vue'
import captureSoundUrl from '../assets/sounds/capturing.wav'
import stone1SoundUrl from '../assets/sounds/stone1.wav'
import stone2SoundUrl from '../assets/sounds/stone2.wav'
import stone3SoundUrl from '../assets/sounds/stone3.wav'
import stone4SoundUrl from '../assets/sounds/stone4.wav'
import stone5SoundUrl from '../assets/sounds/stone5.wav'

export type SoundPreference = 'off' | 'random' | 'stone1' | 'stone2' | 'stone3' | 'stone4' | 'stone5'

const storageKey = 'local-go-room-sound-preference'
const captureDelay = 100
const moveSoundUrls: Record<Exclude<SoundPreference, 'off' | 'random'>, string> = {
  stone1: stone1SoundUrl,
  stone2: stone2SoundUrl,
  stone3: stone3SoundUrl,
  stone4: stone4SoundUrl,
  stone5: stone5SoundUrl
}
const moveSoundPreferences = Object.keys(moveSoundUrls) as Array<keyof typeof moveSoundUrls>

export function useGameSound() {
  const savedPreference = window.localStorage.getItem(storageKey)
  const preference = shallowRef<SoundPreference>(
    isSoundPreference(savedPreference) ? savedPreference : 'random'
  )
  const moveSounds = Object.fromEntries(
    Object.entries(moveSoundUrls).map(([key, source]) => [key, createAudio(source)])
  ) as Record<keyof typeof moveSoundUrls, HTMLAudioElement>
  const captureSound = createAudio(captureSoundUrl)
  const captureTimers = new Set<number>()

  function setPreference(nextPreference: SoundPreference): void {
    preference.value = nextPreference
    window.localStorage.setItem(storageKey, nextPreference)
  }

  function playMoveSound(captured: boolean): void {
    if (preference.value === 'off') {
      return
    }

    const moveSoundPreference = preference.value === 'random'
      ? moveSoundPreferences[Math.floor(Math.random() * moveSoundPreferences.length)]
      : preference.value
    playAudio(moveSounds[moveSoundPreference])

    if (!captured) {
      return
    }

    const timer = window.setTimeout(() => {
      captureTimers.delete(timer)
      if (preference.value !== 'off') {
        playAudio(captureSound)
      }
    }, captureDelay)
    captureTimers.add(timer)
  }

  onBeforeUnmount(() => {
    for (const timer of captureTimers) {
      window.clearTimeout(timer)
    }
    captureTimers.clear()
  })

  return {
    preference,
    setPreference,
    playMoveSound
  }
}

function isSoundPreference(value: string | null): value is SoundPreference {
  return value === 'off'
    || value === 'random'
    || value === 'stone1'
    || value === 'stone2'
    || value === 'stone3'
    || value === 'stone4'
    || value === 'stone5'
}

function createAudio(source: string): HTMLAudioElement {
  const audio = new Audio(source)
  audio.preload = 'auto'
  return audio
}

function playAudio(audio: HTMLAudioElement): void {
  try {
    audio.currentTime = 0
    audio.play().catch(() => undefined)
  } catch {
    return
  }
}
