# TenantAppFE

Expo frontend for TenantApp.

## Get Started

From the repository root, start MySQL, backend, and Expo web together:

```powershell
.\dev.cmd
```

That starts:

- Backend: `http://localhost:8080`
- Swagger UI: `http://localhost:8080/swagger-ui/index.html`
- Frontend web: `http://localhost:3000`

Press `Ctrl+C` in the script terminal to stop backend and frontend.
You can also run `.\dev.ps1` directly if PowerShell script execution is enabled.
Make sure Docker Desktop is running before using the script.

1. Install dependencies.

   ```bash
   npm install
   ```

2. Configure the backend URL.

   ```bash
   cp .env.example .env
   ```

   For Android emulator, use `http://10.0.2.2:8080`.
   For iOS simulator or web, use `http://localhost:8080`.
   For a physical device, use your computer's LAN IP, for example `http://192.168.1.3:8080`.

3. Start the app.

   ```bash
   npx expo start
   ```

## Scripts

- `npm run start`: start Expo.
- `npm run android`: run Android build.
- `npm run ios`: run iOS build.
- `npm run web`: start Expo web.
- `npm run lint`: run Expo lint.

## Auth

- Login and signup store the backend token bundle through `AuthProvider`.
- Web uses `localStorage`.
- Native uses `expo-secure-store`.
- Logout revokes the refresh token with the backend and clears local storage.
- `refreshSession()` is available from `useAuth()` for token rotation.
