import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App.tsx";
import "./index.css";

const clerkPublishableKey =
	import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
	import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!clerkPublishableKey) {
	throw new Error("Missing Clerk publishable key. Set VITE_CLERK_PUBLISHABLE_KEY in .env.");
}

createRoot(document.getElementById("root")!).render(
	<ClerkProvider publishableKey={clerkPublishableKey}>
		<App />
	</ClerkProvider>
);
