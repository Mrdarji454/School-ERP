export const logout = async (req, res) => {
    console.log("logout API");
    res.status(200).json({
        message: "logged out sucessfully"
    });
}