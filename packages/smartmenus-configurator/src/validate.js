import COMPONENTS, { LAYOUT_CUSTOM_PROPERTIES } from 'smartmenus/src/js/definitions/components'
import OPTIONS from 'smartmenus/src/js/definitions/options'

// Everything that comes from the URL or from localStorage is untrusted input. It ends up in generated HTML (rendered via v-html)
// and CSS so it is checked against what the configurator itself is able to produce before it is used.

const MAX_JSON_LENGTH = 100000
const MAX_NAVBARS = 20

// Keep in sync with GlobalOptions.vue
const GLOBAL_FEATURES = ['rtl', 'only-layout']

const navbarVariants = COMPONENTS.find((component) => component.value === 'sm-navbar').variants
const navVariants = COMPONENTS.find((component) => component.value === 'sm-nav').variants
const navbarFeatures = [COMPONENTS.find((component) => component.value === 'sm-container').value]
// Same filter as in NavbarConfigurator.vue
const scriptOptions = OPTIONS.filter((option) => !/^(class|selector)/.test(option.label))

const CSS_VALUE_PATTERN = /^[\w\s#%.,()+\-*/]*$/

const isPlainObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const isSafeCssValue = (value) =>
  value.length <= 100 &&
  CSS_VALUE_PATTERN.test(value) &&
  !value.includes('/*') &&
  !/url\s*\(/i.test(value) &&
  !/(^|[^\w-])(expression|javascript)\b/i.test(value)

// Returns the key and value of an item like { key: value } or null if it is not such an item
const getSingleEntry = (item) => {
  if (!isPlainObject(item)) {
    return null
  }
  const keys = Object.keys(item)
  return keys.length === 1 ? [keys[0], item[keys[0]]] : null
}

export function parseJSON(text) {
  if (typeof text !== 'string' || text.length === 0 || text.length > MAX_JSON_LENGTH) {
    return null
  }
  try {
    return JSON.parse(text)
  } catch (e) {
    return null
  }
}

// Keep only the known values that do not conflict with each other (the same rules that the UI enforces)
function sanitizeClasses(values, variants) {
  if (!Array.isArray(values)) {
    return []
  }
  const known = new Map(variants.map((variant) => [variant.value, variant]))
  const kept = []
  for (const value of new Set(values)) {
    const variant = known.get(value)
    if (!variant) {
      continue
    }
    const conflicts = kept.some(
      (item) =>
        (known.get(item).disallow || []).includes(value) || (variant.disallow || []).includes(item)
    )
    if (!conflicts) {
      kept.push(value)
    }
  }
  // Drop the variants that require a parent variant which is not selected
  let changed = true
  while (changed) {
    changed = false
    for (const value of [...kept]) {
      const { parents } = known.get(value)
      if (parents && !parents.some((parent) => kept.includes(parent))) {
        kept.splice(kept.indexOf(value), 1)
        changed = true
      }
    }
  }
  return kept
}

function sanitizeFeatures(values, known) {
  return Array.isArray(values)
    ? [...new Set(values.filter((value) => typeof value === 'string' && known.includes(value)))]
    : []
}

function sanitizeCustomProperties(items) {
  const result = []
  if (!Array.isArray(items)) {
    return result
  }
  for (const item of items) {
    const entry = getSingleEntry(item)
    if (!entry || !LAYOUT_CUSTOM_PROPERTIES.some((property) => property.label === entry[0])) {
      continue
    }
    const value = typeof entry[1] === 'number' && Number.isFinite(entry[1]) ? String(entry[1]) : entry[1]
    if (typeof value === 'string' && isSafeCssValue(value) && !result.some((r) => entry[0] in r)) {
      result.push({ [entry[0]]: value })
    }
  }
  return result
}

function sanitizeScriptOptions(items) {
  const result = []
  if (!Array.isArray(items)) {
    return result
  }
  for (const item of items) {
    const entry = getSingleEntry(item)
    const option = entry && scriptOptions.find((scriptOption) => scriptOption.label === entry[0])
    if (!option || typeof entry[1] !== option.type) {
      continue
    }
    if (option.type === 'number' && !Number.isFinite(entry[1])) {
      continue
    }
    if (option.lookup && !option.lookup.includes(entry[1])) {
      continue
    }
    if (!result.some((r) => entry[0] in r)) {
      result.push({ [entry[0]]: entry[1] })
    }
  }
  return result
}

function sanitizeNavbar(raw, template, usedIds) {
  const source = isPlainObject(raw) ? raw : {}
  let id = Number.isSafeInteger(source.id) && source.id > 0 ? source.id : 0
  if (!id || usedIds.has(id)) {
    id = 1
    while (usedIds.has(id)) {
      id++
    }
  }
  return {
    ...template,
    id,
    collapse: source.collapse === true,
    navbarClasses: sanitizeClasses(source.navbarClasses, navbarVariants),
    navClasses: sanitizeClasses(source.navClasses, navVariants),
    customProperties: sanitizeCustomProperties(source.customProperties),
    features: sanitizeFeatures(source.features, navbarFeatures),
    scriptOptions: sanitizeScriptOptions(source.scriptOptions),
    key: typeof source.key === 'string' && /^\d{1,40}$/.test(source.key) ? source.key : template.key
  }
}

// Returns a valid { navbars, nextId } state or null if the input is not usable at all
export function sanitizeNavbars(raw, getTemplate) {
  if (!isPlainObject(raw) || !Array.isArray(raw.navbars)) {
    return null
  }
  const usedIds = new Set()
  const navbars = []
  for (const item of raw.navbars.slice(0, MAX_NAVBARS)) {
    const navbar = sanitizeNavbar(item, getTemplate(), usedIds)
    usedIds.add(navbar.id)
    navbars.push(navbar)
  }
  const maxId = Math.max(0, ...usedIds)
  const nextId = Number.isSafeInteger(raw.nextId) && raw.nextId > maxId ? raw.nextId : maxId + 1
  return { navbars, nextId }
}

// Returns a valid { features } state or null if the input is not usable at all
export function sanitizeMain(raw) {
  return isPlainObject(raw) ? { features: sanitizeFeatures(raw.features, GLOBAL_FEATURES) } : null
}
