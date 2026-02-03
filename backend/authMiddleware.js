const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    // 1. Izvuci token iz Headera (Format: "Bearer eyJhbGci...")
    const token = req.headers.authorization.split(" ")[1];

    // 2. Dekodiraj token koristeći našu tajnu reč
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Dodaj podatke o korisniku u Request objekat (da bi rute znale ko je to)
    req.userData = { 
        userId: decodedToken.userId, 
        email: decodedToken.email,
        roles: decodedToken.roles 
    };

    // 4. Pusti ga dalje
    next();
    
  } catch (error) {
    res.status(401).json({ message: "Autentifikacija nije uspela! Nemaš pristup." });
  }
};