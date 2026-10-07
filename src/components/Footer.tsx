import { websiteUrl } from "../hub/config";

/** Slim footer in the Internet Banking style. Legal pages live on the website. */
export function Footer() {
  const links = [
    ["Privacy", "/privacy-policy"],
    ["Terms", "/terms-of-service"],
    ["Disclosures", "/disclosures"],
    ["Contact", "/contact"],
  ];
  return (
    <footer className="mt-12 border-t">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} Citizen Digital Ltd. Citizen Bank is an applicant for a banking licence from the Central Bank of
          Lesotho and does not yet carry on banking business.
        </p>
        <nav className="flex gap-4" aria-label="Legal">
          {links.map(([label, path]) => (
            <a key={path} href={websiteUrl(path)} className="hover:text-foreground">{label}</a>
          ))}
        </nav>
      </div>
    </footer>
  );
}

export default Footer;
