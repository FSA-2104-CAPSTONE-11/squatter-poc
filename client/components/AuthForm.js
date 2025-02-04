import React from "react";
import {useSelector, useDispatch} from "react-redux";
import {authenticate} from "../store";
import {Redirect} from "react-router-dom";
import {
  Avatar,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Link,
  Grid,
  Box,
  Typography,
  Container,
  makeStyles,
} from "@material-ui/core";
import LockOutlinedIcon from "@material-ui/icons/LockOutlined";

const useStyles = makeStyles((theme) => ({
  main: {
    backgroundColor: "#ffffff",
    border: "1px solid #d3d3d3",
    marginTop: theme.spacing(2),
  },
  paper: {
    marginTop: theme.spacing(8),
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: theme.palette.secondary.main,
  },
  form: {
    width: "100%",
    marginTop: theme.spacing(1),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
  link: {
    color: "#156064",
  },
  cssLabel: {
    color: `${theme.palette.primary.dark} !important`,
  },
  cssOutlinedInput: {
    "&$cssFocused $notchedOutline": {
      borderColor: `${theme.palette.primary.dark} !important`,
    },
  },
  cssFocused: {},
  notchedOutline: {
    borderWidth: "1px",
    borderColor: "green !important",
  },
}));

const AuthForm = (props) => {
  const classes = useStyles();
  const isLoggedIn = useSelector((state) => !!state.auth.id);
  const error = useSelector((state) => state.auth.error);
  const dispatch = useDispatch();
  const {name} = props;
  let displayName;
  if (name === "login") {
    displayName = "Login";
  } else if (name === "signup") {
    displayName = "Sign Up";
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    const formName = event.currentTarget.name;
    const username = event.currentTarget.username.value;
    const password = event.currentTarget.password.value;
    if (name === "signup") {
      const email = event.currentTarget.email.value;
      dispatch(authenticate({username, password, formName, email}));
    } else {
      dispatch(authenticate({username, password, formName}));
    }
  };

  return (
    <div>
      {isLoggedIn ? (
        <Redirect to="/home" />
      ) : (
        <div>
          <Container component="main" maxWidth="xs" className={classes.main}>
            <div className={classes.paper}>
              <Avatar className={classes.avatar}>
                <LockOutlinedIcon />
              </Avatar>
              <Typography component="h1" variant="h5">
                {displayName}
              </Typography>
              <form
                className={classes.form}
                name={name}
                noValidate
                onSubmit={handleSubmit}
              >
                <TextField
                  variant="outlined"
                  margin="normal"
                  required
                  fullWidth
                  id="username"
                  label="Username"
                  name="username"
                  autoComplete="username"
                  autoFocus
                  InputLabelProps={{
                    style: {color: "#156064"},
                    classes: {
                      root: classes.cssLabel,
                      focused: classes.cssFocused,
                    },
                  }}
                  InputProps={{
                    classes: {
                      root: classes.cssOutlinedInput,
                      focused: classes.cssFocused,
                      notchedOutline: classes.notchedOutline,
                    },
                  }}
                />
                {name === "signup" ? (
                  <TextField
                    variant="outlined"
                    margin="normal"
                    required
                    fullWidth
                    id="email"
                    label="Email Address"
                    name="email"
                    autoComplete="email"
                    InputLabelProps={{
                      style: {color: "#156064"},
                      classes: {
                        root: classes.cssLabel,
                        focused: classes.cssFocused,
                      },
                    }}
                    InputProps={{
                      classes: {
                        root: classes.cssOutlinedInput,
                        focused: classes.cssFocused,
                        notchedOutline: classes.notchedOutline,
                      },
                    }}
                  />
                ) : (
                  <div></div>
                )}
                <TextField
                  variant="outlined"
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type="password"
                  id="password"
                  autoComplete="current-password"
                  InputLabelProps={{
                    style: {color: "#156064"},
                    classes: {
                      root: classes.cssLabel,
                      focused: classes.cssFocused,
                    },
                  }}
                  InputProps={{
                    classes: {
                      root: classes.cssOutlinedInput,
                      focused: classes.cssFocused,
                      notchedOutline: classes.notchedOutline,
                    },
                  }}
                />
                <FormControlLabel
                  control={<Checkbox value="remember" color="primary" />}
                  label="Remember me"
                />

                {error && error.response && <div> {error.response.data} </div>}

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  color="primary"
                  className={classes.submit}
                >
                  {displayName}
                </Button>
                <Grid container>
                  <Grid item xs></Grid>
                  <Grid item>
                    {name === "login" ? (
                      <Link
                        href="/signup"
                        variant="body2"
                        className={classes.link}
                      >
                        {"Don't have an account? Sign Up"}
                      </Link>
                    ) : (
                      <Link
                        href="/login"
                        variant="body2"
                        className={classes.link}
                      >
                        {"Already have an account? Login"}
                      </Link>
                    )}
                  </Grid>
                </Grid>
              </form>
            </div>
            <Box mt={8}>
              <Typography variant="body2" color="textSecondary" align="center">
                {"Copyright © "}
                <Link color="inherit" href="/">
                  FormFit
                </Link>{" "}
                {new Date().getFullYear()}
                {"."}
              </Typography>
            </Box>
          </Container>
        </div>
      )}
    </div>
  );
};

export default AuthForm;
