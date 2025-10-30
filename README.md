 Event Management Monolith App
A full-stack collaborative event management system built as a monolith architecture using Elysia.js, Prisma, Neon, and WebSockets. This app supports authentication, role-based access control, realtime updates, and API documentation—all in a clean, scalable structure.
 Project Overview
This project is the implementation phase of our previous event app design assignment. It transforms conceptual designs into a working monolith application that demonstrates:
• 	Authentication and user roles (Admin, Organizer, Attendee)
• 	Realtime updates via WebSockets
• 	Event creation, approval, RSVP functionality
• 	Clean architecture with SOLID principles
• 	Integration with modern tools (Elysia.js, Prisma, Neon, Ethereal, Render)
 Tech Stack

 Folder Structure

 Design Principles Applied
• 	Single Responsibility: Controllers, middleware, and services are modular.
• 	Open/Closed Principle: Easily extendable via new routes or roles.
• 	DRY & Separation of Concerns: Clear boundaries between logic, routing, and data.
• 	Type Safety: Enums and Prisma models enforce valid states.
• 	Realtime Architecture: WebSocket broadcasts ensure live sync across clients.
 Authentication & Roles
• 	Signup: Creates user with hashed password and default role .
• 	Login: Returns JWT token for protected routes.
• 	Role-based access:
• 	: Create/manage events
• 	: Approve/delete events
• 	: RSVP to events
 Realtime Features
• 	WebSocket endpoint  broadcasts:
• 	Event creation/update/deletion
• 	RSVP changes
• 	Event approval
• 	Clients receive updates live without refreshing.
 API Endpoints

 Swagger Documentation
• 	Available at  (auto-generated via )
• 	Import Swagger JSON into Insomnia for easy testing
 Testing Instructions
Use Insomnia to test:
• 	Auth: Signup/login with JWT
• 	Events: CRUD operations with role checks
• 	RSVP: Submit and update status
• 	WebSocket: Connect to  and observe live updates
 Deployment
• 	Hosted on Render
• 	Environment variables:
• 	 (Neon)
• 	
• 	,  (for mock email)
• 	Live app URL: [Insert your Render URL here]
 Bonus Frontend (Optional)
• 	Simple HTML/JS frontend with login, event list, RSVP buttons
• 	WebSocket client for realtime updates
• 	Hosted on Render (static site or integrated)
 Demo Video
• 	Covers:
• 	Signup/login with mock email
• 	Event creation/approval/deletion
• 	RSVP flow
• 	Realtime sync across tabs
• 	Swagger and Insomnia testing
• 	Live deployment
• 	Watch here: [Insert video link here]
AI-Assisted Development
This project leveraged AI tools (Copilot, ChatGPT) for:
• 	Generating boilerplate code (routes, controllers, WebSocket handlers)
• 	Debugging JWT and Prisma integration
• 	Summarizing documentation (Elysia, Prisma, Ethereal)
• 	Structuring folder layout and applying design principles
Submission
Submit via Google Form with:
• 	GitHub repo URL
• 	Render deployment URL
• 	Demo video link
