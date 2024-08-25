import { Editor } from "@tiptap/react";

export const getOnTransaction = (editor: Editor) => {
  return () => {
    editor = editor;
  };
};

export const getHandlePaste = (editor: Editor) => {
  return async (view, event: ClipboardEvent, slice) => {
    try {
      // Read clipboard contents
      const clipboardItems = await navigator.clipboard.read();

      // Find the first clipboard item that contains an image
      const imageItem = clipboardItems.find((item) =>
        item.types.some((type) => type.startsWith("image/"))
      );

      console.log("ImageItem:", imageItem)
      // If no image is found, let the paste event continue normally
      if (!imageItem) {
        return false;
      }

      // Get the image blob from the item
      const imageType = imageItem.types.find((type) =>
        type.startsWith("image/")
      );
      if (!imageType) return false;

      const imageBlob = await imageItem.getType(imageType);

      // Convert the blob to a Data URL
      const reader = new FileReader();
      reader.readAsDataURL(imageBlob);
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        if (imageUrl) {
          // Insert the image into Tiptap
          editor.chain().focus().setImage({ src: imageUrl }).run();
        }
      };

      // Prevent the default paste behavior since we're handling it
      event.preventDefault();
      return true;
    } catch (error) {
      console.error("Failed to read clipboard contents:", error);
      return false;
    }
  };
};
