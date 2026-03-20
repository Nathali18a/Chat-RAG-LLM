import { useState } from "react";
import "./App.css";
import type { Message } from "./types";
import { ChatHeader } from "./components/ChatHeader";
import { SettingsBar } from "./components/SettingsBar";
import { ChatMessages } from "./components/ChatMessages";
import { ChatInput } from "./components/ChatInput";
import { useEffect } from "react";
const API_URL = import.meta.env.VITE_API_URL;

function App() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [useLightRAG, setUseLightRAG] = useState(true);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [sessions, setSessions] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/sessions`)
      .then(r => r.json())
      .then(setSessions);
  }, []);
  async function loadSession(id: string) {
    const res = await fetch(`${API_URL}/sessions/${id}`);
    const data = await res.json();

    setMessages(data.messages);
  }

  async function send() {
    if (!question.trim() && files.length === 0) return;

    const userMsg: Message = {
      role: "user",
      text: question || "(Imagen sin mensaje de texto)",
      time: new Date().toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      fileInfo:
        files.length > 0
          ? files.map((file, i) => ({
              filename: file.name,
              type: file.type.startsWith("image/") ? "image" : "document",
              size: file.size,
              preview: previews[i],
            }))
          : undefined,
    };

    setMessages((m) => [...m, userMsg]);
    setQuestion("");
    setFiles([]);
    setPreviews([]);
    setLoading(true);

    try {
      let response;

      // =============================
      // 1. SI HAY ARCHIVOS -> NORMAL
      // =============================
      if (files.length > 0) {
        const fd = new FormData();

        fd.append("question", question.trim() || "Analiza estos archivos");

        files.forEach((f) => {
          fd.append("files", f);
        });

        fd.append("useLightRAG", String(useLightRAG));
        fd.append("k", "4");
        fd.append("sessionId", sessionId);

        response = await fetch(`${API_URL}/query-multimodal`, {
          method: "POST",
          body: fd,
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || JSON.stringify(data));

        const assistantMsg: Message = {
          role: "assistant",
          text: String(data.answer ?? ""),
          time: new Date().toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          metadata: {
            docsUsed: data.docs?.length,
            usedLightRAG: data.usedLightRAG,
          },
        };

        setMessages((m) => [...m, assistantMsg]);
        return;
      }

      // =============================
      // 2. SOLO TEXTO -> STREAMING
      // =============================
      const body = { question, useLightRAG, k: 4, sessionId };

      response = await fetch(`${API_URL}/query/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.body) throw new Error("Streaming no disponible");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let assistantText = "";

      // crear mensaje vacío primero
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: "",
          time: new Date().toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data:")) continue;

          const json = JSON.parse(line.replace("data: ", ""));

          if (json.token) {
            setMessages((m) => {
              const updated = [...m];

              const last = updated[updated.length - 1];

              updated[updated.length - 1] = {
                ...last,
                text: last.text + json.token
              };

              return updated;
            });
          }
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);

      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: `Error: ${errorMsg}`,
          time: new Date().toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }
  async function uploadFile() {
    if (files.length === 0) return;

    setUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        const fd = new FormData();
        fd.append("file", file, file.name);
        fd.append("sessionId", sessionId);

        const resp = await fetch(`${API_URL}/upload`, {
          method: "POST",
          body: fd,
        });

        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || JSON.stringify(data));

        const isImage = file.type.startsWith("image/");
        const preview = previews[i];

        const statusMsg =
          `**${data.id}** subido exitosamente\n\n` +
          `Chunks: ${data.chunksCount} | ` +
          `Caracteres: ${data.textLength?.toLocaleString()} | ` +
          `Tokens: ~${data.metadata?.approxTokens?.toLocaleString()}`;

        const assistantMsg: Message = {
          role: "assistant",
          text: statusMsg,
          time: new Date().toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          fileInfo: [{
            filename: file.name,
            type: isImage ? "image" : "document",
            size: file.size,
            preview,
            chunksCount: data.chunksCount,
            textLength: data.textLength,
            approxTokens: data.metadata?.approxTokens,
          }],
          metadata: {
            chunksCount: data.chunksCount,
            textLength: data.textLength,
          },
        };

        setMessages((m) => [...m, assistantMsg]);
      }

      // limpiar después de subir todos
      setFiles([]);
      setPreviews([]);

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);

      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: `Error: ${errorMsg}`,
          time: new Date().toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    } finally {
      setUploading(false);
    }
  }
  function clearChat() {
    setMessages([]);
    setQuestion("");
    setFiles([]);
    setPreviews([]);
  }
  function removeFile() {
    setFiles([]);
    setPreviews([]);
  }
  function handlePasteImage(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.includes("image")) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (!file) return;
        setFiles((prev) => [...prev, file]);
        const reader = new FileReader();
        reader.onload = (event) => {
          setPreviews((prev) => [...prev, event.target?.result as string]);
        };
        reader.readAsDataURL(file);
        break;
      }
    }
  }
  function handleKeyPress(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function handleDragOver(_e: React.DragEvent<Element>) {
    // Drag handling moved to ChatInput component
  }

  function handleDragLeave(_e: React.DragEvent<Element>) {
    // Drag handling moved to ChatInput component
  }

  function handleDrop(_e: React.DragEvent<Element>) {
    // Drag handling moved to ChatInput component
  }

  return (
    <div className={`chat-root ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
      
      {/* SIDEBAR */}
      <div className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <button
          className="toggle-sidebar"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          ☰
        </button>

        <h3>Chats</h3>

        {sessions.map((s: any) => (
          <div
            key={s.id}
            className="session-item"
            onClick={() => loadSession(s.id)}
          >
            {s.title}
          </div>
        ))}
      </div>

      {/* CONTENEDOR DEL CHAT */}
      <div className="chat-container">

        <ChatHeader onClearChat={clearChat} />

        <SettingsBar
          useLightRAG={useLightRAG}
          onToggleLightRAG={setUseLightRAG}
        />

        <ChatMessages
          messages={messages}
          loading={loading}
        />

        <ChatInput
          question={question}
          setQuestion={setQuestion}
          files={files}
          setFiles={setFiles}
          previews={previews}
          setPreviews={setPreviews}
          loading={loading}
          uploading={uploading}
          onSend={send}
          onUpload={uploadFile}
          onPasteImage={handlePasteImage}
          onKeyPress={handleKeyPress}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        />

      </div>
    </div>
  );
}

export default App;
