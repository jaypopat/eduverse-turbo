import { Elysia, t } from "elysia";
import { MetaverseMessage } from "../types";
import User from "../User";
import RoomManager from "../roomManager";
import { verifyRoomAccess } from "../utils";

const metaverse = new Elysia()
  .post("/room", ({ body }) => {
    const { roomId } = body as { roomId: string };
    RoomManager.createRoom(roomId);
    // Validate roomId
    if (!roomId || typeof roomId !== "string") {
      return {
        success: false,
        error: "Invalid room ID",
      };
    }

    // Check if room already exists
    if (RoomManager.isRoomExists(roomId)) {
      return {
        success: false,
        error: "Room already exists",
      };
    }

    // Create the room
    RoomManager.createRoom(roomId);

    return {
      success: true,
      message: `Room ${roomId} created successfully`,
    };
  })
  .ws("/metaverse", {
    schema: {
      body: t.Object({
        action: t.Enum({
          Move: "move",
          Chat: "chat",
          Join: "join",
          Leave: "leave",
        }),
        data: t.Object({
          userId: t.String(),
          roomId: t.String(),
          message: t.Optional(t.String()),
          position: t.Optional(
            t.Object({
              x: t.Number(),
              y: t.Number(),
            }),
          ),
        }),
      }),
      response: t.Object({
        action: t.String(),
        userId: t.String(),
        message: t.Optional(t.String()),
        position: t.Optional(
          t.Object({
            x: t.Number(),
            y: t.Number(),
          }),
        ),
        color: t.Optional(t.String()),
        roomId: t.String(),
        users: t.Optional(t.Array(t.Any())),
      }),
    },
    message(ws, message) {
      try {
        const { action, data } = message as {
          action: MetaverseMessage["action"];
          data: MetaverseMessage["data"];
        };

        if (!data || !data.userId || !data.roomId) {
          console.error("Invalid message data");
          return;
        }

        switch (action) {
          case "join": {
            const hasAccess = verifyRoomAccess(data.userId, data.roomId);
            if (!hasAccess) {
              ws.send({
                action: "error",
                message: "Access denied to this room",
              });
              return;
            }

            const user = new User(data.userId, ws, {
              color: data.color,
              roomId: data.roomId,
              position: data.position,
            });
            const users = RoomManager.joinRoom(data.roomId, user);
            if (users !== null) {
              ws.subscribe(data.roomId);

              ws.publish(data.roomId, {
                action: "join",
                userId: data.userId,
                roomId: data.roomId,
                color: user.color,
                position: user.position,
                message: `User ${data.userId} joined ${data.roomId}`,
                users: users.map((u: User) => u.toJSON()),
              });
            }
            break;
          }

          case "move": {
            if (!data.position) {
              console.error("Invalid move data");
              return;
            }
            RoomManager.updateUserPosition(
              data.roomId,
              data.userId,
              data.position,
            );
            const user = RoomManager.getUser(data.roomId, data.userId);
            if (!user) {
              console.error("User not found in room");
              return;
            }
            ws.publish(data.roomId, {
              action: "move",
              userId: data.userId,
              position: data.position,
              roomId: data.roomId,
              color: user.color,
            });
            break;
          }

          case "chat": {
            if (!data.message) {
              console.error("Invalid chat message");
              return;
            }
            const user = RoomManager.getUser(data.roomId, data.userId);
            if (!user) {
              console.error("User not found in room");
              return;
            }
            ws.publish(data.roomId, {
              action: "chat",
              userId: data.userId,
              message: data.message,
              roomId: data.roomId,
              color: user.color,
            });
            break;
          }

          case "leave": {
            const users = RoomManager.leaveRoom(data.roomId, data.userId);
            ws.unsubscribe(data.roomId);
            ws.publish(data.roomId, {
              action: "leave",
              userId: data.userId,
              roomId: data.roomId,
              message: `User ${data.userId} left ${data.roomId}`,
              users: users.map((p: User) => p.toJSON()),
            });
            break;
          }
        }
      } catch (error) {
        console.error("Error handling message:", error);
      }
    },
    open(ws) {
      console.log("New connection to metaverse");
      // Store connection ID to user mapping if needed
    },
    close(ws) {
      console.log("Connection to metaverse closed");
      // If you track which user this connection belongs to, you can clean up here
      // For example: RoomManager.removeUserFromAllRooms(userId);
    },
  })
  .listen(3000);
console.log(
  `Metaverse WebSocket server is running on ws://localhost:${metaverse.server?.port}/metaverse`,
);
export default metaverse;
