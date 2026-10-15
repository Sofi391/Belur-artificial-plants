BELUR ARTIFICIAL PLANTS - E-COMMERCE APPLICATION

OVERVIEW
--------
A full-stack e-commerce application for selling artificial plants and pots. The app consists of a Django REST Framework backend API and a Next.js frontend UI.

PROJECT STRUCTURE
-----------------
belur_api/          - Django REST Framework backend
  catalog/          - Plant and pot catalog management
  inquiries/        - Customer inquiry handling
  shop/             - Shopping and order management
  config/           - Django project configuration

belur_ui/           - Next.js frontend application
  src/              - React components and pages
  public/           - Static assets


BACKEND FEATURES (belur_api)
----------------------------
- Django 5.2 with Django REST Framework 3.16
- PostgreSQL database
- Catalog Management:
  * PlantType categories (Trees, Palms, Big plants, Table pieces)
  * Plants with type, price, size, stock status
  * Pots with price, size, stock status
  * Image management (up to 3 photos per item)
  * Featured items and publishing workflow
  * Local name support (Amharic)
- API Endpoints:
  * Plant list/detail with filtering (type, price range, stock, featured)
  * Pot list/detail with filtering (price range, stock, featured)
  * Search functionality (name, local_name, description)
  * Ordering options (name, price, created_at)
- Authentication & Permissions:
  * Public read access for catalog
  * Admin interface for content management
- Media Storage:
  * S3-compatible storage support
  * Whitenoise for static files


FRONTEND FEATURES (belur_ui)
---------------------------
- Next.js 16.4 with React 19
- TypeScript for type safety
- TailwindCSS 4 for styling
- Responsive design


TECH STACK
----------
Backend:
  - Django 5.2
  - Django REST Framework 3.16
  - django-filter 25.1
  - django-cors-headers 4.7
  - Pillow 11.2 (image handling)
  - psycopg2-binary 2.9 (PostgreSQL)
  - python-dotenv 1.1

Frontend:
  - Next.js 16.4
  - React 19.3
  - TypeScript 5
  - TailwindCSS 4


SETUP INSTRUCTIONS
-----------------

Backend Setup (belur_api):
1. Create virtual environment:
   python -m venv .venv
   .venv\Scripts\activate  (Windows)

2. Install dependencies:
   cd belur_api
   pip install -r requirements.txt

3. Configure environment:
   Copy .env.example to .env
   Set DATABASE_URL and other environment variables

4. Run migrations:
   python manage.py migrate

5. Create superuser:
   python manage.py createsuperuser

6. Run development server:
   python manage.py runserver


Frontend Setup (belur_ui):
1. Install dependencies:
   cd belur_ui
   npm install

2. Configure environment:
   Set API_URL in .env.local

3. Run development server:
   npm run dev

4. Build for production:
   npm run build
   npm start


CURRENCY
--------
All prices are in Ethiopian Birr (ETB).


DEPLOYMENT
----------
Backend: Deploy Django app to a platform supporting Python/PostgreSQL
Frontend: Deploy Next.js app to Vercel or similar platform
Media: Configure S3-compatible storage for image uploads


LICENSE
-------
Proprietary - Belur Artificial Plants
