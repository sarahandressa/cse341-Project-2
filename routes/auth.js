

const express = require('express');
const passport = require('passport');
const router = express.Router();  


router.get('/login', passport.authenticate('github'));


router.get(
  '/github/callback',
  passport.authenticate('github', { failureRedirect: '/' }),
  (req, res) => {
   
    res.send(`Logged in as ${req.user.username}`);
  }
);


router.get('/logout', (req, res, next) => {
  req.logout(function (err) {
    if (err) return next(err);

    
    req.session.destroy((err) => {
      if (err) {
        return next(err);
      }

    
      res.clearCookie('connect.sid', { path: '/' });

      
      res.redirect('/?message=Successfully logged out');
    });
  });
});

module.exports = router;