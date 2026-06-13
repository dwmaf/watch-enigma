import type { SVGProps } from "react";

type IconName = "book" | "home";

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
}

export default function Icon({ name, ...props }: IconProps) {
  switch (name) {
    case "book":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 512 512"
          fill="none"
          {...props}
        >
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={32}
            d="M256 160c16-63.16 76.43-95.41 208-96a15.94 15.94 0 0 1 16 16v288a16 16 0 0 1-16 16c-128 0-177.45 25.81-208 64c-30.37-38-80-64-208-64c-9.88 0-16-8.05-16-17.93V80a15.94 15.94 0 0 1 16-16c131.57.59 192 32.84 208 96m0 0v288"
          />
        </svg>
      );

    case "home":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          {...props}
        >
          <path
            d="M3 10L12 3L21 10"
            stroke="currentColor"
            strokeWidth={2}
          />
          <path
            d="M5 10V21H19V10"
            stroke="currentColor"
            strokeWidth={2}
          />
        </svg>
      );

    default:
      return null;
  }
}