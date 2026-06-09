import { Editor } from "obsidian";
import { EditorView } from "@codemirror/view";

export function getEditorViewFromEditor(editor: Editor): EditorView {  return (editor as Editor & { cm: EditorView }).cm;
} 