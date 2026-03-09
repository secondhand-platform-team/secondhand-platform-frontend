# 🚀 Quick Start Guide

## Project Created Successfully! ✅

A production-ready React project with TypeScript, Vite, Redux Toolkit, Axios, and React Router is now ready to use.

## 📂 Complete Folder Structure

```
secondhand-client/
├── src/
│   ├── api/
│   │   └── axiosClient.ts              ⭐ Axios with interceptors
│   ├── app/
│   │   ├── store.ts                    ⭐ Redux store config
│   │   └── rootReducer.ts              ⭐ Combined reducers
│   ├── assets/
│   │   ├── images/
│   │   └── icons/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button/
│   │   │   │   ├── Button.tsx
│   │   │   │   └── Button.css
│   │   │   ├── Input/
│   │   │   │   ├── Input.tsx
│   │   │   │   └── Input.css
│   │   │   └── Modal/
│   │   │       ├── Modal.tsx
│   │   │       └── Modal.css
│   │   └── layout/
│   │       ├── Navbar/
│   │       │   ├── Navbar.tsx
│   │       │   └── Navbar.css
│   │       ├── Sidebar/
│   │       │   ├── Sidebar.tsx
│   │       │   └── Sidebar.css
│   │       └── Footer/
│   │           ├── Footer.tsx
│   │           └── Footer.css
│   ├── config/
│   │   ├── env.ts                      ⭐ Environment config
│   │   └── routes.ts                   ⭐ Route definitions
│   ├── features/
│   │   ├── auth/
│   │   │   ├── api/
│   │   │   │   └── authApi.ts          ⭐ Auth endpoints
│   │   │   ├── components/
│   │   │   │   └── LoginForm.tsx
│   │   │   ├── pages/
│   │   │   │   └── LoginPage.tsx
│   │   │   ├── authSlice.ts            ⭐ Auth Redux logic
│   │   │   └── authTypes.ts            ⭐ Auth types
│   │   └── user/
│   │       ├── api/
│   │       │   └── userApi.ts
│   │       ├── userSlice.ts            ⭐ User Redux logic
│   │       └── userTypes.ts            ⭐ User types
│   ├── hooks/
│   │   ├── reduxHooks.ts               ⭐ Typed Redux hooks
│   │   └── useAuth.ts                  ⭐ Auth custom hook
│   ├── layouts/
│   │   ├── MainLayout.tsx              ⭐ Default layout
│   │   ├── MainLayout.css
│   │   ├── AuthLayout.tsx              ⭐ Auth layout
│   │   └── AuthLayout.css
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   └── NotFoundPage.tsx
│   ├── router/
│   │   ├── AppRouter.tsx               ⭐ Route config
│   │   └── ProtectedRoute.tsx          ⭐ Auth protection
│   ├── services/
│   │   └── storageService.ts           ⭐ Local storage utils
│   ├── styles/
│   │   └── global.css                  ⭐ Global styles
│   ├── types/
│   │   ├── apiResponse.ts              ⭐ API response types
│   │   └── user.ts                     ⭐ User types
│   ├── utils/
│   │   ├── constants.ts                ⭐ Constants
│   │   └── helpers.ts                  ⭐ Utility functions
│   ├── App.tsx                         ⭐ Main app component
│   └── main.tsx                        ⭐ Entry point
├── .env                                ⭐ Environment variables
├── .env.example                        ⭐ Example env file
├── .gitignore
├── eslint.config.js                    ⚙️ ESLint config
├── index.html
├── package.json
├── README.md
├── tsconfig.json
├── tsconfig.app.json                   ⭐ TypeScript config
├── tsconfig.node.json
├── vite.config.ts                      ⭐ Vite config
├── ARCHITECTURE.md                     📖 Architecture guide
└── QUICK_START.md                      📖 This file
```

⭐ = Key production files
⚙️ = Configuration files
📖 = Documentation

---

## 🚀 Running the Project

### Step 1: Navigate to Project Directory

```bash
cd d:\Me\Study\HK2_Nam4\Kien truc phan mem\baitaplon\secondhand-client
```

### Step 2: Start Development Server

```bash
npm run dev
```

**Output:**

```
  Local:        http://localhost:5173/
  press h + enter to show help
```

### Step 3: Open in Browser

```
http://localhost:5173
```

---

## 📋 All Available Commands

```bash
# Development
npm run dev          # Start dev server with HMR

# Production
npm run build        # Build for production (creates dist/)
npm run preview      # Preview production build locally

# Code Quality
npm run lint         # Run ESLint
```

---

## 🔐 Authentication Setup

### Login Flow

1. Navigate to `/login`
2. Enter credentials
3. Form submits to `/api/auth/login`
4. Token is stored in localStorage
5. Redirects to home page
6. Protected routes are now accessible

### Create Login Endpoint

Your backend should provide:

```
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "data": {
    "user": {
      "id": "1",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Configure API Base URL

Update `.env`:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

---

## 📚 Core Features

### 1️⃣ Redux State Management

```tsx
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";

// In component
const dispatch = useAppDispatch();
const { user, token, isAuthenticated } = useAppSelector((state) => state.auth);
```

### 2️⃣ Protected Routes

```tsx
<ProtectedRoute>
  <MainLayout>
    <ProtectedPage />
  </MainLayout>
</ProtectedRoute>
```

### 3️⃣ API Calls with Axios

```tsx
import axiosClient from "@/api/axiosClient";

const response = await axiosClient.get("/products");
// Token automatically added to request!
```

### 4️⃣ Reusable Components

```tsx
<Button variant="primary" size="large">Submit</Button>
<Input label="Email" type="email" placeholder="Enter email" />
<Modal isOpen={true} onClose={() => {}} title="Example">Content</Modal>
```

### 5️⃣ Custom Auth Hook

```tsx
import { useAuth } from "@/hooks/useAuth";

const { user, isAuthenticated, logout } = useAuth();
```

---

## 🎯 Development Workflow

### Adding a New Page

1. Create page component in `src/pages/`
2. Add route in `src/router/AppRouter.tsx`
3. Optionally wrap with `<ProtectedRoute>` if authenticated-only

Example:

```tsx
// src/pages/ProductsPage.tsx
export default function ProductsPage() {
  return <div>Products List</div>;
}

// Add to AppRouter.tsx routes
<Route path="/products" element={<ProductsPage />} />;
```

### Adding a New Feature

1. Create feature folder: `src/features/myFeature/`
2. Create types: `myFeatureTypes.ts`
3. Create API: `api/myFeatureApi.ts`
4. Create reducer: `myFeatureSlice.ts`
5. Add to rootReducer: `src/app/rootReducer.ts`

### Creating API Integration

```tsx
// 1. Define types
interface Product {
  id: string;
  name: string;
  price: number;
}

// 2. Create API folder and file
// src/features/products/api/productsApi.ts
export const productsApi = {
  getAll: async () => {
    const response = await axiosClient.get("/products");
    return response.data;
  },
};

// 3. Create Redux slice with async thunk
// src/features/products/productsSlice.ts
export const getProducts = createAsyncThunk(
  "products/getAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await productsApi.getAll();
      return res.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message);
    }
  },
);

// 4. Use in component
const products = useAppSelector((state) => state.products.items);
const dispatch = useAppDispatch();

useEffect(() => {
  dispatch(getProducts());
}, []);
```

---

## 🌐 Environment Variables

### Development (.env)

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_ENV=development
```

### Production (.env.production)

```env
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_APP_ENV=production
```

---

## 🐛 Troubleshooting

| Issue                        | Solution                                                     |
| ---------------------------- | ------------------------------------------------------------ |
| **Module not found: @/...**  | Check path alias in `vite.config.ts` and `tsconfig.app.json` |
| **API calls failing**        | Verify `VITE_API_BASE_URL` in `.env`                         |
| **Token not persisting**     | Check localStorage in DevTools → Application                 |
| **Routes not working**       | Ensure `<AppRouter>` is wrapped with Redux `<Provider>`      |
| **Styles not loading**       | Check CSS file imports in components                         |
| **Login redirects to login** | Verify auth token is being stored in localStorage            |

---

## 📦 Project Dependencies

Already installed in `package.json`:

```json
{
  "react": "^19.2.0",
  "react-dom": "^19.2.0",
  "react-router-dom": "^7.13.1",
  "@reduxjs/toolkit": "^2.11.2",
  "react-redux": "^9.2.0",
  "axios": "^1.13.6",
  "typescript": "~5.9.3",
  "vite": "^7.3.1"
}
```

**No additional installations needed!** ✅

---

## 🚀 Deployment

### Build Production Bundle

```bash
npm run build
```

This creates a `dist/` folder ready to deploy.

### Deploy to Vercel

```bash
npm i -g vercel
vercel
```

### Deploy to Netlify

```bash
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```

### Deploy to AWS S3 + CloudFront

```bash
aws s3 sync dist/ s3://your-bucket-name
# Then invalidate CloudFront cache
```

---

## 📖 Documentation Files

- **ARCHITECTURE.md** - Detailed project architecture and patterns
- **QUICK_START.md** - This file

---

## ✨ Best Practices Applied

✅ TypeScript strict mode  
✅ Redux Toolkit with async thunks  
✅ Typed Redux hooks  
✅ Protected routes  
✅ Axios interceptors  
✅ Feature-based structure  
✅ Reusable components  
✅ Responsive design  
✅ Global error handling  
✅ Environment variable management

---

## 🎓 Learning Resources

- [React Docs](https://react.dev)
- [Redux Toolkit Docs](https://redux-toolkit.js.org)
- [React Router Docs](https://reactrouter.com)
- [Vite Guide](https://vitejs.dev)
- [Axios Guide](https://axios-http.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

---

## 💬 Need Help?

1. Check `ARCHITECTURE.md` for detailed patterns
2. Review component examples in `src/components/common/`
3. Check auth implementation in `src/features/auth/`
4. Look at API integration in `src/api/axiosClient.ts`

---

## ✅ Checklist for Next Steps

- [ ] Update API base URL in `.env`
- [ ] Create backend endpoints
- [ ] Test login flow
- [ ] Create additional features following the pattern
- [ ] Add form validation (react-hook-form)
- [ ] Add unit tests (Jest + React Testing Library)
- [ ] Setup CI/CD pipeline
- [ ] Configure production deployment

---

**Happy Coding! 🚀**

Remember: When in doubt, follow the patterns already established in the project!
