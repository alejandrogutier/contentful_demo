import Link from "next/link";

import { getNavigation } from "@/lib/contentful";

type Props = {
  locale: string;
};

export default async function NavigationMenu({ locale }: Props) {
  const items = await getNavigation(locale);

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <nav className="main-nav">
      <div className="main-nav__logo">
        <Link href={`/${locale}/demo-home`}>Construtech Dentsu</Link>
      </div>
      <ul className="main-nav__list">
        {items.map((item: any) => {
          const slug = item?.fields?.slug;
          const label = item?.fields?.label ?? slug;
          if (!slug || !label) {
            return null;
          }
          return (
            <li key={item.sys?.id ?? slug}>
              <Link href={`/${locale}/${slug}`}>{label}</Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
