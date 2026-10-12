import JWT from "jsonwebtoken";
const generateToken = (_id, role, tokenVersion = 0) => {
    return JWT.sign(
        {
            id: _id, role, tokenVersion,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "7d"
        }
    );
};
export default generateToken;
