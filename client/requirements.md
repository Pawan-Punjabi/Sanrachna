## Packages
react-dropzone | High quality drag-and-drop file upload component
framer-motion | Smooth animations and transitions for the AI scanning states
lucide-react | Beautiful, consistent icons

## Notes
Tailwind Config - extend fontFamily:
fontFamily: {
  display: ["var(--font-display)"],
  sans: ["var(--font-sans)"],
}
File uploads expect POST /api/floor-plans/upload with multipart/form-data containing an 'image' file.
Coordinates for bounding boxes are relative (0 to 1), will be multiplied by 100% in CSS for responsive scaling.
