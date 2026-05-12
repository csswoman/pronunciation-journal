declare module "hyphen/en" {
  export interface HyphenateOptions {
    hyphenChar?: string;
  }

  export function hyphenate(word: string, options?: HyphenateOptions): Promise<string>;
}
