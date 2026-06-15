import {
  computed,
  onBeforeUnmount,
  onMounted,
  shallowRef
} from 'vue'

export type ThemePreference = 'light' | 'dark' | 'system'

const storageKey = 'local-go-room-theme'
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system'
}

export function useTheme() {
  const savedPreference = window.localStorage.getItem(storageKey)
  const preference = shallowRef<ThemePreference>(
    isThemePreference(savedPreference) ? savedPreference : 'system'
  )
  const systemTheme = shallowRef<'light' | 'dark'>(
    mediaQuery.matches ? 'dark' : 'light'
  )
  const resolvedTheme = computed(() => (
    preference.value === 'system' ? systemTheme.value : preference.value
  ))

  function applyTheme(): void {
    document.documentElement.dataset.theme = resolvedTheme.value
  }

  function setThemePreference(nextPreference: ThemePreference): void {
    preference.value = nextPreference
    window.localStorage.setItem(storageKey, nextPreference)
    applyTheme()
  }

  function handleSystemThemeChange(event: MediaQueryListEvent): void {
    systemTheme.value = event.matches ? 'dark' : 'light'
    if (preference.value === 'system') {
      applyTheme()
    }
  }

  applyTheme()

  onMounted(() => {
    mediaQuery.addEventListener('change', handleSystemThemeChange)
  })

  onBeforeUnmount(() => {
    mediaQuery.removeEventListener('change', handleSystemThemeChange)
  })

  return {
    preference,
    setThemePreference
  }
}
