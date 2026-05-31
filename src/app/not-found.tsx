import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container" style={{ textAlign: "center", padding: "4rem 1rem" }}>
      <h1 style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>404</h1>
      <p style={{ color: "var(--muted)", marginBottom: "1.5rem" }}>
        That page doesn&apos;t exist. Let&apos;s get back to making scroll-stopping thumbnails.
      </p>
      <Link href="/" className="btn primary">Go to ThumbSnare</Link>
    </div>
  );
}
