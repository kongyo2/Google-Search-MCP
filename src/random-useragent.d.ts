declare module "random-useragent" {
  export function getRandom(): string;
  export function getRandom(filter?: (ua: string) => boolean): string;
}