import { defineConfig, presetWind3 } from 'unocss'

export default defineConfig({
  presets: [
    presetWind3()
  ],
  shortcuts: {
    'focus-ring': 'outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-focus-offset)]',
    'field-control': 'focus-ring w-full border border-[var(--color-border-control)] bg-[var(--color-field-bg)] px-3 py-2.5 text-[var(--color-text-primary)] transition-colors hover:border-[var(--color-border-hover)]'
  }
})
