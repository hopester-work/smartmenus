import { defineStore } from 'pinia'
import { useParams } from '@/useParams'
import { readStorage } from '@/safeStorage'
import { parseJSON, sanitizeNavbars } from '@/validate'

const { params } = useParams()

const getNavbarTemplate = () => ({
  id: 1,
  collapse: false,
  navbarClasses: [],
  navClasses: [],
  customProperties: [],
  features: [],
  scriptOptions: [],
  key: String(Date.now() + Math.random()).replace(/\D/g, '')
})

const getDefaultNavbars = () => ({
  navbars: [getNavbarTemplate()],
  nextId: 2
})

// Both the URL parameters and the saved state are untrusted input so they are validated
const getNavbars = () => {
  const fromParams = sanitizeNavbars(parseJSON(params['navbars']), getNavbarTemplate)
  if (fromParams && fromParams.navbars.length > 0) {
    return fromParams
  }
  return sanitizeNavbars(readStorage('navbars'), getNavbarTemplate) || getDefaultNavbars()
}

export const useNavbarsStore = defineStore('navbars', {
  state: () => getNavbars(),
  getters: {
    getNavbarById(state) {
      return (id) => state.navbars.find((navbar) => navbar.id === id)
    },
    navbarClassIsSelected() {
      return (navbar, classes) => {
        return navbar.navbarClasses.some((value) => classes.includes(value))
      }
    },
    navbarClassIsSelectedForAny(state) {
      return (classes) => {
        let value = false
        for (const navbar of state.navbars) {
          value = this.navbarClassIsSelected(navbar, classes)
          if (value) {
            break
          }
        }
        return value
      }
    },
    featureIsSelected() {
      return (navbar, feature) => {
        return navbar.features.includes(feature)
      }
    }
  },
  actions: {
    addNavbar() {
      if (this.navbars.length === 0) {
        this.nextId = 1
      }
      this.navbars.push({ ...getNavbarTemplate(), id: this.nextId++ })
    },
    removeNavbar(id) {
      const navbar = this.getNavbarById(id)
      const index = this.navbars.indexOf(navbar)
      this.navbars.splice(index, 1)
    },
    reset() {
      this.$patch(getDefaultNavbars())
    }
  }
})
