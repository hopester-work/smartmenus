/*
 * SmartMenus
 * http://www.smartmenus.org/
 * Copyright (c) since 2001 Vasil Dinkov, Vadikom Web Ltd. http://vadikom.com
 * Licensed MIT https://github.com/vadikom/smartmenus/blob/master/LICENSE-MIT
 */


const Log = {
  warn(message) {
    if (typeof console !== 'undefined' && typeof console.warn === 'function') {
      // eslint-disable-next-line no-console
      console.warn(`SmartMenus: ${message}`)
    }
  }
}

export default Log
