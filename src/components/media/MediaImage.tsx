import Image, { type ImageProps } from "next/image";
import { normalizeImageSrc, shouldOptimizeImage } from "@/lib/image";

type Props = Omit<ImageProps, "src"> & {
  src: string;
};

/**
 * Storefront image wrapper: normalizes /catalog → /media and only skips
 * optimization for HEIC / unknown remotes.
 */
export function MediaImage({ src, alt, unoptimized, ...rest }: Props) {
  const normalized = normalizeImageSrc(src);
  const skip = unoptimized ?? !shouldOptimizeImage(normalized);
  return <Image src={normalized} alt={alt} unoptimized={skip} {...rest} />;
}
