import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

type Status = "pending" | "success" | "error";

const ConfirmEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token: string | null = searchParams.get("token");
  const email: string | null = searchParams.get("email");

  const [status, setStatus] = useState<Status>("pending");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Verification token is missing.");
      return;
    }

    const confirmEmail = async (): Promise<void> => {
      try {
        const response = await fetch("/api/confirm-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.detail || "Verification failed.");
        }
        setStatus("success");
        setMessage("Your email has been verified successfully.");
      } catch (error) {
        if (error instanceof Error) {
          setStatus("error");
          setMessage(error.message);
        } else {
          setStatus("error");
          setMessage("An unknown error occurred.");
        }
      }
    };

    confirmEmail();
  }, [token]);

  return (
    <div className="max-w-md mx-auto mt-20 p-6 border rounded shadow">
      {status === "pending" && <p>Verifying your email...</p>}
      {status === "success" && <p className="text-green-600">{message}</p>}
      {status === "error" && <p className="text-red-600">{message}</p>}
    </div>
  );
};

export default ConfirmEmail;
