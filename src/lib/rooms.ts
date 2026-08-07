/**
 * The five places you can walk into from the street. Order here is the order
 * they appear in the nav.
 */
export type RoomId = "studio" | "drafting" | "bookshop" | "cafe" | "door";

export type Room = {
  id: RoomId;
  /** what the sign outside says */
  sign: string;
  /** the brass plaque that appears on hover */
  plaque: string;
  /** the nav label */
  nav: string;
  /** shown at the top of the room */
  kicker: string;
};

export const rooms: readonly Room[] = [
  {
    id: "studio",
    sign: "The Studio",
    plaque: "The Studio — where I've worked",
    nav: "Work",
    kicker: "Second floor, light still on",
  },
  {
    id: "drafting",
    sign: "The Drawing Room",
    plaque: "The Drawing Room — things I've built",
    nav: "Projects",
    kicker: "Second floor, the messy end",
  },
  {
    id: "bookshop",
    sign: "Librairie",
    plaque: "Librairie — things I've written",
    nav: "Writing",
    kicker: "Ground floor, right",
  },
  {
    id: "cafe",
    sign: "Café du Coin",
    plaque: "Café du Coin — who I am",
    nav: "About",
    kicker: "Ground floor, left, by the window",
  },
  {
    id: "door",
    sign: "No. 23",
    plaque: "No. 23 — knock, I'll answer",
    nav: "Contact",
    kicker: "The green door",
  },
] as const;

export const roomById = (id: string): Room | undefined =>
  rooms.find((r) => r.id === id);
