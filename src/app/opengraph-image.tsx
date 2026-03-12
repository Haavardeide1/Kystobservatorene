import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import path from "path";

export const alt = "Kystobservatørene";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const [bgBuffer, logoBuffer] = await Promise.all([
    readFile(path.join(process.cwd(), "public/bildemobil.jpg")),
    readFile(path.join(process.cwd(), "public/norce-logo.png")),
  ]);

  const bgSrc = `data:image/jpeg;base64,${bgBuffer.toString("base64")}`;
  const logoSrc = `data:image/png;base64,${logoBuffer.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "1200px",
          height: "630px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Bakgrunnsbilde */}
        <img
          src={bgSrc}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
        {/* Mørkt overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(7, 11, 47, 0.58)",
            display: "flex",
          }}
        />
        {/* Innhold */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            padding: "64px",
          }}
        >
          <img
            src={logoSrc}
            style={{ width: "130px", marginBottom: "28px", objectFit: "contain" }}
          />
          <div
            style={{
              fontSize: "58px",
              fontWeight: 900,
              color: "white",
              textTransform: "uppercase",
              letterSpacing: "-2px",
              lineHeight: 1,
            }}
          >
            Kystobservatørene
          </div>
          <div
            style={{
              fontSize: "26px",
              color: "rgba(255, 255, 255, 0.75)",
              marginTop: "18px",
            }}
          >
            Du ser havet. Vi analyserer det.
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
