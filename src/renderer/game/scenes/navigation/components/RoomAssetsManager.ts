import galleryRoomMap from "../../../../assets/world/rooms/gallery.png";
import galleryRoomMapMask from "../../../../assets/world/rooms/gallery-room-walkable-mask.png";

import vestibuleRoomMap from "../../../../assets/world/rooms/vestibule.png";
import vestibuleRoomMapMask from "../../../../assets/world/rooms/vestibule-walkable-mask.png";

import doorImg from "../../../../assets/world/objects/door.png";
import arrowImg from "../../../../assets/world/objects/arrow.png";
import bookshelfWallImg from "../../../../assets/world/objects/bookshelf-wall.png";

import { RoomType, RoomAssets } from "../../../../types";

export class RoomAssetsManager {
  private readonly roomAssets: Record<RoomType, RoomAssets>;

  constructor(private scene: Phaser.Scene) {
    this.roomAssets = {
      gallery: {
        backgroundImg: galleryRoomMap,
        backgroundKey: "gallery-room",
        walkableMaskImg: galleryRoomMapMask,
        walkableMaskKey: "gallery-room-mask",
      },
      vestibule: {
        backgroundImg: vestibuleRoomMap,
        backgroundKey: "vestibule-room",
        walkableMaskImg: vestibuleRoomMapMask,
        walkableMaskKey: "vestibule-room-mask",
      },
    };
  }

  preload(): void {
    Object.values(this.roomAssets).forEach((assets) => {
      this.scene.load.image(assets.backgroundKey, assets.backgroundImg);
      this.scene.load.image(assets.walkableMaskKey, assets.walkableMaskImg);
    });

    this.scene.load.image("door", doorImg);
    this.scene.load.image("arrow", arrowImg);
    this.scene.load.image("bookshelf-wall", bookshelfWallImg);
  }

  getAssets(type: RoomType): RoomAssets {
    const assets = this.roomAssets[type];
    if (!assets) throw new Error(`No assets found for room type: ${type}`);
    return assets;
  }
}
