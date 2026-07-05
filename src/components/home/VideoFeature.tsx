"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, Play } from "lucide-react";

interface VideoFeatureProps {
  videoId: string;
  title: string;
}

/**
 * VideoFeature
 *
 * 视频 facade 模式 + IntersectionObserver 自动播放：
 * 1. 初始渲染只显示缩略图 + 播放按钮（轻量、不加载 YouTube iframe）。
 * 2. 当容器进入视口（IntersectionObserver，threshold 0.4）时自动激活，
 *    以 autoplay=1&mute=1&loop=1&playlist=<id> 加载 iframe 实现静音循环自动播放。
 * 3. 保留点击播放按钮作为后备：用户点击播放按钮也会立即激活 iframe。
 * 4. "Watch on YouTube" 外链始终保留，作为可跳出观看的后备入口。
 */
export function VideoFeature({ videoId, title }: VideoFeatureProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activated, setActivated] = useState(false);

  const watchUrl = useMemo(
    () => `https://www.youtube.com/watch?v=${videoId}`,
    [videoId],
  );

  // 缩略图 facade：先尝试 maxres，回退 hqdefault
  const thumbnailUrl = useMemo(
    () => `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
    [videoId],
  );

  // loop=1 在 YouTube embed 中需要附带 playlist=<videoId> 才生效
  const embedUrl = useMemo(
    () =>
      `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&playsinline=1&rel=0`,
    [videoId],
  );

  useEffect(() => {
    if (activated) return;
    const node = containerRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActivated(true);
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.4 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [activated]);

  return (
    <div className="space-y-4">
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-lg bg-black/40"
        style={{ paddingBottom: "56.25%" }}
      >
        {activated ? (
          <iframe
            className="absolute top-0 left-0 h-full w-full"
            src={embedUrl}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setActivated(true)}
            aria-label={`Play ${title}`}
            className="group absolute inset-0 h-full w-full"
          >
            {/* 缩略图 facade */}
            <img
              src={thumbnailUrl}
              alt={title}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
              onError={(e) => {
                const img = e.currentTarget;
                if (!img.src.includes("hqdefault.jpg")) {
                  img.src = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
                }
              }}
            />
            <span
              className="absolute inset-0 bg-black/30 transition-opacity group-hover:bg-black/20"
              aria-hidden="true"
            />
            {/* 播放按钮（点击后备 + 视觉提示） */}
            <span
              className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full
                         bg-[hsl(var(--nav-theme))] text-white shadow-lg transition-transform duration-300 group-hover:scale-110"
              aria-hidden="true"
            >
              <Play className="ml-1 h-7 w-7 fill-current" />
            </span>
          </button>
        )}
      </div>

      <div className="flex justify-center">
        <a
          href={watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
        >
          Watch on YouTube
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
