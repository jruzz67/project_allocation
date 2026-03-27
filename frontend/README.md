# 🚀 TeamForge — AI-Powered Intelligent Team Allocation System

> Intelligent workforce allocation using AI, semantic matching, optimization, and human-in-the-loop decision making.

---

## 📌 Overview

**TeamForge** is a full-stack AI-driven SaaS platform that automates the complex process of assigning the right employees to the right projects.

It intelligently combines:
- **Resume analysis & skill extraction**
- **AI-generated project tasks**
- **Hybrid semantic + skill-based scoring**
- **Mathematical optimization (ILP)**
- **Human approval workflow**

to deliver **balanced, high-performing teams** while respecting workload constraints.

---

## 🎯 Problem Statement

Manual team allocation is:
- ❌ Time-consuming and error-prone
- ❌ Inefficient resource utilization
- ❌ Ignores real skill alignment
- ❌ Leads to employee overload
- ❌ Prone to human bias

---

## 💡 Solution

TeamForge provides an **end-to-end intelligent allocation engine**:
- Upload project PDF → AI generates tasks & required skills
- Employees upload resumes → AI extracts skills & embeddings
- System runs hybrid scoring + optimization
- Organization reviews AI-generated draft → **Approve or Re-allocate**
- Final allocation with workload balancing and automated notifications

---

## 🧠 Key Features

### 🔐 Secure Multi-Role Authentication
- JWT-based authentication with role separation
- bcrypt password hashing
- Organization vs Employee access control

### 📄 Resume Intelligence
- PDF resume upload & text extraction
- AI-powered skill extraction
- Semantic embeddings for matching

### 🤖 AI Task Generation
- Project description → AI generates roles, detailed tasks, and required skills

### ⚙️ Smart Team Allocation
- Hybrid scoring (Skill match + Semantic similarity)
- Integer Linear Programming (PuLP) with constraints (workload, capacity, one-task-per-employee)
- Draft allocation with explainability (matched & missing skills)

### 👨‍💼 Human-in-the-Loop Approval
- Organization reviews AI suggestion
- Approve → Final allocation + email notifications
- Reject → Re-run allocation

### ☁️ Secure Cloud Storage
- AWS S3 private bucket
- Pre-signed URLs for controlled access

### 📧 Automated Communication
- Employee invitation emails
- Task assignment notifications
- Background processing

### 📊 Scalable API Design
- Pagination support
- Clean REST APIs

---

---

## 🔄 Complete Workflow

1. Organization signs up / logs in
2. Organization creates employee accounts (placeholder)
3. Employees complete setup (upload resume → skills extracted)
4. Organization uploads project description (PDF)
5. AI generates tasks + required skills
6. System runs optimization → produces **draft team**
7. Organization reviews & approves / rejects
8. Approved allocation triggers emails & final assignment
9. Employees view their assigned tasks

---

## ⚙️ Tech Stack

### Backend
- FastAPI
- SQLModel + PostgreSQL + pgvector
- JWT Authentication + bcrypt
- PuLP (Optimization)

### AI & ML
- Gemini 2.5 Flash (LLM)
- SentenceTransformers (all-MiniLM-L6-v2 embeddings)

### Cloud
- AWS S3 (secure file storage)

### Frontend
- React 19 + Vite + TypeScript
- Tailwind CSS + Framer Motion

---

## 🔐 Security Highlights
- Passwords stored with bcrypt hashing
- Private S3 bucket (no public URLs)
- Pre-signed URLs for controlled access
- Role-based authorization
- Organization-scoped data access

---

## 🚀 Innovation & Novelty
- Hybrid AI + Mathematical Optimization approach
- Human-in-the-loop decision system
- Semantic skill matching using embeddings
- End-to-end real-world workflow (resume → project → allocation → approval)

---

## ⚠️ Current Limitations
- Dependent on quality of resume and project description
- LLM responses may occasionally need human review
- Free-tier Gemini quota limits (multiple API keys used)

---

## 🔮 Future Enhancements
- Real-time feedback learning from approvals/rejections
- Partial re-allocation (manual adjustment)
- Microservices architecture
- Advanced skill ontology & taxonomy
- Dashboard analytics & reporting

---

## 🧠 Key Philosophy

> **TeamForge is not just automation — it is an AI-assisted decision support system** that augments human judgment with intelligence and optimization.

---

## 🏁 Conclusion

TeamForge demonstrates how AI, optimization, and system design can be combined to solve real-world workforce allocation challenges efficiently and intelligently.

It showcases strong skills in:
- Full-stack development
- AI/ML integration
- System design & optimization
- Cloud & security practices

---

## 👨‍💻 Author

**Jairus**  
Full-Stack Developer & AI Systems Engineer  
Built as a comprehensive AI-powered team allocation platform.

---

**Made with ❤️ using FastAPI, Gemini, PuLP, and React**