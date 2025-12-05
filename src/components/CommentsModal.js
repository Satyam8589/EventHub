"use client";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function CommentsModal({ reel, onClose }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const commentsEndRef = useRef(null);

  // Fetch comments
  useEffect(() => {
    fetchComments();
  }, [reel.id]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/reels/${reel.id}/comments`);
      const data = await response.json();
      
      if (response.ok) {
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  };

  // Post comment
  const handlePostComment = async () => {
    if (!newComment.trim() || posting) return;

    setPosting(true);
    try {
      const response = await fetch(`/api/reels/${reel.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          comment: newComment.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setComments((prev) => [...prev, data.comment]);
        setNewComment("");
        // Scroll to bottom
        setTimeout(() => {
          commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    } catch (error) {
      console.error("Error posting comment:", error);
      alert("Failed to post comment. Please try again.");
    } finally {
      setPosting(false);
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId) => {
    if (!confirm("Are you sure you want to delete this comment?")) {
      return;
    }

    try {
      const response = await fetch(`/api/reels/${reel.id}/comments/${commentId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Remove from local state
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      } else {
        alert("Failed to delete comment");
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("Failed to delete comment. Please try again.");
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-white text-lg font-semibold">Comments</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              <p className="text-white/70 mt-2">Loading comments...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-4xl mb-2 block">💬</span>
              <p className="text-white/60">No comments yet</p>
              <p className="text-white/40 text-sm mt-1">Be the first to comment!</p>
            </div>
          ) : (
            <>
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {comment.users?.username?.[0]?.toUpperCase() || "U"}
                  </div>

                  {/* Comment Content */}
                  <div className="flex-1">
                    <div className="bg-white/5 rounded-2xl px-3 py-2 relative group">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-semibold text-sm">
                          @{comment.users?.username || "user"}
                        </p>
                        <span className="text-gray-500 text-xs">•</span>
                        <p className="text-gray-400 text-xs">
                          {formatDateTime(comment.created_at)}
                        </p>
                        
                        {/* Delete button - only show for own comments */}
                        {user && comment.user_id === user.uid && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 text-xs"
                            title="Delete comment"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                      <p className="text-white/90 text-sm break-words">
                        {comment.comment}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={commentsEndRef} />
            </>
          )}
        </div>

        {/* Comment Input */}
        <div className="p-4 border-t border-white/10">
          {!user ? (
            // Not logged in - show login prompt
            <div className="text-center py-2">
              <p className="text-white/60 text-sm mb-2">
                Sign in to comment
              </p>
              <button
                onClick={onClose}
                className="text-blue-400 hover:text-blue-300 text-sm font-medium"
              >
                Close and sign in
              </button>
            </div>
          ) : (
            // Logged in - show comment input
            <div className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handlePostComment();
                  }
                }}
                placeholder="Add a comment..."
                className="flex-1 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={posting}
              />
              <button
                onClick={handlePostComment}
                disabled={!newComment.trim() || posting}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-full font-medium transition-all"
              >
                {posting ? "..." : "Send"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
