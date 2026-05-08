"use client";

import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatWindow from "@/components/chat/ChatWindow";
import { chatSocketService } from "@/stores/slices/chat.slice";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import {
  connectChatSocket,
  createConversation,
  disconnectChatSocket,
  fetchConversationMessages,
  fetchMyConversations,
  reactToChatMessage,
  receiveSocketMessage,
  sendChatMessage,
  setActiveConversation,
  setParticipantOnlineStatus,
  upsertConversation,
} from "@/stores/slices/chat.slice";
import { ChatMessage, ReplyMessage } from "@/types/message.type";
import { Empty } from "antd";
import dayjs from "dayjs";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";

const ChatWindowPageContent = () => {
  const dispatch = useAppDispatch();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationSubscriptionsRef = useRef<Map<string, () => void>>(new Map());
  const routeConversationId = params?.id;
  const pendingReplyQueueRef = useRef<
    Array<{
      conversationId: string;
      receiverId: string;
      content: string;
      sentAt: number;
      replyTo: ReplyMessage;
    }>
  >([]);

  const { user, isAuth } = useAppSelector((state) => state.auth);
  const { connected, conversations, activeConversationId, messagesByConversation } = useAppSelector(
    (state) => state.chat
  );
  const [replyingTo, setReplyingTo] = useState<ReplyMessage | null>(null);
  const [localReplyByMessageId, setLocalReplyByMessageId] = useState<Record<string, ReplyMessage>>({});
  const activeConversation = conversations.find(
    (conversation) => conversation.id === activeConversationId
  );
  const activeMessages = activeConversation
    ? messagesByConversation[activeConversation.id] || []
    : [];
  const activeMessagesWithLocalReply = useMemo(
    () =>
      activeMessages.map((message) => {
        if (message.replyTo || !localReplyByMessageId[message.id]) {
          return message;
        }

        return {
          ...message,
          replyTo: localReplyByMessageId[message.id],
        } as ChatMessage;
      }),
    [activeMessages, localReplyByMessageId]
  );

  useEffect(() => {
    if (!activeConversation?.id || !user?.userId || pendingReplyQueueRef.current.length === 0) {
      return;
    }

    const queue = pendingReplyQueueRef.current;
    const nextReplyByMessageId: Record<string, ReplyMessage> = {};
    const usedQueueIndexes = new Set<number>();

    activeMessages.forEach((message) => {
      if (
        message.conversationId !== activeConversation.id ||
        message.senderId !== user.userId ||
        message.replyTo ||
        localReplyByMessageId[message.id]
      ) {
        return;
      }

      const createdAtValue = dayjs(message.createdAt).valueOf();
      const pendingIndex = queue.findIndex((pending, index) => {
        if (usedQueueIndexes.has(index)) {
          return false;
        }

        if (
          pending.conversationId !== message.conversationId ||
          pending.receiverId !== message.receiverId ||
          pending.content !== message.content
        ) {
          return false;
        }

        return createdAtValue >= pending.sentAt - 3000 && createdAtValue <= pending.sentAt + 180000;
      });

      if (pendingIndex === -1) {
        return;
      }

      usedQueueIndexes.add(pendingIndex);
      nextReplyByMessageId[message.id] = queue[pendingIndex].replyTo;
    });

    if (Object.keys(nextReplyByMessageId).length === 0) {
      return;
    }

    setLocalReplyByMessageId((previous) => ({
      ...previous,
      ...nextReplyByMessageId,
    }));

    pendingReplyQueueRef.current = queue.filter((_, index) => !usedQueueIndexes.has(index));
  }, [activeConversation?.id, activeMessages, localReplyByMessageId, user?.userId]);

  useEffect(() => {
    if (!routeConversationId) {
      return;
    }

    dispatch(setActiveConversation(routeConversationId));
  }, [dispatch, routeConversationId]);

  // useEffect(() => {
  //   if (isAuth) {
  //     return;
  //   }

  //   router.replace("/home");
  // }, [isAuth, router]);

  useEffect(() => {
    if (!routeConversationId) {
      return;
    }
    const foundConversation = conversations.find(
      (conversation) => conversation.id === routeConversationId
    );

    if (foundConversation) {
      return;
    }

    const participantId = searchParams.get("userId") || "unknown";
    const now = new Date().toISOString();

    dispatch(
      upsertConversation({
        id: routeConversationId,
        participantId,
        name: searchParams.get("name") || "Cuộc trò chuyện",
        avatar: searchParams.get("avatar") || "U",
        isOnline: false,
        time: dayjs(now).format("HH:mm"),
        lastMessage: "Bắt đầu cuộc trò chuyện",
        unreadCount: 0,
        updatedAt: now,
      })
    );
  }, [conversations, dispatch, routeConversationId, searchParams]);

  useEffect(() => {
    if (!isAuth || !user?.userId) {
      return;
    }

    dispatch(fetchMyConversations());
    dispatch(connectChatSocket());

    return () => {
      dispatch(disconnectChatSocket());
    };
  }, [dispatch, isAuth, user?.userId]);

  useEffect(() => {
    if (!activeConversation?.id) {
      return;
    }

    dispatch(fetchConversationMessages(activeConversation.id));
  }, [activeConversation?.id, dispatch]);

  useEffect(() => {
    if (!connected || !user?.userId) {
      return;
    }

    const unsubscribeConversationEvents = chatSocketService.subscribeUserConversations(user.userId, () => {
      dispatch(fetchMyConversations());
    });

    const unsubscribePresence = chatSocketService.subscribePresence((event) => {
      dispatch(
        setParticipantOnlineStatus({
          participantId: event.userId,
          isOnline: event.isOnline,
        })
      );
    });

    return () => {
      unsubscribeConversationEvents();
      unsubscribePresence();
    };
  }, [connected, dispatch, user?.userId]);

  useEffect(() => {
    if (!connected || !user?.userId) {
      conversationSubscriptionsRef.current.forEach((unsubscribe) => unsubscribe());
      conversationSubscriptionsRef.current.clear();
      return;
    }

    const subscriptionMap = conversationSubscriptionsRef.current;
    const conversationIds = new Set(conversations.map((conversation) => conversation.id));

    conversations.forEach((conversation) => {
      if (subscriptionMap.has(conversation.id)) {
        return;
      }

      const unsubscribe = chatSocketService.subscribeConversation(conversation.id, (payload) => {
        dispatch(
          receiveSocketMessage({
            payload,
            currentUserId: user.userId,
          })
        );
      });

      subscriptionMap.set(conversation.id, unsubscribe);
    });

    Array.from(subscriptionMap.entries()).forEach(([conversationId, unsubscribe]) => {
      if (conversationIds.has(conversationId)) {
        return;
      }

      unsubscribe();
      subscriptionMap.delete(conversationId);
    });
  }, [connected, conversations, dispatch, user?.userId]);

  useEffect(() => {
    const participantId = searchParams.get("userId");
    const participantName = searchParams.get("name");
    const participantAvatar = searchParams.get("avatar");

    if (!participantId || activeConversation?.participantId === participantId) {
      return;
    }

    const existingConversation = conversations.find(
      (conversation) => conversation.participantId === participantId
    );

    if (existingConversation) {
      if (participantName || participantAvatar) {
        dispatch(
          upsertConversation({
            ...existingConversation,
            name: participantName || existingConversation.name,
            avatar: participantAvatar || existingConversation.avatar,
          })
        );
      }
      return;
    }

    dispatch(
      createConversation({
        participantId,
        participantName: participantName || undefined,
        participantAvatar: participantAvatar || undefined,
      })
    );
  }, [activeConversation?.participantId, conversations, dispatch, searchParams]);

  useEffect(() => {
    const subscriptionMap = conversationSubscriptionsRef.current;

    return () => {
      subscriptionMap.forEach((unsubscribe) => unsubscribe());
      subscriptionMap.clear();
    };
  }, []);

  const handleSendMessage = useCallback(
    async (content: string, options?: { replyTo?: ReplyMessage }) => {
      if (!activeConversation) {
        return;
      }

      if (options?.replyTo) {
        pendingReplyQueueRef.current.push({
          conversationId: activeConversation.id,
          receiverId: activeConversation.participantId,
          content,
          sentAt: Date.now(),
          replyTo: options.replyTo,
        });
      }

      await dispatch(
        sendChatMessage({
          conversationId: activeConversation.id,
          receiverId: activeConversation.participantId,
          content,
          type: "TEXT",
          replyTo: options?.replyTo,
        })
      ).unwrap();

      setReplyingTo(null);
    },
    [activeConversation, dispatch]
  );

  const handleReplyMessage = useCallback((reply: ReplyMessage) => {
    setReplyingTo(reply);
  }, []);

  const handleCancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  const handleReactMessage = useCallback(
    (messageId: string, emoji: string) => {
      dispatch(reactToChatMessage({ messageId, emoji }));
    },
    [dispatch]
  );

  const handleSelectConversation = useCallback(
    (conversationId: string) => {
      dispatch(setActiveConversation(conversationId));
    },
    [dispatch]
  );

  return (
    <div className="h-[calc(100vh-73px)] w-full">
      <div className="h-full overflow-hidden border-y border-(--line) bg-white">
        <div className="grid h-full grid-cols-1 lg:grid-cols-[320px_1fr]">
          <ChatSidebar
            conversations={conversations}
            activeConversationId={activeConversation?.id}
            onConversationSelect={handleSelectConversation}
          />
          {activeConversation ? (
            <ChatWindow
              conversation={activeConversation}
              messages={activeMessagesWithLocalReply}
              currentUserId={user?.userId || ""}
              canSendMessage={
                Boolean(activeConversation.participantId) &&
                activeConversation.participantId !== "unknown" &&
                connected
              }
              onSendMessage={handleSendMessage}
              replyingTo={replyingTo}
              onCancelReply={handleCancelReply}
              onReplyMessage={handleReplyMessage}
              onReactMessage={handleReactMessage}
              currentUserName={user?.fullName || user?.email || "Bạn"}
            />
          ) : (
            <div className="flex items-center justify-center bg-slate-50">
              <Empty description="Chọn một cuộc trò chuyện để bắt đầu" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ChatWindowPage = () => {
  return (
    <Suspense fallback={<div className="h-[calc(100vh-73px)] bg-slate-50" />}>
      <ChatWindowPageContent />
    </Suspense>
  );
};

export default ChatWindowPage;