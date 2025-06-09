export const isValidImageExtension = (filename: string) => {
  // const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff', '.svg'];
  const validExtensions = ['.jpg', '.jpeg', '.png', '.webp',];

  const lowerCaseFilename = filename.toLowerCase();

  return validExtensions.some(extension => lowerCaseFilename.endsWith(extension));
}

export const isValidPdfExtension = (filename: string) => filename.toLowerCase().endsWith(".pdf") ? true : false;


