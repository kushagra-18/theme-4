"use client";

import { useState } from 'react';

const NewsletterForm = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    // The API client isn't available on the client side by default
    // We would need a client-side instance or an API route handler.
    // For now, this is a placeholder for the logic.
    try {
      // In a real app, you'd call a serverless function or API route here
      // e.g., await fetch('/api/subscribe', { method: 'POST', body: JSON.stringify({ email }) });
      console.log(`Subscribing with ${email}`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network request

      setMessage('Thanks for subscribing!');
      setEmail('');
    } catch (err) {
      setError('Failed to subscribe. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="newsletter" className="bg-base-200 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Subscribe to our newsletter
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-base-content/70">
                Stay up to date with the latest articles and news.
            </p>
            <form onSubmit={subscribe} className="mt-8 sm:flex sm:justify-center">
                <div className="form-control w-full max-w-xs mx-auto">
                    <label className="label" htmlFor="email-address">
                        <span className="label-text">Email address</span>
                    </label>
                    <div className="join">
                        <input
                            id="email-address"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            className="input input-bordered join-item w-full"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                        />
                        <button type="submit" className="btn btn-primary join-item" disabled={loading}>
                            {loading ? <span className="loading loading-spinner"></span> : 'Subscribe'}
                        </button>
                    </div>
                </div>
            </form>
            {message && <p className="mt-4 text-success">{message}</p>}
            {error && <p className="mt-4 text-error">{error}</p>}
        </div>
    </div>
  );
};

export default NewsletterForm;
