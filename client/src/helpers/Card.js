export default class Card extends Phaser.GameObjects.Container {
  constructor(data) {
    let { scene, x, y, color, value, owner, cardPos } = data;
    let spriteCard = new Phaser.GameObjects.Sprite(scene, 0, 0, color);
    let textNum = new Phaser.GameObjects.Text(
      scene,
      0,
      0,
      value === -1 ? ":)" : value,
      {
        fontSize: "60px",
        fontFamily: "Roboto Mono",
        color: color === "card-black" ? "#fff" : "#000",
      }
    );

    // add default container
    super(scene, x, y, [spriteCard, textNum]);

    // set variables
    this.owner = owner;
    this.cardPos = cardPos;
    this.color = color;
    this.spriteCard = spriteCard;
    this.value = value;
    this.originalScale = 0.5;
    this.scene = scene;

    // transform card
    this.setScale(this.originalScale);
    textNum.setOrigin(0.5);
    this.setSize(this.spriteCard.displayWidth, this.spriteCard.displayHeight);

    this.scene.add.existing(this);

    this.updateValue = (val) => {
      this.value = val;
      this.list[1].setText(val);
    };
  }
}
