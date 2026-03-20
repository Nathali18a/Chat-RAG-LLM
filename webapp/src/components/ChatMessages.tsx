import ReactMarkdown from "react-markdown";
import type { Message } from "../types";
import {
  SearchIcon,
  ClockIcon,
  DocumentIcon,
  PDFIcon,
  DocIcon,
  SheetIcon,
  PresentationIcon
} from "./Icons";

interface ChatMessagesProps {
  messages: Message[];
  loading: boolean;
}

export function ChatMessages({ messages, loading }: ChatMessagesProps) {
  return (
    <>
      <div className="recent-bar">Mensajes recientes</div>
      <main className="chat-window">
        <div className="messages">
          {messages.length === 0 && (
            <div className="empty-state">
              <SearchIcon />
              <p>Comienza la conversación</p>
              <span className="hint">Escribe tu pregunta o sube un archivo</span>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`msg-wrapper msg-${m.role}`}>
              <div className="msg">
                {m.fileInfo?.map((file, idx) => (
                  <div key={idx} className="file-message-container">
                    {file.type === "image" && file.preview ? (
                      <div className="file-message-image">
                        <img src={file.preview} alt={file.filename} className="file-preview-img" />
                      </div>
                    ) : (
                      <div className="file-message-card">
                        <div className="file-icon-wrapper">
                          {file.filename.endsWith(".pdf") && <PDFIcon />}
                          {(file.filename.endsWith(".doc") || file.filename.endsWith(".docx")) && <DocIcon />}
                          {(file.filename.endsWith(".xls") || file.filename.endsWith(".xlsx")) && <SheetIcon />}
                          {(file.filename.endsWith(".ppt") || file.filename.endsWith(".pptx")) && <PresentationIcon />}
                          {!file.filename.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx)$/) && <DocumentIcon />}
                        </div>

                        <div className="file-card-info">
                          <div className="file-card-name">{file.filename}</div>
                          <div className="file-card-size">{(file.size / 1024).toFixed(1)} KB</div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div className="text">
                  {m.role === "assistant" ? (
                    <ReactMarkdown>{m.text}</ReactMarkdown>
                  ) : (
                    m.text
                  )}
                </div>
              </div>
              <div className="message-meta">
                {m.time && (
                  <span className="time">
                    <ClockIcon />
                    {m.time}
                  </span>
                )}
                {m.role === "assistant" && m.metadata?.docsUsed && (
                  <span className="meta-badge">
                    <DocumentIcon />
                    {m.metadata.docsUsed} {m.metadata.docsUsed === 1 ? "documento" : "documentos"}
                  </span>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="msg-wrapper msg-assistant">
              <div className="msg loading-msg">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}