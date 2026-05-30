"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { addItemToCart, removeItemFromCart, fetchMyCart } from "@/stores/slices/cart.slice";
import { toggleItemFavorite } from "@/stores/slices/items.slice";
import { App } from "antd";
import {
  MessageCircle,
  Send,
  Paperclip,
  Minimize2,
  Bot,
  User,
  Shield,
  Zap,
  Armchair,
  ClipboardList,
  Gift,
  Package,
  ExternalLink,
  Rocket,
  X,
} from "lucide-react";
import styles from "./AIChatbot.module.css";

/* ── Types ─────────────────────────────────────────────────────── */

interface ProductResult {
  item_id?: string;
  name: string;
  price: string;
  location: string;
  image_url?: string;
}

interface ChatMessage {
  id: string;
  role: "bot" | "user";
  text: string;
  time: string;
  products?: ProductResult[];
  suggestions?: string[];
  banners?: string[];
  intent?: string;
  target_page?: string;
  title?: string;
  price?: number;
  condition?: string;
  city?: string;
  district?: string;
  description?: string;
  category_hint?: string;
  scope?: string;
  quantity?: number;
  action_items?: { item_id: string; title: string }[];
}

/* ── API Config ────────────────────────────────────────────────── */

const AI_SERVICE_URL = process.env.NEXT_PUBLIC_API_ENDPOINT || "http://localhost:8000";

/* ── Fallback replies (khi AI Service không khả dụng) ──────────── */

const FALLBACK_REPLIES: Record<
  string,
  { text: string; products?: ProductResult[]; suggestions?: string[]; banners?: string[] }
> = {
  "đăng tin": {
    text: "Đăng tin trên ReLife chỉ 3 bước:<br/>1️⃣ Chụp ảnh rõ nét<br/>2️⃣ Điền mô tả & giá<br/>3️⃣ Nhấn Đăng tin — <strong>miễn phí 100%</strong>!",
    suggestions: ["Đăng tin ngay", "Xem hướng dẫn chi tiết"],
  },
  "an toàn": {
    text: "✅ ReLife có <strong>3 lớp bảo vệ</strong> cho bạn:",
    banners: [
      "Nhắn tin qua hệ thống — không lộ SĐT cá nhân",
      "Gặp trực tiếp tại nơi công cộng để giao dịch",
      "Đánh giá người bán qua hệ thống đánh giá",
    ],
    suggestions: ["Hướng dẫn an toàn ↗"],
  },
};

const FALLBACK_DEFAULT = {
  text: 'Xin lỗi, trợ lý AI hiện không khả dụng. Bạn có thể thử lại sau hoặc tìm kiếm trực tiếp trên trang <strong>Sản phẩm</strong> nhé! 🌿',
  suggestions: ["Thử lại", "Tìm sản phẩm", "Hỗ trợ"],
};

/* ── Initial message ───────────────────────────────────────────── */

const INITIAL_MESSAGE: ChatMessage = {
  id: "init",
  role: "bot",
  text: '👋 Chào bạn! Mình là <strong>ReBot</strong> — trợ lý AI của ReLife.<br/><br/>Mình có thể giúp bạn <strong>tìm đồ cũ</strong>, <strong>đăng tin bán</strong>, hoặc trả lời các câu hỏi về nền tảng. Bạn cần gì hôm nay?',
  time: getNow(),
  suggestions: ["Đăng tin miễn phí", "Laptop dưới 5tr", "Giao dịch an toàn"],
};

/* ── Helpers ───────────────────────────────────────────────────── */

function getNow(): string {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function uid(): string {
  return Math.random().toString(36).substring(2, 10);
}

/* ── API Call ───────────────────────────────────────────────────── */

interface AIApiResponse {
  reply: string;
  products: ProductResult[];
  suggestions: string[];
  intent: string;
  target_page?: string;
  title?: string;
  price?: number;
  condition?: string;
  city?: string;
  district?: string;
  description?: string;
  category_hint?: string;
  scope?: string;
  quantity?: number;
  action_items?: { item_id: string; title: string }[];
}

const conversationId = uid(); // 1 session per chatbot instance

async function callAIService(message: string, currentItemId?: string | null): Promise<AIApiResponse | null> {
  try {
    const res = await fetch(`${AI_SERVICE_URL}/ai/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        conversation_id: conversationId,
        current_item_id: currentItemId || null,
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("AI Service không khả dụng, dùng fallback:", err);
    return null;
  }
}

/* ── Component ─────────────────────────────────────────────────── */

export default function AIChatbot() {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { message } = App.useApp();
  const cart = useAppSelector((state) => state.cart.cart);
  const [open, setOpen] = useState(false);

  // Extract currently viewed item's ID dynamically from URL (/items/[id])
  const itemDetailPageMatch = pathname?.match(/\/items\/([a-zA-Z0-9-]+)/);
  const currentItemId = itemDetailPageMatch ? itemDetailPageMatch[1] : null;
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* Auto-scroll to bottom */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (open) scrollToBottom();
  }, [messages, typing, open, scrollToBottom]);

  /* Auto-resize textarea */
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 80)}px`;
  };

  /* Send message */
  const handleSend = useCallback(
    async (overrideText?: string) => {
      const text = (overrideText ?? input).trim();
      if (!text || typing) return;

      const userMsg: ChatMessage = {
        id: uid(),
        role: "user",
        text,
        time: getNow(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");

      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }

      /* Call AI Service */
      setTyping(true);

      const aiResponse = await callAIService(text, currentItemId);

      setTyping(false);

      if (aiResponse) {
        /* ── AI Service trả về thành công ── */
        const botMsg: ChatMessage = {
          id: uid(),
          role: "bot",
          text: aiResponse.reply,
          time: getNow(),
          products: aiResponse.products?.length ? aiResponse.products : undefined,
          suggestions: aiResponse.suggestions?.length ? aiResponse.suggestions : undefined,
          intent: aiResponse.intent,
          target_page: aiResponse.target_page,
          title: aiResponse.title,
          price: aiResponse.price,
          condition: aiResponse.condition,
          city: aiResponse.city,
          district: aiResponse.district,
          description: aiResponse.description,
          category_hint: aiResponse.category_hint,
          scope: aiResponse.scope,
          quantity: aiResponse.quantity,
          action_items: aiResponse.action_items,
        };
        setMessages((prev) => [...prev, botMsg]);

        // Auto-redirect/auto-fill logic
        if (aiResponse.intent === "create_listing") {
          const params = new URLSearchParams();
          
          const title = aiResponse.title || "Sản phẩm secondhand";
          const price = aiResponse.price !== undefined && aiResponse.price !== null ? String(aiResponse.price) : "0";
          const condition = aiResponse.condition || "USED";
          const city = aiResponse.city || "Hà Nội";
          const district = aiResponse.district || "Cầu Giấy";
          const description = aiResponse.description || "Mô tả sản phẩm secondhand từ ReBot.";
          const category = aiResponse.category_hint || "";

          params.set("title", title);
          params.set("price", price);
          params.set("condition", condition);
          params.set("city", city);
          params.set("district", district);
          params.set("description", description);
          if (category) params.set("category", category);

          const redirectUrl = `/post-new?${params.toString()}`;
          setTimeout(() => {
            router.push(redirectUrl);
          }, 3000);
        } else if (aiResponse.intent === "navigate" && aiResponse.target_page) {
          const redirectUrl = aiResponse.target_page;
          setTimeout(() => {
            router.push(redirectUrl);
          }, 3000);
        } else if (aiResponse.intent === "add_to_cart") {
          const scope = aiResponse.scope || "current";
          if (scope === "current") {
            if (currentItemId) {
              dispatch(addItemToCart({ itemId: currentItemId }))
                .unwrap()
                .then(() => {
                  message.success("Đã thêm sản phẩm này vào giỏ hàng thành công! Đang chuyển bạn đến giỏ hàng... 🛒");
                  setTimeout(() => {
                    router.push("/cart");
                  }, 1500);
                })
                .catch((err) => {
                  message.error(err || "Không thể thêm vào giỏ hàng");
                });
            } else {
              message.warning("Bạn cần ở trang chi tiết sản phẩm cụ thể để dùng tính năng này nhé! 🔍");
            }
          } else if (scope === "search" && aiResponse.action_items?.length) {
            const addPromises = aiResponse.action_items.map((item) =>
              dispatch(addItemToCart({ itemId: item.item_id })).unwrap()
            );
            Promise.all(addPromises)
              .then(() => {
                message.success(`Đã tự động thêm ${aiResponse.action_items?.length} sản phẩm vào giỏ hàng! Đang chuyển bạn đến giỏ hàng... 🛒`);
                setTimeout(() => {
                  router.push("/cart");
                }, 1500);
              })
              .catch((err) => {
                message.error(err || "Lỗi khi thêm một số sản phẩm vào giỏ hàng");
              });
          }
        } else if (aiResponse.intent === "buy_now") {
          if (currentItemId) {
            dispatch(addItemToCart({ itemId: currentItemId }))
              .unwrap()
              .then(() => {
                message.success("Đã thêm sản phẩm vào giỏ hàng. Đang chuyển bạn đến trang thanh toán... 💳");
                setTimeout(() => {
                  router.push("/cart");
                }, 1500);
              })
              .catch((err) => {
                message.error(err || "Không thể mua ngay sản phẩm");
              });
          } else {
            message.warning("Bạn cần ở trang chi tiết sản phẩm để mua ngay nhé! 🔍");
          }
        } else if (aiResponse.intent === "favorite") {
          const scope = aiResponse.scope || "current";
          if (scope === "current") {
            if (currentItemId) {
              dispatch(toggleItemFavorite({ itemId: currentItemId, isFavorited: false }))
                .unwrap()
                .then(() => {
                  message.success("Đã thêm sản phẩm này vào yêu thích! ❤️");
                  setTimeout(() => {
                    router.push("/dashboard/favorites");
                  }, 1500);
                })
                .catch((err) => {
                  message.error(err || "Lỗi khi thêm yêu thích");
                });
            } else {
              message.warning("Bạn cần ở trang chi tiết sản phẩm để yêu thích nhé! 🔍");
            }
          } else if (scope === "search" && aiResponse.action_items?.length) {
            const favPromises = aiResponse.action_items.map((item) =>
              dispatch(toggleItemFavorite({ itemId: item.item_id, isFavorited: false })).unwrap()
            );
            Promise.all(favPromises)
              .then(() => {
                message.success(`Đã tự động yêu thích ${aiResponse.action_items?.length} sản phẩm thành công! ❤️`);
                setTimeout(() => {
                  router.push("/dashboard/favorites");
                }, 1500);
              })
              .catch((err) => {
                message.error(err || "Lỗi khi thêm sản phẩm vào yêu thích");
              });
          }
        } else if (aiResponse.intent === "clear_cart") {
          dispatch(fetchMyCart())
            .unwrap()
            .then((latestCart) => {
              const items = latestCart?.cartItems || [];
              if (items.length === 0) {
                message.info("Giỏ hàng của bạn hiện đang trống rồi nhé! 🛒");
                return;
              }
              
              message.loading("Đang xoá trống giỏ hàng của bạn... 🛒", 1.5);
              
              const removePromises = items.map((item) =>
                dispatch(removeItemFromCart(item.itemId)).unwrap()
              );
              
              Promise.all(removePromises)
                .then(() => {
                  message.success("Giỏ hàng đã được xoá trống thành công! 🛒");
                  setTimeout(() => {
                    router.push("/cart");
                  }, 1500);
                })
                .catch((err) => {
                  message.error(err || "Lỗi khi xoá một số sản phẩm trong giỏ hàng");
                });
            })
            .catch((err) => {
              message.error(err || "Không thể lấy thông tin giỏ hàng để xoá");
            });
        } else if (aiResponse.intent === "unfavorite") {
          const scope = aiResponse.scope || "current";
          if (scope === "current") {
            if (currentItemId) {
              dispatch(toggleItemFavorite({ itemId: currentItemId, isFavorited: true }))
                .unwrap()
                .then(() => {
                  message.success("Đã bỏ yêu thích sản phẩm này! 💔");
                  setTimeout(() => {
                    router.push("/dashboard/favorites");
                  }, 1500);
                })
                .catch((err) => {
                  message.error(err || "Lỗi khi bỏ yêu thích");
                });
            } else {
              message.warning("Bạn cần ở trang chi tiết sản phẩm cụ thể để bỏ yêu thích nhé! 🔍");
            }
          } else if (scope === "search" && aiResponse.action_items?.length) {
            const unfavPromises = aiResponse.action_items.map((item) =>
              dispatch(toggleItemFavorite({ itemId: item.item_id, isFavorited: true })).unwrap()
            );
            Promise.all(unfavPromises)
              .then(() => {
                message.success(`Đã tự động bỏ yêu thích ${aiResponse.action_items?.length} sản phẩm thành công! ❤️`);
                setTimeout(() => {
                  router.push("/dashboard/favorites");
                }, 1500);
              })
              .catch((err) => {
                message.error(err || "Lỗi khi bỏ yêu thích sản phẩm");
              });
          }
        }
      } else {
        /* ── Fallback mode (AI Service offline) ── */
        const low = text.toLowerCase();
        let fallback: { text: string; products?: ProductResult[]; suggestions?: string[]; banners?: string[] } = FALLBACK_DEFAULT;
        for (const [key, value] of Object.entries(FALLBACK_REPLIES)) {
          if (low.includes(key)) {
            fallback = value;
            break;
          }
        }

        const botMsg: ChatMessage = {
          id: uid(),
          role: "bot",
          text: fallback.text,
          time: getNow(),
          products: fallback.products,
          suggestions: fallback.suggestions,
          banners: fallback.banners,
        };
        setMessages((prev) => [...prev, botMsg]);
      }
    },
    [input, typing],
  );

  /* Keyboard handler */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /* Quick-ask from chips / suggestions */
  const quickAsk = (text: string) => handleSend(text);

  /* ── Render ───────────────────────────────────────────────────── */

  return (
    <>
      {/* ── Floating Action Button ──────────────────────────────── */}
      <button
        className={styles.fabButton}
        onClick={() => setOpen(!open)}
        aria-label={open ? "Đóng chatbot AI" : "Mở chatbot AI"}
        id="ai-chatbot-fab"
      >
        {open ? <X size={26} strokeWidth={2} /> : <MessageCircle size={26} strokeWidth={2} />}
        {!open && <span className={styles.fabPulse} />}
      </button>

      {/* ── Chat Window ─────────────────────────────────────────── */}
      {open && (
        <div className={styles.chatContainer}>
          <div className={styles.wrap}>
            {/* Header */}
            <div className={styles.header}>
              <div className={styles.avatar}>
                <Bot size={20} />
              </div>
              <div className={styles.headerInfo}>
                <div className={styles.headerName}>ReLife Assistant</div>
                <div className={styles.headerStatus}>
                  <span className={styles.statusDot} />
                  Đang hoạt động
                </div>
              </div>
              <button
                className={styles.headerBtn}
                onClick={() => setOpen(false)}
              >
                <Minimize2 size={13} />
                Thu nhỏ
              </button>
            </div>

            {/* Quick-chip bar */}
            <div className={styles.chips}>
              <button className={styles.chip} onClick={() => quickAsk("Tìm đồ điện tử cũ")}>
                <Zap size={11} style={{ display: "inline", marginRight: 3, verticalAlign: "-1px" }} />
                Điện tử
              </button>
              <button className={styles.chip} onClick={() => quickAsk("Đồ nội thất cũ giá rẻ")}>
                <Armchair size={11} style={{ display: "inline", marginRight: 3, verticalAlign: "-1px" }} />
                Nội thất
              </button>
              <button className={styles.chip} onClick={() => quickAsk("Cách đăng tin bán đồ")}>
                <ClipboardList size={11} style={{ display: "inline", marginRight: 3, verticalAlign: "-1px" }} />
                Đăng tin
              </button>
              <button className={styles.chip} onClick={() => quickAsk("Đồ miễn phí gần tôi")}>
                <Gift size={11} style={{ display: "inline", marginRight: 3, verticalAlign: "-1px" }} />
                Miễn phí
              </button>
            </div>

            {/* Messages */}
            <div className={styles.messages}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`${styles.msgRow} ${msg.role === "user" ? styles.msgRowUser : ""} ${styles.fadeIn}`}
                >
                  {/* Avatar */}
                  <div
                    className={`${styles.msgAvatar} ${msg.role === "user" ? styles.msgAvatarUser : ""}`}
                  >
                    {msg.role === "bot" ? <Bot size={16} /> : <User size={16} />}
                  </div>

                  {/* Content */}
                  <div>
                    <div
                      className={`${styles.bubble} ${msg.role === "bot" ? styles.bubbleBot : styles.bubbleUser}`}
                      dangerouslySetInnerHTML={{ __html: msg.text }}
                    />

                    {/* Banners (e.g. safety info) */}
                    {msg.banners?.map((banner, i) => (
                      <div className={styles.banner} key={i}>
                        <Shield size={16} className={styles.bannerIcon} />
                        {banner}
                      </div>
                    ))}

                    {/* AI Agent Redirect Card */}
                    {msg.intent === "create_listing" && (
                      <div className={styles.redirectCard}>
                        <div className={styles.redirectHeader}>
                          <Zap size={14} className={styles.redirectIcon} />
                          <span>AI Agent - Đăng tin tự động</span>
                        </div>
                        <div className={styles.redirectBody}>
                          <div><strong>Sản phẩm:</strong> {msg.title || "Sản phẩm secondhand"}</div>
                          <div><strong>Giá:</strong> {msg.price !== undefined && msg.price !== null ? msg.price.toLocaleString("vi-VN") : "0"}đ</div>
                          <div><strong>Tình trạng:</strong> {(msg.condition || "USED") === "NEW" ? "Mới 100%" : (msg.condition || "USED") === "LIKE_NEW" ? "Như mới" : "Đã sử dụng"}</div>
                          <div><strong>Địa điểm:</strong> {msg.city || "Hà Nội"}{(msg.district || "Cầu Giấy") ? `, ${msg.district || "Cầu Giấy"}` : ""}</div>
                        </div>
                        <button
                          className={styles.redirectBtn}
                          onClick={() => {
                            const params = new URLSearchParams();
                            const title = msg.title || "Sản phẩm secondhand";
                            const price = msg.price !== undefined && msg.price !== null ? String(msg.price) : "0";
                            const condition = msg.condition || "USED";
                            const city = msg.city || "Hà Nội";
                            const district = msg.district || "Cầu Giấy";
                            const description = msg.description || "Mô tả sản phẩm secondhand từ ReBot.";
                            const category = msg.category_hint || "";

                            params.set("title", title);
                            params.set("price", price);
                            params.set("condition", condition);
                            params.set("city", city);
                            params.set("district", district);
                            params.set("description", description);
                            if (category) params.set("category", category);
                            router.push(`/post-new?${params.toString()}`);
                          }}
                        >
                          Đi tới trang đăng tin ngay &rarr;
                        </button>
                      </div>
                    )}

                    {msg.intent === "navigate" && msg.target_page && (
                      <div className={styles.redirectCard}>
                        <div className={styles.redirectHeader}>
                          <Rocket size={14} className={styles.redirectIcon} />
                          <span>AI Agent - Chuyển hướng nhanh</span>
                        </div>
                        <div className={styles.redirectBody}>
                          <span>ReBot đang tự động chuyển bạn sang giao diện yêu cầu...</span>
                        </div>
                        <button
                          className={styles.redirectBtn}
                          onClick={() => router.push(msg.target_page!)}
                        >
                          Chuyển hướng ngay &rarr;
                        </button>
                      </div>
                    )}

                    {/* Product cards */}
                    {msg.products?.map((product, i) => (
                      <a
                        href={product.item_id ? `/items/${product.item_id}` : undefined}
                        key={i}
                        className={styles.productCard}
                        style={{ textDecoration: "none" }}
                      >
                        <div className={styles.pcImg}>
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 6 }}
                            />
                          ) : (
                            <Package size={22} />
                          )}
                        </div>
                        <div className={styles.pcInfo}>
                          <div className={styles.pcName}>{product.name}</div>
                          <div className={styles.pcPrice}>{product.price}</div>
                          <div className={styles.pcLoc}>{product.location}</div>
                        </div>
                        {product.item_id && (
                          <ExternalLink size={14} style={{ color: "#64748b", flexShrink: 0 }} />
                        )}
                      </a>
                    ))}

                    {/* Suggestion buttons */}
                    {msg.suggestions && msg.suggestions.length > 0 && (
                      <div className={styles.suggestRow}>
                        {msg.suggestions.map((s, i) => (
                          <button
                            key={i}
                            className={styles.suggestBtn}
                            onClick={() => quickAsk(s)}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}

                    <span
                      className={`${styles.bubbleTime} ${msg.role === "user" ? styles.bubbleTimeRight : ""}`}
                    >
                      {msg.time}
                    </span>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {typing && (
                <div className={`${styles.msgRow} ${styles.fadeIn}`}>
                  <div className={styles.msgAvatar}>
                    <Bot size={16} />
                  </div>
                  <div className={styles.typingBubble}>
                    <div className={styles.typingDot} />
                    <div className={styles.typingDot} />
                    <div className={styles.typingDot} />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className={styles.inputArea}>
              <button className={styles.attachBtn} title="Đính kèm ảnh">
                <Paperclip size={18} />
              </button>
              <textarea
                ref={textareaRef}
                className={styles.inputField}
                rows={1}
                placeholder="Nhắn tin hỏi ReBot..."
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
              />
              <button
                className={styles.sendBtn}
                onClick={() => handleSend()}
                disabled={!input.trim() || typing}
                aria-label="Gửi tin nhắn"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
