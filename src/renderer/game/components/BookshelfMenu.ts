import { Menu } from "./Menu";

export class BookshelfMenu extends Menu {
  private static instance: BookshelfMenu | null = null;

  private constructor() {
    super("bookshelf-menu");
  }

  static initialize(): BookshelfMenu {
    if (!this.instance) {
      this.instance = new BookshelfMenu();
    }
    return this.instance;
  }

  static getInstance(): BookshelfMenu | null {
    return this.instance;
  }

  show(direction: string): void {
    const content = document.createElement("div");
    content.innerHTML = `
      <h2>Bookshelf - ${direction} Wall</h2>
      <div class="bookshelf-content">
        <p>Browse the books on this wall...</p>
      </div>
    `;

    this.setContent(content);
    this.toggle();
  }
}
