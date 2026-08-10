import Image from "next/image";

import { LOGO } from "@/lib/constants";

/**
 * The bare squib head — the brand mark. Used for the wordmark, the ambient
 * peeking moment and anywhere a decorative squib is needed. Always decorative:
 * if it carries meaning, pass a real `alt` instead of using this.
 */
export default function SquibHead({
  className = "",
  size = 96,
  priority,
  alt = "",
}: {
  className?: string;
  size?: number;
  priority?: boolean;
  alt?: string;
}) {
  return (
    <Image
      src={LOGO.mark}
      alt={alt}
      aria-hidden={alt === "" || undefined}
      width={size}
      height={size}
      priority={priority}
      className={className}
    />
  );
}
