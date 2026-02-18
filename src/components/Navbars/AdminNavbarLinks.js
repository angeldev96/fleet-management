import React from "react";
import classNames from "classnames";
import PropTypes from "prop-types";
import { useHistory } from "react-router-dom";

// @material-ui/core components
import { makeStyles } from "@material-ui/core/styles";
import MenuItem from "@material-ui/core/MenuItem";
import MenuList from "@material-ui/core/MenuList";
import ClickAwayListener from "@material-ui/core/ClickAwayListener";
import Paper from "@material-ui/core/Paper";
import Grow from "@material-ui/core/Grow";
import Popper from "@material-ui/core/Popper";
import Divider from "@material-ui/core/Divider";

// @material-ui/icons
import ExpandMore from "@material-ui/icons/ExpandMore";
import Person from "@material-ui/icons/Person";

// core components
import Button from "components/CustomButtons/Button.js";

// auth
import { useAuth } from "context/AuthContext";

import styles from "assets/jss/material-dashboard-pro-react/components/adminNavbarLinksStyle.js";

const useStyles = makeStyles(styles);

export default function HeaderLinks(props) {
  const history = useHistory();
  const { user, userProfile, signOut } = useAuth();
  const [openProfile, setOpenProfile] = React.useState(null);

  const handleClickProfile = (event) => {
    if (openProfile && openProfile.contains(event.target)) {
      setOpenProfile(null);
    } else {
      setOpenProfile(event.currentTarget);
    }
  };
  const handleCloseProfile = () => {
    setOpenProfile(null);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      history.push("/auth/login-page");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const classes = useStyles();
  const { rtlActive } = props;
  const dropdownItem = classNames(classes.dropdownItem, classes.primaryHover, {
    [classes.dropdownItemRTL]: rtlActive,
  });
  const wrapper = classNames({
    [classes.wrapperRTL]: rtlActive,
  });
  const managerClasses = classNames({
    [classes.managerClasses]: true,
  });
  return (
    <div className={wrapper} style={{ display: "flex", alignItems: "center" }}>
      <div className={managerClasses}>
        <Button
          color="transparent"
          aria-label="Person"
          aria-owns={openProfile ? "profile-menu-list" : null}
          aria-haspopup="true"
          onClick={handleClickProfile}
          className={rtlActive ? classes.buttonLinkRTL : classes.buttonLink}
          style={{
            display: "flex",
            alignItems: "center",
            textTransform: "none",
          }}
        >
          <div
            style={{
              width: "35px",
              height: "35px",
              borderRadius: "50%",
              backgroundColor: "#3E4D6C",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: "10px",
            }}
          >
            <Person style={{ color: "#fff", fontSize: "22px" }} />
          </div>
          <span style={{ fontSize: "14px", fontWeight: "300", color: "#333" }}>{userProfile?.full_name || "User"}</span>
          <ExpandMore style={{ marginLeft: "5px", fontSize: "20px", color: "#999" }} />
        </Button>
        <Popper
          open={Boolean(openProfile)}
          anchorEl={openProfile}
          transition
          disablePortal
          placement="bottom"
          className={classNames({
            [classes.popperClose]: !openProfile,
            [classes.popperResponsive]: true,
            [classes.popperNav]: true,
          })}
        >
          {({ TransitionProps }) => (
            <Grow {...TransitionProps} id="profile-menu-list" style={{ transformOrigin: "0 0 0" }}>
              <Paper className={classes.dropdown}>
                <ClickAwayListener onClickAway={handleCloseProfile}>
                  <MenuList role="menu">
                    {user && (
                      <MenuItem className={dropdownItem} disabled>
                        {user.email}
                      </MenuItem>
                    )}
                    <Divider light />
                    <MenuItem onClick={handleCloseProfile} className={dropdownItem}>
                      Profile
                    </MenuItem>
                    <MenuItem onClick={handleCloseProfile} className={dropdownItem}>
                      Settings
                    </MenuItem>
                    <Divider light />
                    <MenuItem onClick={handleLogout} className={dropdownItem}>
                      Log out
                    </MenuItem>
                  </MenuList>
                </ClickAwayListener>
              </Paper>
            </Grow>
          )}
        </Popper>
      </div>
    </div>
  );
}

HeaderLinks.propTypes = {
  rtlActive: PropTypes.bool,
};
