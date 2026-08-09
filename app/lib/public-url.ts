export function withPublicOrigin(value: string, publicOrigin: string) {
  try {
    const url = new URL(value, publicOrigin);
    const origin = new URL(publicOrigin).origin;
    return `${origin}${url.pathname}${url.search}${url.hash}`;
  } catch {
    return value;
  }
}
