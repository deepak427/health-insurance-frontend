# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Individual insurance policyholders looking for policy Q&A, PDF analysis, and automated guides (health, life, auto, home, travel).

## Product Purpose
Provide a rich, consumer-grade messaging interface ("Dolphin Buddy") for insurance policy support, allowing users to chat naturally with an AI agent, upload policy documents for analysis, and receive downloadable PDF guides.

## Positioning
Not just a generic chatbot — a premium, full-featured modern chat application built specifically for conversing with an AI insurance agent.

## Operating Context
Desktop and mobile browser environment. Single-page chat interface with persistent session history, real-time response streaming, and document file attachments.

## Capabilities and Constraints
- Real-time conversational AI support streamed via Server-Sent Events (SSE).
- Policy PDF and image upload for inline AI document analysis.
- Instant download of generated PDF policy guides (health, life, auto, home, travel).
- Quick action prompt chips for high-frequency insurance queries.
- Next.js rewrite proxy routing to backend service (`/api/backend` -> `http://43.204.143.233:8000`).
- Persistent local session storage (`userId` & `sessionId`).

## Brand Commitments
- Name: Dolphin Buddy
- Dark aesthetic (`#0f1117` base, `#6366f1` indigo accent) with modern typography and clear status indicators.

## Evidence on Hand
- Codebase in `d:/dipu/Hackthons/Rapid run Hackthon/hip-frontend`.
- Documentation: [FRONTEND_REFERENCE.md](file:///d:/dipu/Hackthons/Rapid%20run%20Hackthon/hip-frontend/FRONTEND_REFERENCE.md).

## Product Principles
1. Clarity & Trust: Complex policy details presented in clean, readable typography.
2. Real-Time Responsiveness: Immediate feedback via streaming text and status indicators.
3. Direct Utility: Seamless policy file upload and instant artifact downloads.
4. Session Continuity: Conversations persist safely across browser reloads.

## Accessibility & Inclusion
Standard web accessibility with proper contrast ratios, keyboard navigability, and clear focus states.
