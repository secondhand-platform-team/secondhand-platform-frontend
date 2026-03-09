# SecondHand - React Production Architecture

A production-ready React project with TypeScript, Vite, Redux Toolkit, and React Router. Built with enterprise best practices and feature-based architecture.

## 🏗️ Project Architecture

### Folder Structure

```
src/
├── api/                    # API client configuration
│   └── axiosClient.ts      # Axios instance with interceptors
├── app/                    # Redux store setup
│   ├── store.ts            # Redux store configuration
│   └── rootReducer.ts      # Combined reducers
├── assets/                 # Static assets
│   ├── images/
│   └── icons/
├── components/             # Reusable components
│   ├── common/             # Shared UI components
│   │   ├── Button/
│   │   ├── Input/
│   │   └── Modal/
│   └── layout/             # Layout components
│       ├── Navbar/
│       ├── Sidebar/
│       └── Footer/
├── config/                 # Configuration files
│   ├── env.ts              # Environment variables
│   └── routes.ts           # Route definitions
├── features/               # Feature-based modules
│   ├── auth/               # Authentication feature
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── authSlice.ts
│   │   └── authTypes.ts
│   └── user/               # User profile feature
│       ├── api/
│       ├── userSlice.ts
│       └── userTypes.ts
├── hooks/                  # Custom React hooks
│   ├── reduxHooks.ts       # Typed Redux hooks
│   └── useAuth.ts          # Authentication hook
├── layouts/                # Page layouts
│   ├── MainLayout.tsx
│   └── AuthLayout.tsx
├── pages/                  # Page components
│   ├── HomePage.tsx
│   └── NotFoundPage.tsx
├── router/                 # Router configuration
│   ├── AppRouter.tsx
│   └── ProtectedRoute.tsx
├── services/               # Business logic services
│   └── storageService.ts   # Local storage utilities
├── styles/                 # Global styles
│   └── global.css
├── types/                  # TypeScript types
│   ├── apiResponse.ts
│   └── user.ts
├── utils/                  # Utility functions
│   ├── constants.ts
│   └── helpers.ts
├── App.tsx                 # Main app component
└── main.tsx                # Entry point
```

## 🚀 Features

### ✅ Redux Toolkit Integration

- Centralized state management
- Async thunks for API calls
- Typed Redux hooks (`useAppDispatch`, `useAppSelector`)
- Pre-configured store with dev tools

### ✅ Authentication System

- Login/Register with async thunks
- Protected routes
- Token-based authentication
- Persistent auth state
- Automatic logout on 401 errors

### ✅ Axios Client

- Centralized API configuration
- Request/response interceptors
- Authorization header injection
- Error handling with 401 redirect
- Configurable base URL via environment variables

### ✅ Reusable Components

- **Button**: Multiple variants (primary, secondary, danger, success)
- **Input**: Form input with validation
- **Modal**: Dialog component with customizable sizes
- **Navbar**: Navigation with user menu
- **Footer**: Application footer
- **Sidebar**: Side navigation

### ✅ TypeScript Support

- Strict type checking
- Type-safe Redux hooks
- API response types
- Component prop interfaces

### ✅ Responsive Design

- Mobile-first approach
- CSS Grid and Flexbox layouts
- Mobile menu toggle
- Responsive breakpoints

## 📋 Prerequisites

- Node.js 18+
- npm or yarn

## 🔧 Installation & Setup

### 1. Install Dependencies

```bash
npm install
```

All required packages are already in `package.json`:

- @reduxjs/toolkit
- react-redux
- axios
- react-router-dom
- TypeScript
- Vite

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Update `.env.local` with your API endpoint:

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_ENV=development
```

### 3. Run Development Server

```bash
npm run dev
```

The app will start at `http://localhost:5173`

## 📦 Available Scripts

```bash
# Start development server with HMR
npm run dev

# Build for production
npm run build

# Run ESLint
npm run lint

# Preview production build
npm run preview
```

## 🔐 Authentication Flow

### Login Process

1. User submits login form with email/password
2. `login` async thunk dispatches API request
3. Server returns user data and auth token
4. Token stored in localStorage and Redux state
5. Protected routes become accessible

### Protected Routes

```tsx
<ProtectedRoute>
  <MainLayout>
    <ProtectedPage />
  </MainLayout>
</ProtectedRoute>
```

### Token Persistence

- Tokens stored in localStorage
- Automatically added to requests via axios interceptor
- Cleared on logout or 401 response

## 🎣 Usage Examples

### Using Redux Hooks

```tsx
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { login } from '@/features/auth/authSlice';

function LoginForm() {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);

  const handleSubmit = async (credentials) => {
    try {
      await dispatch(login(credentials)).unwrap();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    // Form JSX
  );
}
```

### Using Custom Hooks

```tsx
import { useAuth } from "@/hooks/useAuth";

function ProfilePage() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" />;

  return (
    <div>
      <h1>Welcome, {user?.firstName}</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Reusable Components

```tsx
import Button from "@/components/common/Button/Button";
import Input from "@/components/common/Input/Input";
import Modal from "@/components/common/Modal/Modal";

function Example() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Input
        type="email"
        label="Email"
        placeholder="Enter email"
        error="Invalid email"
      />

      <Button
        variant="primary"
        size="large"
        onClick={() => setIsModalOpen(true)}
      >
        Open Modal
      </Button>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Confirmation"
        size="medium"
      >
        <p>Are you sure?</p>
        <div className="modal-footer">
          <Button variant="secondary">Cancel</Button>
          <Button variant="primary">Confirm</Button>
        </div>
      </Modal>
    </>
  );
}
```

### API Integration

```tsx
import axiosClient from "@/api/axiosClient";
import { ApiResponse } from "@/types/apiResponse";

async function fetchProducts() {
  try {
    const response = await axiosClient.get<ApiResponse>("/products");
    console.log(response.data);
  } catch (error) {
    console.error("Failed to fetch products:", error);
  }
}
```

## 🛠️ Best Practices Implemented

### 1. **Feature-Based Architecture**

Code organized by feature rather than file type, making it scalable and maintainable.

### 2. **Type Safety**

- 100% TypeScript with strict mode enabled
- Type-safe API responses
- Type-safe Redux hooks

### 3. **State Management**

- Redux Toolkit for scalable state
- Async thunks for side effects
- Action creators with TypeScript support

### 4. **API Layer**

- Centralized axios configuration
- Request/response interceptors
- Error handling strategies

### 5. **Component Design**

- Functional components with hooks
- Composition over inheritance
- Props validation with TypeScript

### 6. **Routing**

- Protected route component
- Lazy loading support (ready)
- Route-based code splitting

### 7. **Styling**

- CSS Modules ready
- CSS Custom Properties support
- BEM naming convention (optional)

### 8. **Performance**

- Vite for fast builds
- HMR (Hot Module Replacement)
- Tree-shaking support
- Code splitting ready

## 🚢 Production Deployment

### Build Production Bundle

```bash
npm run build
```

Output files in `dist/` directory

### Environment Variables for Production

Create `.env.production`:

```env
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_APP_ENV=production
```

### Deploy to Vercel (Example)

```bash
npm i -g vercel
vercel
```

### Deploy to Netlify (Example)

```bash
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```

## 📚 Common Patterns

### Adding New Feature

1. Create `src/features/myFeature/` directory
2. Add types: `myFeatureTypes.ts`
3. Add API: `api/myFeatureApi.ts`
4. Create slice: `myFeatureSlice.ts`
5. Add selector hooks in `reduxHooks.ts`

### Creating New API Endpoint

```tsx
// features/products/api/productsApi.ts
export const productsApi = {
  getAll: async (): Promise<ApiResponse<Product[]>> => {
    const response = await axiosClient.get("/products");
    return response.data;
  },
};

// features/products/productSlice.ts
export const getProducts = createAsyncThunk(
  "products/getAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await productsApi.getAll();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message);
    }
  },
);
```

### Adding Protected Feature Route

```tsx
// In src/router/AppRouter.tsx
<Route
  path={ROUTES.MY_PRODUCTS}
  element={
    <ProtectedRoute>
      <MainLayout>
        <MyProductsPage />
      </MainLayout>
    </ProtectedRoute>
  }
/>
```

## 🐛 Troubleshooting

### Import Path Errors

Ensure `tsconfig.app.json` and `vite.config.ts` have path aliases:

```json
// tsconfig.app.json
"paths": {
  "@/*": ["src/*"]
}
```

### Redux DevTools Not Showing

Redux DevTools are only enabled in development. Check `app/store.ts`:

```tsx
devTools: import.meta.env.DEV;
```

### CORS Issues

Update `.env.local` with correct API URL and ensure backend has CORS enabled.

### 401 Unauthorized Loops

Check `api/axiosClient.ts` response interceptor. Ensure logout clears localStorage.

## 📖 Useful Resources

- [React Documentation](https://react.dev)
- [Redux Toolkit Documentation](https://redux-toolkit.js.org)
- [Vite Documentation](https://vitejs.dev)
- [React Router Documentation](https://reactrouter.com)
- [Axios Documentation](https://axios-http.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

## 📄 License

MIT License - Feel free to use this template for your projects.

## 💡 Tips for Scaling

1. **Code Splitting**: Use React.lazy() for route-based code splitting
2. **Error Boundaries**: Implement error boundaries for error handling
3. **Performance Monitoring**: Add Sentry or similar
4. **State Persistence**: Extend redux-persist for full state hydration
5. **Testing**: Add Jest and React Testing Library
6. **API Caching**: Implement RTK Query for automatic caching
7. **Form Handling**: Consider react-hook-form for complex forms
8. **Validation**: Add Yup or Zod for schema validation

---

**Happy Coding! 🚀**
