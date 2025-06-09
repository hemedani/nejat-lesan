// import { ChangeEvent, Dispatch, SetStateAction, useCallback } from "react";
// import { EditorContent, useEditor } from "@tiptap/react";
// import Document from "@tiptap/extension-document";
// import Image from "@tiptap/extension-image";
// import Dropcursor from "@tiptap/extension-dropcursor";
// import Heading from "@tiptap/extension-heading";
// import Paragraph from "@tiptap/extension-paragraph";
// import Text from "@tiptap/extension-text";
// import StarterKit from "@tiptap/starter-kit";
// import TextAlign from "@tiptap/extension-text-align";
// import { Color } from "@tiptap/extension-color";
// import TextStyle from "@tiptap/extension-text-style";

// // import {
// //   IcBold,
// //   IcItalic,
// //   IcOl,
// //   IcRedo,
// //   IcStrike,
// //   IcUl,
// //   IcUndo,
// //   QuoteLeft,
// //   IcHeading,
// //   IcRightAlign,
// //   IcCenterAlign,
// //   IcLeftAlign,
// //   IcJustify,
// //   IcPicture,
// // } from "../../../atoms";

// const MenuBar = ({ editor }: any) => {
//   const addImage = useCallback(() => {
//     const url = window.prompt("URL");
//     if (url) {
//       editor?.chain().focus().setImage({ src: url }).run();
//     }
//   }, [editor]);

//   if (!editor) {
//     return null;
//   }

//   return (
//     <div className="flex items-center justify-between p-2 shadow-md">
//       <div className="flex items-center">
//         <button
//           onClick={() => editor.chain().focus().toggleBold().run()}
//           disabled={!editor.can().chain().focus().toggleBold().run()}
//           className={`p-1 mx-2 text-gray-700 ${
//             editor.isActive("bold") ? "bg-gray-300 rounded" : ""
//           }`}
//         >
//           {/* <IcBold /> */}B
//         </button>
//         <button
//           onClick={() => editor.chain().focus().toggleItalic().run()}
//           disabled={!editor.can().chain().focus().toggleItalic().run()}
//           className={`p-1 mx-2 text-gray-700 ${
//             editor.isActive("italic") ? "bg-gray-300 rounded" : ""
//           }`}
//         >
//           {/* <IcItalic /> */}I
//         </button>
//         <button
//           onClick={() => editor.chain().focus().toggleStrike().run()}
//           disabled={!editor.can().chain().focus().toggleStrike().run()}
//           className={`p-1 mx-2 text-gray-700 ${
//             editor.isActive("strike") ? "bg-gray-300 rounded" : ""
//           }`}
//         >
//           {/* <IcStrike /> */}
//           strike
//         </button>
//         <button
//           onClick={() =>
//             editor.chain().focus().toggleHeading({ level: 1 }).run()
//           }
//           className={`p-1 mx-2 text-gray-700 ${
//             editor.isActive("heading", { level: 1 })
//               ? "bg-gray-300 rounded"
//               : ""
//           }`}
//         >
//           {/* <IcHeading /> */}
//           heading
//         </button>
//         <button
//           onClick={() => editor.chain().focus().toggleBulletList().run()}
//           className={`p-1 mx-2 text-gray-700 ${
//             editor.isActive("bulletList") ? "bg-gray-300 rounded" : ""
//           }`}
//         >
//           {/* <IcUl /> */}
//           ul
//         </button>
//         <button
//           onClick={() => editor.chain().focus().toggleOrderedList().run()}
//           className={`p-1 mx-2 text-gray-700 ${
//             editor.isActive("orderedList") ? "bg-gray-300 rounded" : ""
//           }`}
//         >
//           {/* <IcOl /> */}
//           ol
//         </button>
//         <button
//           onClick={() => editor.chain().focus().toggleBlockquote().run()}
//           className={`p-1 mx-2 text-gray-700 ${
//             editor.isActive("blockquote") ? "bg-gray-300 rounded" : ""
//           }`}
//         >
//           {/* <QuoteLeft /> */}
//           quote
//         </button>
//         <button
//           onClick={() => editor.chain().focus().setTextAlign("right").run()}
//           className={`p-1 mx-2 text-gray-700 ${
//             editor.isActive({ textAlign: "right" }) ? "bg-gray-300 rounded" : ""
//           }`}
//         >
//           {/* <IcRightAlign /> */}
//           right
//         </button>
//         <button
//           onClick={() => editor.chain().focus().setTextAlign("center").run()}
//           className={`p-1 mx-2 text-gray-700 ${
//             editor.isActive({ textAlign: "center" })
//               ? "bg-gray-300 rounded"
//               : ""
//           }`}
//         >
//           center
//           {/* <IcCenterAlign /> */}
//         </button>
//         <button
//           onClick={() => editor.chain().focus().setTextAlign("left").run()}
//           className={`p-1 mx-2 text-gray-700 ${
//             editor.isActive({ textAlign: "left" }) ? "bg-gray-300 rounded" : ""
//           }`}
//         >
//           {/* <IcLeftAlign /> */}
//           left
//         </button>
//         <button
//           onClick={() => editor.chain().focus().setTextAlign("justify").run()}
//           className={`p-1 mx-2 text-gray-700 ${
//             editor.isActive({ textAlign: "justify" })
//               ? "bg-gray-300 rounded"
//               : ""
//           }`}
//         >
//           {/* <IcJustify /> */}
//           justify
//         </button>
//         <button onClick={addImage} className="p-1 mx-2 text-gray-700">
//           {/* <IcPicture /> */}
//           image
//         </button>
//         <input
//           type="color"
//           onInput={(event: ChangeEvent<HTMLInputElement>) =>
//             editor.chain().focus().setColor(event.target.value).run()
//           }
//           value={editor.getAttributes("textStyle").color || "#000000"}
//           className="w-10 h-10 p-1 mx-2 cursor-pointer border-none bg-transparent"
//         />
//       </div>
//       <div className="flex items-center">
//         <button
//           onClick={() => editor.chain().focus().undo().run()}
//           disabled={!editor.can().chain().focus().undo().run()}
//           className="p-1 mx-2 text-gray-700"
//         >
//           {/* <IcUndo /> */}
//           undo
//         </button>
//         <button
//           onClick={() => editor.chain().focus().redo().run()}
//           disabled={!editor.can().chain().focus().redo().run()}
//           className="p-1 mx-2 text-gray-700"
//         >
//           {/* <IcRedo /> */}
//           redo
//         </button>
//       </div>
//     </div>
//   );
// };

// export const TipTap = ({
//   setContentData,
//   contentData,
// }: {
//   setContentData: Dispatch<SetStateAction<string>>;
//   contentData?: string;
// }) => {
//   const editor = useEditor({
//     extensions: [
//       StarterKit,
//       Document,
//       Paragraph,
//       Text,
//       Heading,
//       Dropcursor,
//       Color,
//       TextStyle,
//       Image.configure({
//         inline: true,
//       }),
//       TextAlign.configure({
//         types: ["heading", "paragraph", "image"],
//         defaultAlignment: "right",
//       }),
//     ],
//     content: ``,
//     onUpdate: ({ editor }) => {
//       setContentData(editor.getHTML());
//     },
//   });

//   if (contentData) editor?.commands.setContent(contentData);

//   return (
//     <div className="border border-gray-400 rounded-md min-h-[150px]">
//       <MenuBar editor={editor} />
//       <EditorContent
//         editor={editor}
//         className="p-2 border-t border-gray-400 rounded-b-md min-h-[200px] focus:outline-none"
//       />
//     </div>
//   );
// };
