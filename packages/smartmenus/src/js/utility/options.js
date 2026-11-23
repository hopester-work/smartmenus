/*
 * SmartMenus
 * http://www.smartmenus.org/
 * Copyright (c) since 2001 Vasil Dinkov, Vadikom Web Ltd. http://vadikom.com
 * Licensed MIT https://github.com/vadikom/smartmenus/blob/master/LICENSE-MIT
 */


import DEFAULTS, { OPTION_VALUES } from '../defaults.js'
import Log from './log.js'

const TRUE_VALUES = ['', 'true', '1']
const FALSE_VALUES = ['false', '0']

// Convert a data- attribute value (always a string) to the type of the option, returns undefined if that is not possible
function parseDataValue(key, dataValue) {
  switch (typeof DEFAULTS[key]) {
    case 'number': {
      const number = Number.parseFloat(dataValue)
      return Number.isNaN(number) ? undefined : number
    }

    case 'boolean': {
      const value = dataValue.trim().toLowerCase()
      if (TRUE_VALUES.includes(value)) {
        return true
      }

      return FALSE_VALUES.includes(value) ? false : undefined
    }

    default: {
      return dataValue
    }
  }
}

// Returns a description of the problem if the value is not valid for the option or an empty string if it is
function getProblem(key, value, element) {
  const expectedType = typeof DEFAULTS[key]
  if (typeof value !== expectedType) {
    return `expected a ${expectedType} but got ${value === null ? 'null' : typeof value}`
  }

  if (expectedType === 'number' && !Number.isFinite(value)) {
    return 'expected a finite number'
  }

  if (OPTION_VALUES[key] && !OPTION_VALUES[key].includes(value)) {
    return `expected one of ${OPTION_VALUES[key].map(item => `"${item}"`).join(', ')}`
  }

  if (key.startsWith('class') && !/^\S+$/.test(value)) {
    return 'expected a single class name'
  }

  if (key.startsWith('selector')) {
    try {
      element.matches(value)
    } catch {
      return 'expected a valid CSS selector'
    }
  }

  return ''
}

function toAttributeName(key, dataKey) {
  return `data-${dataKey}-${key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}`
}

const Options = {
  /**
   * Build the options of an instance. Priority (highest first): data- attributes, `options`, DEFAULTS.
   * Unknown options and invalid values are reported in the console and ignored (the next lower priority value is used).
   */
  resolve(element, options, dataKey) {
    const resolved = { ...DEFAULTS }

    if (options && typeof options === 'object') {
      for (const key of Object.keys(options)) {
        if (options[key] === undefined) {
          continue
        }

        if (!Object.prototype.hasOwnProperty.call(DEFAULTS, key)) {
          Log.warn(`unknown option "${key}" (ignored).`)
          continue
        }

        const problem = getProblem(key, options[key], element)
        if (problem) {
          Log.warn(`invalid value for the option "${key}" (${problem}), using ${JSON.stringify(resolved[key])}.`)
        } else {
          resolved[key] = options[key]
        }
      }
    }

    for (const key of Object.keys(DEFAULTS)) {
      const dataValue = element.dataset[`${dataKey}${key.charAt(0).toUpperCase()}${key.slice(1)}`]
      if (dataValue !== undefined) {
        const value = parseDataValue(key, dataValue)
        const problem = value === undefined ? `cannot be converted to a ${typeof DEFAULTS[key]}` : getProblem(key, value, element)
        if (problem) {
          Log.warn(`invalid value "${dataValue}" for the attribute ${toAttributeName(key, dataKey)} (${problem}), using ${JSON.stringify(resolved[key])}.`)
        } else {
          resolved[key] = value
        }
      }
    }

    return resolved
  }
}

export default Options
