import { COLLECTION_NAME } from "@/lib/constants";
import SquibHead from "./art/SquibHead";

/** Logo lockup: the squib head as the mark, the name in the display face. */
export default function Wordmark({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <SquibHead
        size={64}
        priority
        className={compact ? "h-8 w-8 shrink-0" : "h-9 w-9 shrink-0"}
      />
      <span
        className={`font-display font-semibold tracking-tightest ${
          compact ? "text-[17px]" : "text-lg"
        }`}
      >
        {COLLECTION_NAME}
      </span>
    </span>
  );
}
