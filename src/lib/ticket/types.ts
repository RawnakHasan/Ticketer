// A photo the user added. The bitmap is decoded once; position and zoom are edited in place.
export type Photo = {
  id: string;
  // The image file as added (a HEIC photo is kept as the JPEG it was turned into), so it can be saved
  src: Blob;
  bmp: ImageBitmap;
  // Size of the bitmap (capped at 3000px on the long side)
  w: number;
  h: number;
  // Size of the file as added, used for the low-resolution warning
  ow: number;
  oh: number;
  // Average colour, shown behind the photo when it is zoomed out
  bg: string;
  // Zoom, pan (-1 to 1) and quarter turns
  z: number;
  x: number;
  y: number;
  rot: number;
};

export type PhotoSlot = "main" | "stub";
