import Image from "next/image";

export default function Logo({
  size = 32,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src="/logo-icon.png"
      alt="SERENO"
      width={size}
      height={size}
      className={`shrink-0 rounded-2xl ${className}`}
      style={{ height: size, width: size }}
    />
  );
}
