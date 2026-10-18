"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import { Message, MessageContent } from "@/components/ui/message";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import { Popover, PopoverContent, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";

const THINKING_MS = 1000;

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-0.5 py-1" aria-label="Typing" role="status">
      <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
      <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
      <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" />
    </div>
  );
}

const FAQS = [
  {
    q: "What payment methods do you accept?",
    a: "Cash on delivery (COD) and VNPay (sandbox) — pick either at checkout.",
  },
  {
    q: "How long does shipping take?",
    a: "Standard is 3–5 days, Express 1–2 days, or free in-store pickup — you choose at checkout.",
  },
  {
    q: "Can I cancel my order?",
    a: "Yes — go to Account > Orders. Cancel is available as long as the order is still at the \"Placed\" step.",
  },
  {
    q: "What's your return policy?",
    a: "See the Return policy page in the footer for full details.",
  },
  {
    q: "How do I track my order?",
    a: "Account > Orders shows live delivery progress for every order you've placed.",
  },
] as const;

type Turn = { id: string; role: "bot" | "user"; text: string };

const GREETING: Turn = { id: "msg-0", role: "bot", text: "Hi! Pick a question below and I'll answer right away." };

/** Fully hardcoded FAQ widget — no AI, no backend call. Clicking a question
 * appends it plus its canned answer as chat turns; once every question has
 * been asked, the button list is replaced with a closing note. Scroll
 * behavior (anchoring the question near the top, following the reply in)
 * comes from shadcn's MessageScroller rather than a plain ScrollArea. */
export function FaqChatWidget() {
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([GREETING]);
  const [answered, setAnswered] = useState<number[]>([]);
  const [thinking, setThinking] = useState(false);

  function ask(index: number) {
    const { q, a } = FAQS[index];
    setTurns((t) => [...t, { id: `msg-${t.length}`, role: "user", text: q }]);
    setAnswered((prev) => [...prev, index]);
    setThinking(true);
    setTimeout(() => {
      setTurns((t) => [...t, { id: `msg-${t.length}`, role: "bot", text: a }]);
      setThinking(false);
    }, THINKING_MS);
  }

  const remaining = FAQS.map((_, i) => i).filter((i) => !answered.includes(i));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            size="icon-lg"
            className="fixed bottom-6 right-6 z-50 size-12 rounded-full shadow-lg"
            aria-label="Help"
          >
            <MessageCircle />
          </Button>
        }
      />
      <PopoverContent align="end" side="top" sideOffset={12} className="w-80 p-0">
        <PopoverHeader className="border-b border-border px-4 py-3">
          <PopoverTitle>Need help?</PopoverTitle>
        </PopoverHeader>

        <MessageScrollerProvider autoScroll>
          <MessageScroller className="h-72">
            <MessageScrollerViewport>
              <MessageScrollerContent className="px-4 py-3">
                {turns.map((turn) => (
                  <MessageScrollerItem key={turn.id} messageId={turn.id} scrollAnchor={turn.role === "user"}>
                    <Message align={turn.role === "user" ? "end" : "start"}>
                      <MessageContent>
                        <Bubble variant={turn.role === "user" ? "default" : "muted"}>
                          <BubbleContent>{turn.text}</BubbleContent>
                        </Bubble>
                      </MessageContent>
                    </Message>
                  </MessageScrollerItem>
                ))}
                {thinking && (
                  <MessageScrollerItem key="thinking" messageId="thinking">
                    <Message align="start">
                      <MessageContent>
                        <Bubble variant="muted">
                          <BubbleContent>
                            <TypingDots />
                          </BubbleContent>
                        </Bubble>
                      </MessageContent>
                    </Message>
                  </MessageScrollerItem>
                )}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton />
          </MessageScroller>
        </MessageScrollerProvider>

        <div className="border-t border-border p-3">
          {remaining.length > 0 ? (
            <div className="flex flex-col gap-2">
              {remaining.map((i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className="justify-start text-left"
                  disabled={thinking}
                  onClick={() => ask(i)}
                >
                  {FAQS[i].q}
                </Button>
              ))}
            </div>
          ) : (
            <p className="text-center text-xs text-muted-foreground">That&apos;s everything I can help with for now.</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
