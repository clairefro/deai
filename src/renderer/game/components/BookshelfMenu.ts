import { AllDirection, HexDirection } from "../../types";
import { DIRECTION_DISPLAY_NAMES } from "../constants";
import { Menu } from "./Menu";

export class BookshelfMenu extends Menu {
  private static instance: BookshelfMenu | null = null;
  private currentWall: number | null = null;
  private currentShelf: number | null = null;
  private currentBook: number | null = null;
  private currentPage: number = 1;

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
    console.log({ direction });
    const content = document.createElement("div");
    content.innerHTML = `
      <h2>Bookshelf - ${
        DIRECTION_DISPLAY_NAMES[direction as HexDirection]
      } wall</h2>
      <div class="bookshelf-content">
        <p>Someday you'll be able to read these books...</p>
      </div>
    `;

    this.setContent(content);
    this.toggle();
  }

  //   show(direction: string): void {
  //     const wallNumber = this.getWallNumber(direction);
  //     this.currentWall = wallNumber;

  //     const content = document.createElement("div");
  //     content.className = "bookshelf-view";

  //     if (this.currentBook !== null) {
  //       this.renderBookPages(content);
  //     } else if (this.currentShelf !== null) {
  //       this.renderBooks(content);
  //     } else {
  //       this.renderShelves(content);
  //     }

  //     this.setContent(content);
  //     this.toggle();
  //   }

  private renderShelves(container: HTMLElement): void {
    container.innerHTML = `
      <h2>Wall ${this.currentWall} - Shelves</h2>
      <div class="shelf-grid">
        ${Array.from(
          { length: 5 },
          (_, i) => `
          <button class="shelf-button" data-shelf="${i + 1}">
            Shelf ${i + 1}
          </button>
        `
        ).join("")}
      </div>
    `;

    container.querySelectorAll(".shelf-button").forEach((button) => {
      button.addEventListener(
        "click",
        (e) => {
          const shelf = parseInt(
            (e.target as HTMLElement).dataset.shelf || "1"
          );
          this.currentShelf = shelf;
          this.show(""); // Direction doesn't matter, we have currentWall
        },
        true
      );
    });
  }

  private renderBooks(container: HTMLElement): void {
    container.innerHTML = `
      <h2>Wall ${this.currentWall} - Shelf ${this.currentShelf}</h2>
      <button class="back-button">← Back to Shelves</button>
      <div class="book-grid">
        ${Array.from(
          { length: 32 },
          (_, i) => `
          <button class="book-button" data-book="${i + 1}">
            Book ${i + 1}
          </button>
        `
        ).join("")}
      </div>
    `;

    container.addEventListener("click", (e) => {
      e.stopPropagation();
    });

    container.querySelector(".back-button")?.addEventListener("click", (e) => {
      this.currentShelf = null;
      this.show("");
    });

    container.querySelectorAll(".book-button").forEach((button) => {
      button.addEventListener("click", (e) => {
        const book = parseInt((e.target as HTMLElement).dataset.book || "1");
        this.currentBook = book;
        this.currentPage = 1;
        this.show("");
      });
    });
  }

  private renderBookPages(container: HTMLElement): void {
    container.innerHTML = `
      <h2>Wall ${this.currentWall} - Shelf ${this.currentShelf} - Book ${
      this.currentBook
    }</h2>
      <button class="back-button">← Back to Books</button>
      <div class="page-view">
        <button class="prev-page" ${
          this.currentPage === 1 ? "disabled" : ""
        }>←</button>
        <div class="page-content">
          <h3>Page ${this.currentPage}</h3>
          <div class="page-text">
            Content for page ${this.currentPage}
          </div>
        </div>
        <button class="next-page">→</button>
      </div>
    `;

    container.addEventListener("click", (e) => {
      e.stopPropagation();
    });
    container.querySelector(".back-button")?.addEventListener("click", (e) => {
      this.currentBook = null;
      this.currentPage = 1;
      this.show("");
    });

    container.querySelector(".prev-page")?.addEventListener("click", (e) => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.show("");
      }
    });

    container.querySelector(".next-page")?.addEventListener("click", (e) => {
      this.currentPage++;
      this.show("");
    });
  }

  private getWallNumber(direction: string): number {
    const wallMap: Record<string, number> = {
      n: 1,
      ne: 2,
      se: 3,
      s: 4,
      sw: 5,
      nw: 6,
    };
    return wallMap[direction.toLowerCase()] || 1;
  }
}
