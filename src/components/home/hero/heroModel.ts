// Settings for the 3D object shown in the home page hero.
//
// HOW TO SWAP IN A REAL PRODUCT MODEL
// 1. Export the product as a .glb file (Blender: File > Export > glTF 2.0,
//    format "glTF Binary"). Keep it under ~1 MB: enable Draco compression and
//    use 1024px (or smaller) textures.
// 2. Put the file in /public/models/, e.g. /public/models/watch.glb.
// 3. Set `url` below to "/models/watch.glb".
// 4. Tweak `scale`, `rotation` and `position` until it sits like the
//    placeholder did (the dial should face the camera at rotation [0, 0, 0]).
//
// While `url` is null the built-in placeholder watch is shown instead.
export const heroModel = {
  url: null as string | null,
  scale: 1,
  rotation: [0, 0, 0] as [number, number, number],
  position: [0, 0, 0] as [number, number, number],
};
