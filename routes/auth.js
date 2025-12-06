const express = require('express');
const passport = require('passport');
const router = express.Router();  

// Login via GitHub
router.get('/login', passport.authenticate('github'));

// Callback do GitHub
router.get(
  '/github/callback',
  passport.authenticate('github', { failureRedirect: '/' }),
  (req, res) => {
    res.send(`Logged in as ${req.user.username}`);
  }
);

// Logout
router.get('/logout', (req, res, next) => {
  req.logout(function (err) {
    if (err) return next(err);

    // Destroy the session
    req.session.destroy((err) => {
      if (err) {
        return next(err);
      }

      // Clear the session cookie explicitly
      res.clearCookie('connect.sid', { path: '/' });

      // Redirect to the home page with a logout message
      res.redirect('/?message=Successfully logged out');
    });
  });
});

module.exports = router; 
