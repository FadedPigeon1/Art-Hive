import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { useAuth } from "../context/AuthContext";
import { messagesAPI } from "../utils/api";
import { toast } from "react-toastify";
import {
  FiMessageCircle,
  FiSend,
  FiX,
  FiChevronLeft,
  FiTrash2,
} from "react-icons/fi";
import { getProfilePicture } from "../utils/imageHelpers";
import { formatDistanceToNow } from "date-fns";

const Chat = ({ socket, isOpen, onClose }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Fetch conversations on mount
  useEffect(() => {
    if (isOpen && user) {
      fetchConversations();
    }
  }, [isOpen, user]);

  // Listen for real-time messages
  useEffect(() => {
    if (socket && user) {
      socket.on("new-message", ({ conversationId, message }) => {
        // Update messages if in current conversation
        if (selectedConversation?._id === conversationId) {
          setMessages((prev) => [...prev, message]);
          scrollToBottom();
        }

        // Update conversation list
        fetchConversations();
      });

      return () => {
        socket.off("new-message");
      };
    }
  }, [socket, user, selectedConversation]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = async () => {
    try {
      const data = await messagesAPI.getConversations();
      setConversations(data);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      setLoading(true);
      const data = await messagesAPI.getMessages(conversationId);
      setMessages(data);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    fetchMessages(conversation._id);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!messageText.trim() || !selectedConversation) return;

    try {
      setSending(true);
      const message = await messagesAPI.sendMessage(
        selectedConversation._id,
        messageText.trim()
      );
      setMessages((prev) => [...prev, message]);
      setMessageText("");
      scrollToBottom();

      // Update conversation list
      fetchConversations();
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleDeleteConversation = async (conversationId) => {
    if (!window.confirm("Delete this conversation?")) return;

    try {
      await messagesAPI.deleteConversation(conversationId);
      setConversations((prev) => prev.filter((c) => c._id !== conversationId));
      if (selectedConversation?._id === conversationId) {
        setSelectedConversation(null);
        setMessages([]);
      }
      toast.success("Conversation deleted");
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast.error("Failed to delete conversation");
    }
  };

  const getOtherParticipant = (conversation) => {
    return conversation.participants.find((p) => p._id !== user._id);
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-background-light dark:bg-background-dark border-2 border-border-light dark:border-border-dark rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-light to-primary-dark text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {selectedConversation && (
            <button
              onClick={() => {
                setSelectedConversation(null);
                setMessages([]);
              }}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <FiChevronLeft size={20} />
            </button>
          )}
          <FiMessageCircle size={20} />
          <h3 className="font-bold">
            {selectedConversation
              ? getOtherParticipant(selectedConversation)?.username
              : "Messages"}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/20 rounded-full transition-colors"
        >
          <FiX size={20} />
        </button>
      </div>

      {/* Content */}
      {!selectedConversation ? (
        /* Conversation List */
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-text-secondary-light dark:text-text-secondary-dark">
              <FiMessageCircle size={48} className="opacity-30 mb-3" />
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs mt-1">Visit a profile to start chatting</p>
            </div>
          ) : (
            <div className="divide-y divide-border-light dark:divide-border-dark">
              {conversations.map((conversation) => {
                const otherUser = getOtherParticipant(conversation);
                return (
                  <div
                    key={conversation._id}
                    onClick={() => handleSelectConversation(conversation)}
                    className="p-4 hover:bg-surface-light dark:hover:bg-surface-dark cursor-pointer transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <img
                        src={getProfilePicture(otherUser?.profilePic)}
                        alt={otherUser?.username}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-text-primary-light dark:text-text-primary-dark truncate">
                          {otherUser?.username}
                        </p>
                        {conversation.lastMessage && (
                          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark truncate">
                            {conversation.lastMessage.sender._id === user._id
                              ? "You: "
                              : ""}
                            {conversation.lastMessage.text}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      {conversation.lastMessageAt && (
                        <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                          {formatDistanceToNow(
                            new Date(conversation.lastMessageAt),
                            { addSuffix: true }
                          )}
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteConversation(conversation._id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded text-red-500 transition-opacity"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Messages View */
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center h-full text-text-secondary-light dark:text-text-secondary-dark">
                Loading...
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-text-secondary-light dark:text-text-secondary-dark">
                <p className="text-sm">No messages yet</p>
              </div>
            ) : (
              messages.map((message) => {
                const isOwn = message.sender._id === user._id;
                return (
                  <div
                    key={message._id}
                    className={`flex ${
                      isOwn ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                        isOwn
                          ? "bg-primary-light text-white rounded-br-none"
                          : "bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark rounded-bl-none"
                      }`}
                    >
                      <p className="text-sm break-words">{message.text}</p>
                      <p
                        className={`text-xs mt-1 ${
                          isOwn
                            ? "text-white/70"
                            : "text-text-secondary-light dark:text-text-secondary-dark"
                        }`}
                      >
                        {formatDistanceToNow(new Date(message.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <form
            onSubmit={handleSendMessage}
            className="p-4 border-t border-border-light dark:border-border-dark"
          >
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-full focus:outline-none focus:border-primary-light text-text-primary-light dark:text-text-primary-dark"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={!messageText.trim() || sending}
                className="p-2 bg-primary-light text-white rounded-full hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FiSend size={18} />
              </button>
            </div>
          </form>
        </>
      )}
    </div>,
    document.body
  );
};

export default Chat;
