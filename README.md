# CARRIPREFA GMAO System 🏗️

A comprehensive Maintenance Management System (GMAO) for CARRIPREFA - Société d'Exploitation de Carrières et Préfabriqués.

##  Features

- **Multi-Interface System**: Separate interfaces for operators, maintenance teams, and administrators
- **Equipment Management**: Real-time monitoring of equipment status and locations
- **Intervention Tracking**: Complete workflow from request to resolution
- **Treatment Management**: Detailed maintenance records with parts tracking
- **Analytics Dashboard**: Performance metrics and reporting
- **Notification System**: Real-time alerts and status updates

## 🛠 Tech Stack

**Frontend:**
- React 18 with Hooks
- TanStack Query for data management
- CSS3 with responsive design
- Real-time status updates

**Backend:**
- FastAPI (Python)
- SQLAlchemy ORM
- PostgreSQL database
- JWT authentication
- RESTful API architecture

##  Installation

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

##  Interfaces

### 👤 Operator Interface (Demandeur)
- Submit maintenance requests
- Track intervention status
- View equipment information
- Receive notifications

### 🔧 Maintenance Interface
- View and manage intervention requests
- Create detailed treatment reports
- Update intervention status
- Track repair times and parts used

### 📊 Admin Interface
- Complete system overview
- Analytics and reporting
- User management
- System configuration

## 🔐 Authentication

Secure JWT-based authentication system with role-based access control:
- **Operators**: Submit requests and view their interventions
- **Technicians**: Manage maintenance workflows
- **Administrators**: Full system access and analytics

## 📱 Responsive Design

Fully responsive interface that works on:
- Desktop computers
- Tablets
- Mobile devices
- Touch-friendly interactions

## 🔄 Real-time Updates

- Live equipment status monitoring
- Automatic data refresh
- Real-time notifications
- Status synchronization across all interfaces

## 🏗️ Built for CARRIPREFA

Specifically designed for the quarry and precast concrete industry with:
- Equipment-specific workflows
- Industrial environment considerations
- Multi-location support
- Specialized maintenance tracking

---

**CARRIPREFA** - *Société d'Exploitation de Carrières et Préfabriqués*
