import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import { API } from "../config";
import "../styles/CollegeAssistant.css";

const SUGGESTIONS = ["What are the library opening hours?", "What is the hostel leave procedure?", "How do I apply for a scholarship?"];

export default function CollegeAssistant() {
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const fileRef = useRef(null);
  const bottomRef = useRef(null);
  const controller = useRef(new AbortController());
  const token = localStorage.getItem("token");
  const options = () => ({ headers: { Authorization: `Bearer ${token}` }, signal: controller.current.signal });
  function reportError(err) {
    if (axios.isCancel(err)) return;
    if (err.response?.status === 401) { navigate("/login"); return; }
    setError(err.response?.data?.message || "Connection failed. Please try again.");
  }
  async function refresh() {
    const [settings, library] = await Promise.all([
      axios.get(`${API}/api/chatbot/status`, options()),
      axios.get(`${API}/api/chatbot/documents`, options()),
    ]);
    setStatus(settings.data); setDocuments(library.data.documents);
  }
  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    refresh().catch(reportError).finally(() => setLoading(false));
    return () => controller.current.abort();
  }, [token, navigate]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [messages, asking]);

  async function ask(event) {
    event.preventDefault();
    if (asking || !question.trim()) return;
    const text = question.trim();
    setError(""); setAsking(true);
    try {
      const result = await axios.post(`${API}/api/chatbot/ask`, { question: text }, options());
      setMessages(previous => [...previous, { role: "user", text }, { role: "assistant", ...result.data }]);
      setQuestion("");
    } catch (err) { reportError(err); }
    finally { setAsking(false); }
  }
  async function upload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(""); setNotice("");
    if (file.size > 5 * 1024 * 1024) { setError("Choose a file no larger than 5 MB."); event.target.value = ""; return; }
    setUploading(true);
    try {
      const content = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(",")[1]);
        reader.onerror = () => reject(new Error("File could not be read"));
        reader.readAsDataURL(file);
      });
      await axios.post(`${API}/api/chatbot/documents`, { filename: file.name, content }, options());
      setNotice(`${file.name} is ready for questions.`); await refresh();
    } catch (err) { reportError(err); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  }
  async function remove(id) {
    setError(""); setNotice(""); setDeleting(id);
    try {
      await axios.delete(`${API}/api/chatbot/documents/${id}`, options());
      setConfirmDelete(null); setNotice("Document removed. Future answers will no longer use it."); await refresh();
    } catch (err) { reportError(err); }
    finally { setDeleting(null); }
  }
  const enabled = status?.configured && documents.length > 0 && !loading;
  return (
    <div className="assistant-page">
      <Navbar activeTab="assistant" />
      <main className="assistant-main">
        <header className="assistant-heading">
          <div><span className="assistant-eyebrow">YOUR CAMPUS, EXPLAINED</span><h1>College Assistant</h1>
            <p>Answers from your college documents, with sources you can check.</p></div>
          <span className="assistant-badge">📚 Document grounded</span>
        </header>
        {error && <div className="assistant-alert" role="alert">{error}</div>}
        {notice && <div className="assistant-notice" role="status">{notice}</div>}
        {!loading && !status && <button className="assistant-button" onClick={() => { setLoading(true); setError(""); refresh().catch(reportError).finally(() => setLoading(false)); }}>Retry connection</button>}
        <div className="assistant-layout">
          <section className="assistant-conversation" aria-label="College assistant conversation">
            <div className="assistant-chat-top"><strong>Ask your campus guide</strong><span>Powered by Groq</span>
              {messages.length > 0 && <button className="assistant-text-button" disabled={asking} onClick={() => setMessages([])}>Clear chat</button>}
            </div>
            <div className="assistant-messages" role="log" aria-live="polite" aria-relevant="additions">
              {!messages.length && <div className="assistant-welcome">
                <span className="assistant-book" aria-hidden="true">📖</span><h2>A little clarity for campus life.</h2>
                <p>Ask about college procedures, facilities, rules, or notices. I'll look in the uploaded documents and show where the answer came from.</p>
                <div className="assistant-suggestions">{SUGGESTIONS.map(text => <button key={text} disabled={!enabled || asking} onClick={() => setQuestion(text)}>{text} <span aria-hidden="true">↗</span></button>)}</div>
              </div>}
              {messages.map((message, index) => <article className={`assistant-message ${message.role}`} key={index}>
                <span className="assistant-message-label">{message.role === "user" ? "You" : "College Assistant"}</span>
                <p>{message.role === "user" ? message.text : message.answer}</p>
                {message.sources?.length > 0 && <div className="assistant-sources"><strong>Sources</strong>{message.sources.map((source, sourceIndex) => <details key={sourceIndex}>
                  <summary>[{source.number}] {source.filename} · {source.page ? `Page ${source.page}` : `Section ${source.section}`}</summary>
                  <blockquote>{source.quote}</blockquote>
                </details>)}</div>}
              </article>)}
              {asking && <p className="assistant-thinking" role="status">Searching college documents and preparing an answer…</p>}
              <div ref={bottomRef} />
            </div>
            {loading && <p className="assistant-state" role="status">Loading the document library…</p>}
            {!loading && status && !status.configured && <p className="assistant-state">The assistant is waiting for an administrator to configure its AI connection.</p>}
            {!loading && status && !documents.length && <p className="assistant-state">No college documents have been added yet. An administrator needs to upload them first.</p>}
            <form className="assistant-composer" onSubmit={ask}>
              <label htmlFor="college-question" className="assistant-input-label">Your question</label>
              <div className="assistant-input-row"><textarea id="college-question" value={question} onChange={event => setQuestion(event.target.value)} maxLength={2000} rows={2} disabled={!enabled || asking}
                placeholder="Ask a complete question about your college…" />
                <button className="assistant-button" disabled={!enabled || asking || !question.trim()} type="submit">{asking ? "Searching…" : "Ask →"}</button></div>
              <p className="assistant-footnote">Each question is searched independently. Check the sources for important decisions. Chat history is kept only on this page.</p>
            </form>
          </section>
          <aside className="assistant-library" aria-label="College document library">
            <div className="assistant-library-heading"><h2>Knowledge library</h2><span>{documents.length} files</span></div>
            <p>These documents are available to all signed-in students through the assistant.</p>
            {status?.canManage && <div className="assistant-upload">
              <label htmlFor="college-document">Add a college document</label>
              <input ref={fileRef} id="college-document" type="file" accept=".pdf,.docx,.txt,.md" onChange={upload} disabled={uploading || Boolean(deleting)} />
              <small>PDF, DOCX, TXT, or Markdown · up to 5 MB. Use documents approved for all students.</small>
              {uploading && <p role="status">Reading and preparing the document…</p>}
            </div>}
            <ul className="assistant-document-list">{documents.map(doc => <li key={doc.id}>
              <span className="assistant-file-icon" aria-hidden="true">▤</span><div><strong>{doc.filename}</strong>
                <small>Ready · {new Date(doc.uploadedAt).toLocaleDateString()}</small>
                {status?.canManage && (confirmDelete === doc.id ? <div className="assistant-delete-confirm"><span>Remove this document?</span><button disabled={Boolean(deleting)} onClick={() => remove(doc.id)}>{deleting === doc.id ? "Removing…" : "Remove"}</button><button disabled={Boolean(deleting)} onClick={() => setConfirmDelete(null)}>Cancel</button></div> : <button className="assistant-text-button" disabled={uploading || Boolean(deleting)} onClick={() => setConfirmDelete(doc.id)}>Remove</button>)}
              </div></li>)}</ul>
            {!documents.length && !loading && <p className="assistant-library-empty">The library is empty.</p>}
            <div className="assistant-privacy"><strong>A separate space for questions</strong><p>The assistant doesn't use your profile or private chats. Your question and relevant document excerpts are sent to Groq to prepare an answer.</p></div>
          </aside>
        </div>
      </main>
    </div>
  );
}
