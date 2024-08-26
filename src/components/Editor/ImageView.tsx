import { Editor } from "@tiptap/react";
import { useCallback } from "react";

export const getHandlePaste = (editor: Editor | null) => {

  const handlePaste = useCallback((_, event: ClipboardEvent) => {
    const item = event.clipboardData?.items[0];
    console.log("Item:", item);

    if (item?.type.indexOf('image') !== 0) return false;

    const file = item.getAsFile();
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        if (e.target?.result)
          editor?.commands.setImage({ src: e.target.result as string });
      };
    }
    return true;
  }, [editor])

  return handlePaste
};