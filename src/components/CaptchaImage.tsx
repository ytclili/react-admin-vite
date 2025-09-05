import React, { useEffect, useMemo, useRef, useState } from 'react'

export interface CaptchaImageProps {
  width?: number
  height?: number
  length?: number
  onVerify?: (passed: boolean) => void
}

function getRandomColor(alpha = 1) {
  const r = Math.floor(Math.random() * 256)
  const g = Math.floor(Math.random() * 256)
  const b = Math.floor(Math.random() * 256)
  return `rgba(${r},${g},${b},${alpha})`
}

function randomChars(length: number) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghjkmnpqrstuvwxyz'
  let s = ''
  for (let i = 0; i < length; i++) {
    s += chars[Math.floor(Math.random() * chars.length)]
  }
  return s
}

export const CaptchaImage: React.FC<CaptchaImageProps> = ({ width = 110, height = 38, length = 4, onVerify }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [code, setCode] = useState('')
  const [input, setInput] = useState('')
  const normalizedInput = useMemo(() => input.trim().toLowerCase(), [input])

  const draw = (text: string) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, width, height)

    // background
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, width, height)

    // noise lines
    for (let i = 0; i < 4; i++) {
      ctx.beginPath()
      ctx.moveTo(Math.random() * width, Math.random() * height)
      ctx.lineTo(Math.random() * width, Math.random() * height)
      ctx.strokeStyle = getRandomColor(0.6)
      ctx.lineWidth = 1
      ctx.stroke()
    }

    // text
    const charGap = width / (text.length + 1)
    for (let i = 0; i < text.length; i++) {
      const ch = text[i]
      const fontSize = 18 + Math.floor(Math.random() * 6)
      const angle = (Math.random() - 0.5) * 0.6
      ctx.save()
      ctx.translate(charGap * (i + 1), height / 2)
      ctx.rotate(angle)
      ctx.font = `${fontSize}px system-ui, -apple-system, Segoe UI, Roboto`
      ctx.fillStyle = getRandomColor(0.9)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(ch, 0, 0)
      ctx.restore()
    }

    // noise dots
    for (let i = 0; i < 20; i++) {
      ctx.fillStyle = getRandomColor(0.6)
      ctx.beginPath()
      ctx.arc(Math.random() * width, Math.random() * height, 1, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  const regenerate = () => {
    const text = randomChars(length)
    setCode(text)
    draw(text)
    setInput('')
    onVerify?.(false)
  }

  useEffect(() => {
    regenerate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const passed = normalizedInput.length === code.length && normalizedInput === code.toLowerCase()
    onVerify?.(passed)
  }, [normalizedInput, code, onVerify])

  return (
    <div className="captcha-image">
      <input
        className="captcha-input"
        maxLength={length}
        placeholder="输入验证码"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="captcha-canvas"
        onClick={regenerate}
      />
      <button type="button" className="captcha-refresh" onClick={regenerate} aria-label="刷新验证码">换一张</button>
    </div>
  )
}

export default CaptchaImage




