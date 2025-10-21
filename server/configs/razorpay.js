import razorpay from 'razorpay';

const razorpayInstance = () => {
    return new razorpay({
    key_id : process.env.KEY_ID,
    key_secret : process.env.KEY_SECRET
})
};


export default razorpayInstance;