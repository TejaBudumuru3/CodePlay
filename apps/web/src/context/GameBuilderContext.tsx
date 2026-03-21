"use client";

import {
  ClarificationResponse,
  PlanResponse,
  BuildResponse,
  SessionStatus
} from "@packages/model/types";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";

export interface ChatMessage {
  id: string;
  role: "user" | "system" | "agent" | "status";
  content: string;
  timestamp: Date;
  data?: ClarificationResponse | PlanResponse | BuildResponse;
}

export interface SessionSummary {
  id: string;
  prompt: string;
  status: string;
  createdAt: string;
  plan?: PlanResponse | null;
}

interface GameBuilderState {
  sessionId: string | null;
  status: SessionStatus;
  messages: ChatMessage[];
  clarification: ClarificationResponse | null;
  plan: PlanResponse | null;
  code: BuildResponse | null;
  streamingCode: string;
  error: string | null;
  isLoading: boolean;
  sessions: SessionSummary[];
  reviewCount: number;
}

interface GameBuilderContextType extends GameBuilderState {
  startNewGame: (prompt: string) => Promise<void>;
  answerClarification: (answer: string) => Promise<void>;
  loadSession: (sessionId: string) => Promise<void>;
  loadSessions: () => Promise<void>;
  resetGame: () => void;
  retry: () => void;
}

const GameBuilderContext = createContext<GameBuilderContextType | null>(null);

export function useGameBuilder() {
  const ctx = useContext(GameBuilderContext);
  if (!ctx) throw new Error("useGameBuilder must be used within GameBuilderProvider");
  return ctx;
}

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export function GameBuilderProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameBuilderState>({
    sessionId: null,
    status: "IDLE",
    messages: [],
    clarification: null,
    plan: null,
    code: null,
    streamingCode: "",
    error: null,
    isLoading: false,
    sessions: [],
    reviewCount: 0,
  });

  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPollingRef = useRef(false);
  // Stable ref so polling callbacks can refresh sessions without circular deps
  const loadSessionsRef = useRef<() => Promise<void>>(async () => { });
  const eventSourceRef = useRef<EventSource | null>(null);

  const addMessage = useCallback(
    (role: ChatMessage["role"], content: string, data?: ChatMessage["data"]) => {
      setState((prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          { id: generateId(), role, content, timestamp: new Date(), data },
        ],
      }));
    },
    []
  );

  const startStream = useCallback((sessionId: string) => {

    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      streamingCode: "",
      isLoading: true,
      status: "BUILDING",
    }))

    addMessage("status", "connecting to agent to start building....");

    const es = new EventSource(`/api/stream?sessionId=${sessionId}`);
    eventSourceRef.current = es;

    es.addEventListener("code_chunk", (e) => {
      const { chunk } = JSON.parse(e.data);
      setState((prev) => ({
        ...prev,
        streamingCode: prev.streamingCode + chunk,
        status: 'BUILDING'
      }));
    });

    es.addEventListener("status", (e) => {
      const { status, attempt, max } = JSON.parse(e.data);
      setState((prev) => ({
        ...prev,
        status: status as SessionStatus,
        reviewCount: attempt || prev.reviewCount
      }));

      if (status === 'REVIEW') {
        addMessage("status", `Code Reviewer reviewing the code${attempt ? ` (attempt ${attempt}/${max})` : '...'}`)
      }

      else if (status === 'REBUILD') {
        addMessage("status", `Issue found, resolving the issues ${attempt ? `(attempt ${attempt}/${max})` : "..."} `)
        setState((prev) => ({ ...prev, streamingCode: "", }))
      }
    })

    es.addEventListener("review_result", (e) => {
      const { passed, issues } = JSON.parse(e.data);
      if (passed) {
        addMessage("status", 'code review passed ')
      }
      else {
        addMessage('status', `Reviewer found ${issues?.length ?? 0} issues(s) - fixing...`)
      }
    })


    es.addEventListener("complete", (e) => {
      const { code } = JSON.parse(e.data);
      setState((prev) => ({
        ...prev,
        status: "COMPLETED",
        code: { code },
        streamingCode: "",
        isLoading: false
      }))

      addMessage('agent', 'Your game is ready, checK the Code and Preview tabs')
      void loadSessionsRef.current();
      es.close();
      eventSourceRef.current = null;
    })

    es.addEventListener("error", (e) => {
      if (es.readyState === EventSource.CLOSED) {
        setState((prev) => ({
          ...prev,
          status: 'FAILED',
          error: "stream connection lost",
          isLoading: false
        }))
        addMessage('system', 'Stream connection lost, please try again');
        eventSourceRef.current = null;
      }
      else {
        try {
          const { message } = JSON.parse((e as MessageEvent).data);
          setState((prev) => ({
            ...prev,
            status: 'FAILED',
            error: message,
            isLoading: false
          }))

          addMessage('system', `Build Failed ${message}`)
        }
        catch {
          setState((prev) => ({
            ...prev,
            status: 'FAILED',
            error: "Unknown error",
            isLoading: false
          }))
          addMessage('system', "Build Failed: Unknown error")
        }
        finally {
          es.close();
          eventSourceRef.current = null;
        }
      }
    })


  }, [addMessage]);

  const stopPolling = useCallback(() => {
    isPollingRef.current = false;
    if (pollingRef.current) {
      clearTimeout(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const callChatApi = useCallback(
    async (body: { sessionId?: string; message?: string; prompt?: string }) => {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error || "Request failed");
      }

      return res.json();
    },
    []
  );

  const processResponse = useCallback(
    (result: { type: string; data: unknown; sessionId: string }) => {
      const { type, data, sessionId } = result;

      setState((prev) => ({ ...prev, sessionId, isLoading: false }));

      switch (type) {
        case "INIT":
        case "CLARIFYING": {
          const clarification = data as ClarificationResponse;
          if (clarification.isSufficient) {
            setState((prev) => ({
              ...prev,
              status: "PLANNING",
              clarification,
            }));
            addMessage("status", "Requirements clarified! Planning your game...");
            // Auto-poll for planning
            pollNext(sessionId);
          } else {
            setState((prev) => ({
              ...prev,
              status: "CLARIFYING",
              clarification,
            }));
            addMessage(
              "agent",
              "I have a few questions to design your game:",
              clarification   // pass the full object — ChatInterface will render MCQ cards from msg.data
            );
          }
          break;
        }

        case "PLANNING": {
          const plan = data as PlanResponse;
          setState((prev) => ({
            ...prev,
            status: "BUILDING",
            plan,
          }));
          addMessage(
            "status",
            `Plan ready: "${plan.title}" — Now generating code...`
          );
          // Auto-poll for building
          pollNext(sessionId);
          break;
        }

        case "STREAM_REQUIRED": {
          startStream(sessionId);
          break;
        }

        case "COMPLETED": {
          const code = data as BuildResponse;
          setState((prev) => ({
            ...prev,
            status: "COMPLETED",
            code,
          }));
          stopPolling();
          break;
        }

        case "ERROR": {
          setState((prev) => ({
            ...prev,
            status: "FAILED",
            error: data as string,
          }));
          addMessage("system", `Error: ${data}`);
          stopPolling();
          break;
        }
      }
    },
    [addMessage, stopPolling, startStream]
  );

  const pollNext = useCallback(
    (sessionId: string) => {
      if (isPollingRef.current) return;
      isPollingRef.current = true;

      const doPoll = async () => {
        if (!isPollingRef.current) return;
        try {
          setState((prev) => ({ ...prev, isLoading: true }));
          const result = await callChatApi({ sessionId });
          // Reset BEFORE processResponse so chained pollNext calls inside it succeed
          isPollingRef.current = false;
          pollingRef.current = null;
          processResponse(result);
          // Refresh sidebar after every poll cycle (status may have changed)
          void loadSessionsRef.current();
        } catch (err) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            status: "FAILED",
            error: err instanceof Error ? err.message : "Unknown error",
          }));
          addMessage(
            "system",
            `Error: ${err instanceof Error ? err.message : "Unknown error"}`
          );
          stopPolling();
        }
      };

      // 2-second delay to allow the backend to process
      pollingRef.current = setTimeout(doPoll, 2000);
    },
    [callChatApi, processResponse, addMessage, stopPolling]
  );

  const startNewGame = useCallback(
    async (prompt: string) => {
      stopPolling();
      setState((prev) => ({
        ...prev,
        sessionId: null,
        status: "INIT",
        messages: [],
        clarification: null,
        plan: null,
        code: null,
        error: null,
        isLoading: true,
        reviewCount: 0,
      }));

      addMessage("user", prompt);
      addMessage("status", "Analyzing your game idea...");

      try {
        const result = await callChatApi({ prompt });
        processResponse(result);
        // Refresh sidebar to show the newly created session
        void loadSessionsRef.current();
      } catch (err) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          status: "FAILED",
          error: err instanceof Error ? err.message : "Unknown error",
        }));
        addMessage(
          "system",
          `Error: ${err instanceof Error ? err.message : "Unknown error"}`
        );
      }
    },
    [callChatApi, processResponse, addMessage, stopPolling]
  );

  const answerClarification = useCallback(
    async (answer: string) => {
      if (!state.sessionId) return;

      addMessage("user", answer);
      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        const result = await callChatApi({
          sessionId: state.sessionId,
          message: answer,
        });
        processResponse(result);
      } catch (err) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          status: "FAILED",
          error: err instanceof Error ? err.message : "Unknown error",
        }));
        addMessage(
          "system",
          `Error: ${err instanceof Error ? err.message : "Unknown error"}`
        );
      }
    },
    [state.sessionId, callChatApi, processResponse, addMessage]
  );

  const loadSession = useCallback(
    async (sessionId: string) => {
      stopPolling();
      setState((prev) => ({
        ...prev,
        sessionId,
        status: "INIT",
        messages: [],
        clarification: null,
        plan: null,
        code: null,
        error: null,
        isLoading: true,
        reviewCount: 0,
      }));

      try {
        const res = await fetch(`/api/sessions/${sessionId}`);
        if (!res.ok) throw new Error("Failed to load session");
        const session = await res.json();

        const messages: ChatMessage[] = [];
        messages.push({
          id: generateId(),
          role: "user",
          content: session.prompt,
          timestamp: new Date(session.createdAt),
        });

        if (session.clarification) {
          const clar = session.clarification as ClarificationResponse;
          if (clar.questions?.length) {
            messages.push({
              id: generateId(),
              role: "agent",
              content: "Previous Questions",
              timestamp: new Date(session.createdAt),
              data: clar,
            });
          }
        }

        if (session.plan) {
          const plan = session.plan as PlanResponse;
          messages.push({
            id: generateId(),
            role: "status",
            content: `Plan: "${plan.title}"`,
            timestamp: new Date(session.createdAt),
          });
        }

        let status: SessionStatus = session.status as SessionStatus;
        if (status === "BUILDING") status = "BUILDING";

        if (session.code && session.status === "COMPLETED") {
          messages.push({
            id: generateId(),
            role: "agent",
            content: `Game completed!`,
            timestamp: new Date(session.createdAt),
            data: session.code as BuildResponse,
          });
        }

        setState((prev) => ({
          ...prev,
          sessionId,
          status: status === "INIT" ? "IDLE" : status,
          messages,
          clarification: (session.clarification as ClarificationResponse) || null,
          plan: (session.plan as PlanResponse) || null,
          code: session.status === "COMPLETED" ? (session.code as BuildResponse) : null,
          error: session.error || null,
          isLoading: false,
          reviewCount: session.reviewCount || 0,
        }));

        // If session is in-progress, resume polling
        if (session.status === 'PLANNING') {
          pollNext(sessionId);
        }
        else if (['BUILDING', 'REVIEW', 'REBUILD'].includes(session.status)) {
          addMessage('status', 'Resuming build from where we left off...')
          startStream(sessionId)
        }
      } catch (err) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: err instanceof Error ? err.message : "Unknown error",
        }));
      }
    },
    [stopPolling, pollNext, startStream, addMessage]
  );

  const loadSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/sessions");
      if (!res.ok) return;
      const data = await res.json();
      setState((prev) => ({ ...prev, sessions: data }));
    } catch {
      // silently fail
    }
  }, []);

  // Keep ref current so polling callbacks always call latest loadSessions
  loadSessionsRef.current = loadSessions;

  const resetGame = useCallback(() => {
    stopPolling();
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setState((prev) => ({
      ...prev,
      sessionId: null,
      status: "IDLE",
      messages: [],
      clarification: null,
      plan: null,
      code: null,
      error: null,
      streamingCode: "",
      isLoading: false,
      reviewCount: 0,
    }));
  }, [stopPolling]);

  const retry = useCallback(() => {
    if (!state.sessionId) return;
    
    // Clear any previous error and set to loading
    setState((prev) => ({ ...prev, error: null, isLoading: true }));
    
    if (state.plan) {
      startStream(state.sessionId);
    } else {
      pollNext(state.sessionId);
    }
  }, [state.sessionId, state.plan, startStream, pollNext]);

  return (
    <GameBuilderContext.Provider
      value={{
        ...state,
        startNewGame,
        answerClarification,
        loadSession,
        loadSessions,
        resetGame,
        retry,
      }}
    >
      {children}
    </GameBuilderContext.Provider>
  );
}
