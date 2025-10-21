import jwt from 'jsonwebtoken';

const authUser = (req, res, next) => {
    try {
        const { token } = req.cookies;

        if (!token) {
            return res.status(401).json({ success: false, message: 'Unauthorized: No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded?.id) {
            return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token' });
        }

        req.user = { id: decoded.id }; // ✅ Attach user info to `req.user`

        next();
    } catch (error) {
        console.error('Auth Error:', error.message);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Token expired' });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: 'Invalid token' });
        }
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export default authUser;
