"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "cn";

/** Story-style media: stacked frames, a top progress bar per frame, and
 * left/right tap zones to page through them. Shared by the Feed's
 * full-bleed product slide and the product-detail gallery (plan decision 2
 * — multiple real placeholder frames, no video). */
export function FeedStoryMedia({
  images,
  alt,
  priority = false,
  progressClassName,
  className,
}: {
  images: { url: string; alt: string }[];
  alt: string;
  priority?: boolean;
  progressClassName?: string;
  className?: string;
}) {
  const frames = images.length > 0 ? images : [{ url: "/products/garment.svg", alt }];
  const [index, setIndex] = useState(0);
  const atFirst = index === 0;
  const atLast = index === frames.length - 1;

  return (
    <div className={cn("relative overflow-hidden bg-muted", className)}>
      <Image
        src={frames[index].url}
        alt={frames[index].alt || alt}
        fill
        priority={priority}
        sizes="100vw"
        className="object-cover"
      />

      {frames.length > 1 && (
        <div className={cn("absolute inset-x-4 top-[52px] flex gap-1", progressClassName)} aria-label={`Image ${index + 1} of ${frames.length}`}>
          {frames.map((_, i) => (
            <span
              key={i}
              className={cn("h-0.5 flex-1 rounded-full", i <= index ? "bg-white" : "bg-white/30")}
            />
          ))}
        </div>
      )}

      {frames.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous image"
            disabled={atFirst}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            className="absolute inset-y-0 left-0 w-1/2"
          />
          <button
            type="button"
            aria-label="Next image"
            disabled={atLast}
            onClick={() => setIndex((i) => Math.min(frames.length - 1, i + 1))}
            className="absolute inset-y-0 right-0 w-1/2"
          />
        </>
      )}
    </div>
  );
}
