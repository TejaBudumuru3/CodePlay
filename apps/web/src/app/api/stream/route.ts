import { NextRequest } from "next/server";
import { prisma } from "@packages/model/db/client";
import { LLM } from "@packages/model/llm";
import { CoderAgent } from "@packages/agents/coder";
import { ReviewerAgent } from "@packages/agents/reviewer";
import { BuildResponse, ClarificationResponse, PlanResponse, ReviewerResponse } from "@packages/model/types";
import { auth } from "@/auth";

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // Allow long-running operations
export async function GET(req: NextRequest) {
    const session = await auth();

    if (!session?.user?.id) {
        return new Response("Unauthorized Access", { status: 401 });
    }
    const sessionId = req.nextUrl.searchParams.get("sessionId");

    if (!sessionId) {
        return new Response("Session Id is not avaliable", { status: 400 })
    }

    const gameSession = await prisma.session.findUnique({
        where: {
            id: sessionId,
            userId: session.user.id
        }
    })

    if (!gameSession) {
        return new Response("Session not found", { status: 404 })
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            const send = (event: string, data: any) => {
                controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
            };

            try {
                const llm = new LLM();
                const plan = gameSession.plan as unknown as PlanResponse;
                const coder = new CoderAgent(llm, sessionId);
                const reviewer = new ReviewerAgent(sessionId, llm);
                const MAX_REVIEWS = 3;

                let code = (gameSession.code as unknown as BuildResponse)?.code || '';
                let reviewCount = gameSession.reviewCount || 0;
                let currentStatus = gameSession.status;

                // Handle Retry when FAILED but code generation is requested
                if (currentStatus === 'FAILED') {
                    currentStatus = code ? 'REBUILD' : 'BUILDING';
                    await prisma.session.update({
                        where: { id: sessionId },
                        data: { status: currentStatus, error: null }
                    });
                    gameSession.status = currentStatus;
                }

                if (currentStatus === "BUILDING" && !code) {
                    send("status", { status: "BUILDING" });

                    const generator = coder.build(plan);

                    let fullCode = '';
                    for await (const chunk of generator) {
                        if (!chunk) continue;
                        fullCode += chunk;
                        send("code_chunk", { chunk })
                    }
                    code = fullCode;

                    await prisma.session.update({
                        where: { id: sessionId },
                        data: {
                            code: {
                                code: fullCode
                            },
                            status: "REVIEW"
                        }
                    })

                    currentStatus = 'REVIEW'
                }

                if (currentStatus === 'BUILDING' && code) {
                    send("code_chunk", { chunk: code });

                    await prisma.session.update({
                        where: {
                            id: sessionId
                        },
                        data: {
                            status: 'REVIEW'
                        }
                    })
                    currentStatus = 'REVIEW'
                }

                while (currentStatus === 'REBUILD' || currentStatus === 'REVIEW') {
                    if (currentStatus === 'REBUILD') {
                        send("status", { status: "REBUILD", attempt: reviewCount + 1, max: MAX_REVIEWS });

                        const lastReview = gameSession.review as unknown as ReviewerResponse;
                        const remarks = lastReview.remarks || "Fix all issues";
                        const generator = coder.build(plan, code, remarks);

                        let fullCode = '';
                        for await (const chunk of generator) {
                            if (!chunk) continue;
                            fullCode += chunk;
                            send("code_chunk", { chunk });
                        }

                        code = fullCode;

                        await prisma.session.update({
                            where: { id: sessionId },
                            data: {
                                code: { code: fullCode },
                                status: 'REVIEW'
                            }
                        })
                        currentStatus = "REVIEW"
                    }

                    send("status", { status: "REVIEW", attempt: reviewCount, max: MAX_REVIEWS });

                    const summary = (gameSession.clarification as unknown as ClarificationResponse)?.summary || gameSession.prompt;

                    const review = await reviewer.review(plan, code, summary);

                    send("review_result", { passed: review.passed, issues: review.issues });

                    if (review.passed) {
                        await prisma.session.update({
                            where: { id: sessionId },
                            data: {
                                status: 'COMPLETED',
                                review: review as any,
                                reviewCount: reviewCount
                            }
                        });

                        send("complete", { code })
                        currentStatus = 'COMPLETED';
                    }
                    else {
                        reviewCount++;
                        if (reviewCount >= MAX_REVIEWS) {
                            await prisma.session.update({
                                where: { id: sessionId },
                                data: {
                                    status: "FAILED",
                                    review: review as any,
                                    reviewCount,
                                    error: `Code failed due to MAX reviews(${MAX_REVIEWS}) failed`
                                }
                            })
                            send("status", { status: "FAILED", attempt: reviewCount, max: MAX_REVIEWS });
                            send("error", { message: `Code failed due to MAX reviews(${MAX_REVIEWS}) failed`, issues: review.issues })
                            currentStatus = 'FAILED'
                        }
                        else {
                            await prisma.session.update({
                                where: { id: sessionId },
                                data: {
                                    status: 'REBUILD',
                                    reviewCount,
                                    review: review as any
                                }
                            })

                            gameSession.review = review as any;
                            gameSession.reviewCount = reviewCount;
                            currentStatus = 'REBUILD';
                        }
                    }
                }
            }
            catch (err) {
                send("error", { message: err instanceof Error ? err.message : "Unknown error" })
                await prisma.session.update({
                    where: { id: sessionId },
                    data: {
                        status: 'FAILED',
                        error: err instanceof Error ? err.message : "Stream route error"
                    }
                })
            }
            finally {
                controller.close();
            }
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': "text/event-stream",
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no'
        }
    });


}