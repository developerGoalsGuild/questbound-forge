import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

const ConfirmEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const [status, setStatus] = useState("pending"); // pending, success, error
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Verification token is missing.");
      return;
    }

    const confirmEmail = async () => {
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
        setStatus("error");
        setMessage(error.message);
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
