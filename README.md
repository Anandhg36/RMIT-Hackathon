PART A: Project Responses
Team Name / Members

Team Name: 4Not4 Found
Members:

Manasvinii Sundararajan

Anandh Gowri Shankar

Karthic Raj

Aparajitha Pattabhiraman

Project Scope (A1, A2, A3)

RMIT 1NE is a centralized, AI-powered student platform designed to streamline access to academic data.
It integrates live information from RMIT Canvas — allowing students to check grades, timetables, assignments, and forecasts instantly, all through a conversational chatbot.

Core Capabilities

AI Chatbot – Instantly access course details, grades, timetables, and forecasts.

Grade Forecasting – Predict the scores needed to pass or reach target grades.

Dynamic Timetables – Real-time updates synced from Canvas.

Assignment and Progress Analytics – Personalized insights on performance trends.

Classmate Finder – Smart recommendations to connect with peers in shared courses.

Design Intentions (C1, C2)

Our goal was to create an intuitive, intelligent, and automated platform that centralizes the student experience.

C1 – Intent

Minimize manual navigation through multiple portals.

Deliver relevant academic insights in a single, AI-driven interface.

Build the foundation for a collaborative academic network among students.

C2 – Implementation

Designed a clean, minimal, and responsive Angular UI.

Integrated Supabase for secure data handling and persistence.

Created an automation bridge using n8n to link OpenAI, Supabase, and Canvas APIs.

Ensured modular and extensible design for future enhancements like grade prediction accuracy
and social connection features.

Development Solutions (D2)
High-Level System Workflow

Frontend (Angular)
→ Handles chatbot UI and data visualization for courses, grades, and timetables.

Backend (FastAPI + Supabase)
→ Manages authentication, data persistence, and secure API interactions.

n8n Workflows
→ Automates data retrieval, transformation, and AI processing.
→ Example pipeline:
Local Trigger → n8n → Supabase Query → OpenAI → Supabase Update → Return Response

OpenAI / LLaMA Models
→ Process natural language queries and generate intelligent responses.

Canvas API
→ Provides live academic data for enrolled students.

Accomplishments

Fully functional AI chatbot capable of course, grade, and timetable retrieval.

Implemented automated end-to-end workflow from local trigger to AI response.

Developed a custom model for context-aware replies.

Created a responsive UI integrating real-time Canvas and Supabase data.

Implemented classmate-matching logic based on shared course schedules.


Technologies Used (D3)
Category	Tools / Technologies
Frontend	Angular, HTML, CSS
Backend	FastAPI, Python 3.11
Database	Supabase (PostgreSQL)
AI & Automation	OpenAI GPT models, LLaMA, n8n
Data Source	RMIT Canvas API
Version Control	GitHub
Hosting	Local VM / Docker (FastAPI + n8n)

