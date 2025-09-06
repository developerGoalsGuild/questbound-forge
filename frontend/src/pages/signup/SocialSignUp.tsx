import React, { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { createUser } from '@/lib/api';

interface SocialSignUpProps {
  email: string;
}

const SocialSignUp: React.FC<SocialSignUpProps> = ({ email }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);
    setLoading(true);
    try {
      await createUser({
        email,
        status: 'email confirmation pending',
      });
      setSuccessMessage(t.signup.social.successMessage);
    } catch (error) {
      setErrorMessage(t.signup.social.errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-semibold mb-4">{t.signup.social.title}</h2>
      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-4">
          <label htmlFor="email" className="block font-medium mb-1">
            {t.signup.social.email}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            readOnly
            className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
            aria-readonly="true"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? t.common.loading : t.signup.social.submit}
        </button>
      </form>

      {successMessage && (
        <p className="mt-4 text-green-600" role="alert">
          {successMessage}
        </p>
      )}
      {errorMessage && (
        <p className="mt-4 text-red-600" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
};

export default SocialSignUp;
