/** Lado mayor con el que el navegador achica la foto antes de subirla. */
const ladoMaximo = 2400;

/**
 * Achica la foto en el navegador (Vercel corta los pedidos de más de 4,5 MB
 * y una foto del celu suele pasar eso). La orientación del EXIF se aplica
 * acá; el servidor después la pasa a webp de 1600 px con sharp.
 */
export async function achicar(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const escala = Math.min(1, ladoMaximo / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * escala);
  canvas.height = Math.round(bitmap.height * escala);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
  if (!blob) throw new Error("No se pudo preparar la foto");
  return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
}
