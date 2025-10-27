"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const locales = [
  { code: "es", label: "Español" },
  { code: "en", label: "English" }
];

export default function LocaleSwitcher() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  if (!pathname) {
    return null;
  }

  const cleanedPath = pathname.replace(/^\/(es|en)/, "");
  const queryString = searchParams.toString();
  const suffix = queryString ? `?${queryString}` : "";

  return (
    <div>
      <strong>Idioma:</strong>
      <nav>
        {locales.map((locale) => (
          <Link
            key={locale.code}
            href={`/${locale.code}${cleanedPath}${suffix}`}
            style={{ marginRight: "0.75rem" }}
          >
            {locale.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
