declare global {
  interface HTMLElement {
    empty(): void;
    addClass(className: string): void;
    removeClass(className: string): void;
    toggleClass(className: string, toggle?: boolean): void;
    setCssProps(props: Record<string, string | number>): void;
    appendText(text: string): void;
    createEl<K extends keyof HTMLElementTagNameMap>(
      tag: K,
      options?: Record<string, any>
    ): HTMLElementTagNameMap[K];
  }
}

export {}; 