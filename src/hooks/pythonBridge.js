import { useState, useEffect } from 'react'

export function usePythonState(propName) {
  const [propValue, setPropValue] = useState()

  useEffect(() => {
    window.addEventListener('pywebviewready', function() {
      if (!window.pywebview.state) {
        window.pywebview.state = {}
      }
      window.pywebview.state[`set_${propName}`] = setPropValue
    })
  }, [])

  return propValue
}

export async function usePythonApi(apiName, apiContent) {
  window.pywebview.api = window.pywebview.api || {}
  if (apiContent) {
    return await window.pywebview.api[apiName](apiContent)
  } else {
    return await window.pywebview.api[apiName]()
  }
}
