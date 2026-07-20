import Image from "next/image";
import { cn } from "@/lib/utils";
import type { StandardLogoId } from "@/features/learning/lib/standards-links";

type Props = {
  readonly id: StandardLogoId;
  readonly className?: string;
};

/** Wordmark in /public/images/logos/ — swap files for official artwork. */
export function StandardLogo({ id, className }: Props) {
  return (
    <Image
      src={`/images/logos/${id}.svg`}
      alt=""
      width={72}
      height={16}
      className={cn("h-5 w-auto max-w-[4.75rem] shrink-0 object-contain object-left dark:invert", className)}
    />
  );
}
