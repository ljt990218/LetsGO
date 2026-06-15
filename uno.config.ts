import { defineConfig, presetWind3 } from 'unocss'

export default defineConfig({
  presets: [
    presetWind3()
  ],
  shortcuts: {
    'focus-ring': 'outline-none focus-visible:ring-2 focus-visible:ring-[#c8a76a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#151612]',
    'field-control': 'focus-ring w-full border border-[#47463b] bg-[#1d1f1a] px-3 py-2.5 text-[#eee7d8] transition-colors hover:border-[#6c6856]'
  }
})
