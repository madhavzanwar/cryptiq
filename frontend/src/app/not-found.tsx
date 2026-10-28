import Link from "next/link";

/** STUB (owned by the pages agent). */
export default function NotFound() {
  return (
    <div className="container-page section-gap">
      <h1 className="h-md">Page not found</h1>
      <Link href="/">Home</Link>
    </div>
  );
}
