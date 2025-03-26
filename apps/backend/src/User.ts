import { ElysiaWS } from "elysia/dist/ws";
import { MetaverseMessage, Position } from "./types";

export default class User {
  userId: string;
  position: Position;
  color: string;
  roomId: string;
  ws: ElysiaWS;

  constructor(
    userId: string,
    ws: ElysiaWS,
    options: {
      position?: Position;
      color?: string;
      roomId?: string;
    } = {},
  ) {
    this.userId = userId;
    this.ws = ws;
    this.position = options.position || {
      x: Math.random() * 100,
      y: Math.random() * 100,
    };
    this.color = this.generateRandomColor();
    this.roomId = options.roomId || "lobby";
  }

  private generateRandomColor(): string {
    return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
  }
  sendMessage(message: MetaverseMessage) {
    this.ws.send(JSON.stringify(message));
  }
  toJSON() {
    return {
      userId: this.userId,
      position: this.position,
      color: this.color,
      roomId: this.roomId,
    };
  }
}
