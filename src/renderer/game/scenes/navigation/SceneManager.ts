import { NavigationManager } from "./NavigationManager";
import { Location } from "../../../types";

export class SceneManager {
  private scene: Phaser.Scene;
  private navigationManager: NavigationManager;
  private librarianState: Map<string, any> = new Map();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.navigationManager = new NavigationManager();

    // Listen for location changes
    this.navigationManager.on(
      "locationChanged",
      this.handleLocationChange.bind(this)
    );
  }

  private async handleLocationChange(location: Location) {
    // Save current scene state
    this.saveSceneState();

    // Transition to appropriate scene
    await this.transitionToScene(location);
  }

  private async transitionToScene(location: Location) {
    // Fade out current scene
    await new Promise<void>((resolve) => {
      this.scene.cameras.main.fadeOut(
        500,
        0,
        0,
        0,
        (_: any, progress: number) => {
          if (progress === 1) resolve();
        }
      );
    });

    // Load appropriate scene based on location type
    const sceneKey = this.getSceneKey(location);
    const sceneData = {
      location,
      librarianState: this.getLibrarianState(this.generateRoomId(location)),
    };

    this.scene.scene.start(sceneKey, sceneData);
  }

  private getSceneKey(location: Location): string {
    switch (location.type) {
      case "gallery":
        return "GalleryScene";
      case "hallway":
        return "HallwayScene";
      // case "bathroom":
      //   return "BathroomScene";
      default:
        throw new Error(`Unknown location type: ${location.type}`);
    }
  }

  private saveSceneState() {
    const currentLocation = this.navigationManager.getCurrentLocation();
    const roomId = this.generateRoomId(currentLocation);

    // Save librarian state for current room
    if (this.scene.data.get("librarian")) {
      this.librarianState.set(roomId, this.scene.data.get("librarian"));
    }
  }

  private getLibrarianState(roomId: string) {
    return this.librarianState.get(roomId);
  }

  private generateRoomId(location: Location): string {
    return `${location.x}-${location.y}-${location.z}-${location.type}${
      location.type === "hallway" ? "h:" + location.cameFrom : ""
    }`;
  }
}
