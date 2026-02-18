import React, { useState, useRef } from "react";
import { useHistory } from "react-router-dom";

// @material-ui/core components
import { makeStyles } from "@material-ui/core/styles";
import InputAdornment from "@material-ui/core/InputAdornment";
import Icon from "@material-ui/core/Icon";
import CircularProgress from "@material-ui/core/CircularProgress";

// @material-ui/icons
import Email from "@material-ui/icons/Email";

// core components
import GridContainer from "components/Grid/GridContainer.js";
import GridItem from "components/Grid/GridItem.js";
import CustomInput from "components/CustomInput/CustomInput.js";
import Button from "components/CustomButtons/Button.js";
import Card from "components/Card/Card.js";
import CardBody from "components/Card/CardBody.js";
import CardHeader from "components/Card/CardHeader.js";
import CardFooter from "components/Card/CardFooter.js";
import Snackbar from "components/Snackbar/Snackbar.js";

// auth
import { useAuth } from "context/AuthContext";

import styles from "assets/jss/material-dashboard-pro-react/views/loginPageStyle.js";

const useStyles = makeStyles(styles);

export default function LoginPage() {
  const classes = useStyles();
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
    <div className={classes.container}>
      <GridContainer justify="center">
        <GridItem xs={12} sm={6} md={4}>
          <form onSubmit={handleSubmit}>
            <Card login className={classes[cardAnimaton]}>
              <CardHeader className={`${classes.cardHeader} ${classes.textCenter}`} color="rose">
                <h4 className={classes.cardTitle}>Log in</h4>
              </CardHeader>
              <CardBody>
                <CustomInput
                  labelText="Email"
                  id="email"
                  formControlProps={{
                    fullWidth: true,
                  }}
                  inputProps={{
                    name: "email",
                    endAdornment: (
                      <InputAdornment position="end">
                        <Email className={classes.inputAdornmentIcon} />
                      </InputAdornment>
                    ),
                    type: "email",
                    autoComplete: "email",
                    value: email,
                    onChange: (e) => setEmail(e.target.value),
                    disabled: loading,
                  }}
                />
                <CustomInput
                  labelText="Password"
                  id="password"
                  formControlProps={{
                    fullWidth: true,
                  }}
                  inputProps={{
                    name: "password",
                    endAdornment: (
                      <InputAdornment position="end">
                        <Icon className={classes.inputAdornmentIcon}>lock_outline</Icon>
                      </InputAdornment>
                    ),
                    type: "password",
                    autoComplete: "current-password",
                    value: password,
                    onChange: (e) => setPassword(e.target.value),
                    disabled: loading,
                  }}
                />
              </CardBody>
              <CardFooter className={classes.justifyContentCenter}>
                <Button color="rose" simple size="lg" block type="submit" disabled={loading}>
                  {loading ? <CircularProgress size={24} color="inherit" /> : "Log in"}
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
