import Image from "next/image";
import {
  FLAT_TOP_COVER_ALT,
  FLAT_TOP_COVER_IMAGE,
} from "@/features/learning/lib/course-images";
import { cn } from "@/lib/utils";

type Props = {
  readonly className?: string;
  readonly imageClassName?: string;
  readonly priority?: boolean;
  readonly fill?: boolean;
  readonly sizes?: string;
};

type SlideImageProps = {
  readonly src: string;
  readonly alt: string;
  readonly className?: string;
  readonly imageClassName?: string;
  readonly priority?: boolean;
  readonly sizes?: string;
};

export function SlidePanelImage({
  src,
  alt,
  className,
  imageClassName,
  priority = false,
  sizes = "50vw",
}: SlideImageProps) {
  return (
    <div className={cn("relative min-h-0 overflow-hidden", className)}>
      <Image
        src={src}
        alt={alt}
        fill
        className={cn("object-cover object-center", imageClassName)}
        priority={priority}
        sizes={sizes}
      />
    </div>
  );
}

export function CourseCoverImage({
  className,
  imageClassName,
  priority = false,
  fill = false,
  sizes,
}: Props) {
  if (fill) {
    return (
      <div className={cn("relative overflow-hidden", className)}>
        <Image
          src={FLAT_TOP_COVER_IMAGE}
          alt={FLAT_TOP_COVER_ALT}
          fill
          className={cn("object-cover object-center", imageClassName)}
          priority={priority}
          sizes={sizes ?? "100vw"}
        />
      </div>
    );
  }

  return (
    <Image
      src={FLAT_TOP_COVER_IMAGE}
      alt={FLAT_TOP_COVER_ALT}
      width={1600}
      height={1067}
      className={cn("h-auto w-full object-cover object-center", className, imageClassName)}
      priority={priority}
      sizes={sizes}
    />
  );
}
