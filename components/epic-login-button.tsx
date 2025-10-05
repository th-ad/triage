"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { LoaderIcon } from "./icons";
import { Button } from "./ui/button";

export function EpicLoginButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleEpicLogin = async () => {
    setIsLoading(true);
    try {
      await authClient.signIn.oauth2({
        providerId: "epic",
      });
    } catch (error) {
      console.error("Epic login failed:", error);
      setIsLoading(false);
    }
  };

  return (
    <Button
      className="relative w-full"
      disabled={isLoading}
      onClick={handleEpicLogin}
      type="button"
      variant="outline"
    >
      {isLoading ? (
        <>
          <span className="opacity-0">Continue with Epic</span>
          <span className="absolute inset-0 flex items-center justify-center">
            <LoaderIcon className="animate-spin" />
          </span>
        </>
      ) : (
        <>
          <svg
            className="mr-2 size-5"
            fill="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <title>Epic</title>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.96V5.5h-2.12v1.19c-1.51.39-2.72 1.39-2.72 2.96 0 1.89 1.56 2.76 3.83 3.29 2.04.47 2.46 1.15 2.46 1.88 0 .54-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.55c.1 1.7 1.36 2.66 2.74 3.05v1.19h2.12v-1.17c1.52-.36 2.73-1.43 2.73-3.01 0-2.42-2.06-3.08-3.83-3.49z" />
          </svg>
          Continue with Epic
        </>
      )}
    </Button>
  );
}
