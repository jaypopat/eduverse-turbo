type MetaverseMessage = {
  action: "move" | "chat" | "join" | "leave";
  data: {
    userId: string;
    message?: string;
    position?: {
      x: number;
      y: number;
      z: number;
    };
    roomId: string;
    color?: string;
    signature?: string;
  };
};

type Position = {
  x: number;
  y: number;
};

export type { MetaverseMessage, Position };
