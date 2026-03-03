import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt =
  "Gemhog — We listen to investment podcasts so you don't have to";

const urbanistBold = readFileSync(
  join(process.cwd(), "src/app/_fonts/Urbanist-Bold.ttf"),
);
const dmSansRegular = readFileSync(
  join(process.cwd(), "src/app/_fonts/DM_Sans-Regular.ttf"),
);

export default function OgImage() {
  return new ImageResponse(
    <div
      style={{
        width: 1200,
        height: 630,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#F5F5F0",
        padding: "60px 80px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "auto",
        }}
      >
        <span
          style={{
            color: "#0D9488",
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: "0.15em",
            fontFamily: "Urbanist",
            textTransform: "uppercase",
          }}
        >
          GEMHOG
        </span>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            fontSize: 72,
            fontWeight: 700,
            fontFamily: "Urbanist",
            textTransform: "uppercase",
            lineHeight: 1.05,
            letterSpacing: "-1px",
            marginBottom: 32,
          }}
        >
          <span style={{ color: "#1C1C1C" }}>We listen to&nbsp;</span>
          <span style={{ color: "#0D9488" }}>investment podcasts&nbsp;</span>
          <span style={{ color: "#1C1C1C" }}>so you don't have to</span>
        </div>

        <div
          style={{
            display: "flex",
            color: "#555555",
            fontSize: 28,
            fontFamily: "DM Sans",
            lineHeight: 1.5,
          }}
        >
          Expert claims surfaced and clustered — so you can make better
          decisions.
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          borderTop: "1px solid #C8C4BB",
          paddingTop: 24,
          marginTop: 40,
        }}
      >
        <span
          style={{
            color: "#555555",
            fontSize: 16,
            fontFamily: "DM Sans",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          Podcast Intelligence
        </span>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        {
          name: "Urbanist",
          data: urbanistBold,
          style: "normal",
          weight: 700,
        },
        {
          name: "DM Sans",
          data: dmSansRegular,
          style: "normal",
          weight: 400,
        },
      ],
    },
  );
}
