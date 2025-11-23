'use client'

import { useState, useEffect } from 'react'

interface TurtleWalkerProps {
  onClick?: () => void
}

const FRAMES = [
  '/turtle-frame-1.png',
  '/turtle-frame-2.png',
  '/turtle-frame-3.png',
  '/turtle-frame-4.png',
  '/turtle-frame-5.png',
  '/turtle-frame-6.png',
  '/turtle-frame-7.png',
  '/turtle-frame-8.png',
  '/turtle-frame-9.png',
  '/turtle-frame-10.png',
  '/turtle-frame-11.png',
  '/turtle-frame-12.png',
]

export function TurtleWalker({ onClick }: TurtleWalkerProps) {
  const [currentFrame, setCurrentFrame] = useState(0)
  const [imagesLoaded, setImagesLoaded] = useState(false)

  // Preload all frames first
  useEffect(() => {
    let loadedCount = 0
    FRAMES.forEach((src) => {
      const img = new Image()
      img.onload = () => {
        loadedCount++
        if (loadedCount === FRAMES.length) {
          setImagesLoaded(true)
        }
      }
      img.src = src
    })
  }, [])

  // Animate through frames for walking effect
  useEffect(() => {
    if (!imagesLoaded) return

    const frameInterval = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % FRAMES.length)
    }, 450) // Change frame every 450ms - slower, smoother walking

    return () => clearInterval(frameInterval)
  }, [imagesLoaded])

  if (!imagesLoaded) {
    return (
      <div className="turtle-track">
        <div className="turtle-button-sprite">
          <img
            src="/robot-rua.png?v=2"
            alt="Loading..."
            className="turtle-walk-sprite"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="turtle-track">
      <button
        onClick={onClick}
        className="turtle-button-sprite"
        aria-label="Click to chat with Huy Rùa"
        title="Chat with Huy Rùa 🐢"
      >
        {/* Stack all frames, only show current one - prevents flickering */}
        <div className="turtle-frames-stack">
          {FRAMES.map((src, index) => (
            <img
              key={src}
              src={src}
              alt="Huy Rùa AI Mascot"
              className="turtle-walk-sprite"
              style={{
                opacity: index === currentFrame ? 1 : 0,
                position: index === 0 ? 'relative' : 'absolute',
                top: 0,
                left: 0,
              }}
              draggable={false}
            />
          ))}
        </div>
        <div className="turtle-shadow" />
      </button>
    </div>
  )
}
