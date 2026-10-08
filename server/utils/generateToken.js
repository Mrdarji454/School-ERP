import JWT from "jsonwebtoken";
const generateToken = (_id, role) => {
    return JWT.sign(
        {
            id: _id, role,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "7d"
        }
    );
};
export default generateToken;