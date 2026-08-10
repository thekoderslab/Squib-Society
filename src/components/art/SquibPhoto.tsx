import Image from "next/image";

import type { Squib } from "@/lib/types";

/**
 * Every squib render on the site goes through here, so alt text, intrinsic
 * size and the `sizes` hint stay consistent. The source files are 1200²
 * renders — always pass a real `sizes` so Next doesn't ship the full-size
 * image to a 90px vault tile.
 */
export default function SquibPhoto({
  squib,
  sizes,
  className = "",
  priority,
}: {
  squib: Squib;
  sizes: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={squib.photo}
      alt={`${squib.name}, a squib dressed as a ${squib.role.toLowerCase()}`}
      width={1200}
      height={1200}
      sizes={sizes}
      priority={priority}
      className={className}
    />
  );
}
