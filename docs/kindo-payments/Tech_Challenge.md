# 🎓 Kindo School Payments Challenge: Candidate Brief

## Introduction

The challenge focuses on building a simple school payment feature that interfaces with a legacy payment API. You'll create both a frontend interface and backend services to support payment collection for a school activity.

We expect the time investment on this challenge to be around 2-4 hours.

Let us know when you’ve completed the challenge so we can have time to assess it and then be prepared with a laptop to bring to the demo to us so you can run the application and dive into the code if needed.

## Problem Statement

A school needs to collect payments for an upcoming field trip. Parents need to be able to:

- View trip details (date, cost, location)
- Register their child for the trip
- Make a payment through an online form
- Receive confirmation of payment

You'll need to build a small full-stack application that handles this flow while integrating with our legacy payment processing API.

## Technical Requirements

### Backend (Python/FastAPI)

- Create a FastAPI service that:
  - Provides endpoints to fetch trip details
  - Accepts and validates payment submissions
  - Interfaces with the legacy payment API
  - Stores transaction records
  - Returns appropriate responses to the frontend
- Legacy API Integration:
  - You must integrate with our legacy payment processing API (details below)
  - The API expects a specific format and returns success/failure responses that you'll need to handle

### Frontend (React)

- Create a small React application that:
  - Displays the field trip details
  - Includes a registration form for child's information
  - Provides a payment form with validation
  - Shows appropriate success/error messages
  - Has a clean, responsive design (Tailwind CSS encouraged but not required)

### Legacy Payment API Interface

See [`legacy_payment.py`](legacy_payment.py).

## Constraints/Requirements

- **Tech Stack**:
  - Backend: Python with FastAPI
  - Frontend: React
  - Relational Database: Whatever free relational db you prefer, e.g. SQLite is fine for this challenge
- **Must-Have Features**:
  - Functional payment flow from frontend to backend
  - Integration with the legacy payment API
  - Form validation on both frontend and backend
  - Error handling and user feedback
  - At least basic styling for a good user experience
  - Documented AI workings (see **AI Workings** below)
- **Nice-to-Have Features**:
  - Responsive design with Tailwind CSS
  - Unit tests for critical components
  - Error logging
  - Loading states during payment processing
  - Receipt generation
- **Evaluation Criteria**:
  - Code quality and organization (including regular commits)
  - Problem-solving approach
  - Error handling
  - User experience considerations
  - Documentation
  - How you use AI tools, and how you check and take ownership of their output

## AI Workings (Required)

We are an AI-forward team and expect you to use AI coding agents and assistants (e.g. Claude Code, Cursor, GitHub Copilot, ChatGPT) for this challenge. We are interested in how you use them, not just what they produce. Include an `AI_WORKINGS.md` file in your repository covering:

- Which tools you used, and what for
- Your key prompts or instructions, plus any agent config files (e.g. `CLAUDE.md`, `AGENTS.md`, Cursor rules) committed to the repo
- At least one time the AI got something wrong or went off track, how you noticed, and what you did about it
- Anything you chose to write, rewrite or reject yourself, and why

Rough notes are fine. We value honesty over polish. Be ready to talk us through this at the demo.

## Bonus Points

- **Deployment**: Deploy your solution to a free hosting service (Vercel, Netlify, Heroku, AWS Free Tier, etc.)
- **React** : Include a simple responsive web view to support mobile devices.

## Submission Guidelines

- Create a GitHub/BitBucket repository for your solution
- Include a README with:
  - Setup instructions
  - Overview of your solution
  - Any assumptions or design decisions
  - A link to your `AI_WORKINGS.md`
- Be prepared to walk through your code and explain your decisions during the interview
