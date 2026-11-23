import { defineStore } from 'pinia'
import { useParams } from '@/useParams'
import { readStorage } from '@/safeStorage'
import { parseJSON, sanitizeMain } from '@/validate'

const { params } = useParams()

const getDefaultMain = () => ({
  features: []
})

// Both the URL parameters and the saved state are untrusted input so they are validated
const getMain = () => {
  return (
    sanitizeMain(parseJSON(params['main'])) ||
    sanitizeMain(readStorage('main')) ||
    getDefaultMain()
  )
}

export const useMainStore = defineStore('main', {
  state: () => getMain(),
  getters: {
    featureIsSelected(state) {
      return (feature) => state.features.includes(feature)
    }
  },
  actions: {
    reset() {
      this.$patch(getDefaultMain())
    }
  }
})
