import React, { useState, useRef } from "react";
import { useHistory } from "react-router-dom";
import { Loader2, Mail, Lock } from "lucide-react";

// core components
import GridContainer from "components/Grid/GridContainer.js";
import GridItem from "components/Grid/GridItem.js";
import Button from "components/CustomButtons/Button.js";
import Card from "components/Card/Card.js";
import CardBody from "components/Card/CardBody.js";
import CardHeader from "components/Card/CardHeader.js";
import CardFooter from "components/Card/CardFooter.js";
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
    }, 700);
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
      <GridContainer className="w-full justify-center">
        <GridItem xs={12} sm={6} md={4}>
          <form onSubmit={handleSubmit}>
            <Card
              login
              className={
                cardAnimaton === "cardHidden"
                  ? "translate-y-[-60px] opacity-0 transition-all duration-700"
                  : "translate-y-0 opacity-100 transition-all duration-700"
              }
            >
              <CardHeader className="text-center" color="rose">
                <h4 className="text-xl font-semibold text-white m-0 py-1">Log in</h4>
              </CardHeader>
              <CardBody>
                <div className="mb-4 w-full relative">
                  <label
                    htmlFor="email"
                    className="mb-1.5 block text-sm font-medium text-muted-foreground"
                  >
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
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 pr-10 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="mb-4 w-full relative">
                  <label
                    htmlFor="password"
                    className="mb-1.5 block text-sm font-medium text-muted-foreground"
                  >
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
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 pr-10 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </CardBody>
              <CardFooter className="justify-center border-t-0">
                <Button color="rose" simple size="lg" block type="submit" disabled={loading}>
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Log in"}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </GridItem>
      </GridContainer>
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
