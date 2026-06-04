import { useEffect, useRef, useState } from 'react'

export default function AnimatedNumber({ value, decimals = 0, suffix = '', duration = 900 }) {
  const [display, setDisplay] = useState(0)
  const raf = useRef()
  const from = useRef(0)

  useEffect(() => {
    const start = performance.now()
    const startVal = from.current
    const end = Number(value) || 0
    cancelAnimationFrame(raf.current)

    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(startVal + (end - startVal) * eased)
      if (t < 1) raf.current = requestAnimationFrame(tick)
      else from.current = end
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [value, duration])

  return (
    <>
      {display.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </>
  )
}
