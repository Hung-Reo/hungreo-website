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
    }, 350) // Change frame every 350ms - smoother walking with 12 frames

    return () => clearInterval(frameInterval)
  }, [imagesLoaded])

  if (!imagesLoaded) {
    return (
      <div className="turtle-track">
        <div className="turtle-button-sprite">
          <img
            src="/robot-rua.png"
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
        <img
          key={currentFrame}
          src={FRAMES[currentFrame]}
          alt="Huy Rùa AI Mascot"
          className="turtle-walk-sprite"
          draggable={false}
        />
        <div className="turtle-shadow" />
      </button>
    </div>
  )
}
