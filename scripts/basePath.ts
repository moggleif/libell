// The path the app is served under (#672). Libell lives at the root of its
// own domain, so the default is "/". The deploy workflow passes the base path
// GitHub Pages reports (`actions/configure-pages`): "" once the custom domain
// is set, "/libell" while the site is still a project site. Every build and
// every script that opens the built app reads it through here.
export function basePath(): string {
  return toBasePath(process.env.BASE_PATH);
}

export function toBasePath(raw: string | undefined): string {
  const trimmed = (raw ?? '').trim().replace(/^\/+|\/+$/g, '');
  return trimmed === '' ? '/' : `/${trimmed}/`;
}
