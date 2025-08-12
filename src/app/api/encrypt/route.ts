import { type NextRequest, NextResponse } from "next/server"
import { publicEncrypt, createHash } from "node:crypto"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const { publicKey } = await request.json()

    if (!publicKey) {
      return NextResponse.json({ error: "Public key is required" }, { status: 400 })
    }

    // Validate that the public key is in the correct format
    if (!publicKey.includes("-----BEGIN PUBLIC KEY-----") || !publicKey.includes("-----END PUBLIC KEY-----")) {
      return NextResponse.json(
        { error: "Invalid public key format. Please provide a PEM formatted RSA public key." },
        { status: 400 },
      )
    }

    const timestamp = new Date().toISOString()
    const hash = createHash("sha512").update(timestamp).digest("hex")

    try {
      await prisma.publicKey.create({
        data: {
          publicKey,
          hash,
        },
      })

      const secretMessage = `🎉 Congratulations! Your RSA encryption is working perfectly. This is your secret message!

Timestamp Hash: ${hash}
Generated at: ${timestamp}`;

      // Encrypt the message using the provided public key
      const encryptedBuffer = publicEncrypt(
        {
          key: publicKey,
          padding: 1, // OAEP padding
        },
        Buffer.from(secretMessage, "utf8"),
      );

      return new NextResponse(
        encryptedBuffer as unknown as ReadableStream<Uint8Array>,
        {
          headers: {
            "Content-Disposition": `attachment; filename="message.enc"`,
            "Content-Type": "application/octet-stream",
          },
        },
      );
    } catch (cryptoError) {
      console.error("Crypto error:", cryptoError)
      return NextResponse.json(
        { error: "Failed to encrypt message. Please check your public key format." },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error("Encryption error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
