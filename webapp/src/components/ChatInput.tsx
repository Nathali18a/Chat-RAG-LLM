import React from "react";
import {
  SendIcon,
  FileIcon,
  XIcon
} from "./Icons";

interface ChatInputProps {
  question: string;
  setQuestion: (q: string) => void;
  loading: boolean;

  files: File[];
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;

  previews: string[];
  setPreviews: React.Dispatch<React.SetStateAction<string[]>>;

  uploading: boolean;
  onSend: () => void;
  onUpload: () => void;

  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onPasteImage: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
}

export function ChatInput({
  question,
  setQuestion,
  loading,
  files,
  setFiles,
  previews,
  setPreviews,
  uploading,
  onSend,
  onUpload,
  onDragOver,
  onDragLeave,
  onDrop,
  onKeyPress,
  onPasteImage
}: ChatInputProps) {

  function removeFile(index: number) {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  }

  return (
    <footer className="composer" onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
      
      <div className="input-group">

        {/* ARCHIVOS DENTRO DEL INPUT (como ChatGPT) */}
        {files.length > 0 && (
          <div className="file-chip-container">
            {files.map((file, i) => (
              <div key={i} className="file-chip">

                {previews[i] ? (
                  <img src={previews[i]} className="file-chip-img" />
                ) : (
                  <div className="file-chip-doc">
                    <FileIcon />
                    <span>{file.name}</span>
                  </div>
                )}

                <button onClick={() => removeFile(i)} className="file-chip-remove">
                  <XIcon />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* TEXTAREA */}
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Escribe tu pregunta aquí... (o pega una imagen con Ctrl+V)"
          onKeyPress={onKeyPress}
          onPaste={onPasteImage}
          disabled={loading}
          className="message-input"
        />

        {/* BOTÓN ENVIAR */}
        <button
          onClick={onSend}
          disabled={loading || (!question.trim() && files.length === 0)}
          className="btn-send"
        >
          <SendIcon />
        </button>
      </div>

      {/* BOTÓN SUBIR ARCHIVOS */}
      <div className="file-area">

        <input
          id="file-input"
          type="file"
          multiple
          accept=".pdf,.docx,.doc,.xlsx,.xls,.pptx,.ppt,.jpg,.jpeg,.png,.gif,.bmp,.webp,.txt,.md"
          onChange={(e) => {
            const selectedFiles = e.target.files;
            if (!selectedFiles) return;

            const newFiles = Array.from(selectedFiles);

            setFiles(prev => [...prev, ...newFiles]);

            newFiles.forEach(file => {
              if (file.type.startsWith("image/")) {
                const reader = new FileReader();
                reader.onload = (event) => {
                  setPreviews(prev => [...prev, event.target?.result as string]);
                };
                reader.readAsDataURL(file);
              } else {
                setPreviews(prev => [...prev, ""]);
              }
            });
          }}
          className="file-input"
        />

        <label htmlFor="file-input" className="btn-file">
          <FileIcon />
          <span>Archivo</span>
        </label>

        <button
          onClick={onUpload}
          disabled={uploading || files.length === 0}
          className="btn-upload"
        >
          {uploading ? "Subiendo..." : "Subir"}
        </button>
      </div>
    </footer>
  );
}