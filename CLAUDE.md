# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
npm run dev        # Start Vite development server (port 5173)
npm run build      # Build for production using Vite
npm run preview    # Preview production build locally
npm run lint       # Run ESLint on all TypeScript/React files
```

## Architecture Overview

### Application Structure
This is a **Fiscal Pro SaaS** React application built with Vite, TypeScript, and Tailwind CSS. The application is a CRM-like system for managing tax and accounting clients with forms and financial documents.

### Core Technologies
- **React 18.2** with TypeScript for UI components
- **Vite** as the build tool and development server
- **Tailwind CSS** for styling with PostCSS
- **Lucide React** for icons
- **@dnd-kit** for drag-and-drop functionality in Kanban views
- **Radix UI** components for accessible UI primitives
- **styled-jsx** for component-specific styles

### Key Architectural Patterns

#### Component Organization
The application follows a feature-based component structure:
- **Main Layout**: Fixed viewport height with header (80px) and scrollable content area
- **View Modes**: Dual-view system supporting both List and Kanban views for client management
- **Modal System**: Extensive use of modals for CRUD operations and data visualization
- **Context-based State**: Uses React Context for shared state (e.g., EstadosICMSContext, ImpostoRendaContext)

#### Data Management
- **Local Storage Persistence**: Client/lead data persisted in browser localStorage under key `fiscalpro_leads`
- **Mock Data Integration**: Combines mock client data with user-created leads
- **ID Generation**: Uses timestamp-based IDs for new records

#### Component Communication
- **Callback Props**: Parent-child communication through onClose, onSave, onLeadSaved patterns
- **State Lifting**: Shared state managed at container level (ClientsContainer)
- **Event Handlers**: Consistent naming pattern (handle[Action] for handlers)

### Critical Components

#### ClientsContainer (`src/components/ClientsContainer.tsx`)
Central hub managing:
- Client list/kanban view switching
- Filtering and pagination logic
- Modal orchestration for all CRUD operations
- Integration with localStorage for data persistence

#### Kanban System (`src/components/Kanban/`)
Complex drag-and-drop board with:
- Column management and dynamic creation
- Card movement between columns
- Time tracking per column
- Advanced filtering capabilities

#### Database Components (`src/components/BD-*.tsx`)
Series of database configuration components for:
- Tax tables (ICMS, IR, Funrural)
- Business segments
- Different taxation regimes

### Styling Conventions
- **Tailwind Classes**: Primary styling method with precise pixel values
- **Color Palette**: 
  - Primary: `#1777CF` (blue)
  - Background: `#F8FAFC` (light gray)
  - White containers with `#E5E7EB` borders
- **Border Radius**: Consistent use of rounded corners (8px, 12px, 20px)
- **Font**: Inter font family throughout
- **Spacing**: 10-15px margins between major sections

### Important Notes
- **No Test Framework**: Project has no test files or testing setup configured
- **Custom Scrollbars**: Uses custom CSS for slim, modern scrollbars
- **Z-Index Management**: Modals use high z-index values (50, 1000) for proper layering
- **React Strict Mode**: Not enabled in the application