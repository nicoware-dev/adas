import { Button } from "@/components/ui/button";
import {
    ChatBubble,
    ChatBubbleMessage,
    ChatBubbleTimestamp,
} from "@/components/ui/chat/chat-bubble";
import { ChatInput } from "@/components/ui/chat/chat-input";
import { ChatMessageList } from "@/components/ui/chat/chat-message-list";
import { useTransition, animated, type AnimatedProps } from "@react-spring/web";
import { Lightbulb, Paperclip, Send, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import type { Content, UUID, Media } from "@elizaos/core";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { cn, moment } from "@/lib/utils";
import { Avatar, AvatarImage } from "./ui/avatar";
import CopyButton from "./copy-button";
import ChatTtsButton from "./ui/chat/chat-tts-button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import AIWriter from "react-aiwriter";
import type { IAttachment } from "@/types";
import { AudioRecorder } from "./audio-recorder";
import { Badge } from "./ui/badge";
import { useAutoScroll } from "./ui/chat/hooks/useAutoScroll";
import { ExamplePrompts } from "./example-prompts";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type ExtraContentFields = {
    user: string;
    createdAt: number;
    isLoading?: boolean;
};

type ContentWithUser = Content & ExtraContentFields;

type AnimatedDivProps = AnimatedProps<{ style: React.CSSProperties }> & {
    children?: React.ReactNode;
};

// Simple Markdown renderer with consistent styling for all messages
const MarkdownRenderer = ({ children }: { children: string }) => {
    return (
        <div className="markdown-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {children}
            </ReactMarkdown>
        </div>
    );
};

export default function Page({ agentId }: { agentId: UUID }) {
    const { toast } = useToast();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [input, setInput] = useState("");
    const [showPrompts, setShowPrompts] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const formRef = useRef<HTMLFormElement>(null);
    const [messages, setMessages] = useState<ContentWithUser[]>([]);
    const messageLoadedRef = useRef(false);


    // Define the mutation outside to avoid circular dependencies
    const sendMessageMutation = useMutation({
        mutationKey: ["send_message", agentId],
        mutationFn: ({
            message,
            selectedFile,
        }: {
            message: string;
            selectedFile?: File | null;
        }) => apiClient.sendMessage(agentId, message, selectedFile),
        onSuccess: (newMessages: ContentWithUser[]) => {
            // Replace loading message with actual response
            setMessages(prevMessages => {
                const messagesWithoutLoading = prevMessages.filter(msg => !msg.isLoading);
                const messageWithTimestamp = newMessages.map((msg: ContentWithUser) => ({
                    ...msg,
                    createdAt: Date.now(),
                }));
                return [...messagesWithoutLoading, ...messageWithTimestamp];
            });
        },
        onError: (e) => {
            // Remove loading message on error
            setMessages(prevMessages => prevMessages.filter(msg => !msg.isLoading));

            toast({
                variant: "destructive",
                title: "Unable to send message",
                description: e.message,
            });
        },
    });

    // Memoize storage key to prevent unnecessary renders
    const storageKey = `chat-history-${agentId}`;

    // Load messages from localStorage on component mount (ONCE only)
    useEffect(() => {
        if (messageLoadedRef.current) return;

        try {
            const storedMessagesString = localStorage.getItem(storageKey);
            if (storedMessagesString) {
                const storedMessages = JSON.parse(storedMessagesString);
                if (Array.isArray(storedMessages) && storedMessages.length > 0) {
                    setMessages(storedMessages);
                }
            }
            messageLoadedRef.current = true;
        } catch (error) {
            console.error("Error loading messages from localStorage:", error);
        }
    }, [storageKey]);

    // Save messages to localStorage when they change
    // Use a debounced approach to prevent excessive writes
    const saveMessages = useCallback(() => {
        try {
            if (messages.length > 0) {
                // Limit to 50 messages to prevent localStorage from getting too large
                const limitedMessages = [...messages].slice(-50);
                localStorage.setItem(storageKey, JSON.stringify(limitedMessages));
            } else if (messages.length === 0) {
                localStorage.removeItem(storageKey);
            }
        } catch (error) {
            console.error("Error saving messages to localStorage:", error);
        }
    }, [messages, storageKey]);

    // Apply the debounced saving effect
    useEffect(() => {
        const timeoutId = setTimeout(saveMessages, 300);
        return () => clearTimeout(timeoutId);
    }, [saveMessages]);

    // Clear chat history
    const clearHistory = useCallback(() => {
        try {
            localStorage.removeItem(storageKey);
            setMessages([]);
        } catch (error) {
            console.error("Error clearing chat history:", error);
        }
    }, [storageKey]);

    const getMessageVariant = useCallback((role: string) =>
        role !== "user" ? "received" : "sent",
    []);

    const { scrollRef, isAtBottom, scrollToBottom, disableAutoScroll } = useAutoScroll({
        smooth: true,
    });

    // Scroll to bottom when messages change - using a layout effect to prevent flash
    useEffect(() => {
        // Only auto-scroll if we're already at the bottom or this is a new message from the user/system
        const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
        const isNewSystemMessage = lastMessage?.user === "system" && lastMessage?.isLoading;
        const shouldAutoScroll = isAtBottom || messages.length === 0 || isNewSystemMessage;

        if (scrollToBottom && shouldAutoScroll) {
            // Use setTimeout to ensure DOM is updated before scrolling
            const timeoutId = setTimeout(() => {
                scrollToBottom();
            }, 10);
            return () => clearTimeout(timeoutId);
        }
    }, [messages, scrollToBottom, isAtBottom]);

    // Track initial scroll
    const initialScrollRef = useRef(false);

    // Always scroll to bottom on first load
    useEffect(() => {
        // This effect runs only once after messages are loaded
        if (!initialScrollRef.current && scrollToBottom && messages.length > 0) {
            const timeoutId = setTimeout(() => {
                scrollToBottom();
                initialScrollRef.current = true;
            }, 100);
            return () => clearTimeout(timeoutId);
        }
    }, [messages, scrollToBottom]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (e.nativeEvent.isComposing) return;

            if (formRef.current) {
                const event = new Event('submit', { cancelable: true, bubbles: true });
                formRef.current.dispatchEvent(event);
            }
        }
    }, []);

    const handleSendMessage = useCallback((e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!input) return;

        // Handle attachments in a type-safe way
        const attachments = selectedFile
            ? [{
                id: `upload-${Date.now()}`,
                url: URL.createObjectURL(selectedFile),
                contentType: selectedFile.type,
                title: selectedFile.name,
                source: 'user-upload',
                description: selectedFile.name,
                text: ''
            }]
            : undefined;

        // Create properly typed message objects
        const newUserMessage: ContentWithUser = {
            text: input,
            user: "user",
            createdAt: Date.now(),
            attachments: attachments as Media[] | undefined,
        };

        const loadingMessage: ContentWithUser = {
            text: input,
            user: "system",
            isLoading: true,
            createdAt: Date.now(),
        };

        // Update messages state safely
        setMessages(prev => [...prev, newUserMessage, loadingMessage]);

        // Send the message
        sendMessageMutation.mutate({
            message: input,
            selectedFile: selectedFile ? selectedFile : null,
        });

        setSelectedFile(null);
        setInput("");

        // Reset form without causing a state update
        if (formRef.current) {
            formRef.current.reset();
        }
    }, [input, selectedFile, sendMessageMutation]);

    // Auto-focus input only once on mount
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file?.type.startsWith("image/")) {
            setSelectedFile(file);
        }
    }, []);

    // Type-safe key generation
    const getMessageKey = useCallback((message: ContentWithUser) => {
        return `${message.createdAt || Date.now()}-${message.user || 'unknown'}-${(typeof message.text === 'string' ? message.text.substring(0, 20) : 'message')}`;
    }, []);

    const transitions = useTransition(messages, {
        keys: getMessageKey,
        from: { opacity: 0, transform: "translateY(50px)" },
        enter: { opacity: 1, transform: "translateY(0px)" },
        leave: { opacity: 0, transform: "translateY(10px)" },
    });

    const CustomAnimatedDiv = animated.div as React.FC<AnimatedDivProps>;

    return (
        <div className="flex flex-col w-full h-[calc(100dvh)] p-4">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPrompts(!showPrompts)}
                        className="flex items-center gap-1"
                    >
                        <Lightbulb className="h-4 w-4" />
                        <span>Example Prompts</span>
                    </Button>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={clearHistory}
                    className="flex items-center gap-1"
                >
                    <Trash2 className="h-4 w-4" />
                    <span>Clear History</span>
                </Button>
            </div>

            {showPrompts && (
                <div className="p-4 border rounded-md mb-4">
                    <ExamplePrompts
                        agentId={agentId}
                        onSelectPrompt={(prompt) => {
                            setInput(prompt);
                            setShowPrompts(false);
                        }}
                    />
                </div>
            )}

            <div className="flex-1 overflow-y-auto">
                <ChatMessageList
                    scrollRef={scrollRef}
                    isAtBottom={isAtBottom}
                    scrollToBottom={scrollToBottom}
                    disableAutoScroll={disableAutoScroll}
                >
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full p-6">
                            <div className="flex flex-col gap-3 max-w-md w-full">
                                <p className="text-center text-muted-foreground text-sm mb-2">
                                    Welcome! How can I assist you today?
                                </p>
                                {!showPrompts && (
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowPrompts(true)}
                                        className="mx-auto"
                                    >
                                        <Lightbulb className="h-4 w-4 mr-2" />
                                        Show Example Prompts
                                    </Button>
                                )}
                                {showPrompts && (
                                    <ExamplePrompts
                                        agentId={agentId}
                                        onSelectPrompt={(prompt) => {
                                            setInput(prompt);
                                            setShowPrompts(false);
                                        }}
                                        className="w-full"
                                    />
                                )}
                            </div>
                        </div>
                    ) : (
                        transitions((style, message: ContentWithUser) => {
                            const variant = getMessageVariant(message?.user);
                            return (
                                <CustomAnimatedDiv
                                    style={{
                                        ...style,
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "0.5rem",
                                        padding: "1rem",
                                    }}
                                >
                                    <ChatBubble
                                        variant={variant}
                                        className="flex flex-row items-center gap-2"
                                    >
                                        {message?.user !== "user" ? (
                                            <Avatar className="size-8 p-1 border rounded-full select-none">
                                                <AvatarImage src="/elizaos-icon.png" />
                                            </Avatar>
                                        ) : null}
                                        <div className="flex flex-col">
                                            <ChatBubbleMessage
                                                isLoading={message?.isLoading}
                                            >
                                                {message?.user !== "user" ? (
                                                    message?.isLoading ? (
                                                        <AIWriter>
                                                            {message?.text}
                                                        </AIWriter>
                                                    ) : (
                                                        <MarkdownRenderer>
                                                            {message?.text}
                                                        </MarkdownRenderer>
                                                    )
                                                ) : (
                                                    message?.text
                                                )}
                                                {/* Attachments */}
                                                <div>
                                                    {message?.attachments?.map(
                                                        (attachment: IAttachment) => (
                                                            <div
                                                                className="flex flex-col gap-1 mt-2"
                                                                key={`${attachment.url}-${attachment.title}`}
                                                            >
                                                                <img
                                                                    alt="attachment"
                                                                    src={attachment.url}
                                                                    width="100%"
                                                                    height="100%"
                                                                    className="w-64 rounded-md"
                                                                />
                                                                <div className="flex items-center justify-between gap-4">
                                                                    <span />
                                                                    <span />
                                                                </div>
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            </ChatBubbleMessage>
                                            <div className="flex items-center gap-4 justify-between w-full mt-1">
                                                {message?.text &&
                                                !message?.isLoading ? (
                                                    <div className="flex items-center gap-1">
                                                        <CopyButton
                                                            text={message?.text}
                                                        />
                                                        <ChatTtsButton
                                                            agentId={agentId}
                                                            text={message?.text}
                                                        />
                                                    </div>
                                                ) : null}
                                                <div
                                                    className={cn([
                                                        message?.isLoading
                                                            ? "mt-2"
                                                            : "",
                                                        "flex items-center justify-between gap-4 select-none",
                                                    ])}
                                                >
                                                    {message?.source ? (
                                                        <Badge variant="outline">
                                                            {message.source}
                                                        </Badge>
                                                    ) : null}
                                                    {message?.action ? (
                                                        <Badge variant="outline">
                                                            {message.action}
                                                        </Badge>
                                                    ) : null}
                                                    {message?.createdAt ? (
                                                        <ChatBubbleTimestamp
                                                            timestamp={moment(
                                                                message?.createdAt
                                                            ).format("LT")}
                                                        />
                                                    ) : null}
                                                </div>
                                            </div>
                                        </div>
                                    </ChatBubble>
                                </CustomAnimatedDiv>
                            );
                        })
                    )}
                </ChatMessageList>
            </div>
            <div className="px-4 pb-4">
                <form
                    ref={formRef}
                    onSubmit={handleSendMessage}
                    className="relative rounded-md border bg-card"
                >
                    {selectedFile ? (
                        <div className="p-3 flex">
                            <div className="relative rounded-md border p-2">
                                <Button
                                    onClick={() => setSelectedFile(null)}
                                    className="absolute -right-2 -top-2 size-[22px] ring-2 ring-background"
                                    variant="outline"
                                    size="icon"
                                >
                                    <X />
                                </Button>
                                <img
                                    alt="Selected file"
                                    src={URL.createObjectURL(selectedFile)}
                                    height="100%"
                                    width="100%"
                                    className="aspect-square object-contain w-16"
                                />
                            </div>
                        </div>
                    ) : null}
                    <ChatInput
                        ref={inputRef}
                        onKeyDown={handleKeyDown}
                        value={input}
                        onChange={({ target }) => setInput(target.value)}
                        placeholder="Type your message here..."
                        className="min-h-12 resize-none rounded-md bg-card border-0 p-3 shadow-none focus-visible:ring-0"
                    />
                    <div className="flex items-center p-3 pt-0">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                            if (fileInputRef.current) {
                                                fileInputRef.current.click();
                                            }
                                        }}
                                    >
                                        <Paperclip className="size-4" />
                                        <span className="sr-only">
                                            Attach file
                                        </span>
                                    </Button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept="image/*"
                                        className="hidden"
                                    />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="left">
                                <p>Attach file</p>
                            </TooltipContent>
                        </Tooltip>
                        <AudioRecorder
                            agentId={agentId}
                            onChange={(newInput: string) => setInput(newInput)}
                        />
                        <Button
                            disabled={!input || sendMessageMutation?.isPending}
                            type="submit"
                            size="sm"
                            className="ml-auto gap-1.5 h-[30px]"
                        >
                            {sendMessageMutation?.isPending
                                ? "..."
                                : "Send Message"}
                            <Send className="size-3.5" />
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
