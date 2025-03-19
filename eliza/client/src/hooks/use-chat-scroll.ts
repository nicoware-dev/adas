import { useAutoScroll } from "@/components/ui/chat/hooks/useAutoScroll";
import { useEffect, useRef } from "react";
import type { Content } from "@elizaos/core";

interface Message extends Content {
    user: string;
    createdAt: number;
    isLoading?: boolean;
}

interface UseChatScrollOptions {
    messages: Message[];
    isAtBottom: boolean;
    initialScrollRef: React.MutableRefObject<boolean>;
}

export function useChatScroll({ messages, isAtBottom, initialScrollRef }: UseChatScrollOptions) {
    const { scrollToBottom } = useAutoScroll({
        smooth: true,
    });

    const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

    useEffect(() => {
        const shouldScroll = isAtBottom && typeof scrollToBottom === 'function';
        const lastMessage = messages[messages.length - 1];
        const isNewMessage = lastMessage && (messages.length === 1 || lastMessage.user === "system" || !initialScrollRef.current);

        if (shouldScroll && isNewMessage) {
            timeoutRef.current = setTimeout(() => {
                if (typeof scrollToBottom === 'function') {
                    scrollToBottom();
                    initialScrollRef.current = true;
                }
            }, 100);
        }

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [messages, scrollToBottom, isAtBottom, initialScrollRef]);

    return { scrollToBottom };
}
