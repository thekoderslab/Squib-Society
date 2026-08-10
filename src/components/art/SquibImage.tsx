import Image from "next/image";

import type { Squib } from "@/lib/types";
import SquibArt from "./SquibArt";

/**
 * The photo/vector seam. Everywhere a squib is displayed goes through here, so
 * dropping the real studio shots into /public/squibs and filling in `photo` on
 * each squib in mock-api.ts is the entire swap.
 */
export default function SquibImage({
  squib,
  className,
  priority,
}: {
  squib: Squib;
  className?: string;
  priority?: boolean;
}) {
  const alt = `${squib.name}, a squib dressed as a ${squib.role.toLowerCase()}`;

  if (squib.photo) {
    return (
      <Image
        src={squib.photo}
        alt={alt}
        width={1000}
        height={1000}
        priority={priority}
        className={className}
      />
    );
  }

  return <SquibArt variant={squib.variant} label={alt} className={className} />;
}
