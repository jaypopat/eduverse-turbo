import User from "./User";
export default class RoomManager {
  private static rooms: Map<string, Map<string, User>> = new Map();

  static createRoom(roomId: string) {
    if (this.rooms.has(roomId)) {
      return;
    }
    this.rooms.set(roomId, new Map());
  }
  static isRoomExists(roomId: string): boolean {
    return this.rooms.has(roomId);
  }
  static joinRoom(roomId: string, user: User) {
    if (!this.rooms.has(roomId)) {
      return null;
    }
    this.rooms.get(roomId)!.set(user.userId, user);
    user.roomId = roomId;
    return this.getPlayersInRoom(roomId);
  }

  static leaveRoom(roomId: string, userId: string) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.delete(userId);
      if (room.size === 0) {
        this.rooms.delete(roomId);
      }
    }
    return this.getPlayersInRoom(roomId);
  }

  static updateUserPosition(
    roomId: string,
    userId: string,
    position: { x: number; y: number },
  ) {
    const room = this.rooms.get(roomId);
    const user = room?.get(userId);
    if (user) {
      user.position = position;
    }
  }

  static getPlayersInRoom(roomId: string): User[] {
    return Array.from(this.rooms.get(roomId)?.values() || []);
  }

  static getUser(roomId: string, userId: string): User | undefined {
    return this.rooms.get(roomId)?.get(userId);
  }

  static removeUserFromAllRooms(userId: string) {
    for (const [roomId, room] of this.rooms.entries()) {
      if (room.has(userId)) {
        room.delete(userId);
        if (room.size === 0) {
          this.rooms.delete(roomId);
        }
      }
    }
  }
}
