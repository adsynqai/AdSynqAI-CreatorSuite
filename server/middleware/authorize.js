// middleware/authorize.js
module.exports = (allowedRoles = [], allowedPlans = []) => {
  return (req, res, next) => {
    const user = req.user;

    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    if (
      (allowedRoles.length && !allowedRoles.includes(user.role)) ||
      (allowedPlans.length && !allowedPlans.includes(user.plan))
    ) {
      return res.status(403).json({ error: 'Access denied' });
    }

    next();
  };
};
