export default class InteractivityHandler {
  constructor(scene) {
    scene.input.on("drag", (pointer, gameObject, dragX, dragY) => {
      gameObject.x = dragX;
      gameObject.y = dragY;
      gameObject.depth = 1;
    });

    scene.input.on("dragend", (pointer, gameObject, dropped) => {
      gameObject.depth = 0;
      if (!dropped) {
        gameObject.x = gameObject.input.dragStartX;
        gameObject.y = gameObject.input.dragStartY;
      }
    });

    scene.input.on("drop", (pointer, gameObject, dropZone) => {
      let pointerDiff = {
        x: pointer.downX - gameObject.input.dragStartX,
        y: pointer.downY - gameObject.input.dragStartY,
      };
      if (
        !scene.DeckHandler.repositionCard(
          pointer.upX - pointerDiff.x,
          pointer.upY - pointerDiff.y,
          gameObject
        )
      ) {
        gameObject.x = gameObject.input.dragStartX;
        gameObject.y = gameObject.input.dragStartY;
      }
    });
  }
}
