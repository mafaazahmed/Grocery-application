import jwt from 'jsonwebtoken';

const authSeller = async (req, res, next) => {
    const {sellerToken} = req.cookies;

    if(!sellerToken) {
        return res.status(401).json({success: false, message: "Unauthorized access"});
    }

    try {
        const decoded = jwt.verify(sellerToken, process.env.JWT_SECRET);
        if(decoded.email === process.env.SELLER_EMAIL) {
            next();
        }else{
             return res.status(403).json({success: false, message: "Forbidden access"});
        }
    } catch (error) {
        console.error("JWT verification failed:", error.message);
        return res.status(401).json({success: false, message: "Invalid token"});
    }
}

export default authSeller;

