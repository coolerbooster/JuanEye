// services/config.ts
export const API_URL =
    // for Android emulators you often use 10.0.2.2, adjust for your setup
    __DEV__
        ? "http://192.168.50.48:3001"
        : "https://api.yourdomain.com";
