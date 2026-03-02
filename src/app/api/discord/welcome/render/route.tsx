import { NextRequest } from "next/server";
import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);

        const username = searchParams.get("username") || "Guest";
        const avatarUrl = searchParams.get("avatar") || "https://cdn.discordapp.com/embed/avatars/0.png";
        const guildName = searchParams.get("guildName") || "Server";

        const bgUrl = searchParams.get("bg_url") || "";
        const bgColor = searchParams.get("bg_color") || "#1a1b1e";
        const textColor = searchParams.get("text_color") || "#ffffff";
        const titleTemplate = searchParams.get("title") || "¡Bienvenido/a {user}!";
        const subtitleTemplate = searchParams.get("subtitle") || "Esperamos que disfrutes tu estancia";
        const overlayOpacity = parseFloat(searchParams.get("overlay") || "0.5");

        const title = titleTemplate.replace("{user}", username).replace("{guild}", guildName);
        const subtitle = subtitleTemplate.replace("{user}", username).replace("{guild}", guildName);

        const cardStyle = {
            width: "1200px",
            height: "500px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: bgColor,
            position: "relative",
            overflow: "hidden",
            fontFamily: "sans-serif",
            textAlign: "center",
        } as React.CSSProperties;

        return new ImageResponse(
            (
                <div style={cardStyle}>
                    {bgUrl ? (
                        <>
                            {/* Background image */}
                            <img
                                src={bgUrl}
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                }}
                            />
                            {/* Dark Overlay */}
                            <div
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    width: "100%",
                                    height: "100%",
                                    backgroundColor: "rgba(0,0,0,1)",
                                    opacity: overlayOpacity,
                                }}
                            />
                        </>
                    ) : (
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                backgroundColor: "rgba(0,0,0,1)",
                                opacity: overlayOpacity,
                            }}
                        />
                    )}

                    {/* Avatar Container */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "200px",
                            height: "200px",
                            borderRadius: "100%",
                            border: "8px solid rgba(255, 255, 255, 0.2)",
                            marginBottom: "30px",
                            overflow: "hidden",
                            zIndex: 10,
                            boxShadow: "0px 10px 40px rgba(0,0,0,0.5)",
                            backgroundColor: "rgba(0,0,0,0.5)"
                        }}
                    >
                        <img
                            src={avatarUrl}
                            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "100%" }}
                        />
                    </div>

                    {/* Text content */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 10 }}>
                        <div
                            style={{
                                color: textColor,
                                fontSize: "60px",
                                fontWeight: 900,
                                textTransform: "uppercase",
                                marginBottom: "15px",
                                textShadow: "0px 4px 15px rgba(0,0,0,0.8)",
                            }}
                        >
                            {title}
                        </div>
                        <div
                            style={{
                                color: textColor,
                                fontSize: "30px",
                                fontWeight: 600,
                                textTransform: "uppercase",
                                letterSpacing: "5px",
                                opacity: 0.8,
                                textShadow: "0px 2px 10px rgba(0,0,0,0.8)",
                            }}
                        >
                            {subtitle}
                        </div>
                    </div>
                </div>
            ),
            {
                width: 1200,
                height: 500,
            }
        );
    } catch (e: any) {
        return new Response(`Error: ${e.message}`, { status: 500 });
    }
}
