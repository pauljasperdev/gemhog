import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

const fontData = readFileSync(
  join(process.cwd(), "src/app/_fonts/Urbanist-Bold.ttf"),
);

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: 32,
        height: 32,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F5F5F0",
      }}
    >
      <span
        style={{
          color: "#0D9488",
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: "-0.5px",
          fontFamily: "Urbanist",
        }}
      >
        GH
      </span>
    </div>,
    {
      ...size,
      fonts: [
        {
          name: "Urbanist",
          data: fontData,
          style: "normal",
          weight: 700,
        },
      ],
    },
  );
}
