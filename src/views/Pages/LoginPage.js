import React, { useState, useRef } from "react";
import { useHistory } from "react-router-dom";
import { Loader2, Mail, Lock, Shield } from "lucide-react";

// core components
import Snackbar from "components/Snackbar/Snackbar.js";

// auth
import { useAuth } from "context/AuthContext";

export default function LoginPage() {
  const history = useHistory();
  const { signIn } = useAuth();
  const isMounted = useRef(true);

  const [cardAnimaton, setCardAnimation] = useState("cardHidden");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showError, setShowError] = useState(false);

  React.useEffect(() => {
    isMounted.current = true;
    let id = setTimeout(function () {
      if (isMounted.current) {
        setCardAnimation("");
      }
    }, 100);
    return function cleanup() {
      isMounted.current = false;
      window.clearTimeout(id);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Please enter email and password");
      setShowError(true);
      return;
    }

    setLoading(true);
    setError("");

    try {
      await signIn(email, password);
      history.push("/admin/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      if (isMounted.current) {
        setError(err.message || "Invalid email or password");
        setShowError(true);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm mx-auto">
        <form onSubmit={handleSubmit}>
          <div
            className={
              cardAnimaton === "cardHidden"
                ? "translate-y-8 scale-[0.98] opacity-0 transition-all duration-500 ease-out"
                : "translate-y-0 scale-100 opacity-100 transition-all duration-500 ease-out"
            }
          >
            <div className="rounded-2xl bg-white/95 backdrop-blur-xl shadow-(--shadow-elevated) border border-white/20 overflow-hidden">
              {/* Header */}
              <div className="pt-8 pb-2 px-8 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-foreground text-background mb-4">
                  <Shield className="h-5 w-5" />
                </div>
                <h1 className="text-lg font-semibold text-foreground tracking-[-0.02em] m-0">Welcome back</h1>
                <p className="text-sm text-muted-foreground/70 mt-1 m-0">Sign in to your account</p>
              </div>

              {/* Body */}
              <div className="px-8 py-6">
                <div className="mb-5 w-full">
                  <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-muted-foreground/80">
                    Email
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      className="flex h-11 w-full rounded-xl border border-border/60 bg-background px-3.5 pr-10 text-sm transition-all duration-150 focus:outline-none focus:ring-[3px] focus:ring-primary/10 focus:border-primary/40 placeholder:text-muted-foreground/50 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="you@example.com"
                    />
                    <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                  </div>
                </div>
                <div className="mb-6 w-full">
                  <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-muted-foreground/80">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      className="flex h-11 w-full rounded-xl border border-border/60 bg-background px-3.5 pr-10 text-sm transition-all duration-150 focus:outline-none focus:ring-[3px] focus:ring-primary/10 focus:border-primary/40 placeholder:text-muted-foreground/50 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Enter your password"
                    />
                    <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl bg-foreground text-background text-sm font-medium transition-all duration-150 hover:bg-foreground/90 disabled:pointer-events-none disabled:opacity-50 shadow-sm"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Sign in"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
      <Snackbar
        place="tc"
        color="danger"
        message={error}
        open={showError}
        closeNotification={() => setShowError(false)}
        close
      />
    </div>
  );
}
