import { useState, useEffect, useRef } from "react";

// ── helpers ──────────────────────────────────────────────────────────────────
const now = () => new Date().toISOString();
const fmtDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
};
const uid = () => Math.random().toString(36).slice(2, 10);

const SEED_POSTS = [
  {
    id: "p1", title: "Super Mario Odyssey is pure joy – unpopular opinion?",
    content: "I've been replaying Odyssey and I genuinely think it's the best 3D Mario ever made. The cap mechanic gives you so much freedom and each kingdom feels like its own little universe. Change my mind.",
    image: "https://upload.wikimedia.org/wikipedia/en/8/8d/Super_Mario_Odyssey.jpg",
    upvotes: 42, createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    comments: [
      { id: "c1", text: "Not unpopular at all – Odyssey is incredible!", createdAt: new Date(Date.now() - 3600000 * 7).toISOString() },
      { id: "c2", text: "Galaxy 2 still has the edge for me but Odyssey is top 3 for sure.", createdAt: new Date(Date.now() - 3600000 * 6).toISOString() },
    ]
  },
  {
    id: "p2", title: "Hot take: World 8-4 from the original SMB is still unmatched in level design",
    content: "The maze mechanic, the underwater section, the fire bar gauntlet, and then Bowser – all in one stage. Pure genius from Miyamoto's team in 1985.",
    image: "",
    upvotes: 28, createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    comments: []
  },
  {
    id: "p3", title: "Which Mario Kart track gives you the most anxiety?",
    content: "Rainbow Road on SNES destroyed my childhood. No rails. Just vibes and suffering.",
    image: "https://upload.wikimedia.org/wikipedia/en/b/b6/Mario_Kart_8_Deluxe.jpg",
    upvotes: 71, createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    comments: [
      { id: "c3", text: "SNES Rainbow Road is absolutely brutal but I respect it.", createdAt: new Date(Date.now() - 3600000 * 46).toISOString() },
    ]
  },
];

// ── pixel-star background ────────────────────────────────────────────────────
const STARS = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 2 + 1,
  delay: Math.random() * 3,
}));

// ══════════════════════════════════════════════════════════════════════════════
//  MAIN APP
// ══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [posts, setPosts] = useState(SEED_POSTS);
  const [page, setPage] = useState("home");   // "home" | "post" | "create"
  const [activeId, setActiveId] = useState(null);
  const [sort, setSort] = useState("time");    // "time" | "upvotes"
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);

  const goHome = () => { setPage("home"); setActiveId(null); setEditingId(null); };
  const goPost = (id) => { setPage("post"); setActiveId(id); };
  const goCreate = () => { setPage("create"); setActiveId(null); };

  const activePost = posts.find(p => p.id === activeId);

  const visiblePosts = posts
    .filter(p => p.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sort === "upvotes" ? b.upvotes - a.upvotes : new Date(b.createdAt) - new Date(a.createdAt));

  const addPost = (data) => {
    setPosts(prev => [{ id: uid(), ...data, upvotes: 0, createdAt: now(), comments: [] }, ...prev]);
    goHome();
  };
  const updatePost = (id, data) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
    setEditingId(null);
  };
  const deletePost = (id) => { setPosts(prev => prev.filter(p => p.id !== id)); goHome(); };
  const upvote = (id) => setPosts(prev => prev.map(p => p.id === id ? { ...p, upvotes: p.upvotes + 1 } : p));
  const addComment = (id, text) => {
    setPosts(prev => prev.map(p => p.id === id
      ? { ...p, comments: [...p.comments, { id: uid(), text, createdAt: now() }] }
      : p));
  };

  return (
    <div style={styles.root}>
      {/* Stars */}
      <div style={styles.starField}>
        {STARS.map(s => (
          <div key={s.id} style={{ ...styles.star, left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size, animationDelay: `${s.delay}s` }} />
        ))}
      </div>

      {/* Navbar */}
      <nav style={styles.nav}>
        <button onClick={goHome} style={styles.logo}>
          <span style={styles.logoMushroom}>🍄</span>
          <span style={styles.logoText}>Mushroom Forum</span>
        </button>
        <div style={styles.navRight}>
          <button onClick={goCreate} style={styles.newPostBtn}>+ New Post</button>
        </div>
      </nav>

      {/* Pages */}
      <main style={styles.main}>
        {page === "home" && (
          <HomePage
            posts={visiblePosts}
            sort={sort} setSort={setSort}
            search={search} setSearch={setSearch}
            onSelect={goPost}
          />
        )}
        {page === "post" && activePost && (
          <PostPage
            post={activePost}
            onBack={goHome}
            onUpvote={() => upvote(activePost.id)}
            onDelete={() => deletePost(activePost.id)}
            onSave={(data) => updatePost(activePost.id, data)}
            onAddComment={(text) => addComment(activePost.id, text)}
            editingId={editingId} setEditingId={setEditingId}
          />
        )}
        {page === "create" && (
          <CreatePage onSubmit={addPost} onCancel={goHome} />
        )}
      </main>

      <style>{css}</style>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  HOME PAGE
// ══════════════════════════════════════════════════════════════════════════════
function HomePage({ posts, sort, setSort, search, setSearch, onSelect }) {
  return (
    <div style={styles.homePage}>
      <div style={styles.hero}>
        <div style={styles.heroPixelMario}>🎮</div>
        <h1 style={styles.heroTitle}>Welcome to the Mushroom Kingdom Forum</h1>
        <p style={styles.heroSub}>Discuss all things Mario — from 8-bit classics to Odyssey and beyond!</p>
      </div>

      {/* Controls */}
      <div style={styles.controls}>
        <div style={styles.searchWrap}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            style={styles.searchInput}
            placeholder="Search posts…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={styles.sortBtns}>
          <button
            onClick={() => setSort("time")}
            style={{ ...styles.sortBtn, ...(sort === "time" ? styles.sortBtnActive : {}) }}
          >⏰ Recent</button>
          <button
            onClick={() => setSort("upvotes")}
            style={{ ...styles.sortBtn, ...(sort === "upvotes" ? styles.sortBtnActive : {}) }}
          >⭐ Top</button>
        </div>
      </div>

      {/* Feed */}
      <div style={styles.feed}>
        {posts.length === 0 && (
          <div style={styles.empty}>No posts found. Start a discussion!</div>
        )}
        {posts.map(p => (
          <PostCard key={p.id} post={p} onClick={() => onSelect(p.id)} />
        ))}
      </div>
    </div>
  );
}

function PostCard({ post, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      style={{ ...styles.card, ...(hov ? styles.cardHov : {}) }}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="post-card"
    >
      <div style={styles.cardTop}>
        <h2 style={styles.cardTitle}>{post.title}</h2>
        <div style={styles.cardMeta}>
          <span style={styles.metaTime}>🕒 {fmtDate(post.createdAt)}</span>
          <span style={styles.metaUpvotes}>⭐ {post.upvotes}</span>
          <span style={styles.metaComments}>💬 {post.comments.length}</span>
        </div>
      </div>
      <div style={styles.cardArrow}>{hov ? "▶" : "›"}</div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  POST PAGE
// ══════════════════════════════════════════════════════════════════════════════
function PostPage({ post, onBack, onUpvote, onDelete, onSave, onAddComment, editingId, setEditingId }) {
  const [comment, setComment] = useState("");
  const [editTitle, setEditTitle] = useState(post.title);
  const [editContent, setEditContent] = useState(post.content);
  const [editImage, setEditImage] = useState(post.image);
  const [upvoted, setUpvoted] = useState(false);
  const isEditing = editingId === post.id;

  const submitComment = () => {
    if (!comment.trim()) return;
    onAddComment(comment.trim());
    setComment("");
  };

  const handleUpvote = () => {
    onUpvote();
    setUpvoted(true);
    setTimeout(() => setUpvoted(false), 600);
  };

  return (
    <div style={styles.postPage}>
      <button onClick={onBack} style={styles.backBtn}>← Back to Feed</button>

      <div style={styles.postCard}>
        {/* Header */}
        {isEditing ? (
          <input style={styles.editTitleInput} value={editTitle} onChange={e => setEditTitle(e.target.value)} />
        ) : (
          <h1 style={styles.postTitle}>{post.title}</h1>
        )}
        <p style={styles.postDate}>Posted {fmtDate(post.createdAt)}</p>

        {/* Image */}
        {!isEditing && post.image && (
          <img src={post.image} alt="post" style={styles.postImg} onError={e => e.target.style.display = "none"} />
        )}
        {isEditing && (
          <input style={styles.editInput} placeholder="Image URL" value={editImage} onChange={e => setEditImage(e.target.value)} />
        )}

        {/* Content */}
        {isEditing ? (
          <textarea style={styles.editTextarea} value={editContent} onChange={e => setEditContent(e.target.value)} rows={5} />
        ) : (
          <p style={styles.postContent}>{post.content}</p>
        )}

        {/* Actions */}
        <div style={styles.postActions}>
          <button
            onClick={handleUpvote}
            style={{ ...styles.upvoteBtn, ...(upvoted ? styles.upvoteBtnActive : {}) }}
            className="upvote-btn"
          >
            ⭐ {post.upvotes} {upvoted ? "Thanks!" : "Upvote"}
          </button>

          {!isEditing ? (
            <>
              <button onClick={() => setEditingId(post.id)} style={styles.editBtn}>✏️ Edit</button>
              <button onClick={onDelete} style={styles.deleteBtn}>🗑️ Delete</button>
            </>
          ) : (
            <>
              <button onClick={() => onSave({ title: editTitle, content: editContent, image: editImage })} style={styles.saveBtn}>💾 Save</button>
              <button onClick={() => setEditingId(null)} style={styles.cancelEditBtn}>✕ Cancel</button>
            </>
          )}
        </div>

        {/* Divider */}
        <div style={styles.divider} />

        {/* Comments */}
        <h2 style={styles.commentsTitle}>💬 Comments ({post.comments.length})</h2>
        <div style={styles.commentsList}>
          {post.comments.length === 0 && <p style={styles.noComments}>No comments yet. Be the first!</p>}
          {post.comments.map(c => (
            <div key={c.id} style={styles.commentCard}>
              <p style={styles.commentText}>{c.text}</p>
              <span style={styles.commentDate}>{fmtDate(c.createdAt)}</span>
            </div>
          ))}
        </div>

        {/* Comment form */}
        <div style={styles.commentForm}>
          <textarea
            style={styles.commentInput}
            placeholder="Add a comment…"
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={3}
          />
          <button onClick={submitComment} style={styles.commentBtn}>Post Comment</button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  CREATE PAGE
// ══════════════════════════════════════════════════════════════════════════════
function CreatePage({ onSubmit, onCancel }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState("");
  const [err, setErr] = useState("");

  const submit = () => {
    if (!title.trim()) { setErr("A title is required!"); return; }
    onSubmit({ title: title.trim(), content, image });
  };

  return (
    <div style={styles.createPage}>
      <div style={styles.createCard}>
        <h1 style={styles.createTitle}>🍄 New Post</h1>
        <p style={styles.createSub}>Share something with the Mushroom Kingdom community!</p>

        {err && <div style={styles.errBanner}>{err}</div>}

        <label style={styles.label}>Post Title *</label>
        <input
          style={styles.formInput}
          placeholder="What's on your mind?"
          value={title}
          onChange={e => { setTitle(e.target.value); setErr(""); }}
        />

        <label style={styles.label}>Content (optional)</label>
        <textarea
          style={styles.formTextarea}
          placeholder="Share your thoughts, experiences, or questions…"
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={6}
        />

        <label style={styles.label}>Image URL (optional)</label>
        <input
          style={styles.formInput}
          placeholder="https://example.com/mario.jpg"
          value={image}
          onChange={e => setImage(e.target.value)}
        />
        {image && (
          <img src={image} alt="preview" style={styles.imgPreview} onError={e => e.target.style.display = "none"} />
        )}

        <div style={styles.formActions}>
          <button onClick={submit} style={styles.submitBtn}>🚀 Post to Forum</button>
          <button onClick={onCancel} style={styles.cancelBtn}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  STYLES
// ══════════════════════════════════════════════════════════════════════════════
const COLOR = {
  red: "#e52222",
  redDark: "#b01818",
  yellow: "#ffd700",
  yellowDark: "#e6b800",
  blue: "#1a6fd4",
  blueDark: "#1455a8",
  navy: "#0d1b3e",
  navyDark: "#08102a",
  sky: "#1e3a6b",
  white: "#fff",
  offWhite: "#f0e8d8",
  gray: "#8b9bb4",
  cardBg: "rgba(255,255,255,0.06)",
  cardBorder: "rgba(255,255,255,0.12)",
};

const styles = {
  root: {
    minHeight: "100vh",
    background: `radial-gradient(ellipse at 20% 30%, #1e3a6b 0%, #0d1b3e 60%, #05090f 100%)`,
    fontFamily: "'Press Start 2P', 'Courier New', monospace",
    color: COLOR.offWhite,
    position: "relative",
    overflowX: "hidden",
  },
  starField: { position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 },
  star: {
    position: "absolute",
    background: "#fff",
    borderRadius: "50%",
    animation: "twinkle 3s ease-in-out infinite alternate",
    opacity: 0.6,
  },

  // Nav
  nav: {
    position: "sticky", top: 0, zIndex: 100,
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0 2rem",
    height: 64,
    background: "rgba(13,27,62,0.95)",
    borderBottom: `3px solid ${COLOR.red}`,
    backdropFilter: "blur(12px)",
    boxShadow: `0 4px 30px rgba(229,34,34,0.2)`,
  },
  logo: {
    display: "flex", alignItems: "center", gap: 10,
    background: "none", border: "none", cursor: "pointer",
  },
  logoMushroom: { fontSize: 28 },
  logoText: { fontSize: "0.65rem", color: COLOR.yellow, letterSpacing: 1, textShadow: `0 0 12px ${COLOR.yellow}` },
  navRight: { display: "flex", gap: 12 },
  newPostBtn: {
    background: COLOR.red, border: "none", color: "#fff",
    padding: "10px 16px", cursor: "pointer",
    fontSize: "0.5rem", borderRadius: 4,
    fontFamily: "inherit",
    boxShadow: `0 3px 0 ${COLOR.redDark}`,
    transition: "transform .1s, box-shadow .1s",
  },

  // Main
  main: { position: "relative", zIndex: 1, maxWidth: 860, margin: "0 auto", padding: "2rem 1.5rem 4rem" },

  // Hero
  homePage: {},
  hero: {
    textAlign: "center", padding: "2.5rem 1rem 2rem",
    borderBottom: `2px dashed ${COLOR.cardBorder}`,
    marginBottom: "2rem",
  },
  heroPixelMario: { fontSize: 56, marginBottom: 12, display: "block", animation: "bounce 1s ease-in-out infinite alternate" },
  heroTitle: { fontSize: "0.9rem", color: COLOR.yellow, textShadow: `0 0 20px ${COLOR.yellow}`, lineHeight: 1.8, marginBottom: 12 },
  heroSub: { fontSize: "0.45rem", color: COLOR.gray, lineHeight: 2 },

  // Controls
  controls: { display: "flex", gap: 12, marginBottom: "1.5rem", flexWrap: "wrap", alignItems: "center" },
  searchWrap: {
    flex: 1, display: "flex", alignItems: "center",
    background: COLOR.cardBg, border: `1px solid ${COLOR.cardBorder}`,
    borderRadius: 6, padding: "0 12px", minWidth: 200,
  },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: {
    flex: 1, background: "none", border: "none", outline: "none",
    color: COLOR.offWhite, fontFamily: "inherit", fontSize: "0.45rem", padding: "10px 0",
  },
  sortBtns: { display: "flex", gap: 8 },
  sortBtn: {
    background: COLOR.cardBg, border: `1px solid ${COLOR.cardBorder}`,
    color: COLOR.gray, padding: "8px 14px", cursor: "pointer",
    fontFamily: "inherit", fontSize: "0.42rem", borderRadius: 4,
    transition: "all .15s",
  },
  sortBtnActive: { background: COLOR.blue, borderColor: COLOR.blue, color: "#fff" },

  // Feed
  feed: { display: "flex", flexDirection: "column", gap: 14 },
  empty: { textAlign: "center", color: COLOR.gray, fontSize: "0.5rem", padding: "3rem" },

  // Card
  card: {
    background: COLOR.cardBg,
    border: `1px solid ${COLOR.cardBorder}`,
    borderRadius: 8,
    padding: "1.2rem 1.4rem",
    cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    transition: "all .2s",
    backdropFilter: "blur(8px)",
  },
  cardHov: {
    background: "rgba(255,255,255,0.1)",
    borderColor: COLOR.red,
    transform: "translateX(4px)",
    boxShadow: `-4px 0 0 ${COLOR.red}`,
  },
  cardTop: { flex: 1 },
  cardTitle: { fontSize: "0.6rem", color: COLOR.white, marginBottom: 10, lineHeight: 1.8 },
  cardMeta: { display: "flex", gap: 20, flexWrap: "wrap" },
  metaTime: { fontSize: "0.38rem", color: COLOR.gray },
  metaUpvotes: { fontSize: "0.38rem", color: COLOR.yellow },
  metaComments: { fontSize: "0.38rem", color: COLOR.gray },
  cardArrow: { fontSize: 22, color: COLOR.red, marginLeft: 16, transition: "transform .2s" },

  // Post Page
  postPage: {},
  backBtn: {
    background: "none", border: `1px solid ${COLOR.cardBorder}`,
    color: COLOR.gray, fontFamily: "inherit", fontSize: "0.45rem",
    cursor: "pointer", padding: "8px 14px", borderRadius: 4, marginBottom: "1.5rem",
    transition: "all .15s",
  },
  postCard: {
    background: COLOR.cardBg,
    border: `1px solid ${COLOR.cardBorder}`,
    borderRadius: 10, padding: "2rem",
    backdropFilter: "blur(10px)",
  },
  postTitle: { fontSize: "0.85rem", color: COLOR.yellow, lineHeight: 1.8, marginBottom: 8 },
  postDate: { fontSize: "0.38rem", color: COLOR.gray, marginBottom: "1.5rem" },
  postImg: { width: "100%", borderRadius: 8, marginBottom: "1.5rem", objectFit: "cover", maxHeight: 320, border: `2px solid ${COLOR.cardBorder}` },
  postContent: { fontSize: "0.48rem", lineHeight: 2.2, color: COLOR.offWhite, marginBottom: "1.5rem" },
  postActions: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: "1.5rem" },
  upvoteBtn: {
    background: COLOR.yellow, border: "none", color: COLOR.navyDark,
    padding: "10px 18px", cursor: "pointer", fontFamily: "inherit", fontSize: "0.48rem",
    borderRadius: 4, boxShadow: `0 3px 0 ${COLOR.yellowDark}`,
    transition: "all .15s",
  },
  upvoteBtnActive: { background: "#fff", transform: "scale(1.05)" },
  editBtn: {
    background: COLOR.blue, border: "none", color: "#fff",
    padding: "10px 16px", cursor: "pointer", fontFamily: "inherit", fontSize: "0.45rem",
    borderRadius: 4, boxShadow: `0 3px 0 ${COLOR.blueDark}`,
  },
  deleteBtn: {
    background: COLOR.red, border: "none", color: "#fff",
    padding: "10px 16px", cursor: "pointer", fontFamily: "inherit", fontSize: "0.45rem",
    borderRadius: 4, boxShadow: `0 3px 0 ${COLOR.redDark}`,
  },
  saveBtn: {
    background: "#22c55e", border: "none", color: "#fff",
    padding: "10px 16px", cursor: "pointer", fontFamily: "inherit", fontSize: "0.45rem",
    borderRadius: 4, boxShadow: "0 3px 0 #16a34a",
  },
  cancelEditBtn: {
    background: "transparent", border: `1px solid ${COLOR.cardBorder}`, color: COLOR.gray,
    padding: "10px 16px", cursor: "pointer", fontFamily: "inherit", fontSize: "0.45rem", borderRadius: 4,
  },

  editTitleInput: {
    width: "100%", background: "rgba(0,0,0,0.3)", border: `2px solid ${COLOR.yellow}`,
    color: COLOR.yellow, fontFamily: "inherit", fontSize: "0.7rem", padding: "10px",
    borderRadius: 4, marginBottom: 10, outline: "none", boxSizing: "border-box",
  },
  editInput: {
    width: "100%", background: "rgba(0,0,0,0.3)", border: `1px solid ${COLOR.cardBorder}`,
    color: COLOR.offWhite, fontFamily: "inherit", fontSize: "0.42rem", padding: "10px",
    borderRadius: 4, marginBottom: 10, outline: "none", boxSizing: "border-box",
  },
  editTextarea: {
    width: "100%", background: "rgba(0,0,0,0.3)", border: `1px solid ${COLOR.cardBorder}`,
    color: COLOR.offWhite, fontFamily: "inherit", fontSize: "0.42rem", padding: "10px",
    borderRadius: 4, marginBottom: 10, outline: "none", boxSizing: "border-box", resize: "vertical",
  },

  divider: { height: 2, background: `linear-gradient(90deg, ${COLOR.red}, transparent)`, margin: "2rem 0" },
  commentsTitle: { fontSize: "0.6rem", color: COLOR.offWhite, marginBottom: "1rem" },
  commentsList: { display: "flex", flexDirection: "column", gap: 10, marginBottom: "1.5rem" },
  noComments: { fontSize: "0.42rem", color: COLOR.gray, fontStyle: "italic" },
  commentCard: {
    background: "rgba(0,0,0,0.25)", border: `1px solid ${COLOR.cardBorder}`,
    borderRadius: 6, padding: "0.9rem 1.1rem",
    borderLeft: `3px solid ${COLOR.blue}`,
  },
  commentText: { fontSize: "0.45rem", lineHeight: 2, color: COLOR.offWhite, marginBottom: 6 },
  commentDate: { fontSize: "0.35rem", color: COLOR.gray },
  commentForm: { display: "flex", flexDirection: "column", gap: 10 },
  commentInput: {
    background: "rgba(0,0,0,0.3)", border: `1px solid ${COLOR.cardBorder}`,
    color: COLOR.offWhite, fontFamily: "inherit", fontSize: "0.42rem",
    padding: "10px 12px", borderRadius: 4, outline: "none", resize: "vertical",
    transition: "border-color .2s",
  },
  commentBtn: {
    alignSelf: "flex-start",
    background: COLOR.blue, border: "none", color: "#fff",
    padding: "10px 18px", cursor: "pointer", fontFamily: "inherit", fontSize: "0.45rem",
    borderRadius: 4, boxShadow: `0 3px 0 ${COLOR.blueDark}`,
  },

  // Create
  createPage: { display: "flex", justifyContent: "center" },
  createCard: {
    background: COLOR.cardBg, border: `1px solid ${COLOR.cardBorder}`,
    borderRadius: 10, padding: "2rem", width: "100%", maxWidth: 640,
    backdropFilter: "blur(10px)",
  },
  createTitle: { fontSize: "0.8rem", color: COLOR.yellow, marginBottom: 8 },
  createSub: { fontSize: "0.42rem", color: COLOR.gray, marginBottom: "2rem", lineHeight: 2 },
  errBanner: {
    background: "rgba(229,34,34,0.2)", border: `1px solid ${COLOR.red}`,
    borderRadius: 4, padding: "10px 14px", marginBottom: "1rem",
    fontSize: "0.42rem", color: COLOR.red,
  },
  label: { display: "block", fontSize: "0.42rem", color: COLOR.gray, marginBottom: 6 },
  formInput: {
    width: "100%", background: "rgba(0,0,0,0.3)", border: `1px solid ${COLOR.cardBorder}`,
    color: COLOR.offWhite, fontFamily: "inherit", fontSize: "0.45rem",
    padding: "12px 14px", borderRadius: 4, outline: "none",
    boxSizing: "border-box", marginBottom: "1.4rem",
    transition: "border-color .2s",
  },
  formTextarea: {
    width: "100%", background: "rgba(0,0,0,0.3)", border: `1px solid ${COLOR.cardBorder}`,
    color: COLOR.offWhite, fontFamily: "inherit", fontSize: "0.45rem",
    padding: "12px 14px", borderRadius: 4, outline: "none",
    boxSizing: "border-box", marginBottom: "1.4rem", resize: "vertical",
    transition: "border-color .2s",
  },
  imgPreview: { width: "100%", borderRadius: 6, marginBottom: "1.4rem", border: `2px solid ${COLOR.cardBorder}`, objectFit: "cover", maxHeight: 220 },
  formActions: { display: "flex", gap: 12, flexWrap: "wrap" },
  submitBtn: {
    background: COLOR.red, border: "none", color: "#fff",
    padding: "12px 22px", cursor: "pointer", fontFamily: "inherit", fontSize: "0.5rem",
    borderRadius: 4, boxShadow: `0 4px 0 ${COLOR.redDark}`,
    transition: "all .15s",
  },
  cancelBtn: {
    background: "transparent", border: `1px solid ${COLOR.cardBorder}`, color: COLOR.gray,
    padding: "12px 18px", cursor: "pointer", fontFamily: "inherit", fontSize: "0.5rem",
    borderRadius: 4,
  },
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #05090f; }

  @keyframes twinkle {
    from { opacity: 0.2; transform: scale(0.8); }
    to   { opacity: 0.9; transform: scale(1.2); }
  }
  @keyframes bounce {
    from { transform: translateY(0); }
    to   { transform: translateY(-10px); }
  }

  input:focus, textarea:focus {
    border-color: #ffd700 !important;
    box-shadow: 0 0 0 2px rgba(255,215,0,0.15);
  }

  button:active { transform: translateY(2px) !important; box-shadow: none !important; }

  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #0d1b3e; }
  ::-webkit-scrollbar-thumb { background: #e52222; border-radius: 3px; }
`;