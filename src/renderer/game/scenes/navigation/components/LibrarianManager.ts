import { Librarian } from "../../../models/Librarian";
import { ActionManager } from "../../../actions/ActionManager";
import { WalkableMask } from "../../../components/WalkableMask";
import { ACTIONS } from "../../../constants";
import { pluck } from "../../../../../shared/util/pluck";

export class LibrarianManager {
  private librarians: Librarian[] = [];

  constructor(
    private scene: Phaser.Scene,
    private actionManager: ActionManager,
    private walkableMask?: WalkableMask
  ) {}

  async spawnRandom(): Promise<void> {
    await this.clearExisting();

    const librarianIds = await window.electronAPI.getLibrarianIds();
    const randomId = pluck(librarianIds);

    const librarian = await Librarian.loadLibrarianById(this.scene, randomId);
    if (!librarian) return;

    const pos = this.walkableMask?.getRandomWalkablePosition();
    if (pos) {
      await this.spawnLibrarian(librarian, pos);
    }
  }

  private async spawnLibrarian(
    librarian: Librarian,
    pos: { x: number; y: number }
  ): Promise<void> {
    await librarian.spawn(pos.x, pos.y);
    this.librarians.push(librarian);
    this.addChatAction(librarian);
  }

  private async clearExisting(): Promise<void> {
    this.librarians.forEach((librarian) => {
      const chatActionKey = `${
        ACTIONS.PREFIX_LIBRIAN_CHAT
      }${librarian.getId()}`;
      this.actionManager.removeAction(chatActionKey);
      librarian.destroy();
    });
    this.librarians = [];
  }

  private addChatAction(librarian: Librarian): void {
    this.actionManager.addAction({
      target: librarian.getActionTarget(),
      range: 100,
      key: `${ACTIONS.PREFIX_LIBRIAN_CHAT}${librarian.getId()}`,
      getLabel: () => `<Enter> Chat with ${librarian.getDisplayName()}`,
      action: () => librarian.chat(),
    });
  }

  setWalkableMask(mask: WalkableMask): void {
    this.walkableMask = mask;
  }

  destroy(): void {
    this.clearExisting();
  }

  getLibrarians(): Librarian[] {
    return [...this.librarians];
  }

  hasLibrarians(): boolean {
    return this.librarians.length > 0;
  }

  async _dev_generateLibrarians(names: string[]): Promise<void> {
    console.log("GENERATING LIBRARIANS...");
    console.log("// Generated Librarians for librarians.json:");
    console.log("[");
    for (const name of names) {
      try {
        const librarian = new Librarian({
          name,
          scene: this.scene,
        });
        await librarian.spawn(
          this.scene.cameras.main.width / 2,
          this.scene.cameras.main.height / 2
        );

        const data = librarian.serialize();
        console.log({ data });
        console.log(JSON.stringify(data, null, 2) + ",");

        // clean up after generation
        // librarian.destroy();
      } catch (e: any) {
        console.error(`Error while generating ${name}:`, e.message);
      }
    }

    console.log("// done");
  }
}
