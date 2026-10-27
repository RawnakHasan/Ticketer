import type { SVGProps } from "react";

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="1.5 1.5 29 29" aria-hidden="true" {...props}>
      <path
        className="fill-primary"
        d="M5 6h22a2 2 0 0 1 2 2v4.5a3.5 3.5 0 0 0 0 7V24a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4.5a3.5 3.5 0 0 0 0-7V8a2 2 0 0 1 2-2z"
      />
      <path
        className="stroke-on-primary"
        d="M21 8.5v15"
        fill="none"
        strokeWidth={1.8}
        strokeDasharray="2 2.6"
      />
      <circle className="fill-on-primary" cx="12" cy="16" r="3.6" />
    </svg>
  );
}
