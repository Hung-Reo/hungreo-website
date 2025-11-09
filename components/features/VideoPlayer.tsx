'use client'

interface VideoPlayerProps {
  videoId: string
  title: string
}

export function VideoPlayer({ videoId, title }: VideoPlayerProps) {
  return (
    <div className="relative aspect-video overflow-hidden rounded-lg bg-slate-900 shadow-lg">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?rel=0`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="absolute inset-0 h-full w-full"
      />
    </div>
  )
}
