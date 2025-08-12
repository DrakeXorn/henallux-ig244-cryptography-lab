import { type NextRequest, NextResponse } from "next/server"
import { publicEncrypt, createHash } from "node:crypto"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const { publicKey } = await request.json()

    if (!publicKey) {
      return NextResponse.json({ error: "Clé publique requise" }, { status: 400 })
    }

    // Validate that the public key is in the correct format
    if (!publicKey.includes("-----BEGIN PUBLIC KEY-----") || !publicKey.includes("-----END PUBLIC KEY-----")) {
      return NextResponse.json(
        { error: "Le format de la clé publique est invalide. Veuillez fournir une clé publique RSA au format PEM." },
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

      const secretMessage = `Voici le contenu du message:
Pinguinum lorem ipsum dolor pinguinor sit amet, pinguinorum consectetur adipiscing elit. Vivamus pinguinatus lectus, pinguinellus vel pinguinorum et, tincidunt pinguinicus nulla. Ut pinguinibus arcu, bibendum pinguini sapien. Sed pinguinator purus, porta pinguini hendrerit non, aliquet pinguinibus elit. Cras pinguinibus orci ac felis pinguinellus fermentum.

Hash: ${hash}
Généré à: ${timestamp}`;

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
        { error: "Une erreur s'est produite lors du chiffrement du message. Veuillez vérifier le format de votre clé publique." },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error("Encryption error:", error)
    return NextResponse.json({ error: "Une erreur est survenue lors du chiffrement. Veuillez contacter le mainteneur du site pour plus d'informations" }, { status: 500 })
  }
}
