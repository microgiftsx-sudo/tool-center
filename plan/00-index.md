# 📋 Application Development Rules & Guidelines

## 📖 Overview

This document serves as the central index for all development rules and guidelines. The comprehensive rules have been organized into specialized documents for better maintainability and clarity.

---


## read this files  
- @plan\01-architecture.md
- @plan\02-development-guidelines.md
- @plan\03-context-management.md
- @plan\04-auth.md
- @plan\05-data-API.md
- @plan\06-UI-UX.md
- @plan\07-features-systems.md

## 📁 Rule Categories (Sequential Reading Order)

> **📖 For AI Systems:** Read files in this exact order for comprehensive understanding

### 1️⃣ Architecture Guidelines
**File:** `@plan/01-architecture.md` (Must read this file)
- **Foundation:** Project structure patterns and three-layer architecture
- **Core Concepts:** Entity-based organization and directory conventions
- **Why First:** Establishes the structural foundation for everything else

### 2️⃣ Development Guidelines  
**File:** `@plan/02-development-guidelines.md`(Must read this file)
- **Implementation:** Code organization principles and component patterns
- **Standards:** State management with Zustand, styling rules, error handling
- **Why Second:** Provides coding standards that apply to all subsequent patterns

### 3️⃣ Context Management
**File:** `@plan/03-context-management.md`(Must read this file)
- **State Patterns:** React Context organization and implementation
- **Provider Composition:** How to structure and combine contexts
- **Why Third:** Context patterns are needed before auth and UI systems

### 4️⃣ Authentication Rules
**File:** `@plan/04-auth.md`(Must read this file)
- **Security:** Authentication patterns and token management
- **Access Control:** Route protection and user session handling
- **Why Fourth:** Auth is fundamental before API and UI interactions

### 5️⃣ Data & API Patterns
**File:** `@plan/05-data-API.md`(Must read this file)
- **Communication:** API integration patterns and data flow
- **Validation:** Server communication and error handling
- **Why Fifth:** Data patterns build on auth and enable UI features

### 6️⃣ UI/UX Guidelines
**File:** `@plan/06-UI-UX.md`(Must read this file)
- **Interface:** User experience patterns and component design
- **Interaction:** Responsive design and accessibility rules
- **Why Sixth:** UI implementation requires all previous foundations

### 7️⃣ Feature Systems
**File:** `@plan/07-features-systems.md`(Must read this file)
- **Advanced Features:** Reports, file uploads, theme management
- **Ready-to-Use:** Complete systems that can be copied to any project
- **Why Last:** Advanced features that combine all previous concepts

---

## 🚀 Quick Reference

### Adding New Entity (Fast Track)
1. Duplicate existing `store/{entity}` and `components/features/{entity}` folders
2. Update types, validation, and API routes
3. Everything else works automatically (filtering, modals, CRUD, auth)

### Core Architecture Layers
1. **Data Layer:** `hooks/useApi/` - API communication
2. **State Layer:** `store/{entity}/` - Zustand + Zod validation  
3. **Presentation Layer:** `components/{entity}/` - UI components

### File Organization Pattern
```
src/
├── app/                    # Next.js routing
├── context/                # React Context providers
├── hooks/                  # Custom hooks
├── store/{entity}/         # State management per entity
├── components/{entity}/    # UI components per entity  
├── lib/                    # Utilities and configurations
└── types/                  # TypeScript definitions
```

---

## 📚 How to Use This System

### For AI Systems & Comprehensive Learning:
1. **Start Here:** Read this index (`00-index.md`)
2. **Follow Sequence:** Read files `01` through `07` in exact order
3. **Build Understanding:** Each file builds on previous concepts
4. **Reference Back:** Use this index to navigate between concepts

### For Developers & Quick Tasks:
1. **Quick Reference:** Use the summary above for common patterns
2. **Targeted Reading:** Jump to specific files based on current task
3. **Cross-Reference:** Files reference each other when concepts overlap

### For Project Setup:
```
Main Entry Point: @plan/00-index.md

Sequential Reading Order:
├── 01-architecture.md       (Foundation & Structure)
├── 02-development-guidelines.md (Coding Standards)  
├── 03-context-management.md (State Patterns)
├── 04-auth.md              (Security & Access)
├── 05-data-API.md          (Communication Layer)
├── 06-UI-UX.md             (Interface Design)
└── 07-features-systems.md  (Advanced Features)
```

The goal is to provide a **scalable**, **maintainable**, and **consistent** foundation for building any type of application. Each file builds upon the previous, creating a comprehensive development framework.