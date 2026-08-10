import type { TaskId } from "@/lib/types";

const P = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function XLogo({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden focusable="false">
      <path
        fill="currentColor"
        d="M18.9 2.5h3.4l-7.4 8.5 8.7 11.5h-6.8l-5.3-7-6.1 7H1.9l7.9-9.1L1.5 2.5h7l4.8 6.3 5.6-6.3Zm-1.2 18h1.9L7.4 4.4H5.4l12.3 16.1Z"
      />
    </svg>
  );
}

export function TaskIcon({
  id,
  className = "h-[18px] w-[18px]",
}: {
  id: TaskId;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden focusable="false">
      {id === "follow" ? (
        <g {...P}>
          <circle cx="10" cy="8.5" r="3.8" />
          <path d="M3.6 20.2a6.8 6.8 0 0 1 12.8 0" />
          <path d="M19 7.5v5M16.5 10h5" />
        </g>
      ) : null}
      {id === "like" ? (
        <path
          {...P}
          d="M12 20.2S3.8 15.4 3.8 9.9A4.3 4.3 0 0 1 12 8.1a4.3 4.3 0 0 1 8.2 1.8c0 5.5-8.2 10.3-8.2 10.3Z"
        />
      ) : null}
      {id === "retweet" ? (
        <g {...P}>
          <path d="M5 8.5h11.5a3 3 0 0 1 3 3v1.7" />
          <path d="M8 5.4 4.9 8.5 8 11.6" />
          <path d="M19 15.5H7.5a3 3 0 0 1-3-3v-1.7" />
          <path d="M16 18.6l3.1-3.1L16 12.4" />
        </g>
      ) : null}
      {id === "quote" ? (
        <g {...P}>
          <path d="M4.5 19.5V7.2a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v7.6a2 2 0 0 1-2 2H8.2L4.5 19.5Z" />
          <path d="M9 9.6c-1.4.5-2 1.5-2 2.9h2v2.1M15 9.6c-1.4.5-2 1.5-2 2.9h2v2.1" />
        </g>
      ) : null}
    </svg>
  );
}

export function ExternalIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden focusable="false">
      <g {...P}>
        <path d="M14 4.5h5.5V10" />
        <path d="M19.5 4.5 11 13" />
        <path d="M18 14.5v4a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6h4" />
      </g>
    </svg>
  );
}

export function FlameIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden focusable="false">
      <path
        fill="currentColor"
        d="M13.2 2.2c.4 3-1.1 4.6-2.6 6.1-1.6 1.6-3.2 3.1-3.2 6.1a6.6 6.6 0 0 0 13.2 0c0-3.6-2.3-5.6-4.1-8.2-.8-1.1-2.4-2.9-3.3-4Zm-1 12.1c.2 1.4-.5 2.1-1.2 2.8-.7.7-1.5 1.4-1.5 2.8a2.9 2.9 0 0 0 5.8 0c0-1.7-1.1-2.6-1.9-3.8-.4-.5-1.1-1.3-1.2-1.8Z"
      />
    </svg>
  );
}
